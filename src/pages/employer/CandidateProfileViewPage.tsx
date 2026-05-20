// src/pages/employer/CandidateProfileViewPage.tsx
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, Briefcase, GraduationCap, Star, Globe,
  Linkedin, Github, ExternalLink, CheckCircle, Clock, Loader2,
  Award, Languages, Zap, Mail, Phone, Calendar,
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { apiProfile } from "@/lib/api";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SKILL_LEVEL_COLOR: Record<string, string> = {
  beginner:     "bg-sky-50 text-sky-600 border-sky-200",
  intermediate: "bg-violet-50 text-violet-600 border-violet-200",
  advanced:     "bg-rose-50 text-rose-600 border-rose-200",
  expert:       "bg-amber-50 text-amber-700 border-amber-200",
};

const formatDate = (d?: string | Date) => {
  if (!d) return "N/A";
  const obj = new Date(d);
  if (isNaN(obj.getTime())) return "N/A";
  return obj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-white" />
      </div>
      <h3 className="text-sm font-bold text-foreground">{title}</h3>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CandidateProfileViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["candidate-profile", id],
    queryFn: () => apiProfile.getCandidateProfile(id!),
    enabled: !!id,
  });

  // ── Loading state ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <DashboardShell title="Candidate Profile" subtitle="Loading profile…">
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Fetching candidate details…</p>
        </div>
      </DashboardShell>
    );
  }

  // ── Error / Not found ─────────────────────────────────────────────────────
  if (isError || !profile) {
    return (
      <DashboardShell title="Candidate Profile" subtitle="Profile not found">
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="text-5xl mb-2">🔍</div>
          <h2 className="font-serif text-2xl text-foreground">Profile Not Found</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            This candidate's profile is not available or may have been removed.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={14} /> Go Back
          </button>
        </div>
      </DashboardShell>
    );
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const p = profile as any;
  const user = p.userId ?? {};
  const firstName  = user.firstName  ?? "Candidate";
  const lastName   = user.lastName   ?? "";
  const fullName   = `${firstName} ${lastName}`.trim();
  const avatarUrl  = user.avatarUrl  ?? null;
  const email      = user.email      ?? null;
  const location   = p.location?.city
    ? `${p.location.city}${p.location.country ? `, ${p.location.country}` : ""}`
    : null;

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  return (
    <DashboardShell
      title="Candidate Profile"
      subtitle="Full candidate profile — sourced directly from their account"
      actions={
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
        >
          <ArrowLeft size={13} /> Back
        </button>
      }
    >
      {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
      <div
        className="relative rounded-3xl overflow-hidden mb-5 p-6"
        style={{ background: "linear-gradient(135deg,#13091F,#1E0E35,#2C0D24)" }}
      >
        {/* Decorative glow */}
        <div
          className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(200,49,90,.22),transparent 65%)", filter: "blur(50px)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-56 h-56 pointer-events-none"
          style={{ background: "radial-gradient(circle,rgba(124,58,237,.18),transparent 65%)", filter: "blur(40px)" }}
        />

        <div className="relative flex flex-col sm:flex-row gap-5 items-start sm:items-center">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-white/20 shadow-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (sib) sib.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-2xl font-bold border-2 border-white/20 shadow-xl"
              style={{
                background: "linear-gradient(135deg,#7C3AED,#C8315A)",
                display: avatarUrl ? "none" : "flex",
              }}
            >
              {initials}
            </div>

            {/* Availability badge */}
            <div
              className={`absolute -bottom-2 -right-2 px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1 border ${
                p.isAvailable
                  ? "bg-emerald-900/80 text-emerald-300 border-emerald-700"
                  : "bg-amber-900/80 text-amber-300 border-amber-700"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${p.isAvailable ? "bg-emerald-400" : "bg-amber-400"}`} />
              {p.isAvailable ? "Available" : "Not Available"}
            </div>
          </div>

          {/* Name + title + meta */}
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-3xl text-white leading-tight mb-1">{fullName}</h1>
            {p.title && (
              <p className="text-[15px] text-white/70 font-medium mb-2">{p.title}</p>
            )}

            <div className="flex flex-wrap gap-3 text-[12px] text-white/50">
              {location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {location}
                </span>
              )}
              {p.category && (
                <span className="flex items-center gap-1">
                  <Briefcase size={11} /> {p.category}
                </span>
              )}
              {p.yearsOfExperience != null && (
                <span className="flex items-center gap-1">
                  <Clock size={11} /> {p.yearsOfExperience} yr{p.yearsOfExperience !== 1 ? "s" : ""} experience
                </span>
              )}
              {p.preferredMode && (
                <span className="flex items-center gap-1">
                  <Globe size={11} /> {p.preferredMode.charAt(0) + p.preferredMode.slice(1).toLowerCase()}
                </span>
              )}
            </div>
          </div>

          {/* Right-side stats */}
          <div className="flex-shrink-0 flex flex-col items-end gap-2">
            {p.profileViews != null && (
              <div className="text-right">
                <div className="text-2xl font-serif font-bold text-white">{p.profileViews}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-wide">Profile views</div>
              </div>
            )}
            {p.noticePeriod && (
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/60 border border-white/15">
                Notice: {p.noticePeriod}
              </span>
            )}
          </div>
        </div>

        {/* Social links */}
        {(p.linkedinUrl || p.githubUrl || p.portfolioUrl || email) && (
          <div className="relative flex flex-wrap gap-2.5 mt-5 pt-4 border-t border-white/10">
            {email && (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/[0.08] text-white/70 border border-white/15 hover:bg-white/15 hover:text-white transition-all"
              >
                <Mail size={11} /> {email}
              </a>
            )}
            {p.linkedinUrl && (
              <a
                href={p.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition-all"
              >
                <Linkedin size={11} /> LinkedIn <ExternalLink size={9} />
              </a>
            )}
            {p.githubUrl && (
              <a
                href={p.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-white/[0.08] text-white/70 border border-white/15 hover:bg-white/15 hover:text-white transition-all"
              >
                <Github size={11} /> GitHub <ExternalLink size={9} />
              </a>
            )}
            {p.portfolioUrl && (
              <a
                href={p.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 transition-all"
              >
                <Globe size={11} /> Portfolio <ExternalLink size={9} />
              </a>
            )}
          </div>
        )}
      </div>

      {/* ── BODY GRID ─────────────────────────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          {/* Bio */}
          {p.bio && (
            <Card>
              <SectionHeader icon={Zap} title="About" />
              <p className="text-[13px] text-muted-foreground leading-relaxed">{p.bio}</p>
            </Card>
          )}

          {/* Skills */}
          {p.skills?.length > 0 && (
            <Card>
              <SectionHeader icon={Star} title="Skills" />
              <div className="flex flex-wrap gap-1.5">
                {p.skills.map((s: any, i: number) => (
                  <span
                    key={i}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border capitalize ${
                      SKILL_LEVEL_COLOR[s.level] ?? "bg-secondary text-foreground border-border"
                    }`}
                  >
                    {s.name}
                    {s.level && (
                      <span className="ml-1 opacity-60 normal-case font-normal">· {s.level}</span>
                    )}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Languages */}
          {p.languages?.length > 0 && (
            <Card>
              <SectionHeader icon={Languages} title="Languages" />
              <div className="flex flex-wrap gap-1.5">
                {p.languages.map((lang: string, i: number) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary text-foreground font-medium">
                    {lang}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Salary expectation */}
          {(p.expectedSalary?.min || p.expectedSalary?.max) && (
            <Card>
              <SectionHeader icon={Briefcase} title="Expected Salary" />
              <div className="text-lg font-serif font-bold text-foreground">
                {p.expectedSalary.currency ?? "USD"}&nbsp;
                {p.expectedSalary.min?.toLocaleString() ?? "—"}
                {p.expectedSalary.max ? ` – ${p.expectedSalary.max.toLocaleString()}` : ""}
                <span className="text-[11px] text-muted-foreground font-normal ml-1">/ year</span>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN (spans 2) */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Experience */}
          {p.experience?.length > 0 && (
            <Card>
              <SectionHeader icon={Briefcase} title="Work Experience" />
              <div className="space-y-5">
                {p.experience.map((exp: any, i: number) => (
                  <div key={i} className={`relative pl-4 ${i < p.experience.length - 1 ? "pb-5 border-b border-border" : ""}`}>
                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-violet-500 to-rose-500" />

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div>
                        <div className="text-[13px] font-bold text-foreground">{exp.title}</div>
                        <div className="text-[12px] text-muted-foreground">{exp.company}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 flex-shrink-0">
                        <Calendar size={10} />
                        {formatDate(exp.from)} – {exp.current ? "Present" : formatDate(exp.to)}
                        {exp.current && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold">
                            Current
                          </span>
                        )}
                      </div>
                    </div>

                    {exp.description && (
                      <p className="text-[12px] text-muted-foreground leading-relaxed mt-2 whitespace-pre-line">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Education */}
          {p.education?.length > 0 && (
            <Card>
              <SectionHeader icon={GraduationCap} title="Education" />
              <div className="space-y-4">
                {p.education.map((ed: any, i: number) => (
                  <div key={i} className={`relative pl-4 ${i < p.education.length - 1 ? "pb-4 border-b border-border" : ""}`}>
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-gradient-to-br from-blue-500 to-violet-500" />
                    <div className="text-[13px] font-bold text-foreground">
                      {ed.degree}{ed.field ? ` in ${ed.field}` : ""}
                    </div>
                    <div className="text-[12px] text-muted-foreground">{ed.institution}</div>
                    {ed.year && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> {ed.year}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Certifications */}
          {p.certifications?.length > 0 && (
            <Card>
              <SectionHeader icon={Award} title="Certifications" />
              <div className="space-y-3">
                {p.certifications.map((cert: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-foreground">{cert.name}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {cert.issuer}{cert.year ? ` · ${cert.year}` : ""}
                      </div>
                      {cert.url && (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          View credential <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* CV File download */}
          {p.cvFileUrl && (
            <Card>
              <SectionHeader icon={Briefcase} title="Resume / CV File" />
              <a
                href={p.cvFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-[12px] font-semibold hover:opacity-90 transition-opacity"
              >
                <ExternalLink size={13} /> Download CV / Resume
              </a>
            </Card>
          )}

          {/* Empty state if no content */}
          {!p.bio && !p.experience?.length && !p.education?.length && !p.skills?.length && (
            <Card className="text-center py-12">
              <div className="text-4xl mb-3">📄</div>
              <h3 className="font-serif text-lg text-foreground mb-1">Profile in progress</h3>
              <p className="text-[12px] text-muted-foreground">
                This candidate hasn't completed their profile yet.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* ── ACTION FOOTER ─────────────────────────────────────────────────── */}
      <div className="mt-5 flex flex-wrap gap-3 items-center justify-between bg-card border border-border rounded-2xl p-4">
        <div>
          <div className="text-[13px] font-bold text-foreground">Interested in {firstName}?</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Post a job and let candidates apply, or search for more talent.
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/employer/ai-search"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
          >
            ← Back to Search
          </Link>
          <Link
            to="/employer/post-job"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
