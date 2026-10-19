"use client";

import { useState, useTransition } from "react";
import { extractExpense } from "@/app/actions/extract-expense";
import { ExpenseCard } from "@/components/expense-card";
import { ImageUploader } from "@/components/image-uploader";
import { Panel } from "@/components/panel";
import { compressImage, createThumbnail } from "@/lib/image";
import { useExpenseStore, useStoreHydration } from "@/store/expense-store";

export function ExpenseExtractor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasHydrated = useStoreHydration();
  const addEntry = useExpenseStore((state) => state.addEntry);
  const hasStorageError = useExpenseStore((state) => state.hasStorageError);
  const activeEntry = useExpenseStore((state) =>
    state.entries.find((entry) => entry.id === state.activeId),
  );

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setErrorMessage(null);
  }

  function handleExtract() {
    if (!selectedFile) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("image", await compressImage(selectedFile));
        const result = await extractExpense(formData);

        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }

        addEntry({
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          thumbnail: await createThumbnail(selectedFile),
          expense: result.data,
        });
      } catch (error) {
        console.error("Falha ao preparar a imagem:", error);
        setErrorMessage("Não foi possível processar a imagem. Tente outra foto.");
      }
    });
  }

  return (
    <>
      <Panel title="Imagem">
        <div className="space-y-4">
          <ImageUploader onFileChange={handleFileChange} />
          <button
            type="button"
            onClick={handleExtract}
            disabled={!selectedFile || isPending}
            className="w-full rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Extraindo dados..." : "Extrair dados"}
          </button>
          {errorMessage && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Dados extraídos">
        <div className="space-y-3">
          {hasHydrated && activeEntry ? (
            // A key recria o formulário quando outra entrada do histórico é aberta
            <ExpenseCard
              key={activeEntry.id}
              entryId={activeEntry.id}
              expense={activeEntry.expense}
            />
          ) : (
            <p className="text-sm text-zinc-400">
              {isPending ? "Lendo o recibo..." : "Nenhuma extração ainda."}
            </p>
          )}
          {hasStorageError && (
            <p role="alert" className="text-sm text-amber-700">
              O armazenamento do navegador está cheio e o histórico não foi salvo. Remova
              entradas antigas do histórico.
            </p>
          )}
        </div>
      </Panel>
    </>
  );
}
