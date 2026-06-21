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
      className="h-11 inline-flex items-center justify-center gap-1.5 px-[18px] py-3 rounded-[var(--radius-control)] text-sm font-medium text-[var(--ink-900)] bg-[var(--surface)] border border-[var(--ink-300)] hover:border-[var(--ink-500)] hover:bg-[var(--surface-alt)] focus:outline-none focus:ring-2 focus:ring-[rgba(230,0,126,0.4)] focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-none"
      title={label}
    >
      <Sparkles size={16} strokeWidth={1.75} className="text-[var(--ink-700)]" />
      {loading ? "Processing…" : label}
    </button>
  );
}
