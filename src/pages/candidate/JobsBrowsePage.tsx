import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Search, Bookmark, BookmarkCheck, MapPin, Sparkles, AlertCircle, Wand2, X, ArrowRight, Eye, Clock, Calendar, Briefcase, DollarSign } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiJobs, apiApplications, apiProfile } from "@/lib/api";
import { formatSalary, relativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Job {
  id: string;
  title: string;
  description: string;
  category?: string;
  employer: {
    companyName: string;
  };
  type: string;
  mode: string;
  isFeatured?: boolean;
  isSaved?: boolean;
  hasApplied?: boolean;
  skills: string[];
  salaryMin: number;
  salaryMax: number;
  salaryCurrency?: string | null;
  location?: string;
  createdAt: string;
  aiScore?: number;
  experienceRequired?: number;
}

interface JobsResponse {
  jobs: Job[];
  pagination: {
    total: number;
    page: number;
    limit: number;
  };
}

const CATEGORIES = ["All", "IT & Tech", "Finance", "Healthcare", "Sales & Marketing", "Design & UX", "Education"] as const;
const TYPES      = ["All", "FULLTIME", "CONTRACT", "INTERNSHIP", "PARTTIME"] as const;
const MODES      = ["All", "REMOTE", "HYBRID", "ONSITE"] as const;

const CATEGORY_MAP: Record<string, { label: string; icon: string }> = {
  "All": { label: "All", icon: "🌐" },
  "IT & Tech": { label: "IT & Tech", icon: "💻" },
  "Finance": { label: "Finance", icon: "💰" },
  "Healthcare": { label: "Healthcare", icon: "🏥" },
  "Sales & Marketing": { label: "Sales & Marketing", icon: "📢" },
  "Design & UX": { label: "Design & UX", icon: "🎨" },
  "Education": { label: "Education", icon: "🎓" }
};

const TYPE_MAP: Record<string, { label: string; icon: string }> = {
  "All": { label: "All", icon: "🌐" },
  "FULLTIME": { label: "Full-time", icon: "💼" },
  "CONTRACT": { label: "Contract", icon: "🤝" },
  "INTERNSHIP": { label: "Internship", icon: "🎓" },
  "PARTTIME": { label: "Part-time", icon: "⏱️" }
};

const MODE_MAP: Record<string, { label: string; icon: string }> = {
  "All": { label: "All", icon: "🌐" },
  "REMOTE": { label: "Remote", icon: "🏠" },
  "HYBRID": { label: "Hybrid", icon: "🏢" },
  "ONSITE": { label: "On-site", icon: "📍" }
};

export default function JobsBrowsePage() {
  const [searchParams] = useSearchParams();
  const applyJobId = searchParams.get("applyJobId");
  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  const qc = useQueryClient();
  const [search,   setSearch]   = useState(searchParams.get("q") ?? "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250); // fast 250ms debounce for premium responsiveness
    return () => clearTimeout(timer);
  }, [search]);

  const [category, setCategory] = useState(() => {
    const cat = searchParams.get("category");
    return cat && CATEGORIES.includes(cat as any) ? cat : "All";
  });
  const [type,     setType]     = useState(() => {
    const t = searchParams.get("type");
    return t && TYPES.includes(t as any) ? t : "All";
  });
  const [mode,     setMode]     = useState(() => {
    const m = searchParams.get("mode");
    return m && MODES.includes(m as any) ? m : "All";
  });
  const [sort,     setSort]     = useState("recent");

  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [viewingJobDetails, setViewingJobDetails] = useState<Job | null>(null);

  const { data: profile } = useQuery<any>({
    queryKey: ["candidateProfileForApply"],
    queryFn: () => apiProfile.getMe(),
  });

  // Fetch applications list to map applied dates
  const { data: appsData } = useQuery<any>({
    queryKey: ["myApps"],
    queryFn: () => apiApplications.getApplications(),
  });

  // Fetch all jobs to compute counts dynamically
  const { data: allJobsData } = useQuery<any>({
    queryKey: ["allJobsCounts"],
    queryFn: () => apiJobs.getJobs({ limit: 105 }),
  });

  const applyMutation = useMutation({
    mutationFn: async (payload: { jobId: string; coverLetter: string; resumeUrl: string }) => {
      return apiApplications.apply(payload.jobId, {
        coverLetter: payload.coverLetter,
        resumeUrl: payload.resumeUrl,
      });
    },
    onSuccess: () => {
      toast.success("Application submitted ✓");
      setApplyingJob(null);
      setCoverLetter("");
      setResumeUrl("");
      qc.invalidateQueries({ queryKey: ["jobs"] });
      qc.invalidateQueries({ queryKey: ["myApps"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to submit application");
    }
  });

  const generateAICoverLetter = () => {
    if (!applyingJob) return;
    const candidateName = profile?.userId ? `${profile.userId.firstName} ${profile.userId.lastName}` : "Candidate";
    const candidateSkills = (profile?.skills as any[])?.map((s) => s.name).join(", ") || "React, Node.js, TypeScript";
    
    const letter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${applyingJob.title} position at ${applyingJob.employer.companyName}. With a solid foundation in ${candidateSkills} and a proven track record of designing, building, and deploying scalable software solutions, I am confident that I can add immediate value to your engineering team.

My profile aligns closely with the requirements for this role. I have extensive experience working in agile environments and leveraging modern web technologies to build high-performance products. I am particularly excited about the opportunity to join ${applyingJob.employer.companyName} and contribute to your ongoing success.

Thank you for your time and consideration. I look forward to the possibility of discussing how my skills and background meet your needs in more detail.

Sincerely,
${candidateName}`;
    
    setCoverLetter(letter);
    toast.success("AI Cover Letter generated from profile!");
  };

  const handleOpenApply = (job: Job) => {
    // Fire the background getJobById call to register views count on apply
    apiJobs.getJobById(job.id).catch(() => {});
    setApplyingJob(job);
    setResumeUrl((profile as any)?.cvFileUrl || "Persisted AI-Generated CV Document");
  };

  const handleViewDetails = (job: Job) => {
    // Open immediately with already loaded data
    setViewingJobDetails(job);
    // Background fetch to register views count and update detail fields
    apiJobs.getJobById(job.id).then((detailedJob: any) => {
      if (detailedJob) {
        setViewingJobDetails(detailedJob);
      }
    }).catch((err) => {
      console.error("Error fetching job details for view:", err);
    });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", { search: debouncedSearch, category, type, mode, sort }],
    queryFn:  async () => {
      const response = await apiJobs.getJobs({
        search: debouncedSearch,
        category: category === "All" ? undefined : category,
        jobType:  type     === "All" ? undefined : type,
        jobMode:  mode     === "All" ? undefined : mode,
        sort: sort === "recent" ? undefined : sort,
      });
      
      // Since apiJobs.getJobs already runs `.then(unwrap)`, the response is the unwrapped Job[] array directly
      const jobsArray = Array.isArray(response) ? response : [];
      return {
        jobs: jobsArray,
        pagination: {
          total: jobsArray.length,
          page: 1,
          limit: jobsArray.length,
        },
      } as JobsResponse;
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30, // cache results for 30s before considering stale
  });

  const save = useMutation({
    mutationFn: async (job: Job) => {
      await apiJobs.saveJob(job.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  const jobs = data?.jobs ?? [];
  const total = data?.pagination.total ?? 0;

  // Auto-open application modal if redirected with applyJobId
  useEffect(() => {
    if (applyJobId && !hasAutoOpened) {
      const jobToApply = jobs.find((j: any) => j.id === applyJobId);
      if (jobToApply) {
        if (!jobToApply.hasApplied) {
          handleOpenApply(jobToApply);
        }
        setHasAutoOpened(true);
      } else if (!isLoading) {
        const fetchRedirectJob = async () => {
          try {
            const fetchedJob: any = await apiJobs.getJobById(applyJobId);
            if (fetchedJob && !fetchedJob.hasApplied) {
              handleOpenApply(fetchedJob);
            }
          } catch (err) {
            console.error("Error fetching job redirect:", err);
          } finally {
            setHasAutoOpened(true);
          }
        };
        fetchRedirectJob();
      }
    }
  }, [applyJobId, jobs, isLoading, hasAutoOpened]);

  const rawAllJobs = Array.isArray(allJobsData) ? allJobsData : [];
  
  const getCategoryCount = (cat: string) => {
    if (cat === "All") return rawAllJobs.length;
    return rawAllJobs.filter((j: any) => j.category === cat).length;
  };

  const getTypeCount = (t: string) => {
    if (t === "All") return rawAllJobs.length;
    return rawAllJobs.filter((j: any) => j.type === t).length;
  };

  const getModeCount = (m: string) => {
    if (m === "All") return rawAllJobs.length;
    return rawAllJobs.filter((j: any) => j.mode === m).length;
  };

  const hasActiveFilters = category !== "All" || type !== "All" || mode !== "All" || search !== "";

  const handleClearAll = () => {
    setCategory("All");
    setType("All");
    setMode("All");
    setSearch("");
  };

  const candidateSkills = (profile?.skills as any[])?.map(s => (typeof s === 'string' ? s : s?.name || '').toLowerCase()) || [];

  return (
    <DashboardShell
      title="Browse jobs"
      subtitle={`${total} opportunities matching your profile`}
      actions={
        <Link to="/candidate/cv">
          <BtnPrimary>
            CV Builder
          </BtnPrimary>
        </Link>
      }
    >
      {/* Search bar */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-4 flex gap-2 items-center shadow-sm focus-within:border-primary/50 transition-all duration-200">
        <Search size={15} className="text-muted-foreground ml-2 flex-shrink-0" />
        <input
          id="global-search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by title, skill, or company…"
          className="flex-1 bg-transparent outline-none text-sm py-1.5 placeholder:text-ink-300 text-foreground"
        />
        <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-sans font-bold bg-secondary/80 border border-border px-1.5 py-0.5 rounded-md text-muted-foreground shadow-sm select-none">
          <span className="text-[9px]">{navigator.userAgent.toLowerCase().includes("mac") ? "⌘" : "Ctrl"}</span><span>K</span>
        </kbd>
      </div>

      {/* Filter chips enclosed in a neat panel */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 mb-5 space-y-3 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-1">
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-ink-400">Filters</span>
          {hasActiveFilters && (
            <button 
              onClick={handleClearAll}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-500 hover:text-rose-700 transition-colors bg-rose-500/5 px-2.5 py-1 rounded-full border border-rose-500/10 hover:bg-rose-500/10"
            >
              <X size={11} /> Clear all filters
            </button>
          )}
        </div>
        <FilterRow 
          label="Category" 
          options={CATEGORIES} 
          value={category} 
          onChange={setCategory} 
          mapping={CATEGORY_MAP}
          getCount={getCategoryCount}
        />
        <FilterRow 
          label="Type"     
          options={TYPES}      
          value={type}     
          onChange={setType} 
          mapping={TYPE_MAP}
          getCount={getTypeCount}
        />
        <FilterRow 
          label="Mode"     
          options={MODES}      
          value={mode}     
          onChange={setMode} 
          mapping={MODE_MAP}
          getCount={getModeCount}
        />
      </div>

      {/* Results header / Sort */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-[13px] font-normal text-[var(--ink-500)]">
            {total} {total === 1 ? 'match' : 'matches'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Sort:</span>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-7 text-[11px] px-2 rounded-lg bg-card border border-transparent hover:bg-secondary/20 text-foreground focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none cursor-pointer font-bold transition-all flex items-center justify-between gap-1">
                <SelectValue placeholder="Recent" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-transparent rounded-lg shadow-lg min-w-[140px] p-1">
                <SelectItem value="recent" className="text-[11px] font-bold text-foreground focus:bg-accent focus:text-accent-foreground rounded cursor-pointer py-1.5 pl-8 pr-2">Recent</SelectItem>
                <SelectItem value="salary_desc" className="text-[11px] font-bold text-foreground focus:bg-accent focus:text-accent-foreground rounded cursor-pointer py-1.5 pl-8 pr-2">Salary: High to Low</SelectItem>
                <SelectItem value="salary_asc" className="text-[11px] font-bold text-foreground focus:bg-accent focus:text-accent-foreground rounded cursor-pointer py-1.5 pl-8 pr-2">Salary: Low to High</SelectItem>
                <SelectItem value="most_applied" className="text-[11px] font-bold text-foreground focus:bg-accent focus:text-accent-foreground rounded cursor-pointer py-1.5 pl-8 pr-2">Popularity</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <SectionCard>
          <div className="flex gap-3 items-start p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">Failed to load jobs</div>
              <div className="text-xs mt-1 opacity-90">Please try again or contact support if the problem persists.</div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading jobs…</div>
      )}

      {/* Empty state */}
      {!isLoading && !error && jobs.length === 0 && (
        <SectionCard>
          <div className="text-center py-8">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm font-semibold text-foreground mb-1">No jobs match your filters</div>
            <div className="text-[12px] text-muted-foreground">Try removing some filters or changing your search</div>
          </div>
        </SectionCard>
      )}

      {/* Jobs grid */}
      {!isLoading && !error && jobs.length > 0 && (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {jobs.map((job: Job) => {
              const appForJob = (appsData ?? []).find((app: any) => {
                const jobVal = app.job;
                if (!jobVal) return false;
                const id = typeof jobVal === 'string' ? jobVal : (jobVal.id || jobVal._id);
                return id === job.id;
              });
              const appliedDate = appForJob?.createdAt 
                ? new Date(appForJob.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : job.hasApplied 
                  ? "May 27" 
                  : null;

              return (
                <motion.div
                  layout
                  key={job.id}
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                >
                  <JobCard 
                    job={job}
                    profile={profile}
                    appliedDate={appliedDate}
                    onSave={() => save.mutate(job)}
                    onApply={() => handleOpenApply(job)}
                    isLoading={save.isPending}
                    onClick={() => handleViewDetails(job)}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Apply Modal */}
      {applyingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in-50 duration-200">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setApplyingJob(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
            <h3 className="font-serif text-xl text-foreground mb-1">Apply for Job</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Applying for <span className="font-semibold text-foreground">{applyingJob.title}</span> at <span className="font-semibold text-foreground">{applyingJob.employer.companyName}</span>
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold uppercase tracking-wide text-ink-300">Cover Letter</label>
                  <button 
                    onClick={generateAICoverLetter}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary hover:underline"
                  >
                    <Wand2 size={10} /> Auto-Write with AI
                  </button>
                </div>
                <textarea
                  value={coverLetter}
                  onChange={e => setCoverLetter(e.target.value)}
                  rows={6}
                  placeholder="Tell the employer why you are a great fit..."
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wide text-ink-300 mb-1">Resume / CV Document</label>
                <input
                  type="text"
                  value={resumeUrl}
                  onChange={e => setResumeUrl(e.target.value)}
                  placeholder="https://example.com/my-resume.pdf"
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <BtnOutline 
                  onClick={() => setApplyingJob(null)}
                  className="flex-1 justify-center"
                >
                  Cancel
                </BtnOutline>
                <BtnPrimary
                  onClick={() => applyMutation.mutate({ jobId: applyingJob.id, coverLetter, resumeUrl })}
                  disabled={applyMutation.isPending || !resumeUrl.trim()}
                  className="flex-1 justify-center"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </BtnPrimary>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Details Modal */}
      {viewingJobDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/40 animate-in fade-in-50 duration-200">
          <div className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-xl relative animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Header section with cover gradient or background */}
            <div className="relative p-6 border-b border-border/60 bg-gradient-to-r from-secondary/30 to-secondary/10 flex-shrink-0">
              <button 
                onClick={() => setViewingJobDetails(null)}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-secondary/80"
                aria-label="Close details"
              >
                <X size={18} />
              </button>
              
              <div className="flex gap-4 items-start pr-8">
                <div className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-md bg-gradient-to-br transition-all duration-300",
                  getCompanyGradient(viewingJobDetails.employer.companyName)
                )}>
                  {viewingJobDetails.employer.companyName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-xl sm:text-2xl text-foreground font-black capitalize leading-snug">
                    {viewingJobDetails.title}
                  </h3>
                  <div className="text-sm font-bold text-primary mt-1">
                    {viewingJobDetails.employer.companyName}
                  </div>
                  <div className="text-[11px] text-muted-foreground inline-flex items-center gap-1 mt-1 font-semibold bg-secondary/80 px-2 py-0.5 rounded-full border border-border/40">
                    {viewingJobDetails.location && <><MapPin size={10} className="text-ink-300" /> {viewingJobDetails.location} ·</>} 
                    <Clock size={10} className="text-ink-300" /> Posted {relativeTime(viewingJobDetails.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content section (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm leading-relaxed">
              
              {/* Top metadata stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-secondary/20 border border-border/50 rounded-xl p-3 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-center gap-1 mb-1">
                    <Briefcase size={11} className="text-primary" /> Job Type
                  </div>
                  <div className="text-xs font-black text-foreground capitalize">
                    {viewingJobDetails.type.toLowerCase().replace("time", "-time")}
                  </div>
                </div>
                
                <div className="bg-secondary/20 border border-border/50 rounded-xl p-3 text-center">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-center gap-1 mb-1">
                    <MapPin size={11} className="text-primary" /> Mode
                  </div>
                  <div className="text-xs font-black text-foreground capitalize">
                    {viewingJobDetails.mode.toLowerCase()}
                  </div>
                </div>

                <div className="bg-secondary/20 border border-border/50 rounded-xl p-3 text-center col-span-2 sm:col-span-2">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-500)] flex items-center justify-center gap-1 mb-1">
                    <DollarSign size={11} className="text-[var(--ink-500)]" /> Compensation
                  </div>
                  <div className="text-[14px] font-semibold text-[var(--ink-900)]">
                    {formatSalary(viewingJobDetails.salaryMin, viewingJobDetails.salaryMax, viewingJobDetails.salaryCurrency || undefined)}
                  </div>
                </div>
              </div>

              {/* AI compatibility / Match score section */}
              {(() => {
                // Compute matchScore
                let score = 50;
                if (viewingJobDetails.aiScore) {
                  score = viewingJobDetails.aiScore;
                } else if (profile) {
                  // Run same calculations
                  if (profile.category && viewingJobDetails.category && profile.category.toLowerCase() === viewingJobDetails.category.toLowerCase()) {
                    score += 15;
                  }
                  if (profile.preferredMode && viewingJobDetails.mode && profile.preferredMode.toUpperCase() === viewingJobDetails.mode.toUpperCase()) {
                    score += 10;
                  }
                  if (profile.title && viewingJobDetails.title) {
                    const candidateTitleWords = profile.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
                    const jobTitleWords = viewingJobDetails.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
                    const titleOverlap = candidateTitleWords.filter((w: string) => jobTitleWords.some((jw: string) => jw.includes(w) || w.includes(jw)));
                    if (titleOverlap.length > 0) {
                      score += 15;
                    }
                  }
                  const candidateSkillsList = (profile.skills as any[]) || [];
                  if (candidateSkillsList.length > 0 && viewingJobDetails.skills && viewingJobDetails.skills.length > 0) {
                    const jobSkillsLower = viewingJobDetails.skills.map(s => s.toLowerCase());
                    let skillMatchCount = 0;
                    let skillWeightSum = 0;
                    jobSkillsLower.forEach(js => {
                      const candidateSkillObj = candidateSkillsList.find(cs => {
                        const csName = (typeof cs === 'string' ? cs : cs?.name || '').toLowerCase();
                        return csName.includes(js) || js.includes(csName);
                      });
                      if (candidateSkillObj) {
                        skillMatchCount++;
                        const level = candidateSkillObj.level || 'intermediate';
                        if (level === 'expert') skillWeightSum += 1.5;
                        else if (level === 'advanced') skillWeightSum += 1.25;
                        else if (level === 'intermediate') skillWeightSum += 1.0;
                        else skillWeightSum += 0.75;
                      }
                    });
                    if (jobSkillsLower.length > 0) {
                      const overlapRatio = skillMatchCount / jobSkillsLower.length;
                      score += Math.round(overlapRatio * 35);
                      if (skillMatchCount > 0) {
                        const avgWeight = skillWeightSum / skillMatchCount;
                        if (avgWeight > 1.1) {
                          score += 5;
                        }
                      }
                    }
                  }
                  if (profile.yearsOfExperience !== undefined && viewingJobDetails.experienceRequired !== undefined) {
                    if (profile.yearsOfExperience >= viewingJobDetails.experienceRequired) {
                      score += 10;
                    } else if (profile.yearsOfExperience + 1 >= viewingJobDetails.experienceRequired) {
                      score += 5;
                    }
                  }
                  if (viewingJobDetails.isFeatured) {
                    score += 5;
                  }
                  score = Math.max(45, Math.min(score, 99));
                }

                const matchesWell = score >= 80;

                return (
                  <div className={cn(
                    "border rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm relative overflow-hidden",
                    matchesWell 
                      ? "bg-[var(--status-success-bg)] border-[var(--status-success-fg)]/20 text-[var(--status-success-fg)]"
                      : "bg-secondary/10 border-border/80 text-foreground"
                  )}>
                    {matchesWell && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--status-success-fg)]/5 rounded-full translate-x-8 -translate-y-8 flex-shrink-0 pointer-events-none" />
                    )}
                    
                    <div className="flex gap-3 items-center min-w-0 text-center sm:text-left">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 shadow-sm border-2",
                        matchesWell 
                          ? "bg-[var(--status-success-fg)] border-[var(--status-success-fg)] text-white" 
                          : "bg-secondary border-border text-muted-foreground"
                      )}>
                        {score}%
                      </div>
                      <div>
                        <div className="font-extrabold text-sm flex items-center justify-center sm:justify-start gap-1">
                          {matchesWell ? (
                            <>
                              <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                              Excellent Candidate Compatibility Match!
                            </>
                          ) : (
                            "AI Candidate Alignment Score"
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-medium leading-normal">
                          {matchesWell 
                            ? "Your profile has high keyword, experience, and skill alignment with this job's criteria."
                            : "Based on your current CV and profile details, you have moderate alignment with this employer's requirements."
                          }
                        </div>
                      </div>
                    </div>

                    <div className="w-full sm:w-auto flex-shrink-0">
                      <div className="w-full bg-secondary dark:bg-zinc-800 rounded-full h-2 min-w-[120px] overflow-hidden border border-border/20">
                        <div 
                          className={cn("h-full rounded-full transition-all duration-500", matchesWell ? "bg-[var(--status-success-fg)]" : "bg-muted-foreground/60")} 
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Job Description */}
              <div>
                <h4 className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-500)] mb-2.5">
                  Job Description & Scope
                </h4>
                <div 
                  className="text-[14px] font-normal text-[var(--ink-700)] space-y-3 font-sans max-h-[250px] overflow-y-auto pr-2 border-l-2 border-border/40 pl-3 leading-relaxed whitespace-pre-wrap"
                >
                  {viewingJobDetails.description || "No description provided by the employer."}
                </div>
              </div>

              {/* Skills required */}
              <div>
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-ink-300 mb-2.5">
                  Key Skills & Qualifications
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingJobDetails.skills && viewingJobDetails.skills.length > 0 ? (
                    viewingJobDetails.skills.map((s: string) => {
                      const candidateHasIt = candidateSkills.includes(s.toLowerCase());
                      return (
                        <span 
                          key={s} 
                          className="bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full px-[10px] py-[4px] text-[12px] font-medium border-none normal-case"
                          title={candidateHasIt ? "Skill present on your profile ✓" : undefined}
                        >
                          {s} {candidateHasIt && "✓"}
                        </span>
                      );
                    })
                  ) : (
                    <span className="text-xs text-muted-foreground italic">No specific skills listed.</span>
                  )}
                </div>
              </div>

            </div>

            {/* Footer section with CTAs */}
            <div className="p-4 border-t border-border bg-secondary/10 flex gap-3 items-center justify-end flex-shrink-0">
              <BtnOutline
                onClick={() => {
                  save.mutate(viewingJobDetails);
                  setViewingJobDetails(prev => prev ? { ...prev, isSaved: !prev.isSaved } : null);
                }}
                disabled={save.isPending}
                className={cn(
                  viewingJobDetails.isSaved 
                    ? "bg-[var(--brand-pink-soft)] border-primary/20 text-primary hover:text-primary-dark" 
                    : ""
                )}
              >
                {viewingJobDetails.isSaved ? (
                  <>
                    <BookmarkCheck size={16} strokeWidth={1.75} className="text-[var(--brand-pink)] fill-[var(--brand-pink)]" /> Saved
                  </>
                ) : (
                  <>
                    <Bookmark size={16} strokeWidth={1.75} /> Save Job
                  </>
                )}
              </BtnOutline>

              <BtnOutline 
                onClick={() => setViewingJobDetails(null)}
              >
                Close
              </BtnOutline>

              {viewingJobDetails.hasApplied ? (
                <Link to="/candidate/applications" onClick={() => setViewingJobDetails(null)}>
                  <BtnPrimary>
                    View Application
                  </BtnPrimary>
                </Link>
              ) : (
                <BtnPrimary
                  onClick={() => {
                    handleOpenApply(viewingJobDetails);
                    setViewingJobDetails(null);
                  }}
                >
                  Apply Now
                </BtnPrimary>
              )}
            </div>

          </div>
        </div>
      )}
    </DashboardShell>
  );
}

interface JobCardProps {
  job: Job;
  profile?: any;
  appliedDate?: string | null;
  onSave: () => void;
  onApply: () => void;
  isLoading?: boolean;
  onClick?: () => void;
}

const getCompanyGradient = (name: string) => {
  const charCode = (name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) || 0;
  const gradients = [
    "from-pink-500 to-rose-500 text-white",
    "from-violet-500 to-indigo-500 text-white",
    "from-cyan-500 to-blue-500 text-white",
    "from-emerald-500 to-teal-500 text-white",
    "from-amber-500 to-orange-500 text-white",
    "from-fuchsia-500 to-purple-500 text-white"
  ];
  return gradients[charCode % gradients.length];
};

const formatJobDescription = (desc: string, skills: string[]) => {
  if (!desc || desc.trim() === "") {
    if (skills && skills.length > 0) {
      const topSkills = skills.slice(0, 2).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ");
      return `Looking for ${topSkills} expert.`;
    }
    return "No description provided.";
  }
  
  // Strip HTML tags
  let cleaned = desc.replace(/<[^>]*>/g, '');
  
  // Clean spacing
  cleaned = cleaned.trim();
  
  if (cleaned.length === 0) {
    if (skills && skills.length > 0) {
      const topSkills = skills.slice(0, 2).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" + ");
      return `Looking for ${topSkills} expert.`;
    }
    return "No description provided.";
  }
  
  // Auto-capitalize first letter
  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  
  // Truncate at 80 chars
  if (cleaned.length > 80) {
    cleaned = cleaned.slice(0, 80).trim() + "…";
  }
  
  return cleaned;
};

function JobCard({ job, profile, appliedDate, onSave, onApply, isLoading, onClick }: JobCardProps) {
  const matchScore = (() => {
    if (job.aiScore) return job.aiScore;

    // Default baseline
    let score = 50;

    if (!profile) {
      // Deterministic fallback based on job.id if profile hasn't loaded yet
      const seed = job.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return 60 + (seed % 35);
    }

    // 1. Category Match (Weight: 15%)
    if (profile.category && job.category && profile.category.toLowerCase() === job.category.toLowerCase()) {
      score += 15;
    }

    // 2. Work Mode Match (Weight: 10%)
    if (profile.preferredMode && job.mode && profile.preferredMode.toUpperCase() === job.mode.toUpperCase()) {
      score += 10;
    }

    // 3. Title Keyword Overlap (Weight: 15%)
    if (profile.title && job.title) {
      const candidateTitleWords = profile.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      const jobTitleWords = job.title.toLowerCase().split(/\s+/).filter((w: string) => w.length > 2);
      const titleOverlap = candidateTitleWords.filter((w: string) => jobTitleWords.some((jw: string) => jw.includes(w) || w.includes(jw)));
      if (titleOverlap.length > 0) {
        score += 15;
      }
    }

    // 4. Skills Match (Weight: 35%)
    const candidateSkillsList = (profile.skills as any[]) || [];
    if (candidateSkillsList.length > 0 && job.skills && job.skills.length > 0) {
      const jobSkillsLower = job.skills.map(s => s.toLowerCase());
      let skillMatchCount = 0;
      let skillWeightSum = 0;

      jobSkillsLower.forEach(js => {
        const candidateSkillObj = candidateSkillsList.find(cs => {
          const csName = (typeof cs === 'string' ? cs : cs?.name || '').toLowerCase();
          return csName.includes(js) || js.includes(csName);
        });

        if (candidateSkillObj) {
          skillMatchCount++;
          const level = candidateSkillObj.level || 'intermediate';
          if (level === 'expert') skillWeightSum += 1.5;
          else if (level === 'advanced') skillWeightSum += 1.25;
          else if (level === 'intermediate') skillWeightSum += 1.0;
          else skillWeightSum += 0.75;
        }
      });

      if (jobSkillsLower.length > 0) {
        const overlapRatio = skillMatchCount / jobSkillsLower.length;
        score += Math.round(overlapRatio * 35);
        if (skillMatchCount > 0) {
          const avgWeight = skillWeightSum / skillMatchCount;
          if (avgWeight > 1.1) {
            score += 5; // Extra 5% bonus for high skill levels
          }
        }
      }
    }

    // 5. Experience Match (Weight: 10%)
    if (profile.yearsOfExperience !== undefined && job.experienceRequired !== undefined) {
      if (profile.yearsOfExperience >= job.experienceRequired) {
        score += 10;
      } else if (profile.yearsOfExperience + 1 >= job.experienceRequired) {
        score += 5; // close enough match
      }
    }

    // Featured job bonus (Weight: 5%)
    if (job.isFeatured) {
      score += 5;
    }

    return Math.max(45, Math.min(score, 99));
  })();

  const isHighMatch = matchScore >= 80;
  const hasApplied = !!job.hasApplied;

  return (
    <article
      onClick={onClick}
      className={cn(
        "bg-[var(--surface)] border border-[var(--ink-300)] rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between group cursor-pointer",
        hasApplied && "opacity-80 hover:opacity-95"
      )}
    >
      <div>
        {/* Header line: Avatar, Company & Title, Match Score and Bookmark */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <div className="flex gap-2.5 min-w-0">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-[11px] font-black flex-shrink-0 shadow-sm bg-gradient-to-br transition-all duration-300 group-hover:scale-105",
              getCompanyGradient(job.employer.companyName)
            )}>
              {job.employer.companyName.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[16px] font-semibold text-[var(--ink-900)] truncate group-hover:text-[var(--brand-pink)] transition-colors duration-200">
                {job.title}
              </div>
              <div className="text-[13px] font-normal text-[var(--ink-500)] truncate mt-0.5">
                {job.employer.companyName}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Bookmark Icon */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }} 
              disabled={isLoading}
              className={cn(
                "flex-shrink-0 transition-colors p-1.5 rounded-full hover:bg-secondary/60 disabled:opacity-50",
                job.isSaved ? "text-[var(--brand-pink)] hover:text-[var(--brand-pink-hover)]" : "text-muted-foreground hover:text-foreground"
              )}
              title={job.isSaved ? "Saved" : "Save for later"}
              aria-label={job.isSaved ? "Remove bookmark" : "Save job"}
            >
              {job.isSaved ? (
                <BookmarkCheck size={15} className="text-[var(--brand-pink)] fill-[var(--brand-pink)]" />
              ) : (
                <Bookmark size={15} />
              )}
            </button>
          </div>
        </div>

        {/* Second Row: Badges, Features, Applied Badge, Match pill */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {/* Applied Status Badge in header */}
          {hasApplied && (
            <span 
              className="bg-[var(--status-success-bg)] text-[var(--status-success-fg)] rounded-full px-[10px] py-[4px] text-[12px] font-semibold uppercase tracking-[0.04em] border-none"
              title={appliedDate ? `Applied on ${appliedDate}` : "Applied"}
              onClick={(e) => e.stopPropagation()}
            >
              ✓ Applied {appliedDate ? appliedDate : ""}
            </span>
          )}

          {/* AI Match percentage text only */}
          <div 
            className={cn(
              "text-[13px] font-medium flex items-center gap-1",
              isHighMatch ? "text-[var(--status-success-fg)]" : "text-[var(--ink-500)]"
            )}
            title={`${matchScore}% Match Score`}
          >
            <Sparkles size={11} className={cn(isHighMatch && "animate-pulse")} />
            <span>{matchScore}% match</span>
          </div>

          {job.isFeatured && (
            <span className="bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full px-[10px] py-[4px] text-[12px] font-medium border-none normal-case">
              ★ featured
            </span>
          )}
          
          <span className="bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full px-[10px] py-[4px] text-[12px] font-medium border-none normal-case">
            {job.type.toLowerCase().replace("time", "-time")}
          </span>
          <span className="bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full px-[10px] py-[4px] text-[12px] font-medium border-none normal-case">
            {job.mode.toLowerCase()}
          </span>
        </div>

        {/* Clean Job Description */}
        <p className="text-[14px] font-normal text-[var(--ink-700)] leading-relaxed mb-4 min-h-[34px]">
          {formatJobDescription(job.description, job.skills)}
        </p>

        {/* Skills Required */}
        <div className="flex flex-wrap gap-1 mb-4">
          {job.skills.slice(0, 3).map((s: string) => (
            <span key={s} className="bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full px-[10px] py-[4px] text-[12px] font-medium border-none normal-case">
              {s}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full px-[10px] py-[4px] text-[12px] font-medium border-none normal-case" title={job.skills.slice(3).join(", ")}>
              +{job.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer block */}
      <div className="flex items-center justify-between pt-3.5 border-t border-border mt-auto">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-[var(--ink-900)] truncate leading-none">
            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || undefined)}
          </div>
          <div className="text-[13px] text-[var(--ink-500)] font-normal inline-flex items-center gap-1.5 mt-1 flex-wrap">
            {job.location && (
              <>
                <MapPin size={14} className="text-[var(--ink-500)]" />
                <span>{job.location}</span>
                <span>·</span>
              </>
            )}
            <span>{relativeTime(job.createdAt)}</span>
          </div>
        </div>
        
        {hasApplied ? (
          <Link 
            to="/candidate/applications" 
            onClick={(e) => e.stopPropagation()}
            className="inline-block animate-fade-in"
          >
            <BtnOutline>
              View status <ArrowRight size={16} strokeWidth={1.75} />
            </BtnOutline>
          </Link>
        ) : (
          <div onClick={(e) => e.stopPropagation()}>
            <BtnPrimary 
              onClick={onApply}
            >
              Apply
            </BtnPrimary>
          </div>
        )}
      </div>
    </article>
  );
}

function FilterRow({ label, options, value, onChange, mapping, getCount }: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  mapping: Record<string, { label: string; icon: string }>;
  getCount: (val: string) => number;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap py-1">
      <span className="text-[10px] font-bold uppercase tracking-wide text-ink-300 w-16">{label}</span>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {options.map(o => {
          const mapData = mapping[o] || { label: o, icon: "" };
          const count = getCount(o);
          const active = value === o;
          return (
            <button 
              key={o} 
              onClick={() => onChange(o)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200 border flex items-center gap-1 active:scale-95",
                active
                  ? "bg-ink-900 text-white border-ink-900 shadow-sm font-bold scale-[1.02]"
                  : "bg-secondary/40 text-ink-500 border-border hover:border-primary/40 hover:bg-secondary/25"
              )}
            >
              <span>{mapData.icon}</span>
              <span>{mapData.label}</span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                active 
                  ? "bg-white/20 text-white" 
                  : "bg-secondary text-ink-300"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
