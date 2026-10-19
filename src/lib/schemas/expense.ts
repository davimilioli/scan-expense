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

export const expenseItemSchema = z.object({
  description: z.string().min(1).describe("Nome do produto ou serviço"),
  quantity: z.number().positive().describe("Quantidade comprada"),
  unitPrice: z.number().nonnegative().describe("Valor unitário em reais, número decimal"),
  total: z.number().nonnegative().describe("Valor total da linha em reais, número decimal"),
});

export const expenseSchema = z.object({
  establishment: z.string().min(1).describe("Nome do estabelecimento ou do recebedor"),
  date: z.iso.date().describe("Data da compra no formato YYYY-MM-DD"),
  category: z.enum(categories).describe("Categoria que melhor descreve a despesa"),
  totalAmount: z.number().nonnegative().describe("Valor total pago em reais, número decimal"),
  items: z
    .array(expenseItemSchema)
    .describe("Itens discriminados; lista vazia quando não houver itens, como em comprovantes Pix"),
});

export type Category = (typeof categories)[number];
export type ExpenseItem = z.infer<typeof expenseItemSchema>;
export type Expense = z.infer<typeof expenseSchema>;

export interface HistoryEntry {
  id: string;
  createdAt: string;
  thumbnail: string;
  expense: Expense;
}
