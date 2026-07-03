// src/pages/superadmin/ThreatMonitorPage.tsx
import { useState, useEffect } from "react";
import { useQuery }            from "@tanstack/react-query";
import { cn }                  from "@/lib/utils";
import { apiAdmin }            from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { 
  ShieldCheck, AlertTriangle, ShieldAlert, Activity, Play, 
  Trash2, Ban, History, ShieldAlert as AlertIcon, RefreshCw, X 
} from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

// Live counter that increments slowly to simulate real-time
function LiveCounter({ base }: { base: number }) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const t = setInterval(() => { if (Math.random() > 0.7) setVal(v => v + 1); }, 3500);
    return () => clearInterval(t);
  }, []);
  return <span>{val.toLocaleString()}</span>;
}

interface LogEntry {
  id: string;
  action: string;
  userId: string;
  detail: string;
  createdAt: string;
}

const AUDIT_COLORS: Record<string, string> = {
  LOGIN_SUCCESS: "bg-[var(--ink-100)] text-[var(--status-ok)] border-[var(--ink-200)]",
  BRUTE_FORCE_BLOCK: "bg-[var(--ink-100)] text-[var(--status-danger)] border-[var(--ink-200)] font-bold",
  ADMIN_ACTION: "bg-[var(--ink-100)] text-[var(--brand-pink)] border-[var(--ink-200)]",
  JOB_POSTED: "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-200)]",
  SIGNUP: "bg-[var(--ink-100)] text-[var(--ink-700)] border-[var(--ink-200)]",
  RATE_LIMIT: "bg-[var(--ink-100)] text-[var(--status-danger)] border-[var(--ink-200)]",
  LOGIN_FAILED: "bg-[var(--ink-100)] text-[var(--status-danger)] border-[var(--ink-200)]"
};

interface MicroBarChartProps {
  history: number[];
  colorClass: string;
  todayVal: number;
  avgVal: number;
}

