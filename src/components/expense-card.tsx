"use client";

import { useState } from "react";
import { ExpenseItemsTable, toItemValues, type ItemDraft } from "@/components/expense-items-table";
import { ExportActions } from "@/components/export-actions";
import { FormField, INPUT_CLASS_NAME } from "@/components/form-field";
import { Panel } from "@/components/panel";
import { formatCurrency, parseDecimal } from "@/lib/format";
import { categories, expenseFormSchema, type Category, type Expense } from "@/lib/schemas/expense";
import { useExpenseStore } from "@/store/expense-store";

interface ExpenseDraft {
  establishment: string;
  date: string;
  category: Category;
  totalAmount: string;
  items: ItemDraft[];
}

interface ExpenseCardProps {
  entryId: string;
  expense: Expense;
  actions: React.ReactNode;
  remainingExtractions: number | null;
}

function toDraft(expense: Expense): ExpenseDraft {
  return {
    ...expense,
    totalAmount: String(expense.totalAmount),
    items: expense.items.map((item) => ({
      ...item,
      unit: item.unit ?? (Number.isInteger(item.quantity) ? "un" : "kg"),
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    })),
  };
}

function formatAmount(value: number): string {
  return Number.isFinite(value) ? formatCurrency(value) : "—";
}

function sumItemTotals(items: ItemDraft[]): number {
  const sum = items.reduce((total, item) => total + item.total, 0);
  return Math.round(sum * 100) / 100;
}

function validateDraft(draft: ExpenseDraft) {
  return expenseFormSchema.safeParse({
    ...draft,
    totalAmount: parseDecimal(draft.totalAmount),
    items: draft.items.map(toItemValues),
  });
}

export function ExpenseCard({ entryId, expense, actions, remainingExtractions }: ExpenseCardProps) {
  const updateExpense = useExpenseStore((state) => state.updateExpense);
  const [draft, setDraft] = useState(() => toDraft(expense));

  const validation = validateDraft(draft);
  const errors: Record<string, string> = {};
  for (const issue of validation.error?.issues ?? []) {
    errors[issue.path.join(".")] ??= issue.message;
  }

  const totalAmount = parseDecimal(draft.totalAmount);
  const itemsSum = sumItemTotals(draft.items);
  const hasDivergence =
    draft.items.length > 0 &&
    Number.isFinite(totalAmount) &&
    Number.isFinite(itemsSum) &&
    Math.abs(itemsSum - totalAmount) >= 0.01;

  const summaryRows = [
    { label: "Itens", value: String(draft.items.length) },
    { label: "Soma dos itens", value: formatAmount(itemsSum) },
    { label: "Valor total", value: formatAmount(totalAmount) },
    ...(hasDivergence ? [{ label: "Diferença", value: formatAmount(Math.abs(itemsSum - totalAmount)) }] : []),
    ...(remainingExtractions === null ? [] : [{ label: "Créditos disponíveis", value: String(remainingExtractions) }]),
  ];

  function changeDraft(changes: Partial<ExpenseDraft>) {
    const nextDraft = { ...draft, ...changes };
    setDraft(nextDraft);

    const nextValidation = validateDraft(nextDraft);
    if (nextValidation.success) updateExpense(entryId, nextValidation.data);
  }

  function changeItems(items: ItemDraft[]) {
    const nextItemsSum = sumItemTotals(items);
    const shouldUpdateTotal = items.length > 0 && Number.isFinite(nextItemsSum);

    changeDraft({
      items,
      totalAmount: shouldUpdateTotal ? String(nextItemsSum) : draft.totalAmount,
    });
  }

  return (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_17rem]">
      <div className="min-w-0 space-y-4">
        <Panel>
          <div className="space-y-6">
            {actions}
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Estabelecimento" error={errors.establishment}>
                <input
                  type="text"
                  value={draft.establishment}
                  onChange={(event) => changeDraft({ establishment: event.target.value })}
                  className={INPUT_CLASS_NAME}
                />
              </FormField>
              <FormField label="Data" error={errors.date}>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(event) => changeDraft({ date: event.target.value })}
                  className={INPUT_CLASS_NAME}
                />
              </FormField>
              <FormField label="Categoria" error={errors.category}>
                <select
                  value={draft.category}
                  onChange={(event) => changeDraft({ category: event.target.value as Category })}
                  className={INPUT_CLASS_NAME}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Valor total (R$)" error={errors.totalAmount}>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={draft.totalAmount}
                  onChange={(event) => changeDraft({ totalAmount: event.target.value })}
                  className={INPUT_CLASS_NAME}
                />
              </FormField>
            </div>
          </div>
        </Panel>

        <Panel>
          <ExpenseItemsTable items={draft.items} errors={errors} onItemsChange={changeItems} />
        </Panel>
      </div>

      <Panel title="Resumo" className="lg:sticky lg:top-8">
        <div className="space-y-4">
          <dl className="space-y-2 text-sm">
            {summaryRows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <dt className="text-zinc-500">{row.label}</dt>
                <dd className="font-medium">{row.value}</dd>
              </div>
            ))}
          </dl>
          {remainingExtractions === 0 && (
            <p aria-live="polite" className="rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              Você atingiu o limite de extrações
            </p>
          )}
          {hasDivergence && (
            <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
              A soma dos itens ({formatCurrency(itemsSum)}) é diferente do valor total (
              {formatCurrency(totalAmount)}).
            </p>
          )}
          <ExportActions expense={expense} isDisabled={!validation.success} />
          {!validation.success && (
            <p className="text-xs text-zinc-500">
              Corrija os campos destacados para salvar e exportar as alterações.
            </p>
          )}
        </div>
      </Panel>
    </div>
  );
}
