// src/components/ui-kit/TagPill.tsx
// Pill component with variants for job mode/type and generic skills.
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TagVariant =
  | "remote" | "hybrid" | "onsite"
  | "fulltime" | "parttime" | "contract" | "internship"
  | "skill" | "verified" | "hot" | "neutral";

const STYLES: Record<TagVariant, string> = {
  remote:     "bg-mint-50 text-mint-600 border-mint-100",
  hybrid:     "bg-amber-50 text-amber-700 border-amber-200",
  onsite:     "bg-blue-50 text-blue-700 border-blue-100",
  fulltime:   "bg-mauve-50 text-mauve-600 border-mauve-100",
  parttime:   "bg-mauve-50 text-mauve-500 border-mauve-100",
  contract:   "bg-secondary text-foreground/80 border-border",
  internship: "bg-amber-50 text-amber-700 border-amber-200",
  skill:      "bg-secondary text-foreground/75 border-border",
  verified:   "bg-mint-50 text-mint-600 border-mint-200",
  hot:        "bg-rose-50 text-rose-700 border-rose-200",
  neutral:    "bg-secondary text-muted-foreground border-border",
};

const LABELS: Partial<Record<TagVariant, string>> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
  fulltime: "Full-time",
  parttime: "Part-time",
  contract: "Contract",
  internship: "Internship",
  verified: "Employer Verified",
};

interface Props {
  variant?: TagVariant;
  children?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function TagPill({ variant = "neutral", children, icon, className }: Props) {
  const text = children ?? LABELS[variant];
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold tracking-wide",
      STYLES[variant],
      className,
    )}>
      {icon}
      {text}
    </span>
  );
}
