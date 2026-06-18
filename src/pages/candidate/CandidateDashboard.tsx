import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Eye, Sparkles, FileText, Award, ArrowRight, MapPin, Briefcase, Calendar, Video, Loader2, Clock, CheckCircle2, X
} from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiProfile, apiJobs, apiApplications, apiMessages } from "@/lib/api";
import { formatSalary, relativeTime, cn, initials, getCompanyGradient } from "@/lib/utils";
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

  // Interactive scheduling modal states
  const [isSchedulingOpen, setIsSchedulingOpen] = useState(false);
  const [availableDays, setAvailableDays] = useState<string[]>(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
  const [timeSlots, setTimeSlots] = useState<string[]>(["Morning (9 AM - 12 PM)", "Afternoon (2 PM - 5 PM)"]);

  // Fetch thread messages to count unread responses
  const { data: threadsData } = useQuery<any>({
    queryKey: ["threadsBadge", "CANDIDATE"],
    queryFn: apiMessages.getThreads,
    refetchInterval: 10000,
  });

  const rawThreads = Array.isArray(threadsData) ? threadsData : (threadsData?.results ?? []);
  const unreadMessagesCount = rawThreads.reduce(
    (acc: number, t: any) => acc + t.unreadCandidate,
    0
  );

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



  // Contextual Urgent Action calculation
  const urgentAction = (() => {
    // 1. Pending Interview Invite
    const pendingInterview = combinedInterviews.find(iv => !iv.isScheduled && !iv.interviewAccepted);
    if (pendingInterview) {
      return {
        id: pendingInterview.id,
        type: "interview",
        title: "Action Required: Interview Invitation",
        description: `You have a pending interview invitation from ${pendingInterview.company} for the ${pendingInterview.role} role. Please accept or schedule it.`,
        ctaText: "Review Invitation",
        ctaAction: () => {
          const element = document.getElementById(`interview-${pendingInterview.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("ring-2", "ring-primary", "animate-pulse");
            setTimeout(() => {
              element.classList.remove("ring-2", "ring-primary", "animate-pulse");
            }, 3000);
          } else {
            toast.info("Please scroll to the 'Upcoming interviews' section to accept the invitation.");
          }
        },
        color: "border-amber-200 dark:border-amber-900/50 bg-amber-500/5 text-amber-800 dark:text-amber-300",
        btnColor: "bg-amber-600 hover:bg-amber-700 text-white"
      };
    }

    // 2. Profile incomplete
    if (computedScore < 70) {
      let incompleteStep = 0;
      const p = profileData as Record<string, unknown> | null | undefined;
      if (!user?.firstName || !user?.lastName || !p?.bio) incompleteStep = 0;
      else if (!p?.education || (p.education as unknown[]).length === 0) incompleteStep = 1;
      else if (!p?.skills || (p.skills as unknown[]).length === 0) incompleteStep = 2;
      else if (!p?.experience || (p.experience as unknown[]).length === 0) incompleteStep = 3;
      else incompleteStep = 4;

      return {
        id: "profile",
        type: "profile",
        title: "Complete Your Profile",
        description: `Your profile is only ${computedScore}% complete. Profiles above 70% get 3x more recruiter views.`,
        ctaText: "Update Profile",
        link: `/candidate/profile?step=${incompleteStep}`,
        color: "border-rose-200 dark:border-rose-900/50 bg-rose-500/5 text-rose-800 dark:text-rose-300",
        btnColor: "bg-rose-600 hover:bg-rose-750 text-white"
      };
    }

    // 3. No applications
    if (!appsData || appsData.length === 0) {
      return {
        id: "apply",
        type: "apply",
        title: "Start Applying",
        description: "You haven't submitted any job applications yet. Let's find your first match!",
        ctaText: "Explore Job Openings",
        link: "/candidate/jobs",
        color: "border-blue-200 dark:border-blue-900/50 bg-blue-500/5 text-blue-800 dark:text-blue-300",
        btnColor: "bg-blue-600 hover:bg-blue-755 text-white"
      };
    }

    // Default: Check recommendations
    return {
      id: "default",
      type: "default",
      title: "Discover Opportunities",
      description: "Check out new jobs matched to your professional profile today.",
      ctaText: "Search Jobs",
      link: "/candidate/jobs",
      color: "border-violet-200 dark:border-violet-900/50 bg-violet-500/5 text-violet-800 dark:text-violet-300",
      btnColor: "bg-violet-600 hover:bg-violet-755 text-white"
    };
  })();

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
      {/* Contextual Urgent Action Banner */}
      {urgentAction && (
        <div className={cn(
          "border rounded-2xl px-4 py-4 sm:px-5 sm:py-4.5 mb-6",
          "flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4",
          "transition-all duration-300 shadow-sm relative overflow-hidden group",
          urgentAction.color
        )}>
          {/* Shimmer sweep on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />

          {/* Left: icon + copy */}
          <div className="flex items-start gap-3 sm:gap-3.5 relative z-10 min-w-0">
            <div className="p-2 bg-white/20 dark:bg-black/10 rounded-xl flex-shrink-0 mt-0.5 animate-pulse">
              <Sparkles size={15} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[11px] sm:text-xs font-black tracking-wide uppercase leading-tight truncate">
                {urgentAction.title}
              </h4>
              <p className="text-[10px] sm:text-[11px] opacity-85 mt-1 font-medium leading-relaxed">
                {urgentAction.description}
              </p>
            </div>
          </div>

          {/* Right: CTA — full width on mobile, auto on sm+ */}
          <div className="relative z-10 w-full sm:w-auto flex-shrink-0">
            {urgentAction.link ? (
              <Link to={urgentAction.link} className="block w-full sm:w-auto">
                <button className={cn(
                  "w-full sm:w-auto inline-flex items-center justify-center gap-1.5",
                  "px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold shadow-sm",
                  "transition-all duration-200 active:scale-[0.97] hover:brightness-105",
                  urgentAction.btnColor
                )}>
                  {urgentAction.ctaText} <ArrowRight size={12} />
                </button>
              </Link>
            ) : (
              <button
                onClick={urgentAction.ctaAction}
                className={cn(
                  "w-full sm:w-auto inline-flex items-center justify-center gap-1.5",
                  "px-4 py-2.5 sm:py-2 rounded-xl text-xs font-bold shadow-sm",
                  "transition-all duration-200 active:scale-[0.97] hover:brightness-105",
                  urgentAction.btnColor
                )}
              >
                {urgentAction.ctaText} <ArrowRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Prominent Availability Pill & Scheduling CTA */}
      <div className={cn(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4",
        "bg-gradient-to-r from-emerald-500/5 to-teal-500/5 dark:from-emerald-500/10 dark:to-teal-500/10",
        "border border-emerald-500/20 rounded-2xl px-4 py-4 sm:px-5 sm:py-4 mb-6 shadow-sm animate-fade-in"
      )}>
        {/* Left: live dot + status copy */}
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {/* Pulsing live indicator */}
          <div className="relative flex h-3.5 w-3.5 flex-shrink-0 mt-1 sm:mt-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 shadow-sm" />
          </div>

          <div className="min-w-0">
            {/* Title row */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
              <span className="text-[13px] sm:text-sm font-extrabold text-foreground leading-tight">
                Available for Hire
              </span>
              <span className={cn(
                "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0",
                "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400"
              )}>
                Immediate
              </span>
            </div>
            {/* Sub-text */}
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 font-medium leading-relaxed">
              Your profile is visible to recruiters looking to hire immediately.{" "}
              <span className="hidden xs:inline">Change your availability at any time.</span>
            </p>
          </div>
        </div>

        {/* Right: CTA — full width on mobile, auto on sm+ */}
        <button
          onClick={() => setIsSchedulingOpen(true)}
          className={cn(
            "w-full sm:w-auto inline-flex items-center justify-center gap-1.5",
            "px-4 py-2.5 sm:px-4.5 rounded-xl flex-shrink-0",
            "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700",
            "text-white text-xs font-bold shadow-sm",
            "transition-all duration-200 active:scale-[0.97] hover:shadow-emerald-500/30 hover:shadow-md"
          )}
        >
          <Calendar size={13} />
          Schedule Availability
        </button>
      </div>

      {/* Stat Grid: Hero + Secondary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {/* Hero Stat: Profile Views */}
        <div className="lg:col-span-1 bg-gradient-to-br from-violet-600 to-indigo-700 dark:from-violet-900 dark:to-indigo-950 text-white rounded-3xl p-6 shadow-lg shadow-violet-500/10 hover:shadow-violet-500/20 hover:-translate-y-0.5 transition-all duration-300 group relative overflow-hidden">
          {/* Accent decoration glow */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                <Eye size={20} className="text-violet-100" />
              </div>
              <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-white/20 text-white backdrop-blur-sm">
                ▲ +12% this week
              </span>
            </div>
            <div className="mt-6">
              <div className="font-serif text-5xl font-black leading-none tracking-tight text-white select-none">
                {stats?.profileViews ?? 0}
              </div>
              <div className="text-xs text-violet-200 mt-2 font-bold uppercase tracking-widest leading-none">
                Profile Views
              </div>
              <p className="text-[10px] text-violet-100/70 mt-2 leading-normal font-medium">
                Employers are actively viewing your profile. Keep it updated to improve matches!
              </p>
            </div>
          </div>
        </div>

        {/* Secondary Stats in tighter row */}
        <div className="lg:col-span-2 grid grid-cols-3 gap-4">
          {[
            { key: "jobMatches", label: "Job Matches", icon: Sparkles, color: "from-rose-500 to-rose-600 text-rose-500 bg-rose-50 dark:bg-rose-950/20 dark:text-rose-400", delta: "+8%" },
            { key: "totalApplications", label: "Applications", icon: FileText, color: "from-blue-500 to-blue-600 text-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400", delta: "+3" },
            { key: "certifications", label: "Certifications", icon: Award, color: "from-emerald-500 to-emerald-600 text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400", delta: "+1" }
          ].map((s) => {
            const Icon = s.icon;
            const value = stats?.[s.key as keyof CandidateStats] ?? 0;
            return (
              <div
                key={s.key}
                className="bg-card border border-border/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md hover:border-primary/20 transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8.5 h-8.5 rounded-xl bg-gradient-to-br ${s.color.split(' ')[0]} ${s.color.split(' ')[1]} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                    <Icon size={14} className="text-white" />
                  </div>
                  <span className={cn("text-[9px] font-extrabold px-2 py-0.5 rounded-full", s.color.split(' ').slice(2).join(' '))}>
                    ▲ {s.delta}
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="font-serif text-2.5xl font-black text-foreground leading-none tracking-tight">
                      {value}
                    </span>
                    {s.key === "totalApplications" && unreadMessagesCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse shadow-sm leading-none">
                        New
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider text-ink-300 truncate">
                    {s.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
                  <Link
                    key={job.id}
                    to={`/candidate/jobs?applyJobId=${job.id}`}
                    className="block p-5 hover:bg-secondary/35 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4 min-w-0">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm bg-gradient-to-br transition-all duration-300 group-hover:shadow-md",
                          getCompanyGradient(job.employer.companyName)
                        )}>
                          {initials(job.employer.companyName)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[13px] font-extrabold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
                            {job.title}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-1 font-medium flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5">
                            <span>{job.employer.companyName}</span>
                            {job.location && (
                              <>
                                <span className="hidden sm:inline text-muted-foreground/30">·</span>
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
                        {/* Match % shows real number with animated fill bar */}
                        <div className="text-right flex flex-col items-end mb-2">
                          <div className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                            <Sparkles size={10} className="text-emerald-500 animate-pulse" />
                            {job.aiScore}% Match
                          </div>
                          <div className="w-20 bg-emerald-100/50 dark:bg-emerald-950/30 rounded-full h-1.5 mt-1 overflow-hidden relative border border-emerald-500/10">
                            <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full origin-left transition-all duration-1000 ease-out"
                              style={{ width: `${job.aiScore}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-[12px] font-black text-emerald-600">
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </div>
                        <div className="text-[10px] text-muted-foreground/60 mt-1 font-medium">{relativeTime(job.createdAt)}</div>
                      </div>
                    </div>
                  </Link>
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
              <div className="relative w-28 h-28 mx-auto mb-4 flex items-center justify-center">
                <svg width="112" height="112" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
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
                  <span className="font-serif text-2.5xl font-black text-foreground leading-none">{computedScore}%</span>
                  <span className="text-[8px] uppercase tracking-wider text-muted-foreground/85 mt-1 font-bold">Complete</span>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground font-bold tracking-wide uppercase mb-3">
                {computedScore >= 80 ? "Looking great!" : computedScore >= 50 ? "Almost there!" : "Keep building!"}
              </div>

              {/* Profile completion checklist below circular donut */}
              <div className="space-y-2 text-left mb-4">
                {[
                  {
                    label: "Add a portfolio link",
                    done: !!(profileData as any)?.portfolioUrl,
                    step: 0,
                    desc: "Link to your GitHub, website or LinkedIn"
                  },
                  {
                    label: "Write a bio",
                    done: !!(profileData as any)?.bio,
                    step: 0,
                    desc: "Introduce yourself to employers"
                  },
                  {
                    label: "Add skills",
                    done: !!((profileData as any)?.skills && (profileData as any).skills.length > 0),
                    step: 2,
                    desc: "List your technical expertise"
                  }
                ].map((item, index) => (
                  <Link
                    key={index}
                    to={`/candidate/profile?step=${item.step}`}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border transition-all duration-200 group/item",
                      item.done
                        ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20"
                        : "bg-secondary/40 border-border/80 hover:border-primary/20 hover:bg-secondary/60"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-foreground group-hover/item:text-primary transition-colors leading-tight flex items-center gap-1.5">
                        {item.label}
                        {!item.done && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[170px]">
                        {item.desc}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {item.done ? (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                          ✓
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-dashed border-rose-400 flex items-center justify-center text-[10px] font-bold text-rose-500 group-hover/item:border-primary/50 group-hover/item:text-primary bg-rose-50 dark:bg-rose-950/20 animate-pulse">
                          +
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
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
                    id={`interview-${iv.id}`}
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

      {/* Fully Functional Availability Scheduling Modal */}
      {isSchedulingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col animate-scale-up">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base text-foreground font-bold flex items-center gap-1.5">
                  <Calendar size={16} className="text-emerald-500 animate-pulse" />
                  Set Interview Availability
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Define your general weekly hours for recruiter meetings</p>
              </div>
              <button 
                onClick={() => setIsSchedulingOpen(false)} 
                className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-6 space-y-5">
              {/* Days of Week Selectors */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-2">Available Days</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setAvailableDays(availableDays.filter(d => d !== day));
                          } else {
                            setAvailableDays([...availableDays, day]);
                          }
                        }}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-bold transition-all border text-center",
                          isSelected
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-[#F7F4F9] dark:bg-secondary/40 border-border hover:border-emerald-300 text-foreground"
                        )}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots Pickers */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-2">Preferred Time Windows</label>
                <div className="space-y-2">
                  {[
                    "Morning (9 AM - 12 PM)",
                    "Afternoon (12 PM - 5 PM)",
                    "Evening (5 PM - 8 PM)"
                  ].map((slot) => {
                    const isSelected = timeSlots.includes(slot);
                    return (
                      <label 
                        key={slot} 
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200",
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/5"
                            : "border-border hover:border-emerald-300 bg-[#F7F4F9]/30 dark:bg-transparent"
                        )}
                      >
                        <span className="text-xs font-semibold text-foreground">{slot}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            if (isSelected) {
                              setTimeSlots(timeSlots.filter(s => s !== slot));
                            } else {
                              setTimeSlots([...timeSlots, slot]);
                            }
                          }}
                          className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-950/30 rounded-2xl flex gap-2">
                <Clock size={14} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-indigo-700 dark:text-indigo-400 leading-normal font-medium">
                  Matches are dynamically linked in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone || "PKT"}). Make sure your system settings are accurate.
                </p>
              </div>
            </div>

            <footer className="px-6 py-4 bg-secondary/10 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsSchedulingOpen(false)}
                className="px-4 py-2 border border-border text-ink-500 hover:bg-secondary rounded-full text-[11px] font-bold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSchedulingOpen(false);
                  toast.success("Interview availability schedule saved successfully!");
                }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[11px] font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1"
              >
                Save Schedule
              </button>
            </footer>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}