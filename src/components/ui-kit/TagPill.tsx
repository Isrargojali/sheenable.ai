// src/components/ui-kit/TagPill.tsx
// Pill component with variants for job mode/type and generic skills.
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TagVariant =
  | "remote" | "hybrid" | "onsite"
  | "fulltime" | "parttime" | "contract" | "internship"
  | "skill" | "verified" | "hot" | "neutral";

const STYLES: Record<TagVariant, string> = {
  remote:     "bg-success/10 text-success border-success/20",
  hybrid:     "bg-primary/8 text-primary border-primary/15",
  onsite:     "bg-foreground/5 text-foreground/80 border-foreground/10",
  fulltime:   "bg-primary/10 text-primary border-primary/20",
  parttime:   "bg-primary/8 text-primary/90 border-primary/15",
  contract:   "bg-foreground/5 text-foreground/75 border-foreground/10",
  internship: "bg-primary/6 text-primary/80 border-primary/10",
  skill:      "bg-secondary text-foreground/75 border-border",
  verified:   "bg-success/10 text-success border-success/20",
  hot:        "bg-primary/15 text-primary border-primary/25",
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
