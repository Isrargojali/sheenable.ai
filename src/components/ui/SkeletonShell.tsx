// src/components/ui/SkeletonShell.tsx
// Shared skeleton shimmer primitives — used across all 3 dashboards.
// Each component mirrors the visual geometry of the real card it replaces.
import { cn } from "@/lib/utils";

/** Raw shimmer block — use for any rectangular placeholder */
export function SkeletonBox({
  className,
}: {
  className?: string;
}) {
  return <div className={cn("skeleton rounded-token-md", className)} />;
}

/** One stat card placeholder (icon circle + big number + label) */
function SkeletonStatCard() {
  return (
    <div className="bg-card border border-border rounded-token-lg p-5 flex flex-col gap-3 overflow-hidden">
      {/* top row: icon + badge */}
      <div className="flex items-start justify-between">
        <SkeletonBox className="w-10 h-10 rounded-token-md flex-shrink-0" />
        <SkeletonBox className="w-16 h-5 rounded-full" />
      </div>
      {/* number */}
      <SkeletonBox className="w-14 h-9 mt-2 rounded-token-md" />
      {/* label */}
      <SkeletonBox className="w-24 h-3 rounded-full" />
      {/* sub-label */}
      <SkeletonBox className="w-32 h-2.5 rounded-full" />
    </div>
  );
}

/** Grid of stat card placeholders */
export function SkeletonStat({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

/** Single table/list row placeholder (avatar + text lines + pill) */
function SkeletonRowItem() {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-border last:border-0">
      {/* avatar */}
      <SkeletonBox className="w-9 h-9 rounded-full flex-shrink-0" />
      {/* text block */}
      <div className="flex-1 space-y-2 min-w-0">
        <SkeletonBox className="w-36 h-3 rounded-full" />
        <SkeletonBox className="w-24 h-2.5 rounded-full" />
      </div>
      {/* pill badge */}
      <SkeletonBox className="w-14 h-5 rounded-full flex-shrink-0" />
      {/* number */}
      <SkeletonBox className="w-8 h-5 rounded-token-md flex-shrink-0 hidden sm:block" />
    </div>
  );
}

/** Vertical list of row placeholders inside a SectionCard */
export function SkeletonRow({ count = 5, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("overflow-hidden", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRowItem key={i} />
      ))}
    </div>
  );
}

/** Full card placeholder: header + rows */
export function SkeletonCard({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-token-lg overflow-hidden">
          {/* card header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <SkeletonBox className="w-32 h-4 rounded-full" />
            <SkeletonBox className="w-16 h-7 rounded-token-md" />
          </div>
          {/* card body rows */}
          <div className="p-4 space-y-3">
            <SkeletonBox className="w-full h-3 rounded-full" />
            <SkeletonBox className="w-5/6 h-3 rounded-full" />
            <SkeletonBox className="w-3/4 h-3 rounded-full" />
          </div>
          {/* card footer */}
          <div className="px-4 pb-4 flex gap-2">
            <SkeletonBox className="w-20 h-7 rounded-token-md" />
            <SkeletonBox className="w-16 h-7 rounded-token-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Hero stat card skeleton (the large violet profile-views card) */
export function SkeletonHeroStat({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-token-lg p-6 flex flex-col justify-between gap-4 overflow-hidden",
        "bg-gradient-to-br from-violet-200/40 to-indigo-200/40 dark:from-violet-900/30 dark:to-indigo-900/30",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <SkeletonBox className="w-11 h-11 rounded-token-md" />
        <SkeletonBox className="w-20 h-5 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <SkeletonBox className="w-16 h-12 rounded-token-md" />
        <SkeletonBox className="w-24 h-3 rounded-full mt-1" />
        <SkeletonBox className="w-40 h-2.5 rounded-full" />
      </div>
    </div>
  );
}

/** Service health card skeleton (Admin dashboard) */
export function SkeletonServiceCard({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-token-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="w-8 h-8 rounded-token-md" />
            <SkeletonBox className="w-16 h-5 rounded-full" />
          </div>
          <SkeletonBox className="w-28 h-3.5 rounded-full" />
          <div className="space-y-1.5">
            <SkeletonBox className="w-full h-2 rounded-full" />
            <SkeletonBox className="w-4/5 h-2 rounded-full" />
          </div>
          <div className="flex gap-2">
            <SkeletonBox className="w-16 h-5 rounded-full" />
            <SkeletonBox className="w-12 h-5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Inline text-line skeleton (for within-card loading) */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  const widths = ["w-full", "w-5/6", "w-4/5", "w-3/4", "w-2/3"];
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBox
          key={i}
          className={cn("h-3 rounded-full", widths[i % widths.length])}
        />
      ))}
    </div>
  );
}
