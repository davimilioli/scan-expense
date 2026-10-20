"use client";

import { HistoryItem } from "@/components/history-item";
import type { HistoryEntry } from "@/lib/schemas/expense";
import { useExpenseStore } from "@/store/expense-store";

interface HistoryListProps {
  onEntryOpen: () => void;
}

export function HistoryList({ onEntryOpen }: HistoryListProps) {
  const entries = useExpenseStore((state) => state.entries);
  const activeId = useExpenseStore((state) => state.activeId);
  const openEntry = useExpenseStore((state) => state.openEntry);
  const removeEntry = useExpenseStore((state) => state.removeEntry);
  const clearHistory = useExpenseStore((state) => state.clearHistory);

  function handleOpen(entry: HistoryEntry) {
    openEntry(entry.id);
    onEntryOpen();
  }

  function handleRemove(entry: HistoryEntry) {
    if (!window.confirm(`Excluir "${entry.expense.establishment}" do histórico?`)) return;
    removeEntry(entry.id);
  }

  function handleClear() {
    if (!window.confirm("Limpar todo o histórico? Essa ação não pode ser desfeita.")) return;
    clearHistory();
  }

  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhum recibo salvo ainda.</p>;
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-1">
        {entries.map((entry) => (
          <HistoryItem
            key={entry.id}
            entry={entry}
            isActive={entry.id === activeId}
            onSelect={() => handleOpen(entry)}
            onRemove={() => handleRemove(entry)}
          />
        ))}
      </ul>
      <button type="button" onClick={handleClear} className="text-sm text-red-600 hover:text-red-700">
        Limpar histórico
      </button>
    </div>
  );
}
