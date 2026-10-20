import { formatCurrency, formatDate } from "@/lib/format";
import type { Expense, PixDetails } from "@/lib/schemas/expense";

export function toJson(expense: Expense): string {
  return JSON.stringify(expense, null, 2);
}

function formatPixParty(party: PixDetails["sender"]): string {
  return [party.name, party.document && `(${party.document})`, party.institution && `- ${party.institution}`]
    .filter(Boolean)
    .join(" ");
}

function toPixText(expense: Expense, pix: PixDetails): string {
  return [
    "Comprovante Pix",
    `Valor: ${formatCurrency(expense.totalAmount)}`,
    `Data: ${formatDate(expense.date)}${pix.time ? ` às ${pix.time}` : ""}`,
    `Categoria: ${expense.category}`,
    "",
    `Quem enviou: ${formatPixParty(pix.sender)}`,
    `Quem recebeu: ${formatPixParty(pix.receiver)}`,
    ...(pix.pixKey ? [`Chave Pix: ${pix.pixKey}`] : []),
    ...(pix.transactionId ? [`ID da transação: ${pix.transactionId}`] : []),
  ].join("\n");
}

export function toText(expense: Expense): string {
  if (expense.pix) return toPixText(expense, expense.pix);

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

const CSV_SEPARATOR = ";";
const CSV_BOM = "\uFEFF";
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

const PIX_CSV_HEADER = [
  "tipo",
  "data",
  "horario",
  "categoria",
  "valor",
  "pagador_nome",
  "pagador_documento",
  "pagador_instituicao",
  "recebedor_nome",
  "recebedor_documento",
  "recebedor_instituicao",
  "chave_pix",
  "id_transacao",
];

function toCsvContent(rows: string[][]): string {
  return CSV_BOM + rows.map((row) => row.map(escapeCsvValue).join(CSV_SEPARATOR)).join("\r\n");
}

function toPixCsv(expense: Expense, pix: PixDetails): string {
  const row = [
    "pix",
    formatDate(expense.date),
    pix.time,
    expense.category,
    formatCsvNumber(expense.totalAmount),
    pix.sender.name,
    pix.sender.document,
    pix.sender.institution,
    pix.receiver.name,
    pix.receiver.document,
    pix.receiver.institution,
    pix.pixKey,
    pix.transactionId,
  ];
  return toCsvContent([PIX_CSV_HEADER, row]);
}

export function toCsv(expense: Expense): string {
  if (expense.pix) return toPixCsv(expense, expense.pix);

  const expenseColumns = [
    expense.establishment,
    formatDate(expense.date),
    expense.category,
    formatCsvNumber(expense.totalAmount),
  ];

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

  return toCsvContent(rows);
}

export function getCsvFileName(expense: Expense): string {
  const establishmentSlug = expense.establishment
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
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
