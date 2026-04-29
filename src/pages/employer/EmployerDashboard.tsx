// src/pages/employer/EmployerDashboard.tsx
import { Link } from "react-router-dom";
import { Briefcase, Users, MessageSquare, Sparkles, ArrowRight, MapPin } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { MOCK_EMPLOYER_STATS, MOCK_JOBS, MOCK_CANDIDATES } from "@/mock/data";
import { formatSalary, relativeTime } from "@/lib/utils";

const STATS = [
  { key: "activeJobs",      label: "Active jobs",       icon: Briefcase,     color: "from-rose-500 to-rose-700",   delta: "+2"  },
  { key: "totalApplicants", label: "Total applicants",  icon: Users,         color: "from-violet-500 to-violet-700", delta: "+34" },
  { key: "interviews",      label: "Interviews booked", icon: MessageSquare, color: "from-blue-500 to-blue-700",     delta: "+5"  },
  { key: "aiMatches",       label: "AI matches",        icon: Sparkles,      color: "from-emerald-500 to-emerald-700", delta: "+12" },
] as const;

export default function EmployerDashboard() {
  const myJobs = MOCK_JOBS.slice(0, 3);
  const top    = MOCK_CANDIDATES;

  return (
    <DashboardShell
      title="Employer dashboard"
      subtitle="TechFlow Inc. · 8 active jobs"
      actions={
        <Link to="/employer/post-job">
          <BtnPrimary>Post a job <ArrowRight size={12} /></BtnPrimary>
        </Link>
      }
    >
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STATS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">▲ {s.delta}</span>
              </div>
              <div className="font-serif text-3xl text-foreground leading-none">{(MOCK_EMPLOYER_STATS as any)[s.key]}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard
          title="Your active listings"
          actions={<Link to="/employer/listings" className="text-[11px] text-primary font-semibold hover:underline">Manage all</Link>}
          noPad
        >
          <div className="divide-y divide-border">
            {myJobs.map(j => (
              <div key={j.id} className="p-4 flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <div className="text-[13px] font-bold text-foreground truncate">{j.title}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                    {j.location ? <><MapPin size={10} />{j.location}</> : "Remote"} · {relativeTime(j.createdAt)}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">ACTIVE</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{j.type}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-serif text-2xl text-foreground leading-none">{j.applicationCount}</div>
                  <div className="text-[10px] text-muted-foreground">applicants</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="AI-matched candidates"
          actions={<Link to="/employer/ai-search" className="text-[11px] text-primary font-semibold hover:underline">Explore</Link>}
          noPad
        >
          <div className="divide-y divide-border">
            {top.map(c => (
              <div key={c.id} className="p-4 flex justify-between items-center gap-3">
                <div className="flex gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                       style={{ background: "linear-gradient(135deg,#7C3AED,#C8315A)" }}>
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12px] font-bold text-foreground truncate">{c.firstName} {c.lastName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{c.title}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[12px] font-bold text-emerald-600">{c.aiMatchScore}%</div>
                  <div className="text-[9px] text-ink-300 uppercase tracking-wide">match</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
