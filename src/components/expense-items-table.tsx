"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { ItemEditDialog } from "@/components/item-edit-dialog";
import { formatCurrency, parseDecimal } from "@/lib/format";
import type { ItemUnit } from "@/lib/schemas/expense";

export interface ItemDraft {
  description: string;
  unit: ItemUnit;
  quantity: string;
  unitPrice: string;
  total: number;
}

interface ExpenseItemsTableProps {
  items: ItemDraft[];
  errors: Record<string, string>;
  onItemsChange: (items: ItemDraft[]) => void;
}

const NEW_ITEM: ItemDraft = { description: "", unit: "un", quantity: "1", unitPrice: "0", total: 0 };
const ICON_BUTTON_CLASS_NAME =
  "inline-flex flex-1 items-center justify-center rounded-md border border-zinc-300 p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-700";

function calculateTotal(quantity: string, unitPrice: string): number {
  return Math.round(parseDecimal(quantity) * parseDecimal(unitPrice) * 100) / 100;
}

function formatAmount(value: number): string {
  return Number.isFinite(value) ? formatCurrency(value) : "—";
}

function formatQuantity(quantity: string, unit: ItemUnit): string {
  const value = parseDecimal(quantity);
  if (!Number.isFinite(value)) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
}

function getItemErrors(errors: Record<string, string>, index: number) {
  return {
    description: errors[`items.${index}.description`],
    quantity: errors[`items.${index}.quantity`],
    unitPrice: errors[`items.${index}.unitPrice`],
  };
}

export function ExpenseItemsTable({ items, errors, onItemsChange }: ExpenseItemsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const editingItem = editingIndex === null ? undefined : items[editingIndex];

  function changeAmounts(index: number, changes: Pick<Partial<ItemDraft>, "quantity" | "unitPrice">) {
    onItemsChange(
      items.map((item, itemIndex) => {
        if (itemIndex !== index) return item;
        const nextItem = { ...item, ...changes };
        return { ...nextItem, total: calculateTotal(nextItem.quantity, nextItem.unitPrice) };
      }),
    );
  }

  function changeDetails(index: number, changes: Pick<Partial<ItemDraft>, "description" | "unit">) {
    onItemsChange(
      items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...changes } : item)),
    );
  }

  function addItem() {
    onItemsChange([...items, NEW_ITEM]);
    setEditingIndex(items.length);
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((item, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-zinc-500">Itens</h3>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Sem itens discriminados.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => {
            const itemErrors = getItemErrors(errors, index);
            const hasError = Object.values(itemErrors).some(Boolean);

            return (
              <li
                key={index}
                className={`space-y-3 rounded-lg border p-4 ${hasError ? "border-red-300" : "border-zinc-200"}`}
              >
                <p className="border-b border-gray-300 pb-3 font-medium break-words">
                  {item.description || "Sem descrição"}
                </p>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                  <dt className="text-zinc-500">Quantidade</dt>
                  <dd className="text-right">{formatQuantity(item.quantity, item.unit)}</dd>
                  <dt className="text-zinc-500">Valor unitário</dt>
                  <dd className="text-right">{formatAmount(parseDecimal(item.unitPrice))}</dd>
                  <dt className="text-zinc-500">Total</dt>
                  <dd className="text-right font-semibold">{formatAmount(item.total)}</dd>
                </dl>
                {hasError && (
                  <p className="text-xs text-red-600">Este item tem dados inválidos. Clique em Editar.</p>
                )}

                <div className="flex gap-2 border-t border-gray-300 pt-3">
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label={`Remover item ${index + 1}`}
                    title="Remover"
                    className={ICON_BUTTON_CLASS_NAME}
                  >
                    <Trash2 aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(index)}
                    aria-label={`Editar item ${index + 1}`}
                    title="Editar"
                    className={ICON_BUTTON_CLASS_NAME}
                  >
                    <Pencil aria-hidden className="size-4" />
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

      {editingIndex !== null && editingItem && (
        <ItemEditDialog
          key={editingIndex}
          item={editingItem}
          itemNumber={editingIndex + 1}
          errors={getItemErrors(errors, editingIndex)}
          onDetailsChange={(changes) => changeDetails(editingIndex, changes)}
          onAmountsChange={(changes) => changeAmounts(editingIndex, changes)}
          onClose={() => setEditingIndex(null)}
        />
      )}
    </div>
  );
}
