// src/pages/admin/AuditLogPage.tsx
import { useState }     from "react";
import { useQuery }     from "@tanstack/react-query";
import { Search }       from "lucide-react";
import { cn }           from "@/lib/utils";
import { apiAdmin }     from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";

const ACTION_COLORS: Record<string,string> = {
  LOGIN_SUCCESS:"bg-emerald-50 text-emerald-600", SIGNUP:"bg-blue-50 text-blue-600",
  JOB_POSTED:"bg-violet-50 text-violet-600", RATE_LIMIT:"bg-amber-50 text-amber-600",
  BRUTE_FORCE_BLOCK:"bg-red-50 text-red-500", EMPLOYER_APPROVED:"bg-emerald-50 text-emerald-600",
  LOGIN_FAILED:"bg-amber-50 text-amber-600", APPLICATION_SUBMITTED:"bg-blue-50 text-blue-600",
};

const ACTION_TYPES = ["All Actions","LOGIN_SUCCESS","LOGIN_FAILED","SIGNUP","JOB_POSTED","BRUTE_FORCE_BLOCK","RATE_LIMIT","EMPLOYER_APPROVED"];

function relTime(iso: string) {
  const m = Math.floor((Date.now()-new Date(iso).getTime())/60000);
  if(m<1)return"Just now"; if(m<60)return`${m}m ago`;
  const h=Math.floor(m/60); if(h<24)return`${h}h ago`;
  return`${Math.floor(h/24)}d ago`;
}

export default function AuditLogPage() {
  const [search,     setSearch]     = useState("");
  const [actionType, setActionType] = useState("All Actions");

  const { data: logs = [] } = useQuery({ queryKey:["auditLog"], queryFn: apiAdmin.getAuditLog });

  // Extend with more mock entries
  const allLogs = [...logs, ...Array.from({ length: 10 }, (_, i) => ({
    id:`ext_${i}`, action: ACTION_TYPES[1 + (i % (ACTION_TYPES.length-1))],
    userId: [`Ayesha Khan`,`Sara Ahmed`,`TechFlow Inc.`,`unknown`,`Fatima Malik`][i % 5],
    detail: [`role=candidate ip=127.0.0.1`,`role=employer`,`jobId=xyz title="Dev"`,`ip=192.168.1.1`,`otp_verified`][i % 5],
    createdAt: new Date(Date.now() - (i + 1) * 15 * 60000).toISOString(),
  }))];

  const filtered = allLogs.filter((l: any) => {
    const matchSearch = !search || l.userId?.toLowerCase().includes(search.toLowerCase()) || l.action?.toLowerCase().includes(search.toLowerCase());
    const matchAction = actionType === "All Actions" || l.action === actionType;
    return matchSearch && matchAction;
  });

  return (
    <DashboardShell title="Audit Log" subtitle="Every platform action recorded for compliance">
      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89EC0]" size={13} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user or action…"
                 className="w-full pl-9 pr-4 py-2.5 rounded-full text-xs bg-white border border-[#E8E1F0] text-[#0F0B1A] placeholder:text-[#A89EC0] focus:outline-none focus:border-rose-400 transition-all" />
        </div>
        <select value={actionType} onChange={e => setActionType(e.target.value)}
                className="px-4 py-2.5 border border-[#E8E1F0] rounded-full text-xs font-semibold bg-white text-[#6B6480] focus:outline-none focus:border-rose-400 cursor-pointer">
          {ACTION_TYPES.map(a => <option key={a} value={a}>{a.replace(/_/g," ")}</option>)}
        </select>
        <div className="px-4 py-2.5 bg-[#F7F4F9] rounded-full text-xs font-semibold text-[#A89EC0]">
          {filtered.length} entries
        </div>
      </div>

      <SectionCard noPad>
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E8E1F0]">
                {["Time","Action","User","IP / Detail"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-[#A89EC0] uppercase tracking-[.6px] bg-[#F7F4F9] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 25).map((log: any, i: number) => (
                <tr key={log.id} className={cn("border-b border-[#F3EFF8] hover:bg-[#FAF8FC] transition-colors", i === filtered.length - 1 && "border-b-0")}>
                  <td className="px-5 py-3 font-mono text-[10px] text-[#A89EC0] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                    <div className="text-[9px] text-[#C4BEDD]">{relTime(log.createdAt)}</div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={cn("text-[9px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap",
                      ACTION_COLORS[log.action] ?? "bg-[#F7F4F9] text-[#6B6480]")}>
                      {log.action?.replace(/_/g," ")}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-[#3D3656]">{log.userId}</td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-[10px] text-[#A89EC0] truncate block max-w-xs">{log.detail}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