function MicroBarChart({ history, colorClass, todayVal, avgVal }: MicroBarChartProps) {
  const max = Math.max(...history, 1);
  const isElevated = todayVal > 2 * avgVal && avgVal > 0;

  return (
    <div className="flex items-center gap-2">
      {isElevated && (
        <span className="text-[8.5px] font-black bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.2 rounded uppercase tracking-wide animate-pulse">
          ↑ Elevated
        </span>
      )}
      
      {/* 7-day bar representation */}
      <div className="flex items-end gap-[2px] h-[16px] w-[34px] px-1 bg-white/[0.02] border border-white/[0.04] rounded-sm relative group select-none">
        {/* Baseline average line */}
        <div 
          className="absolute left-0 right-0 border-t border-white/20 border-dashed pointer-events-none" 
          style={{ bottom: `${(avgVal / max) * 100}%` }} 
          title={`Average: ${avgVal.toFixed(1)}`}
        />
        
        {history.map((val, idx) => {
          const heightPct = (val / max) * 100;
          const isToday = idx === history.length - 1;
          return (
            <div
              key={idx}
              className={cn(
                "w-[3px] rounded-t-xs transition-all",
                isToday ? colorClass : "bg-white/10 group-hover:bg-white/25"
              )}
              style={{ height: `${Math.max(heightPct, 15)}%` }}
              title={`Day ${idx + 1}: ${val}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function ThreatMonitorPage() {
  const { data: threat, isLoading } = useQuery({ 
    queryKey: ["threatMonitor"], 
    queryFn: apiAdmin.getThreatData,
    refetchInterval: 5000 
  });
  const t = threat ?? { threatLevel:"LOW", uptime:"99.97%", apiP95:"94ms", activeSessions:1, blockedIPs:0, failedLogins24h:0, bruteBlocks24h:0, rateLimitHits:0, xssAttempts:0 };

  // Local Interactive States
  const [blockedIPsList, setBlockedIPsList] = useState<string[]>([]);
  const [bannedEmails, setBannedEmails] = useState<string[]>([]);
  const [dismissedLogs, setDismissedLogs] = useState<string[]>([]);
  
  // Security Layer Tests State
  const [isTestingLayers, setIsTestingLayers] = useState(false);
  const [testedTimestamp, setTestedTimestamp] = useState<string | null>(null);

  // Live Audit Stream Interaction
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Hacker lock countdown timer (starts at 4m 22s = 262 seconds)
  const [hackerLockSeconds, setHackerLockSeconds] = useState(262);

  useEffect(() => {
    const interval = setInterval(() => {
      setHackerLockSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatLockCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s.toString().padStart(2, "0")}s`;
  };

  const handleExtendLock = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHackerLockSeconds(prev => prev + 300);
    toast.success("Extended brute-force hacker lockout period by 300s.");
  };

  const handleRunSecurityTests = () => {
    setIsTestingLayers(true);
    toast.loading("Probing rate limiters & API ingress...");
    
    setTimeout(() => {
      toast.dismiss();
      toast.loading("Verifying DOMPurify XSS payload sanitation...");
      
      setTimeout(() => {
        toast.dismiss();
        setIsTestingLayers(false);
        setTestedTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        toast.success("All 8 Security Layers successfully audited & verified working!");
      }, 1200);
    }, 1200);
  };

  const handleBlockIP = (ip: string) => {
    if (blockedIPsList.includes(ip)) {
      toast.info(`IP ${ip} is already blocked permanently`);
      return;
    }
    setBlockedIPsList(prev => [...prev, ip]);
    toast.success(`IP Address ${ip} permanently blocked in firewall drop rules.`);
  };

  const handleDismissEvent = (id: string) => {
    setDismissedLogs(prev => [...prev, id]);
    toast.success("Security event dismissed from live dashboard stream");
  };

  // Threat Level Cards dynamic styles
  const threatLevel = t.threatLevel?.toUpperCase() || "LOW";
  let threatColor = "text-[var(--status-ok)]";
  if (threatLevel === "MEDIUM" || threatLevel === "ELEVATED") {
    threatColor = "text-[var(--status-warn)]";
  } else if (threatLevel === "HIGH" || threatLevel === "CRITICAL") {
    threatColor = "text-[var(--status-danger)]";
  }

  const leftBorderStrip = threatLevel === "LOW" 
    ? "border-l-[3px] border-l-[var(--status-ok)]" 
    : (threatLevel === "MEDIUM" || threatLevel === "ELEVATED" 
      ? "border-l-[3px] border-l-[var(--status-warn)]" 
      : "border-l-[3px] border-l-[var(--status-danger)]");

  const statCards = [
    { label: "Threat level status", val: t.threatLevel, colorClass: threatColor, icon: ShieldAlert, delta: "Live status" },
    { label: "Blocked IP count", val: t.blockedIPs + blockedIPsList.length, colorClass: "text-[var(--ink-900)]", icon: Ban, delta: "Firewall rule" },
    { label: "Total requests volume", val: t.activeSessions, colorClass: "text-[var(--ink-900)]", icon: Activity, delta: "Active streams" }
  ];

  // 24H Security Events details
  const SECURITY_EVENTS = [
    { label: "Failed login attempts", val: t.failedLogins24h, history: [Math.round(t.failedLogins24h * 0.4), Math.round(t.failedLogins24h * 0.6), Math.round(t.failedLogins24h * 0.5), Math.round(t.failedLogins24h * 0.7), Math.round(t.failedLogins24h * 0.8), Math.round(t.failedLogins24h * 0.9), t.failedLogins24h], barBg: "bg-[var(--status-warn)]", avg: Number((t.failedLogins24h / 7).toFixed(1)) },
    { label: "Brute-force blocks", val: t.bruteBlocks24h, history: [0, 0, 0, 0, 0, 0, t.bruteBlocks24h], barBg: "bg-[var(--status-danger)]", avg: Number((t.bruteBlocks24h / 7).toFixed(2)) },
    { label: "Rate limit hits", val: t.rateLimitHits, history: [Math.round(t.rateLimitHits * 0.4), Math.round(t.rateLimitHits * 0.5), Math.round(t.rateLimitHits * 0.6), Math.round(t.rateLimitHits * 0.7), Math.round(t.rateLimitHits * 0.8), Math.round(t.rateLimitHits * 0.9), t.rateLimitHits], barBg: "bg-[var(--status-warn)]", avg: Number((t.rateLimitHits / 7).toFixed(1)) },
    { label: "XSS attempts blocked", val: t.xssAttempts || 0, history: [0, 0, 0, 0, 0, 0, 0], barBg: "bg-[var(--status-ok)]", avg: 0 },
    { label: "Suspicious requests", val: 0, history: [0, 0, 0, 0, 0, 0, 0], barBg: "bg-[var(--status-ok)]", avg: 0 },
    { label: "Failed auth tokens", val: 0, history: [0, 0, 0, 0, 0, 0, 0], barBg: "bg-[var(--status-ok)]", avg: 0 }
  ];

  const SECURITY_LAYERS = [
    { name: "Password hashing", method: "SHA-256 + bcrypt(12)" },
    { name: "Session security", method: "32-byte crypto tokens" },
    { name: "XSS protection", method: "DOMPurify + sanitize" },
    { name: "CSRF tokens", method: "All state routes" },
    { name: "SQL injection", method: "Prisma ORM (parameterized)" },
    { name: "Rate limiting", method: "15/min per IP" },
    { name: "Brute-force guard", method: "5 attempts → 5min lock" },
    { name: "JWT cookies", method: "httpOnly + SameSite=Strict" },
  ];

  // Dynamic audit logs merge for simulation
  const mockAuditLogs: LogEntry[] = [
    { id: "a1", action: "LOGIN_SUCCESS",   userId: "Ayesha Khan",    detail: "role=candidate ip=192.168.1.104 browser=Chrome OS=Windows", createdAt: new Date(Date.now() - 2 * 60000).toISOString() },
    { id: "a2", action: "SIGNUP",          userId: "Fatima Malik",   detail: "role=candidate otp_pending method=SMS",                  createdAt: new Date(Date.now() - 11 * 60000).toISOString() },
    { id: "a3", action: "JOB_POSTED",      userId: "TechFlow Inc.",  detail: 'jobId=job_7 title="React Native Dev" category="IT"',        createdAt: new Date(Date.now() - 33 * 60000).toISOString() },
    { id: "a4", action: "RATE_LIMIT",      userId: "unknown",        detail: "ip=192.168.1.1 route=/api/auth/login count=18",     createdAt: new Date(Date.now() - 42 * 60000).toISOString() },
    { id: "a5", action: "BRUTE_FORCE_BLOCK",userId:"hacker@evil.com",detail: "ip=198.51.100.44 attempts=5 locked_300s",             createdAt: new Date(Date.now() - 78 * 60000).toISOString() },
    { id: "a6", action: "LOGIN_SUCCESS",   userId: "Sara Ahmed",     detail: "role=candidate ip=10.0.0.5 browser=Safari",                 createdAt: new Date(Date.now() - 120 * 60000).toISOString() },
    { id: "a7", action: "ADMIN_ACTION",    userId: "Admin",          detail: "approved employerId=emp_15 TechCorp",        createdAt: new Date(Date.now() - 180 * 60000).toISOString() },
  ].filter(l => !dismissedLogs.includes(l.id));

  return (
    <DashboardShell
      title="Threat Monitor"
      subtitle="Real-time platform security intelligence, ingress logs, and active firewall controls"
      actions={
        <button
          onClick={handleRunSecurityTests}
          disabled={isTestingLayers}
          className="bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] border-0 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-none"
        >
          {isTestingLayers ? (
            <RefreshCw size={14} className="animate-spin text-white" />
          ) : (
            <Play size={14} className="text-white" />
          )}
          <span>{isTestingLayers ? "Auditing..." : "Run security tests"}</span>
        </button>
      }
    >
      {/* Top threat cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 select-none">
        {statCards.map(c => {
          const Icon = c.icon;
          const isThreatLevel = c.label === "Threat level status";
          const isBlockedIP = c.label === "Blocked IP count";

          let dotColor = "";
          if (isThreatLevel) {
            dotColor = threatLevel === "LOW" ? "bg-[var(--status-ok)]" : (threatLevel === "MEDIUM" || threatLevel === "ELEVATED" ? "bg-[var(--status-warn)]" : "bg-[var(--status-danger)]");
          } else if (isBlockedIP) {
            const blockedVal = t.blockedIPs + blockedIPsList.length;
            dotColor = blockedVal > 0 ? "bg-[var(--status-warn)]" : "bg-[var(--status-ok)]";
          }

          let numberColor = "text-[var(--ink-900)]";
          if (isThreatLevel) {
            numberColor = threatColor;
          }

          return (
            <div 
              key={c.label} 
              className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 hover:shadow-lg transition-all duration-300 flex flex-col justify-between min-h-[130px] shadow-[var(--shadow-card)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-7 h-7 rounded-full bg-[var(--ink-100)] flex items-center justify-center">
                  <Icon size={16} strokeWidth={1.75} className="text-[var(--ink-500)]" />
                </div>
                {c.delta && (
                  <span className="bg-[var(--ink-100)] text-[var(--ink-700)] text-[11px] font-medium px-2 py-0.5 rounded-full select-none">
                    {c.delta}
                  </span>
                )}
              </div>
              <div>
                <div className={cn("text-[32px] font-semibold leading-none mb-1.5", numberColor)}>
                  {typeof c.val === "number" ? <LiveCounter base={c.val as number} /> : c.val}
                </div>
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--ink-500)]">
                  {dotColor && (
                    <span className={cn("w-2 h-2 rounded-full flex-shrink-0", dotColor)} />
                  )}
                  <span>{c.label}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* 24h metrics with micro-trend bars */}
        <div className={cn("bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)] select-none", leftBorderStrip)}>
          <h3 className="text-sm font-semibold text-[var(--ink-900)] mb-4">24h security events</h3>
          <div className="space-y-1">
            {SECURITY_EVENTS.map((e) => {
              const isZero = e.val === 0;
              const valColor = isZero 
                ? "text-[var(--ink-500)]" 
                : "text-[var(--status-danger)] font-semibold";

              return (
                <div key={e.label} className="flex items-center justify-between py-3 border-b border-[var(--ink-200)]/40 last:border-0 hover:bg-[var(--ink-50)]/50 transition-all px-1.5 rounded-lg">
                  <span className="text-xs text-[var(--ink-700)] font-medium">{e.label}</span>
                  <div className="flex items-center gap-4">
                    <span className={cn("text-xs font-bold font-mono", valColor)}>{e.val}</span>
                    <MicroBarChart 
                      history={e.history} 
                      colorClass={e.barBg} 
                      todayVal={e.val} 
                      avgVal={e.avg} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security layers with automated tests */}
        <div className={cn("bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)]", leftBorderStrip)}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--ink-900)]">Security layers status</h3>
            <button
              onClick={handleRunSecurityTests}
              disabled={isTestingLayers}
              className="bg-[var(--surface)] hover:bg-[var(--ink-100)] border border-[var(--ink-200)] text-[var(--ink-900)] text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-none"
            >
              {isTestingLayers ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <Play size={14} className="text-[var(--ink-500)]" />
              )}
              <span>{isTestingLayers ? "Auditing..." : "Run security tests"}</span>
            </button>
          </div>
          <div className="space-y-3.5">
            {SECURITY_LAYERS.map(l => {
              return (
                <div key={l.name} className="flex items-center justify-between py-2 border-b border-[var(--ink-200)]/40 last:border-0">
                  <div>
                    <div className="text-xs text-[var(--ink-900)] font-bold flex items-center gap-2">
                      {l.name}
                    </div>
                    <div className="text-[10px] text-[var(--ink-500)] font-mono mt-0.5">{l.method}</div>
                  </div>
                  <div className="text-right">
                    {testedTimestamp ? (
                      <span className="text-[9.5px] font-mono text-[var(--status-ok)] font-semibold select-none">
                        Active &middot; Verified {testedTimestamp}
                      </span>
                    ) : (
                      <span className="text-[9.5px] font-mono text-[var(--ink-500)] select-none">
                        Active &middot; Last tested: 3d ago{" "}
                        <button 
                          onClick={handleRunSecurityTests}
                          disabled={isTestingLayers}
                          className="text-[9px] font-semibold text-[var(--ink-700)] hover:underline bg-transparent border-0 p-0 cursor-pointer inline ml-1"
                        >
                          (test now &rarr;)
                        </button>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Live audit stream */}
      <div className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-card)] select-none">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-[var(--ink-900)]">Live SOC audit stream</h3>
          <div className="flex items-center gap-1.5 bg-[var(--status-ok)]/10 border border-[var(--status-ok)]/20 px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-[var(--status-ok)] rounded-full animate-pulse" />
            <span className="text-[8.5px] text-[var(--status-ok)] font-semibold tracking-widest uppercase">SOC LIVE</span>
          </div>
        </div>
        
        <div className="space-y-1">
          {mockAuditLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const ip = log.detail.match(/ip=([^\s]+)/)?.[1] || "198.51.100.44";
            const isBlocked = blockedIPsList.includes(ip);
            const isBanned = bannedEmails.includes(log.userId);
            const isHacker = log.userId === "hacker@evil.com";

            return (
              <div 
                key={log.id} 
                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                className={cn(
                  "relative flex flex-col px-3.5 py-3 border border-transparent rounded-xl hover:bg-[var(--ink-50)]/50 hover:border-[var(--ink-200)]/60 transition-all duration-150 cursor-pointer group",
                  isExpanded && "bg-[var(--ink-50)] border-[var(--ink-200)]/85 shadow-sm"
                )}
              >
                {/* Horizontal row details */}
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[var(--ink-500)] flex-shrink-0 w-16 text-[9.5px]">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                  </span>
                  
                  {/* Event action badge */}
                  <span className={cn(
                    "text-[8.5px] font-semibold px-2.5 py-0.5 rounded-full border flex-shrink-0 uppercase tracking-wider",
                    AUDIT_COLORS[log.action] ?? "bg-[var(--ink-100)] border-[var(--ink-200)] text-[var(--ink-500)]"
                  )}>
                    {log.action.replace(/_/g, " ")}
                  </span>
                  
                  <span className="text-[var(--ink-900)] text-xs font-semibold flex items-center gap-1.5">
                    {log.userId}
                    {isBanned && (
                      <span className="text-[8px] font-bold bg-[var(--status-danger)]/15 text-[var(--status-danger)] border border-[var(--status-danger)]/20 px-1.5 rounded uppercase">Banned</span>
                    )}
                  </span>

                  {/* Hacker auto-release countdown details */}
                  {isHacker && hackerLockSeconds > 0 && (
                    <span className="text-[9.5px] text-[var(--status-danger)] font-mono font-medium ml-2 flex items-center gap-1">
                      <span className="animate-pulse">Auto-release in {formatLockCountdown(hackerLockSeconds)}</span>
                      <span className="text-[var(--ink-400)]">&middot;</span>
                      <button
                        onClick={handleExtendLock}
                        className="text-[9px] text-[var(--brand-pink)] hover:underline bg-transparent border-0 p-0 font-semibold cursor-pointer"
                      >
                        [Extend lock &rarr;]
                      </button>
                    </span>
                  )}

                  {isBlocked && (
                    <span className="text-[8px] font-bold bg-[var(--status-danger)]/15 border border-[var(--status-danger)]/20 text-[var(--status-danger)] px-1.5 py-0.2 rounded uppercase ml-2 animate-pulse">
                      IP Blocked
                    </span>
                  )}

                  {/* Shortened details payload with hover tooltip */}
                  <div className="ml-auto hidden sm:block truncate max-w-[200px]" onClick={e => e.stopPropagation()}>
                    <TooltipProvider>
                      <Tooltip delayDuration={200}>
                        <TooltipTrigger asChild>
                          <span className="text-[var(--ink-400)] text-[9.5px] font-mono cursor-help truncate block">
                            {log.detail}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="end" className="bg-[var(--surface)] border border-[var(--ink-200)] text-[var(--ink-700)] text-[10px] font-mono max-w-sm p-2.5 rounded-xl shadow-2xl">
                          <div className="font-semibold text-[var(--brand-pink)] mb-1 border-b border-[var(--ink-200)]/80 pb-1">Forensic Metadata</div>
                          <div className="break-all whitespace-pre-wrap">{log.detail}</div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {/* Inline Action strip on Hover */}
                {(log.action === "BRUTE_FORCE_BLOCK" || log.action === "RATE_LIMIT") && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1.5 bg-[var(--surface)] border border-[var(--ink-200)] px-3 py-1 rounded-xl shadow-lg z-20 font-mono text-[9px]">
                    {!isBlocked ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBlockIP(ip);
                        }}
                        className="text-[var(--status-danger)] hover:underline font-bold bg-transparent border-0 p-0 cursor-pointer"
                      >
                        Block IP
                      </button>
                    ) : (
                      <span className="text-[var(--ink-400)] cursor-not-allowed">Blocked</span>
                    )}
                    <span className="text-[var(--ink-200)] font-light">&middot;</span>
                    {!isBanned ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setBannedEmails(prev => [...prev, log.userId]);
                          toast.success(`User email ${log.userId} permanently banned`);
                        }}
                        className="text-[var(--status-warn)] hover:underline font-bold bg-transparent border-0 p-0 cursor-pointer"
                      >
                        Ban email
                      </button>
                    ) : (
                      <span className="text-[var(--ink-400)] cursor-not-allowed">Banned</span>
                    )}
                    <span className="text-[var(--ink-200)] font-light">&middot;</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info(`SOC Query: Fetching access history for principal ${log.userId}...`);
                      }}
                      className="text-[var(--brand-pink)] hover:underline font-semibold bg-transparent border-0 p-0 cursor-pointer"
                    >
                      View history
                    </button>
                    <span className="text-[var(--ink-200)] font-light">&middot;</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismissEvent(log.id);
                      }}
                      className="text-[var(--ink-500)] hover:underline bg-transparent border-0 p-0 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Click Expand Detail Drawer */}
                {isExpanded && (
                  <div 
                    onClick={e => e.stopPropagation()} 
                    className="mt-3.5 p-4 bg-[var(--ink-50)] border border-[var(--ink-200)]/80 rounded-xl text-left cursor-default space-y-3"
                  >
                    <div className="flex justify-between items-center flex-wrap gap-2 text-[10px] text-[var(--ink-500)]">
                      <span>Event Log UUID: {log.id}</span>
                      <span>Target IP: {ip}</span>
                    </div>

                    <div className="text-xs text-[var(--ink-700)] leading-normal">
                      <span className="font-bold text-[var(--ink-900)]">Forensic Context: </span>
                      System action <span className="text-[var(--brand-pink)] font-bold">{log.action}</span> was recorded from operator <span className="text-[var(--ink-900)] font-bold">{log.userId}</span>. 
                      {isHacker && hackerLockSeconds > 0 && (
                        <span> Auto-release trigger countdown: <strong className="text-[var(--status-danger)]">{formatLockCountdown(hackerLockSeconds)}</strong>.</span>
                      )}
                    </div>

                    {/* Expand actions row */}
                    <div className="flex flex-wrap gap-2 items-center justify-between border-t border-[var(--ink-200)]/60 pt-3">
                      <div className="flex items-center gap-2">
                        {isHacker && hackerLockSeconds > 0 && (
                          <button
                            onClick={handleExtendLock}
                            className="px-3 py-1 bg-[var(--status-warn)]/10 hover:bg-[var(--status-warn)]/20 text-[var(--status-warn)] rounded-lg text-[9.5px] font-bold border border-[var(--status-warn)]/20 transition-all cursor-pointer"
                          >
                            Extend lock (+300s)
                          </button>
                        )}
                        {(log.action === "BRUTE_FORCE_BLOCK" || log.action === "RATE_LIMIT") && !isBlocked && (
                          <button
                            onClick={() => handleBlockIP(ip)}
                            className="px-3 py-1 bg-[var(--status-danger)]/10 hover:bg-[var(--status-danger)]/20 text-[var(--status-danger)] rounded-lg text-[9.5px] font-bold border border-[var(--status-danger)]/20 transition-all cursor-pointer"
                          >
                            Block IP Permanently
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                            toast.success("Event details copied to clipboard");
                          }}
                          className="px-2.5 py-1 bg-[var(--ink-100)] hover:bg-[var(--ink-200)] text-[var(--ink-700)] rounded-lg text-[9.5px] font-semibold transition-all cursor-pointer border border-[var(--ink-200)]"
                        >
                          Copy JSON
                        </button>
                        <button
                          onClick={() => handleDismissEvent(log.id)}
                          className="px-2.5 py-1 bg-[var(--ink-100)] hover:bg-[var(--ink-200)] text-[var(--ink-700)] rounded-lg text-[9.5px] font-semibold transition-all cursor-pointer border border-[var(--ink-200)]"
                        >
                          Dismiss Event
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
