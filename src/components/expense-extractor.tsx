"use client";

import { useEffect, useState, useTransition } from "react";
import { extractExpense, getRemainingExtractions } from "@/actions/extract-expense";
import { Plus } from "lucide-react";
import { PRIMARY_BUTTON_CLASS_NAME } from "@/components/button-styles";
import { ExpenseCard } from "@/components/expense-card";
import { ExtractionLoading } from "@/components/extraction-loading";
import { HistoryDialog } from "@/components/history-dialog";
import { ImageUploader } from "@/components/image-uploader";
import { Panel } from "@/components/panel";
import { compressImage, createThumbnail } from "@/lib/image";
import { useExpenseStore, useStoreHydration } from "@/store/expense-store";

function createEntryId(): string {
  const [randomValue] = crypto.getRandomValues(new Uint32Array(1));
  return `${Date.now().toString(36)}-${randomValue.toString(36)}`;
}

export function ExpenseExtractor() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);
  const [remainingExtractions, setRemainingExtractions] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasReachedLimit = remainingExtractions === 0;

  const hasHydrated = useStoreHydration();
  const addEntry = useExpenseStore((state) => state.addEntry);
  const setActive = useExpenseStore((state) => state.setActive);
  const hasStorageError = useExpenseStore((state) => state.hasStorageError);
  const activeEntry = useExpenseStore((state) =>
    state.entries.find((entry) => entry.id === state.activeId),
  );
  const latestEntry = useExpenseStore((state) => state.entries[0]);
  const displayedEntry = activeEntry ?? (hasReachedLimit ? latestEntry : undefined);
  const hasExtractedData = hasHydrated && displayedEntry !== undefined;
  const hasHistory = hasHydrated && latestEntry !== undefined;
  const historyOpenCount = useExpenseStore((state) => state.historyOpenCount);
  const [handledHistoryOpenCount, setHandledHistoryOpenCount] = useState(historyOpenCount);

  if (historyOpenCount !== handledHistoryOpenCount) {
    setHandledHistoryOpenCount(historyOpenCount);
    clearUpload();
  }

  useEffect(() => {
    getRemainingExtractions()
      .then(setRemainingExtractions)
      .catch((error) => console.error("Falha ao consultar o limite de extrações:", error));
  }, []);

  function handleFileChange(file: File | null) {
    setSelectedFile(file);
    setErrorMessage(null);
  }

  function clearUpload() {
    setSelectedFile(null);
    setErrorMessage(null);
    setUploaderKey((currentKey) => currentKey + 1);
  }

  function startNewExtraction() {
    clearUpload();
    setActive(null);
  }

  function handleExtract() {
    if (!selectedFile) return;
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("image", await compressImage(selectedFile));
        const result = await extractExpense(formData);
        if (result.remainingExtractions !== undefined) {
          setRemainingExtractions(result.remainingExtractions);
        }

        if (!result.ok) {
          setErrorMessage(result.error);
          return;
        }

        addEntry({
          id: createEntryId(),
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

  const isShowingUpload = !isPending && !hasExtractedData;

  return (
    <>
      {isShowingUpload && (
        <header className="mx-auto max-w-xl space-y-2 text-center">
          <h1 className="text-3xl font-semibold">Scan Expense</h1>
          <p className="text-sm text-zinc-500">
            Envie a foto de um recibo, nota fiscal ou comprovante Pix e a IA extrai o
            estabelecimento, a data, a categoria, o valor total e os itens da compra. Depois é
            só revisar os dados e exportar em CSV ou JSON.
          </p>
        </header>
      )}

      <Panel className={`mx-auto w-full max-w-xl ${isShowingUpload ? "" : "hidden"}`}>
        <div className="space-y-4">
          <ImageUploader key={uploaderKey} onFileChange={handleFileChange} />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleExtract}
              disabled={!selectedFile || isPending || hasReachedLimit}
              className={`flex-1 ${PRIMARY_BUTTON_CLASS_NAME}`}
            >
              Extrair
            </button>
            {hasHistory && <HistoryDialog />}
          </div>
          {errorMessage && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage}
            </p>
          )}
        </div>
      </Panel>

      {isPending && <ExtractionLoading />}

      {!isPending && hasExtractedData && (
        <div className="mx-auto w-full max-w-5xl space-y-4">
          <ExpenseCard
            key={displayedEntry.id}
            entryId={displayedEntry.id}
            expense={displayedEntry.expense}
            actions={
              <div className="flex justify-end">
                <div className="flex w-full gap-2 sm:w-auto">
                  <HistoryDialog triggerClassName="flex-1 sm:flex-none" />
                  <button
                    type="button"
                    onClick={startNewExtraction}
                    disabled={hasReachedLimit}
                    className={`flex-1 sm:flex-none ${PRIMARY_BUTTON_CLASS_NAME}`}
                  >
                    <Plus aria-hidden className="size-4" />
                    Nova extração
                  </button>
                </div>
              </div>
            }
            remainingExtractions={remainingExtractions}
          />
          {hasStorageError && (
            <p role="alert" className="text-sm text-amber-700">
              O armazenamento do navegador está cheio e o histórico não foi salvo. Remova
              entradas antigas do histórico.
            </p>
          )}
        </div>
      )}

      {isShowingUpload && remainingExtractions !== null && (
        <p
          aria-live="polite"
          className={`text-center text-xs font-medium ${hasReachedLimit ? "text-red-700" : "text-zinc-500"}`}
        >
          {hasReachedLimit
            ? "Você atingiu o limite de extrações"
            : remainingExtractions === 1
              ? "Resta 1 extração"
              : `Restam ${remainingExtractions} extrações`}
        </p>
      )}
    </>
  );
}
