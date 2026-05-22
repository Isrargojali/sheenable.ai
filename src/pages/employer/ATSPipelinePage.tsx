// src/pages/employer/ATSPipelinePage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { apiApplications, apiJobs } from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const STAGES = [
  { key: "APPLIED", label: "Applied", color: "bg-blue-500", light: "bg-blue-50 text-blue-600" },
  { key: "SCREENING", label: "Screening", color: "bg-amber-500", light: "bg-amber-50 text-amber-600" },
  { key: "INTERVIEW", label: "Interview", color: "bg-rose-500", light: "bg-rose-50 text-rose-500" },
  { key: "ASSESSMENT", label: "Assessment", color: "bg-violet-500", light: "bg-violet-50 text-violet-600" },
  { key: "OFFER", label: "Offer", color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-600" },
  { key: "HIRED", label: "Hired ✓", color: "bg-emerald-700", light: "bg-emerald-100 text-emerald-700" },
];

const NEXT_STAGE: Record<string, string> = {
  APPLIED: "SCREENING", SCREENING: "INTERVIEW", INTERVIEW: "ASSESSMENT",
  ASSESSMENT: "OFFER", OFFER: "HIRED",
};

interface Applicant {
  id: string;
  stage: string;
  cand: {
    firstName: string;
    lastName: string;
    title: string;
    aiMatchScore: number;
    skills: string[];
    avatarUrl?: string | null;
  };
  applied: string;
}

