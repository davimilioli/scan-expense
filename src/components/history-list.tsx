"use client";

import { HistoryItem } from "@/components/history-item";
import { useExpenseStore } from "@/store/expense-store";

interface HistoryListProps {
  onEntryOpen: () => void;
}

export function HistoryList({ onEntryOpen }: HistoryListProps) {
  const entries = useExpenseStore((state) => state.entries);
  const activeId = useExpenseStore((state) => state.activeId);
  const openEntry = useExpenseStore((state) => state.openEntry);

  function handleOpen(entryId: string) {
    openEntry(entryId);
    onEntryOpen();
  }

  if (entries.length === 0) {
    return <p className="text-sm text-zinc-500">Nenhum recibo salvo ainda.</p>;
  }

  return (
    <ul className="space-y-1">
      {entries.map((entry) => (
        <HistoryItem
          key={entry.id}
          entry={entry}
          isActive={entry.id === activeId}
          onSelect={() => handleOpen(entry.id)}
        />
      ))}
    </ul>
  );
}
