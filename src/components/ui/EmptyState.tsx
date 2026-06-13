// src/components/ui/EmptyState.tsx
// Zero-data illustration system for the employer platform.
// Provides 5 branded SVG variants with headline, body copy, and optional CTA.
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

// ── Inline SVG Illustrations ────────────────────────────────────────────────

function IllustrationNoJobs() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Background blobs */}
      <ellipse cx="100" cy="140" rx="75" ry="12" fill="currentColor" opacity="0.06" />
      {/* Briefcase */}
      <rect x="55" y="60" width="90" height="65" rx="10" fill="currentColor" opacity="0.12" />
      <rect x="55" y="60" width="90" height="65" rx="10" stroke="currentColor" strokeWidth="2.5" opacity="0.4" />
      <path d="M78 60V52a8 8 0 0 1 8-8h28a8 8 0 0 1 8 8v8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      {/* Latch */}
      <rect x="88" y="90" width="24" height="8" rx="4" fill="currentColor" opacity="0.3" />
      {/* Plus sparkle */}
      <circle cx="150" cy="45" r="18" fill="currentColor" opacity="0.08" />
      <path d="M150 36v18M141 45h18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
      {/* Small dots */}
      <circle cx="42" cy="75" r="4" fill="currentColor" opacity="0.2" />
      <circle cx="160" cy="100" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="50" cy="110" r="2.5" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function IllustrationNoApplicants() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="100" cy="145" rx="70" ry="10" fill="currentColor" opacity="0.06" />
      {/* Person silhouette */}
      <circle cx="100" cy="55" r="24" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M60 130c0-22 18-38 40-38s40 16 40 38" fill="currentColor" opacity="0.1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
      {/* Search circle overlay */}
      <circle cx="145" cy="45" r="20" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="143" cy="43" r="8" stroke="currentColor" strokeWidth="2" opacity="0.45" />
      <path d="M149 49l5 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.45" />
      {/* Sparkles */}
      <circle cx="45" cy="60" r="4" fill="currentColor" opacity="0.2" />
      <circle cx="165" cy="90" r="3" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

function IllustrationNoMessages() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="100" cy="148" rx="68" ry="9" fill="currentColor" opacity="0.06" />
      {/* Two chat bubbles */}
      <rect x="30" y="50" width="85" height="50" rx="14" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2" opacity="0.35" />
      <path d="M44 100l-10 16 20-8" fill="currentColor" opacity="0.12" />
      <rect x="85" y="75" width="80" height="45" rx="14" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <path d="M151 120l10 14-18-6" fill="currentColor" opacity="0.1" />
      {/* Lines inside bubbles */}
      <path d="M48 68h48M48 80h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M101 91h45M101 102h28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.25" />
      {/* Ellipsis dots */}
      <circle cx="120" cy="107" r="2.5" fill="currentColor" opacity="0.3" />
      <circle cx="128" cy="107" r="2.5" fill="currentColor" opacity="0.3" />
      <circle cx="136" cy="107" r="2.5" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

function IllustrationNoResults() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="100" cy="148" rx="68" ry="9" fill="currentColor" opacity="0.06" />
      {/* Magnifier */}
      <circle cx="90" cy="72" r="35" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="2.5" opacity="0.35" />
      <path d="M116 98l22 25" stroke="currentColor" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
      {/* X inside lens */}
      <path d="M80 62l20 20M100 62L80 82" stroke="currentColor" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
      {/* Outer sparkles */}
      <circle cx="45" cy="50" r="4" fill="currentColor" opacity="0.18" />
      <circle cx="160" cy="60" r="3" fill="currentColor" opacity="0.15" />
      <circle cx="155" cy="115" r="4" fill="currentColor" opacity="0.12" />
    </svg>
  );
}

function IllustrationNoData() {
  return (
    <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <ellipse cx="100" cy="148" rx="70" ry="10" fill="currentColor" opacity="0.06" />
      {/* Stack of cards */}
      <rect x="50" y="80" width="100" height="56" rx="10" fill="currentColor" opacity="0.08" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <rect x="58" y="68" width="100" height="56" rx="10" fill="currentColor" opacity="0.10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <rect x="66" y="55" width="100" height="60" rx="10" fill="currentColor" opacity="0.12" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      {/* Dash lines on top card */}
      <path d="M82 72h55M82 84h38M82 96h25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      {/* Decorative dots */}
      <circle cx="38" cy="72" r="5" fill="currentColor" opacity="0.18" />
      <circle cx="168" cy="88" r="4" fill="currentColor" opacity="0.15" />
    </svg>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export type EmptyStateVariant =
  | "no-jobs"
  | "no-applicants"
  | "no-messages"
  | "no-results"
  | "no-data";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
  /** Visual size — 'sm' for per-column use, 'md' for full-page sections, 'lg' for zero-state pages */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const ILLUSTRATIONS: Record<EmptyStateVariant, React.ComponentType> = {
  "no-jobs":        IllustrationNoJobs,
  "no-applicants":  IllustrationNoApplicants,
  "no-messages":    IllustrationNoMessages,
  "no-results":     IllustrationNoResults,
  "no-data":        IllustrationNoData,
};

/**
 * EmptyState
 * 
 * Branded zero-data illustration with headline, description, and optional CTA.
 * Use `size="sm"` for narrow columns (e.g. ATS Pipeline lanes),
 * `size="md"` for card-level sections, and `size="lg"` for full-page zero states.
 *
 * @example
 * <EmptyState
 *   variant="no-jobs"
 *   title="No listings yet"
 *   description="Post your first job to start receiving applications."
 *   ctaLabel="Post a Job"
 *   ctaHref="/employer/post-job"
 * />
 */
export default function EmptyState({
  variant = "no-data",
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
  size = "md",
  className,
}: EmptyStateProps) {
  const Illustration = ILLUSTRATIONS[variant];

  const containerPad = { sm: "px-4 py-6", md: "px-8 py-10", lg: "px-10 py-16" }[size];
  const illustrationSize = { sm: "w-24 h-20", md: "w-36 h-28", lg: "w-48 h-36" }[size];
  const titleSize = { sm: "text-[12px]", md: "text-sm", lg: "text-base" }[size];
  const descSize = { sm: "text-[10px]", md: "text-[11px]", lg: "text-xs" }[size];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center select-none",
        containerPad,
        className
      )}
    >
      {/* Illustration */}
      <div
        className={cn(
          "text-muted-foreground/60 mb-4 opacity-80",
          illustrationSize
        )}
      >
        <Illustration />
      </div>

      {/* Text */}
      <h3 className={cn("font-bold text-foreground mb-1 leading-snug", titleSize)}>
        {title}
      </h3>
      {description && (
        <p className={cn("text-muted-foreground leading-relaxed max-w-[240px]", descSize)}>
          {description}
        </p>
      )}

      {/* CTA */}
      {ctaLabel && (ctaHref || onCtaClick) && (
        <div className="mt-4">
          {ctaHref ? (
            <Link
              to={ctaHref}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[11px] font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              {ctaLabel} →
            </Link>
          ) : (
            <button
              onClick={onCtaClick}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-[11px] font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm"
            >
              {ctaLabel} →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
