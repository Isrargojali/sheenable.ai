// src/components/ui-kit/TagPill.tsx
// Pill component with variants for job mode/type and generic skills.
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TagVariant =
  | "remote" | "hybrid" | "onsite"
  | "fulltime" | "parttime" | "contract" | "internship"
  | "skill" | "verified" | "hot" | "neutral";

const STYLES: Record<TagVariant, string> = {
  remote:     "bg-[rgba(31,157,107,0.12)] text-[var(--accent-green)] border-[rgba(31,157,107,0.2)]",
  hybrid:     "bg-[rgba(31,157,107,0.12)] text-[var(--accent-green)] border-[rgba(31,157,107,0.2)]",
  onsite:     "bg-[rgba(31,157,107,0.12)] text-[var(--accent-green)] border-[rgba(31,157,107,0.2)]",
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
