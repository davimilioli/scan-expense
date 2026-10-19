"use client";

import { useState } from "react";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Expense } from "@/lib/schemas/expense";

const VIEW_MODES = [
  { value: "text", label: "Texto" },
  { value: "json", label: "JSON" },
] as const;

type ViewMode = (typeof VIEW_MODES)[number]["value"];

interface ExpenseResultViewProps {
  expense: Expense;
}

export function ExpenseResultView({ expense }: ExpenseResultViewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("text");

  return (
    <div className="space-y-4">
      <div role="tablist" className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1">
        {VIEW_MODES.map((mode) => {
          const isActive = mode.value === viewMode;
          return (
            <button
              key={mode.value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setViewMode(mode.value)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                isActive ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel">
        {viewMode === "text" ? (
          <ExpenseText expense={expense} />
        ) : (
          <pre className="overflow-x-auto rounded-lg bg-zinc-50 p-4 text-xs">
            {JSON.stringify(expense, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function ExpenseText({ expense }: ExpenseResultViewProps) {
  const fields = [
    { label: "Estabelecimento", value: expense.establishment },
    { label: "Data", value: formatDate(expense.date) },
    { label: "Categoria", value: expense.category },
    { label: "Valor total", value: formatCurrency(expense.totalAmount) },
  ];

  return (
    <div className="space-y-4 text-sm">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
        {fields.map((field) => (
          <div key={field.label} className="contents">
            <dt className="text-zinc-500">{field.label}</dt>
            <dd className="font-medium">{field.value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <h3 className="mb-2 text-zinc-500">Itens</h3>
        {expense.items.length === 0 ? (
          <p className="text-zinc-400">Sem itens discriminados.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {expense.items.map((item, index) => (
              <li key={index} className="flex justify-between gap-4 py-2">
                <span>
                  {item.quantity} × {item.description}
                  <span className="text-zinc-400"> ({formatCurrency(item.unitPrice)} cada)</span>
                </span>
                <span className="font-medium">{formatCurrency(item.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
