import { Sparkles } from "lucide-react";

interface AIAssistButtonProps {
  onClick: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}

export function AIAssistButton({
  onClick,
  label,
  disabled = false,
  loading = false,
}: AIAssistButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="h-9 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-[var(--radius-control)] text-xs font-semibold text-[var(--ink-500)] bg-transparent hover:bg-secondary/60 hover:text-[var(--ink-900)] border-none focus:outline-none transition-all duration-150 shadow-none disabled:opacity-50 disabled:cursor-not-allowed select-none"
      title={label}
    >
      <Sparkles size={16} strokeWidth={1.75} className="text-inherit" />
      {loading ? "Processing…" : label}
    </button>
  );
}
