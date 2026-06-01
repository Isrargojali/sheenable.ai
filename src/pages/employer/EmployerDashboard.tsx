// src/pages/employer/EmployerDashboard.tsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Users, MessageSquare, Sparkles, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { apiProfile, apiJobs, apiAI } from "@/lib/api";
import { relativeTime, cn } from "@/lib/utils";

// ── Types ────────────────────────────────────────────────────────────────────

interface EmployerStats {
  activeJobs: number;
  totalApplicants: number;
  interviews: number;
  aiMatches: number;
}

interface EmployerProfile {
  companyName?: string;
}

interface JobListing {
  id?: string;
  _id?: string;
  title: string;
  location?: string;
  createdAt: string;
  status: string;
  jobType: string;
  applicationCount?: number;
}

interface MatchedCandidate {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  avatarUrl?: string;
  aiMatchScore: number;
}

// ── Constants ────────────────────────────────────────────────────────────────

const STATS = [
  { key: "activeJobs", label: "Active jobs", icon: Briefcase, color: "from-rose-500 to-rose-700" },
  { key: "totalApplicants", label: "Total applicants", icon: Users, color: "from-violet-500 to-violet-700" },
  { key: "interviews", label: "Interviews booked", icon: MessageSquare, color: "from-blue-500 to-blue-700" },
  { key: "aiMatches", label: "AI matches", icon: Sparkles, color: "from-emerald-500 to-emerald-700" },
] as const satisfies ReadonlyArray<{ key: keyof EmployerStats; label: string; icon: React.ElementType; color: string }>;

// ── Component ────────────────────────────────────────────────────────────────

