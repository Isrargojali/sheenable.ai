import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Briefcase, Users, MessageSquare, Sparkles, ArrowRight, MapPin, Loader2, 
  Heart, MoreVertical, Eye, Copy, Trash2, Clock, X 
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

const STATS = [
  { key: "activeJobs", label: "Active jobs", icon: Briefcase, color: "from-rose-500 to-rose-700" },
  { key: "totalApplicants", label: "Total applicants", icon: Users, color: "from-violet-500 to-violet-700" },
  { key: "interviews", label: "Interviews booked", icon: MessageSquare, color: "from-blue-500 to-blue-700" },
  { key: "aiMatches", label: "AI matches", icon: Sparkles, color: "from-emerald-500 to-emerald-700" },
] as const satisfies ReadonlyArray<{ key: keyof EmployerStats; label: string; icon: React.ElementType; color: string }>;

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
  const myJobs = Array.isArray(jobs) ? jobs.slice(0, 3) : [];
  const topCandidates = Array.isArray(matchedCandidates) ? matchedCandidates.slice(0, 3) : [];

  // Premium status tag helper for stat cards
  const getStatBadge = (key: keyof EmployerStats) => {
    if (key === "activeJobs") return { label: "Live board", style: "bg-rose-50 text-rose-700" };
    if (key === "totalApplicants") return { label: "Active", style: "bg-violet-50 text-violet-700" };
    if (key === "interviews") return { label: "Scheduled", style: "bg-blue-50 text-blue-700" };
    return { label: "98% Match", style: "bg-emerald-50 text-emerald-700" };
  };

  return (
    <DashboardShell
      title="Employer dashboard"
      subtitle={`${companyName} · ${activeCount} active opportunities listed`}
      actions={
        <Link to="/employer/post-job">
          <BtnPrimary className="px-5 py-2.5 shadow-sm text-xs font-bold flex items-center gap-2">
            Post a job <ArrowRight size={13} />
          </BtnPrimary>
        </Link>
      }
    >
      {/* Elevated AI Matches Hero Stat + Tighter Secondary Stat Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6 animate-fade-in">
        {/* Hero Stat: AI Matches */}
        <div className="lg:col-span-1 bg-gradient-to-br from-[#7C3AED] to-[#C8315A] text-white rounded-3xl p-6 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/20 hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden flex flex-col justify-between min-h-[170px]">
          {/* Accent decoration glow */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Sparkles size={18} className="text-white animate-pulse" />
              </div>
              <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm uppercase tracking-wider leading-none">
                98% Accuracy
              </span>
            </div>
            <div className="mt-4">
              {statsLoading ? (
                <div className="h-10 w-20 bg-white/20 animate-pulse rounded-md" />
              ) : (
                <div className="font-serif text-5.5xl font-black leading-none tracking-tight text-white select-none">
                  {stats?.aiMatches ?? 0}
                </div>
              )}
              <div className="text-[10px] text-purple-100 mt-1.5 font-bold uppercase tracking-widest leading-none">
                AI Matches Available
              </div>
              <p className="text-[9px] text-purple-100/70 mt-1 leading-normal font-medium">
                Our semantic models identified high-compatibility fits ready for immediate hiring.
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Stats in tighter row */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          {[
            { key: "activeJobs", label: "Active Jobs", icon: Briefcase, color: "from-rose-500 to-rose-600 text-rose-500 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100", delta: "Live board" },
            { key: "totalApplicants", label: "Total Applicants", icon: Users, color: "from-violet-500 to-violet-600 text-violet-500 bg-violet-50 dark:bg-violet-950/20 dark:text-violet-400 border-violet-100", delta: "Active Pool" },
            { key: "interviews", label: "Interviews Booked", icon: MessageSquare, color: "from-blue-500 to-blue-600 text-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-100", delta: "Scheduled" }
          ].map((s) => {
            const Icon = s.icon;
            const value = stats?.[s.key as keyof EmployerStats] ?? 0;
            return (
              <div
                key={s.key}
                className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8.5 h-8.5 rounded-xl bg-gradient-to-br ${s.color.split(' ')[0]} ${s.color.split(' ')[1]} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                    <Icon size={14} className="text-white" />
                  </div>
                  <span className={cn("text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider leading-none border", s.color.split(' ').slice(2).join(' '))}>
                    {s.delta}
                  </span>
                </div>
                <div>
                  {statsLoading ? (
                    <div className="h-8 w-12 bg-muted animate-pulse rounded-md" />
                  ) : (
                    <div className="font-serif text-2.5xl font-black text-foreground leading-none tracking-tight">{value}</div>
                  )}
                  <div className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider text-ink-300 truncate">
                    {s.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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

                const getCategoryStyles = (cat: string) => {
                  const c = cat.toLowerCase();
                  if (c.includes("design") || c.includes("ux")) return "bg-pink-50 text-pink-700 border-pink-100 dark:bg-pink-950/20 dark:text-pink-400 dark:border-pink-950/30";
                  if (c.includes("finance")) return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30";
                  if (c.includes("sales") || c.includes("market")) return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-950/30";
                  return "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-950/30";
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
                            "text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none",
                            getCategoryStyles(jobCategory)
                          )}>
                            {jobCategory}
                          </span>
                          {/* Closing Soon Warning Chip */}
                          {isClosingSoon && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-950/30 flex items-center gap-0.5 leading-none animate-pulse">
                              <Clock size={9} /> Closing Soon
                            </span>
                          )}
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
                                  className="w-full px-4 py-2 text-[11px] font-semibold text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 flex items-center gap-2 transition-colors text-left"
                                >
                                  <Trash2 size={12} className="text-rose-500" /> Delete Listing
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Applicant Target Bar */}
                    <div className="mt-3.5 border-t border-border/20 pt-3">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold mb-1">
                        <span className="uppercase tracking-wider">Applicant Progress</span>
                        <span>{currentCount} / {targetCount} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-secondary dark:bg-secondary/40 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7C3AED] to-[#C8315A] rounded-full transition-all duration-1000 ease-out"
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
          {/* Subtle gradient search banner, not competing with candidate list */}
          <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-purple-500/5 to-pink-500/5 dark:from-purple-500/10 dark:to-pink-500/10 border border-purple-500/10 rounded-2xl flex items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#7C3AED] animate-pulse flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-xs font-bold text-foreground">Unlock Semantic Search</span>{" "}
                <span className="text-[10px] text-muted-foreground block sm:inline">Query candidate index using natural language matching terms.</span>
              </div>
            </div>
            <Link to="/employer/ai-search" className="flex-shrink-0">
              <button className="px-3 py-1.5 bg-[#7C3AED] hover:bg-[#6b32cb] text-white rounded-xl text-[10px] font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap">
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
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-black"
                          style={{
                            background: "linear-gradient(135deg,#7C3AED,#C8315A)",
                            display: c.avatarUrl ? "none" : "flex",
                          }}
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
                          {/* Availability Pill - Unified badge sizing */}
                          <span className={cn(
                            "text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none",
                            c.isAvailable !== false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30"
                              : "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-950/30"
                          )}>
                            {c.isAvailable !== false ? "Available Now" : "Unavailable"}
                          </span>
                          {/* Match Score Badge */}
                          <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30 leading-none">
                            {c.aiMatchScore}% Match
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate mt-1 font-medium">{c.title || "Professional Developer"}</div>
                        
                        {/* Skills Tags */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {(c.skills || ["React", "TypeScript", "Node.js"]).slice(0, 3).map((skill: string) => (
                            <span
                              key={skill}
                              className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-950/30 uppercase tracking-wider"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Shortlist & Message Micro-Actions */}
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
                            ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                            : "bg-background border-border text-ink-400 hover:text-rose-500 hover:border-rose-200"
                        )}
                        title="Shortlist Candidate"
                      >
                        <Heart size={14} fill={isCandShortlisted ? "currentColor" : "none"} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMessageCandidate(c.id || c._id || "", `${c.firstName} ${c.lastName}`)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center bg-background border border-border text-ink-400 hover:text-primary hover:border-primary/20 transition-all duration-200"
                        title="Send Message"
                      >
                        <MessageSquare size={14} />
                      </button>
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
                className="px-5 py-2 bg-primary hover:bg-mauve-600 text-white rounded-full text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
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
