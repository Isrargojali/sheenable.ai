import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, SlidersHorizontal, X, UserPlus, LogIn, Sparkles, AlertCircle } from "lucide-react";
import { JobCard, type JobCardData } from "@/components/ui-kit";
import { useQuery } from "@tanstack/react-query";
import { apiJobs } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [debouncedQ, setDebouncedQ] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [type, setType] = useState(TYPES[0]);
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  // Fetch real-time job listings from employers with query filters
  const { data: realJobs = [], isLoading, error } = useQuery<Job[]>({
    queryKey: ["landingFeaturedJobs", user?.id || "guest", debouncedQ, industry, type],
    queryFn: async () => {
      const params: any = { limit: 12 };
      if (debouncedQ.trim()) params.search = debouncedQ.trim();
      if (industry && industry !== INDUSTRIES[0]) params.category = industry;
      if (type && type !== TYPES[0]) {
        const cleanType = type.toUpperCase().replace("-", "");
        if (["REMOTE", "HYBRID", "ONSITE"].includes(cleanType)) {
          params.jobMode = cleanType;
        } else {
          params.jobType = cleanType;
        }
      }
      const res = await apiJobs.getJobs(params);
      return Array.isArray(res) ? (res as Job[]) : [];
    },
    staleTime: 30 * 1000,
  });

  const handleFilterClick = () => {
    const targetUrl = user ? "/candidate/jobs" : "/jobs";
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (industry && industry !== INDUSTRIES[0]) params.set("category", industry);
    if (type && type !== TYPES[0]) {
      const cleanType = type.toUpperCase().replace("-", "");
      if (["REMOTE", "HYBRID", "ONSITE"].includes(cleanType)) {
        params.set("mode", cleanType);
      } else {
        params.set("type", cleanType);
      }
    }
    navigate(`${targetUrl}?${params.toString()}`);
  };

  // The slice limit is applied to the API results
  const filtered = useMemo(() => {
    return realJobs.slice(0, 6);
  }, [realJobs]);

  // Handle Apply Now button click
  const handleApplyClick = (jobId: string) => {
    const selectedJob = realJobs.find((j: Job) => j.id === jobId);
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
    <section id="jobs" className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16 lg:py-24 bg-[var(--ink-100)] relative">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
        <div>
          <div className="inline-block px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--surface)] text-[var(--ink-700)] mb-3 font-sans border border-[var(--ink-300)]">
            Featured Openings
          </div>
          <h2 className="font-sans font-semibold text-[28px] lg:text-[40px] text-[var(--ink-900)] tracking-tight">
            Curated Opportunities for <span className="font-sans font-bold text-[var(--brand-pink)]">Trajectory Growth</span>
          </h2>
          <p className="text-[13px] text-[var(--ink-500)] mt-4 max-w-md">
            Real-time verified openings from inclusive employers, refreshed instantly.
          </p>
        </div>
        <Link
          to={user ? "/candidate/jobs" : "/auth/login"}
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--ink-500)] underline hover:text-[var(--brand-pink)] transition-all duration-200"
        >
          View all jobs <ArrowRight size={13} />
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-[var(--surface)] border border-[var(--ink-300)] rounded-xl p-2 mb-8 flex flex-wrap items-center gap-2 shadow-card">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3 h-11 rounded-xl bg-[var(--ink-100)]">
          <Search size={14} className="text-[var(--ink-500)]" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search jobs, skills, or companies"
            className="flex-1 bg-transparent text-[13px] text-[var(--ink-500)] focus:outline-none placeholder:text-[var(--ink-500)]"
            aria-label="Search jobs"
          />
        </div>
        <Select value={industry} onValueChange={setIndustry}>
          <SelectTrigger className="h-11 w-full sm:w-[180px] px-3.5 rounded-xl bg-[var(--ink-100)] border border-transparent hover:bg-[var(--ink-300)]/40 text-[13px] font-semibold text-[var(--ink-700)] focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none cursor-pointer transition-colors duration-200">
            <SelectValue placeholder="Industry" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--surface)] border border-transparent rounded-xl shadow-card min-w-[180px] p-1">
            {INDUSTRIES.map(i => (
              <SelectItem
                key={i}
                value={i}
                className="text-[13px] font-semibold text-[var(--ink-700)] focus:bg-[var(--ink-100)] focus:text-[var(--ink-900)] rounded-lg cursor-pointer py-2 pl-8 pr-2"
              >
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="h-11 w-full sm:w-[150px] px-3.5 rounded-xl bg-[var(--ink-100)] border border-transparent hover:bg-[var(--ink-300)]/40 text-[13px] font-semibold text-[var(--ink-700)] focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none cursor-pointer transition-colors duration-200">
            <SelectValue placeholder="Job Type" />
          </SelectTrigger>
          <SelectContent className="bg-[var(--surface)] border border-transparent rounded-xl shadow-card min-w-[150px] p-1">
            {TYPES.map(t => (
              <SelectItem
                key={t}
                value={t}
                className="text-[13px] font-semibold text-[var(--ink-700)] focus:bg-[var(--ink-100)] focus:text-[var(--ink-900)] rounded-lg cursor-pointer py-2 pl-8 pr-2"
              >
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={handleFilterClick}
          className="inline-flex items-center gap-1.5 h-11 px-6 rounded-xl bg-[var(--brand-pink)] text-white text-[15px] font-semibold hover:bg-[var(--brand-pink)]/90 press"
        >
          <SlidersHorizontal size={13} /> Filter
        </button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-y-8 py-8">
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-y-8">
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
              <div className="w-12 h-12 rounded-xl bg-[var(--ink-100)] text-[var(--ink-900)] border border-[var(--ink-300)] flex items-center justify-center shadow-card mb-4">
                <Sparkles size={22} className="animate-spin-slow" />
              </div>

              <h3 className="font-sans font-semibold text-xl text-[var(--ink-900)]">
                Apply for {applyModalJob.title}
              </h3>
              <p className="text-[11px] text-[var(--ink-700)] uppercase tracking-wider font-bold mt-1">
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
