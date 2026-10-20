"use server";

import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { z } from "zod";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/image";
import { expenseSchema, type Expense } from "@/lib/schemas/expense";

const MODEL_ID = "gemini-flash-lite-latest";
const MAX_IMAGE_SIZE_IN_BYTES = 5 * 1024 * 1024;

const SYSTEM_PROMPT = `Você extrai dados de recibos, notas fiscais e comprovantes Pix brasileiros.
Regras:
- Datas no formato YYYY-MM-DD.
- Valores em reais como número decimal (ex: 12.5), sem símbolo de moeda.
- Escolha a categoria mais próxima da lista; na dúvida, use "Outros".
- Comprovantes Pix e recibos sem itens discriminados têm a lista de itens vazia.
- Se a imagem não for um recibo, nota fiscal ou comprovante de pagamento, responda isReceipt false e expense null.`;

const extractionSchema = z.object({
  isReceipt: z
    .boolean()
    .describe("true se a imagem for um recibo, nota fiscal ou comprovante de pagamento"),
  expense: expenseSchema.nullable().describe("Dados extraídos; null quando não for um recibo"),
});

export type ExtractExpenseResult =
  | { ok: true; data: Expense }
  | { ok: false; error: string };

export async function extractExpense(formData: FormData): Promise<ExtractExpenseResult> {
  const image = formData.get("image");

  if (!(image instanceof File) || !ACCEPTED_IMAGE_TYPES.includes(image.type)) {
    return { ok: false, error: "Envie uma imagem JPG, PNG ou WEBP." };
  }
  if (image.size > MAX_IMAGE_SIZE_IN_BYTES) {
    return { ok: false, error: "A imagem é grande demais. Tente uma foto menor." };
  }

  try {
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

    if (!output.isReceipt || !output.expense) {
      return { ok: false, error: "Não encontramos um recibo ou comprovante nesta imagem." };
    }

    return { ok: true, data: output.expense };
  } catch (error) {
    console.error("Falha ao extrair os dados do recibo:", error);
    return { ok: false, error: "Não foi possível extrair os dados. Tente novamente." };
  }
}
