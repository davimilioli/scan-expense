"use client";

import { HistoryItem } from "@/components/history-item";
import { Panel } from "@/components/panel";
import type { HistoryEntry } from "@/lib/schemas/expense";
import { useExpenseStore, useStoreHydration } from "@/store/expense-store";

export function HistoryList() {
  const hasHydrated = useStoreHydration();
  const entries = useExpenseStore((state) => state.entries);
  const activeId = useExpenseStore((state) => state.activeId);
  const openEntry = useExpenseStore((state) => state.openEntry);
  const removeEntry = useExpenseStore((state) => state.removeEntry);
  const clearHistory = useExpenseStore((state) => state.clearHistory);

  function handleRemove(entry: HistoryEntry) {
    if (!window.confirm(`Excluir "${entry.expense.establishment}" do histórico?`)) return;
    removeEntry(entry.id);
  }

  function handleClear() {
    if (!window.confirm("Limpar todo o histórico? Essa ação não pode ser desfeita.")) return;
    clearHistory();
  }

  if (!hasHydrated || entries.length === 0) return null;

  return (
    <aside className="shrink-0 lg:w-80">
      <Panel title="Histórico">
        <div className="space-y-4">
          <ul className="space-y-1">
            {entries.map((entry) => (
              <HistoryItem
                key={entry.id}
                entry={entry}
                isActive={entry.id === activeId}
                onSelect={() => openEntry(entry.id)}
                onRemove={() => handleRemove(entry)}
              />
            ))}
          </ul>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Limpar histórico
          </button>
        </div>
      </Panel>
    </aside>
  );
}
