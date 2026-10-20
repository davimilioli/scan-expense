"use client";

import { History } from "lucide-react";
import { useRef } from "react";
import { SECONDARY_BUTTON_CLASS_NAME } from "@/components/button-styles";
import { HistoryList } from "@/components/history-list";

interface HistoryDialogProps {
  triggerClassName?: string;
}

export function HistoryDialog({ triggerClassName }: HistoryDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={`${SECONDARY_BUTTON_CLASS_NAME} ${triggerClassName ?? ""}`}
      >
        <History aria-hidden className="size-4" />
        Histórico
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Histórico de extrações"
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl p-5 backdrop:bg-black/40"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold">Histórico</h2>
            <button
              type="button"
              onClick={closeDialog}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
            >
              Fechar
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <HistoryList onEntryOpen={closeDialog} />
          </div>
        </div>
      </dialog>
    </>
  );
}
