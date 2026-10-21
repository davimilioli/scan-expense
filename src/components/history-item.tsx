import Image from "next/image";
import { formatCurrency, formatDate } from "@/lib/format";
import type { HistoryEntry } from "@/lib/schemas/expense";

interface HistoryItemProps {
  entry: HistoryEntry;
  isActive: boolean;
  onSelect: () => void;
}

export function HistoryItem({ entry, isActive, onSelect }: HistoryItemProps) {
  const { documentType, establishment, date, totalAmount } = entry.expense;

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={isActive ? "true" : undefined}
        className={`flex w-full items-center gap-3 rounded-lg p-2 text-left ${
          isActive ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-zinc-50"
        }`}
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
            {documentType === "pix" && "Pix · "}
            {formatDate(date)} · {formatCurrency(totalAmount)}
          </span>
        </span>
      </button>
    </li>
  );
}
