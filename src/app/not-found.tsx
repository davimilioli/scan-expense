import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PRIMARY_BUTTON_CLASS_NAME } from "@/components/button-styles";

export const metadata: Metadata = {
  title: "Página não encontrada | Scan Expense",
};

const RECEIPT_LINES = [
  { label: "1 × Página solicitada", value: "R$ 0,00" },
  { label: "Itens encontrados", value: "0" },
];

const SERRATED_EDGE_STYLE = {
  backgroundImage:
    "linear-gradient(-45deg, transparent 8px, #ffffff 0), linear-gradient(45deg, transparent 8px, #ffffff 0)",
  backgroundSize: "16px 16px",
  backgroundPosition: "left bottom",
  backgroundRepeat: "repeat-x",
};

function DashedDivider() {
  return <div className="border-t border-dashed border-zinc-300" />;
}

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-7xl flex-col justify-center px-4 py-8">
      <main className="mx-auto flex w-full max-w-md flex-col items-center gap-10 text-center">
        <div aria-hidden className="w-72 -rotate-2 drop-shadow-xl">
          <div className="space-y-4 rounded-t-lg bg-white px-6 pt-6 pb-4 font-mono text-xs text-zinc-600">
            <div className="space-y-1">
              <p className="font-semibold tracking-widest text-zinc-900">SCAN EXPENSE</p>
              <p>CUPOM NÃO ENCONTRADO</p>
            </div>
            <DashedDivider />
            <p className="text-7xl font-bold tracking-tight text-indigo-500">404</p>
            <DashedDivider />
            <div className="space-y-1.5 text-left">
              {RECEIPT_LINES.map((line) => (
                <div key={line.label} className="flex justify-between gap-4">
                  <span>{line.label}</span>
                  <span>{line.value}</span>
                </div>
              ))}
            </div>
            <DashedDivider />
            <div className="flex justify-between text-sm font-semibold text-zinc-900">
              <span>TOTAL</span>
              <span>R$ 0,00</span>
            </div>
            <p className="pt-2 tracking-widest text-zinc-400">||| ||||| || |||| | |||</p>
          </div>
          <div className="h-4" style={SERRATED_EDGE_STYLE} />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-semibold">Ops! Essa página não existe</h1>
          <p className="text-sm text-zinc-500">
            Volte para o início e envie a foto de um recibo ou comprovante Pix.
          </p>
        </div>

        <Link href="/" className={PRIMARY_BUTTON_CLASS_NAME}>
          <ArrowLeft aria-hidden className="size-4" />
          Voltar para o início
        </Link>
      </main>
    </div>
  );
}