function ApplicantCard({
  app, onMove, onReject, isPending,
}: { app: Applicant; onMove: (id: string, stage: string) => void; onReject: (id: string) => void; isPending: boolean }) {
  const nextStage = NEXT_STAGE[app.stage];
  const nextLabel = STAGES.find(s => s.key === nextStage)?.label;

  return (
    <div className="bg-card border border-[#E8E1F0] rounded-xl p-3 mb-2.5 hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-default">
      <div className="flex items-center gap-2 mb-2">
        {/* Avatar: real photo with initials fallback */}
        <div className="relative w-8 h-8 flex-shrink-0">
          {app.cand.avatarUrl && (
            <img
              src={app.cand.avatarUrl}
              alt={`${app.cand.firstName} ${app.cand.lastName}`}
              className="w-8 h-8 rounded-lg object-cover absolute inset-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (sib) sib.style.display = 'flex';
              }}
            />
          )}
          <div
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-white text-[10px] font-bold"
            style={{ display: app.cand.avatarUrl ? 'none' : 'flex' }}
          >
            {app.cand.firstName[0]}{app.cand.lastName[0]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-foreground truncate">{app.cand.firstName} {app.cand.lastName}</div>
          <div className="text-[10px] text-muted-foreground truncate">{app.cand.title}</div>
        </div>
        <div className="text-sm font-bold font-serif text-primary flex-shrink-0">{app.cand.aiMatchScore}%</div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {app.cand.skills.slice(0, 2).map(s => (
          <span key={s} className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full font-semibold">{s}</span>
        ))}
      </div>

      <div className="text-[9px] text-[#A89EC0] mb-2">Applied {app.applied}</div>

      <div className="flex gap-1.5">
        {nextStage && (
          <button
            onClick={() => onMove(app.id, nextStage)}
            disabled={isPending}
            className="flex-1 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full hover:opacity-90 active:scale-95 transition-all truncate flex items-center justify-center gap-1 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={10} className="animate-spin" /> : <>→ {nextLabel}</>}
          </button>
        )}
        <button
          onClick={() => onReject(app.id)}
          disabled={isPending}
          className="px-2 py-1.5 border border-red-200 text-red-400 text-[10px] font-semibold rounded-full hover:bg-red-50 active:scale-95 transition-all flex-shrink-0 disabled:opacity-50"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function ATSPipelinePage() {
  const qc = useQueryClient();
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [filter, setFilter] = useState("ALL");

  const { data: listings, isLoading: loadingListings } = useQuery({
    queryKey: ["myListings"],
    queryFn: () => apiJobs.getMyListings(),
  });

  const myJobs = Array.isArray(listings) ? listings : [];
  const activeJobId = selectedJobId || myJobs[0]?.id || "";

  const { data: appData, isLoading: loadingApps } = useQuery({
    queryKey: ["applications", activeJobId],
    queryFn: () => apiApplications.getJobApplications(activeJobId),
    enabled: !!activeJobId,
  });

  const apps = Array.isArray(appData) ? appData : [];

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiApplications.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Stage updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update stage");
    }
  });

  function moveApp(appId: string, newStage: string) {
    updateStatusMut.mutate({ id: appId, status: newStage });
  }

  function rejectApp(appId: string) {
    updateStatusMut.mutate({ id: appId, status: "REJECTED" });
  }

  const filtered = filter === "ALL" ? apps : apps.filter((a: Applicant) => a.stage === filter);
  const totalByStage = (stage: string) => apps.filter((a: Applicant) => a.stage === stage).length;

  return (
    <DashboardShell
      title="ATS Pipeline"
      subtitle="Track and manage candidates through the hiring stages"
    >
      {/* Job selector dropdown */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Select Job Listing</label>
          <select
            value={activeJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full md:w-80 px-3.5 py-2 border border-border rounded-xl text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
          >
            {loadingListings ? (
              <option>Loading your jobs...</option>
            ) : myJobs.length === 0 ? (
              <option value="">No jobs posted yet</option>
            ) : (
              myJobs.map((j: any) => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.location || "Remote"})
                </option>
              ))
            )}
          </select>
        </div>
        {activeJobId && (
          <div className="text-right">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-300">Total Applicants</span>
            <div className="text-2xl font-serif font-semibold text-primary">{apps.length}</div>
          </div>
        )}
      </div>

      {/* Stage filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFilter("ALL")}
          className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
            filter === "ALL" ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-ink-500 hover:border-primary/40")}>
          All ({apps.length})
        </button>
        {STAGES.map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
            className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
              filter === s.key ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-ink-500 hover:border-primary/40")}>
            {s.label} ({totalByStage(s.key)})
          </button>
        ))}
      </div>

      {/* Loading & Empty states */}
      {loadingApps && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="animate-spin text-primary" size={20} />
          <span>Loading candidates…</span>
        </div>
      )}

      {!loadingApps && activeJobId && apps.length === 0 && (
        <SectionCard>
          <div className="text-center py-12">
            <div className="text-3xl mb-2">📭</div>
            <div className="text-sm font-semibold text-foreground mb-1">No applicants yet</div>
            <div className="text-[12px] text-muted-foreground">Applications will appear here once candidates apply.</div>
          </div>
        </SectionCard>
      )}

      {/* Kanban board */}
      {!loadingApps && activeJobId && apps.length > 0 && (
        <div className="flex gap-3.5 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageApps = filtered.filter((a: Applicant) => a.stage === stage.key);
            return (
              <div key={stage.key} className="flex-shrink-0 w-56">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", stage.color)} />
                    <span className="text-[11px] font-bold text-foreground uppercase tracking-[.5px]">{stage.label}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full", stage.light)}>
                    {stageApps.length}
                  </span>
                </div>

                {/* Column cards */}
                <div className="bg-[#F7F4F9]/60 backdrop-blur-md border border-border/40 rounded-2xl p-2.5 min-h-[350px]">
                  {stageApps.length === 0 ? (
                    <div className="text-center py-16 text-[#C4BEDD] text-[11px]">No candidates</div>
                  ) : stageApps.map((app: Applicant) => (
                    <ApplicantCard
                      key={app.id}
                      app={app}
                      onMove={moveApp}
                      onReject={rejectApp}
                      isPending={updateStatusMut.isPending}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mt-5 flex items-center gap-6 text-[11px] text-[#A89EC0]">
        <span>Click <strong className="text-primary">→ Stage name</strong> to advance a candidate</span>
        <span>Click <strong className="text-red-400">✕</strong> to reject candidate</span>
        <span className="ml-auto font-mono">{apps.length} total applicants</span>
      </div>
    </DashboardShell>
  );
}
