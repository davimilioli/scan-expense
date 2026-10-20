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

export const expenseSchema = z.object({
  establishment: z
    .string()
    .min(1, "Informe o estabelecimento")
    .describe("Nome do estabelecimento ou do recebedor"),
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
    .describe("Itens discriminados; lista vazia quando não houver itens, como em comprovantes Pix"),
});

export const expenseItemFormSchema = expenseItemSchema.refine(
  (item) => item.unit === "kg" || Number.isInteger(item.quantity),
  { message: "Use um número inteiro para itens vendidos por unidade", path: ["quantity"] },
);

export const expenseFormSchema = expenseSchema.extend({
  items: z.array(expenseItemFormSchema),
});

export type Category = (typeof categories)[number];
export type ItemUnit = (typeof itemUnits)[number];
export type ExpenseItem = z.infer<typeof expenseItemSchema>;
export type Expense = z.infer<typeof expenseSchema>;

export interface HistoryEntry {
  id: string;
  createdAt: string;
  thumbnail: string;
  expense: Expense;
}
