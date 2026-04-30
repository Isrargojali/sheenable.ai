// src/pages/admin/AdminDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { Users, Briefcase, Building2, FileText, ShieldCheck, ScrollText } from "lucide-react";
import { Link } from "react-router-dom";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { apiAdmin } from "@/lib/api";

const STATS = [
  { key: "totalUsers",   label: "Total users",   icon: Users,     color: "from-rose-500 to-rose-700",       deltaKey: "users"        },
  { key: "activeJobs",   label: "Active jobs",   icon: Briefcase, color: "from-violet-500 to-violet-700",   deltaKey: "jobs"         },
  { key: "employers",    label: "Employers",     icon: Building2, color: "from-blue-500 to-blue-700",       deltaKey: "employers"    },
  { key: "applications", label: "Applications",  icon: FileText,  color: "from-emerald-500 to-emerald-700", deltaKey: "applications" },
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
  { to: "/admin/users",    label: "Manage users",    desc: "Suspend, verify, audit",    icon: Users },
  { to: "/admin/security", label: "Security center", desc: "Live threats & rate limits", icon: ShieldCheck },
  { to: "/admin/audit",    label: "Audit log",       desc: "Compliance trail",           icon: ScrollText },
];

export default function AdminDashboard() {
  const { data: stats } = useQuery<AdminStats>({ queryKey: ["adminStats"], queryFn: apiAdmin.getStats });

  return (
    <DashboardShell title="Admin overview" subtitle="Platform-wide health and metrics">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STATS.map(s => {
          const Icon = s.icon;
          const v   = stats?.[s.key as keyof AdminStats]?.toLocaleString() ?? "—";
          const dv  = stats?.weeklyGrowth?.[s.deltaKey as keyof AdminStats['weeklyGrowth']] ?? 0;
          return (
            <div key={s.key} className="bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">▲ +{dv}</span>
              </div>
              <div className="font-serif text-3xl text-foreground leading-none">{v}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {QUICK_LINKS.map(q => {
          const Icon = q.icon;
          return (
            <Link to={q.to} key={q.to}>
              <SectionCard className="h-full hover:border-primary/40 hover:shadow-md transition-all cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3">
                  <Icon size={17} className="text-primary" />
                </div>
                <div className="text-sm font-bold text-foreground mb-0.5">{q.label}</div>
                <div className="text-[12px] text-muted-foreground">{q.desc}</div>
              </SectionCard>
            </Link>
          );
        })}
      </div>
    </DashboardShell>
  );
}
