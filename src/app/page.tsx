import { ExpenseExtractor } from "@/components/expense-extractor";
import { HistoryList } from "@/components/history-list";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 text-center rounded-xl border border-zinc-200 bg-white/90 p-5">
        <h1 className="text-2xl font-semibold">Scan Expense</h1>
        <p className="text-sm text-zinc-500">
          Envie a foto de um recibo ou comprovante e a IA extrai os dados.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <main className="min-w-0 flex-1 space-y-6">
          <ExpenseExtractor />
        </main>

        <HistoryList />
      </div>
    </div>
  );
}
