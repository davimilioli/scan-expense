"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import { PRIMARY_BUTTON_CLASS_NAME } from "@/components/button-styles";
import type { ItemDraft } from "@/components/expense-items-table";
import { FormField, INPUT_CLASS_NAME } from "@/components/form-field";
import { formatCurrency } from "@/lib/format";
import type { ItemUnit } from "@/lib/schemas/expense";

const UNIT_LABELS: Record<ItemUnit, string> = { un: "Unidade", kg: "Peso (kg)" };

export interface ItemErrors {
  description?: string;
  quantity?: string;
  unitPrice?: string;
}

interface ItemEditDialogProps {
  title: string;
  confirmLabel: string;
  item: ItemDraft;
  errors: ItemErrors;
  onChange: (changes: Partial<ItemDraft>) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function ItemEditDialog({
  title,
  confirmLabel,
  item,
  errors,
  onChange,
  onConfirm,
  onClose,
}: ItemEditDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label={title}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-5 backdrop:bg-black/40"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            Fechar
          </button>
        </div>

        <FormField label="Descrição" error={errors.description}>
          <input
            type="text"
            value={item.description}
            onChange={(event) => onChange({ description: event.target.value })}
            className={INPUT_CLASS_NAME}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Unidade">
            <select
              value={item.unit}
              onChange={(event) => onChange({ unit: event.target.value as ItemUnit })}
              className={INPUT_CLASS_NAME}
            >
              {Object.entries(UNIT_LABELS).map(([unit, label]) => (
                <option key={unit} value={unit}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Quantidade" error={errors.quantity}>
            <input
              type="number"
              inputMode={item.unit === "un" ? "numeric" : "decimal"}
              step={item.unit === "un" ? "1" : "any"}
              min="0"
              value={item.quantity}
              onChange={(event) => onChange({ quantity: event.target.value })}
              className={INPUT_CLASS_NAME}
            />
          </FormField>
          <FormField label="Valor unitário (R$)" error={errors.unitPrice}>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min="0"
              value={item.unitPrice}
              onChange={(event) => onChange({ unitPrice: event.target.value })}
              className={INPUT_CLASS_NAME}
            />
          </FormField>
          <div className="space-y-1">
            <span className="block text-xs text-zinc-500">Total</span>
            <p className="rounded-md bg-zinc-50 px-3 py-2 text-sm font-semibold">
              {Number.isFinite(item.total) ? formatCurrency(item.total) : "—"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
          className={`w-full ${PRIMARY_BUTTON_CLASS_NAME}`}
        >
          <Check aria-hidden className="size-4" />
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
