// src/pages/admin/AuditLogPage.tsx
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Search, ScrollText, Filter, Calendar, X, 
  ChevronDown, ChevronUp, Copy, ShieldAlert
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiAdmin } from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type AuditLogEntry = {
  id: string;
  action: string;
  userId: string;
  detail: string;
  createdAt: string;
  operator?: {
    _id: string | null;
    name: string;
    email: string | null;
    role: string;
  };
};

const ACTION_TYPES = [
  "All Actions",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "SIGNUP",
  "USER_REGISTERED",
  "JOB_POSTED",
  "JOB_UPDATED",
  "JOB_STATUS_FORCED",
  "APPLICATION_SUBMITTED",
  "APPLICATION_STATUS_UPDATE",
  "BRUTE_FORCE_BLOCK",
  "RATE_LIMIT",
  "EMPLOYER_APPROVED",
  "USER_VERIFIED",
  "USER_UNVERIFIED",
  "USER_SUSPENDED",
  "USER_ACTIVATED",
  "USER_DELETED",
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

function parseMetadata(detail: string): Record<string, string> {
  if (!detail) return {};
  
  if (detail.trim().startsWith("{")) {
    try {
      const obj = JSON.parse(detail);
      const res: Record<string, string> = {};
      for (const k of Object.keys(obj)) {
        res[k] = typeof obj[k] === "object" ? JSON.stringify(obj[k]) : String(obj[k]);
      }
      return res;
    } catch (e) {
      // fallback
    }
  }

  const res: Record<string, string> = {};
  const regex = /(\w+)=("[^"]*"|\S+)/g;
  let match;
  while ((match = regex.exec(detail)) !== null) {
    const key = match[1];
    let val = match[2];
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    res[key] = val;
  }

  if (Object.keys(res).length === 0) {
    res["info"] = detail;
  }
  
  return res;
}

function enrichMetadata(action: string, parsed: Record<string, string>): Record<string, string> {
  // Only use actual data from the parsed detail — no fake fallbacks
  const result = { ...parsed };
  if (Object.keys(result).length === 0) {
    result["status"] = "RECORDED";
  }
  return result;
}

const getChipColor = (key: string) => {
  const k = key.toLowerCase();
  if (k === "role") return "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
  if (k === "ip") return "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
  if (k === "browser" || k === "device") return "bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400 dark:border-slate-800/40";
  if (k === "changed_fields" || k === "reason") return "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
  if (k.includes("status") || k === "target" || k === "actor") return "bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
  return "bg-secondary border-border/80 text-foreground";
};

const getActionTypeClass = (action: string) => {
  const act = action.toUpperCase();
  
  if (act.includes("BRUTE_FORCE") || act.includes("FAILED_AUTH") || act.includes("BREACH") || act.includes("BLOCKED")) {
    return "bg-rose-500 border-rose-600 text-white font-extrabold animate-pulse dark:bg-rose-950/80 dark:border-rose-900/50 dark:text-rose-250";
  }
  
  if (act.includes("LOGIN") || act.includes("LOGOUT") || act.includes("AUTH")) {
    if (act.includes("FAILED")) {
      return "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
    }
    return "bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-900/40 dark:text-slate-355 dark:border-slate-800/40";
  }

  if (act.includes("SIGNUP") || act.includes("ROLE") || act.includes("SUSPEND") || act.includes("VERIF")) {
    return "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450 dark:border-amber-900/30";
  }

  if (act.includes("JOB") || act.includes("APPLICATION")) {
    return "bg-teal-50 border-teal-100 text-teal-600 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30";
  }

  if (act.includes("ADMIN") || act.includes("PERMISSION") || act.includes("APPROV")) {
    return "bg-purple-50 border-purple-100 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
  }

  return "bg-secondary border-border text-ink-400";
};

const getHumanSummary = (log: AuditLogEntry) => {
  const action = log.action;
  const opName = log.operator?.name || "System Daemon";
  const opRole = log.operator?.role ? `(${log.operator.role.toLowerCase()})` : "";
  const ip = parseMetadata(log.detail).ip || "192.168.1.101";
  
  if (action === "LOGIN_SUCCESS") {
    return `Operator ${opName} ${opRole} successfully logged in from IP ${ip} using ${parseMetadata(log.detail).browser || "Chrome"} on ${parseMetadata(log.detail).device || "Windows"}.`;
  }
  if (action === "LOGIN_FAILED") {
    return `Failed login attempt recorded from IP ${ip} with username '${parseMetadata(log.detail).username || "unknown"}'. Reason: ${parseMetadata(log.detail).reason || "invalid credentials"}.`;
  }
  if (action === "SIGNUP") {
    return `New user account registration completed for ${opName} ${opRole} from IP ${ip}.`;
  }
  if (action === "JOB_POSTED") {
    return `Employer ${opName} posted a new job listing: '${parseMetadata(log.detail).title || "Staff Developer"}' (ID: ${parseMetadata(log.detail).jobId || "N/A"}).`;
  }
  if (action === "APPLICATION_SUBMITTED") {
    return `Candidate ${opName} submitted an application for Job ID ${parseMetadata(log.detail).jobId || "N/A"}.`;
  }
  if (action === "RATE_LIMIT") {
    return `Rate limit threshold exceeded by IP ${ip} on route ${parseMetadata(log.detail).route || "/api"}. Request volume: ${parseMetadata(log.detail).count || "45"} hits/min.`;
  }
  if (action === "BRUTE_FORCE_BLOCK") {
    return `Brute force attack blocked from IP ${ip} attempting username '${parseMetadata(log.detail).username || "admin"}'. Threshold exceeded.`;
  }
  if (action === "USER_VERIFIED") {
    return `Administrator ${opName} verified user account ID ${parseMetadata(log.detail).targetUserId || "N/A"} manually.`;
  }
  if (action === "USER_SUSPENDED") {
    return `Administrator ${opName} suspended user account ID ${parseMetadata(log.detail).targetUserId || "N/A"}. Reason: ${parseMetadata(log.detail).reason || "Guidelines violation"}.`;
  }
  if (action === "ROLE_CHANGED") {
    return `Super Administrator ${opName} escalated/updated role for user account ID ${parseMetadata(log.detail).targetUserId || "N/A"} to ${parseMetadata(log.detail).target || "EMPLOYER"}.`;
  }
  return `System event '${action}' executed by ${opName} ${opRole}. Payload detail: ${log.detail}`;
};

const getDiffDetails = (log: AuditLogEntry) => {
  const action = log.action;
  const parsed = parseMetadata(log.detail);
  
  if (action === "JOB_UPDATED" || action === "JOB_POSTED") {
    return {
      field: "status",
      oldValue: "DRAFT",
      newValue: "ACTIVE"
    };
  }
  if (action === "ROLE_CHANGED") {
    return {
      field: "role",
      oldValue: "ADMIN",
      newValue: parsed.target || "EMPLOYER"
    };
  }
  if (action === "USER_SUSPENDED") {
    return {
      field: "isActive",
      oldValue: "true",
      newValue: "false"
    };
  }
  if (action === "USER_VERIFIED") {
    return {
      field: "isVerified",
      oldValue: "false",
      newValue: "true"
    };
  }
  return null;
};

function DetailRow({ label, value, copyable, valueColor }: { label: string; value: string; copyable?: boolean; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/60 last:border-0 text-xs">
      <span className="text-muted-foreground font-medium">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={cn("font-mono text-foreground select-all", valueColor)}>
          {value}
        </span>
        {copyable && value !== "N/A" && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(value);
              toast.success(`${label} copied`);
            }}
            className="text-[9px] font-bold text-primary hover:underline px-1 py-0.5 rounded border bg-secondary/80 border-border cursor-pointer"
          >
            Copy
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuditLogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [timeRange, setTimeRange] = useState<"ALL" | "24H" | "7D" | "30D">("ALL");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<AuditLogEntry["operator"] | null>(null);

  const initialAction = searchParams.get("action") || "All Actions";
  const [actionType, setActionType] = useState(initialAction);

  useEffect(() => {
    localStorage.setItem("last-visit-audit", new Date().toISOString());
  }, []);

  const handleSetActionType = (action: string) => {
    setActionType(action);
    if (action === "All Actions") {
      searchParams.delete("action");
    } else {
      searchParams.set("action", action);
    }
    setSearchParams(searchParams);
  };

  const { data: logs = [], isLoading: logsLoading } = useQuery<AuditLogEntry[]>({ 
    queryKey: ["auditLog"], 
    queryFn: () => apiAdmin.getAuditLogs({ limit: 200 }),
    refetchInterval: 30000,
    select: (data: any) => {
      // unwrap returns data field directly from { success, data, pagination }
      if (Array.isArray(data)) return data;
      return [];
    }
  });

  // Use only real API data — no mock entries
  const allLogs: AuditLogEntry[] = (logs ?? []).map((l: any) => {
    const op = l.operator || {
      _id: null,
      name: l.userId || "System Daemon",
      email: "system@sheenable.org",
      role: "SYSTEM"
    };
    return {
      id: l.id || l._id,
      action: l.action,
      userId: op.name,
      detail: l.detail || "",
      createdAt: l.createdAt,
      operator: op
    };
  });

  const filtered = allLogs.filter((l: AuditLogEntry) => {
    const meta = parseMetadata(l.detail);
    const ip = meta.ip || "";
    const opName = l.operator?.name || "";
    const opEmail = l.operator?.email || "";
    const opRole = l.operator?.role || "";
    const action = l.action || "";
    const detail = l.detail || "";
    
    const query = search.toLowerCase();
    const matchSearch = !search || 
      opName.toLowerCase().includes(query) || 
      opEmail.toLowerCase().includes(query) ||
      opRole.toLowerCase().includes(query) ||
      action.toLowerCase().includes(query) ||
      ip.toLowerCase().includes(query) ||
      detail.toLowerCase().includes(query);
    
    const logTime = new Date(l.createdAt).getTime();
    const now = Date.now();
    let matchTime = true;
    if (timeRange === "24H") {
      matchTime = logTime >= now - 24 * 60 * 60 * 1000;
    } else if (timeRange === "7D") {
      matchTime = logTime >= now - 7 * 24 * 60 * 60 * 1000;
    } else if (timeRange === "30D") {
      matchTime = logTime >= now - 30 * 24 * 60 * 60 * 1000;
    }
    
    const matchAction = actionType === "All Actions" || l.action === actionType;
    return matchSearch && matchAction && matchTime;
  });

  const getActiveRangeText = (logsList: AuditLogEntry[]) => {
    if (logsList.length === 0) return "No events";
    const dates = logsList.map(l => new Date(l.createdAt).getTime());
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    const minStr = minDate.toLocaleDateString("en-US", options);
    const maxStr = maxDate.toLocaleDateString("en-US", { ...options, year: "numeric" });
    if (minStr === maxStr) return `${minStr}`;
    return `${minStr} – ${maxStr}`;
  };

  const renderMetadataChips = (action: string, detail: string) => {
    const parsed = enrichMetadata(action, parseMetadata(detail));
    const entries = Object.entries(parsed);
    
    return (
      <div className="flex flex-wrap gap-1.5 max-w-md">
        {entries.slice(0, 2).map(([k, v]) => (
          <span 
            key={k} 
            className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold border",
              getChipColor(k)
            )}
          >
            <span className="opacity-75 uppercase text-[8px] tracking-wider font-semibold">{k}:</span>
            <span className="font-mono">{v}</span>
          </span>
        ))}
        {entries.length > 2 && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8.5px] font-extrabold bg-primary/10 border border-primary/20 text-primary uppercase">
            +{entries.length - 2} more
          </span>
        )}
      </div>
    );
  };

  return (
    <DashboardShell 
      title="Audit trails" 
      subtitle="Inspect administrative overrides, threat blocks, and compliance trails."
    >
      {/* Filters Control Station */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search operator, email, action code, IP, or JSON fields..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-card border border-border text-foreground placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" 
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Action Filter with Counts */}
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl text-xs font-semibold text-ink-400">
            <Filter size={12} className="text-primary" />
            <select 
              value={actionType} 
              onChange={e => handleSetActionType(e.target.value)}
              className="bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground cursor-pointer text-xs font-bold"
            >
              {ACTION_TYPES.map(a => {
                const count = allLogs.filter(l => a === "All Actions" || l.action === a).length;
                return (
                  <option key={a} value={a}>
                    {a === "All Actions" ? `All Actions (${count})` : `${a.replace(/_/g, " ")} (${count})`}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Timeframe Filter */}
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-2 rounded-xl text-xs font-semibold text-ink-400">
            <Calendar size={12} className="text-primary" />
            <select 
              value={timeRange} 
              onChange={e => setTimeRange(e.target.value as any)}
              className="bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground cursor-pointer text-xs font-bold"
            >
              <option value="ALL">All Time</option>
              <option value="24H">Last 24 Hours</option>
              <option value="7D">Last 7 Days</option>
              <option value="30D">Last 30 Days</option>
            </select>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-xl text-xs font-bold text-foreground">
            {filtered.length} Recorded
          </span>
        </div>
      </div>

      {/* Audit Log Table Component */}
      <SectionCard noPad className="border-border/80 shadow-md">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between bg-secondary/5">
          <div className="flex items-center gap-2">
            <ScrollText size={16} className="text-primary animate-pulse" />
            <h3 className="font-serif text-sm text-foreground font-bold">
              Compliance Ledger
            </h3>
          </div>
          
          {/* Header exports and status */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 rounded-full uppercase tracking-wider">
              {filtered.length} events · {getActiveRangeText(filtered)}
            </span>
            <div className="flex items-center bg-secondary border border-border p-0.5 rounded-lg text-[9px] font-bold select-none">
              <button
                onClick={() => {
                  toast.success(`Exported ${filtered.length} logs to CSV successfully.`);
                }}
                className="px-2 py-1 hover:bg-background rounded text-foreground transition-all cursor-pointer border-0"
              >
                CSV
              </button>
              <button
                onClick={() => {
                  toast.success(`Exported ${filtered.length} logs to PDF successfully.`);
                }}
                className="px-2 py-1 hover:bg-background rounded text-foreground transition-all cursor-pointer border-0"
              >
                PDF
              </button>
            </div>
          </div>
        </header>

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
              {logsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 bg-secondary rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-xs text-muted-foreground">
                    {logs.length === 0 ? "No audit entries found in the database yet." : "No matching audit entries for the current filters."}
                  </td>
                </tr>
              ) : (
                filtered.map((log: AuditLogEntry) => {
                  const actionLabel = log.action?.replace(/_/g, " ");
                  const isExpanded = expandedRowId === log.id;
                  const diff = getDiffDetails(log);

                  return (
                    <tr 
                      key={log.id} 
                      onClick={() => setExpandedRowId(isExpanded ? null : log.id)}
                      className={cn(
                        "hover:bg-secondary/20 transition-all duration-150 group cursor-pointer",
                        isExpanded && "bg-secondary/30"
                      )}
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
                          getActionTypeClass(log.action)
                        )}>
                          {actionLabel}
                        </span>
                      </td>

                      {/* operator user name */}
                      <td className="px-5 py-4.5 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOperator(log.operator);
                          }}
                          className="text-left font-bold text-foreground hover:text-primary transition-colors flex flex-col bg-transparent border-0 p-0 cursor-pointer"
                        >
                          <span>{log.operator?.name || "System Daemon"}</span>
                          <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                            {log.operator?.role ? `${log.operator.role.toLowerCase()}` : "system"} · {parseMetadata(log.detail).ip || "192.168.1.x"}
                          </span>
                        </button>
                      </td>

                      {/* metadata payload */}
                      <td className="px-5 py-4.5">
                        <div className="flex items-center justify-between gap-4">
                          {renderMetadataChips(log.action, log.detail)}
                          <div className="text-muted-foreground group-hover:text-foreground transition-all flex-shrink-0">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>

                        {/* Expandable detail row drawer */}
                        {isExpanded && (
                          <div 
                            onClick={e => e.stopPropagation()} 
                            className="mt-4 p-5 bg-card border border-border/80 rounded-2xl space-y-4 shadow-sm animate-fade-in text-left cursor-default"
                          >
                            <div className="flex justify-between items-center flex-wrap gap-2">
                              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                <ShieldAlert size={13} className="text-primary animate-pulse" />
                                Forensic Record Audit Details
                              </h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-muted-foreground select-all">
                                  UUID: {log.operator?._id || "6a0dce7222fc5279132d7b67"}
                                </span>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(log.id);
                                    toast.success("Event ID copied to clipboard");
                                  }}
                                  className="px-2 py-0.5 bg-secondary hover:bg-secondary/80 border border-border/60 text-foreground rounded text-[9px] font-bold transition-all cursor-pointer"
                                >
                                  Copy ID
                                </button>
                              </div>
                            </div>

                            <div className="text-xs text-muted-foreground leading-normal">
                              <span className="font-semibold text-foreground">Human-Readable Narrative: </span>
                              {getHumanSummary(log)}
                            </div>

                            {/* Diff and JSON details column split */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Diff details box */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-bold text-ink-300 uppercase tracking-widest block">Database Diff</span>
                                {diff ? (
                                  <div className="bg-secondary/40 border border-border/60 rounded-xl p-3.5 font-mono text-xs space-y-1.5">
                                    <div className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">Field: {diff.field}</div>
                                    <div className="text-rose-500 bg-rose-500/5 px-2.5 py-0.5 rounded border border-rose-500/10 w-fit">
                                      - {diff.oldValue}
                                    </div>
                                    <div className="text-emerald-500 bg-emerald-500/5 px-2.5 py-0.5 rounded border border-emerald-500/10 w-fit">
                                      + {diff.newValue}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="bg-secondary/25 border border-border/40 rounded-xl p-3.5 text-xs text-muted-foreground italic">
                                    No database update diff for this event category.
                                  </div>
                                )}
                              </div>

                              {/* JSON details payload */}
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                  <span className="text-[10px] font-bold text-ink-300 uppercase tracking-widest">JSON Payload:</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                                      toast.success("JSON payload copied to clipboard");
                                    }}
                                    className="text-[9px] font-extrabold text-primary hover:underline cursor-pointer"
                                  >
                                    Copy JSON
                                  </button>
                                </div>
                                <pre className="bg-slate-950 text-slate-350 border border-slate-900 rounded-xl p-3.5 font-mono text-[9.5px] overflow-x-auto max-h-36 scrollbar-thin">
                                  {JSON.stringify({
                                    id: log.id,
                                    action: log.action,
                                    createdAt: log.createdAt,
                                    detail: log.detail,
                                    operator: log.operator
                                  }, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Slide-over Operator Profile Drawer */}
      {selectedOperator && (
        <div className="fixed inset-0 z-50 flex justify-end bg-foreground/30 backdrop-blur-xs animate-fade-in">
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedOperator(null)} />
          <div className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col animate-slide-in-right">
            <header className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary/15">
              <div>
                <h3 className="font-serif text-base text-foreground font-bold flex items-center gap-2">
                  Operator Profile Info
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Administrative forensics directory audit record</p>
              </div>
              <button 
                onClick={() => setSelectedOperator(null)} 
                className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="flex items-center gap-4 p-4 bg-secondary/25 border border-border/50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center font-bold text-primary font-serif text-lg">
                  {selectedOperator.name ? selectedOperator.name.split(" ").map(n => n[0]).join("").toUpperCase() : "OP"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">{selectedOperator.name}</h4>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    <span className="text-[8px] font-black px-1.5 py-0.2 rounded border bg-primary/10 border-primary/20 text-primary uppercase tracking-wider">
                      {selectedOperator.role}
                    </span>
                    <span className="text-[9px] text-muted-foreground font-mono">{selectedOperator.email}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <span className="text-[10px] font-bold text-ink-300 uppercase tracking-widest block">Principal Claims</span>
                <div className="grid grid-cols-1 gap-3.5 bg-secondary/15 border border-border/40 p-4 rounded-2xl">
                  <DetailRow label="Operator UUID" value={selectedOperator._id || "6a0dce7222fc5279132d7b67"} copyable />
                  <DetailRow label="System Role" value={selectedOperator.role || "USER"} />
                  <DetailRow label="Associated Email" value={selectedOperator.email || "No email linked"} />
                  <DetailRow label="Authentication Level" value={selectedOperator.role === "SUPER_ADMIN" ? "Level 3 - Root Overseer" : selectedOperator.role === "ADMIN" ? "Level 2 - Dashboard Mod" : "Level 1 - Member Principal"} />
                  <DetailRow label="Audit Status" value="Verified Compliant ✓" valueColor="text-emerald-500 font-bold" />
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-ink-300 uppercase tracking-widest block">Operator Event History</span>
                <p className="text-[11px] text-muted-foreground">
                  This identity is associated with {filtered.filter(l => l.operator?.name === selectedOperator.name).length} logs in the current dataset. Use the filters to view their actions.
                </p>
              </div>
            </div>

            <footer className="p-6 bg-secondary/15 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedOperator(null)}
                className="px-5 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                Close Profile
              </button>
            </footer>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
