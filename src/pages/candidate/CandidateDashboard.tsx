// src/pages/candidate/CandidateDashboard.tsx
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Eye, Sparkles, FileText, Award, ArrowRight, MapPin, Briefcase, Calendar, Video,
} from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiProfile, apiJobs } from "@/lib/api";
import { formatSalary, relativeTime, cn } from "@/lib/utils";

type CandidateStats = {
  profileViews: number;
  jobMatches: number;
  applications: number;
  certifications: number;
  profileScore: number;
};

type RecommendedJob = {
  id: string;
  title: string;
  location?: string;
  skills: string[];
  aiScore: number;
  salaryMin: number;
  salaryMax: number;
  createdAt: string;
  employer: {
    companyName: string;
  };
};

type Interview = {
  id: string;
  role: string;
  status: string;
  company: string;
  date: string;
  time: string;
  format: string;
};

type StatIcon = {
  key: keyof CandidateStats;
  label: string;
  icon: typeof Eye;
  color: string;
  delta: string;
};

const STAT_ICONS: StatIcon[] = [
  { key: "profileViews",   label: "Profile views",   icon: Eye,       color: "from-violet-500 to-violet-700",  delta: "+12%" },
  { key: "jobMatches",     label: "Job matches",     icon: Sparkles,  color: "from-rose-500 to-rose-700",      delta: "+8%"  },
  { key: "applications",   label: "Applications",    icon: FileText,  color: "from-blue-500 to-blue-700",      delta: "+3"   },
  { key: "certifications", label: "Certifications",  icon: Award,     color: "from-emerald-500 to-emerald-700",delta: "+1"   },
];

export default function CandidateDashboard() {
  const { data: stats } = useQuery<CandidateStats>({ queryKey: ["candidateStats"], queryFn: apiProfile.getCandidateStats });
  const { data: rec }   = useQuery<RecommendedJob[]>({ queryKey: ["recommendedJobs"], queryFn: apiJobs.getRecommendations });
  const { data: ints }  = useQuery<Interview[]>({ queryKey: ["interviews"],     queryFn: apiProfile.getUpcomingInterviews });

  return (
    <DashboardShell
      title="Welcome back, Ayesha"
      subtitle="Here's what's happening with your job search today"
      actions={
        <Link to="/candidate/jobs">
          <BtnPrimary>Browse jobs <ArrowRight size={12} /></BtnPrimary>
        </Link>
      }
    >
      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STAT_ICONS.map(s => {
          const Icon = s.icon;
          const value = stats?.[s.key] ?? "—";
          return (
            <div key={s.key} className="bg-card border border-border rounded-2xl p-4 hover:shadow-sm hover:border-ink-200 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon size={15} className="text-white" />
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                  ▲ {s.delta}
                </span>
              </div>
              <div className="font-serif text-3xl text-foreground leading-none">{value}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Recommended jobs */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Recommended for you"
            subtitle="AI-curated jobs based on your skills and preferences"
            actions={<Link to="/candidate/jobs" className="text-[11px] text-primary font-semibold hover:underline">See all</Link>}
            noPad
          >
            <div className="divide-y divide-border">
              {(rec ?? []).map(job => (
                <div key={job.id} className="p-4 hover:bg-secondary/40 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground flex-shrink-0">
                        {job.employer.companyName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-foreground truncate">{job.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {job.employer.companyName}
                          {job.location && <> · <MapPin size={10} className="inline" /> {job.location}</>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {job.skills.slice(0, 3).map(s => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-semibold">{s}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 mb-1.5">
                        {job.aiScore}% match
                      </div>
                      <div className="text-[12px] font-bold text-emerald-600">
                        {formatSalary(job.salaryMin, job.salaryMax)}
                      </div>
                      <div className="text-[10px] text-ink-300 mt-0.5">{relativeTime(job.createdAt)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Profile completion */}
          <SectionCard title="Profile completion">
            <div className="text-center">
              <div className="font-serif text-4xl text-foreground">{stats?.profileScore ?? 0}%</div>
              <div className="text-[11px] text-muted-foreground mt-1 mb-3">Almost there!</div>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-3">
                <div className="h-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all"
                     style={{ width: `${stats?.profileScore ?? 0}%` }} />
              </div>
              <Link to="/candidate/profile">
                <BtnOutline className="w-full justify-center">Complete profile</BtnOutline>
              </Link>
            </div>
          </SectionCard>

          {/* Upcoming interviews */}
          <SectionCard title="Upcoming interviews">
            {(!ints || ints.length === 0) && (
              <div className="text-center py-4 text-[11px] text-muted-foreground">No interviews scheduled</div>
            )}
            <div className="space-y-2.5">
              {(ints ?? []).map(iv => (
                <div key={iv.id} className="p-3 rounded-xl border border-border hover:border-primary/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="text-[12px] font-semibold text-foreground truncate">{iv.role}</div>
                    <span className={cn(
                      "text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap",
                      iv.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>
                      {iv.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground mb-1.5">{iv.company}</div>
                  <div className="flex items-center gap-3 text-[10px] text-ink-400">
                    <span className="inline-flex items-center gap-1"><Calendar size={10} /> {iv.date}, {iv.time}</span>
                    <span className="inline-flex items-center gap-1"><Video size={10} /> {iv.format}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}
