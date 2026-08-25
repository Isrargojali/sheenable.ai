// src/components/ui-kit/StatCard.tsx
// KPI tile: label, value, trend, optional icon.
import { ReactNode } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: ReactNode;
  trend?: { value: string; direction?: "up" | "down" };
  icon?: ReactNode;
  caption?: string;
  className?: string;
}

export function StatCard({ label, value, trend, icon, caption, className }: Props) {
  const Arrow = trend?.direction === "down" ? ArrowDown : ArrowUp;
  const trendClass = trend?.direction === "down"
    ? "bg-rose-50 text-rose-700"
    : "bg-mint-50 text-mint-600";

  return (
    <div className={cn(
      "bg-card border border-border rounded-2xl p-5 lift",
      className,
    )}>
      <div className="flex items-start justify-between mb-3">
        {icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-mauve-50 text-primary">
            {icon}
          </div>
        )}
        {trend && (
          <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full", trendClass)}>
            <Arrow size={12} strokeWidth={2.5} />
            {trend.value}
          </span>
        )}
      </div>
      <div className="font-serif text-3xl font-extrabold text-foreground leading-none tracking-tight">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-2 font-semibold uppercase tracking-wider">{label}</div>
      {caption && <div className="text-xs text-muted-foreground mt-1">{caption}</div>}
    </div>
  );
}
