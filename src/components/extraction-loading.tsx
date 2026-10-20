export function ExtractionLoading() {
  return (
    <div role="status" className="flex flex-col items-center gap-4 py-16 text-center">
      <div className="size-12 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-500" />
      <div className="space-y-1">
        <p className="text-sm font-medium text-zinc-900">Extraindo os dados do recibo...</p>
        <p className="text-xs text-zinc-500">Isso leva só alguns segundos.</p>
      </div>
    </div>
  );
}
