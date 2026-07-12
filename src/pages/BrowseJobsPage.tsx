import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Sparkles, AlertCircle, X, UserPlus, LogIn, Calendar } from "lucide-react";
import SubpageNav from "@/components/landing/SubpageNav";
import Footer from "@/components/landing/Footer";
import { JobCard, type JobCardData } from "@/components/ui-kit";
import { apiJobs } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import useSEO from "@/hooks/useSEO";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Job = JobCardData & { category?: string };

const INDUSTRIES = ["All industries", "IT & Tech", "Finance", "Healthcare", "Sales & Marketing", "Design & UX", "Education"];
const TYPES = ["All types", "Remote", "Hybrid", "Onsite", "Full-time", "Part-time"];

export default function BrowseJobsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [industry, setIndustry] = useState(() => {
    const cat = searchParams.get("category");
    return cat && INDUSTRIES.includes(cat) ? cat : INDUSTRIES[0];
  });
  const [type, setType] = useState(() => {
    const urlMode = searchParams.get("mode")?.toLowerCase();
    const urlType = searchParams.get("type")?.toLowerCase();
    if (urlMode === "remote") return "Remote";
    if (urlMode === "hybrid") return "Hybrid";
    if (urlMode === "onsite") return "Onsite";
    if (urlType === "fulltime" || urlType === "full-time") return "Full-time";
    if (urlType === "parttime" || urlType === "part-time") return "Part-time";
    return TYPES[0];
  });
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);

  // Fetch real-time job listings from the database
  const { data: realJobs = [], isLoading, error } = useQuery<Job[]>({
    queryKey: ["publicBrowseJobs"],
    queryFn: async () => {
      const res = await apiJobs.getJobs();
      return Array.isArray(res) ? (res as Job[]) : [];
    },
    staleTime: 3 * 60 * 1000,
  });

  // Filter real-time jobs based on search query, selected industry, and job type/mode
  const filtered = useMemo(() => {
    return realJobs.filter((j: Job) => {
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
    });
  }, [realJobs, q, industry, type]);

  useSEO({
    title: "Find Jobs for Women in Pakistan | Verified Openings — SheEnableAI",
    description: "Browse curated job openings for women in Pakistan. Verified, bias-free employers. Filter by city, salary, and remote options. Apply in one click.",
    schema: {
      "@context": "https://schema.org",
      "@graph": filtered.slice(0, 5).map(job => ({
        "@type": "JobPosting",
        "title": job.title,
        "description": job.description || job.title,
        "hiringOrganization": {
          "@type": "Organization",
          "name": job.employer?.companyName || "Verified Employer"
        },
        "jobLocation": {
          "@type": "Place",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": job.location || "Pakistan",
            "addressCountry": "PK"
          }
        },
        "baseSalary": {
          "@type": "MonetaryAmount",
          "currency": "PKR",
          "value": {
            "@type": "QuantitativeValue",
            "minValue": job.salaryMin || 50000,
            "maxValue": job.salaryMax || 150000,
            "unitText": "MONTH"
          }
        },
        "employmentType": job.type === "FULLTIME" ? "FULL_TIME" : "PART_TIME",
        "datePosted": new Date(job.createdAt || Date.now()).toISOString().split('T')[0]
      }))
    }
  });

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
    <div className="min-h-screen flex flex-col bg-[var(--surface-muted)] text-[var(--ink-700)]">
      <SubpageNav />

      {/* Hero Section */}
      <header className="relative py-20 bg-[var(--surface-dark)] text-white border-b border-white/5 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none opacity-40 blur-[90px]"
             style={{ background: "radial-gradient(circle,rgba(233,30,140,.15),transparent 65%)" }} />
        <div className="absolute -bottom-32 -left-20 w-[450px] h-[450px] rounded-full pointer-events-none opacity-30 blur-[80px]"
             style={{ background: "radial-gradient(circle,rgba(233,30,140,.10),transparent 65%)" }} />

        <div className="relative max-w-[1280px] mx-auto px-5 lg:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 bg-white/5 border border-white/10 text-[var(--on-dark-secondary)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-pink)]" />
            Verified openings — updated daily
          </div>
          <h1 className="font-serif text-4xl md:text-6xl tracking-tight leading-[1.05] mb-5 text-white">
            Verified Job Openings for <span className="italic text-[var(--brand-pink)]">Women Across Pakistan</span>
          </h1>
          <p className="text-sm md:text-base text-[var(--on-dark-secondary)] max-w-xl leading-relaxed">
            Every listing is reviewed by our team. Every employer is vetted for inclusive hiring practices.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 max-w-[1280px] w-full mx-auto px-5 lg:px-8 py-12 relative z-10 outline-none">
        {/* Filter bar */}
        <div className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-2xl p-4 mb-8 flex flex-wrap items-center gap-3 shadow-card">
          <div className="flex-1 min-w-[260px] flex items-center gap-3 px-4 h-11 rounded-xl bg-white border border-[var(--ink-300)] focus-within:border-[var(--brand-pink)]/50 focus-within:ring-2 focus-within:ring-[var(--brand-pink)]/10 transition-all duration-300">
            <Search size={15} className="text-[var(--ink-500)]" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by role, skill, or company name..."
              className="flex-1 bg-transparent text-xs text-[var(--ink-900)] focus:outline-none placeholder:text-[var(--ink-500)]"
              aria-label="Search jobs"
            />
          </div>

          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="h-11 w-full sm:w-[180px] px-4 rounded-xl bg-white border border-[var(--ink-300)] hover:bg-[var(--ink-100)] text-xs text-[var(--ink-700)] focus:ring-2 focus:ring-[var(--brand-pink)]/10 focus:outline-none shadow-none cursor-pointer flex items-center justify-between transition-colors">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-[var(--ink-200)] rounded-xl shadow-2xl min-w-[180px]">
              {INDUSTRIES.map(i => (
                <SelectItem
                  key={i}
                  value={i}
                  className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-soft)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2"
                >
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11 w-full sm:w-[150px] px-4 rounded-xl bg-white border border-[var(--ink-300)] hover:bg-[var(--ink-100)] text-xs text-[var(--ink-700)] focus:ring-2 focus:ring-[var(--brand-pink)]/10 focus:outline-none shadow-none cursor-pointer flex items-center justify-between transition-colors">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-[var(--ink-200)] rounded-xl shadow-2xl min-w-[150px]">
              {TYPES.map(t => (
                <SelectItem
                  key={t}
                  value={t}
                  className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-soft)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2"
                >
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* SEO Paragraph */}
        <div className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-2xl p-6 mb-8 text-xs text-[var(--ink-700)] leading-relaxed shadow-sm">
          SheEnableAI lists verified job openings for women across Pakistan's major cities — Karachi, Lahore, Islamabad, Rawalpindi, and beyond. Every employer on our platform has been reviewed for inclusive hiring practices. Filter by remote, hybrid, or onsite. Roles span software engineering, product management, UX design, finance, HR, and executive leadership. New listings added daily.
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-sm font-bold text-[var(--ink-900)]">
            {filtered.length} roles match your profile
          </h2>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-2xl p-5 animate-pulse h-[220px] flex flex-col justify-between">
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
                <div className="h-8 bg-[var(--ink-100)] rounded-full w-1/3 self-end" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-6 text-center max-w-lg mx-auto flex flex-col items-center justify-center my-10">
            <AlertCircle size={26} className="text-rose-500 mb-2" />
            <h3 className="font-semibold text-sm">Failed to connect to active board</h3>
            <p className="text-xs text-rose-700/80 mt-1">Please check your internet connection or try refreshing the page.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-20 bg-[var(--surface)] border border-dashed border-[var(--ink-300)] rounded-2xl max-w-2xl mx-auto">
            <Calendar size={36} className="text-[var(--ink-400)] mx-auto mb-2 animate-pulse" />
            <h3 className="font-serif text-xl font-medium mb-1 text-[var(--ink-900)]">No matching opportunities found</h3>
            <p className="text-xs text-[var(--ink-500)] max-w-sm mx-auto leading-relaxed">
              No roles found for that search. Try broadening your filters or check back tomorrow — we add new verified listings daily.
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
      </main>

      {/* Guest Gate Modal */}
      {applyModalJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in-50 duration-200">
          <div className="bg-white border border-[var(--ink-200)] w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200 text-[var(--ink-700)]">
            {/* Corner ambient blur */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[var(--brand-pink-soft)]/50 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-[var(--brand-pink-soft)]/30 blur-3xl pointer-events-none" />

            <button
              onClick={() => setApplyModalJob(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[var(--ink-100)] text-[var(--ink-500)] hover:text-[var(--ink-900)] hover:bg-[var(--ink-200)] transition-all press"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--brand-pink)] to-[var(--brand-pink-hover)] flex items-center justify-center text-white shadow-lg mb-4">
                <Sparkles size={22} className="animate-pulse" />
              </div>

              <h3 className="font-serif text-xl text-[var(--ink-900)] font-semibold">
                Apply for {applyModalJob.title}
              </h3>
              <p className="text-[11px] text-[var(--brand-pink)] uppercase tracking-wider font-bold mt-1">
                {applyModalJob.employer?.companyName}
              </p>

              <p className="text-[12px] text-[var(--ink-500)] mt-3 leading-relaxed max-w-sm">
                Unlock inclusive and verified opportunities. Create a free account or sign in to complete your application with Pakistan's premium AI-powered platform built for women.
              </p>

              <div className="w-full space-y-2.5 mt-6">
                <button
                  onClick={() => {
                    setApplyModalJob(null);
                    navigate(`/auth/signup?applyJobId=${applyModalJob.id}`);
                  }}
                  className="w-full h-11 rounded-full text-[13px] font-bold text-white bg-gradient-to-r from-[var(--brand-pink)] to-[var(--brand-pink-hover)] hover:shadow-lg hover:shadow-[var(--brand-pink)]/20 transition-all flex items-center justify-center gap-2 press"
                >
                  <UserPlus size={15} />
                  <span>I'm a new user (Create Free Account)</span>
                </button>

                <button
                  onClick={() => {
                    setApplyModalJob(null);
                    navigate(`/auth/login?applyJobId=${applyModalJob.id}`);
                  }}
                  className="w-full h-11 rounded-full text-[13px] font-bold text-[var(--brand-pink)] border border-[var(--brand-pink)]/40 hover:bg-[var(--brand-pink-soft)] hover:border-[var(--brand-pink)] transition-all flex items-center justify-center gap-2 press"
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

      <Footer />
    </div>
  );
}
