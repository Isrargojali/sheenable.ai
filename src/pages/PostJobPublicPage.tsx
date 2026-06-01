import React, { useState } from "react";
import { Sparkles, Briefcase, Plus, Heart, Share2, Eye, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

export default function PostJobPublicPage() {
  const [job, setJob] = useState({
    title: "Software Engineer",
    company: "Cobalt Labs",
    category: "Software Development",
    jobType: "FULLTIME",
    jobMode: "REMOTE",
    location: "Karachi, Pakistan",
    salaryMin: "120000",
    salaryMax: "180000",
    description: "Looking for an ambitious React + Node developer to join our core SaaS platform development team..."
  });

  return (
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Main Grid */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side Info */}
        <div className="lg:col-span-5 space-y-6 py-4">
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#22C55E] bg-[#22C55E]/10 px-3 py-1 rounded-full border border-[#22C55E]/20">
              Employer Lead Onboarding
            </span>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight leading-tight">
              Hire extraordinary <br />
              <span className="text-[#22C55E]">female tech talent</span>
            </h2>
            <p className="text-xs text-white/50 leading-relaxed">
              Unlock Pakistan's most premium cohort of developers, product managers, and UI/UX designers. SheEnableAI provides instant AI candidate screening, inclusive job templates, and direct matching metrics to build exceptional engineering squads.
            </p>
          </div>

          {/* Core Perks list */}
          <div className="space-y-4">
            <div className="flex gap-3 bg-[#0F0A1A] border border-white/5 p-4 rounded-2xl">
              <Zap size={18} className="text-[#22C55E] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">AI Screening & ATS Pipelines</h4>
                <p className="text-[10px] text-white/50 leading-relaxed mt-0.5">Filter candidates instantly through our high-performance semantic parsing, cutting recruitment cycles by 60%.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-[#0F0A1A] border border-white/5 p-4 rounded-2xl">
              <ShieldCheck size={18} className="text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Verified Diversity Portfolios</h4>
                <p className="text-[10px] text-white/50 leading-relaxed mt-0.5">Build brand credibility as an inclusive employer. Reach thousands of verified she-talent candidates directly.</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/pricing"
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5"
            >
              View Subscription Pricing <Eye size={12} />
            </Link>
          </div>
        </div>

        {/* Right Side Visual Live Mock Poster */}
        <div className="lg:col-span-7 space-y-6 bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-[#22C55E]" /> Interactive Posting Previewer
          </h3>
          <p className="text-xs text-white/50">Draft your role specs below and watch the live candidate view update instantly.</p>

          {/* Quick Mock Inputs */}
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={job.title}
              onChange={(e) => setJob({ ...job, title: e.target.value })}
              placeholder="Job Title"
              className="bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-2.5 text-xs focus:outline-none"
            />
            <input
              type="text"
              value={job.company}
              onChange={(e) => setJob({ ...job, company: e.target.value })}
              placeholder="Company Name"
              className="bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-2.5 text-xs focus:outline-none"
            />
            <select
              value={job.jobMode}
              onChange={(e) => setJob({ ...job, jobMode: e.target.value })}
              className="bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-2.5 text-xs focus:outline-none text-white/70"
            >
              <option value="REMOTE">Remote</option>
              <option value="HYBRID">Hybrid</option>
              <option value="ONSITE">Onsite</option>
            </select>
            <input
              type="text"
              value={job.location}
              onChange={(e) => setJob({ ...job, location: e.target.value })}
              placeholder="Location Hub"
              className="bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-2.5 text-xs focus:outline-none"
            />
          </div>

          {/* Preview panel */}
          <div className="bg-[#1A0D1F] border border-white/5 rounded-2xl p-5 relative overflow-hidden shadow-inner">
            <span className="absolute top-4 right-4 px-2 py-0.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[8px] font-black rounded-full uppercase tracking-wider">
              Preview Mode
            </span>

            <div className="space-y-4">
              <div>
                <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                  {job.category}
                </span>
                <h4 className="text-base font-extrabold text-white mt-1.5">{job.title || "Job Title"}</h4>
                <p className="text-[10px] text-white/40 mt-0.5">{job.company} · {job.jobMode} · {job.location}</p>
              </div>

              <p className="text-xs text-white/60 leading-relaxed border-t border-white/5 pt-3">
                {job.description || "Describe the role..."}
              </p>

              <div className="flex justify-between items-center border-t border-white/5 pt-3 text-[10px] text-white/40">
                <span>Monthly Compensation: PKR {Number(job.salaryMin).toLocaleString()} – {Number(job.salaryMax).toLocaleString()}</span>
                <span className="px-3 py-1 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full font-black flex items-center gap-1 shadow transition-all cursor-pointer">
                  Apply Now <Plus size={10} />
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/auth/signup?role=EMPLOYER"
              className="w-full py-3 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all flex items-center justify-center gap-1 shadow-lg"
            >
              Publish Real Listing Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
