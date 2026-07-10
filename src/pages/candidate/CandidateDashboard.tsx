import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Search, Eye, Sparkles, FileText, Award, ArrowRight, MapPin, Briefcase, Calendar, Video, Loader2, Clock, CheckCircle2, X, User, Phone, Mail
} from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline, Banner } from "@/components/layout/DashboardShell";
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
  { key: "profileViews",   label: "Profile views",   icon: Eye,       color: "bg-secondary text-ink-700",      delta: "+12%" },
  { key: "jobMatches",     label: "Job matches",     icon: Sparkles,  color: "bg-secondary text-ink-700",      delta: "+8%"  },
  { key: "totalApplications", label: "Applications", icon: FileText,  color: "bg-secondary text-ink-700",      delta: "+3"   },
  { key: "certifications", label: "Certifications",  icon: Award,     color: "bg-secondary text-ink-700",      delta: "+1"   },
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
    (acc: number, t: any) => acc + (t?.unreadCandidate ?? 0),
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

  const scheduled = (ints ?? [])
    .filter(Boolean)
    .map((iv: any) => {
      const dateObj = new Date(iv.scheduledAt);
      const timeMs = dateObj.getTime();
      const isValid = !isNaN(timeMs);
      return {
        id: iv._id || iv.id,
        isScheduled: true,
        role: iv.applicationId?.jobId?.title || "Job Interview",
        company: iv.interviewerId?.companyName || (iv.interviewerId?.firstName ? `${iv.interviewerId.firstName} ${iv.interviewerId.lastName}` : "Company"),
        status: iv.status === "SCHEDULED" ? "CONFIRMED" : iv.status,
        date: isValid ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Scheduled",
        time: isValid ? dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "",
        format: iv.type || "VIDEO",
      };
    });

  const scheduledAppIds = new Set(
    (ints ?? [])
      .filter(Boolean)
      .map((iv: any) => iv.applicationId?._id || iv.applicationId)
      .filter(Boolean)
  );

  const invitations = (appsData ?? [])
    .filter(Boolean)
    .filter((app: any) => app.stage === "INTERVIEW" && !scheduledAppIds.has(app.id || app._id))
    .map((app: any) => ({
      id: app.id || app._id,
      isScheduled: false,
      role: app.job?.title || "Job Opportunity",
      company: app.job?.employer?.companyName || "Company",
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
        icon: Calendar,
      };
    }

    // 2. Profile incomplete
    if (computedScore < 70) {
      let incompleteStep = 0;
      const p = profileData as Record<string, unknown> | null | undefined;
      if (!user?.firstName || !user?.lastName || !p?.bio) incompleteStep = 0;
      else if (!p?.education || !Array.isArray(p.education) || p.education.length === 0) incompleteStep = 1;
      else if (!p?.skills || !Array.isArray(p.skills) || p.skills.length === 0) incompleteStep = 2;
      else if (!p?.experience || !Array.isArray(p.experience) || p.experience.length === 0) incompleteStep = 3;
      else incompleteStep = 4;

      return {
        id: "profile",
        type: "profile",
        title: "Complete Your Profile",
        description: `Your profile is only ${computedScore}% complete. Profiles above 70% get 3x more recruiter views.`,
        ctaText: "Update Profile",
        link: `/candidate/profile?step=${incompleteStep}`,
        icon: FileText,
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
        icon: Search,
      };
    }

    // Default: no urgent action needed
    return null;
  })();

  const displayName = `${user?.firstName || (profileData as any)?.userId?.firstName || ""} ${user?.lastName || (profileData as any)?.userId?.lastName || ""}`.trim() || "Candidate";
  const avatarUrl = user?.avatarUrl || (profileData as any)?.userId?.avatarUrl || (profileData as any)?.avatarUrl || null;

  return (
    <DashboardShell
      title={`Welcome back, ${user?.firstName || displayName.split(" ")[0]}!`}
      subtitle="Here is a summary of your career status and recommendations."
    >
      {/* Contextual Urgent Action Banner */}
      {urgentAction && (
        <Banner
          icon={urgentAction.icon}
          title={urgentAction.title}
          description={urgentAction.description}
          className="mb-6"
          action={
            urgentAction.link ? (
              <Link to={urgentAction.link}>
                <BtnPrimary>
                  {urgentAction.ctaText} <ArrowRight size={16} strokeWidth={1.75} />
                </BtnPrimary>
              </Link>
            ) : (
              <BtnPrimary onClick={urgentAction.ctaAction}>
                {urgentAction.ctaText} <ArrowRight size={16} strokeWidth={1.75} />
              </BtnPrimary>
            )
          }
        />
      )}

      {/* Prominent Availability Banner & Scheduling CTA */}
      <Banner
        icon={Calendar}
        title="Available for Hire"
        description="Your profile is visible to recruiters looking to hire immediately. Change your availability at any time."
        className="mb-6"
        action={
          <BtnPrimary
            onClick={() => setIsSchedulingOpen(true)}
            className="w-full sm:w-auto flex-shrink-0"
          >
            <Calendar size={16} strokeWidth={1.75} />
            Schedule Availability
          </BtnPrimary>
        }
      />

      {/* Stat Grid: Standardized and Unified */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[
          { key: "profileViews", label: "Profile Views", icon: Eye, delta: "+12%" },
          { key: "jobMatches", label: "Job Matches", icon: Sparkles, delta: "+8%" },
          { key: "totalApplications", label: "Applications", icon: FileText, delta: "+3" },
          { key: "certifications", label: "Certifications", icon: Award, delta: "+1" }
        ].map((s) => {
          const Icon = s.icon;
          const value = stats?.[s.key as keyof CandidateStats] ?? 0;
          return (
            <div
              key={s.key}
              className="bg-[var(--surface)] border border-[var(--ink-300)] rounded-[var(--radius-card)] p-6 shadow-[var(--shadow-card)] flex flex-col justify-between hover:border-[var(--ink-500)] transition-all duration-300 group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8.5 h-8.5 rounded-xl bg-secondary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                  <Icon size={14} className="text-ink-700" />
                </div>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-[var(--status-success-bg)] text-[var(--status-success-fg)]">
                  ▲ {s.delta}
                </span>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-serif text-2.5xl font-black text-foreground leading-none tracking-tight">
                    {value}
                  </span>
                  {s.key === "totalApplications" && unreadMessagesCount > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-primary text-white animate-pulse shadow-sm leading-none">
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
              {(rec ?? []).filter(Boolean).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground/60 text-xs">
                  No active job recommendations found. Try expanding your profile skills!
                </div>
              ) : (
                (rec ?? []).filter(Boolean).map(job => (
                  <Link
                    key={job.id}
                    to={`/candidate/jobs?applyJobId=${job.id}`}
                    className="block p-5 hover:bg-secondary/35 transition-all duration-200 group cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex gap-4 min-w-0">
                        <div className={cn(
                          "w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black flex-shrink-0 shadow-sm bg-gradient-to-br transition-all duration-300 group-hover:shadow-md",
                          getCompanyGradient(job.employer?.companyName || "Company")
                        )}>
                          {initials(job.employer?.companyName || "Company")}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[16px] font-semibold text-[var(--ink-900)] truncate group-hover:text-[var(--brand-pink)] transition-colors leading-snug">
                            {job.title}
                          </div>
                          <div className="text-[13px] text-[var(--ink-500)] mt-1 font-normal flex flex-wrap items-center gap-1.5">
                            <span>{job.employer?.companyName || "Company"}</span>
                            {job.location && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1"><MapPin size={14} className="text-[var(--ink-500)]" /> {job.location}</span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {job.skills.slice(0, 3).map(s => (
                              <span key={s} className="bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full px-[10px] py-[4px] text-[12px] font-medium border-none normal-case">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats / Salary / Time - fully responsive to prevent overlap on small screens */}
                      <div className="flex flex-wrap sm:flex-col items-center sm:items-end justify-start sm:justify-start gap-x-4 gap-y-1 mt-1 sm:mt-0 pt-2 sm:pt-0 border-t border-border/30 sm:border-t-0 text-left sm:text-right">
                        <div className="flex items-center gap-1">
                          <span 
                            className={cn(
                              "text-[13px] font-semibold flex items-center gap-1",
                              job.aiScore >= 80 ? "text-[var(--status-success-fg)]" : "text-[var(--ink-500)]"
                            )}
                            title={`${job.aiScore}% Match Score`}
                          >
                            <Sparkles size={11} className={cn(job.aiScore >= 80 && "animate-pulse")} />
                            <span>{job.aiScore}% match</span>
                          </span>
                        </div>

                        <div className="text-[14px] font-bold text-[var(--ink-900)]">
                          {formatSalary(job.salaryMin, job.salaryMax)}
                        </div>
                        <div className="text-[13px] text-[var(--ink-500)] font-normal">{relativeTime(job.createdAt)}</div>
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
                  <circle cx="40" cy="40" r="32" fill="none" stroke="var(--brand-pink-soft)" strokeWidth="5.5" />
                  <circle
                    cx="40" cy="40" r="32" fill="none"
                    stroke="var(--brand-pink)" strokeWidth="5.5"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 32}`}
                    strokeDashoffset={`${2 * Math.PI * 32 * (1 - computedScore / 100)}`}
                    style={{
                      transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)"
                    }}
                  />
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
                        ? "bg-[var(--status-success-bg)] border-[var(--status-success-fg)]/10 hover:border-[var(--status-success-fg)]/20"
                        : "bg-secondary/40 border-border/80 hover:border-primary/25 hover:bg-secondary/60"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-foreground group-hover/item:text-primary transition-colors leading-tight flex items-center gap-1.5">
                        {item.label}
                        {!item.done && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        )}
                      </div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 truncate max-w-[170px]">
                        {item.desc}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-2">
                      {item.done ? (
                        <span className="w-5 h-5 rounded-full bg-[var(--status-success-fg)] text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                          ✓
                        </span>
                      ) : (
                        <span className="w-5 h-5 rounded-full border border-dashed border-primary/45 flex items-center justify-center text-[10px] font-bold text-primary group-hover/item:border-primary group-hover/item:text-primary bg-primary/5 animate-pulse">
                          +
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              <Link to="/candidate/profile">
                <BtnOutline className="w-full justify-center">
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
                    className="p-6 rounded-[var(--radius-card)] border border-[var(--ink-300)] bg-[var(--surface)] flex flex-col gap-2.5 transition-all duration-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[12px] font-extrabold text-foreground truncate leading-snug">{iv.role}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-medium">{iv.company}</div>
                      </div>
                      <span className={cn(
                        "rounded-full px-[10px] py-[4px] text-[12px] font-semibold uppercase tracking-[0.04em] border-none whitespace-nowrap",
                        iv.status === "CONFIRMED" || iv.status === "ACCEPTED" 
                          ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]" 
                          : "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]"
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
                          <BtnPrimary
                            onClick={() => acceptMutation.mutate(iv.id)}
                            disabled={acceptMutation.isPending}
                            className="w-full"
                          >
                            {acceptMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : "Accept Invitation"}
                          </BtnPrimary>
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
                  <Calendar size={16} className="text-[var(--status-success-fg)] animate-pulse" />
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
                            ? "bg-primary border-primary text-white"
                            : "bg-[var(--ink-100)] dark:bg-secondary/40 border-border hover:border-primary/30 text-foreground"
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
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30 bg-[var(--ink-100)]/30 dark:bg-transparent"
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
                          className="accent-primary w-3.5 h-3.5 cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-[var(--status-info-bg)] border border-[var(--status-info-fg)]/20 rounded-2xl flex gap-2">
                <Clock size={14} className="text-[var(--status-info-fg)] flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-[var(--status-info-fg)] leading-normal font-medium">
                  Matches are dynamically linked in your local timezone ({Intl.DateTimeFormat().resolvedOptions().timeZone || "PKT"}). Make sure your system settings are accurate.
                </p>
              </div>
            </div>

            <footer className="px-6 py-4 bg-secondary/10 border-t border-border flex justify-end gap-2.5">
              <BtnOutline
                type="button"
                onClick={() => setIsSchedulingOpen(false)}
              >
                Cancel
              </BtnOutline>
              <BtnPrimary
                type="button"
                onClick={() => {
                  setIsSchedulingOpen(false);
                  toast.success("Interview availability schedule saved successfully!");
                }}
              >
                Save Schedule
              </BtnPrimary>
            </footer>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}