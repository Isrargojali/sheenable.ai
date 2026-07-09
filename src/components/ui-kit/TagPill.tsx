// src/components/ui-kit/TagPill.tsx
// Pill component with variants for job mode/type and generic skills.
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TagVariant =
  | "remote" | "hybrid" | "onsite"
  | "fulltime" | "parttime" | "contract" | "internship"
  | "skill" | "verified" | "hot" | "neutral";

const STYLES: Record<TagVariant, string> = {
  remote:     "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-200)]",
  hybrid:     "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-200)]",
  onsite:     "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-200)]",
  fulltime:   "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-300)]",
  parttime:   "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-300)]",
  contract:   "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-300)]",
  internship: "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-300)]",
  skill:      "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-300)]",
  verified:   "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-300)]",
  hot:        "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-300)]",
  neutral:    "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-300)]",
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
