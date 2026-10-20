"use client";

import { Check, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { FormField, INPUT_CLASS_NAME } from "@/components/form-field";
import { formatCurrency, parseDecimal } from "@/lib/format";

export interface ItemDraft {
  description: string;
  quantity: string;
  unitPrice: string;
  total: number;
}

interface ExpenseItemsTableProps {
  items: ItemDraft[];
  errors: Record<string, string>;
  onItemsChange: (items: ItemDraft[]) => void;
}

const NEW_ITEM: ItemDraft = { description: "", quantity: "1", unitPrice: "0", total: 0 };
const ICON_BUTTON_CLASS_NAME =
  "inline-flex flex-1 items-center justify-center rounded-md border border-zinc-300 p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700";

function calculateTotal(quantity: string, unitPrice: string): number {
  return Math.round(parseDecimal(quantity) * parseDecimal(unitPrice) * 100) / 100;
}

function formatAmount(value: number): string {
  return Number.isFinite(value) ? formatCurrency(value) : "—";
}

function formatQuantity(quantity: string): string {
  const value = parseDecimal(quantity);
  return Number.isFinite(value) ? value.toLocaleString("pt-BR", { maximumFractionDigits: 3 }) : "—";
}

export function ExpenseItemsTable({ items, errors, onItemsChange }: ExpenseItemsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  function changeAmounts(index: number, changes: Partial<ItemDraft>) {
    onItemsChange(
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const nextItem = { ...item, ...changes };
        return { ...nextItem, total: calculateTotal(nextItem.quantity, nextItem.unitPrice) };
      }),
    );
  }

  function changeDescription(index: number, description: string) {
    onItemsChange(
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, description } : item)),
    );
  }

  function addItem() {
    onItemsChange([...items, NEW_ITEM]);
    setEditingIndex(items.length);
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((item, itemIndex) => itemIndex !== index));
    if (editingIndex === null) return;
    if (editingIndex === index) setEditingIndex(null);
    if (editingIndex > index) setEditingIndex(editingIndex - 1);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-500">Itens</h3>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Sem itens discriminados.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => {
            const isEditing = editingIndex === index;
            const descriptionError = errors[`items.${index}.description`];
            const quantityError = errors[`items.${index}.quantity`];
            const unitPriceError = errors[`items.${index}.unitPrice`];
            const hasError = Boolean(descriptionError || quantityError || unitPriceError);

            return (
              <li
                key={index}
                className={`space-y-3 rounded-lg border p-4 ${
                  hasError && !isEditing ? "border-red-300" : "border-zinc-200"
                }`}
              >
                {isEditing ? (
                  <>
                    <FormField label="Descrição" error={descriptionError}>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(event) => changeDescription(index, event.target.value)}
                        className={INPUT_CLASS_NAME}
                      />
                    </FormField>
                    <div className="grid grid-cols-2 gap-3">
                      <FormField label="Quantidade" error={quantityError}>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          value={item.quantity}
                          onChange={(event) => changeAmounts(index, { quantity: event.target.value })}
                          className={INPUT_CLASS_NAME}
                        />
                      </FormField>
                      <FormField label="Valor unitário (R$)" error={unitPriceError}>
                        <input
                          type="number"
                          inputMode="decimal"
                          step="any"
                          min="0"
                          value={item.unitPrice}
                          onChange={(event) => changeAmounts(index, { unitPrice: event.target.value })}
                          className={INPUT_CLASS_NAME}
                        />
                      </FormField>
                    </div>
                    <div className="space-y-1">
                      <span className="block text-xs text-zinc-500">Total</span>
                      <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm font-semibold">
                        {formatAmount(item.total)}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="border-b border-gray-300 pb-3 font-medium break-words">
                      {item.description || "Sem descrição"}
                    </p>
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                      <dt className="text-zinc-500">Quantidade</dt>
                      <dd className="text-right">{formatQuantity(item.quantity)}</dd>
                      <dt className="text-zinc-500">Valor unitário</dt>
                      <dd className="text-right">{formatAmount(parseDecimal(item.unitPrice))}</dd>
                      <dt className="text-zinc-500">Total</dt>
                      <dd className="text-right font-semibold">{formatAmount(item.total)}</dd>
                    </dl>
                    {hasError && (
                      <p className="text-xs text-red-600">Este item tem dados inválidos. Clique em Editar.</p>
                    )}
                  </>
                )}

                <div className="flex gap-2 border-t border-gray-300 pt-3">
                  {isEditing ? (
                    <button
                      type="button"
                      onClick={() => setEditingIndex(null)}
                      aria-label={`Concluir edição do item ${index + 1}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md bg-indigo-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-600"
                    >
                      <Check aria-hidden className="size-4" />
                      Concluir
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingIndex(index)}
                      aria-label={`Editar item ${index + 1}`}
                      title="Editar"
                      className={ICON_BUTTON_CLASS_NAME}
                    >
                      <Pencil aria-hidden className="size-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label={`Remover item ${index + 1}`}
                    title="Remover"
                    className={ICON_BUTTON_CLASS_NAME}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={addItem}
        className="text-sm font-medium text-indigo-500 hover:text-indigo-600"
      >
        + Adicionar item
      </button>
    </div>
  );
}
