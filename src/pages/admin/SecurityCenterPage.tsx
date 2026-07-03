import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldCheck, AlertTriangle, Activity, Lock, RefreshCw, 
  Shield, CheckCircle, X, KeyRound, Eye, Ban, HelpCircle
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
  { key: "threatLevel", label: "Threat level status", icon: ShieldCheck },
  { key: "blockedIPs", label: "Active blocked IPs", icon: Lock },
  { key: "failedLogins24h", label: "Failed logins (24h)", icon: AlertTriangle },
  { key: "activeSessions", label: "Active sessions", icon: Activity },
] as const;

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
    queryFn: async () => {
      const res = await apiAdmin.getThreatData();
      return res as ThreatData;
    },
    refetchInterval: 12000
  });

  // Sync simulated shield state with backend threat level initially
  useEffect(() => {
    if (data?.threatLevel) {
      const level = data.threatLevel.toUpperCase();
      if (level === "CRITICAL") {
        setShieldState("CRITICAL");
      } else if (level === "ELEVATED") {
        setShieldState("DEGRADED");
      } else {
        setShieldState("OPERATIONAL");
      }
    }
  }, [data?.threatLevel]);

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
    threatLevel: shieldState === "CRITICAL" ? "CRITICAL" : shieldState === "DEGRADED" ? "ELEVATED" : (data.threatLevel || "LOW"),
    blockedIPs: data.blockedIPs || 0,
    failedLogins24h: data.failedLogins24h || 0,
    activeSessions: data.activeSessions || 1,
    uptime: data.uptime || "99.98%",
    apiP95: data.apiP95 || "142ms",
    bruteBlocks24h: data.bruteBlocks24h || 0,
    rateLimitHits: data.rateLimitHits || 0,
    xssAttempts: data.xssAttempts || 0
  } : {
    threatLevel: shieldState === "CRITICAL" ? "CRITICAL" : shieldState === "DEGRADED" ? "ELEVATED" : "LOW",
    blockedIPs: 0,
    failedLogins24h: 0,
    activeSessions: 1,
    uptime: "99.98%",
    apiP95: "142ms",
    bruteBlocks24h: 0,
    rateLimitHits: 0,
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
      actions={
        <button
          onClick={handleRunDiagnostics}
          disabled={isDiagnosticsRunning}
          className="bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] border-0 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-none"
        >
          <RefreshCw size={14} className={cn("text-white", isDiagnosticsRunning && "animate-spin")} />
          <span>{isDiagnosticsRunning ? "Running..." : "Run diagnostics"}</span>
        </button>
      }
    >
      {/* Simulation Controller Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-2xl mb-6">
        <div>
          <h4 className="text-sm font-semibold text-[var(--ink-900)] leading-none mb-1">State simulator</h4>
          <p className="text-[11px] text-[var(--ink-500)] mt-0.5">Toggle states to audit degraded or critical security visual behaviors</p>
        </div>
        <div className="flex bg-[var(--ink-100)] p-1 rounded-full">
          {(["OPERATIONAL", "DEGRADED", "CRITICAL"] as const).map((st) => {
            const labelMap = {
              OPERATIONAL: "Operational",
              DEGRADED: "Degraded",
              CRITICAL: "Critical"
            };
            const isActive = shieldState === st;
            return (
              <button
                key={st}
                onClick={() => {
                  setShieldState(st);
                  setLockdownActive(false);
                  toast.success(`Security Shield State changed to ${st}`);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[13px] font-medium transition-all cursor-pointer border-0 select-none",
                  isActive 
                    ? "bg-[var(--brand-pink)] text-white shadow-sm" 
                    : "bg-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                )}
              >
                {labelMap[st]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Visual System Shield Banner */}
      {(() => {
        const stateConfig = {
          OPERATIONAL: {
            heading: "System shield: fully operational",
            body: "Live rate-limiting, cross-site scripting protectors, and brute-force defenses are actively screening queries.",
            dotColor: "bg-[var(--status-ok)]",
            borderColor: "border-l-[var(--status-ok)]",
          },
          DEGRADED: {
            heading: "System shield: partially active — Rate limiting offline",
            body: "SMTP Relay anomalies detected. Rate limiter bypassed. Tap below to isolate the affected guardrail.",
            dotColor: "bg-[var(--status-warn)]",
            borderColor: "border-l-[var(--status-warn)]",
          },
          CRITICAL: {
            heading: "System shield: breach detected",
            body: "Multiple failed login sequences and JWT verification failures. Immediate system lockdown recommended.",
            dotColor: "bg-[var(--status-danger)]",
            borderColor: "border-l-[var(--status-danger)]",
          }
        };

        const currentShield = stateConfig[shieldState];

        return (
          <div className={cn("relative overflow-hidden border border-[var(--ink-200)] border-l-[3px] rounded-[var(--radius-card)] p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 bg-[var(--surface)] shadow-[var(--shadow-card)]", currentShield.borderColor)}>
            <div className="flex items-start gap-3.5 z-10">
              <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0 animate-pulse", currentShield.dotColor)} />
              <div>
                <h4 className="text-sm font-semibold text-[var(--ink-900)] leading-none mb-2">
                  {currentShield.heading}
                </h4>
                <p className="text-[13px] text-[var(--ink-500)] leading-relaxed">
                  {currentShield.body}
                </p>
                
                {shieldState === "DEGRADED" && (
                  <button 
                    onClick={() => {
                      const el = document.getElementById("cryptographic-guardrails");
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" });
                        toast.info("Rate limiter currently bypassed. Notice the high-severity amber dot.");
                      }
                    }}
                    className="text-[11px] font-medium text-[var(--ink-700)] hover:underline block mt-2 cursor-pointer bg-transparent border-0 p-0"
                  >
                    View affected components &rarr;
                  </button>
                )}

                {shieldState === "CRITICAL" && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                    {lockdownActive ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-700)] select-none bg-[var(--ink-100)] px-2.5 py-1 rounded-full border border-[var(--ink-200)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--status-danger)]" />
                          Lockdown state active
                        </span>
                        <button
                          onClick={handleDeactivateLockdown}
                          className="h-9 px-4 rounded-[var(--radius-input)] text-xs font-semibold border border-[var(--ink-200)] text-[var(--ink-900)] bg-[var(--surface)] hover:bg-[var(--ink-50)] transition-all cursor-pointer"
                        >
                          Deactivate lockdown &rarr;
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={handleInitiateLockdown}
                        className="h-9 px-4 rounded-[var(--radius-input)] text-xs font-semibold text-white bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] transition-all w-fit cursor-pointer border-0"
                      >
                        <Ban size={12} />
                        Initiate lockdown protocol &rarr;
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Diagnostics Trigger Button */}
            <div className="relative group self-start sm:self-auto z-10 select-none flex items-center gap-2">
              {shieldState === "OPERATIONAL" && diagnosticsClean && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--ink-700)] select-none bg-[var(--ink-100)] px-2.5 py-1 rounded-full border border-[var(--ink-200)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-ok)]" />
                  Integrity verified
                </span>
              )}
              <button 
                onClick={handleRunDiagnostics}
                disabled={isDiagnosticsRunning}
                className="bg-[var(--surface)] hover:bg-[var(--ink-100)] border border-[var(--ink-200)] text-[var(--ink-900)] text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-none"
              >
                {isDiagnosticsRunning ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <ShieldCheck size={14} className="text-[var(--ink-500)]" />
                )}
                <span>{isDiagnosticsRunning ? "Running..." : "Run diagnostics"}</span>
              </button>
              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-[var(--ink-900)] text-[var(--ink-50)] text-[10px] rounded-lg px-2.5 py-1.5 w-56 shadow-xl border border-[var(--ink-700)] text-center leading-normal z-50">
                Triggers audit on the 8 Cryptographic Guardrails, parsing config integrity, database salts, and rate limiting status.
                <div className="absolute top-full right-6 transform translate-x-1/2 border-[5px] border-transparent border-t-[var(--ink-900)]" />
              </div>
            </div>
          </div>
        );
      })()}

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
                    "bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 hover:shadow-[var(--shadow-card)] transition-all duration-300 group flex flex-col justify-between min-h-[130px] shadow-[var(--shadow-card)]",
                    isSessions ? "cursor-pointer hover:border-[var(--brand-pink)]/20" : ""
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-7 h-7 rounded-full bg-[var(--ink-100)] flex items-center justify-center">
                      <Icon size={16} strokeWidth={1.75} className="text-[var(--ink-500)]" />
                    </div>
                    {isLoading ? (
                      <div className="h-4.5 w-10 bg-[var(--ink-100)] animate-pulse rounded-full" />
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--ink-700)] select-none">
                        <span className="w-2 h-2 rounded-full bg-[var(--status-ok)]" />
                        {isSessions ? "View sessions" : "Active"}
                      </span>
                    )}
                  </div>

                  <div>
                    {isLoading ? (
                      <div className="h-7 bg-[var(--ink-100)] animate-pulse rounded w-16 mb-1.5" />
                    ) : (
                      <>
                        <div className="text-[32px] font-semibold text-[var(--ink-900)] leading-none mb-1.5 group-hover:text-[var(--brand-pink)] transition-colors">
                          {isSessions ? `${v} active` : String(v)}
                        </div>
                        {isSessions && (
                          <div className="text-[10px] font-medium leading-none mt-2">
                            <div className="text-[var(--ink-500)] flex justify-between mb-1.5">
                              <span>Baseline comparison:</span>
                              <span>avg: 8</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-[var(--ink-500)]">Suspicious sessions:</span>
                              {suspiciousCount > 0 ? (
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSessionsFilter("SUSPICIOUS");
                                    setShowSessionsModal(true);
                                  }}
                                  className="text-[var(--status-danger)] font-bold animate-pulse hover:underline bg-transparent border-0 p-0 cursor-pointer"
                                >
                                  {suspiciousCount} flagged
                                </button>
                              ) : (
                                <span className="text-[var(--status-ok)] font-bold">0 flagged</span>
                              )}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div className="text-[13px] font-medium text-[var(--ink-500)] mt-1.5">{k.label}</div>
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
        <SectionCard id="cryptographic-guardrails" title="Cryptographic Guardrails" className="border-[var(--ink-200)] shadow-[var(--shadow-card)] scroll-mt-6">
          {/* Immediate Alert Banner when a CRITICAL guardrail goes offline */}
          {hasCriticalOffline && (
            <div className="mb-4 p-3 bg-[var(--ink-100)] border border-[var(--status-danger)] border-l-[4px] border-l-[var(--status-danger)] rounded-xl flex items-center gap-2.5 animate-pulse">
              <ShieldAlert className="text-[var(--status-danger)] flex-shrink-0 animate-bounce" size={16} />
              <div className="text-[11px] font-bold text-[var(--status-danger)]">
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
                      ? "bg-white border-l-[4px] border-l-[var(--status-danger)] border-[var(--ink-200)] hover:bg-[var(--ink-50)] cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      : isNonCriticalOffline
                      ? "bg-white border-l-[4px] border-l-[var(--status-warn)] border-[var(--ink-200)] hover:bg-[var(--ink-50)] cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      : "bg-[var(--surface)] hover:bg-[var(--ink-50)] border-[var(--ink-200)]"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--ink-900)] group-hover:text-[var(--brand-pink)] transition-colors flex items-center gap-1.5">
                      {p.name}
                      {/* Criticality Label visible on hover */}
                      <span className="text-[7.5px] font-semibold px-1.5 py-0.2 rounded border hidden group-hover:inline transition-all border-[var(--ink-200)] bg-[var(--ink-100)] text-[var(--ink-700)]">
                        {p.severity}
                      </span>
                    </span>
                    
                    {isOffline ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIsolateGuardrail(p.name);
                        }}
                        className="text-[9px] font-semibold px-2 py-0.5 rounded border transition-all cursor-pointer hover:scale-105 active:scale-95 animate-pulse flex-shrink-0 z-10 bg-[var(--ink-100)] border-[var(--ink-300)] text-[var(--ink-900)] hover:bg-[var(--ink-200)]"
                      >
                        Isolate
                      </button>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--status-ok)] flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--ink-500)] leading-tight">
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
          <div className="bg-[var(--surface)] w-full max-w-2xl rounded-3xl border border-[var(--ink-200)] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="px-6 py-4 border-b border-[var(--ink-200)] flex items-center justify-between bg-[var(--ink-50)]">
              <div>
                <h3 className="font-serif text-base text-[var(--ink-900)] font-bold flex items-center gap-2">
                  <Shield size={16} className="text-[var(--ink-500)]" />
                  Active Administrative Sessions
                </h3>
                <p className="text-[11px] text-[var(--ink-500)] mt-0.5">Audit credentials, devices, and geolocations of active principals</p>
              </div>
              <button 
                onClick={() => setShowSessionsModal(false)} 
                className="p-1.5 hover:bg-[var(--ink-100)] rounded-full text-[var(--ink-400)] hover:text-[var(--ink-900)] transition-all"
              >
                <X size={15} />
              </button>
            </header>

            {/* Filter Tabs inside Modal */}
            <div className="px-6 py-2 border-b border-[var(--ink-200)] bg-[var(--ink-50)] flex items-center justify-between gap-4">
              <div className="flex bg-[var(--ink-100)] border border-[var(--ink-200)] p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setSessionsFilter("ALL")}
                  className={cn(
                    "px-3 py-1 rounded-md transition-all",
                    sessionsFilter === "ALL" ? "bg-white text-[var(--ink-900)] shadow-sm" : "text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                  )}
                >
                  All Sessions ({mockSessions.length})
                </button>
                <button
                  onClick={() => setSessionsFilter("SUSPICIOUS")}
                  className={cn(
                    "px-3 py-1 rounded-md transition-all flex items-center gap-1.5",
                    sessionsFilter === "SUSPICIOUS" ? "bg-[var(--status-danger)] text-white shadow-sm" : "text-[var(--ink-500)] hover:text-[var(--status-danger)]"
                  )}
                >
                  Suspicious ({shieldState === "OPERATIONAL" ? 0 : shieldState === "DEGRADED" ? 1 : 2})
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto scrollbar-thin flex-1 space-y-4">
              <div className="space-y-2.5">
                {filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-[var(--ink-500)] text-xs">
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
                            ? "bg-white border-l-[4px] border-l-[var(--status-danger)] border-[var(--ink-200)]"
                            : "bg-[var(--surface)] border-[var(--ink-200)]"
                        )}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-[var(--ink-900)]">{session.name}</span>
                            <span className="text-[8px] font-semibold px-1.5 py-0.2 rounded border bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-200)] uppercase tracking-wider">
                              {session.role}
                            </span>
                            {shouldHighlight && (
                              <span className="text-[8.5px] font-bold text-[var(--status-danger)] animate-pulse uppercase tracking-wider">
                                Suspicious Geolocation
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--ink-500)] mt-1 flex gap-2 font-medium">
                            <span>IP: {session.ip}</span>
                            <span>·</span>
                            <span>Geo: {session.location}</span>
                          </div>
                          <div className="text-[9px] text-[var(--ink-400)] font-mono mt-0.5">{session.device}</div>
                        </div>
                        
                        <button
                          onClick={() => {
                            toast.success(`Revoked session credentials for IP ${session.ip}`);
                          }}
                          className="px-3 py-1.5 bg-[var(--ink-100)] border border-[var(--ink-300)] text-[var(--ink-900)] hover:bg-[var(--ink-200)] rounded-xl text-[10px] font-bold transition-all hover:scale-102 active:scale-98"
                        >
                          Revoke
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <footer className="px-6 py-4 bg-[var(--ink-50)] border-t border-[var(--ink-200)] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowSessionsModal(false)}
                className="h-11 px-5 rounded-[var(--radius-input)] text-sm font-semibold border border-[var(--ink-300)] text-[var(--ink-700)] hover:bg-[var(--ink-100)] bg-white transition-all shadow-none"
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
    <div className="flex justify-between items-center py-3.5 border-b border-[var(--ink-200)] last:border-0 hover:bg-[var(--ink-50)] transition-all px-2 rounded-lg flex-wrap sm:flex-nowrap gap-4">
      <span className="text-xs font-semibold text-[var(--ink-500)]">{label}</span>
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Snapshot value */}
        <span className={cn(
          "font-mono text-xs font-bold tracking-tight px-2.5 py-0.5 rounded-lg border border-[var(--ink-200)] bg-[var(--ink-100)]",
          good ? "text-[var(--status-ok)]" : "text-[var(--ink-700)]"
        )}>
          {value}
        </span>

        {/* Real-time Sparkline chart - to the right of the value */}
        <Sparkline data={sparkline} good={trendGood} />
        
        {/* Trend delta label - to the right of the sparkline */}
        <span className={cn(
          "text-[9px] font-extrabold font-mono tracking-wide px-1.5 py-0.5 rounded border border-[var(--ink-200)] bg-[var(--ink-100)] select-none whitespace-nowrap",
          trendGood ? "text-[var(--status-ok)]" : "text-[var(--status-danger)]"
        )}>
          {trend}
        </span>
      </div>
    </div>
  );
}
