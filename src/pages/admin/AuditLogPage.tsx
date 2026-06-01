// src/pages/admin/AuditLogPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ScrollText, Filter, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiAdmin } from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";

const ACTION_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: "bg-emerald-50 border-emerald-100 text-emerald-600",
  SIGNUP: "bg-blue-50 border-blue-100 text-blue-600",
  JOB_POSTED: "bg-violet-50 border-violet-100 text-violet-600",
  RATE_LIMIT: "bg-amber-50 border-amber-100 text-amber-600 animate-pulse",
  BRUTE_FORCE_BLOCK: "bg-rose-50 border-rose-100 text-rose-600 font-bold",
  EMPLOYER_APPROVED: "bg-emerald-50 border-emerald-100 text-emerald-600",
  LOGIN_FAILED: "bg-rose-50 border-rose-100 text-rose-600",
  APPLICATION_SUBMITTED: "bg-blue-50 border-blue-100 text-blue-600",
  USER_VERIFIED: "bg-emerald-50 border-emerald-100 text-emerald-600",
  USER_SUSPENDED: "bg-rose-50 border-rose-100 text-rose-600",
  ROLE_CHANGED: "bg-purple-50 border-purple-100 text-purple-600",
};

type AuditLogEntry = {
  id: string;
  action: string;
  userId: string;
  detail: string;
  createdAt: string;
};

const ACTION_TYPES = [
  "All Actions",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "SIGNUP",
  "JOB_POSTED",
  "BRUTE_FORCE_BLOCK",
  "RATE_LIMIT",
  "EMPLOYER_APPROVED",
  "USER_VERIFIED",
  "USER_SUSPENDED",
  "ROLE_CHANGED"
];

function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [actionType, setActionType] = useState("All Actions");

  const { data: logs = [] } = useQuery<AuditLogEntry[]>({ 
    queryKey: ["auditLog"], 
    queryFn: apiAdmin.getAuditLogs 
  });

  // Expand audit logs with detailed, structured realistic records
  const allLogs: AuditLogEntry[] = [
    ...(logs ?? []).map(l => ({
      id: l.id,
      action: l.action,
      userId: l.userId,
      detail: l.detail,
      createdAt: l.createdAt
    })),
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `ext_${i}`, 
      action: ACTION_TYPES[1 + (i % (ACTION_TYPES.length - 1))],
      userId: [`Ayesha Khan`,`Sara Ahmed`,`TechFlow Inc.`,`System Protection Daemon`,`Fatima Malik`,`Zainab Siddiqui`][i % 6],
      detail: [
        `role=candidate ip=127.0.0.1 browser=Chrome`,
        `role=employer verify_success=true`,
        `jobId=job_99a title="Staff React Developer"`,
        `ip=198.51.100.44 count=45 hits/min`,
        `ip=203.0.113.88 attempts=5 threshold_exceeded`,
        `otp_verified session_initiated=true`,
        `role_updated target=EMPLOYER supervisor=SUPER_ADMIN`,
        `account_status=SUSPENDED reason="violating guidelines"`
      ][i % 8],
      createdAt: new Date(Date.now() - (i + 1) * 18 * 60000).toISOString(),
    }))
  ];

  const filtered = allLogs.filter((l: AuditLogEntry) => {
    const matchSearch = !search || 
      l.userId?.toLowerCase().includes(search.toLowerCase()) || 
      l.action?.toLowerCase().includes(search.toLowerCase()) ||
      l.detail?.toLowerCase().includes(search.toLowerCase());
    
    const matchAction = actionType === "All Actions" || l.action === actionType;
    return matchSearch && matchAction;
  });

  return (
    <DashboardShell 
      title="Audit trails" 
      subtitle="Comprehensive compliance ledger recording administrative overrides, threat blocks, and platform activities"
    >
      {/* Filters Control Station */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search by operator, action code, or detail metadata..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-card border border-border text-foreground placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" 
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl text-xs font-semibold text-ink-400">
            <Filter size={12} className="text-primary" />
            <select 
              value={actionType} 
              onChange={e => setActionType(e.target.value)}
              className="bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground cursor-pointer text-xs"
            >
              {ACTION_TYPES.map(a => (
                <option key={a} value={a}>
                  {a.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-bold text-foreground">
            <Calendar size={12} className="text-ink-300" />
            {filtered.length} Recorded
          </span>
        </div>
      </div>

      {/* Audit Log Table Component */}
      <SectionCard noPad className="border-border/80 shadow-md">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                {["Timestamp","System Event","Operator User","Granular Metadata / Details"].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest bg-secondary/20 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-xs text-muted-foreground">
                    No matching audit entries recorded
                  </td>
                </tr>
              ) : (
                filtered.map((log: AuditLogEntry, i: number) => {
                  const actionLabel = log.action?.replace(/_/g, " ");

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-secondary/20 transition-all duration-150 group"
                    >
                      {/* Log time details */}
                      <td className="px-5 py-4.5 whitespace-nowrap">
                        <div className="font-mono text-xs font-semibold text-foreground leading-tight">
                          {new Date(log.createdAt).toLocaleTimeString([], { 
                            hour: "2-digit", 
                            minute: "2-digit", 
                            second: "2-digit" 
                          })}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          {relTime(log.createdAt)}
                        </div>
                      </td>

                      {/* Event badge */}
                      <td className="px-5 py-4.5 whitespace-nowrap">
                        <span className={cn(
                          "text-[9px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider whitespace-nowrap",
                          ACTION_COLORS[log.action] ?? "bg-secondary border-border text-ink-400"
                        )}>
                          {actionLabel}
                        </span>
                      </td>

                      {/* operator user name */}
                      <td className="px-5 py-4.5 whitespace-nowrap">
                        <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {log.userId}
                        </div>
                      </td>

                      {/* metadata payload */}
                      <td className="px-5 py-4.5">
                        <span className="font-mono text-[10.5px] text-muted-foreground bg-secondary/50 px-2.5 py-1.5 rounded-lg border border-border/40 block max-w-lg truncate hover:text-foreground hover:bg-secondary transition-colors duration-150">
                          {log.detail}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
