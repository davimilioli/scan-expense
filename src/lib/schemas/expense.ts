import { z } from "zod";

export const categories = [
  "Alimentação",
  "Transporte",
  "Saúde",
  "Moradia",
  "Lazer",
  "Compras",
  "Serviços",
  "Educação",
  "Outros",
] as const;

export const itemUnits = ["un", "kg"] as const;

export const expenseItemSchema = z.object({
  description: z.string().min(1, "Informe a descrição").describe("Nome do produto ou serviço"),
  unit: z
    .enum(itemUnits, "Escolha a unidade")
    .describe(
      "Unidade de venda: 'kg' para itens vendidos por peso ou volume (kg, g, L), 'un' para itens vendidos por unidade",
    ),
  quantity: z
    .number("Informe a quantidade")
    .positive("A quantidade deve ser maior que zero")
    .describe("Quantidade comprada"),
  unitPrice: z
    .number("Informe o valor")
    .nonnegative("O valor não pode ser negativo")
    .describe("Valor unitário em reais, número decimal"),
  total: z
    .number("Informe o total")
    .nonnegative("O total não pode ser negativo")
    .describe("Valor total da linha em reais, número decimal"),
});

export const documentTypes = ["receipt", "pix"] as const;

const pixPartySchema = z.object({
  name: z.string().describe("Nome da pessoa ou empresa"),
  document: z.string().describe("CPF ou CNPJ como aparece no comprovante (pode estar mascarado); vazio se não houver"),
  institution: z.string().describe("Banco ou instituição de pagamento; vazio se não houver"),
});

export const pixSchema = z.object({
  sender: pixPartySchema.describe("Quem enviou o Pix (pagador)"),
  receiver: pixPartySchema.describe("Quem recebeu o Pix (recebedor)"),
  pixKey: z.string().describe("Chave Pix usada; vazio se não houver"),
  transactionId: z.string().describe("ID da transação (ex: E2E); vazio se não houver"),
  time: z.string().describe("Horário da transação no formato HH:MM; vazio se não houver"),
});

export const expenseSchema = z.object({
  documentType: z
    .enum(documentTypes)
    .describe("'receipt' para recibos, notas e cupons com itens; 'pix' para comprovantes de Pix"),
  pix: pixSchema.nullable().describe("Dados do comprovante Pix; null quando documentType for 'receipt'"),
  establishment: z
    .string()
    .min(1, "Informe o estabelecimento")
    .describe("Nome do estabelecimento; em comprovantes Pix, o nome do recebedor"),
  date: z.iso.date("Informe uma data válida").describe("Data da compra no formato YYYY-MM-DD"),
  category: z
    .enum(categories, "Escolha uma categoria")
    .describe("Categoria que melhor descreve a despesa"),
  totalAmount: z
    .number("Informe o valor total")
    .nonnegative("O valor não pode ser negativo")
    .describe("Valor total pago em reais, número decimal"),
  items: z
    .array(expenseItemSchema)
    .describe("Itens discriminados, cada um com nome e valor; lista vazia em comprovantes Pix"),
});

export const expenseItemFormSchema = expenseItemSchema.refine(
  (item) => item.unit === "kg" || Number.isInteger(item.quantity),
  { message: "Use um número inteiro para itens vendidos por unidade", path: ["quantity"] },
);

const pixPartyFormSchema = pixPartySchema.extend({ name: z.string().min(1, "Informe o nome") });

export const expenseFormSchema = expenseSchema.extend({
  items: z.array(expenseItemFormSchema),
  pix: pixSchema.extend({ sender: pixPartyFormSchema, receiver: pixPartyFormSchema }).nullable(),
});

export type Category = (typeof categories)[number];
export type ItemUnit = (typeof itemUnits)[number];
export type DocumentType = (typeof documentTypes)[number];
export type PixDetails = z.infer<typeof pixSchema>;
export type ExpenseItem = z.infer<typeof expenseItemSchema>;
export type Expense = z.infer<typeof expenseSchema>;

export interface HistoryEntry {
  id: string;
  createdAt: string;
  thumbnail: string;
  expense: Expense;
}
