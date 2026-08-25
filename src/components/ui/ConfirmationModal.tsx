import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  affectedEntity: string;
  consequence: string;
  confirmLabel?: string;
  isDestructive?: boolean;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  affectedEntity,
  consequence,
  confirmLabel = "Confirm Action",
  isDestructive = true
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-md rounded-3xl border border-border/85 shadow-2xl overflow-hidden flex flex-col animate-scale-in">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-500">
            <AlertTriangle size={18} />
            <h2 className="font-serif text-base text-foreground font-bold">{title}</h2>
          </div>
          <button 
            onClick={onClose} 
            aria-label="Close" 
            className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all cursor-pointer border-0 bg-transparent"
          >
            <X size={15} />
          </button>
        </header>

        {/* Content */}
        <div className="p-6 space-y-4 text-left">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          <div className="p-3.5 bg-secondary/40 border border-border/60 rounded-xl space-y-1.5">
            <div className="text-xs uppercase font-semibold tracking-wider text-muted-foreground">
              Affected Entity
            </div>
            <div className="text-sm font-mono font-bold text-foreground">
              {affectedEntity}
            </div>
          </div>

          <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1.5">
            <div className="text-xs uppercase font-bold tracking-wider text-rose-500">
              Warning Consequence
            </div>
            <div className="text-sm text-rose-600 dark:text-rose-400 font-medium">
              {consequence}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="px-6 py-4 bg-secondary/20 border-t border-border flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border text-ink-500 hover:bg-secondary rounded-full text-xs font-bold transition-all cursor-pointer bg-transparent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "px-5 py-2 text-white hover:opacity-90 active:scale-95 rounded-full text-xs font-bold shadow-sm transition-all cursor-pointer border-0",
              isDestructive ? "bg-rose-600 hover:bg-rose-700" : "bg-primary"
            )}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  );
}
