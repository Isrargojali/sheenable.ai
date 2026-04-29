// src/components/ui-kit/EmptyState.tsx
// Illustrated empty placeholder with optional CTA.
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center text-center px-6 py-12 rounded-2xl border border-dashed border-border bg-secondary/40",
      className,
    )}>
      {/* default illustration: soft mauve circle with optional icon */}
      <div className="relative w-20 h-20 mb-5">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-mauve-100 to-mauve-50" />
        <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center text-primary">
          {icon ?? (
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 13a3 3 0 006 0" />
              <circle cx="9" cy="10" r=".8" fill="currentColor" />
              <circle cx="15" cy="10" r=".8" fill="currentColor" />
            </svg>
          )}
        </div>
      </div>
      <h3 className="font-serif text-xl text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-[12px] text-muted-foreground max-w-xs mb-5">{description}</p>
      )}
      {action}
    </div>
  );
}
