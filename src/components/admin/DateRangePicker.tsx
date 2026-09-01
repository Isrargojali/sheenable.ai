// src/components/admin/DateRangePicker.tsx
import { cn } from "@/lib/utils";

export type TimeframeOption = "today" | "7d" | "30d" | "90d";

interface DateRangePickerProps {
  value: TimeframeOption;
  onChange: (val: TimeframeOption) => void;
  options?: Array<{ key: TimeframeOption; label: string }>;
  className?: string;
  size?: "sm" | "md";
}

const DEFAULT_OPTIONS: Array<{ key: TimeframeOption; label: string }> = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
  { key: "90d", label: "90 Days" },
];

export function DateRangePicker({
  value,
  onChange,
  options = DEFAULT_OPTIONS,
  className,
  size = "md",
}: DateRangePickerProps) {
  return (
    <div
      className={cn(
        "flex bg-[var(--ink-100)] p-1 rounded-full items-center select-none",
        className
      )}
    >
      {options.map((opt) => {
        const isActive = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "rounded-full font-semibold transition-all duration-200 border-0 cursor-pointer flex items-center justify-center",
              size === "sm" ? "h-6 px-2.5 text-[10.5px]" : "h-7 px-3.5 text-[11.5px]",
              isActive
                ? "bg-[var(--brand-pink)] text-white shadow-sm"
                : "bg-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default DateRangePicker;
