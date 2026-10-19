"use client";

import { ExportDialog, SECONDARY_BUTTON_CLASS_NAME } from "@/components/export-dialog";
import { downloadFile, getCsvFileName, toCsv } from "@/lib/export";
import type { Expense } from "@/lib/schemas/expense";

interface ExportActionsProps {
  expense: Expense;
  isDisabled: boolean;
}

export function ExportActions({ expense, isDisabled }: ExportActionsProps) {
  function exportCsv() {
    downloadFile(toCsv(expense), getCsvFileName(expense), "text/csv;charset=utf-8");
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <ExportDialog expense={expense} isDisabled={isDisabled} />
      <button
        type="button"
        onClick={exportCsv}
        disabled={isDisabled}
        className={SECONDARY_BUTTON_CLASS_NAME}
      >
        Exportar CSV
      </button>
    </div>
  );
}
