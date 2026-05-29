import React from "react";
import { Sparkles, Search, UserCheck, ShieldCheck, ArrowRight, Star, Cpu } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import logo from "@/assets/sheEnableAI-removebg-preview.png";

export default function TalentSearchPage() {
  const { user } = useAuthStore();

  const mockCandidates = [
    { initials: "AR", role: "Senior Full-Stack Engineer", exp: "7 Years", city: "Lahore", skills: ["React", "TypeScript", "Node.js", "AWS", "Docker"], matches: 98 },
    { initials: "FN", role: "Principal UX/UI Designer", exp: "8 Years", city: "Karachi", skills: ["Figma", "Design Systems", "HCD", "Product Strategy", "Framer"], matches: 96 },
    { initials: "SC", role: "VP of Product Development", exp: "12 Years", expRole: "Fintech Leader", city: "Islamabad", skills: ["Agile Sprints", "Product Roadmaps", "DEI Advocacy", "Scrum Master"], matches: 99 },
    { initials: "ZK", role: "Lead Data Scientist", exp: "5 Years", city: "Lahore", skills: ["Python", "TensorFlow", "Pandas", "NLP Models", "SQL"], matches: 95 }
  ];

  return (
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0F0A1A]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="SheEnableAI logo" className="h-10 object-contain" />
        </Link>
        {user?.role === "EMPLOYER" ? (
          <Link
            to="/employer/ai-search"
            className="px-4 py-2 bg-[#22C55E]/10 hover:bg-[#22C55E]/20 border border-[#22C55E]/20 rounded-full text-xs font-bold text-[#22C55E] transition-all"
          >
            Go to Live Search
          </Link>
        ) : (
          <Link
            to="/auth/signup?role=EMPLOYER"
            className="px-5 py-2 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all shadow-lg"
          >
            Register as Employer
          </Link>
        )}
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-12">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            AI-powered <span className="text-[#22C55E]">Talent Discovery</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Eliminate resume-filtering overhead. Our advanced semantic search matches your engineering requirements against Pakistan's top-tier cohort of verified female tech leaders.
          </p>
        </div>

        {/* Features Row */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-5 space-y-2">
            <Cpu size={18} className="text-[#22C55E]" />
            <h4 className="text-xs font-bold text-white">Semantic AI Filters</h4>
            <p className="text-[10px] text-white/50 leading-relaxed">Search with natural prompts like "senior frontend engineer with Docker experience" and get scored fits instantly.</p>
          </div>

          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-5 space-y-2">
            <ShieldCheck size={18} className="text-purple-400" />
            <h4 className="text-xs font-bold text-white">100% Anonymized Previews</h4>
            <p className="text-[10px] text-white/50 leading-relaxed">Ensure absolute gender equality and eliminate bias by evaluating skills, experience summaries, and projects first.</p>
          </div>

          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-5 space-y-2">
            <UserCheck size={18} className="text-pink-400" />
            <h4 className="text-xs font-bold text-white">Verified Skill Credentials</h4>
            <p className="text-[10px] text-white/50 leading-relaxed">Every candidate profile is mapped, verified, and parsed to maintain clean and reliable information benchmarks.</p>
          </div>
        </div>

        {/* Teaser Candidate Cards Grid */}
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-[#22C55E]" /> Anonymized Top Cohort Previews
            </h3>
            <span className="text-[10px] text-white/40">Showing 4 of 250+ active profiles</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {mockCandidates.map((c, idx) => (
              <div key={idx} className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl relative overflow-hidden">
                <span className="absolute top-4 right-4 px-2 py-0.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[8px] font-black rounded-full uppercase tracking-wider">
                  {c.matches}% Match Score
                </span>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-serif text-sm font-black text-white/70">
                    {c.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{c.role}</h4>
                    <p className="text-[10px] text-white/40 mt-0.5">{c.exp} · {c.city}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {c.skills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#1A0D1F] border border-white/5 rounded text-[8px] text-white/50 font-bold">
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
                className="px-6 py-3 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all inline-flex items-center gap-1.5 shadow-lg"
              >
                Unlock Full AI Search Portal <ArrowRight size={14} />
              </Link>
            ) : (
              <Link
                to="/auth/signup?role=EMPLOYER"
                className="px-6 py-3 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all inline-flex items-center gap-1.5 shadow-lg"
              >
                Register as Employer to Unlock Full Profiles <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
