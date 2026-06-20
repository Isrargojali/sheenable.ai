// src/components/landing/FeaturedJobs.tsx
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, SlidersHorizontal, X, UserPlus, LogIn, Sparkles, AlertCircle } from "lucide-react";
import { JobCard, type JobCardData } from "@/components/ui-kit";
import { useQuery } from "@tanstack/react-query";
import { apiJobs } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────
// Extend JobCardData with `category` — present in the API response but not
// required by JobCard's props. Intersection keeps JobCard compatibility
// while allowing the industry filter to safely read the extra field.
type Job = JobCardData & { category?: string };

// ── Constants ────────────────────────────────────────────────────────────────
const INDUSTRIES = ["All industries", "IT & Tech", "Finance", "Design & UX", "Healthcare", "Sales & Marketing"];
const TYPES = ["All types", "Remote", "Hybrid", "Onsite", "Full-time", "Part-time"];

export default function FeaturedJobs() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [type, setType] = useState(TYPES[0]);
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null); // Fix: Ln 19 — was `any`

  // Fetch real-time job listings from employers
  const { data: realJobs = [], isLoading, error } = useQuery<Job[]>({
    queryKey: ["landingFeaturedJobs", user?.id || "guest"],
    queryFn: async () => {
      const res = await apiJobs.getJobs();
      return Array.isArray(res) ? (res as Job[]) : [];
    },
    staleTime: 3 * 60 * 1000, // 3 minutes stale time - prevents multiple fetches on rapid tab shifts
  });

  // Filter real-time jobs based on search query, selected industry, and job type/mode
  const filtered = useMemo(() => {
    return realJobs.filter((j: Job) => { // Fix: Ln 75 — was `any`
      // 1. Search filter (title, company name, skills)
      if (q) {
        const queryText = `${j.title ?? ""} ${j.employer?.companyName ?? ""} ${(j.skills ?? []).join(" ")}`.toLowerCase();
        if (!queryText.includes(q.toLowerCase())) return false;
      }

      // 2. Industry filter (category)
      if (industry && industry !== INDUSTRIES[0]) {
        const jobCategory = (j.category ?? "").toLowerCase().trim();
        const filterIndustry = industry.toLowerCase().trim();

        if (jobCategory !== filterIndustry) {
          const cleanJobCategory = jobCategory.replace("&", "and").replace("-", " ").replace("  ", " ");
          const cleanFilterIndustry = filterIndustry.replace("&", "and").replace("-", " ").replace("  ", " ");

          if (
            cleanJobCategory !== cleanFilterIndustry &&
            !cleanJobCategory.includes(cleanFilterIndustry) &&
            !cleanFilterIndustry.includes(cleanJobCategory)
          ) {
            return false;
          }
        }
      }

      // 3. Job type or mode filter
      if (type && type !== TYPES[0]) {
        const cleanFilterType = type.toLowerCase().replace("-", "").replace(" ", "").trim();
        const jobType = (j.type ?? "").toLowerCase().replace("-", "").replace(" ", "").trim();
        const jobMode = (j.mode ?? "").toLowerCase().replace("-", "").replace(" ", "").trim();

        if (jobType !== cleanFilterType && jobMode !== cleanFilterType) {
          return false;
        }
      }

      return true;
    }).slice(0, 6);
  }, [realJobs, q, industry, type]);

  // Handle Apply Now button click
  const handleApplyClick = (jobId: string) => {
    const selectedJob = realJobs.find((j: Job) => j.id === jobId); // Fix: Ln 195 — was `any`
    if (!selectedJob) return;

    if (selectedJob.hasApplied) {
      toast.success("You have already applied to this job listing!");
      return;
    }

    if (user) {
      if (user.role === "CANDIDATE") {
        navigate(`/candidate/jobs?applyJobId=${jobId}`);
      } else {
        toast.error("Only candidates can apply to job listings.");
      }
    } else {
      setApplyModalJob(selectedJob);
    }
  };

  return (
    <section id="jobs" className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16 lg:py-24 bg-[var(--ink-100)] border-y border-[var(--ink-300)] relative">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
        <div>
          <div className="inline-block px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--surface)] text-[var(--ink-700)] mb-3 font-sans border border-[var(--ink-300)]">
            Featured Openings
          </div>
          <h2 className="font-sans font-semibold text-3xl md:text-5xl text-[var(--ink-900)] tracking-tight">
            Curated Opportunities for <span className="font-sans font-bold text-[var(--brand-pink)]">Trajectory Growth</span>
          </h2>
          <p className="text-[13px] text-[var(--ink-500)] mt-2 max-w-md">
            Real-time verified openings from inclusive employers, refreshed instantly.
          </p>
        </div>
        <Link
          to={user ? "/candidate/jobs" : "/auth/login"}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-[var(--brand-pink)] hover:gap-2.5 transition-all duration-200"
        >
          View all jobs <ArrowRight size={13} />
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-[var(--surface)] border border-[var(--ink-300)] rounded-xl p-3 mb-8 flex flex-wrap items-center gap-2 shadow-card">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3 h-10 rounded-xl bg-[var(--ink-100)]">
          <Search size={14} className="text-[var(--ink-500)]" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search jobs, skills, or companies"
            className="flex-1 bg-transparent text-[12px] text-[var(--ink-900)] focus:outline-none placeholder:text-[var(--ink-500)]"
            aria-label="Search jobs"
          />
        </div>
        <select
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[var(--ink-100)] text-[12px] font-medium text-[var(--ink-700)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20 cursor-pointer"
          aria-label="Industry"
        >
          {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
        </select>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="h-10 px-3 rounded-xl bg-[var(--ink-100)] text-[12px] font-medium text-[var(--ink-700)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)]/20 cursor-pointer"
          aria-label="Job type"
        >
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-[var(--brand-pink)] text-white text-[12px] font-bold hover:bg-[var(--brand-pink)]/90 press">
          <SlidersHorizontal size={13} /> Filter
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-[var(--surface)] border border-[var(--ink-300)] rounded-xl p-5 animate-pulse h-[220px] flex flex-col justify-between shadow-card">
              <div>
                <div className="flex gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-[var(--ink-100)]" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-[var(--ink-100)] rounded w-3/4" />
                    <div className="h-3 bg-[var(--ink-100)] rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-[var(--ink-100)] rounded w-1/3 mb-2" />
                <div className="h-3 bg-[var(--ink-100)] rounded w-full" />
              </div>
              <div className="h-8 bg-[var(--ink-100)] rounded-xl w-1/3 self-end" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-rose-50/20 border border-[var(--ink-300)] text-rose-800 rounded-xl p-6 text-center my-6 flex flex-col items-center justify-center max-w-lg mx-auto">
          <AlertCircle size={24} className="text-rose-500 mb-2" />
          <h3 className="font-semibold text-sm">Failed to load real-time jobs</h3>
          <p className="text-xs text-rose-600/80 mt-1">Please check your network connection or try refreshing the page.</p>
        </div>
      )}

      {/* Empty / No results state */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-16 bg-[var(--surface)] border border-dashed border-[var(--ink-300)] rounded-xl shadow-card">
          <div className="text-4xl mb-3">💼</div>
          <h3 className="font-sans text-lg text-[var(--ink-900)] font-medium">No matching jobs found</h3>
          <p className="text-xs text-[var(--ink-500)] mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or clearing the search text to see other active opportunities.
          </p>
        </div>
      )}

      {/* Jobs Grid */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filtered.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleApplyClick}
            />
          ))}
        </div>
      )}

      {/* Premium Guest Authorization Gate Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in-50 duration-200">
          <div className="bg-[var(--surface)] border border-[var(--ink-300)] w-full max-w-md rounded-xl p-6 shadow-card relative overflow-hidden animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setApplyModalJob(null)}
              className="absolute top-4 right-4 p-1.5 rounded-xl bg-[var(--ink-100)] text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--ink-300)] transition-all press"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-xl bg-[rgba(230,0,126,0.1)] text-[var(--brand-pink)] border border-[rgba(230,0,126,0.2)] flex items-center justify-center shadow-card mb-4">
                <Sparkles size={22} className="animate-spin-slow" />
              </div>

              <h3 className="font-sans font-semibold text-xl text-[var(--ink-900)]">
                Apply for {applyModalJob.title}
              </h3>
              <p className="text-[11px] text-[var(--brand-pink)] uppercase tracking-wider font-bold mt-1">
                {applyModalJob.employer?.companyName}
              </p>

              <p className="text-[12px] text-[var(--ink-500)] mt-3 leading-relaxed max-w-sm">
                Unlock inclusive and verified opportunities. Create a free account or sign in to complete your application with Pakistan's premium AI-powered platform built for women.
              </p>

              <div className="w-full space-y-2.5 mt-6">
                {/* Signup Option - For New Users */}
                <button
                  onClick={() => {
                    setApplyModalJob(null);
                    navigate(`/auth/signup?applyJobId=${applyModalJob.id}`);
                  }}
                  className="w-full h-11 rounded-xl text-[13px] font-bold text-white bg-[var(--brand-pink)] hover:bg-[var(--brand-pink)]/90 hover:-translate-y-0.5 hover:shadow-card transition-all flex items-center justify-center gap-2 press"
                >
                  <UserPlus size={15} />
                  <span>I'm a new user (Create Free Account)</span>
                </button>

                {/* Login Option - For Existing Users */}
                <button
                  onClick={() => {
                    setApplyModalJob(null);
                    navigate(`/auth/login?applyJobId=${applyModalJob.id}`);
                  }}
                  className="w-full h-11 rounded-xl text-[13px] font-bold text-[var(--brand-pink)] border border-[var(--brand-pink)]/40 hover:bg-[var(--brand-pink)]/5 hover:border-[var(--brand-pink)] hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 press"
                >
                  <LogIn size={15} />
                  <span>I already have an account (Sign In)</span>
                </button>
              </div>

              <div className="text-[10px] text-[var(--ink-500)] mt-5 flex items-center gap-1.5 justify-center">
                <span>🛡️ Premium Secure Verified Employer Listings</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
