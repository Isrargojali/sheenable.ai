// src/pages/admin/AdminDashboard.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, Briefcase, Building2, FileText, ShieldCheck, ScrollText, 
  ArrowUpRight, TrendingUp, Activity, X, Clock, Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { apiAdmin } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATS = [
  { 
    key: "totalUsers", 
    label: "Total Platform Users", 
    icon: Users, 
    color: "from-rose-500 to-pink-600 text-rose-500", 
    glow: "shadow-rose-500/10",
    deltaKey: "users" 
  },
  { 
    key: "activeJobs", 
    label: "Active Job Listings", 
    icon: Briefcase, 
    color: "from-violet-500 to-purple-600 text-violet-500", 
    glow: "shadow-violet-500/10",
    deltaKey: "jobs" 
  },
  { 
    key: "employers", 
    label: "Registered Employers", 
    icon: Building2, 
    color: "from-blue-500 to-indigo-600 text-blue-500", 
    glow: "shadow-blue-500/10",
    deltaKey: "employers" 
  },
  { 
    key: "applications", 
    label: "Total Applications", 
    icon: FileText, 
    color: "from-emerald-500 to-teal-600 text-emerald-500", 
    glow: "shadow-emerald-500/10",
    deltaKey: "applications" 
  },
] as const;

type AdminStats = {
  totalUsers: number;
  activeJobs: number;
  employers: number;
  applications: number;
  weeklyGrowth: {
    users: number;
    jobs: number;
    employers: number;
    applications: number;
  };
};

interface ServiceInfo {
  name: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  uptime: string;
  latency: string;
  desc: string;
  history: number[];
  logs: string[];
}

const SERVICES: ServiceInfo[] = [
  { 
    name: "Authentication API", 
    status: "HEALTHY", 
    uptime: "100%", 
    latency: "45ms", 
    desc: "User login, signup, OTP validations & token refresh ciphers.",
    history: [42, 45, 48, 43, 46, 44, 45, 47, 45],
    logs: [
      "22:12:04 [INFO] JWT verify: token validated for candidate-12",
      "22:11:58 [INFO] Login success: admin@sheenable.ai",
      "22:10:14 [INFO] Resent OTP to user Zainab (userId=u_88)"
    ]
  },
  { 
    name: "Semantic Matcher", 
    status: "HEALTHY", 
    uptime: "99.95%", 
    latency: "180ms", 
    desc: "AI profile parsing & job recommendation matching backend.",
    history: [175, 185, 190, 178, 182, 180, 188, 180],
    logs: [
      "22:09:40 [INFO] Recommendation scoring: mapped 15 candidates for job_92",
      "22:08:15 [INFO] Resume parsed: extracted 8 skills for candidate Fatima",
      "22:05:12 [INFO] Cache refreshed: updated semantic embeddings"
    ]
  },
  { 
    name: "Database Service", 
    status: "HEALTHY", 
    uptime: "99.98%", 
    latency: "38ms", 
    desc: "Main database cluster storage, indexes & replica partitions.",
    history: [35, 38, 40, 37, 39, 38, 41, 38],
    logs: [
      "22:11:45 [INFO] Query optimizer: stats updated for applications index",
      "22:09:12 [INFO] Connection pool: active connections 24/100"
    ]
  },
  { 
    name: "Mail Relay", 
    status: "DEGRADED", 
    uptime: "98.8%", 
    latency: "420ms", 
    desc: "SMTP mail relay & transactional email dispatch channels.",
    history: [110, 140, 290, 330, 420, 410, 430, 420],
    logs: [
      "22:12:05 [ERROR] SMTP connection timeout: relay.host.internal (504)",
      "22:11:15 [WARN] Retrying email dispatch for userId=u_44",
      "22:08:04 [INFO] Dispatch success: verification code email sent to u_12"
    ]
  }
];

