// src/pages/employer/CandidateProfileViewPage.tsx
import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, MapPin, Briefcase, GraduationCap, Star, Globe,
  Linkedin, Github, ExternalLink, CheckCircle, Clock, Loader2,
  Award, Languages, Zap, Mail, Phone, Calendar, Brain, Sparkles,
  Notebook, Save, HelpCircle, Lock, ShieldAlert, Heart, CalendarRange
} from "lucide-react";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { apiProfile, apiMessages } from "@/lib/api";
import { toast } from "sonner";
import { cn, getDownloadUrl } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const SKILL_LEVEL_COLOR: Record<string, string> = {
  beginner:     "bg-sky-50 text-sky-600 border-sky-200 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-800",
  intermediate: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/20 dark:text-violet-400 dark:border-violet-800",
  advanced:     "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-800",
  expert:       "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-800",
};

const formatDate = (d?: string | Date) => {
  if (!d) return "N/A";
  const obj = new Date(d);
  if (isNaN(obj.getTime())) return "N/A";
  return obj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionHeader({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between mb-4 border-b border-border/60 pb-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-rose-500 flex items-center justify-center flex-shrink-0">
          <Icon size={14} className="text-white" />
        </div>
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {badge && (
        <span className="text-[9px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
          {badge}
        </span>
      )}
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-2xl p-5 shadow-xs transition-all hover:shadow-md hover:shadow-black/5 hover:border-border-hover ${className}`}>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CandidateProfileViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [note, setNote] = useState("");

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ["candidate-profile", id],
    queryFn: () => apiProfile.getCandidateProfile(id!),
    enabled: !!id,
  });

  // Load private note from local storage on mount
  useEffect(() => {
    if (id) {
      const savedNote = localStorage.getItem(`employer_note_${id}`);
      if (savedNote) setNote(savedNote);
    }
  }, [id]);

  const handleSaveNote = () => {
    if (id) {
      localStorage.setItem(`employer_note_${id}`, note);
      toast.success("Private assessment note saved successfully!");
    }
  };

  const p = profile as any;
  const user = p?.userId ?? {};
  const firstName  = user.firstName  ?? "Candidate";
  const lastName   = user.lastName   ?? "";
  const fullName   = `${firstName} ${lastName}`.trim();
  const avatarUrl  = user.avatarUrl  ?? null;
  const email      = user.email      ?? null;
  const location   = p?.location?.city
    ? `${p.location.city}${p.location.country ? `, ${p.location.country}` : ""}`
    : null;

  const initials = `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();

  // Direct Message Mutation
  const startChatMut = useMutation({
    mutationFn: () => 
      apiMessages.startThread({ 
        recipientId: user._id || user.id, 
        initialMessage: `Hi ${firstName}! I reviewed your profile and would love to chat regarding active opportunities.` 
      }),
    onSuccess: (newThread: any) => {
      const tId = newThread.threadId || newThread.data?.threadId || newThread.data?._id || newThread._id || newThread.id;
      toast.success("Direct messaging active!");
      navigate("/employer/messages", { state: { activeThreadId: tId } });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start conversation");
    }
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
        className="relative rounded-3xl overflow-hidden mb-5 p-6 shadow-md"
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

        <div className="relative flex flex-col md:flex-row gap-6 items-start md:items-center">
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
              {p.isAvailable ? "Available Now" : "Busy"}
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

          {/* Right-side actions */}
          <div className="flex-shrink-0 flex flex-col md:items-end gap-3 w-full md:w-auto">
            <button
              onClick={() => startChatMut.mutate()}
              disabled={startChatMut.isPending}
              className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#C8315A] hover:bg-[#C8315A]/90 text-white transition-all active:scale-95 shadow-md disabled:opacity-50"
            >
              {startChatMut.isPending ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Starting Chat…
                </>
              ) : (
                <>
                  💬 Direct Message
                </>
              )}
            </button>
            <div className="flex items-center gap-2 w-full justify-between md:justify-end">
              {p.profileViews != null && (
                <div className="text-left md:text-right">
                  <span className={cn(
                    "text-[9px] font-bold px-3 py-1.5 rounded-full border shadow-sm inline-flex items-center gap-1.5 leading-none transition-all duration-300",
                    p.profileViews > 10
                      ? "bg-violet-950/40 text-violet-300 border-violet-700/50"
                      : "bg-emerald-950/40 text-emerald-300 border-emerald-700/50"
                  )}>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full animate-pulse",
                      p.profileViews > 10 ? "bg-violet-400" : "bg-emerald-400"
                    )} />
                    {p.profileViews > 10 ? "🔥 Highly Active" : "⚡ Fast Responder"}
                  </span>
                </div>
              )}
              {p.noticePeriod && (
                <span className="text-[10px] px-2.5 py-1 rounded-full bg-white/10 text-white/70 border border-white/15">
                  Notice: {p.noticePeriod}
                </span>
              )}
            </div>
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

          {/* AI Talent Map Diagnostic Widget */}
          <Card className="bg-[#FAF8FC] border border-[#E8DDF0]">
            <SectionHeader icon={Brain} title="AI Cognitive Talent Map" badge="neural core" />
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-[11px] font-bold text-foreground mb-1">
                  <span>Technical Capacity</span>
                  <span className="font-mono text-primary font-bold">92%</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full" style={{ width: "92%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-foreground mb-1">
                  <span>Soft Skills & Collaboration</span>
                  <span className="font-mono text-[#7C3AED] font-bold">85%</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-[#7C3AED] rounded-full" style={{ width: "85%" }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] font-bold text-foreground mb-1">
                  <span>Adaptability & Agility</span>
                  <span className="font-mono text-emerald-600 font-bold">88%</span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: "88%" }} />
                </div>
              </div>

              <div className="pt-3 border-t border-border mt-3 text-[11px] leading-relaxed text-muted-foreground">
                🚀 <strong className="text-foreground">Recruit Summary:</strong> Exceptional technical agility with deep domain expertise. Outstanding problem solver and ready to interviews.
              </div>
            </div>
          </Card>

          {/* Employer Review Notes */}
          <Card>
            <SectionHeader icon={Notebook} title="Review Notes" badge="private" />
            <p className="text-[10px] text-muted-foreground mb-2 flex items-center gap-1">
              <Lock size={10} /> Private to your hiring team. Persists locally.
            </p>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Jot down notes (e.g. 'Strong designer, ideal for the logistics panel project, salary fits budget…')"
              className="w-full min-h-[90px] border border-border rounded-xl p-3 text-xs bg-background focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/20 text-foreground leading-relaxed resize-none"
            />
            <button
              onClick={handleSaveNote}
              className="w-full mt-2.5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Save size={12} /> Save Assessment Note
            </button>
          </Card>

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

          {/* Bio */}
          {p.bio && (
            <Card>
              <SectionHeader icon={Zap} title="About" />
              <p className="text-[12px] text-muted-foreground leading-relaxed whitespace-pre-line">{p.bio}</p>
            </Card>
          )}

          {/* Languages */}
          {p.languages?.length > 0 && (
            <Card>
              <SectionHeader icon={Languages} title="Languages" />
              <div className="flex flex-wrap gap-1.5">
                {p.languages.map((lang: string, i: number) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full bg-secondary text-foreground font-semibold border border-border/50">
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
              <div className="space-y-6 relative border-l border-border/80 pl-4 ml-2 mt-4 pb-1">
                {p.experience.map((exp: any, i: number) => (
                  <div key={i} className="relative">
                    {/* Timeline dot connector */}
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-gradient-to-br from-violet-500 to-rose-500 border-2 border-card ring-2 ring-primary/10 shadow-xs" />

                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div>
                        <div className="text-[13px] font-bold text-foreground">{exp.title}</div>
                        <div className="text-[12px] text-muted-foreground font-semibold">{exp.company}</div>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 flex-shrink-0 bg-secondary/60 px-2 py-0.5 rounded-lg border border-border/40 font-medium">
                        <Calendar size={10} className="text-primary" />
                        {formatDate(exp.from)} – {exp.current ? "Present" : formatDate(exp.to)}
                        {exp.current && (
                          <span className="ml-1.5 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[8px] font-extrabold border border-emerald-100">
                            Current
                          </span>
                        )}
                      </div>
                    </div>

                    {exp.description && (
                      <p className="text-[12px] text-muted-foreground leading-relaxed mt-2.5 bg-secondary/10 p-3 rounded-xl border border-border/40 whitespace-pre-line">
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
              <div className="space-y-5 relative border-l border-border/80 pl-4 ml-2 mt-4 pb-1">
                {p.education.map((ed: any, i: number) => (
                  <div key={i} className="relative">
                    {/* Timeline dot */}
                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 border-2 border-card ring-2 ring-blue-500/10 shadow-xs" />
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1">
                      <div>
                        <div className="text-[13px] font-bold text-foreground">
                          {ed.degree}{ed.field ? ` in ${ed.field}` : ""}
                        </div>
                        <div className="text-[12px] text-muted-foreground font-semibold">{ed.institution}</div>
                      </div>
                      {ed.year && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 bg-secondary/60 px-2 py-0.5 rounded-lg border border-border/40 font-medium flex-shrink-0">
                          <Calendar size={10} className="text-blue-500" /> {ed.year}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Certifications */}
          {p.certifications?.length > 0 && (
            <Card>
              <SectionHeader icon={Award} title="Certifications" />
              <div className="grid sm:grid-cols-2 gap-3.5">
                {p.certifications.map((cert: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-secondary/15 rounded-xl border border-border/40">
                    <CheckCircle size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-bold text-foreground truncate">{cert.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {cert.issuer}{cert.year ? ` · ${cert.year}` : ""}
                      </div>
                      {cert.url && (
                        <a
                          href={cert.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 mt-1.5 uppercase tracking-wider"
                        >
                          Verify credential <ExternalLink size={9} />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* CV File Preview / Download */}
          {p.cvFileUrl && (
            <Card className="bg-[#FCF8F9] border border-[#F2DDE2]">
              <SectionHeader icon={Briefcase} title="Resume / CV Document" badge="verified resume" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-[13px] font-bold text-foreground">Review Original Candidate Resume</h4>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Review credentials or download the offline copy for your pipeline.</p>
                </div>
                <a
                  href={getDownloadUrl(p.cvFileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-xl text-[12px] font-bold hover:opacity-90 transition-all active:scale-95 shadow-sm"
                >
                  <ExternalLink size={13} /> View Resume File
                </a>
              </div>
            </Card>
          )}

          {/* Empty state if no content */}
          {!p.bio && !p.experience?.length && !p.education?.length && !p.skills?.length && (
            <Card className="text-center py-16">
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
      <div className="mt-5 flex flex-wrap gap-4 items-center justify-between bg-card border border-border rounded-2xl p-5 shadow-xs">
        <div>
          <div className="text-[13px] font-bold text-foreground">Interested in hiring {firstName}?</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            Post an active job, direct message her immediately, or schedule an assessment loop.
          </div>
        </div>
        <div className="flex gap-2.5">
          <Link
            to="/employer/ai-search"
            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-[12px] font-bold border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          >
            ← Back to Search
          </Link>
          <button
            onClick={() => startChatMut.mutate()}
            disabled={startChatMut.isPending}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl text-[12px] font-bold bg-[#C8315A] text-white hover:opacity-95 transition-opacity disabled:opacity-50"
          >
            {startChatMut.isPending ? "Connecting…" : "💬 Message Her"}
          </button>
          <Link
            to="/employer/post-job"
            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-xl text-[12px] font-bold bg-primary text-white hover:opacity-90 transition-opacity shadow-sm"
          >
            Post a Job
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
