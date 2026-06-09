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
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-200 hover:border-purple-300 text-purple-600 hover:text-purple-700 text-xs font-semibold transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      title={label}
    >
      <Sparkles size={13} />
      {loading ? "Processing…" : label}
    </button>
  );
}
