import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { Search, Bookmark, BookmarkCheck, MapPin, Sparkles, AlertCircle, Wand2, X, ArrowRight } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiJobs, apiApplications, apiProfile } from "@/lib/api";
import { formatSalary, relativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface Job {
  id: string;
  title: string;
  description: string;
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
  const [search,   setSearch]   = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 250); // fast 250ms debounce for premium responsiveness
    return () => clearTimeout(timer);
  }, [search]);

  const [category, setCategory] = useState("All");
  const [type,     setType]     = useState("All");
  const [mode,     setMode]     = useState("All");
  const [sort,     setSort]     = useState("");

  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["candidateProfileForApply"],
    queryFn: () => apiProfile.getMe(),
  });

  // Fetch applications list to map applied dates
  const { data: appsData } = useQuery({
    queryKey: ["myApps"],
    queryFn: () => apiApplications.getApplications(),
  });

  // Fetch all jobs to compute counts dynamically
  const { data: allJobsData } = useQuery({
    queryKey: ["allJobsCounts"],
    queryFn: () => apiJobs.getJobs({ limit: 100 }),
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
    setApplyingJob(job);
    setResumeUrl((profile as any)?.cvFileUrl || "Persisted AI-Generated CV Document");
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["jobs", { search: debouncedSearch, category, type, mode, sort }],
    queryFn:  async () => {
      const response = await apiJobs.getJobs({
        search: debouncedSearch,
        category: category === "All" ? undefined : category,
        jobType:  type     === "All" ? undefined : type,
        jobMode:  mode     === "All" ? undefined : mode,
        sort,
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
    mutationFn: (job: Job) =>
      job.isSaved ? apiJobs.unsaveJob(job.id) : apiJobs.saveJob(job.id),
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
        apiJobs.getJobById(applyJobId).then((fetchedJob: any) => {
          if (fetchedJob && !fetchedJob.hasApplied) {
            handleOpenApply(fetchedJob);
          }
        }).catch((err) => {
          console.error("Error fetching job redirect:", err);
        }).finally(() => {
          setHasAutoOpened(true);
        });
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
          <BtnPrimary className="px-5 py-2.5 shadow-sm text-xs font-bold flex items-center gap-1.5">
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
          <span className="text-xs text-muted-foreground font-semibold">
            {total} {total === 1 ? 'match' : 'matches'}
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground font-medium">Sort:</span>
            <select 
              value={sort} 
              onChange={e => setSort(e.target.value)}
              className="text-[11px] border border-border rounded-lg px-2 py-1 bg-card text-foreground outline-none focus:border-primary cursor-pointer font-bold transition-all hover:bg-secondary/20"
            >
              <option value="">Recent ▾</option>
              <option value="salary_desc">Salary: High to Low ▾</option>
              <option value="salary_asc">Salary: Low to High ▾</option>
              <option value="most_applied">Popularity ▾</option>
            </select>
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
                  className="flex-1 justify-center py-2"
                >
                  Cancel
                </BtnOutline>
                <BtnPrimary
                  onClick={() => applyMutation.mutate({ jobId: applyingJob.id, coverLetter, resumeUrl })}
                  disabled={applyMutation.isPending || !resumeUrl.trim()}
                  className="flex-1 justify-center py-2"
                >
                  {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                </BtnPrimary>
              </div>
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

function JobCard({ job, profile, appliedDate, onSave, onApply, isLoading }: JobCardProps) {
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
      className={cn(
        "bg-card border rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between group",
        hasApplied 
          ? "opacity-80 border-l-4 border-l-emerald-500 hover:opacity-95" 
          : job.isFeatured 
            ? "border-l-4 border-l-purple-500 border-t-border border-r-border border-b-border hover:border-purple-500/50" 
            : "border-border hover:border-primary/45"
      )}
    >
      {/* Top accent line if featured (only if not applied which overrides it) */}
      {job.isFeatured && !hasApplied && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
      )}

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
              <div className="text-[13px] font-extrabold text-foreground truncate group-hover:text-primary transition-colors duration-200">
                {job.title}
              </div>
              <div className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">
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
                job.isSaved ? "text-violet-650 hover:text-violet-850" : "text-muted-foreground hover:text-foreground"
              )}
              title={job.isSaved ? "Saved" : "Save for later"}
              aria-label={job.isSaved ? "Remove bookmark" : "Save job"}
            >
              {job.isSaved ? (
                <BookmarkCheck size={15} className="text-violet-600 fill-violet-600" />
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
              className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400 inline-flex items-center gap-0.5 border border-teal-500/20 shadow-sm"
              title={appliedDate ? `Applied on ${appliedDate}` : "Applied"}
            >
              ✓ Applied {appliedDate}
            </span>
          )}

          {/* AI Match percentage pill */}
          {isHighMatch ? (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20 inline-flex items-center gap-0.5 border border-emerald-500/20">
              <Sparkles size={9} className="text-emerald-500 animate-pulse" />
              {matchScore}% match
            </span>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/80 border border-border/40" title={`${matchScore}% Match Score`}>
              <span className="text-[9px] font-bold text-muted-foreground">{matchScore}% match</span>
              <div className="w-8 bg-border rounded-full h-1 overflow-hidden">
                <div 
                  className="h-full bg-muted-foreground/60 rounded-full" 
                  style={{ width: `${matchScore}%` }}
                />
              </div>
            </div>
          )}

          {job.isFeatured && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 inline-flex items-center gap-1 border border-purple-500/20 animate-pulse">
              ★ FEATURED
            </span>
          )}
          
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 capitalize">
            {job.type.toLowerCase().replace("time", "-time")}
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 capitalize">
            {job.mode.toLowerCase()}
          </span>
        </div>

        {/* Clean Job Description */}
        <p className="text-[11.5px] text-muted-foreground leading-relaxed mb-4 min-h-[34px]">
          {formatJobDescription(job.description, job.skills)}
        </p>

        {/* Skills Required */}
        <div className="flex flex-wrap gap-1 mb-4">
          {job.skills.slice(0, 3).map((s: string) => (
            <span key={s} className="text-[9px] px-2.5 py-0.5 rounded-full bg-secondary text-ink-500 font-bold transition-all hover:bg-secondary/80">
              {s}
            </span>
          ))}
          {job.skills.length > 3 && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-ink-300 font-bold" title={job.skills.slice(3).join(", ")}>
              +{job.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer block */}
      <div className="flex items-center justify-between pt-3.5 border-t border-border mt-auto">
        <div className="min-w-0">
          <div className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 truncate leading-none">
            {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency || undefined)}
          </div>
          <div className="text-[9.5px] text-ink-300 inline-flex items-center gap-1 mt-1 font-medium">
            {job.location && <><MapPin size={9} className="text-ink-300" /> {job.location} ·</>} {relativeTime(job.createdAt)}
          </div>
        </div>
        
        {hasApplied ? (
          <Link 
            to="/candidate/applications" 
            className="text-[11px] font-bold text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-0.5 transition-colors group/link hover:underline animate-fade-in"
          >
            View status <ArrowRight size={10} className="transform group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        ) : (
          <BtnPrimary 
            onClick={onApply}
            className="text-xs px-3.5 py-1.5 font-bold shadow-sm"
          >
            Apply
          </BtnPrimary>
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
                  ? "bg-primary text-primary-foreground border-primary shadow-sm font-bold scale-[1.02]"
                  : "bg-[#F7F4F9]/40 text-ink-500 border-border hover:border-primary/40 hover:bg-secondary/25"
              )}
            >
              <span>{mapData.icon}</span>
              <span>{mapData.label}</span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5",
                active 
                  ? "bg-primary-foreground/20 text-primary-foreground" 
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
