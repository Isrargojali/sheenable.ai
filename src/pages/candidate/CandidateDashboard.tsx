// src/pages/candidate/CandidateDashboard.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Eye, Sparkles, FileText, Award, ArrowRight, MapPin, Briefcase, Calendar, Video, Loader2
} from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiProfile, apiJobs, apiApplications } from "@/lib/api";
import { formatSalary, relativeTime, cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

type CandidateStats = {
  profileViews: number;
  jobMatches: number;
  applications: number;
  certifications: number;
  totalApplications: number;
  savedJobs: number;
  profileCompletionScore: number;
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
  { key: "totalApplications", label: "Applications", icon: FileText,  color: "from-blue-500 to-blue-700",      delta: "+3"   },
  { key: "certifications", label: "Certifications",  icon: Award,     color: "from-emerald-500 to-emerald-700",delta: "+1"   },
];

export default function CandidateDashboard() {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();

  // Fetch candidate stats
  const { data: stats } = useQuery<CandidateStats>({
    queryKey: ["candidateStats"],
    queryFn: () => apiProfile.getCandidateStats() as unknown as Promise<CandidateStats>,
    refetchInterval: 10000, // Real-time poll every 10s
  });

  // Fetch full profile to compute an accurate real-time completion score
  const { data: profileData } = useQuery({
    queryKey: ["profileCompletion"],
    queryFn:  () => apiProfile.getMe(),
  });

  // Fetch job recommendations
  const { data: rec } = useQuery<RecommendedJob[]>({
    queryKey: ["recommendedJobs"],
    queryFn:  () => apiJobs.getRecommendations() as unknown as Promise<RecommendedJob[]>,
  });

  // Fetch upcoming interviews
  const { data: ints } = useQuery({
    queryKey: ["interviews"],
    queryFn:  () => apiProfile.getUpcomingInterviews(),
  });

  // Fetch applications list
  const { data: appsData } = useQuery({
    queryKey: ["myApps"],
    queryFn: () => apiApplications.getApplications(),
  });

  const acceptMutation = useMutation({
    mutationFn: (appId: string) => apiApplications.acceptInterview(appId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myApps"] });
      qc.invalidateQueries({ queryKey: ["interviews"] });
      toast.success("Interview invitation accepted successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to accept interview invitation");
    }
  });

  const scheduled = (ints ?? []).map((iv: any) => {
    const dateObj = new Date(iv.scheduledAt);
    return {
      id: iv._id || iv.id,
      isScheduled: true,
      role: iv.applicationId?.jobId?.title || "Job Interview",
      company: iv.interviewerId?.companyName || (iv.interviewerId?.firstName ? `${iv.interviewerId.firstName} ${iv.interviewerId.lastName}` : "Company"),
      status: iv.status === "SCHEDULED" ? "CONFIRMED" : iv.status,
      date: dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      time: dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      format: iv.type || "VIDEO",
    };
  });

  const scheduledAppIds = new Set((ints ?? []).map((iv: any) => iv.applicationId?._id || iv.applicationId));

  const invitations = (appsData ?? [])
    .filter((app: any) => app.stage === "INTERVIEW" && !scheduledAppIds.has(app.id))
    .map((app: any) => ({
      id: app.id,
      isScheduled: false,
      role: app.job.title,
      company: app.job.employer.companyName,
      status: app.interviewAccepted ? "ACCEPTED" : "INVITATION PENDING",
      interviewAccepted: app.interviewAccepted,
      date: app.interviewAccepted ? "Pending employer scheduling" : "Action required",
      time: "",
      format: "To be decided",
    }));

  const combinedInterviews = [...scheduled, ...invitations];

  // Compute profile completion score from real profile data
  const computedScore = (() => {
    const p = profileData as Record<string, unknown> | null | undefined;
    if (!p) return stats?.profileCompletionScore ?? 0;

    let score = 20; // base for having an account
    if (user?.firstName && user?.lastName) score += 10;
    if (p.title) score += 10;
    if (p.bio) score += 10;
    const skills = p.skills as unknown[];
    if (Array.isArray(skills) && skills.length > 0) score += 15;
    const exp = p.experience as unknown[];
    if (Array.isArray(exp) && exp.length > 0) score += 15;
    if (user?.avatarUrl || (p.userId as Record<string, unknown>)?.avatarUrl) score += 10;
    if (p.linkedinUrl) score += 5;
    if (p.portfolioUrl) score += 5;
    return Math.min(score, 100);
  })();

  // Premium initial-tag gradient assigner based on company name
  const getCompanyGradient = (name: string) => {
    const charCode = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
    const gradients = [
      "from-pink-500 to-rose-500 text-white",
      "from-violet-500 to-indigo-500 text-white",
      "from-cyan-500 to-blue-500 text-white",
      "from-emerald-500 to-teal-500 text-white",
      "from-amber-500 to-orange-500 text-white",
      "from-fuchsia-500 to-purple-500 text-white"
    ];
    return gradients[charCode % gradients.length];
  };

  return (
    <DashboardShell
      title={`Welcome back, ${user?.firstName ?? "there"}`}
      subtitle="Here's what's happening with your she-enable job search today"
      actions={
        <Link to="/candidate/jobs">
          <BtnPrimary className="px-5 py-2.5 shadow-sm text-xs font-bold flex items-center gap-2">
            Browse jobs <ArrowRight size={13} />
          </BtnPrimary>
        </Link>
      }
    >
      {/* Stat grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_ICONS.map(s => {
          const Icon = s.icon;
          const value = stats?.[s.key] ?? "—";
          return (
            <div
              key={s.key}
              className="bg-card border border-border/80 rounded-2xl p-5 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-3.5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                  <Icon size={15} className="text-white" />
                </div>
                <span className={cn(
                  "text-[9px] font-extrabold px-2.5 py-0.5 rounded-full transition-colors",
                  s.key === "profileViews" ? "bg-violet-50 text-violet-700" :
                  s.key === "jobMatches" ? "bg-rose-50 text-rose-700" :
                  s.key === "totalApplications" ? "bg-blue-50 text-blue-700" :
                  "bg-emerald-50 text-emerald-700"
                )}>
                  ▲ {s.delta}
                </span>
              </div>
              <div className="font-serif text-3.5xl font-extrabold text-foreground leading-none tracking-tight">{value}</div>
              <div className="text-[11px] text-muted-foreground mt-1.5 font-semibold uppercase tracking-wider text-ink-300">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recommended jobs */}
        <div className="lg:col-span-2">
          <SectionCard
            title="Recommended for you"
            subtitle="AI-curated opportunities custom-matched to your professional skills"
            actions={<Link to="/candidate/jobs" className="text-[11px] text-primary font-bold hover:underline transition-all flex items-center gap-0.5">See all opportunities →</Link>}
            noPad
          >
            <div className="divide-y divide-border/60">
              {(rec ?? []).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground/60 text-xs">
                  No active job recommendations found. Try expanding your profile skills!
                </div>
              ) : (
                (rec ?? []).map(job => (
                  <div key={job.id} className="p-5 hover:bg-secondary/35 transition-all duration-200 group cursor-pointer">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 min-w-0">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm bg-gradient-to-br transition-all duration-300 group-hover:shadow-md",
                          getCompanyGradient(job.employer.companyName)
                        )}>
                          {job.employer.companyName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-extrabold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
                            {job.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
                            <span>{job.employer.companyName}</span>
                            {job.location && (
                              <>
                                <span className="text-muted-foreground/30">·</span>
                                <span className="inline-flex items-center gap-0.5"><MapPin size={10} /> {job.location}</span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.skills.slice(0, 3).map(s => (
                              <span key={s} className="text-[9px] px-2.5 py-0.5 rounded-full bg-accent/65 text-accent-foreground font-bold tracking-wide uppercase">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 flex flex-col items-end">
                        <div className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 mb-2 inline-flex items-center gap-1">
                          <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                          {job.aiScore}% match
                        </div>
                        <div className="text-[12px] font-black text-emerald-600">
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 mt-1 font-medium">{relativeTime(job.createdAt)}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile completion */}
          <SectionCard title="Profile completion">
            <div className="text-center py-2">
              <div className="relative w-24 h-24 mx-auto mb-4">
                <svg width="96" height="96" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="40" cy="40" r="32" fill="none" stroke="#F5DCEA" strokeWidth="5.5" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="url(#dash-grad)" strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - computedScore / 100)}`}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
                      filter: "drop-shadow(0 0 5px rgba(244,63,94,0.35))"
                    }}
                  />
                  <defs>
                    <linearGradient id="dash-grad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center animate-fade-in" style={{ transform: "none" }}>
                  <span className="font-serif text-2xl font-black text-foreground leading-none">{computedScore}%</span>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase mb-1">
                {computedScore >= 80 ? "Looking great!" : computedScore >= 50 ? "Almost there!" : "Keep building!"}
              </div>
              <p className="text-[10px] text-muted-foreground/60 leading-normal max-w-[160px] mx-auto mb-4">
                {computedScore >= 80 ? "Your portfolio is robust and indexed for AI match engines." : "Add more experience credentials to accelerate employer match scores."}
              </p>
              <div className="h-1.5 bg-secondary rounded-full overflow-hidden mb-4 max-w-[200px] mx-auto">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all duration-1000 rounded-full"
                  style={{ width: `${computedScore}%` }}
                />
              </div>
              <Link to="/candidate/profile">
                <BtnOutline className="w-full justify-center py-2.5 text-xs font-bold">
                  {computedScore >= 80 ? "View Profile Settings" : "Complete My Profile"}
                </BtnOutline>
              </Link>
            </div>
          </SectionCard>

          {/* Upcoming interviews */}
          <SectionCard title="Upcoming interviews">
            {combinedInterviews.length === 0 ? (
              <div className="text-center py-6 text-[11px] text-muted-foreground/60 flex flex-col items-center gap-2 border border-dashed border-border/80 rounded-2xl">
                <Calendar size={18} className="text-muted-foreground/45" />
                <span>No interviews currently scheduled</span>
              </div>
            ) : (
              <div className="space-y-3.5">
                {combinedInterviews.map(iv => (
                  <div
                    key={iv.id}
                    className={cn(
                      "p-4 rounded-2xl border transition-all duration-300 bg-card flex flex-col gap-2.5",
                      !iv.isScheduled && !iv.interviewAccepted
                        ? "border-amber-200 bg-amber-50/15 hover:border-amber-300"
                        : "border-border hover:border-primary/20 hover:shadow-sm"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12px] font-extrabold text-foreground truncate leading-snug">{iv.role}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">{iv.company}</div>
                      </div>
                      <span className={cn(
                        "text-[8px] font-black px-2.5 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wider",
                        iv.status === "CONFIRMED" || iv.status === "ACCEPTED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {iv.status}
                      </span>
                    </div>
                    
                    {iv.isScheduled ? (
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground/75 border-t border-border/40 pt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1"><Calendar size={11} /> {iv.date}, {iv.time}</span>
                        <span className="inline-flex items-center gap-1"><Video size={11} /> {iv.format}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 border-t border-border/40 pt-2">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/75">
                          <span className="inline-flex items-center gap-1"><Calendar size={11} /> {iv.date}</span>
                          <span className="inline-flex items-center gap-1"><Video size={11} /> {iv.format}</span>
                        </div>
                        {!iv.interviewAccepted && (
                          <button
                            onClick={() => acceptMutation.mutate(iv.id)}
                            disabled={acceptMutation.isPending}
                            className="w-full h-8 bg-primary hover:bg-mauve-600 text-white rounded-xl text-[10px] font-bold shadow-sm transition-all flex items-center justify-center gap-1 active:scale-95 disabled:opacity-50 press"
                          >
                            {acceptMutation.isPending ? <Loader2 size={10} className="animate-spin" /> : "Accept Invitation"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}