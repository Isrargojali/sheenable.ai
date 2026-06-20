import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Sparkles, AlertCircle, X, UserPlus, LogIn, ArrowRight } from "lucide-react";
import SubpageNav from "@/components/landing/SubpageNav";
import Footer from "@/components/landing/Footer";
import { JobCard, type JobCardData } from "@/components/ui-kit";
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

  useEffect(() => {
    document.title = "Explore Careers · SheEnableAI";
  }, []);

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
    <div className="min-h-screen flex flex-col bg-[#1A0D1F] text-white overflow-x-hidden">
      <SubpageNav />

      {/* Hero Section */}
      <header className="relative py-20 border-b border-white/5 overflow-hidden">
        {/* Glow blobs */}
        <div className="absolute -top-32 -right-20 w-[500px] h-[500px] rounded-full pointer-events-none opacity-40 blur-[90px]"
             style={{ background: "radial-gradient(circle,rgba(200,82,140,.20),transparent 65%)" }} />
        <div className="absolute -bottom-32 -left-20 w-[450px] h-[450px] rounded-full pointer-events-none opacity-30 blur-[80px]"
             style={{ background: "radial-gradient(circle,rgba(61,170,125,.15),transparent 65%)" }} />

        <div className="relative max-w-[1280px] mx-auto px-5 lg:px-8 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-6 bg-white/5 border border-white/10 text-white/70">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
            Direct Career Acceleration
          </div>
          <h1 className="font-serif text-4xl md:text-6xl tracking-tight leading-[1.05] mb-5">
            Curated Openings for <span className="italic text-[#22C55E]">Trajectory Growth</span>
          </h1>
          <p className="text-sm md:text-base text-white/60 max-w-xl leading-relaxed">
            Verified, high-impact careers from progressive companies committed to equitable hiring. Direct matching, safe spaces, zero compromise.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-5 lg:px-8 py-12 relative z-10">
        {/* Filter bar */}
        <div className="bg-[#0F0A1A] border border-white/5 rounded-2xl p-4 mb-8 flex flex-wrap items-center gap-3 shadow-2xl">
          <div className="flex-1 min-w-[260px] flex items-center gap-3 px-4 h-11 rounded-xl bg-white/5 border border-white/5 focus-within:border-[#22C55E]/40 transition-all duration-300">
            <Search size={15} className="text-white/40" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by titles, specific skills, or company name..."
              className="flex-1 bg-transparent text-xs text-white focus:outline-none placeholder:text-white/30"
              aria-label="Search jobs"
            />
          </div>

          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="h-11 w-full sm:w-[180px] px-4 rounded-xl bg-white/5 border border-transparent hover:bg-white/10 text-xs text-white/80 focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none cursor-pointer flex items-center justify-between transition-colors">
              <SelectValue placeholder="Industry" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F0A1A] border-none rounded-xl shadow-2xl min-w-[180px]">
              {INDUSTRIES.map(i => (
                <SelectItem
                  key={i}
                  value={i}
                  className="text-xs font-semibold text-white/80 focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2"
                >
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11 w-full sm:w-[150px] px-4 rounded-xl bg-white/5 border border-transparent hover:bg-white/10 text-xs text-white/80 focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none cursor-pointer flex items-center justify-between transition-colors">
              <SelectValue placeholder="Job Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#0F0A1A] border-none rounded-xl shadow-2xl min-w-[150px]">
              {TYPES.map(t => (
                <SelectItem
                  key={t}
                  value={t}
                  className="text-xs font-semibold text-white/80 focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2"
                >
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 py-8">
            {[1, 2, 3].map(n => (
              <div key={n} className="bg-[#0F0A1A] border border-white/5 rounded-2xl p-5 animate-pulse h-[220px] flex flex-col justify-between">
                <div>
                  <div className="flex gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-white/5" />
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-4 bg-white/5 rounded w-3/4" />
                      <div className="h-3 bg-white/5 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="h-3 bg-white/5 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
                <div className="h-8 bg-white/5 rounded-full w-1/3 self-end" />
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="bg-rose-950/20 border border-rose-900/55 text-rose-200 rounded-2xl p-6 text-center max-w-lg mx-auto flex flex-col items-center justify-center my-10">
            <AlertCircle size={26} className="text-rose-500 mb-2" />
            <h3 className="font-semibold text-sm">Failed to connect to active board</h3>
            <p className="text-xs text-rose-300/80 mt-1">Please check your internet connection or try refreshing the page.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && filtered.length === 0 && (
          <div className="text-center py-20 bg-[#0F0A1A] border border-dashed border-white/10 rounded-2xl max-w-2xl mx-auto">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="font-serif text-xl font-medium mb-1">No matching opportunities found</h3>
            <p className="text-xs text-white/50 max-w-xs mx-auto">
              Try adjusting your search criteria, clearing filters, or exploring other sectors.
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
          <div className="bg-[#0F0A1A] border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Corner ambient blur */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-[#7C3AED]/10 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-[#22C55E]/10 blur-3xl pointer-events-none" />

            <button
              onClick={() => setApplyModalJob(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 text-white/60 hover:text-white hover:bg-white/10 transition-all press"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#22C55E] flex items-center justify-center text-white shadow-lg mb-4">
                <Sparkles size={22} className="animate-pulse" />
              </div>

              <h3 className="font-serif text-xl text-white font-semibold">
                Apply for {applyModalJob.title}
              </h3>
              <p className="text-[11px] text-[#22C55E] uppercase tracking-wider font-bold mt-1">
                {applyModalJob.employer?.companyName}
              </p>

              <p className="text-[12px] text-white/60 mt-3 leading-relaxed max-w-sm">
                Unlock inclusive and verified opportunities. Create a free account or sign in to complete your application with Pakistan's premium AI-powered platform built for women.
              </p>

              <div className="w-full space-y-2.5 mt-6">
                <button
                  onClick={() => {
                    setApplyModalJob(null);
                    navigate(`/auth/signup?applyJobId=${applyModalJob.id}`);
                  }}
                  className="w-full h-11 rounded-full text-[13px] font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#5b21b6] hover:shadow-lg hover:shadow-[#7C3AED]/20 transition-all flex items-center justify-center gap-2 press"
                >
                  <UserPlus size={15} />
                  <span>I'm a new user (Create Free Account)</span>
                </button>

                <button
                  onClick={() => {
                    setApplyModalJob(null);
                    navigate(`/auth/login?applyJobId=${applyModalJob.id}`);
                  }}
                  className="w-full h-11 rounded-full text-[13px] font-bold text-[#22C55E] border border-[#22C55E]/40 hover:bg-[#22C55E]/5 hover:border-[#22C55E] transition-all flex items-center justify-center gap-2 press"
                >
                  <LogIn size={15} />
                  <span>I already have an account (Sign In)</span>
                </button>
              </div>

              <div className="text-[10px] text-white/40 mt-5 flex items-center gap-1.5 justify-center">
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
