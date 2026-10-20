"use client";

import { useRef, useState } from "react";
import { PRIMARY_BUTTON_CLASS_NAME, ACCENT_BUTTON_CLASS_NAME } from "@/components/button-styles";
import { toJson, toText } from "@/lib/export";
import type { Expense } from "@/lib/schemas/expense";

const VIEW_MODES = [
  { value: "text", label: "Texto" },
  { value: "json", label: "JSON" },
] as const;

const COPY_FEEDBACK_DURATION_IN_MS = 2000;

type ViewMode = (typeof VIEW_MODES)[number]["value"];
type CopyStatus = "idle" | "copied" | "failed";

interface ExportDialogProps {
  expense: Expense;
  isDisabled: boolean;
}

export function ExportDialog({ expense, isDisabled }: ExportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("text");
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const content = viewMode === "text" ? toText(expense) : toJson(expense);

  function openDialog() {
    setViewMode("text");
    setCopyStatus("idle");
    dialogRef.current?.showModal();
  }

  function changeViewMode(mode: ViewMode) {
    setViewMode(mode);
    setCopyStatus("idle");
  }

  async function copyContent() {
    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus("copied");
    } catch (error) {
      console.error("Falha ao copiar:", error);
      setCopyStatus("failed");
    }
    setTimeout(() => setCopyStatus("idle"), COPY_FEEDBACK_DURATION_IN_MS);
  }

  const copyLabel = {
    idle: `Copiar ${viewMode === "text" ? "texto" : "JSON"}`,
    copied: "Copiado!",
    failed: "Não foi possível copiar",
  }[copyStatus];

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={isDisabled}
        className={ACCENT_BUTTON_CLASS_NAME}
      >
        Ver e copiar resultado
      </button>

      <dialog
        ref={dialogRef}
        aria-label="Resultado da extração"
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl p-5 backdrop:bg-black/40"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div role="tablist" className="inline-flex gap-1 rounded-lg bg-zinc-100 p-1">
              {VIEW_MODES.map((mode) => {
                const isActive = mode.value === viewMode;
                return (
                  <button
                    key={mode.value}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => changeViewMode(mode.value)}
                    className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white text-zinc-900 shadow-sm"
                        : "text-zinc-500 hover:text-zinc-700"
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="rounded-md px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
            >
              Fechar
            </button>
          </div>

          <pre
            role="tabpanel"
            className="max-h-96 overflow-auto rounded-lg bg-zinc-50 p-4 text-xs whitespace-pre-wrap"
          >
            {content}
          </pre>

          <button
            type="button"
            onClick={copyContent}
            className={`w-full ${PRIMARY_BUTTON_CLASS_NAME}`}
          >
            {copyLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
