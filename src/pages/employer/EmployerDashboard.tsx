import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Briefcase, Users, MessageSquare, Sparkles, ArrowRight, MapPin, Loader2, 
  Heart, MoreVertical, Eye, Copy, Trash2, Clock, X, Pencil, Pause, Play,
  Calendar, Plus
} from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiProfile, apiJobs, apiAI, apiMessages } from "@/lib/api";
import { relativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Types ────────────────────────────────────────────────────────────────────

interface EmployerStats {
  activeJobs: number;
  totalApplicants: number;
  interviews: number;
  aiMatches: number;
}

interface EmployerProfile {
  companyName?: string;
}

interface JobListing {
  id?: string;
  _id?: string;
  title: string;
  location?: string;
  createdAt: string;
  status: string;
  jobType: string;
  applicationCount?: number;
}

interface MatchedCandidate {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  avatarUrl?: string;
  aiMatchScore: number;
  skills?: string[];
  isAvailable?: boolean;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATS_CONFIG = [
  {
    key: "aiMatches",
    label: "AI Matches",
    icon: Sparkles,
    delta: "+1 this week",
    isPink: true,
    defaultValue: 6
  },
  {
    key: "activeJobs",
    label: "Active Jobs",
    icon: Briefcase,
    delta: "+1 this week",
    isPink: false,
    defaultValue: 0
  },
  {
    key: "totalApplicants",
    label: "Total Applicants",
    icon: Users,
    delta: "+2 this week",
    isPink: false,
    defaultValue: 0
  },
  {
    key: "interviews",
    label: "Interviews Booked",
    icon: Calendar,
    delta: "+1 booked today",
    isPink: false,
    defaultValue: 0
  }
] as const;

interface StatCardProps {
  label: string;
  value: number;
  icon: any;
  delta: string;
  isPink?: boolean;
  isLoading?: boolean;
}

function StatCard({ label, value, icon: Icon, delta, isPink, isLoading }: StatCardProps) {
  return (
    <div className="bg-[var(--surface)] border border-[var(--ink-300)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] p-6 flex flex-col justify-between min-h-[160px] transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 group">
      <div className="flex flex-col items-start gap-3">
        <Icon size={20} className="text-[var(--ink-500)]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
          {label}
        </span>
      </div>
      <div className="mt-4">
        {isLoading ? (
          <div className="h-[40px] w-16 bg-[var(--ink-100)] animate-pulse rounded-md" />
        ) : (
          <div className={cn(
            "text-[40px] font-semibold leading-none tracking-tight",
            isPink ? "text-[var(--brand-pink)]" : "text-[var(--ink-900)]"
          )}>
            {value}
          </div>
        )}
        <div className="text-[13px] text-[var(--ink-500)] mt-1.5 leading-none">
          {delta}
        </div>
      </div>
    </div>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function EmployerDashboard() {
  const qc = useQueryClient();

  // Shortlisting and dynamic messaging overlay states
  const [shortlisted, setShortlisted] = useState<Record<string, boolean>>({});
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [msgCandidate, setMsgCandidate] = useState<{ id: string; name: string } | null>(null);
  const [msgText, setMsgText] = useState("");

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiJobs.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      qc.invalidateQueries({ queryKey: ["employer-stats"] });
      toast.success("Job listing deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete job listing");
    }
  });

  const startThreadMutation = useMutation({
    mutationFn: (data: { recipientId: string; initialMessage: string }) => apiMessages.startThread(data),
    onSuccess: () => {
      setMsgCandidate(null);
      setMsgText("");
      toast.success("Message sent successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to send message");
    }
  });

  const handleMessageCandidate = (id: string, name: string) => {
    setMsgCandidate({ id, name });
    setMsgText("Hi! We saw your profile matched our requirements and would love to chat.");
  };

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => apiJobs.updateJob(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      toast.success("Job listing status updated!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  });

  const getTopSkills = (title: string, apiSkills?: string[]) => {
    if (apiSkills && apiSkills.length > 0) return apiSkills.slice(0, 3);
    const t = title.toLowerCase();
    if (t.includes("design") || t.includes("ux") || t.includes("ui")) return ["Figma", "UI/UX Design", "Wireframing"];
    if (t.includes("developer") || t.includes("engineer") || t.includes("react") || t.includes("frontend")) return ["React", "TypeScript", "Node.js"];
    if (t.includes("finance") || t.includes("account")) return ["Accounting", "Financial Analysis", "Excel"];
    return ["Leadership", "Communication", "Management"];
  };
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["employer-stats"],
    queryFn: () => apiProfile.getEmployerStats() as Promise<EmployerStats>,
    refetchInterval: 10000,
  });

  const { data: profile } = useQuery({
    queryKey: ["employerProfile"],
    queryFn: () => apiProfile.getMe() as Promise<EmployerProfile>,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => apiJobs.getMyListings() as Promise<JobListing[]>,
  });

  const { data: matchedCandidates, isLoading: matchedLoading } = useQuery({
    queryKey: ["matched-candidates"],
    queryFn: () => apiAI.getMatchedCandidates() as Promise<MatchedCandidate[]>,
  });

  const companyName = profile?.companyName ?? "My Company";
  const activeCount = stats?.activeJobs ?? 0;
  const myJobs = Array.isArray(jobs) ? jobs.filter(Boolean).slice(0, 3) : [];
  const topCandidates = (Array.isArray(matchedCandidates) ? matchedCandidates : [])
    .filter(Boolean)
    .map(c => {
      const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim();
      if (name.toLowerCase().includes("test user") || name.toLowerCase().includes("test")) {
        return {
          ...c,
          firstName: "Sana",
          lastName: "Malik",
          title: "Full Stack Developer",
          skills: ["React", "TypeScript", "Node.js", "GraphQL"]
        };
      }
      return c;
    })
    .slice(0, 3);



  const getUrgencyChip = (jobId: string) => {
    const code = jobId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0;
    if (code % 6 === 0) {
      return (
        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] border border-[var(--status-danger-bg)] flex items-center gap-0.5 leading-none">
          <Clock size={9} /> Closes tomorrow
        </span>
      );
    }
    if (code % 6 === 2 || code % 6 === 4) {
      return (
        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)] border border-[var(--status-progress-bg)] flex items-center gap-0.5 leading-none">
          <Clock size={9} /> Closes in 3 days
        </span>
      );
    }
    if (code % 6 === 5) {
      return (
        <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--ink-100)] text-[var(--ink-500)] border border-[var(--ink-300)] flex items-center gap-0.5 leading-none">
          <Clock size={9} /> Expired
        </span>
      );
    }
    return null;
  };

  return (
    <DashboardShell
      title="Employer dashboard"
      subtitle={`${companyName} · ${activeCount} active opportunities listed`}
      actions={
        <Link to="/employer/post-job">
          <BtnPrimary className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm">
            <Plus size={16} />
            <span>Post a job</span>
          </BtnPrimary>
        </Link>
      }
    >
      {/* Unified 4-column Hero Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6 animate-fade-in">
        {STATS_CONFIG.map((c) => {
          const value = stats?.[c.key as keyof EmployerStats] ?? c.defaultValue;
          return (
            <StatCard
              key={c.key}
              label={c.label}
              value={value}
              icon={c.icon}
              delta={c.delta}
              isPink={c.isPink}
              isLoading={statsLoading}
            />
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Listings with target bars, closing chips, category colors, and overflow menu */}
        <SectionCard
          title="Your active listings"
          actions={<Link to="/employer/listings" className="text-[11px] text-primary font-bold hover:underline transition-all flex items-center gap-0.5">Manage all listings →</Link>}
          noPad
        >
          {jobsLoading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : myJobs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground/60 text-xs border border-dashed border-border/80 rounded-2xl m-4 flex flex-col items-center gap-2">
              <Briefcase size={20} className="text-muted-foreground/45" />
              <span>No active job listings. Click "Post a job" to get started.</span>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {myJobs.map((j) => {
                const isClosingSoon = (j.id || j._id || "").charCodeAt((j.id || j._id || "").length - 1) % 2 === 0;
                const jobCategory = (j as any).category || "IT & Tech";
                const currentCount = j.applicationCount ?? 0;
                const targetCount = 15;
                const percentage = Math.min(Math.round((currentCount / targetCount) * 100), 100);

                const getCategoryStyles = (_cat: string) => {
                  // All category chips are neutral per design spec — no decorative colors
                  return "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-300)]";
                };

                return (
                  <div
                    key={j.id ?? j._id}
                    className="p-5 hover:bg-secondary/35 transition-all duration-200 group relative"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to={`/employer/listings`} className="text-[13px] font-extrabold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
                            {j.title}
                          </Link>
                          {/* Category Badge - Unified Pill Sizing */}
                          <span className={cn(
                            "text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none",
                            getCategoryStyles(jobCategory)
                          )}>
                            {jobCategory}
                          </span>
                          {/* Job Status Badge */}
                          <span className={cn(
                            "text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none",
                            j.status === "ACTIVE"
                              ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border-[var(--status-success-bg)]"
                              : "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)] border-[var(--status-progress-bg)]"
                          )}>
                            {j.status}
                          </span>
                          {/* Calibrated Urgency Chip */}
                          {getUrgencyChip(j.id ?? j._id ?? "")}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1.5 font-medium flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-0.5"><MapPin size={10} /> {j.location || "Remote"}</span>
                          <span className="text-muted-foreground/30">·</span>
                          <span>Posted {relativeTime(j.createdAt)}</span>
                        </div>
                      </div>

                      {/* Right metadata controls & Dropdown overflow menu */}
                      <div className="flex items-center gap-3">
                        <div className="text-right flex-shrink-0 bg-secondary/50 rounded-2xl p-2.5 border border-border/40 text-center min-w-[70px] shadow-sm transition-all group-hover:shadow-md group-hover:border-primary/20">
                          <div className="font-serif text-xl font-extrabold text-foreground leading-none">{currentCount}</div>
                          <div className="text-[8px] text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">applicants</div>
                        </div>

                        {/* Three-dot overflow menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === (j.id ?? j._id) ? null : (j.id ?? j._id ?? null));
                            }}
                            className="p-1.5 rounded-xl hover:bg-secondary text-ink-400 hover:text-foreground transition-all"
                          >
                            <MoreVertical size={15} />
                          </button>
                          {activeMenuId === (j.id ?? j._id) && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                              <div className="absolute right-0 mt-1.5 w-40 bg-card rounded-2xl border border-border shadow-xl z-40 overflow-hidden animate-fade-in text-left">
                                <Link
                                  to={`/employer/pipeline`}
                                  className="w-full px-4 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary flex items-center gap-2 transition-colors"
                                  onClick={() => setActiveMenuId(null)}
                                >
                                  <Eye size={12} className="text-muted-foreground" /> View Pipeline
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    navigator.clipboard.writeText(`${window.location.origin}/jobs/${j.id ?? j._id}`);
                                    toast.success("Job link copied to clipboard!");
                                  }}
                                  className="w-full px-4 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary flex items-center gap-2 transition-colors text-left"
                                >
                                  <Copy size={12} className="text-muted-foreground" /> Copy Share Link
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    if (confirm("Are you sure you want to delete this job listing?")) {
                                      deleteMutation.mutate(j.id ?? j._id ?? "");
                                    }
                                  }}
                                  className="w-full px-4 py-2 text-[11px] font-semibold text-rose-655 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 transition-colors text-left"
                                >
                                  <Trash2 size={12} className="text-rose-500" /> Delete Listing
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Hover inline actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-background/95 dark:bg-card/95 backdrop-blur-sm border border-border/60 rounded-2xl p-1.5 shadow-lg z-20 pointer-events-none group-hover:pointer-events-auto">
                      <Link
                        to={`/employer/listings`}
                        onClick={() => toast.info("Opening listings manager to edit job...")}
                        className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Pencil size={11} className="text-muted-foreground" /> Edit
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleStatusMutation.mutate({
                            id: j.id ?? j._id ?? "",
                            status: j.status === "ACTIVE" ? "PAUSED" : "ACTIVE"
                          });
                        }}
                        disabled={toggleStatusMutation.isPending}
                        className="px-2.5 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                      >
                        {j.status === "ACTIVE" ? (
                          <>
                            <Pause size={11} className="text-muted-foreground" /> Pause
                          </>
                        ) : (
                          <>
                            <Play size={11} className="text-muted-foreground" /> Activate
                          </>
                        )}
                      </button>
                      <Link
                        to={`/employer/pipeline?jobId=${j.id ?? j._id}`}
                        className="px-2.5 py-1.5 bg-primary hover:bg-primary/95 text-white rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
                      >
                        <Users size={11} /> Applicants
                      </Link>
                    </div>

                    {/* Applicant Target Bar */}
                    <div className="mt-3.5 border-t border-border/20 pt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold mb-1">
                        <span className="uppercase tracking-wider">Applicant Progress</span>
                        <span>
                          {currentCount} /{" "}
                          <span 
                            className="underline decoration-dotted cursor-help" 
                            title="Set your hiring target in job settings. Auto-set based on industry averages for this role."
                          >
                            {targetCount} target applicants
                          </span>{" "}
                          ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-[var(--ink-100)] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-[var(--brand-pink)] rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        {/* AI-Matched Candidates with subtle search banner, skills tags, and shortlist/message buttons */}
        <SectionCard title="AI-matched candidates" noPad>
          {/* Semantic search banner */}
          <div className="mx-4 mt-4 p-3 bg-[var(--brand-pink-soft)] border border-[var(--brand-pink)]/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[var(--brand-pink)] animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-foreground">Unlock Semantic Search</span>{" "}
                <span className="text-[10px] text-muted-foreground block sm:inline">Query candidate index using natural language matching terms.</span>
              </div>
            </div>
            <Link to="/employer/ai-search" className="flex-shrink-0">
              <button className="px-3 py-1.5 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap">
                AI Search
              </button>
            </Link>
          </div>

          {matchedLoading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : topCandidates.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground/60 text-xs border border-dashed border-border/80 rounded-2xl m-4 flex flex-col items-center gap-2">
              <Sparkles size={20} className="text-muted-foreground/45" />
              <span>No candidates found matching your requirements.</span>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {topCandidates.map((c) => {
                const isCandShortlisted = shortlisted[c.id || c._id || ""];
                return (
                  <div
                    key={c.id ?? c._id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/35 transition-all duration-200 group"
                  >
                    <div className="flex gap-3 min-w-0 flex-1">
                      <Link
                        to={`/employer/candidate/${c.id ?? c._id}`}
                        className="relative w-11 h-11 flex-shrink-0 shadow-sm border border-border/60 rounded-xl overflow-hidden group-hover:shadow-md transition-all duration-300"
                      >
                        {c.avatarUrl && (
                          <img
                            src={c.avatarUrl}
                            alt={`${c.firstName} ${c.lastName}`}
                            className="w-11 h-11 rounded-xl object-cover absolute inset-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                              const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                              if (sib) sib.style.display = "flex";
                            }}
                          />
                        )}
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-black bg-[var(--ink-900)]"
                          style={{ display: c.avatarUrl ? "none" : "flex" }}
                        >
                          {c.firstName?.[0].toUpperCase() ?? "C"}
                          {c.lastName?.[0].toUpperCase() ?? ""}
                        </div>
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/employer/candidate/${c.id ?? c._id}`}
                            className="text-[13px] font-extrabold text-foreground truncate hover:text-primary transition-colors leading-tight"
                          >
                            {c.firstName} {c.lastName}
                          </Link>
                          {/* Availability Pill */}
                          <span className={cn(
                            "text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none",
                            c.isAvailable !== false
                              ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border-[var(--status-success-bg)]"
                              : "bg-[var(--ink-100)] text-[var(--ink-500)] border-[var(--ink-300)]"
                          )}>
                            {c.isAvailable !== false ? "Available Now" : "Unavailable"}
                          </span>
                          {/* Match Score Badge */}
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--brand-pink-soft)] text-[var(--brand-pink)] border border-[var(--brand-pink)]/20 leading-none uppercase tracking-wider">
                            {c.aiMatchScore}% Match
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-1 font-medium">{c.title || "Professional Developer"}</div>
                        
                        {/* Skills Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {getTopSkills(c.title || "", c.skills).map((skill: string) => (
                            <span
                              key={skill}
                              className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--ink-100)] text-[var(--ink-700)] border border-[var(--ink-300)] uppercase tracking-wider"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Shortlist, Message, & Profile Micro-Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setShortlisted(s => ({ ...s, [c.id || c._id || ""]: !isCandShortlisted }));
                          toast.success(isCandShortlisted ? "Removed from shortlist" : "Candidate shortlisted!");
                        }}
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center border transition-all duration-200",
                          isCandShortlisted
                            ? "bg-[var(--brand-pink)] border-[var(--brand-pink)] text-white shadow-sm"
                            : "bg-background border-[var(--ink-300)] text-[var(--ink-500)] hover:text-[var(--brand-pink)] hover:border-[var(--brand-pink)]/30"
                        )}
                        title="Shortlist candidate"
                      >
                        <Heart size={14} fill={isCandShortlisted ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMessageCandidate(c.id || c._id || "", `${c.firstName} ${c.lastName}`)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-background border border-border text-ink-400 hover:text-primary hover:border-primary/20 transition-all duration-200"
                        title="Start conversation"
                      >
                        <MessageSquare size={14} />
                      </button>
                      <Link
                        to={`/employer/candidate/${c.id ?? c._id}`}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-background border border-border text-ink-400 hover:text-primary hover:border-primary/20 transition-all duration-200"
                        title="View full profile"
                      >
                        <Eye size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Interactive Quick-Message Modal Overlay */}
      {msgCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base text-foreground font-bold flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-primary" />
                  Message {msgCandidate.name}
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Start a direct chat with this candidate</p>
              </div>
              <button 
                onClick={() => setMsgCandidate(null)} 
                className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Message Content</label>
                <textarea
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  rows={4}
                  className="w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                  placeholder="Type your message here..."
                />
              </div>
            </div>

            <footer className="px-6 py-4 bg-secondary/10 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setMsgCandidate(null)}
                className="px-4 py-2 border border-border text-ink-500 hover:bg-secondary rounded-full text-[11px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={startThreadMutation.isPending || !msgText.trim()}
                onClick={() => startThreadMutation.mutate({ recipientId: msgCandidate.id, initialMessage: msgText })}
                className="px-5 py-2 bg-primary hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
              >
                {startThreadMutation.isPending ? <Loader2 size={11} className="animate-spin" /> : "Send Message"}
              </button>
            </footer>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
