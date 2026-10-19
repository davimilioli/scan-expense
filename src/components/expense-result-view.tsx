"use client";

import { useState } from "react";
import { ExpenseCard } from "@/components/expense-card";
import type { Expense } from "@/lib/schemas/expense";

const VIEW_MODES = [
  { value: "text", label: "Texto" },
  { value: "json", label: "JSON" },
] as const;

type ViewMode = (typeof VIEW_MODES)[number]["value"];

interface ExpenseResultViewProps {
  entryId: string;
  expense: Expense;
}

export function ExpenseResultView({ entryId, expense }: ExpenseResultViewProps) {
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
          <ExpenseCard entryId={entryId} expense={expense} />
        ) : (
          <pre className="overflow-x-auto rounded-lg bg-zinc-50 p-4 text-xs">
            {JSON.stringify(expense, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
