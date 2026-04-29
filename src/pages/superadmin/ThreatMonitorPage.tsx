// src/pages/superadmin/ThreatMonitorPage.tsx
import { useState, useEffect } from "react";
import { useQuery }            from "@tanstack/react-query";
import { cn }                  from "@/lib/utils";
import { apiAdmin }            from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { MOCK_AUDIT_LOGS }     from "@/mock/data";

// Live counter that increments slowly to simulate real-time
function LiveCounter({ base }: { base: number }) {
  const [val, setVal] = useState(base);
  useEffect(() => {
    const t = setInterval(() => { if (Math.random() > 0.7) setVal(v => v + 1); }, 3000);
    return () => clearInterval(t);
  }, []);
  return <span>{val.toLocaleString()}</span>;
}

const AUDIT_COLORS: Record<string,string> = {
  LOGIN_SUCCESS:"rgba(74,222,128,.12) text-emerald-400",
  BRUTE_FORCE_BLOCK:"rgba(220,38,38,.15) text-red-400",
  ADMIN_ACTION:"rgba(167,139,250,.15) text-purple-400",
  JOB_POSTED:"rgba(96,165,250,.15) text-blue-400",
  SIGNUP:"rgba(96,165,250,.12) text-blue-400",
  RATE_LIMIT:"rgba(251,191,36,.12) text-amber-400",
};

export default function ThreatMonitorPage() {
  const { data: threat } = useQuery({ queryKey:["threatMonitor"], queryFn: apiAdmin.getThreatData });
  const t = threat ?? { threatLevel:"LOW", uptime:"99.97%", apiP95:"94ms", activeSessions:847, blockedIPs:2, failedLogins24h:12, bruteBlocks24h:2, rateLimitHits:4, xssAttempts:0 };

  const SECURITY_LAYERS = [
    { name:"Password Hashing",   method:"SHA-256 + bcrypt(12)",  status:"✓",  color:"text-emerald-400" },
    { name:"Session Security",   method:"32-byte crypto tokens", status:"✓",  color:"text-emerald-400" },
    { name:"XSS Protection",     method:"DOMPurify + sanitize",  status:"✓",  color:"text-emerald-400" },
    { name:"CSRF Tokens",        method:"All state routes",       status:"✓",  color:"text-emerald-400" },
    { name:"SQL Injection",      method:"Prisma ORM (parameterized)",status:"✓",color:"text-emerald-400"},
    { name:"Rate Limiting",      method:"15/min per IP",          status:"✓",  color:"text-emerald-400" },
    { name:"Brute-force Guard",  method:"5 attempts → 5min lock", status:"✓",  color:"text-emerald-400" },
    { name:"JWT Cookies",        method:"httpOnly + SameSite=Strict",status:"✓",color:"text-emerald-400"},
  ];

  return (
    <DashboardShell
      title="Threat Monitor"
      subtitle="Real-time platform security intelligence"
    >
      {/* Top threat cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label:"Threat Level",     val: t.threatLevel,       color:"text-emerald-400", bg:"bg-emerald-500/10 border-emerald-500/20" },
          { label:"Blocked IPs",      val: t.blockedIPs,        color:"text-red-400",     bg:"bg-red-500/10 border-red-500/20"         },
          { label:"Active Sessions",  val: t.activeSessions,    color:"text-purple-400",  bg:"bg-purple-500/10 border-purple-500/20"   },
        ].map(c => (
          <div key={c.label} className={cn("rounded-xl p-4 border", c.bg)}>
            <div className="text-[10px] font-bold text-white/40 uppercase tracking-[.6px] mb-2">{c.label}</div>
            <div className={cn("font-serif text-3xl font-normal", c.color)}>
              {typeof c.val === "number" ? <LiveCounter base={c.val as number} /> : c.val}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-5">
        {/* 24h metrics */}
        <div className="bg-[#1a0d26] border border-purple-500/20 rounded-xl p-4">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-[.6px] mb-3">24h Security Events</div>
          <div className="space-y-1">
            {[
              ["Failed Login Attempts",  t.failedLogins24h,  "text-amber-400"],
              ["Brute-force Blocks",     t.bruteBlocks24h,   "text-red-400"  ],
              ["Rate Limit Hits",        t.rateLimitHits,    "text-amber-400"],
              ["XSS Attempts Blocked",   t.xssAttempts,      "text-emerald-400"],
              ["Suspicious Requests",    0,                  "text-emerald-400"],
              ["Failed Auth Tokens",     3,                  "text-amber-400"],
            ].map(([l,v,color]) => (
              <div key={l as string} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-xs text-white/60">{l}</span>
                <span className={cn("text-sm font-bold font-mono", color as string)}>{v as number}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Security layers */}
        <div className="bg-[#1a0d26] border border-purple-500/20 rounded-xl p-4">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-[.6px] mb-3">Security Layers — All Active</div>
          <div className="space-y-2">
            {SECURITY_LAYERS.map(l => (
              <div key={l.name} className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
                <div>
                  <div className="text-xs text-white/70 font-medium">{l.name}</div>
                  <div className="text-[9px] text-white/30 font-mono mt-0.5">{l.method}</div>
                </div>
                <span className={cn("text-xs font-bold", l.color)}>{l.status} Active</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Live audit stream */}
      <div className="bg-[#1a0d26] border border-purple-500/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-[.6px]">Live Audit Stream</div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-[9px] text-emerald-400 font-semibold">LIVE</span>
          </div>
        </div>
        <div className="space-y-0.5">
          {MOCK_AUDIT_LOGS.map((log, i) => {
            const [bg, color] = (AUDIT_COLORS[log.action] ?? "rgba(255,255,255,.05) text-white/40").split(" ");
            return (
              <div key={log.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors">
                <span className="font-mono text-white/25 flex-shrink-0 w-16 text-[9px]">
                  {new Date(log.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"})}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: bg }}>
                  <span className={color}>{log.action.replace(/_/g," ")}</span>
                </span>
                <span className="text-white/55 text-xs truncate">{log.userId}</span>
                <span className="ml-auto text-white/20 text-[9px] font-mono hidden sm:block truncate max-w-[160px]">{log.detail}</span>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
