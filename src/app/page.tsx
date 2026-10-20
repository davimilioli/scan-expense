import { ExpenseExtractor } from "@/components/expense-extractor";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-8">
{/*        <header className="mb-8 text-center rounded-xl border border-zinc-200 bg-white/90 p-5">
        <h1 className="text-2xl font-semibold">Scan Expense</h1>
        <p className="text-sm text-zinc-500">
          Envie a foto de um recibo ou comprovante e a IA extrai os dados.
        </p>
      </header> */}

      <main className="space-y-6">
        <ExpenseExtractor />
      </main>
    </div>
  );
}
