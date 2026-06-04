// src/components/ui-kit/JobCard.tsx
// Universal job listing card — used on landing, jobs browse, and dashboards.
import { Bookmark, MapPin, Sparkles, BadgeCheck } from "lucide-react";
import { TagPill, type TagVariant } from "./TagPill";
import { cn, formatSalary, relativeTime, initials } from "@/lib/utils";

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

const TYPE_BORDER: Record<NonNullable<JobCardData["type"]>, string> = {
  FULLTIME: "border-l-[4px] border-l-primary/60",
  PARTTIME: "border-l-[4px] border-l-primary/40",
  CONTRACT: "border-l-[4px] border-l-foreground/30",
  INTERNSHIP: "border-l-[4px] border-l-primary/25",
};

export function JobCard({ job, onSave, onApply, className }: Props) {
  const borderClass = job.type ? TYPE_BORDER[job.type] : "border-l-[4px] border-l-primary/30";

  return (
    <article className={cn(
      "group bg-card border border-border rounded-2xl p-5 lift relative overflow-hidden flex flex-col justify-between min-h-[260px]",
      borderClass,
      className,
    )}>
      {/* corner accent */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-accent/30 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        <header className="relative flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Prominent Logo */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-secondary border border-border flex items-center justify-center flex-shrink-0">
              {job.employer.logoUrl ? (
                <img 
                  src={job.employer.logoUrl} 
                  alt={`${job.employer.companyName} logo`} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-[11px] font-black text-primary font-display">
                  {initials(job.employer.companyName)}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold text-foreground leading-tight truncate">
                {job.title}
              </h3>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                <span className="truncate">{job.employer.companyName}</span>
                {job.employer.isVerified && (
                  <BadgeCheck size={11} className="text-mint-500 flex-shrink-0" />
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => onSave?.(job.id)}
            aria-label={job.isSaved ? "Unsave job" : "Save job"}
            className="p-1.5 rounded-lg hover:bg-secondary press text-muted-foreground hover:text-primary flex-shrink-0"
          >
            <Bookmark size={14} className={cn(job.isSaved && "fill-primary text-primary")} />
          </button>
        </header>

        {/* meta line */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
          {job.mode && <TagPill variant={MODE_VARIANT[job.mode]} />}
          {job.type && <TagPill variant={TYPE_VARIANT[job.type]} />}
          {job.location && (
            <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
              <MapPin size={10} /> {job.location}
            </span>
          )}
        </div>

        {/* Hero Salary */}
        {(job.salaryMin || job.salaryMax) && (
          <div className="mt-1 mb-4">
            <span className="text-[9px] text-muted-foreground/75 block uppercase tracking-wider font-black font-sans mb-0.5">Estimated Salary</span>
            <div className="text-[18px] font-black text-foreground tracking-tight leading-none font-sans">
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

      <footer className="flex items-center justify-between pt-3 border-t border-border mt-auto">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          {job.aiScore != null && (
            <span className="inline-flex items-center gap-1 font-semibold text-primary">
              <Sparkles size={10} /> {job.aiScore}% match
            </span>
          )}
          {job.createdAt && <span>· {relativeTime(job.createdAt)}</span>}
        </div>
        <button
          onClick={() => onApply?.(job.id)}
          disabled={job.hasApplied}
          className={cn(
            "px-4 py-1.5 rounded-full text-[11px] font-black tracking-wide press transition-all duration-200",
            job.hasApplied
              ? "bg-secondary text-muted-foreground border border-border/60 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/95 hover:-translate-y-0.5 hover:shadow-elev1"
          )}
        >
          {job.hasApplied ? "Applied" : "Apply Now"}
        </button>
      </footer>
    </article>
  );
}
