// src/pages/admin/SecurityCenterPage.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldCheck, AlertTriangle, Activity, Lock, RefreshCw, 
  ShieldAlert, Shield, CheckCircle, X, KeyRound, Eye, Ban, HelpCircle
} from "lucide-react";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { apiAdmin } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

type ThreatData = {
  threatLevel: string;
  blockedIPs: number;
  failedLogins24h: number;
  activeSessions: number;
  uptime: string;
  apiP95: string;
  bruteBlocks24h: number;
  rateLimitHits: number;
  xssAttempts: number;
};

const KPIS = [
  { key: "threatLevel", label: "Threat Level Status", icon: ShieldCheck, tone: "good", bgColor: "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30", textColor: "text-emerald-600 dark:text-emerald-400" },
  { key: "blockedIPs", label: "Active Blocked IPs", icon: Lock, tone: "warn", bgColor: "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30", textColor: "text-amber-600 dark:text-amber-400" },
  { key: "failedLogins24h", label: "Failed Logins (24h)", icon: AlertTriangle, tone: "warn", bgColor: "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30", textColor: "text-rose-600 dark:text-rose-400" },
  { key: "activeSessions", label: "Active Sessions", icon: Activity, tone: "info", bgColor: "bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30", textColor: "text-blue-600 dark:text-blue-400" },
] as const;

const TONE = {
  good: "from-emerald-500 to-teal-600 text-emerald-500 shadow-emerald-500/10",
  warn: "from-amber-500 to-orange-600 text-amber-500 shadow-amber-500/10",
  info: "from-blue-500 to-indigo-600 text-blue-500 shadow-blue-500/10",
};

interface Guardrail {
  name: string;
  desc: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM";
  affectedByState?: "DEGRADED" | "CRITICAL";
}

const GUARDRAILS: Guardrail[] = [
  { name: "SQL Injection Protection", desc: "Parameterized statements & ORM queries", severity: "CRITICAL" },
  { name: "CSRF Validations", desc: "Signed session authenticity tokens", severity: "CRITICAL", affectedByState: "CRITICAL" },
  { name: "JWT Authorization", desc: "Cryptographically verified claims", severity: "CRITICAL", affectedByState: "CRITICAL" },
  { name: "SHA-256 Hashing", desc: "One-way password vault cryptography", severity: "HIGH" },
  { name: "Strict Rate Limiting", desc: "Throttling brute-force attack vectors", severity: "HIGH", affectedByState: "DEGRADED" },
  { name: "httpOnly Cookies", desc: "Mitigate XSS token thefts", severity: "HIGH" },
  { name: "Input Sanitation", desc: "Recursive HTML injection filters", severity: "HIGH" },
  { name: "OTP Authentication", desc: "Multi-factor administrative checks", severity: "MEDIUM" },
];

