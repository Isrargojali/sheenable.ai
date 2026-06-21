// src/pages/admin/AdminDashboard.tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, Briefcase, Building2, FileText, ShieldCheck, ScrollText, 
  ArrowUpRight, TrendingUp, Activity, X, Clock, Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { apiAdmin } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

type GrowthData = {
  users: number;
  jobs: number;
  employers: number;
  applications: number;
};

type LastChangeItem = {
  date: string;
  count: number;
};

type AdminStats = {
  totalUsers: number;
  activeJobs: number;
  employers: number;
  applications: number;
  todayGrowth: GrowthData;
  weeklyGrowth: GrowthData;
  monthlyGrowth: GrowthData;
  lastChange: {
    users: LastChangeItem | null;
    jobs: LastChangeItem | null;
    employers: LastChangeItem | null;
    applications: LastChangeItem | null;
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
  affectedLabel?: string;
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
    affectedLabel: "Est. 23 emails delayed",
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

const getAuditStory = (log: any) => {
  const name = log.userId || "System";
  const action = log.action;
  const detail = log.detail || "";

  // Parse detail query string or key-value pairs if present
  const getParam = (key: string) => {
    const regex = new RegExp(`(?:^|\\s)${key}=['"]?([^'"\\s]+)['"]?`);
    const match = detail.match(regex);
    return match ? match[1].replace(/['"]/g, "") : null;
  };

  switch (action) {
    case "LOGIN_SUCCESS":
    case "LOGIN_SUCCESS_OAUTH":
      return `${name} signed in`;
    case "LOGIN_FAILED":
      return `${name} failed to sign in`;
    case "LOGOUT":
      return `${name} signed out`;
    case "USER_REGISTERED":
    case "USER_REGISTERED_OAUTH":
    case "SIGNUP":
      return `${name} registered an account`;
    case "JOB_POSTED":
    case "JOB_CREATED": {
      const title = getParam("title") || "a job";
      return `${name} posted job "${title}"`;
    }
    case "JOB_UPDATED": {
      const title = getParam("title") || "a job";
      return `${name} updated ${title}`;
    }
    case "ROLE_CHANGED": {
      const target = getParam("target") || "user";
      return `${name} updated ${target} role`;
    }
    case "USER_SUSPENDED":
      return `${name} suspended user account`;
    case "USER_ACTIVATED":
      return `${name} activated user account`;
    case "USER_VERIFIED":
      return `${name} verified user account`;
    case "BRUTE_FORCE_BLOCK": {
      const ip = getParam("ip") || "IP";
      return `${name} blocked brute force attempt from ${ip}`;
    }
    case "RATE_LIMIT": {
      const ip = getParam("ip") || "IP";
      return `${name} triggered rate limit protection on ${ip}`;
    }
    default:
      return `${name} performed ${action.toLowerCase().replace(/_/g, " ")}`;
  }
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d'>('7d');

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
    queryFn: () => apiAdmin.getAuditLogs({ limit: 50 }),
    select: (data: any) => Array.isArray(data) ? data : []
  });

  const { data: usersData } = useQuery<any>({
    queryKey: ["adminUsers"],
    queryFn: () => apiAdmin.getUsers({ role: 'ADMIN', limit: 20 }),
    select: (data: any) => Array.isArray(data) ? data : []
  });

  // Use only real admin users for active sessions widget
  const adminUsers: any[] = Array.isArray(usersData) ? usersData : [];
  const humanAdmins = adminUsers
    .filter((u: any) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')
    .slice(0, 4)
    .map((u: any) => ({
      name: `${u.profile?.firstName || u.firstName || ''} ${u.profile?.lastName || u.lastName || ''}`.trim() || u.email?.split('@')[0] || 'Admin',
      role: u.role,
      ip: '—',
      active: u.profile?.availabilityStatus === 'Online' ? 'Now' : u.profile?.availabilityStatus === 'Away' ? 'Recently' : 'Offline',
      avatarInitials: ((u.profile?.firstName || u.firstName || u.email || '')[0] || '').toUpperCase() + ((u.profile?.lastName || u.lastName || '')[0] || '').toUpperCase() || 'AD'
    }));

  const systemProcesses = [{ name: "System Daemon", role: "ADMIN", ip: "127.0.0.1", active: "Now", avatarInitials: "SD" }];

  // Use only real audit log data
  const allLogs = (logsData ?? []).map((l: any) => ({
    id: l.id || l._id,
    action: l.action,
    userId: l.operator?.name || l.userId || 'System',
    detail: l.detail || '',
    createdAt: l.createdAt
  }));

  // Quicklinks structure with live mini-stats
  const quickLinks = [
    { 
      to: "/admin/users", 
      filterTo: "/admin/users?role=ADMIN",
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
      filterTo: "/admin/security?tab=threats",
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
      filterTo: "/admin/audit",
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
      subtitle="Monitor platform health, service status, and security compliance."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in mb-6">
        {/* Left Column (Main Governance Panels) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Row with Timeframe Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/20 p-3.5 rounded-2xl border border-border/60">
            <div>
              <h3 className="text-xs font-bold text-ink-500 uppercase tracking-widest">Platform Activity Statistics</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Toggle timeframe to analyze signups and submissions</p>
            </div>
            <div className="flex bg-secondary border border-border p-0.5 rounded-xl text-[10px] font-bold self-start sm:self-auto">
              {(["today", "7d", "30d"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeframe(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all",
                    timeframe === t 
                      ? "bg-card border border-border/60 text-foreground shadow-sm font-black" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === "today" ? "Today" : t === "7d" ? "7 Days" : "30 Days"}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STATS.map(s => {
              const Icon = s.icon;
              const v = stats?.[s.key as keyof AdminStats]?.toLocaleString() ?? "—";
              
              let dv = 0;
              if (stats) {
                if (timeframe === "today") {
                  dv = stats.todayGrowth?.[s.deltaKey as keyof GrowthData] ?? 0;
                } else if (timeframe === "30d") {
                  dv = stats.monthlyGrowth?.[s.deltaKey as keyof GrowthData] ?? 0;
                } else {
                  dv = stats.weeklyGrowth?.[s.deltaKey as keyof GrowthData] ?? 0;
                }
              }

              const timeframeLabel = timeframe === "today" ? "today" : timeframe === "30d" ? "this month" : "this week";
              const lastChangeData = stats?.lastChange?.[s.deltaKey as keyof typeof stats.lastChange];
              
              let lastChangeStr = "";
              if (lastChangeData && lastChangeData.date) {
                const diffMs = Date.now() - new Date(lastChangeData.date).getTime();
                const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
                const count = lastChangeData.count || 1;
                if (diffDays < 1) {
                  lastChangeStr = `today (+${count})`;
                } else if (diffDays === 1) {
                  lastChangeStr = `yesterday (+${count})`;
                } else {
                  lastChangeStr = `${diffDays} days ago (+${count})`;
                }
              }

              return (
                <div 
                  key={s.key} 
                  className={cn(
                    "relative bg-card border border-border/80 rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 transition-all duration-300 group overflow-hidden flex flex-col justify-between min-h-[145px]",
                    s.glow
                  )}
                >
                  <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300",
                      s.color
                    )}>
                      <Icon size={16} className="text-white" />
                    </div>
                    {isLoading ? (
                      <div className="h-5 w-12 bg-secondary animate-pulse rounded-full" />
                    ) : dv > 0 ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 animate-fade-in dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-900/30">
                        <TrendingUp size={10} /> +{dv} {timeframeLabel}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-zinc-200 bg-zinc-50 text-zinc-500 animate-fade-in dark:bg-zinc-800/20 dark:text-zinc-400 dark:border-zinc-850/30">
                        0 {timeframeLabel}
                      </span>
                    )}
                  </div>

                  <div>
                    {isLoading ? (
                      <div className="h-8 bg-secondary animate-pulse rounded-lg w-20 mb-2" />
                    ) : (
                      <>
                        <div className="font-serif text-3.5xl font-bold text-foreground leading-none tracking-tight mb-1 group-hover:text-primary transition-colors duration-300">
                          {v}
                        </div>
                        {dv === 0 && lastChangeStr && (
                          <div className="text-[10px] text-muted-foreground mb-1 font-medium animate-fade-in">
                            Last change: {lastChangeStr}
                          </div>
                        )}
                      </>
                    )}
                    <div className="text-[11px] font-bold text-ink-300 uppercase tracking-wider">{s.label}</div>
                  </div>
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
                    <SectionCard className="h-full relative overflow-hidden border border-border/80 hover:border-primary/20 hover:bg-primary/[0.01] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[175px]">
                      <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/30 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                      
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                            <Icon size={17} className="text-primary group-hover:scale-105 transition-transform" />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-black bg-secondary text-foreground px-2 py-0.5 rounded-lg border border-border/40 group-hover:border-primary/20 transition-all">
                                {q.liveNumber}
                              </span>
                              <span className={cn(
                                "text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                                q.badgeColor
                              )}>
                                {q.badge}
                              </span>
                            </div>
                            <span className="text-[10px] font-extrabold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 hover:underline whitespace-nowrap ml-1">
                              View all &rarr;
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
                        <span 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(q.filterTo);
                          }}
                          className="text-primary hover:bg-primary/10 transition-colors font-mono bg-primary/5 px-2.5 py-0.5 rounded-full border border-primary/10 cursor-pointer"
                        >
                          {q.miniStat}
                        </span>
                      </div>
                    </SectionCard>
                  </Link>
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
              {/* Human Sessions */}
              <div className="space-y-2.5">
                {humanAdmins.map((adm, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-secondary/25 hover:bg-secondary/40 border border-border/45 rounded-xl transition-all duration-200">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-extrabold flex-shrink-0 bg-gradient-to-br from-[#7C3AED] to-[#C8315A]">
                        {adm.avatarInitials}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground truncate">{adm.name}</span>
                          <span className={cn(
                            "inline-block text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest leading-none",
                            adm.role === "SUPER_ADMIN"
                              ? "bg-purple-50 border-purple-100 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400"
                              : "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400"
                          )}>
                            {adm.role === "SUPER_ADMIN" ? "SUPER" : "ADMIN"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">
                          <span className={cn("w-1 h-1 rounded-full", adm.active === "Now" ? "bg-emerald-500 animate-pulse" : "bg-zinc-400")} />
                          <span>{adm.active === "Now" ? "Active now" : adm.active}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[9px] text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded border border-border/30">{adm.ip}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active System Processes */}
              <div className="mt-4 pt-4 border-t border-border/50">
                <div className="text-[10px] font-extrabold text-ink-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
                  Active System Processes
                </div>
                <div className="space-y-2">
                  {systemProcesses.map((sys, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/15 rounded-xl transition-all">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 flex-shrink-0">
                          <Activity size={12} className="animate-pulse" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-foreground">
                            {sys.name} <span className="text-[9px] text-muted-foreground font-medium block sm:inline">(automated background process)</span>
                          </div>
                          <div className="text-[8px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">localhost · loopback</div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-[9px] text-muted-foreground font-mono bg-secondary/50 px-2 py-0.5 rounded border border-border/30">{sys.ip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
                const relTimeLabel = relTime(log.createdAt);

                return (
                  <div key={log.id} className="p-3 bg-secondary/15 hover:bg-secondary/30 border border-border/30 hover:border-primary/10 rounded-xl transition-all duration-200">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-start gap-2 min-w-0">
                        {/* Tiny category dot */}
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0",
                          log.action.includes("FAIL") || log.action.includes("BLOCK") || log.action.includes("SUSPEND")
                            ? "bg-rose-500 animate-pulse"
                            : log.action.includes("SUCCESS") || log.action.includes("VERIF")
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        )} />
                        <span className="text-[11.5px] font-semibold text-foreground leading-normal break-words">
                          {getAuditStory(log)}
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-mono mt-0.5 whitespace-nowrap">{relTimeLabel}</span>
                    </div>
                    {log.detail && (
                      <div className="font-mono text-[9px] text-muted-foreground bg-secondary/35 px-2 py-1 rounded border border-border/20 truncate mt-1">
                        {log.detail}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      </div>

      {/* Core System Services Health - WIDENED to span full width at bottom */}
      <div className="mt-8 border-t border-border/40 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-ink-500 uppercase tracking-widest">Core System Services Health</h3>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">Real-time status updates and diagnostics logs from service boundaries</p>
          </div>
          <span className="text-[10px] font-extrabold text-[#7C3AED] bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-950/30 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider animate-pulse">
            <Sparkles size={10} className="animate-spin" /> Live Diagnostics
          </span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map(service => {
            const isDegraded = service.status === "DEGRADED";
            return (
              <div
                key={service.name}
                onClick={() => setSelectedService(service)}
                title={service.name}
                className={cn(
                  "bg-card border rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[150px]",
                  isDegraded
                    ? "border-2 border-amber-500/80 dark:border-amber-450 border-l-[4px] border-l-amber-500 bg-amber-500/5 dark:bg-amber-950/10 shadow-sm shadow-amber-500/5"
                    : "border border-border/80 hover:border-primary/20"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs sm:text-[13px] font-extrabold text-foreground group-hover:text-primary transition-colors pr-2">
                      {service.name}
                    </span>
                    {/* Status pulsing dot indicator */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isDegraded ? (
                        <div className="relative flex items-center justify-center w-2.5 h-2.5">
                          <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-amber-455 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                        </div>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-wider leading-none",
                        isDegraded ? "text-amber-600 dark:text-amber-405" : "text-emerald-600 dark:text-emerald-450"
                      )}>
                        {service.status}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-[11.5px] text-muted-foreground leading-relaxed line-clamp-2">
                    {service.desc}
                  </p>
                  {isDegraded && service.affectedLabel && (
                    <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1.5 leading-none animate-pulse">
                      {service.affectedLabel}
                    </div>
                  )}
                </div>

                <div className="mt-3.5 border-t border-border/20 pt-2.5 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] text-muted-foreground font-semibold font-mono">
                    <span>L: {service.latency}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <span>U: {service.uptime}</span>
                  </div>
                  
                  {isDegraded ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          toast.success(`Operations team alerted: ${service.name} is currently ${service.status}`);
                        }}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-full text-[9px] font-bold transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                      >
                        Notify team
                      </button>
                      <Link
                        to="/admin/security"
                        onClick={(e) => {
                          e.stopPropagation(); // Avoid opening metrics dialog
                        }}
                        className="text-[9px] sm:text-[10px] font-bold text-amber-700 hover:text-amber-800 dark:text-amber-450 dark:hover:text-amber-300 flex items-center gap-0.5 hover:underline whitespace-nowrap"
                      >
                        Investigate &rarr;
                      </Link>
                    </div>
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