export default function EmployerDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["employer-stats"],
    queryFn: () => apiProfile.getEmployerStats() as Promise<EmployerStats>,
    refetchInterval: 10000,
  });

  const { data: profile } = useQuery({
    queryKey: ["employerProfile"],
    queryFn: () => apiProfile.getMe() as Promise<EmployerProfile>,
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => apiJobs.getMyListings() as Promise<JobListing[]>,
  });

  const { data: matchedCandidates, isLoading: matchedLoading } = useQuery({
    queryKey: ["matched-candidates"],
    queryFn: () => apiAI.getMatchedCandidates() as Promise<MatchedCandidate[]>,
  });

  const companyName = profile?.companyName ?? "My Company";
  const activeCount = stats?.activeJobs ?? 0;
  const myJobs = Array.isArray(jobs) ? jobs.slice(0, 3) : [];
  const topCandidates = Array.isArray(matchedCandidates) ? matchedCandidates.slice(0, 3) : [];

  // Premium status tag helper for stat cards
  const getStatBadge = (key: keyof EmployerStats) => {
    if (key === "activeJobs") return { label: "Live board", style: "bg-rose-50 text-rose-700" };
    if (key === "totalApplicants") return { label: "Active", style: "bg-violet-50 text-violet-700" };
    if (key === "interviews") return { label: "Scheduled", style: "bg-blue-50 text-blue-700" };
    return { label: "98% Match", style: "bg-emerald-50 text-emerald-700" };
  };

  return (
    <DashboardShell
      title="Employer dashboard"
      subtitle={`${companyName} · ${activeCount} active opportunities listed`}
      actions={
        <Link to="/employer/post-job">
          <BtnPrimary className="px-5 py-2.5 shadow-sm text-xs font-bold flex items-center gap-2">
            Post a job <ArrowRight size={13} />
          </BtnPrimary>
        </Link>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STATS.map(s => {
          const Icon = s.icon;
          const value = stats?.[s.key] ?? 0;
          const badge = getStatBadge(s.key);
          return (
            <div
              key={s.key}
              className="bg-card border border-border/80 rounded-2xl p-5 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-3.5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                  <Icon size={15} className="text-white" />
                </div>
                <span className={cn("text-[9px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider", badge.style)}>
                  {badge.label}
                </span>
              </div>
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
              ) : (
                <div className="font-serif text-3.5xl font-extrabold text-foreground leading-none tracking-tight">{value}</div>
              )}
              <div className="text-[11px] text-muted-foreground mt-1.5 font-semibold uppercase tracking-wider text-ink-300">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Listings */}
        <SectionCard
          title="Your active listings"
          actions={<Link to="/employer/listings" className="text-[11px] text-primary font-bold hover:underline transition-all flex items-center gap-0.5">Manage all listings →</Link>}
          noPad
        >
          {jobsLoading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : myJobs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground/60 text-xs border border-dashed border-border/80 rounded-2xl m-4 flex flex-col items-center gap-2">
              <Briefcase size={20} className="text-muted-foreground/45" />
              <span>No active job listings. Click "Post a job" to get started.</span>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {myJobs.map((j) => (
                <div
                  key={j.id ?? j._id}
                  className="p-5 flex justify-between items-start gap-4 hover:bg-secondary/35 transition-all duration-200 group cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="text-[13px] font-extrabold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
                      {j.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 font-medium flex items-center gap-1.5">
                      <span className="inline-flex items-center gap-0.5"><MapPin size={10} /> {j.location || "Remote"}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span>{relativeTime(j.createdAt)}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      <span className={cn(
                        "text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                        j.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {j.status === "PUBLISHED" ? "ACTIVE" : j.status}
                      </span>
                      <span className="text-[9px] font-black px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 uppercase tracking-wider">{j.jobType}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 bg-secondary/50 rounded-2xl p-3 border border-border/40 text-center min-w-[80px] shadow-sm transition-all group-hover:shadow-md group-hover:border-primary/20">
                    <div className="font-serif text-2xl font-extrabold text-foreground leading-none">{j.applicationCount ?? 0}</div>
                    <div className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider mt-1">applicants</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* AI-Matched Candidates */}
        <SectionCard
          title="AI-matched candidates"
          actions={<Link to="/employer/ai-search" className="text-[11px] text-primary font-bold hover:underline transition-all flex items-center gap-0.5">Unlock semantic search →</Link>}
          noPad
        >
          {matchedLoading ? (
            <div className="p-12 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : topCandidates.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground/60 text-xs border border-dashed border-border/80 rounded-2xl m-4 flex flex-col items-center gap-2">
              <Sparkles size={20} className="text-muted-foreground/45" />
              <span>No candidates found matching your job requirements.</span>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {topCandidates.map((c) => (
                <Link
                  key={c.id ?? c._id}
                  to={`/employer/candidate/${c.id ?? c._id}`}
                  className="p-5 flex justify-between items-center gap-4 hover:bg-secondary/35 transition-all duration-200 group cursor-pointer"
                >
                  <div className="flex gap-3 min-w-0">
                    <div className="relative w-10 h-10 flex-shrink-0 shadow-sm border border-border/60 rounded-xl overflow-hidden group-hover:shadow-md transition-all duration-300">
                      {c.avatarUrl && (
                        <img
                          src={c.avatarUrl}
                          alt={`${c.firstName} ${c.lastName}`}
                          className="w-10 h-10 rounded-xl object-cover absolute inset-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                            const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (sib) sib.style.display = "flex";
                          }}
                        />
                      )}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-black"
                        style={{
                          background: "linear-gradient(135deg,#7C3AED,#C8315A)",
                          display: c.avatarUrl ? "none" : "flex",
                        }}
                      >
                        {c.firstName?.[0].toUpperCase() ?? "C"}
                        {c.lastName?.[0].toUpperCase() ?? ""}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="text-[13px] font-extrabold text-foreground truncate group-hover:text-primary transition-colors leading-snug">
                        {c.firstName} {c.lastName}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">{c.title || "Professional Developer"}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end">
                    <div className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 mb-1 inline-flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                      {c.aiMatchScore}%
                    </div>
                    <div className="text-[9px] text-muted-foreground/60 font-semibold uppercase tracking-wider">match score</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
