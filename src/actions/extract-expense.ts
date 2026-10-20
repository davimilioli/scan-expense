"use server";

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/image";
import { consumeExtraction, MAX_EXTRACTIONS, readRemainingExtractions } from "@/lib/rate-limit";
import { expenseSchema, type Expense } from "@/lib/schemas/expense";

const MODEL_ID = "gemini-flash-lite-latest";
const MAX_IMAGE_SIZE_IN_BYTES = 5 * 1024 * 1024;

const NOT_A_RECEIPT_ERROR =
  "Não encontramos um recibo com itens ou um comprovante Pix nesta imagem. Envie a foto de um recibo, nota fiscal, cupom ou comprovante Pix.";

const SYSTEM_PROMPT = `Você extrai dados de documentos de despesa brasileiros. Aceite somente dois tipos:
1. documentType "receipt": recibos, notas fiscais ou cupons que listem pelo menos um item com nome e valor.
   Um recibo de serviço com a descrição do serviço e o valor conta como um item.
2. documentType "pix": comprovantes de Pix com valor e recebedor.
Recuse (isReceipt false e expense null) qualquer outra imagem, por exemplo:
- transferências TED/DOC, boletos ou extratos bancários;
- recibos que mostrem apenas o valor total, sem o nome dos itens;
- fotos de pessoas, lugares, objetos, telas ou documentos que não sejam desses dois tipos.
Regras gerais:
- Datas no formato YYYY-MM-DD.
- Valores em reais como número decimal (ex: 12.5), sem símbolo de moeda.
- Escolha a categoria mais próxima da lista; na dúvida, use "Outros".
Regras para "receipt":
- pix null.
- Em cada item, use unit "kg" para itens vendidos por peso ou volume (kg, g, L) e unit "un" para itens vendidos por unidade; itens "un" têm quantidade inteira.
- Se o item não mostrar quantidade, use quantity 1, unit "un" e unitPrice igual ao valor do item.
Regras para "pix":
- items vazio, establishment com o nome do recebedor e totalAmount com o valor transferido.
- Preencha pix com pagador (sender), recebedor (receiver), chave Pix, ID da transação e horário; use texto vazio para o que não aparecer.
- A categoria segue o que o recebedor indica (ex: farmácia é "Saúde").`;

const extractionSchema = z.object({
  isReceipt: z
    .boolean()
    .describe("true somente se a imagem for um recibo com itens ou um comprovante Pix"),
  expense: expenseSchema.nullable().describe("Dados extraídos; null quando a imagem for recusada"),
});

function isAcceptedDocument(expense: Expense): boolean {
  if (expense.documentType === "pix") {
    return Boolean(expense.pix?.receiver.name) && expense.totalAmount > 0;
  }
  return expense.items.length > 0;
}

export type ExtractExpenseResult =
  | { ok: true; data: Expense; remainingExtractions: number }
  | { ok: false; error: string; remainingExtractions?: number };

export async function getRemainingExtractions(): Promise<number> {
  return readRemainingExtractions();
}

export async function extractExpense(formData: FormData): Promise<ExtractExpenseResult> {
  const image = formData.get("image");

  if (!(image instanceof File) || !ACCEPTED_IMAGE_TYPES.includes(image.type)) {
    return { ok: false, error: "Envie uma imagem JPG, PNG ou WEBP." };
  }
  if (image.size > MAX_IMAGE_SIZE_IN_BYTES) {
    return { ok: false, error: "A imagem é grande demais. Tente uma foto menor." };
  }

  let remainingExtractions: number | undefined;

  try {
    const allowance = await consumeExtraction();
    remainingExtractions = allowance.remainingExtractions;

    if (!allowance.isAllowed) {
      return {
        ok: false,
        error: `Você atingiu o limite de ${MAX_EXTRACTIONS} extrações.`,
        remainingExtractions,
      };
    }

    const { output } = await generateText({
      model: google(MODEL_ID),
      system: SYSTEM_PROMPT,
      output: Output.object({ schema: extractionSchema }),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Extraia os dados desta imagem." },
            {
              type: "file",
              mediaType: image.type,
              data: new Uint8Array(await image.arrayBuffer()),
            },
          ],
        },
      ],
    });

    if (!output.isReceipt || !output.expense || !isAcceptedDocument(output.expense)) {
      return { ok: false, error: NOT_A_RECEIPT_ERROR, remainingExtractions };
    }

    const expense = output.expense.documentType === "pix"
      ? { ...output.expense, items: [] }
      : { ...output.expense, pix: null };

    return { ok: true, data: expense, remainingExtractions };
  } catch (error) {
    console.error("Falha ao extrair os dados do recibo:", error);
    return {
      ok: false,
      error: "Não foi possível extrair os dados. Tente novamente.",
      remainingExtractions,
    };
  }
}
