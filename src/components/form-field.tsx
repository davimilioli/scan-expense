export const INPUT_CLASS_NAME =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

interface FormFieldProps {
  label: string;
  error?: string;
  isLabelHiddenOnDesktop?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  error,
  isLabelHiddenOnDesktop,
  className,
  children,
}: FormFieldProps) {
  return (
    <label className={`block space-y-1 ${className ?? ""}`}>
      <span className={`block text-xs text-zinc-500 ${isLabelHiddenOnDesktop ? "md:sr-only" : ""}`}>
        {label}
      </span>
      {children}
      {error && <span className="block text-xs text-red-600">{error}</span>}
    </label>
  );
}
