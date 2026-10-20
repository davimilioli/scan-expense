interface PanelProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export function Panel({ title, className, children }: PanelProps) {
  return (
    <section className={`rounded-xl border border-zinc-200 bg-white p-5 ${className ?? ""}`}>
      {title && <h2 className="mb-4 text-sm font-medium text-zinc-500">{title}</h2>}
      {children}
    </section>
  );
}
