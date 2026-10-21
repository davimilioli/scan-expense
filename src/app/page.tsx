import { ExpenseExtractor } from "@/components/expense-extractor";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col px-4 py-8">
      <main className="flex flex-1 flex-col">
        <ExpenseExtractor />
      </main>
    </div>
  );
}
