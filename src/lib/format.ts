const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}

// Campo vazio vira NaN (e não 0) para o Zod acusar o campo como não preenchido
export function parseDecimal(value: string): number {
  return value.trim() === "" ? NaN : Number(value);
}

// Monta a data a partir do texto para evitar o deslocamento de fuso do `new Date("YYYY-MM-DD")`
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}
