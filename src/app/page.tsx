import { ImageUploader } from "@/components/image-uploader";
import { Panel } from "@/components/panel";

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 text-center rounded-xl border border-zinc-200 bg-white/90 p-5">
        <h1 className="text-2xl font-semibold">Scan Expense</h1>
        <p className="text-sm text-zinc-500">
          Envie a foto de um recibo ou comprovante e a IA extrai os dados.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <main className="space-y-6">
          <Panel title="Imagem">
            <ImageUploader />
          </Panel>
          <Panel title="Dados extraídos">
            <p className="text-sm text-zinc-400">Nenhuma extração ainda.</p>
          </Panel>
        </main>

        <aside>
          <Panel title="Histórico">
            <p className="text-sm text-zinc-400">Nenhum recibo salvo.</p>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
