// src/pages/candidate/ApplicationsPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, MapPin, Calendar, Loader2 } from "lucide-react";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { apiApplications } from "@/lib/api";
import { formatSalary, relativeTime, cn } from "@/lib/utils";
import { toast } from "sonner";

const STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED"];
const STAGE_COLOR: Record<string, string> = {
  APPLIED:   "bg-blue-50 text-blue-700",
  SCREENING: "bg-amber-50 text-amber-700",
  INTERVIEW: "bg-violet-50 text-violet-700",
  OFFER:     "bg-emerald-50 text-emerald-700",
  HIRED:     "bg-emerald-50 text-emerald-700",
  REJECTED:  "bg-red-50 text-red-700",
};

export default function ApplicationsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["myApps"], queryFn: apiApplications.getApplications });
  const [filter, setFilter] = useState("ALL");

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

  const apps = (data ?? []).filter(a => filter === "ALL" || a.stage === filter);

  return (
    <DashboardShell title="My applications" subtitle="Track every job you've applied to">
      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["ALL", ...STAGES].map(s => (
          <button key={s} onClick={() => setFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all border",
                    filter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-ink-500 border-border hover:border-primary/40"
                  )}>
            {s === "ALL" ? "All" : s}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-12 text-sm text-muted-foreground">Loading…</div>}

      <div className="space-y-3">
        {apps.map(app => {
          const stageIdx = STAGES.indexOf(app.stage);
          return (
            <SectionCard key={app.id}>
              <div className="flex flex-wrap gap-3 items-start justify-between mb-4">
                <div className="flex gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground flex-shrink-0">
                    {app.job.employer.companyName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[14px] font-bold text-foreground">{app.job.title}</div>
                    <div className="text-[12px] text-muted-foreground mt-0.5">{app.job.employer.companyName}</div>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-ink-400">
                      {app.job.location && <span className="inline-flex items-center gap-1"><MapPin size={11} />{app.job.location}</span>}
                      <span className="inline-flex items-center gap-1"><Calendar size={11} />Applied {relativeTime(app.appliedAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", STAGE_COLOR[app.stage] ?? "bg-secondary")}>
                    {app.stage}
                  </span>
                  <div className="text-[12px] font-bold text-emerald-600 mt-2">
                    {formatSalary(app.job.salaryMin, app.job.salaryMax)}
                  </div>
                  <div className="text-[10px] text-ink-300 mt-0.5">AI match: {app.aiMatchScore}%</div>
                </div>
              </div>

              {/* Pipeline */}
              <div className="flex items-center gap-0">
                {STAGES.map((s, i) => (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                        i  <  stageIdx ? "bg-emerald-500 text-white"
                        : i === stageIdx ? "bg-primary text-primary-foreground ring-4 ring-primary/15"
                        : "bg-secondary text-ink-300"
                      )}>
                        {i < stageIdx ? <CheckCircle2 size={12} /> : i + 1}
                      </div>
                      <span className={cn(
                        "text-[9px] font-bold mt-1.5 whitespace-nowrap",
                        i === stageIdx ? "text-primary" : i < stageIdx ? "text-emerald-600" : "text-ink-300"
                      )}>
                        {s}
                      </span>
                    </div>
                    {i < STAGES.length - 1 && (
                      <div className={cn("flex-1 h-0.5 mx-1 mb-4", i < stageIdx ? "bg-emerald-500" : "bg-secondary")} />
                    )}
                  </div>
                ))}
              </div>

              {app.stage === "INTERVIEW" && (
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2.5 justify-between items-center bg-[#F7F4F9]/60 backdrop-blur-md -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                  <div className="text-[11px] text-[#7C3AED] font-bold">
                    {app.interviewAccepted
                      ? "✓ You have accepted the interview invitation! The employer will schedule the interview soon."
                      : "You have been selected for an interview! Please accept the invitation to proceed."}
                  </div>
                  {!app.interviewAccepted && (
                    <button
                      onClick={() => acceptMutation.mutate(app.id)}
                      disabled={acceptMutation.isPending}
                      className="px-3.5 py-1.5 bg-[#7C3AED] hover:bg-violet-700 text-white rounded-full text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                    >
                      {acceptMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : "Accept Invitation"}
                    </button>
                  )}
                </div>
              )}

              {app.stage === "OFFER" && (
                <div className="mt-4 pt-3 border-t border-border flex flex-wrap gap-2.5 justify-between items-center bg-emerald-50/50 backdrop-blur-md -mx-4 -mb-4 px-4 py-3 rounded-b-2xl">
                  <div className="text-[11px] text-emerald-700 font-bold">
                    {app.offerAccepted
                      ? "✓ You have accepted the job offer! The employer has been notified and can now finalize your hiring."
                      : "Congratulations! You have received a Job Offer Letter! Please accept the offer to join."}
                  </div>
                  {!app.offerAccepted && (
                    <button
                      onClick={() => acceptOfferMutation.mutate(app.id)}
                      disabled={acceptOfferMutation.isPending}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[10px] font-bold shadow-sm transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                    >
                      {acceptOfferMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : "Accept Job Offer"}
                    </button>
                  )}
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
