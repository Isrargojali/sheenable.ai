// src/pages/employer/ATSPipelinePage.tsx
import { useState }       from "react";
import { useMutation }    from "@tanstack/react-query";
import { cn }             from "@/lib/utils";
import { apiApplications }from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { MOCK_CANDIDATES } from "@/mock/data";

const STAGES = [
  { key: "APPLIED",    label: "Applied",     color: "bg-blue-500",    light: "bg-blue-50 text-blue-600"   },
  { key: "SCREENING",  label: "Screening",   color: "bg-amber-500",   light: "bg-amber-50 text-amber-600" },
  { key: "INTERVIEW",  label: "Interview",   color: "bg-rose-500",    light: "bg-rose-50 text-rose-500"   },
  { key: "ASSESSMENT", label: "Assessment",  color: "bg-violet-500",  light: "bg-violet-50 text-violet-600"},
  { key: "OFFER",      label: "Offer",       color: "bg-emerald-500", light: "bg-emerald-50 text-emerald-600"},
  { key: "HIRED",      label: "Hired ✓",     color: "bg-emerald-700", light: "bg-emerald-100 text-emerald-700"},
];

const NEXT_STAGE: Record<string, string> = {
  APPLIED: "SCREENING", SCREENING: "INTERVIEW", INTERVIEW: "ASSESSMENT",
  ASSESSMENT: "OFFER", OFFER: "HIRED",
};

interface Applicant {
  id:      string;
  stage:   string;
  cand:    typeof MOCK_CANDIDATES[0];
  applied: string;
}

// Initial pipeline data built from mock candidates
const INIT_APPLICANTS: Applicant[] = MOCK_CANDIDATES.map((c, i) => ({
  id:      `app_${i}`,
  stage:   ["APPLIED", "SCREENING", "INTERVIEW"][i] ?? "APPLIED",
  cand:    c,
  applied: `Jan ${10 + i}`,
}));

function ApplicantCard({
  app, onMove, onReject,
}: { app: Applicant; onMove: (id: string, stage: string) => void; onReject: (id: string) => void }) {
  const nextStage = NEXT_STAGE[app.stage];
  const nextLabel = STAGES.find(s => s.key === nextStage)?.label;

  return (
    <div className="bg-white border border-[#E8E1F0] rounded-xl p-3 mb-2 hover:border-[#D4CBE8] hover:shadow-sm transition-all cursor-default">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
          {app.cand.firstName[0]}{app.cand.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold text-[#0F0B1A] truncate">{app.cand.firstName} {app.cand.lastName}</div>
          <div className="text-[10px] text-[#6B6480] truncate">{app.cand.title}</div>
        </div>
        <div className="text-sm font-bold font-mono text-emerald-600 flex-shrink-0">{app.cand.aiMatchScore}%</div>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        {app.cand.skills.slice(0, 2).map(s => (
          <span key={s} className="text-[9px] bg-rose-50 text-rose-500 px-1.5 py-0.5 rounded-full font-semibold">{s}</span>
        ))}
      </div>

      <div className="text-[9px] text-[#A89EC0] mb-2">Applied {app.applied}</div>

      <div className="flex gap-1.5">
        {nextStage && (
          <button onClick={() => onMove(app.id, nextStage)}
                  className="flex-1 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full hover:bg-rose-600 transition-colors truncate">
            → {nextLabel}
          </button>
        )}
        <button onClick={() => onReject(app.id)}
                className="px-2 py-1.5 border border-red-200 text-red-400 text-[10px] font-semibold rounded-full hover:bg-red-50 transition-colors flex-shrink-0">
          ✕
        </button>
      </div>
    </div>
  );
}

export default function ATSPipelinePage() {
  const [apps, setApps]   = useState<Applicant[]>(INIT_APPLICANTS);
  const [filter, setFilter]= useState("ALL");

  const moveMut = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      apiApplications.updateStage(id, stage),
  });

  function moveApp(appId: string, newStage: string) {
    setApps(prev => prev.map(a => a.id === appId ? { ...a, stage: newStage } : a));
    moveMut.mutate({ id: appId, stage: newStage });
  }

  function rejectApp(appId: string) {
    setApps(prev => prev.filter(a => a.id !== appId));
  }

  const filtered = filter === "ALL" ? apps : apps.filter(a => a.stage === filter);
  const totalByStage = (stage: string) => apps.filter(a => a.stage === stage).length;

  return (
    <DashboardShell
      title="ATS Pipeline"
      subtitle="Drag candidates through the hiring stages"
    >
      {/* Stage filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        <button onClick={() => setFilter("ALL")}
                className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
                  filter === "ALL" ? "bg-rose-500 border-rose-500 text-white" : "bg-white border-[#E8E1F0] text-[#6B6480] hover:border-[#D4CBE8]")}>
          All ({apps.length})
        </button>
        {STAGES.map(s => (
          <button key={s.key} onClick={() => setFilter(s.key)}
                  className={cn("px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
                    filter === s.key ? "bg-rose-500 border-rose-500 text-white" : "bg-white border-[#E8E1F0] text-[#6B6480] hover:border-[#D4CBE8]")}>
            {s.label} ({totalByStage(s.key)})
          </button>
        ))}
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageApps = filtered.filter(a => a.stage === stage.key);
          return (
            <div key={stage.key} className="flex-shrink-0 w-52">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", stage.color)} />
                  <span className="text-[11px] font-bold text-[#3D3656] uppercase tracking-[.5px]">{stage.label}</span>
                </div>
                <span className={cn("text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full", stage.light)}>
                  {stageApps.length}
                </span>
              </div>

              {/* Column cards */}
              <div className="bg-[#F7F4F9] rounded-2xl p-2.5 min-h-[200px]">
                {stageApps.length === 0 ? (
                  <div className="text-center py-8 text-[#C4BEDD] text-[11px]">No candidates</div>
                ) : stageApps.map(app => (
                  <ApplicantCard key={app.id} app={app} onMove={moveApp} onReject={rejectApp} />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-5 flex items-center gap-6 text-[11px] text-[#A89EC0]">
        <span>Click <strong className="text-rose-500">→ Stage name</strong> to advance a candidate</span>
        <span>Click <strong className="text-red-400">✕</strong> to remove from pipeline</span>
        <span className="ml-auto font-mono">{apps.length} total applicants</span>
      </div>
    </DashboardShell>
  );
}
