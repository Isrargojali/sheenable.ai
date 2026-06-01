// src/pages/admin/AdminDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, Building2, FileText, ShieldCheck, ScrollText, ArrowUpRight, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { apiAdmin } from "@/lib/api";

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

const QUICK_LINKS = [
  { 
    to: "/admin/users", 
    label: "User Governance", 
    desc: "Manage profiles, verify accounts, and configure permissions.", 
    icon: Users, 
    badge: "Active", 
    badgeColor: "bg-emerald-50 text-emerald-600 border-emerald-100" 
  },
  { 
    to: "/admin/security", 
    label: "Security Center", 
    desc: "Monitor live threat logs, active lockouts, and rate limits.", 
    icon: ShieldCheck, 
    badge: "Shield Active", 
    badgeColor: "bg-blue-50 text-blue-600 border-blue-100" 
  },
  { 
    to: "/admin/audit", 
    label: "Audit Trails", 
    desc: "Inspect granular system actions and compliance histories.", 
    icon: ScrollText, 
    badge: "Compliant", 
    badgeColor: "bg-purple-50 text-purple-600 border-purple-100" 
  },
];

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery<AdminStats>({ 
    queryKey: ["adminStats"], 
    queryFn: apiAdmin.getStats,
    refetchInterval: 15000 // Poll stats every 15 seconds for platform real-time overview
  });

  return (
    <DashboardShell 
      title="Admin overview" 
      subtitle="Real-time control tower of SheEnableAI platform health, user status, and security compliance"
    >
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => {
          const Icon = s.icon;
          const v = stats?.[s.key as keyof AdminStats]?.toLocaleString() ?? "—";
          const dv = stats?.weeklyGrowth?.[s.deltaKey as keyof AdminStats['weeklyGrowth']] ?? 0;

          return (
            <div 
              key={s.key} 
              className={`relative bg-card border border-border/80 rounded-2xl p-5 hover:shadow-lg hover:border-primary/20 ${s.glow} transition-all duration-300 group overflow-hidden`}
            >
              {/* Decorative Subtle Background Vector Line or Glow */}
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
      <h3 className="text-xs font-bold text-ink-500 uppercase tracking-widest mb-3.5">Platform Governance Modules</h3>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {QUICK_LINKS.map(q => {
          const Icon = q.icon;
          return (
            <Link to={q.to} key={q.to} className="group">
              <SectionCard className="h-full relative overflow-hidden border border-border/80 hover:border-primary/20 hover:shadow-xl transition-all duration-300 cursor-pointer">
                {/* Decorative border highlight */}
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary/30 to-transparent transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center group-hover:bg-primary/10 transition-colors duration-300">
                    <Icon size={17} className="text-primary group-hover:scale-105 transition-transform" />
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${q.badgeColor}`}>
                    {q.badge}
                  </span>
                </div>
                
                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {q.label}
                  <ArrowUpRight size={14} className="opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
                </div>
                <div className="text-[12px] text-muted-foreground leading-relaxed">{q.desc}</div>
              </SectionCard>
            </Link>
          );
        })}
      </div>
    </DashboardShell>
  );
}
