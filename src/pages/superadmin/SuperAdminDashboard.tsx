// src/pages/superadmin/SuperAdminDashboard.tsx
import { Link } from "react-router-dom";
import { ShieldAlert, UserCog, Activity, Server, Database, Key } from "lucide-react";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";

const SERVICES = [
  { name: "API gateway",      status: "Healthy",   color: "emerald", icon: Server },
  { name: "Postgres primary", status: "Healthy",   color: "emerald", icon: Database },
  { name: "Auth service",     status: "Healthy",   color: "emerald", icon: Key },
  { name: "Mail relay",       status: "Degraded",  color: "amber",   icon: Server },
];

const QUICK = [
  { to: "/super-admin/manage-admins",  label: "Manage admins",   desc: "Create, revoke, audit",         icon: UserCog },
  { to: "/super-admin/threat-monitor", label: "Threat monitor",  desc: "Live attack feed",              icon: Activity },
  { to: "/admin/security",             label: "Security center", desc: "All platform protections",      icon: ShieldAlert },
];

export default function SuperAdminDashboard() {
  return (
    <DashboardShell
      title="Super admin command center"
      subtitle="The most powerful view in the platform — handle with care"
    >
      <div className="grid lg:grid-cols-3 gap-4 mb-5">
        {QUICK.map(q => {
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

      <SectionCard title="Service health" subtitle="Real-time platform component status">
        <div className="grid sm:grid-cols-2 gap-2.5">
          {SERVICES.map(s => {
            const Icon = s.icon;
            const c = s.color;
            return (
              <div key={s.name} className="flex items-center gap-3 p-3 border border-border rounded-xl">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-${c}-50`}>
                  <Icon size={15} className={`text-${c}-600`} />
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-bold text-foreground">{s.name}</div>
                  <div className={`text-[10px] font-bold inline-flex items-center gap-1 mt-0.5 text-${c}-600`}>
                    <span className={`w-1.5 h-1.5 rounded-full bg-${c}-500`} /> {s.status}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