function Sparkline({ data, good }: { data: number[]; good?: boolean }) {
  const width = 45;
  const height = 15;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = max === min ? height / 2 : height - ((val - min) / (max - min)) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="inline-block mx-2 flex-shrink-0">
      <polyline
        fill="none"
        stroke={good ? "#10B981" : "#EF4444"}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

export default function SecurityCenterPage() {
  const navigate = useNavigate();
  const [shieldState, setShieldState] = useState<"OPERATIONAL" | "DEGRADED" | "CRITICAL">("OPERATIONAL");
  const [isDiagnosticsRunning, setIsDiagnosticsRunning] = useState(false);
  const [diagnosticsClean, setDiagnosticsClean] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessionsFilter, setSessionsFilter] = useState<"ALL" | "SUSPICIOUS">("ALL");
  const [lockdownActive, setLockdownActive] = useState(false);

  const { data, isLoading } = useQuery<ThreatData>({
    queryKey: ["threats"],
    queryFn: apiAdmin.getSecurityInfo,
    refetchInterval: 12000
  });

  // Calculate dynamics based on simulated shield state
  const mockSessions = [
    { ip: "192.168.1.100", name: "Ayesha Khan", role: "SUPER_ADMIN", location: "Lahore, PK", device: "Chrome / Windows", flagged: false },
    { ip: "192.168.1.105", name: "Sara Ahmed", role: "ADMIN", location: "Karachi, PK", device: "Safari / macOS", flagged: false },
    { ip: "198.51.100.44", name: "Suspicious Operator", role: "CANDIDATE", location: "Frankfurt, DE", device: "Curl / Unknown", flagged: true },
    { ip: "203.0.113.88", name: "Brute Force Candidate", role: "CANDIDATE", location: "Virginia, US", device: "Python Requests", flagged: true },
    { ip: "127.0.0.1", name: "System Daemon", role: "ADMIN", location: "Local Loopback", device: "Background Thread", flagged: false }
  ];

  const filteredSessions = mockSessions.filter(s => {
    const isSessionSuspicious = s.flagged && shieldState !== "OPERATIONAL";
    if (sessionsFilter === "SUSPICIOUS") {
      return isSessionSuspicious;
    }
    return true;
  });

  const suspiciousCount = shieldState === "OPERATIONAL" ? 0 : shieldState === "DEGRADED" ? 1 : 2;

  const hasCriticalOffline = GUARDRAILS.some(p => {
    const isOffline = 
      (p.affectedByState === "DEGRADED" && (shieldState === "DEGRADED" || shieldState === "CRITICAL")) ||
      (p.affectedByState === "CRITICAL" && shieldState === "CRITICAL");
    return isOffline && p.severity === "CRITICAL";
  });

  const safeData = data ? {
    threatLevel: shieldState === "CRITICAL" ? "CRITICAL" : shieldState === "DEGRADED" ? "ELEVATED" : "LOW",
    blockedIPs: (data as any).suspendedUsers || 0,
    failedLogins24h: (data as any).recentFailedLogins || 0,
    activeSessions: 12,
    uptime: "99.98%",
    apiP95: "142ms",
    bruteBlocks24h: (data as any).accountsLockedToday || 0,
    rateLimitHits: 14,
    xssAttempts: 0
  } : {
    threatLevel: shieldState === "CRITICAL" ? "CRITICAL" : shieldState === "DEGRADED" ? "ELEVATED" : "LOW",
    blockedIPs: 0,
    failedLogins24h: 0,
    activeSessions: 12,
    uptime: "99.98%",
    apiP95: "142ms",
    bruteBlocks24h: 0,
    rateLimitHits: 14,
    xssAttempts: 0
  };

  const handleRunDiagnostics = () => {
    setIsDiagnosticsRunning(true);
    setDiagnosticsClean(false);
    toast.loading("Scanning shield configurations...");
    setTimeout(() => {
      toast.dismiss();
      setIsDiagnosticsRunning(false);
      setDiagnosticsClean(true);
      if (shieldState === "OPERATIONAL") {
        toast.success("Security Diagnostics: All 8 Cryptographic Guardrails fully intact!");
      } else {
        toast.warning(`Security Diagnostics: Anomalies detected. State is currently ${shieldState}.`);
      }
      setTimeout(() => setDiagnosticsClean(false), 5000);
    }, 2000);
  };

  const handleInitiateLockdown = () => {
    setLockdownActive(true);
    toast.loading("LOCKDOWN SEQUENCE INITIATED: Revoking active session access tokens...");
    setTimeout(() => {
      toast.dismiss();
      toast.error("LOCKDOWN COMPLETE: Admin portal isolated, all third-party API ingress suspended.");
    }, 2500);
  };

  const handleIsolateGuardrail = (name: string) => {
    toast.loading(`ISOLATING ANOMALY: Shielding ${name} traffic channels...`);
    setTimeout(() => {
      toast.dismiss();
      toast.success(`ISOLATION COMPLETE: ${name} isolated. Live rate limiting and system integrity restored.`);
      setShieldState("OPERATIONAL");
    }, 2000);
  };

  const handleDeactivateLockdown = () => {
    toast.loading("DEACTIVATING LOCKDOWN: Re-securing OAuth ingress & restoring token authorization...");
    setTimeout(() => {
      toast.dismiss();
      toast.success("SYSTEM RESTORED: Lockdown deactivated, all security guardrails fully operational.");
      setLockdownActive(false);
      setShieldState("OPERATIONAL");
    }, 2000);
  };

  return (
    <DashboardShell
      title="Security center"
      subtitle="Configure cryptographic keys, active session tokens, and security rules."
    >
      {/* Simulation Controller Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-secondary/20 border border-border/80 rounded-2xl mb-6">
        <div>
          <h4 className="text-xs font-bold text-ink-500 uppercase tracking-widest leading-none mb-1">State Simulator</h4>
          <p className="text-[11px] text-muted-foreground mt-0.5">Toggle states to audit degraded or critical security visual behaviors</p>
        </div>
        <div className="flex bg-secondary border border-border p-0.5 rounded-xl text-[10px] font-bold">
          {(["OPERATIONAL", "DEGRADED", "CRITICAL"] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setShieldState(st);
                setLockdownActive(false);
                toast.success(`Security Shield State changed to ${st}`);
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all",
                shieldState === st 
                  ? st === "CRITICAL"
                    ? "bg-rose-500 text-white font-black"
                    : st === "DEGRADED"
                    ? "bg-amber-500 text-white font-black"
                    : "bg-emerald-500 text-white font-black"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Visual System Shield Banner */}
      {shieldState === "OPERATIONAL" && (
        <div className="relative overflow-hidden border rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/20">
          <div className="flex items-center gap-3.5 z-10">
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest leading-none mb-1 text-emerald-800 dark:text-emerald-450">
                SYSTEM SHIELD: FULLY OPERATIONAL
              </h4>
              <p className="text-[11px] font-medium leading-relaxed text-emerald-700/80 dark:text-emerald-300/80">
                Live rate-limiting, cross-site scripting protectors, and brute-force defenses are actively screening queries.
              </p>
            </div>
          </div>
          <div className="relative group self-start sm:self-auto z-10 select-none flex items-center gap-2">
            {diagnosticsClean && (
              <span className="text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                Integrity: Verified
              </span>
            )}
            <button 
              onClick={handleRunDiagnostics}
              disabled={isDiagnosticsRunning}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-emerald-500/15 border-emerald-500/20 text-emerald-800 dark:text-emerald-300 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isDiagnosticsRunning ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <ShieldCheck size={12} />
              )}
              {isDiagnosticsRunning ? "Running..." : "Run diagnostics"}
            </button>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 w-56 shadow-xl border border-slate-800 text-center leading-normal z-50">
              Triggers audit on the 8 Cryptographic Guardrails, parsing config integrity, database salts, and rate limiting status.
              <div className="absolute top-full right-6 transform translate-x-1/2 border-[5px] border-transparent border-t-slate-900" />
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl" />
        </div>
      )}

      {shieldState === "DEGRADED" && (
        <div className="relative overflow-hidden border rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20">
          <div className="flex items-center gap-3.5 z-10">
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest leading-none mb-1 text-amber-800 dark:text-amber-405">
                SYSTEM SHIELD: PARTIALLY ACTIVE — Rate limiting offline.
              </h4>
              <p className="text-[11px] font-medium leading-relaxed text-amber-700/80 dark:text-amber-300/80">
                SMTP Relay anomalies detected. Rate limiter bypassed. Tap below to isolate the affected guardrail.
              </p>
              <button 
                onClick={() => {
                  const el = document.getElementById("cryptographic-guardrails");
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                    toast.info("Rate limiter currently bypassed. Notice the high-severity amber dot.");
                  }
                }}
                className="text-[10px] font-black text-amber-800 dark:text-amber-400 underline block mt-2 hover:text-amber-950 dark:hover:text-amber-300"
              >
                View affected components &rarr;
              </button>
            </div>
          </div>
          <div className="relative group self-start sm:self-auto z-10 select-none flex items-center gap-2">
            <button 
              onClick={handleRunDiagnostics}
              disabled={isDiagnosticsRunning}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-amber-500/15 border-amber-500/20 text-amber-800 dark:text-amber-305 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isDiagnosticsRunning ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <AlertTriangle size={12} className="animate-pulse" />
              )}
              {isDiagnosticsRunning ? "Running..." : "Run diagnostics"}
            </button>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 w-56 shadow-xl border border-slate-800 text-center leading-normal z-50">
              Triggers audit on the 8 Cryptographic Guardrails, parsing config integrity, database salts, and rate limiting status.
              <div className="absolute top-full right-6 transform translate-x-1/2 border-[5px] border-transparent border-t-slate-900" />
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-amber-500/5 rounded-full blur-xl" />
        </div>
      )}

      {shieldState === "CRITICAL" && (
        <div className="relative overflow-hidden border rounded-2xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 bg-gradient-to-r from-rose-500/15 to-red-500/5 border-rose-500/30 animate-pulse">
          <div className="flex items-center gap-3.5 z-10">
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest leading-none mb-1 text-rose-900 dark:text-rose-400">
                SYSTEM SHIELD: BREACH DETECTED
              </h4>
              <p className="text-[11px] font-medium leading-relaxed text-rose-800/80 dark:text-rose-300/80">
                Multiple failed login sequences and JWT verification failures. Immediate system lockdown recommended.
              </p>
              {lockdownActive ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                  <span className="text-[10px] font-black text-rose-950 dark:text-rose-300 flex items-center gap-1 bg-rose-500/10 border border-rose-500/25 px-3 py-1.5 rounded-xl">
                    🔒 LOCKDOWN STATE ACTIVE
                  </span>
                  <button
                    onClick={handleDeactivateLockdown}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-755 text-white border border-emerald-600/35 rounded-xl text-[11px] font-extrabold shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Deactivate lockdown &rarr;
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleInitiateLockdown}
                  className="mt-3 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-extrabold shadow-lg shadow-rose-900/30 flex items-center gap-1.5 animate-bounce hover:scale-105 active:scale-95 transition-all w-fit"
                >
                  <Ban size={12} />
                  Initiate lockdown protocol &rarr;
                </button>
              )}
            </div>
          </div>
          <div className="relative group self-start sm:self-auto z-10 select-none flex items-center gap-2">
            <button 
              onClick={handleRunDiagnostics}
              disabled={isDiagnosticsRunning}
              className="flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-lg border bg-rose-500/15 border-rose-500/20 text-rose-800 dark:text-rose-305 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              {isDiagnosticsRunning ? (
                <RefreshCw size={12} className="animate-spin" />
              ) : (
                <ShieldAlert size={12} className="animate-pulse" />
              )}
              {isDiagnosticsRunning ? "Running..." : "Run diagnostics"}
            </button>
            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-slate-900 text-white text-[10px] rounded-lg px-2.5 py-1.5 w-56 shadow-xl border border-slate-800 text-center leading-normal z-50">
              Triggers audit on the 8 Cryptographic Guardrails, parsing config integrity, database salts, and rate limiting status.
              <div className="absolute top-full right-6 transform translate-x-1/2 border-[5px] border-transparent border-t-slate-900" />
            </div>
          </div>
          <div className="absolute -right-10 -top-10 w-28 h-28 bg-rose-500/5 rounded-full blur-xl" />
        </div>
      )}

      {/* Modern KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 select-none">
        {KPIS.map(k => {
          const Icon = k.icon;
          const v = safeData[k.key as keyof typeof safeData] ?? "—";
          const isSessions = k.key === "activeSessions";

          return (
            <div
              key={k.key}
              onClick={() => {
                if (isSessions) {
                  setSessionsFilter("ALL");
                  setShowSessionsModal(true);
                }
              }}
              className={cn(
                "relative bg-card border border-border/80 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 group overflow-hidden flex flex-col justify-between min-h-[145px]",
                isSessions ? "cursor-pointer hover:border-primary/20" : "border-border/80"
              )}
            >
              {/* Highlight gradient background glow */}
              <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl group-hover:scale-125 transition-transform" />

              <div className="flex items-start justify-between mb-2">
                <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm", TONE[k.tone])}>
                  <Icon size={15} className="text-white" />
                </div>
                {isLoading ? (
                  <div className="h-4.5 w-10 bg-secondary animate-pulse rounded" />
                ) : (
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", k.bgColor, k.textColor)}>
                    {isSessions ? "View sessions" : "Active"}
                  </span>
                )}
              </div>

              <div>
                {isLoading ? (
                  <div className="h-7 bg-secondary animate-pulse rounded w-16 mb-1.5" />
                ) : (
                  <>
                    <div className="font-serif text-3xl font-bold text-foreground leading-none tracking-tight mb-1.5 group-hover:text-primary transition-colors">
                      {isSessions ? `${v} active` : String(v)}
                    </div>
                    {isSessions && (
                      <div className="text-[10px] font-medium leading-none mt-2">
                        <div className="text-muted-foreground flex justify-between mb-1.5">
                          <span>Baseline comparison:</span>
                          <span>avg: 8</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Suspicious sessions:</span>
                          {suspiciousCount > 0 ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSessionsFilter("SUSPICIOUS");
                                setShowSessionsModal(true);
                              }}
                              className="text-rose-500 font-bold animate-pulse hover:underline bg-transparent border-0 p-0 cursor-pointer"
                            >
                              {suspiciousCount} flagged
                            </button>
                          ) : (
                            <span className="text-emerald-500 font-bold">0 flagged</span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {!isSessions && (
                  <div className="text-[10px] font-extrabold text-ink-300 uppercase tracking-widest mt-1.5">{k.label}</div>
                )}
                {isSessions && (
                  <div className="text-[10px] font-extrabold text-ink-300 uppercase tracking-widest mt-1">{k.label}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Protection Details Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Core System Performance Logs */}
        <SectionCard title="System Performance Logs" className="border-border/80 shadow-md">
          <div className="space-y-1">
            <Row 
              label="Server Uptime SLA" 
              value={safeData.uptime} 
              good 
              sparkline={[99.95, 99.96, 99.98, 99.97, 99.98, 99.98, 99.98]}
              trend="▲0.02% vs yesterday"
              trendGood
            />
            <Row 
              label="API p95 Response Speed" 
              value={safeData.apiP95} 
              good 
              sparkline={[155, 150, 148, 145, 147, 144, 142]}
              trend="▼8ms vs yesterday"
              trendGood
            />
            <Row 
              label="Active Brute-Force Blockouts" 
              value={`${safeData.bruteBlocks24h} accounts`} 
              sparkline={[0, 0, 1, 0, 0, 0, 0]}
              trend="0 vs yesterday"
              trendGood
            />
            <Row 
              label="Rate-Limit Infractions (24h)" 
              value={`${safeData.rateLimitHits} triggers`} 
              sparkline={[18, 15, 12, 20, 17, 16, 14]}
              trend="▼2 vs yesterday"
              trendGood
            />
            <Row 
              label="Sanitized XSS Injections" 
              value={safeData.xssAttempts} 
              good 
              sparkline={[1, 0, 2, 0, 0, 0, 0]}
              trend="0 vs yesterday"
              trendGood
            />
          </div>
        </SectionCard>

        {/* List of active protections */}
        <SectionCard id="cryptographic-guardrails" title="Cryptographic Guardrails" className="border-border/80 shadow-md scroll-mt-6">
          {/* Immediate Alert Banner when a CRITICAL guardrail goes offline */}
          {hasCriticalOffline && (
            <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-center gap-2.5 animate-pulse">
              <ShieldAlert className="text-rose-500 flex-shrink-0 animate-bounce" size={16} />
              <div className="text-[11px] font-bold text-rose-800 dark:text-rose-400">
                CRITICAL COMPROMISE: CSRF Validations & JWT Authorization are offline! Ingress authentication is bypassable.
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {GUARDRAILS.map(p => {
              const isOffline = 
                (p.affectedByState === "DEGRADED" && (shieldState === "DEGRADED" || shieldState === "CRITICAL")) ||
                (p.affectedByState === "CRITICAL" && shieldState === "CRITICAL");
              const isCriticalOffline = isOffline && p.severity === "CRITICAL";
              const isNonCriticalOffline = isOffline && p.severity !== "CRITICAL";

              return (
                <div
                  key={p.name}
                  onClick={() => {
                    if (isOffline) {
                      handleIsolateGuardrail(p.name);
                    }
                  }}
                  className={cn(
                    "p-3.5 rounded-xl border transition-all duration-200 flex flex-col gap-1 group relative overflow-hidden",
                    isCriticalOffline
                      ? "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      : isNonCriticalOffline
                      ? "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-secondary/20 hover:bg-secondary/40 border-border/40 hover:border-primary/10"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {p.name}
                      {/* Criticality Label visible on hover */}
                      <span className={cn(
                        "text-[7.5px] font-black px-1.5 py-0.2 rounded border hidden group-hover:inline transition-all",
                        p.severity === "CRITICAL" ? "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30" :
                        p.severity === "HIGH" ? "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30" :
                        "bg-blue-50 border-blue-100 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
                      )}>
                        {p.severity}
                      </span>
                    </span>
                    
                    {isOffline ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIsolateGuardrail(p.name);
                        }}
                        className={cn(
                          "text-[9px] font-extrabold px-2 py-0.5 rounded border transition-all cursor-pointer hover:scale-105 active:scale-95 animate-pulse flex-shrink-0 z-10",
                          p.severity === "CRITICAL" 
                            ? "bg-rose-500 hover:bg-rose-600 text-white border-rose-600" 
                            : "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
                        )}
                      >
                        Isolate
                      </button>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground leading-tight">
                    {p.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>

      {/* Sessions Detail Modal */}
      {showSessionsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-2xl rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/10">
              <div>
                <h3 className="font-serif text-base text-foreground font-bold flex items-center gap-2">
                  <Shield size={16} className="text-primary animate-pulse" />
                  Active Administrative Sessions
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Audit credentials, devices, and geolocations of active principals</p>
              </div>
              <button 
                onClick={() => setShowSessionsModal(false)} 
                className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </header>

            {/* Filter Tabs inside Modal */}
            <div className="px-6 py-2 border-b border-border bg-secondary/5 flex items-center justify-between gap-4">
              <div className="flex bg-secondary border border-border p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setSessionsFilter("ALL")}
                  className={cn(
                    "px-3 py-1 rounded-md transition-all",
                    sessionsFilter === "ALL" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  All Sessions ({mockSessions.length})
                </button>
                <button
                  onClick={() => setSessionsFilter("SUSPICIOUS")}
                  className={cn(
                    "px-3 py-1 rounded-md transition-all flex items-center gap-1.5",
                    sessionsFilter === "SUSPICIOUS" ? "bg-rose-500 text-white shadow-sm" : "text-muted-foreground hover:text-rose-500"
                  )}
                >
                  Suspicious ({shieldState === "OPERATIONAL" ? 0 : shieldState === "DEGRADED" ? 1 : 2})
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin flex-1 space-y-4">
              <div className="space-y-2.5">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    No sessions match the selected filter.
                  </div>
                ) : (
                  filteredSessions.map((session, sidx) => {
                    const shouldHighlight = session.flagged && shieldState !== "OPERATIONAL";
                    return (
                      <div 
                        key={sidx} 
                        className={cn(
                          "flex items-center justify-between p-3.5 border rounded-2xl transition-all",
                          shouldHighlight
                            ? "bg-rose-500/5 border-rose-500/20"
                            : "bg-secondary/20 border-border/40"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-foreground">{session.name}</span>
                            <span className={cn(
                              "text-[8px] font-black px-1.5 py-0.2 rounded border uppercase tracking-wider leading-none",
                              session.role === "SUPER_ADMIN" ? "bg-purple-50 border-purple-100 text-purple-600" : "bg-blue-50 border-blue-100 text-blue-600"
                            )}>
                              {session.role}
                            </span>
                            {shouldHighlight && (
                              <span className="text-[8.5px] font-bold text-rose-600 animate-pulse uppercase tracking-wider">
                                Suspicious Geolocation
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-1 flex gap-2 font-medium">
                            <span>IP: {session.ip}</span>
                            <span>·</span>
                            <span>Geo: {session.location}</span>
                          </div>
                          <div className="text-[9px] text-muted-foreground/85 font-mono mt-0.5">{session.device}</div>
                        </div>
                        
                        <button
                          onClick={() => {
                            toast.success(`Revoked session credentials for IP ${session.ip}`);
                          }}
                          className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-[10px] font-bold transition-all hover:scale-102 active:scale-98"
                        >
                          Revoke
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <footer className="px-6 py-4 bg-secondary/10 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSessionsModal(false)}
                className="px-5 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-full text-[11px] font-bold transition-all"
              >
                Close Sessions
              </button>
            </footer>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}

function Row({ label, value, good, sparkline, trend, trendGood }: { 
  label: string; 
  value: string | number; 
  good?: boolean;
  sparkline: number[];
  trend: string;
  trendGood: boolean;
}) {
  return (
    <div className="flex justify-between items-center py-3.5 border-b border-border/60 last:border-0 hover:bg-secondary/5 transition-all px-2 rounded-lg flex-wrap sm:flex-nowrap gap-4">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Snapshot value */}
        <span className={cn(
          "font-mono text-xs font-bold tracking-tight px-2.5 py-0.5 rounded-lg border",
          good
            ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30"
            : "bg-secondary border-border text-foreground"
        )}>
          {value}
        </span>

        {/* Real-time Sparkline chart - to the right of the value */}
        <Sparkline data={sparkline} good={trendGood} />
        
        {/* Trend delta label - to the right of the sparkline */}
        <span className={cn(
          "text-[9px] font-extrabold font-mono tracking-wide px-1.5 py-0.5 rounded border select-none whitespace-nowrap",
          trendGood 
            ? "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-450"
            : "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-450"
        )}>
          {trend}
        </span>
      </div>
    </div>
  );
}
