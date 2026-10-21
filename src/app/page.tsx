import { ExpenseExtractor } from "@/components/expense-extractor";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col justify-center px-4 py-8">
      <main className="space-y-6">
        <ExpenseExtractor />
      </main>
    </div>
  );
}
