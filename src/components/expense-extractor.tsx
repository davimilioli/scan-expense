"use client";

import { useState, useTransition } from "react";
import { extractExpense, type ExtractExpenseResult } from "@/app/actions/extract-expense";
import { ImageUploader } from "@/components/image-uploader";
import { Panel } from "@/components/panel";
import { compressImage } from "@/lib/image";

export function ExpenseExtractor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExtractExpenseResult | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setResult(null);
  }

  function handleExtract() {
    if (!selectedFile) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("image", await compressImage(selectedFile));
        setResult(await extractExpense(formData));
      } catch (error) {
        console.error("Falha ao preparar a imagem:", error);
        setResult({ ok: false, error: "Não foi possível processar a imagem. Tente outra foto." });
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
          {result && !result.ok && (
            <p role="alert" className="text-sm text-red-600">
              {result.error}
            </p>
          )}
        </div>
      </Panel>

      <Panel title="Dados extraídos">
        {result?.ok ? (
          <pre className="overflow-x-auto rounded-lg bg-zinc-50 p-4 text-xs">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        ) : (
          <p className="text-sm text-zinc-400">
            {isPending ? "Lendo o recibo..." : "Nenhuma extração ainda."}
          </p>
        )}
      </Panel>
    </>
  );
}
