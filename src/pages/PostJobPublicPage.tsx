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
    <div className="min-h-screen bg-[var(--surface-dark)] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Main Grid */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side Info */}
        <div className="lg:col-span-5 space-y-6 py-4">
          <div className="space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-on-dark)] bg-[var(--surface-dark-card)] px-[10px] py-[4px] rounded-full border border-[var(--border-dark)]">
              Employer Lead Onboarding
            </span>
            <h2 className="font-serif text-3xl font-extrabold tracking-tight leading-tight text-white">
              Hire extraordinary <br />
              <span className="italic text-[var(--brand-pink)]">female tech talent</span>
            </h2>
            <p className="text-xs text-[var(--text-on-dark-mute)] leading-relaxed">
              Unlock Pakistan's most premium cohort of developers, product managers, and UI/UX designers. SheEnableAI provides instant AI candidate screening, inclusive job templates, and direct matching metrics to build exceptional engineering squads.
            </p>
          </div>

          {/* Core Perks list */}
          <div className="space-y-4">
            <div className="flex gap-3 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] p-4 rounded-2xl">
              <Zap size={20} strokeWidth={1.75} className="text-white flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">AI Screening & ATS Pipelines</h4>
                <p className="text-[10px] text-[var(--text-on-dark-mute)] leading-relaxed mt-0.5">Filter candidates instantly through our high-performance semantic parsing, cutting recruitment cycles by 60%.</p>
              </div>
            </div>

            <div className="flex gap-3 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] p-4 rounded-2xl">
              <ShieldCheck size={20} strokeWidth={1.75} className="text-white flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Verified Diversity Portfolios</h4>
                <p className="text-[10px] text-[var(--text-on-dark-mute)] leading-relaxed mt-0.5">Build brand credibility as an inclusive employer. Reach thousands of verified she-talent candidates directly.</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/pricing"
              className="px-[18px] h-10 border border-[var(--border-dark)] hover:border-white/20 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 text-[var(--text-on-dark)]"
            >
              View Subscription Pricing <Eye size={12} />
            </Link>
          </div>
        </div>

        {/* Right Side Visual Live Mock Poster */}
        <div className="lg:col-span-7 space-y-6 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-3xl p-6 shadow-xl text-white">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--brand-pink)]" /> Interactive Posting Previewer
          </h3>
          <p className="text-xs text-[var(--text-on-dark-mute)]">Draft your role specs below and watch the live candidate view update instantly.</p>

          {/* Quick Mock Inputs */}
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={job.title}
              onChange={(e) => setJob({ ...job, title: e.target.value })}
              placeholder="Job Title"
              className="bg-white/5 border border-[var(--border-dark)] rounded-[var(--radius-input)] px-4 py-2.5 text-xs text-[var(--text-on-dark)] placeholder:text-[var(--text-on-dark-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 transition-all"
            />
            <input
              type="text"
              value={job.company}
              onChange={(e) => setJob({ ...job, company: e.target.value })}
              placeholder="Company Name"
              className="bg-white/5 border border-[var(--border-dark)] rounded-[var(--radius-input)] px-4 py-2.5 text-xs text-[var(--text-on-dark)] placeholder:text-[var(--text-on-dark-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 transition-all"
            />
            <select
              value={job.jobMode}
              onChange={(e) => setJob({ ...job, jobMode: e.target.value })}
              className="bg-white/5 border border-[var(--border-dark)] rounded-[var(--radius-input)] px-4 py-2.5 text-xs text-[var(--text-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 transition-all cursor-pointer"
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
              className="bg-white/5 border border-[var(--border-dark)] rounded-[var(--radius-input)] px-4 py-2.5 text-xs text-[var(--text-on-dark)] placeholder:text-[var(--text-on-dark-mute)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 transition-all"
            />
          </div>

          {/* Preview panel */}
          <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl p-5 relative overflow-hidden">
            <span className="absolute top-4 right-4 px-[10px] py-[4px] bg-white/5 border border-[var(--border-dark)] text-[var(--text-on-dark-mute)] text-[10px] font-semibold rounded-full uppercase tracking-wider">
              Preview Mode
            </span>

            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-on-dark-mute)] bg-white/5 border border-[var(--border-dark)] px-[10px] py-[4px] rounded-full">
                  {job.category}
                </span>
                <h4 className="text-base font-extrabold text-white mt-2.5">{job.title || "Job Title"}</h4>
                <p className="text-[10px] text-[var(--text-on-dark-mute)] mt-0.5">{job.company} · {job.jobMode} · {job.location}</p>
              </div>

              <p className="text-xs text-white/70 leading-relaxed border-t border-[var(--border-dark)] pt-3">
                {job.description || "Describe the role..."}
              </p>

              <div className="flex justify-between items-center border-t border-[var(--border-dark)] pt-3 text-[10px] text-[var(--text-on-dark-mute)]">
                <span>Monthly Compensation: PKR {Number(job.salaryMin).toLocaleString()} – {Number(job.salaryMax).toLocaleString()}</span>
                <span className="px-3 h-8 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-[13px] font-semibold flex items-center gap-1 shadow transition-all cursor-pointer">
                  Apply Now <Plus size={10} />
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 text-center">
            <Link
              to="/auth/signup?role=EMPLOYER"
              className="w-full h-12 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-lg"
            >
              Publish Real Listing Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
