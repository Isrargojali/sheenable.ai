// src/components/landing/FeaturedJobs.tsx
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, SlidersHorizontal, X, UserPlus, LogIn, Sparkles, AlertCircle } from "lucide-react";
import { JobCard, type JobCardData } from "@/components/ui-kit";
import { useQuery } from "@tanstack/react-query";
import { apiJobs } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { MOCK_JOBS } from "@/mock/data";

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
    placeholderData: MOCK_JOBS as Job[], // High-grade UX: Instantly displays mock jobs, fetches live data silently in background
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
    <section id="jobs" className="max-w-[1280px] mx-auto px-5 lg:px-8 py-20 lg:py-24 relative">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground mb-3 animate-pulse">
            Latest live opportunities
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight">
            Roles where you'll <span className="italic text-primary">thrive</span>
          </h2>
          <p className="text-[13px] text-muted-foreground mt-2 max-w-md">
            Real-time verified openings from inclusive employers, refreshed instantly.
          </p>
        </div>
        <Link
          to={user ? "/candidate/jobs" : "/auth/login"}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary hover:gap-2.5 transition-all duration-200"
        >
          View all jobs <ArrowRight size={13} />
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-6 flex flex-wrap items-center gap-2 shadow-soft">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3 h-10 rounded-xl bg-secondary/60">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search jobs, skills, or companies"
            className="flex-1 bg-transparent text-[12px] focus:outline-none placeholder:text-muted-foreground"
            aria-label="Search jobs"
          />
        </div>
        <select
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          className="h-10 px-3 rounded-xl bg-secondary/60 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          aria-label="Industry"
        >
          {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
        </select>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="h-10 px-3 rounded-xl bg-secondary/60 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
          aria-label="Job type"
        >
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold press">
          <SlidersHorizontal size={13} /> Filter
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-card border border-border rounded-2xl p-5 animate-pulse h-[220px] flex flex-col justify-between">
              <div>
                <div className="flex gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-secondary" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-secondary rounded w-3/4" />
                    <div className="h-3 bg-secondary rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-secondary rounded w-1/3 mb-2" />
                <div className="h-3 bg-secondary rounded w-full" />
              </div>
              <div className="h-8 bg-secondary rounded-full w-1/3 self-end" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl p-6 text-center my-6 flex flex-col items-center justify-center max-w-lg mx-auto">
          <AlertCircle size={24} className="text-rose-500 mb-2" />
          <h3 className="font-semibold text-sm">Failed to load real-time jobs</h3>
          <p className="text-xs text-rose-600/80 mt-1">Please check your network connection or try refreshing the page.</p>
        </div>
      )}

      {/* Empty / No results state */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl">
          <div className="text-4xl mb-3">💼</div>
          <h3 className="font-serif text-lg text-foreground font-medium">No matching jobs found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or clearing the search text to see other active opportunities.
          </p>
        </div>
      )}

      {/* Jobs Grid */}
      {!isLoading && !error && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="bg-card border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Corner ambient blur */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-accent/15 blur-3xl pointer-events-none" />

            <button
              onClick={() => setApplyModalJob(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all press"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-lg mb-4">
                <Sparkles size={22} className="animate-spin-slow" />
              </div>

              <h3 className="font-serif text-xl text-foreground font-semibold">
                Apply for {applyModalJob.title}
              </h3>
              {/* Fix: Ln 226 cssConflict — removed conflicting text-muted-foreground, kept text-primary */}
              <p className="text-[11px] text-primary uppercase tracking-wider font-bold mt-1">
                {applyModalJob.employer?.companyName}
              </p>

              <p className="text-[12px] text-muted-foreground mt-3 leading-relaxed max-w-sm">
                Unlock inclusive and verified opportunities. Create a free account or sign in to complete your application with Pakistan's premium AI-powered platform built for women.
              </p>

              <div className="w-full space-y-2.5 mt-6">
                {/* Signup Option - For New Users */}
                <button
                  onClick={() => {
                    setApplyModalJob(null);
                    navigate(`/auth/signup?applyJobId=${applyModalJob.id}`);
                  }}
                  className="w-full h-11 rounded-full text-[13px] font-bold text-white bg-primary hover:bg-mauve-600 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/20 transition-all flex items-center justify-center gap-2 press"
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
                  className="w-full h-11 rounded-full text-[13px] font-bold text-primary border border-primary/40 hover:bg-primary/5 hover:border-primary hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 press"
                >
                  <LogIn size={15} />
                  <span>I already have an account (Sign In)</span>
                </button>
              </div>

              <div className="text-[10px] text-muted-foreground mt-5 flex items-center gap-1.5 justify-center">
                <span>🛡️ Premium Secure Verified Employer Listings</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
