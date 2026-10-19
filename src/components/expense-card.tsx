"use client";

import { useState } from "react";
import { ExpenseItemsTable, type ItemDraft } from "@/components/expense-items-table";
import { ExportActions } from "@/components/export-actions";
import { FormField, INPUT_CLASS_NAME } from "@/components/form-field";
import { formatCurrency, parseDecimal } from "@/lib/format";
import { categories, expenseSchema, type Category, type Expense } from "@/lib/schemas/expense";
import { useExpenseStore } from "@/store/expense-store";

// Rascunho do formulário: números ficam como texto para o usuário poder digitar livremente
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
}

function toDraft(expense: Expense): ExpenseDraft {
  return {
    ...expense,
    totalAmount: String(expense.totalAmount),
    items: expense.items.map((item) => ({
      ...item,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
    })),
  };
}

// Arredonda para centavos para evitar resíduos de ponto flutuante (ex: 0.1 + 0.2)
function sumItemTotals(items: ItemDraft[]): number {
  const sum = items.reduce((total, item) => total + item.total, 0);
  return Math.round(sum * 100) / 100;
}

function validateDraft(draft: ExpenseDraft) {
  return expenseSchema.safeParse({
    ...draft,
    totalAmount: parseDecimal(draft.totalAmount),
    items: draft.items.map((item) => ({
      ...item,
      quantity: parseDecimal(item.quantity),
      unitPrice: parseDecimal(item.unitPrice),
    })),
  });
}

export function ExpenseCard({ entryId, expense }: ExpenseCardProps) {
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

  // Só grava no histórico quando o rascunho inteiro é válido
  function changeDraft(changes: Partial<ExpenseDraft>) {
    const nextDraft = { ...draft, ...changes };
    setDraft(nextDraft);

    const nextValidation = validateDraft(nextDraft);
    if (nextValidation.success) updateExpense(entryId, nextValidation.data);
  }

  // O valor total acompanha a soma dos itens. Sem itens ou com algum total inválido, mantém o valor atual
  function changeItems(items: ItemDraft[]) {
    const nextItemsSum = sumItemTotals(items);
    const shouldUpdateTotal = items.length > 0 && Number.isFinite(nextItemsSum);

    changeDraft({
      items,
      totalAmount: shouldUpdateTotal ? String(nextItemsSum) : draft.totalAmount,
    });
  }

  return (
    <div className="space-y-6">
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

      <ExpenseItemsTable
        items={draft.items}
        errors={errors}
        onItemsChange={changeItems}
      />

      {hasDivergence && (
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
          A soma dos itens ({formatCurrency(itemsSum)}) é diferente do valor total (
          {formatCurrency(totalAmount)}).
        </p>
      )}

      {!validation.success && (
        <p className="text-xs text-zinc-500">
          Corrija os campos destacados para salvar e exportar as alterações.
        </p>
      )}

      <ExportActions expense={expense} isDisabled={!validation.success} />
    </div>
  );
}
