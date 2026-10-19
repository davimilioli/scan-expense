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

// Excel em pt-BR espera ";" como separador e vírgula decimal; o BOM garante os acentos em UTF-8
const CSV_SEPARATOR = ";";
const CSV_BOM = "﻿";
const CSV_HEADER = [
  "estabelecimento",
  "data",
  "categoria",
  "valor_total",
  "item_descricao",
  "item_quantidade",
  "item_valor_unitario",
  "item_total",
];

function formatCsvNumber(value: number): string {
  return String(value).replace(".", ",");
}

function escapeCsvValue(value: string): string {
  const needsQuotes = /[";\r\n]/.test(value);
  return needsQuotes ? `"${value.replaceAll('"', '""')}"` : value;
}

export function toCsv(expense: Expense): string {
  const expenseColumns = [
    expense.establishment,
    formatDate(expense.date),
    expense.category,
    formatCsvNumber(expense.totalAmount),
  ];

  // Sem itens, gera uma única linha com as colunas de item vazias
  const itemColumns =
    expense.items.length === 0
      ? [["", "", "", ""]]
      : expense.items.map((item) => [
          item.description,
          formatCsvNumber(item.quantity),
          formatCsvNumber(item.unitPrice),
          formatCsvNumber(item.total),
        ]);

  const rows = [
    CSV_HEADER,
    ...itemColumns.map((columns) => [...expenseColumns, ...columns]),
  ];

  return CSV_BOM + rows.map((row) => row.map(escapeCsvValue).join(CSV_SEPARATOR)).join("\r\n");
}

export function getCsvFileName(expense: Expense): string {
  const establishmentSlug = expense.establishment
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return `despesa-${establishmentSlug}-${expense.date}.csv`;
}

export function downloadFile(content: string, fileName: string, mimeType: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
