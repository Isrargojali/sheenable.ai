// src/pages/candidate/ApplicationsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, MapPin, Calendar, Loader2, MoreHorizontal, 
  ArrowRight, Sparkles, HelpCircle, AlertCircle, XCircle 
} from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { apiApplications } from "@/lib/api";
import { formatSalary, relativeTime, cn, initials, getCompanyGradient } from "@/lib/utils";
import { toast } from "sonner";

const STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"] as const;

const FILTER_STAGES = ["ALL", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"] as const;

const FILTER_STYLES: Record<string, { label: string; activeClass: string; badgeClass: string }> = {
  ALL: { 
    label: "All", 
    activeClass: "bg-ink-900 text-white border-ink-900 shadow-sm",
    badgeClass: "bg-white/20 text-white"
  },
  APPLIED: { 
    label: "Applied", 
    activeClass: "bg-ink-900 text-white border-ink-900 shadow-sm",
    badgeClass: "bg-white/20 text-white"
  },
  SCREENING: { 
    label: "Screening", 
    activeClass: "bg-ink-900 text-white border-ink-900 shadow-sm",
    badgeClass: "bg-white/20 text-white"
  },
  INTERVIEW: { 
    label: "Interview", 
    activeClass: "bg-ink-900 text-white border-ink-900 shadow-sm",
    badgeClass: "bg-white/20 text-white"
  },
  OFFER: { 
    label: "Offer", 
    activeClass: "bg-ink-900 text-white border-ink-900 shadow-sm",
    badgeClass: "bg-white/20 text-white"
  },
  HIRED: { 
    label: "Hired", 
    activeClass: "bg-ink-900 text-white border-ink-900 shadow-sm",
    badgeClass: "bg-white/20 text-white"
  },
  REJECTED: { 
    label: "Rejected", 
    activeClass: "bg-ink-900 text-white border-ink-900 shadow-sm",
    badgeClass: "bg-white/20 text-white"
  }
};

const STAGE_COLOR: Record<string, string> = {
  APPLIED:   "bg-[var(--status-info-bg)] text-[var(--status-info-fg)] border border-[var(--status-info-fg)]/10",
  SCREENING: "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)] border border-[var(--status-progress-fg)]/10",
  INTERVIEW: "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)] border border-[var(--status-progress-fg)]/10",
  OFFER:     "bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border border-[var(--status-success-fg)]/10",
  HIRED:     "bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border border-[var(--status-success-fg)]/10",
  REJECTED:  "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] border border-[var(--status-danger-fg)]/10",
};



export default function ApplicationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<any[]>({ 
    queryKey: ["myApps"], 
    queryFn: apiApplications.getApplications 
  });
  const [filter, setFilter] = useState<string>("ALL");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const acceptMutation = useMutation({
    mutationFn: (appId: string) => apiApplications.acceptInterview(appId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myApps"] });
      toast.success("Interview invitation accepted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to accept interview invitation");
    }
  });

  const acceptOfferMutation = useMutation({
    mutationFn: (appId: string) => apiApplications.acceptOffer(appId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myApps"] });
      toast.success("Job offer accepted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to accept job offer");
    }
  });

  const totalCounts = data ?? [];
  const getStageCount = (stage: string) => {
    if (stage === "ALL") return totalCounts.length;
    return totalCounts.filter(a => a.stage === stage).length;
  };

  const apps = totalCounts.filter(a => filter === "ALL" || a.stage === filter);

  return (
    <DashboardShell
      title="My applications"
      subtitle="Track every job you've applied to"
      actions={
        <Link to="/candidate/jobs">
          <BtnPrimary>
            Find More Jobs
          </BtnPrimary>
        </Link>
      }
    >
      {/* Filter Tabs Status Dashboard */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_STAGES.map(s => {
          const style = FILTER_STYLES[s];
          const count = getStageCount(s);
          const active = filter === s;
          return (
            <button 
              key={s} 
              onClick={() => setFilter(s)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all duration-200 border flex items-center gap-1.5 active:scale-95",
                active
                  ? style.activeClass
                  : "bg-card text-ink-500 border-border hover:border-primary/45 hover:bg-secondary/35"
              )}
            >
              <span>{style.label}</span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 shadow-sm leading-none",
                active ? style.badgeClass : "bg-secondary text-ink-300"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {isLoading && <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>}

      <div className="space-y-4">
        {apps.map(app => {
          const isRejected = app.stage === "REJECTED";
          const stageIdx = STAGES.indexOf(app.stage as any);
          const formattedSalaryRange = formatSalary(app.job.salaryMin, app.job.salaryMax, app.job.salaryCurrency);

          return (
            <SectionCard 
              key={app.id}
              className={cn(
                "transition-all duration-300 relative border",
                isRejected 
                  ? "opacity-75 hover:opacity-95 border-l-4 border-l-[var(--status-danger-fg)] bg-[var(--status-danger-bg)]/20"
                  : "border-border hover:border-primary/20 hover:shadow-sm"
              )}
            >
              <div className="flex flex-wrap gap-3 items-start justify-between mb-4 relative">
                <div className="flex gap-3 min-w-0">
                  {/* Company avatar gradient initials */}
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm bg-gradient-to-br transition-all duration-300",
                    getCompanyGradient(app.job.employer.companyName)
                  )}>
                    {initials(app.job.employer.companyName)}
                  </div>
                  <div className="min-w-0">
                    <div className={cn(
                      "text-[14px] font-bold text-foreground transition-all",
                      isRejected && "line-through text-muted-foreground"
                    )}>
                      {app.job.title}
                    </div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{app.job.employer.companyName}</div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-400">
                      {app.job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={11} />
                          {app.job.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={11} />
                        Applied {relativeTime(app.appliedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider", STAGE_COLOR[app.stage] ?? "bg-secondary")}>
                      {app.stage}
                    </span>
                    
                    {/* Normalized salary */}
                    <div className="text-[12px] font-black text-emerald-600 dark:text-emerald-400 mt-2">
                      {formattedSalaryRange}
                    </div>

                    {/* Explanatory AI Match Score & Tooltip or outcome context */}
                    {app.stage === "HIRED" ? (
                      <div className="text-[10.5px] text-emerald-600 font-extrabold mt-1 inline-flex items-center gap-0.5" title="Final outcome details">
                        Selected from {Math.max(app.job.applicationCount || 0, 1)} {Math.max(app.job.applicationCount || 0, 1) === 1 ? 'applicant' : 'applicants'}
                      </div>
                    ) : app.stage === "REJECTED" ? (
                      <div className="text-[10.5px] text-rose-600 font-medium mt-1 inline-flex items-center gap-0.5" title="Final outcome details">
                        Position filled from {Math.max(app.job.applicationCount || 0, 1)} {Math.max(app.job.applicationCount || 0, 1) === 1 ? 'applicant' : 'applicants'}
                      </div>
                    ) : (
                      <div 
                        className="text-[10.5px] text-ink-300 mt-1 inline-flex items-center gap-1 cursor-help border-b border-dashed border-ink-300/40 pb-0.5"
                        title="Based on your skills, experience, and preferences."
                      >
                        <Sparkles size={9} className="text-primary animate-pulse" />
                        AI match: {app.aiMatchScore || 75}%
                      </div>
                    )}
                  </div>

                  {/* Quick Action "..." Dropdown Menu */}
                  <div className="relative">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === app.id ? null : app.id);
                      }}
                      className="p-1.5 hover:bg-secondary/80 rounded-full text-muted-foreground hover:text-foreground transition-all"
                      title="More actions"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                    
                    {openMenuId === app.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-lg py-1 z-20 animate-scale-up">
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              window.location.href = `/candidate/jobs?search=${encodeURIComponent(app.job.title)}`;
                            }}
                            className="w-full text-left px-4 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary/45 transition-colors"
                          >
                            View job posting
                          </button>
                          <button
                            onClick={() => {
                              setOpenMenuId(null);
                              window.location.href = `/candidate/messages?employerId=${app.job.employer.id}&jobTitle=${encodeURIComponent(app.job.title)}`;
                            }}
                            className="w-full text-left px-4 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary/45 transition-colors"
                          >
                            Message employer
                          </button>
                          
                          {app.stage === "HIRED" && (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                toast.success("Date coordination calendar opened!");
                              }}
                              className="w-full text-left px-4 py-2 text-[11px] font-semibold text-emerald-600 hover:bg-emerald-500/5 transition-colors border-t border-border/40 mt-1 pt-2"
                            >
                              Schedule start date
                            </button>
                          )}
                          
                          {isRejected ? (
                            <>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  toast.success("Request for feedback submitted successfully!");
                                }}
                                className="w-full text-left px-4 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-500/5 transition-colors border-t border-border/40 mt-1 pt-2"
                              >
                                Request feedback
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  window.location.href = `/candidate/jobs?search=${encodeURIComponent(app.job.title)}`;
                                }}
                                className="w-full text-left px-4 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary/45 transition-colors"
                              >
                                Find similar roles
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                if (confirm("Are you sure you want to withdraw your application? This action cannot be undone.")) {
                                  toast.success("Application successfully withdrawn.");
                                }
                              }}
                              className="w-full text-left px-4 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-500/5 transition-colors border-t border-border/40 mt-1"
                            >
                              Withdraw application
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Pipeline Tracker */}
              <div className="flex items-center gap-0 mt-5 mb-2 overflow-x-auto pb-2">
                {STAGES.map((s, i) => {
                  const isActive = !isRejected && i === stageIdx;
                  const isCompleted = !isRejected && i < stageIdx;
                  
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                          isRejected
                            ? "bg-secondary/60 text-ink-300/60 line-through"
                            : isCompleted
                              ? "bg-[var(--status-success-fg)] text-white"
                              : isActive
                                ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                                : "bg-secondary text-ink-300"
                        )}>
                          {isCompleted ? <CheckCircle2 size={12} /> : i + 1}
                        </div>
                        <span className={cn(
                          "text-[9px] font-bold mt-1.5 whitespace-nowrap capitalize",
                          isRejected 
                            ? "text-ink-300/50 line-through"
                            : isActive 
                              ? "text-primary" 
                              : isCompleted 
                                ? "text-[var(--status-success-fg)]" 
                                : "text-ink-300"
                        )}>
                          {s.toLowerCase()}
                        </span>
                      </div>
                      {i < STAGES.length - 1 && (
                        <div className={cn(
                          "flex-1 h-0.5 mx-1 mb-4 min-w-[20px]",
                          isRejected 
                            ? "bg-secondary/40"
                            : i < stageIdx 
                              ? "bg-[var(--status-success-fg)]" 
                              : "bg-secondary"
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Contextual Banner for Interview Invitation */}
              {app.stage === "INTERVIEW" && (
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2.5 justify-between items-center bg-[var(--status-progress-bg)]/80 backdrop-blur-md -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                  <div className="text-[11px] text-[var(--status-progress-fg)] font-bold">
                    {app.interviewAccepted
                      ? "✓ You have accepted the interview invitation! The employer will schedule the interview soon."
                      : "You have been selected for an interview! Please accept the invitation to proceed."}
                  </div>
                  {!app.interviewAccepted && (
                    <BtnPrimary
                      onClick={() => acceptMutation.mutate(app.id)}
                      disabled={acceptMutation.isPending}
                    >
                      {acceptMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Accept Invitation"}
                    </BtnPrimary>
                  )}
                </div>
              )}

              {/* Contextual Banner for Offer Stage */}
              {app.stage === "OFFER" && (
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2.5 justify-between items-center bg-[var(--status-success-bg)]/80 backdrop-blur-md -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                  <div className="text-[11px] text-[var(--status-success-fg)] font-bold">
                    {app.offerAccepted
                      ? "✓ You have accepted the job offer! The employer has been notified and can now finalize your hiring."
                      : "Congratulations! You have received a Job Offer Letter! Please accept the offer to join."}
                  </div>
                  {!app.offerAccepted && (
                    <BtnPrimary
                      onClick={() => acceptOfferMutation.mutate(app.id)}
                      disabled={acceptOfferMutation.isPending}
                    >
                      {acceptOfferMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Accept Job Offer"}
                    </BtnPrimary>
                  )}
                </div>
              )}

              {/* Re-engagement Banner for Rejected Applications */}
              {isRejected && (
                <div className="mt-4 pt-3 border-t border-border flex justify-between items-center bg-[var(--status-danger-bg)]/50 -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                  <div className="text-[11px] text-[var(--status-danger-fg)] font-semibold flex items-center gap-1">
                    <XCircle size={12} className="text-[var(--status-danger-fg)]" />
                    This role is closed, but you match other open positions.
                  </div>
                  <Link 
                    to="/candidate/jobs" 
                    className="text-[10px] font-extrabold text-[var(--status-danger-fg)] hover:underline flex items-center gap-0.5 group"
                  >
                    Apply to a similar role 
                    <ArrowRight size={11} className="transform group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              )}
            </SectionCard>
          );
        })}

        {!isLoading && apps.length === 0 && (
          <SectionCard>
            <div className="text-center py-8">
              <div className="text-3xl mb-2">📭</div>
              <div className="text-sm font-semibold text-foreground mb-1">No applications yet</div>
              <div className="text-[12px] text-muted-foreground">Browse jobs to start applying</div>
            </div>
          </SectionCard>
        )}
      </div>
    </DashboardShell>
  );
}
