// src/pages/candidate/JobsBrowsePage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Bookmark, BookmarkCheck, MapPin, Sparkles } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { apiJobs } from "@/lib/api";
import { formatSalary, relativeTime, cn } from "@/lib/utils";

const CATEGORIES = ["All", "IT & Tech", "Finance", "Healthcare", "Sales & Marketing", "Design & UX", "Education"];
const TYPES      = ["All", "FULLTIME", "CONTRACT", "INTERNSHIP", "PARTTIME"];
const MODES      = ["All", "REMOTE", "HYBRID", "ONSITE"];

export default function JobsBrowsePage() {
  const qc = useQueryClient();
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState("All");
  const [type,     setType]     = useState("All");
  const [mode,     setMode]     = useState("All");
  const [sort,     setSort]     = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["jobs", { search, category, type, mode, sort }],
    queryFn:  () => apiJobs.getJobs({
      search,
      category: category === "All" ? undefined : category,
      type:     type     === "All" ? undefined : type,
      mode:     mode     === "All" ? undefined : mode,
      sort,
    }),
  });

  const save = useMutation({
    mutationFn: apiJobs.toggleSave,
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["jobs"] }),
  });

  const jobs = data?.jobs ?? [];

  return (
    <DashboardShell
      title="Browse jobs"
      subtitle={`${data?.pagination.total ?? 0} opportunities matching your profile`}
    >
      {/* Search bar */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-4 flex gap-2 items-center">
        <Search size={15} className="text-muted-foreground ml-2 flex-shrink-0" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, skill, or company…"
          className="flex-1 bg-transparent outline-none text-sm py-1.5 placeholder:text-ink-300"
        />
        <select value={sort} onChange={e => setSort(e.target.value)}
                className="text-[11px] border border-border rounded-lg px-2 py-1.5 bg-background outline-none focus:border-primary">
          <option value="">Most recent</option>
          <option value="salary_desc">Salary high → low</option>
          <option value="salary_asc">Salary low → high</option>
          <option value="most_applied">Most applied</option>
        </select>
      </div>

      {/* Filter chips */}
      <div className="space-y-2 mb-5">
        <FilterRow label="Category" options={CATEGORIES} value={category} onChange={setCategory} />
        <FilterRow label="Type"     options={TYPES}      value={type}     onChange={setType} />
        <FilterRow label="Mode"     options={MODES}      value={mode}     onChange={setMode} />
      </div>

      {/* Results */}
      {isLoading && (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading jobs…</div>
      )}
      {!isLoading && jobs.length === 0 && (
        <SectionCard>
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm font-semibold text-foreground mb-1">No jobs match your filters</div>
            <div className="text-[12px] text-muted-foreground">Try removing some filters or changing your search</div>
          </div>
        </SectionCard>
      )}

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {jobs.map((job: any) => (
          <article key={job.id}
                   className={cn(
                     "bg-card border rounded-2xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                     job.isFeatured ? "border-primary/40" : "border-border hover:border-primary/30"
                   )}>
            <div className="flex justify-between items-start gap-2 mb-3">
              <div className="flex gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-[11px] font-bold text-muted-foreground flex-shrink-0">
                  {job.employer.companyName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-foreground truncate">{job.title}</div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">{job.employer.companyName}</div>
                </div>
              </div>
              <button onClick={() => save.mutate(job.id)} className="text-muted-foreground hover:text-primary flex-shrink-0">
                {job.isSaved ? <BookmarkCheck size={16} className="text-primary fill-primary" /> : <Bookmark size={16} />}
              </button>
            </div>

            <div className="flex flex-wrap gap-1 mb-3">
              {job.isFeatured && (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent text-accent-foreground inline-flex items-center gap-1">
                  <Sparkles size={9} /> FEATURED
                </span>
              )}
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{job.type}</span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700">{job.mode}</span>
            </div>

            <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{job.description}</p>

            <div className="flex flex-wrap gap-1 mb-3">
              {job.skills.slice(0, 3).map((s: string) => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-ink-500 font-semibold">{s}</span>
              ))}
              {job.skills.length > 3 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-ink-300 font-semibold">+{job.skills.length - 3}</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <div className="text-[12px] font-bold text-emerald-600">{formatSalary(job.salaryMin, job.salaryMax)}</div>
                <div className="text-[10px] text-ink-300 inline-flex items-center gap-1 mt-0.5">
                  {job.location && <><MapPin size={9} /> {job.location} ·</>} {relativeTime(job.createdAt)}
                </div>
              </div>
              <BtnPrimary>{job.hasApplied ? "Applied" : "Apply"}</BtnPrimary>
            </div>
          </article>
        ))}
      </div>
    </DashboardShell>
  );
}

function FilterRow({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-bold uppercase tracking-wide text-ink-300 w-16">{label}</span>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all border",
                  value === o
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-ink-500 border-border hover:border-primary/40"
                )}>
          {o}
        </button>
      ))}
    </div>
  );
}
