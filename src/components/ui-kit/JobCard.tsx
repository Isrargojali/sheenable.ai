// src/components/ui-kit/JobCard.tsx
// Universal job listing card — used on landing, jobs browse, and dashboards.
import { Bookmark, MapPin, Sparkles, BadgeCheck } from "lucide-react";
import { TagPill, type TagVariant } from "./TagPill";
import { cn, formatSalary, relativeTime, initials, getCompanyGradient } from "@/lib/utils";

export interface JobCardData {
  id: string;
  title: string;
  description?: string;
  mode?: "REMOTE" | "HYBRID" | "ONSITE";
  type?: "FULLTIME" | "PARTTIME" | "CONTRACT" | "INTERNSHIP";
  location?: string | null;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  isSaved?: boolean;
  hasApplied?: boolean;
  aiScore?: number;
  createdAt?: string;
  employer: {
    companyName: string;
    logoUrl?: string | null;
    isVerified?: boolean;
  };
}

interface Props {
  job: JobCardData;
  onSave?: (id: string) => void;
  onApply?: (id: string) => void;
  className?: string;
}

const MODE_VARIANT: Record<NonNullable<JobCardData["mode"]>, TagVariant> = {
  REMOTE: "remote", HYBRID: "hybrid", ONSITE: "onsite",
};
const TYPE_VARIANT: Record<NonNullable<JobCardData["type"]>, TagVariant> = {
  FULLTIME: "fulltime", PARTTIME: "parttime", CONTRACT: "contract", INTERNSHIP: "internship",
};

export function JobCard({ job, onSave, onApply, className }: Props) {
  return (
    <article className={cn(
      "bg-[var(--surface)] border border-[var(--ink-300)] rounded-xl p-6 shadow-card relative overflow-hidden flex flex-col justify-between min-h-[260px]",
      className,
    )}>
      {/* corner accent - removed gradient background for spec conformity */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[var(--ink-100)] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        <header className="relative flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Prominent Logo */}
            {job.employer.logoUrl ? (
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-[var(--ink-100)] border border-[var(--ink-300)] flex items-center justify-center flex-shrink-0">
                <img 
                  src={job.employer.logoUrl} 
                  alt={`${job.employer.companyName} logo`} 
                  className="w-full h-full object-cover" 
                />
              </div>
            ) : (
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black text-white uppercase font-display flex-shrink-0 bg-gradient-to-br shadow-sm",
                getCompanyGradient(job.employer.companyName)
              )}>
                {initials(job.employer.companyName)}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold text-[var(--ink-900)] leading-tight truncate">
                {job.title}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-[var(--ink-500)] mt-0.5">
                <span className="truncate">{job.employer.companyName}</span>
                {job.employer.isVerified && (
                  <BadgeCheck size={11} className="text-[var(--ink-700)] flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => onSave?.(job.id)}
            aria-label={job.isSaved ? "Unsave job" : "Save job"}
            className="p-1.5 rounded-xl hover:bg-[var(--ink-100)] press text-[var(--ink-500)] hover:text-[var(--ink-900)] flex-shrink-0"
          >
            <Bookmark size={14} className={cn(job.isSaved && "fill-[var(--ink-900)] text-[var(--ink-900)]")} />
          </button>
        </header>

        {/* meta line */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
          {job.mode && <TagPill variant={MODE_VARIANT[job.mode]} />}
          {job.type && <TagPill variant={TYPE_VARIANT[job.type]} />}
          {job.location && (
            <span className="inline-flex items-center gap-1 text-[10px] text-[var(--ink-500)]">
              <MapPin size={10} /> {job.location}
            </span>
          )}
        </div>

        {/* Hero Salary */}
        {(job.salaryMin || job.salaryMax) && (
          <div className="mt-1 mb-4">
            <span className="text-[9px] text-[var(--ink-500)] block uppercase tracking-wider font-semibold font-sans mb-0.5">Estimated Salary</span>
            <div className="text-[18px] font-semibold text-[var(--ink-900)] tracking-tight leading-none font-sans">
              {formatSalary(job.salaryMin, job.salaryMax)}
            </div>
          </div>
        )}

        {/* skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {job.skills.slice(0, 3).map(s => (
              <TagPill key={s} variant="skill">{s}</TagPill>
            ))}
            {job.skills.length > 3 && (
              <TagPill variant="neutral">+{job.skills.length - 3}</TagPill>
            )}
          </div>
        )}
      </div>

      <footer className="flex items-center justify-between pt-3 border-t border-[var(--ink-300)] mt-auto">
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--ink-500)]">
          {job.aiScore != null && (
            <span className="inline-flex items-center gap-1 font-semibold text-[var(--ink-700)]">
              <Sparkles size={10} /> {job.aiScore}% match
            </span>
          )}
          {job.createdAt && <span>· {relativeTime(job.createdAt)}</span>}
        </div>
        <button
          onClick={() => onApply?.(job.id)}
          disabled={job.hasApplied}
          className={cn(
            "h-[22px] px-3 rounded-full text-[10px] font-bold tracking-wide press transition-all duration-200 flex items-center justify-center",
            job.hasApplied
              ? "bg-[var(--ink-100)] text-[var(--ink-500)] border border-[var(--ink-300)] cursor-not-allowed"
              : "bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 hover:-translate-y-0.5 hover:shadow-card"
          )}
        >
          {job.hasApplied ? "Applied" : "Apply Now"}
        </button>
      </footer>
    </article>
  );
}
