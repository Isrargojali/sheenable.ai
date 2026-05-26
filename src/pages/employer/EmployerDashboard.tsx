// src/pages/employer/EmployerDashboard.tsx
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Users, MessageSquare, Sparkles, ArrowRight, MapPin, Loader2 } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { apiProfile, apiJobs, apiAI } from "@/lib/api";
import { relativeTime } from "@/lib/utils";

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

  return (
    <DashboardShell
      title="Employer dashboard"
      subtitle={`${companyName} · ${activeCount} active jobs`}
      actions={
        <Link to="/employer/post-job">
          <BtnPrimary>Post a job <ArrowRight size={12} /></BtnPrimary>
        </Link>
      }
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STATS.map(s => {
          const Icon = s.icon;
          const value = stats?.[s.key] ?? 0;
          return (
            <div key={s.key} className="bg-card border border-border rounded-2xl p-4 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                  <Icon size={15} className="text-white" />
                </div>
              </div>
              {statsLoading ? (
                <div className="h-8 w-16 bg-muted animate-pulse rounded-md" />
              ) : (
                <div className="font-serif text-3xl text-foreground leading-none">{value}</div>
              )}
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">{s.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Active Listings */}
        <SectionCard
          title="Your active listings"
          actions={<Link to="/employer/listings" className="text-[11px] text-primary font-semibold hover:underline">Manage all</Link>}
          noPad
        >
          {jobsLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : myJobs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No active job listings. Click "Post a job" to get started.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {myJobs.map((j) => (
                <div key={j.id ?? j._id} className="p-4 flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <div className="text-[13px] font-bold text-foreground truncate">{j.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                      {j.location ? <><MapPin size={10} />{j.location}</> : "Remote"} · {relativeTime(j.createdAt)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${j.status === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                        {j.status === "PUBLISHED" ? "ACTIVE" : j.status}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{j.jobType}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-serif text-2xl text-foreground leading-none">{j.applicationCount ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">applicants</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* AI-Matched Candidates */}
        <SectionCard
          title="AI-matched candidates"
          actions={<Link to="/employer/ai-search" className="text-[11px] text-primary font-semibold hover:underline">Explore</Link>}
          noPad
        >
          {matchedLoading ? (
            <div className="p-8 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : topCandidates.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No candidates found matching your job requirements.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {topCandidates.map((c) => (
                <Link
                  key={c.id ?? c._id}
                  to={`/employer/candidate/${c.id ?? c._id}`}
                  className="p-4 flex justify-between items-center gap-3 hover:bg-accent/40 transition-colors cursor-pointer group"
                >
                  <div className="flex gap-2.5 min-w-0">
                    <div className="relative w-9 h-9 flex-shrink-0">
                      {c.avatarUrl && (
                        <img
                          src={c.avatarUrl}
                          alt={`${c.firstName} ${c.lastName}`}
                          className="w-9 h-9 rounded-xl object-cover absolute inset-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                            const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                            if (sib) sib.style.display = "flex";
                          }}
                        />
                      )}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-bold"
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
                      <div className="text-[12px] font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {c.firstName} {c.lastName}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">{c.title}</div>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-[12px] font-bold text-emerald-600">{c.aiMatchScore}%</div>
                    <div className="text-[9px] text-ink-300 uppercase tracking-wide">match</div>
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



