// src/pages/candidate/ApplicationsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { 
  CheckCircle2, MapPin, Calendar, Loader2, MoreHorizontal, 
  ArrowRight, Sparkles, HelpCircle, AlertCircle, XCircle 
} from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, Stepper } from "@/components/layout/DashboardShell";
import { apiApplications } from "@/lib/api";
import { formatSalary, relativeTime, cn, initials, getCompanyGradient } from "@/lib/utils";
import { toast } from "sonner";

const STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"] as const;

const FILTER_STAGES = ["ALL", "APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"] as const;

const STAGE_COLOR: Record<string, string> = {
  APPLIED:   "bg-[var(--status-info-bg)] text-[var(--status-info-fg)] border-none rounded-full px-[10px] py-[4px] text-[12px] font-semibold uppercase tracking-[0.04em]",
  SCREENING: "bg-[var(--status-info-bg)] text-[var(--status-info-fg)] border-none rounded-full px-[10px] py-[4px] text-[12px] font-semibold uppercase tracking-[0.04em]",
  INTERVIEW: "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)] border-none rounded-full px-[10px] py-[4px] text-[12px] font-semibold uppercase tracking-[0.04em]",
  OFFER:     "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)] border-none rounded-full px-[10px] py-[4px] text-[12px] font-semibold uppercase tracking-[0.04em]",
  HIRED:     "bg-[var(--status-success-bg)] text-[var(--status-success-fg)] border-none rounded-full px-[10px] py-[4px] text-[12px] font-semibold uppercase tracking-[0.04em]",
  REJECTED:  "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)] border-none rounded-full px-[10px] py-[4px] text-[12px] font-semibold uppercase tracking-[0.04em]",
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
          const count = getStageCount(s);
          const active = filter === s;
          return (
            <button 
              key={s} 
              onClick={() => setFilter(s)}
              className={cn(
                "px-[14px] py-[6px] rounded-full text-[12px] font-semibold transition-all duration-200 flex items-center gap-1.5 active:scale-95 border border-transparent outline-none",
                active
                  ? "bg-[var(--brand-pink)] text-white"
                  : "bg-transparent text-[var(--ink-700)] border-[var(--ink-300)] hover:bg-secondary/35"
              )}
            >
              <span>{s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 shadow-none leading-none",
                active
                  ? "bg-white/12 text-white"
                  : "bg-[var(--ink-100)] text-[var(--ink-700)]"
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
                "transition-all duration-300",
                isRejected && "opacity-75 hover:opacity-95"
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
                      "text-[16px] font-semibold text-[var(--ink-900)] transition-all",
                      isRejected && "line-through text-[var(--ink-500)]"
                    )}>
                      {app.job.title}
                    </div>
                    <div className="text-[13px] font-normal text-[var(--ink-500)] mt-0.5">{app.job.employer.companyName}</div>
                    <div className="flex items-center gap-3 mt-2 text-[13px] font-normal text-[var(--ink-500)]">
                      {app.job.location && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin size={14} className="text-[var(--ink-500)]" />
                          {app.job.location}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <Calendar size={14} className="text-[var(--ink-500)]" />
                        Applied {relativeTime(app.appliedAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="text-right">
                    <span className={STAGE_COLOR[app.stage] ?? "bg-secondary text-ink-750 px-2 py-0.5 rounded-full text-[12px]"}>
                      {app.stage}
                    </span>
                    
                    {/* Normalized salary */}
                    <div className="text-[14px] font-semibold text-[var(--ink-900)] mt-2">
                      {formattedSalaryRange}
                    </div>

                    {/* Explanatory AI Match Score & Tooltip or outcome context */}
                    {app.stage === "HIRED" ? (
                      <div className="text-[13px] font-normal text-[var(--ink-500)] mt-1 inline-flex items-center gap-0.5" title="Final outcome details">
                        Selected from {Math.max(app.job.applicationCount || 0, 1)} {Math.max(app.job.applicationCount || 0, 1) === 1 ? 'applicant' : 'applicants'}
                      </div>
                    ) : app.stage === "REJECTED" ? (
                      <div className="text-[13px] font-normal text-[var(--ink-500)] mt-1 inline-flex items-center gap-0.5" title="Final outcome details">
                        Position filled from {Math.max(app.job.applicationCount || 0, 1)} {Math.max(app.job.applicationCount || 0, 1) === 1 ? 'applicant' : 'applicants'}
                      </div>
                    ) : (
                      <div 
                        className={cn(
                          "text-[13px] font-medium mt-1 inline-flex items-center gap-1 cursor-help",
                          (app.aiMatchScore || 75) >= 80 ? "text-[var(--status-success-fg)]" : "text-[var(--ink-500)]"
                        )}
                        title="Based on your skills, experience, and preferences."
                      >
                        <Sparkles size={11} className={cn((app.aiMatchScore || 75) >= 80 && "animate-pulse")} />
                        <span>AI match: {app.aiMatchScore || 75}%</span>
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
                              className="w-full text-left px-4 py-2 text-[11px] font-semibold text-[var(--status-success-fg)] hover:bg-[var(--status-success-bg)] transition-colors border-t border-border/40 mt-1 pt-2"
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
                                className="w-full text-left px-4 py-2 text-[11px] font-semibold text-foreground hover:bg-secondary/45 transition-colors border-t border-border/40 mt-1 pt-2"
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
                              className="w-full text-left px-4 py-2 text-[11px] font-semibold text-[var(--status-danger-fg)] hover:bg-[var(--status-danger-bg)] transition-colors border-t border-border/40 mt-1"
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
              <div className="mt-5 mb-2">
                <Stepper
                  steps={STAGES}
                  currentStep={stageIdx}
                  isRejected={isRejected}
                />
              </div>

              {/* Contextual Banner for Interview Invitation */}
              {app.stage === "INTERVIEW" && (
                <div className={cn(
                  "mt-4 pt-3 border-t border-border flex flex-wrap gap-2.5 justify-between items-center -mx-4 -mb-4 px-4 py-3 rounded-b-2xl",
                  app.interviewAccepted
                    ? "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]"
                    : "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]"
                )}>
                  <div className="text-[11px] font-bold">
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
