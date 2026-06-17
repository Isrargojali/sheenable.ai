// src/pages/superadmin/SuperAdminDashboard.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
  ShieldAlert, UserCog, Activity, Server, Database, Key, 
  Users, Briefcase, FileText, Sparkles, TrendingUp, AlertTriangle, 
  CheckCircle, ArrowRight, UserPlus, Shield, Cpu, FileDown, Ban,
  HardDrive, Layers, X, ScrollText
} from "lucide-react";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { apiAdmin } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ServiceInfo {
  name: string;
  status: "HEALTHY" | "DEGRADED" | "DOWN";
  uptime: string;
  latency: string;
  desc: string;
  history: number[];
  logs: string[];
  affectedLabel?: string;
  icon: any;
}

const SERVICES: ServiceInfo[] = [
  { 
    name: "API Gateway", 
    status: "HEALTHY", 
    uptime: "100%", 
    latency: "28ms", 
    desc: "Route dispatcher, TLS endpoints, and rate-limiting rules.",
    history: [25, 28, 30, 27, 29, 28, 29, 28],
    logs: ["API Routing: all backends healthy", "TLS Cert check: OK"],
    icon: Server
  },
  { 
    name: "Postgres Primary", 
    status: "HEALTHY", 
    uptime: "99.98%", 
    latency: "38ms", 
    desc: "Main database cluster storage, indexes & replica partitions.",
    history: [35, 38, 40, 37, 39, 38, 41, 38],
    logs: ["Connection pool: active 24/100", "Vacuum completed"],
    icon: Database
  },
  { 
    name: "Auth Service", 
    status: "HEALTHY", 
    uptime: "100%", 
    latency: "45ms", 
    desc: "User login, signup, OTP validations & token refresh ciphers.",
    history: [42, 45, 48, 43, 46, 44, 45, 47],
    logs: ["JWT verification: token validated"],
    icon: Key
  },
  { 
    name: "Mail Relay", 
    status: "DEGRADED", 
    uptime: "98.8%", 
    latency: "420ms", 
    desc: "SMTP mail relay & transactional email dispatch channels.",
    history: [110, 140, 290, 330, 420, 410, 430, 420],
    affectedLabel: "Est. 23 emails delayed",
    logs: ["SMTP connection timeout: relay.host.internal (504)"],
    icon: Server
  },
  { 
    name: "Redis Cache", 
    status: "HEALTHY", 
    uptime: "99.99%", 
    latency: "2ms", 
    desc: "Session store, cache tokens, and semantic embedding maps.",
    history: [2, 3, 2, 2, 3, 2, 2, 2],
    logs: ["Key eviction: 0/1000", "Memory check: 45MB used"],
    icon: Layers
  },
  { 
    name: "Storage Buckets", 
    status: "HEALTHY", 
    uptime: "100%", 
    latency: "75ms", 
    desc: "Document vaults, CV storage, and user profile avatar pictures.",
    history: [72, 75, 78, 74, 76, 75, 76, 75],
    logs: ["Asset saved: candidate_cv_904.pdf"],
    icon: Database
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

function CircularGauge({ value, label, colorClass, size = 68 }: { value: number; label: string; colorClass: string; size?: number }) {
  const radius = size * 0.4;
  const strokeWidth = size * 0.08;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1.5 p-3.5 bg-secondary/15 rounded-2xl border border-border/40 hover:shadow-md transition-all flex-1 min-w-[75px] text-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-muted/15"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={cn("transition-all duration-1000", colorClass)}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[11.5px] font-black text-foreground">
          {value}%
        </div>
      </div>
      <div className="text-[9.5px] font-extrabold uppercase tracking-widest text-ink-300 mt-1">{label}</div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [selectedService, setSelectedService] = useState<ServiceInfo | null>(null);

  // Stats query
  const { data: stats } = useQuery<any>({ 
    queryKey: ["adminStats"], 
    queryFn: apiAdmin.getStats
  });

  // Security query
  const { data: threatData } = useQuery<any>({
    queryKey: ["threats"],
    queryFn: apiAdmin.getSecurityInfo
  });

  // Audit Logs query
  const { data: logsData = [] } = useQuery<any[]>({
    queryKey: ["auditLog"],
    queryFn: apiAdmin.getAuditLogs
  });

  // System Health query
  const { data: healthData } = useQuery<any>({
    queryKey: ["systemHealth"],
    queryFn: apiAdmin.getSystemHealth,
    refetchInterval: 10000
  });

  const ICON_MAP: Record<string, any> = {
    Server,
    Database,
    Key,
    Layers
  };

  const liveServices = (healthData?.services || SERVICES).map((s: any) => {
    return {
      ...s,
      icon: ICON_MAP[s.iconName] || s.icon || Server
    };
  });

  // Pending super admin actions queue
  const [pendingActions, setPendingActions] = useState([
    {
      id: "pa1",
      type: "EMPLOYER_VERIFICATION",
      title: "TechFlow Inc. (Employer Profile)",
      desc: "Vetting files submitted. Requires validation check of business registration certificates.",
      urgency: "HIGH",
      actionText: "Verify Now",
      onAction: () => {
        toast.success("TechFlow Inc. verified successfully!");
      }
    },
    {
      id: "pa2",
      type: "ROLE_ESCALATION",
      title: "Platform Support (Sara Ahmed)",
      desc: "Requests promotion from ADMIN to SUPER_ADMIN role for upcoming infrastructure compliance audit.",
      urgency: "HIGH",
      actionText: "Approve Role",
      onAction: () => {
        toast.success("Sara Ahmed promoted to SUPER_ADMIN!");
      }
    },
    {
      id: "pa3",
      type: "GDPR_DELETION",
      title: "GDPR Account Purge (Fatima Malik)",
      desc: "Verification validation complete. Requesting structural user deletion of candidate_121.",
      urgency: "MEDIUM",
      actionText: "Process Deletion",
      onAction: () => {
        toast.success("Fatima Malik GDPR purge request completed!");
      }
    }
  ]);

  const handleAction = (id: string, actionName: string, executeFn: () => void) => {
    executeFn();
    setPendingActions(prev => prev.filter(item => item.id !== id));
  };

  const handleDismiss = (id: string) => {
    setPendingActions(prev => prev.filter(item => item.id !== id));
    toast.success("Notification dismissed.");
  };

  // Quick action modal trigger simulation
  const handleSuspendUserPrompt = () => {
    const email = window.prompt("Enter candidate or employer email to suspend:");
    if (email) {
      toast.success(`User ${email} suspended successfully! Action recorded in audit logs.`);
    }
  };

  const handleExportComplianceReport = () => {
    toast.loading("Generating compliance payload...");
    setTimeout(() => {
      toast.dismiss();
      toast.success("Platform Compliance Ledger downloaded successfully (PDF/CSV)!");
    }, 1500);
  };

  // Nav cards dynamic data snippets
  const QUICK = [
    { 
      to: "/super-admin/manage-admins",  
      label: "Manage admins",   
      desc: "Create, revoke, audit",         
      icon: UserCog,
      snippet: "3 active · 0 pending approval",
      snippetColor: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-950/30"
    },
    { 
      to: "/super-admin/threat-monitor", 
      label: "Threat monitor",  
      desc: "Live attack feed",              
      icon: Activity,
      snippet: `Threat level: LOW · ${threatData?.recentFailedLogins ?? 0} failures 24h`,
      snippetColor: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-950/30"
    },
    { 
      to: "/admin/security",             
      label: "Security center", 
      desc: "All platform protections",      
      icon: ShieldAlert,
      snippet: "12 active sessions · 0 breaches detected",
      snippetColor: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-950/30"
    },
  ];

  // System active admin sessions list
  const activeAdmins = [
    { name: "Ayesha Khan", role: "SUPER_ADMIN", action: "Updated Auth security policy", active: "Now" },
    { name: "Sara Ahmed", role: "ADMIN", action: "Suspended user account", active: "12m ago" },
    { name: "System Daemon", role: "ADMIN (Automated)", action: "Flushed Redis token cache", active: "Now" }
  ];

  return (
    <DashboardShell
      title="Super admin command center"
      subtitle="The most powerful view in the platform — handle with care"
    >
      {/* 1. Hero Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-fade-in">
        {/* Total Users */}
        <div className="relative bg-card border border-border/80 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-sm">
              <Users size={15} className="text-white" />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30">
              <TrendingUp size={10} /> +{stats?.todayGrowth?.users ?? 0} today
            </span>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-foreground leading-none mb-1">
              {stats?.totalUsers?.toLocaleString() ?? "—"}
            </div>
            <div className="text-[9.5px] font-extrabold text-ink-300 uppercase tracking-widest">Platform Users</div>
          </div>
        </div>

        {/* Active Jobs */}
        <div className="relative bg-card border border-border/80 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <Briefcase size={15} className="text-white" />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-950/30">
              <TrendingUp size={10} /> +{stats?.todayGrowth?.jobs ?? 0} today
            </span>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-foreground leading-none mb-1">
              {stats?.activeJobs?.toLocaleString() ?? "—"}
            </div>
            <div className="text-[9.5px] font-extrabold text-ink-300 uppercase tracking-widest">Active Job Listings</div>
          </div>
        </div>

        {/* AI Matches Today */}
        <div className="relative bg-card border border-border/80 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles size={15} className="text-white animate-spin" />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-blue-100 bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-450 dark:border-blue-950/30 uppercase tracking-wider animate-pulse">
              Live score
            </span>
          </div>
          <div>
            <div className="font-serif text-3xl font-bold text-foreground leading-none mb-1">
              {stats?.aiMatchesToday?.toLocaleString() ?? "—"}
            </div>
            <div className="text-[9.5px] font-extrabold text-ink-300 uppercase tracking-widest">AI Matches Today</div>
          </div>
        </div>

        {/* Revenue / GMV */}
        <div className="relative bg-card border border-border/80 rounded-2xl p-5 hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between min-h-[120px] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
              <FileText size={15} className="text-white" />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450 dark:border-emerald-950/30">
              +12.5% mo
            </span>
          </div>
          <div>
            <div className="font-serif text-2xl font-bold text-foreground leading-none mb-1">
              Rs. {stats?.revenueGMV?.toLocaleString() ?? "—"}
            </div>
            <div className="text-[9.5px] font-extrabold text-ink-300 uppercase tracking-widest">Platform GMV / Revenue</div>
          </div>
        </div>
      </div>

      {/* 2. Navigation Cards with Live Snippets */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        {QUICK.map(q => {
          const Icon = q.icon;
          return (
            <Link to={q.to} key={q.to} className="group">
              <SectionCard className="h-full hover:border-primary/30 hover:bg-primary/[0.01] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between min-h-[145px]">
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon size={16} className="text-primary group-hover:scale-105 transition-transform" />
                    </div>
                    <span className={cn(
                      "text-[9px] font-extrabold px-2 py-0.5 rounded-full border tracking-wide",
                      q.snippetColor
                    )}>
                      {q.snippet}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors">
                    {q.label}
                    <ArrowRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                  <div className="text-[12px] text-muted-foreground leading-relaxed">{q.desc}</div>
                </div>
              </SectionCard>
            </Link>
          );
        })}
      </div>

      {/* 3. Main Workspace Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Actions Panel */}
          <SectionCard 
            title="Pending Super Admin Action Items" 
            subtitle="Platform items requiring immediate veto, escalation, or approval decisions"
          >
            {pendingActions.length === 0 ? (
              <div className="flex items-center gap-2 p-4 border border-emerald-100 dark:border-emerald-950/20 bg-emerald-500/5 rounded-2xl animate-fade-in justify-center">
                <CheckCircle size={15} className="text-emerald-500 animate-bounce" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-450">All clear — no actions required ✓</span>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingActions.map(act => (
                  <div key={act.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-secondary/15 border border-border/40 hover:border-primary/10 rounded-2xl transition-all duration-200 gap-3.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={cn(
                          "text-[8px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none",
                          act.urgency === "HIGH" 
                            ? "bg-rose-50 border-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                            : "bg-amber-50 border-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                        )}>
                          {act.urgency} Priority
                        </span>
                        <span className="text-xs font-extrabold text-foreground">{act.title}</span>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground leading-normal">{act.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
                      <button
                        onClick={() => handleDismiss(act.id)}
                        className="px-3.5 py-1.5 hover:bg-secondary border border-border text-foreground rounded-full text-[10px] font-bold transition-all"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleAction(act.id, act.actionText, act.onAction)}
                        className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-[10px] font-bold shadow-sm transition-all"
                      >
                        {act.actionText}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          {/* Active Admin Audit Trails & Sessions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Sessions Panel */}
            <SectionCard title="Active Session Overseer" subtitle="Top 3 active administrators in the boundary">
              <div className="space-y-2.5">
                {activeAdmins.map((adm, i) => (
                  <div key={i} className="p-3 bg-secondary/15 hover:bg-secondary/25 border border-border/30 rounded-xl transition-all duration-150">
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <span className="text-xs font-bold text-foreground">{adm.name}</span>
                      <span className="inline-block text-[8px] font-black px-1.5 py-0.5 rounded border border-purple-100 bg-purple-50 text-purple-700 uppercase tracking-wider dark:bg-purple-950/20 dark:text-purple-400">
                        {adm.role}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground font-medium truncate mb-1">
                      Action: {adm.action}
                    </div>
                    <div className="flex items-center gap-1.5 text-[8.5px] text-ink-300 font-extrabold uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {adm.active}
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* Mini Audit logs (Super Admin relevant only) */}
            <SectionCard 
              title="Recent Overseer Logs" 
              subtitle="Mini audit ledger of system updates and compliance overrides"
            >
              <div className="space-y-2.5">
                {logsData.slice(0, 3).map((log, i) => {
                  const relTimeLabel = relTime(log.createdAt || new Date().toISOString());
                  return (
                    <div key={i} className="p-3 bg-secondary/15 hover:bg-secondary/25 border border-border/30 rounded-xl transition-all duration-150">
                      <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                        <span className="text-[8px] font-black px-2 py-0.5 rounded-full border border-rose-100 bg-rose-50 text-rose-700 uppercase tracking-widest leading-none">
                          {log.action?.replace(/_/g, " ")}
                        </span>
                        <span className="text-[8px] text-muted-foreground font-mono">{relTimeLabel}</span>
                      </div>
                      <div className="text-[11px] font-bold text-foreground">
                        Operator: {log.userId}
                      </div>
                      <p className="text-[9.5px] font-mono text-muted-foreground truncate bg-secondary/35 px-1.5 py-0.5 rounded border border-border/20 mt-1">
                        {log.detail}
                      </p>
                    </div>
                  );
                })}
                {logsData.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-6">
                    No recent overrides logged
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Right column (1/3 width) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions Panel */}
          <SectionCard title="Quick System Tools" subtitle="Direct override operations">
            <div className="space-y-2.5">
              <button
                onClick={() => navigate("/super-admin/manage-admins")}
                className="w-full flex items-center justify-between p-3.5 bg-secondary/35 hover:bg-secondary/50 border border-border/50 rounded-2xl transition-all font-bold text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
                    <UserPlus size={14} />
                  </div>
                  <div>
                    <div className="text-xs text-foreground group-hover:text-primary transition-colors">Create Admin Account</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Provision a new administrator</div>
                  </div>
                </div>
                <ArrowRight size={13} className="text-ink-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={handleSuspendUserPrompt}
                className="w-full flex items-center justify-between p-3.5 bg-secondary/35 hover:bg-secondary/50 border border-border/50 rounded-2xl transition-all font-bold text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600">
                    <Ban size={14} />
                  </div>
                  <div>
                    <div className="text-xs text-foreground group-hover:text-primary transition-colors">Suspend User Account</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Instant credential lockout override</div>
                  </div>
                </div>
                <ArrowRight size={13} className="text-ink-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>

              <button
                onClick={handleExportComplianceReport}
                className="w-full flex items-center justify-between p-3.5 bg-secondary/35 hover:bg-secondary/50 border border-border/50 rounded-2xl transition-all font-bold text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                    <FileDown size={14} />
                  </div>
                  <div>
                    <div className="text-xs text-foreground group-hover:text-primary transition-colors">Compliance Audit Export</div>
                    <div className="text-[10px] text-muted-foreground font-medium mt-0.5">Generate compliance audit log PDF</div>
                  </div>
                </div>
                <ArrowRight size={13} className="text-ink-300 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
              </button>
            </div>
          </SectionCard>

          {/* System resource gauges */}
          <SectionCard title="System Resource Overseer" subtitle="Host hardware hypervisor utilization">
            <div className="flex gap-3 justify-between">
              <CircularGauge value={healthData?.gauges?.cpuCore ?? 42} label="CPU Core" colorClass="stroke-primary" />
              <CircularGauge value={healthData?.gauges?.ramAllocation ?? 64} label="RAM Allocation" colorClass="stroke-purple-500" />
              <CircularGauge value={healthData?.gauges?.ssdVault ?? 28} label="SSD Vault" colorClass="stroke-emerald-500" />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* 4. Full Width Platform Services Health Summary */}
      <div className="mt-8 border-t border-border/40 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-ink-500 uppercase tracking-widest">Platform Boundaries Status Health</h3>
            <p className="text-[11.5px] text-muted-foreground mt-0.5">Real-time status updates and diagnostics logs from service boundaries</p>
          </div>
          <span className="text-[10px] font-extrabold text-[#7C3AED] bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-950/30 px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-wider animate-pulse">
            <Sparkles size={10} className="animate-spin" /> Live Diagnostics
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {liveServices.map(service => {
            const isDegraded = service.status === "DEGRADED" || service.status === "DOWN";
            const SvgIcon = service.icon;
            return (
              <div
                key={service.name}
                onClick={() => setSelectedService(service)}
                title={service.name}
                className={cn(
                  "bg-card border rounded-2xl p-4 sm:p-5 hover:shadow-md transition-all duration-300 cursor-pointer group flex flex-col justify-between min-h-[145px]",
                  isDegraded
                    ? "border-2 border-amber-500/80 dark:border-amber-450 border-l-[4px] border-l-amber-500 bg-amber-500/5 dark:bg-amber-950/10 shadow-sm shadow-amber-500/5"
                    : "border border-border/80 hover:border-primary/20"
                )}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-[13px] font-extrabold text-foreground group-hover:text-primary transition-colors pr-2 flex items-center gap-1.5">
                      <SvgIcon size={14} className="text-muted-foreground/60" />
                      {service.name}
                    </span>
                    {/* Status pulsing dot */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isDegraded ? (
                        <div className="relative flex items-center justify-center w-2 h-2">
                          <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-amber-450 opacity-75" />
                          <span className="relative inline-flex rounded-full h-1 w-1 bg-amber-500" />
                        </div>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      )}
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-wider",
                        isDegraded ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-450"
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

                <div className="mt-3 pt-2.5 border-t border-border/20 flex items-center justify-between gap-1 flex-wrap">
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
