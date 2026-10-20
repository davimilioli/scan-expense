"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PRIMARY_BUTTON_CLASS_NAME } from "@/components/button-styles";
import { ItemEditDialog, type ItemErrors } from "@/components/item-edit-dialog";
import { formatCurrency, parseDecimal } from "@/lib/format";
import { expenseItemFormSchema, type ItemUnit } from "@/lib/schemas/expense";

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

export function toItemValues(item: ItemDraft) {
  return { ...item, quantity: parseDecimal(item.quantity), unitPrice: parseDecimal(item.unitPrice) };
}

function calculateTotal(quantity: string, unitPrice: string): number {
  return Math.round(parseDecimal(quantity) * parseDecimal(unitPrice) * 100) / 100;
}

function applyItemChanges(item: ItemDraft, changes: Partial<ItemDraft>): ItemDraft {
  const nextItem = { ...item, ...changes };
  const isAmountChange = "quantity" in changes || "unitPrice" in changes;
  if (!isAmountChange) return nextItem;
  return { ...nextItem, total: calculateTotal(nextItem.quantity, nextItem.unitPrice) };
}

function formatAmount(value: number): string {
  return Number.isFinite(value) ? formatCurrency(value) : "—";
}

function formatQuantity(quantity: string, unit: ItemUnit): string {
  const value = parseDecimal(quantity);
  if (!Number.isFinite(value)) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unit}`;
}

function getItemErrors(errors: Record<string, string>, index: number): ItemErrors {
  return {
    description: errors[`items.${index}.description`],
    quantity: errors[`items.${index}.quantity`],
    unitPrice: errors[`items.${index}.unitPrice`],
  };
}

function validateNewItem(item: ItemDraft): ItemErrors {
  const result = expenseItemFormSchema.safeParse(toItemValues(item));
  const errors: ItemErrors = {};
  for (const issue of result.error?.issues ?? []) {
    errors[issue.path[0] as keyof ItemErrors] ??= issue.message;
  }
  return errors;
}

export function ExpenseItemsTable({ items, errors, onItemsChange }: ExpenseItemsTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newItem, setNewItem] = useState<ItemDraft | null>(null);
  const [hasTriedToAdd, setHasTriedToAdd] = useState(false);
  const editingItem = editingIndex === null ? undefined : items[editingIndex];
  const newItemErrors = newItem && hasTriedToAdd ? validateNewItem(newItem) : {};

  function changeItem(index: number, changes: Partial<ItemDraft>) {
    onItemsChange(
      items.map((item, itemIndex) => (itemIndex === index ? applyItemChanges(item, changes) : item)),
    );
  }

  function removeItem(index: number) {
    onItemsChange(items.filter((item, itemIndex) => itemIndex !== index));
  }

  function openNewItem() {
    setNewItem(NEW_ITEM);
    setHasTriedToAdd(false);
  }

  function addNewItem() {
    if (!newItem) return;

    const hasErrors = Object.values(validateNewItem(newItem)).some(Boolean);
    if (hasErrors) {
      setHasTriedToAdd(true);
      return;
    }

    onItemsChange([...items, newItem]);
    setNewItem(null);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button type="button" onClick={openNewItem} className={PRIMARY_BUTTON_CLASS_NAME}>
          <Plus aria-hidden className="size-4" />
          Adicionar item
        </button>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">Sem itens discriminados.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((item, index) => {
            const hasError = Object.values(getItemErrors(errors, index)).some(Boolean);

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

      {editingIndex !== null && editingItem && (
        <ItemEditDialog
          key={editingIndex}
          title={`Editar item ${editingIndex + 1}`}
          confirmLabel="Concluir"
          item={editingItem}
          errors={getItemErrors(errors, editingIndex)}
          onChange={(changes) => changeItem(editingIndex, changes)}
          onConfirm={() => setEditingIndex(null)}
          onClose={() => setEditingIndex(null)}
        />
      )}

      {newItem && (
        <ItemEditDialog
          title="Adicionar item"
          confirmLabel="Adicionar"
          item={newItem}
          errors={newItemErrors}
          onChange={(changes) => setNewItem(applyItemChanges(newItem, changes))}
          onConfirm={addNewItem}
          onClose={() => setNewItem(null)}
        />
      )}
    </div>
  );
}
