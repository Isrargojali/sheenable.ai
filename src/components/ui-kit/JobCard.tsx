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

export function JobCard({ job, onSave, onApply, className }: Props) {
  return (
    <article className={cn(
      "group bg-card border border-border rounded-2xl p-5 lift relative overflow-hidden",
      className,
    )}>
      {/* corner accent */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-mauve-50 opacity-0 group-hover:opacity-100 transition-opacity" />

      <header className="relative flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-mauve-100 to-mauve-50 flex items-center justify-center text-[12px] font-bold text-primary flex-shrink-0">
            {initials(job.employer.companyName)}
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
          className="p-1.5 rounded-lg hover:bg-secondary press text-muted-foreground hover:text-primary"
        >
          <Bookmark size={14} className={cn(job.isSaved && "fill-primary text-primary")} />
        </button>
      </header>

      {/* meta line */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        {job.mode && <TagPill variant={MODE_VARIANT[job.mode]} />}
        {job.type && <TagPill variant={TYPE_VARIANT[job.type]} />}
        {job.location && (
          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
            <MapPin size={10} /> {job.location}
          </span>
        )}
      </div>

      {/* salary */}
      {(job.salaryMin || job.salaryMax) && (
        <div className="text-[13px] font-bold text-mint-600 mb-3">
          {formatSalary(job.salaryMin, job.salaryMax)}
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

      <footer className="flex items-center justify-between pt-3 border-t border-border">
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
          className="px-3 py-1.5 rounded-full text-[11px] font-bold border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground press"
        >
          {job.hasApplied ? "Applied" : "Apply Now"}
        </button>
      </footer>
    </article>
  );
}
