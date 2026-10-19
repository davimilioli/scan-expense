const FIELD_PLACEHOLDER_COUNT = 4;

export function ExtractionSkeleton() {
  return (
    <div role="status" className="animate-pulse space-y-6">
      <span className="sr-only">Lendo o recibo...</span>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: FIELD_PLACEHOLDER_COUNT }, (placeholder, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-24 rounded bg-zinc-200" />
            <div className="h-9 rounded-md bg-zinc-100" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 rounded bg-zinc-200" />
        <div className="h-24 rounded-md bg-zinc-100" />
      </div>
    </div>
  );
}