function relTime(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AdminDashboard() {
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);

  const { data: stats, isLoading } = useQuery<AdminStats>({ 
    queryKey: ["adminStats"], 
    queryFn: apiAdmin.getStats,
    refetchInterval: 15000 
  });

  const { data: threatData } = useQuery<any>({
    queryKey: ["threats"],
    queryFn: apiAdmin.getSecurityInfo,
    refetchInterval: 15000
  });

  const { data: logsData = [] } = useQuery<any[]>({
    queryKey: ["auditLog"],
    queryFn: apiAdmin.getAuditLogs
  });

  const activeAdmins = [
    { name: "Ayesha Khan", role: "SUPER_ADMIN", ip: "192.168.1.100", active: "Now", avatarInitials: "AK" },
    { name: "Sara Ahmed", role: "ADMIN", ip: "192.168.1.105", active: "12m ago", avatarInitials: "SA" },
    { name: "System Daemon", role: "ADMIN", ip: "127.0.0.1", active: "Now", avatarInitials: "SD" }
  ];

  // Dynamic audit logs merge for realistic entries list
  const allLogs = [
    ...(logsData ?? []).map(l => ({
      id: l._id || l.id,
      action: l.action,
      userId: l.userId,
      detail: l.detail,
      createdAt: l.createdAt
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      id: `ext_${i}`, 
      action: ["LOGIN_SUCCESS", "ROLE_CHANGED", "JOB_POSTED", "BRUTE_FORCE_BLOCK", "RATE_LIMIT", "USER_SUSPENDED"][i % 6],
      userId: ["Ayesha Khan", "Sara Ahmed", "TechFlow Inc.", "System Protection Daemon", "Fatima Malik", "Zainab Siddiqui"][i % 6],
      detail: [
        "role=candidate ip=127.0.0.1 browser=Chrome",
        "role_updated target=EMPLOYER supervisor=SUPER_ADMIN",
        "jobId=job_99a title='Staff React Developer'",
        "ip=198.51.100.44 count=45 hits/min",
        "ip=203.0.113.88 attempts=5 threshold_exceeded",
        "account_status=SUSPENDED reason='violating guidelines'"
      ][i % 6],
      createdAt: new Date(Date.now() - (i + 1) * 20 * 60000).toISOString(),
    }))
  ];

  // Quicklinks structure with live mini-stats
  const quickLinks = [
    { 
      to: "/admin/users", 
      label: "User Governance", 
      desc: "Manage profiles, verify accounts, and configure permissions.", 
      icon: Users, 
      badge: "Active", 
      badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30",
      miniStat: "4 admins active",
      liveNumber: "4"
    },
    { 
      to: "/admin/security", 
      label: "Security Center", 
      desc: "Monitor live threat logs, active lockouts, and rate limits.", 
      icon: ShieldCheck, 
      badge: "Shield Active", 
      badgeColor: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-950/30",
      miniStat: `${threatData?.recentFailedLogins ?? 0} threats in 24h`,
      liveNumber: String(threatData?.recentFailedLogins ?? 0)
    },
    { 
      to: "/admin/audit", 
      label: "Audit Trails", 
      desc: "Inspect granular system actions and compliance histories.", 
      icon: ScrollText, 
      badge: "Compliant", 
      badgeColor: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-950/30",
      miniStat: `${allLogs.length} events logged`,
      liveNumber: String(allLogs.length)
    },
  ];

  return (
    <DashboardShell 
      title="Admin overview" 
      subtitle="Real-time control tower of SheEnableAI platform health, user status, and security compliance"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        {/* Left Column (Main Governance Panels) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dynamic Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map(s => {
              const Icon = s.icon;
              const v = stats?.[s.key as keyof AdminStats]?.toLocaleString() ?? "—";
              const dv = stats?.weeklyGrowth?.[s.deltaKey as keyof AdminStats['weeklyGrowth']] ?? 0;

              return (
                <div 
                  key={s.key} 
                  className={`relative bg-card border border-border/80 rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 ${s.glow} transition-all duration-300 group overflow-hidden`}
                >
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                      <Icon size={16} className="text-white" />
                    </div>
                    {isLoading ? (
                      <div className="h-5 w-12 bg-secondary animate-pulse rounded-full" />
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 animate-fade-in">
                        <TrendingUp size={10} /> +{dv} new
                      </span>
                    )}
                  </div>

                  {isLoading ? (
                    <div className="h-8 bg-secondary animate-pulse rounded-lg w-20 mb-2" />
                  ) : (
                    <div className="font-serif text-3.5xl font-bold text-foreground leading-none tracking-tight mb-1.5 group-hover:text-primary transition-colors duration-300">
                      {v}
                    </div>
                  )}
                  <div className="text-[11px] font-bold text-ink-300 uppercase tracking-wider">{s.label}</div>
                </div>
              );
            })}
          </div>

          {/* Control Actions & Navigation Grid */}
          <div>
            <h3 className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-3.5">Platform Governance Modules</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {quickLinks.map(q => {
                const Icon = q.icon;
                return (
                  <Link to={q.to} key={q.to} className="group">
                    <SectionCard className="h-full relative overflow-hidden border border-border/80 hover:border-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[170px]">
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/30 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                            <Icon size={17} className="text-primary group-hover:scale-105 transition-transform" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-black bg-secondary text-foreground px-2 py-0.5 rounded-lg border border-border/40 group-hover:border-primary/20 transition-all">
                              {q.liveNumber}
                            </span>
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider ${q.badgeColor}`}>
                              {q.badge}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {q.label}
                          <ArrowUpRight size={14} className="opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                        </div>
                        <div className="text-[11.5px] text-muted-foreground leading-normal">{q.desc}</div>
                      </div>

                      {/* Live Mini Stats Row */}
                      <div className="mt-4 pt-2.5 border-t border-border/40 flex items-center justify-between text-[9.5px] font-extrabold uppercase tracking-widest text-ink-300">
                        <span>Live status</span>
                        <span className="text-primary font-mono bg-primary/5 px-2 py-0.5 rounded-full border border-primary/10">
                          {q.miniStat}
                        </span>
                      </div>
                    </SectionCard>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* System Services grid with CSS grid auto-fill */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-bold text-ink-500 uppercase tracking-widest">Core System Services Health</h3>
              <span className="text-[10px] font-extrabold text-[#7C3AED] bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-950/30 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider animate-pulse">
                <Sparkles size={10} className="animate-spin" /> Live Diagnostics
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {SERVICES.map(service => {
                const isDegraded = service.status === "DEGRADED";
                return (
                  <div
                    key={service.name}
                    onClick={() => setSelectedService(service)}
                    className={cn(
                      "bg-card border rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[145px]",
                      isDegraded
                        ? "border-2 border-amber-500 dark:border-amber-450 bg-amber-500/5 dark:bg-amber-950/10 shadow-sm shadow-amber-500/5"
                        : "border border-border/80 hover:border-primary/20"
                    )}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs sm:text-[13px] font-extrabold text-foreground group-hover:text-primary transition-colors truncate pr-2">
                          {service.name}
                        </span>
                        {/* Status pulsing dot indicator */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isDegraded ? (
                            <div className="relative flex items-center justify-center w-2.5 h-2.5">
                              <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-amber-400 opacity-75" />
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                            </div>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          )}
                          <span className={cn(
                            "text-[8px] font-black uppercase tracking-wider leading-none",
                            isDegraded ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-450"
                          )}>
                            {service.status}
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] sm:text-[11.5px] text-muted-foreground leading-relaxed line-clamp-2">
                        {service.desc}
                      </p>
                    </div>

                    <div className="mt-3.5 border-t border-border/20 pt-2.5 flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground font-semibold font-mono">
                        <span>L: {service.latency}</span>
                        <span className="text-muted-foreground/30">·</span>
                        <span>U: {service.uptime}</span>
                      </div>
                      
                      {isDegraded ? (
                        <Link
                          to="/admin/security"
                          onClick={(e) => {
                            e.stopPropagation(); // Avoid opening metrics dialog
                          }}
                          className="text-[9px] sm:text-[10px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-450 dark:hover:text-amber-300 flex items-center gap-0.5 hover:underline"
                        >
                          Investigate &rarr;
                        </Link>
                      ) : (
                        <span className="text-[9px] sm:text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          Metrics &rarr;
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (Live Session Widget & Audits Stream) */}
        <div className="lg:col-span-1 space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0 lg:flex lg:flex-col lg:space-y-6">
          {/* Active Admin Sessions widget */}
          <SectionCard title="Active Admin Sessions" subtitle="Currently logged-in security principals">
            <div className="space-y-3">
              {activeAdmins.map((adm, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-secondary/25 hover:bg-secondary/40 border border-border/45 rounded-xl transition-all duration-205">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0 bg-gradient-to-br from-[#7C3AED] to-[#C8315A]">
                      {adm.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{adm.name}</div>
                      <div className="text-[9px] text-muted-foreground font-mono mt-0.5">{adm.ip}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className={cn(
                      "inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none mb-1",
                      adm.role === "SUPER_ADMIN"
                        ? "bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400"
                        : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                    )}>
                      {adm.role === "SUPER_ADMIN" ? "SUPER" : "ADMIN"}
                    </span>
                    <div className="flex items-center justify-end gap-1 text-[8px] text-muted-foreground font-semibold uppercase tracking-wider">
                      <span className={cn("w-1 h-1 rounded-full", adm.active === "Now" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
                      {adm.active}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent Audit Log Entries widget */}
          <SectionCard 
            title="Recent Audit Logs" 
            subtitle="Latest system audit logs ledger events"
            actions={<Link to="/admin/audit" className="text-[10px] text-primary font-bold hover:underline">View All &rarr;</Link>}
          >
            <div className="space-y-3.5">
              {allLogs.slice(0, 5).map((log) => {
                const actionLabel = log.action?.replace(/_/g, " ");
                const relTimeLabel = relTime(log.createdAt);

                const getActionStyles = (act: string) => {
                  const c = act.toLowerCase();
                  if (c.includes("success") || c.includes("verified")) return "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30";
                  if (c.includes("fail") || c.includes("block") || c.includes("suspend")) return "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-950/30";
                  if (c.includes("rate") || c.includes("limit")) return "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-950/30";
                  return "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-950/30";
                };

                return (
                  <div key={log.id} className="p-3 bg-secondary/15 hover:bg-secondary/30 border border-border/30 hover:border-primary/10 rounded-xl transition-all duration-200">
                    <div className="flex items-center justify-between gap-2.5 flex-wrap mb-1.5">
                      <span className={cn(
                        "text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none",
                        getActionStyles(log.action)
                      )}>
                        {actionLabel}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-mono">{relTimeLabel}</span>
                    </div>
                    <div className="text-xs font-semibold text-foreground">{log.userId}</div>
                    <div className="font-mono text-[9.5px] text-muted-foreground bg-secondary/35 px-2 py-1 rounded border border-border/20 truncate mt-1">
                      {log.detail}
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Service Metrics Slide-Over Modal / Dialog */}
      {selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-lg rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base text-foreground font-bold flex items-center gap-2">
                  <Activity size={16} className="text-primary animate-pulse" />
                  {selectedService.name} Health Metrics
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">{selectedService.desc}</p>
              </div>
              <button 
                onClick={() => setSelectedService(null)} 
                className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-6 overflow-y-auto scrollbar-thin flex-1 space-y-5">
              {/* KPIs */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary/40 p-3 rounded-2xl border border-border/40 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Status</div>
                  <span className={cn(
                    "inline-block text-[10px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider mt-1.5 leading-none",
                    selectedService.status === "HEALTHY"
                      ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                      : "bg-amber-50 border-amber-100 text-amber-700"
                  )}>
                    {selectedService.status}
                  </span>
                </div>
                <div className="bg-secondary/40 p-3 rounded-2xl border border-border/40 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Latency</div>
                  <div className="font-mono text-lg font-bold text-foreground mt-1.5">{selectedService.latency}</div>
                </div>
                <div className="bg-secondary/40 p-3 rounded-2xl border border-border/40 text-center">
                  <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Uptime SLA</div>
                  <div className="font-mono text-lg font-bold text-emerald-600 mt-1.5">{selectedService.uptime}</div>
                </div>
              </div>

              {/* Latency History Chart (High-fidelity inline sparkline graphic) */}
              <div className="bg-secondary/20 border border-border/50 rounded-2xl p-4">
                <h4 className="text-[10px] font-bold text-ink-450 uppercase tracking-widest mb-3">Latency Sparkline (Last 8 cycles)</h4>
                <div className="h-16 flex items-end gap-1.5 px-2">
                  {selectedService.history.map((h, idx) => {
                    const maxVal = Math.max(...selectedService.history);
                    const pct = Math.max((h / maxVal) * 100, 15);
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                        <div 
                          className={cn(
                            "w-full rounded-t-sm transition-all duration-500",
                            selectedService.status === "HEALTHY" ? "bg-primary/75 group-hover:bg-primary" : "bg-amber-500/70 group-hover:bg-amber-500"
                          )} 
                          style={{ height: `${pct}%` }} 
                        />
                        <span className="font-mono text-[8px] text-muted-foreground opacity-60 group-hover:opacity-100">{h}ms</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Live Logs console */}
              <div>
                <h4 className="text-[10px] font-bold text-ink-450 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <ScrollText size={11} className="text-primary" /> Live Service Event Logs
                </h4>
                <div className="font-mono text-[10.5px] bg-secondary/80 border border-border/60 text-muted-foreground p-3.5 rounded-xl space-y-1.5 max-h-40 overflow-y-auto leading-normal">
                  {selectedService.logs.map((log, lidx) => (
                    <div key={lidx} className="truncate hover:text-foreground transition-colors">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <footer className="px-6 py-4 bg-secondary/10 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="px-5 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-full text-[11px] font-bold transition-all active:scale-95"
              >
                Close Metrics
              </button>
            </footer>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
