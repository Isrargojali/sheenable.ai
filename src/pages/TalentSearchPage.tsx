import React from "react";
import { Sparkles, Search, UserCheck, ShieldCheck, ArrowRight, Star, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

export default function TalentSearchPage() {
  const { user } = useAuthStore();

  const mockCandidates = [
    { initials: "AR", role: "Senior Full-Stack Engineer", exp: "7 Years", city: "Lahore", skills: ["React", "TypeScript", "Node.js", "AWS", "Docker"], matches: 98 },
    { initials: "FN", role: "Principal UX/UI Designer", exp: "8 Years", city: "Karachi", skills: ["Figma", "Design Systems", "HCD", "Product Strategy", "Framer"], matches: 96 },
    { initials: "SC", role: "VP of Product Development", exp: "12 Years", expRole: "Fintech Leader", city: "Islamabad", skills: ["Agile Sprints", "Product Roadmaps", "DEI Advocacy", "Scrum Master"], matches: 99 },
    { initials: "ZK", role: "Lead Data Scientist", exp: "5 Years", city: "Lahore", skills: ["Python", "TensorFlow", "Pandas", "NLP Models", "SQL"], matches: 95 }
  ];

  return (
    <div className="min-h-screen bg-[var(--surface-dark)] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Hero Section */}
      <section className="bg-[var(--surface-dark)] text-white py-16">
        <div className="relative max-w-[1200px] mx-auto px-6 text-center max-w-2xl space-y-3">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            AI-powered <span className="italic text-[var(--brand-pink)]">Talent Discovery</span>
          </h2>
          <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed">
            Eliminate resume-filtering overhead. Our advanced semantic search matches your engineering requirements against Pakistan's top-tier cohort of verified female tech leaders.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 bg-[var(--surface-dark)] text-white py-12">
        <div className="max-w-[1200px] mx-auto w-full px-6 space-y-12">
          {/* Features Row */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] p-6 space-y-2 shadow-xl">
              <Cpu size={24} strokeWidth={1.75} className="text-[var(--text-on-dark)]" />
              <h4 className="text-base font-semibold text-[var(--text-on-dark)]">Semantic AI Filters</h4>
              <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed">Search with natural prompts like "senior frontend engineer with Docker experience" and get scored fits instantly.</p>
            </div>

            <div className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] p-6 space-y-2 shadow-xl">
              <ShieldCheck size={24} strokeWidth={1.75} className="text-[var(--text-on-dark)]" />
              <h4 className="text-base font-semibold text-[var(--text-on-dark)]">100% Anonymized Previews</h4>
              <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed">Ensure absolute gender equality and eliminate bias by evaluating skills, experience summaries, and projects first.</p>
            </div>

            <div className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] p-6 space-y-2 shadow-xl">
              <UserCheck size={24} strokeWidth={1.75} className="text-[var(--text-on-dark)]" />
              <h4 className="text-base font-semibold text-[var(--text-on-dark)]">Verified Skill Credentials</h4>
              <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed">Every candidate profile is mapped, verified, and parsed to maintain clean and reliable information benchmarks.</p>
            </div>
          </div>

          {/* Teaser Candidate Cards Grid */}
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--border-dark)] pb-3">
              <h3 className="text-lg font-semibold text-[var(--text-on-dark)] flex items-center gap-2">
                <Sparkles size={16} className="text-[var(--brand-pink)]" /> Anonymized Top Cohort Previews
              </h3>
              <span className="text-xs text-[var(--text-on-dark-mute)]">Showing 4 of 250+ active profiles</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {mockCandidates.map((c, idx) => (
                <div key={idx} className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] p-6 space-y-4 shadow-xl relative overflow-hidden">
                  <span className="absolute top-4 right-4 px-2.5 py-1 bg-[var(--brand-pink)] text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                    {c.matches}% Match Score
                  </span>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/5 border border-[var(--border-dark)] flex items-center justify-center font-serif text-sm font-bold text-[var(--text-on-dark)]">
                      {c.initials}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-[var(--text-on-dark)]">{c.role}</h4>
                      <p className="text-xs text-[var(--text-on-dark-mute)] mt-0.5">{c.exp} · {c.city}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {c.skills.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-white/5 border border-[var(--border-dark)] rounded-full text-xs text-[var(--text-on-dark-mute)] font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 text-center">
              {user?.role === "EMPLOYER" ? (
                <Link
                  to="/employer/ai-search"
                  className="h-[52px] px-8 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 shadow-lg"
                >
                  Unlock Full AI Search Portal <ArrowRight size={18} />
                </Link>
              ) : (
                <Link
                  to="/auth/signup?role=EMPLOYER"
                  className="h-[52px] px-8 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-bold transition-all inline-flex items-center justify-center gap-1.5 shadow-lg"
                >
                  Register as Employer to Unlock Full Profiles <ArrowRight size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
