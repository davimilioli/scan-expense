import Image from "next/image";
import { formatCurrency, formatDate } from "@/lib/format";
import type { HistoryEntry } from "@/lib/schemas/expense";

interface HistoryItemProps {
  entry: HistoryEntry;
  isActive: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export function HistoryItem({ entry, isActive, onSelect, onRemove }: HistoryItemProps) {
  const { establishment, date, totalAmount } = entry.expense;

  return (
    <li
      className={`flex items-center gap-2 rounded-lg p-2 ${
        isActive ? "bg-emerald-50 ring-1 ring-emerald-200" : "hover:bg-zinc-50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? "true" : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <Image
          src={entry.thumbnail}
          alt=""
          width={48}
          height={48}
          unoptimized
          className="size-12 shrink-0 rounded-md bg-zinc-100 object-cover"
        />
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{establishment}</span>
          <span className="block text-xs text-zinc-500">
            {formatDate(date)} · {formatCurrency(totalAmount)}
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Excluir ${establishment} do histórico`}
        className="rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
      >
        Excluir
      </button>
    </li>
  );
}
