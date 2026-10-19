import { formatCurrency, formatDate } from "@/lib/format";
import type { Expense } from "@/lib/schemas/expense";

export function toJson(expense: Expense): string {
  return JSON.stringify(expense, null, 2);
}

export function toText(expense: Expense): string {
  const summary = [
    `Estabelecimento: ${expense.establishment}`,
    `Data: ${formatDate(expense.date)}`,
    `Categoria: ${expense.category}`,
    `Valor total: ${formatCurrency(expense.totalAmount)}`,
  ];

  if (expense.items.length === 0) return summary.join("\n");

  const items = expense.items.map(
    (item) =>
      `- ${item.quantity} × ${item.description} (${formatCurrency(item.unitPrice)} cada): ${formatCurrency(item.total)}`,
  );

  return [...summary, "", "Itens:", ...items].join("\n");
}
