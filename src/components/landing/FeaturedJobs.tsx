// src/components/landing/FeaturedJobs.tsx
import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight, SlidersHorizontal } from "lucide-react";
import { JobCard } from "@/components/ui-kit";
import { MOCK_JOBS } from "@/mock/data";

const INDUSTRIES = ["All industries", "IT & Tech", "Finance", "Design & UX", "Healthcare", "Sales & Marketing"];
const TYPES = ["All types", "Remote", "Hybrid", "Onsite", "Full-time", "Part-time"];

export default function FeaturedJobs() {
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [type, setType] = useState(TYPES[0]);

  const filtered = useMemo(() => {
    return MOCK_JOBS.filter(j => {
      if (q && !`${j.title} ${j.employer.companyName} ${(j.skills||[]).join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (industry !== INDUSTRIES[0] && j.category !== industry) return false;
      if (type !== TYPES[0]) {
        const t = type.toUpperCase();
        if (j.mode !== t && j.type !== t.replace("-", "")) return false;
      }
      return true;
    }).slice(0, 6);
  }, [q, industry, type]);

  return (
    <section id="jobs" className="max-w-[1280px] mx-auto px-5 lg:px-8 py-20 lg:py-24">
      <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
        <div>
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground mb-3">
            Latest opportunities
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight">
            Roles where you'll <span className="italic text-primary">thrive</span>
          </h2>
          <p className="text-[13px] text-muted-foreground mt-2 max-w-md">
            Hand-picked openings from inclusive employers, refreshed every hour.
          </p>
        </div>
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-primary hover:gap-2.5 transition-all"
        >
          View all <ArrowRight size={13} />
        </Link>
      </div>

      {/* Filter bar */}
      <div className="bg-card border border-border rounded-2xl p-3 mb-6 flex flex-wrap items-center gap-2 shadow-soft">
        <div className="flex-1 min-w-[220px] flex items-center gap-2 px-3 h-10 rounded-xl bg-secondary/60">
          <Search size={14} className="text-muted-foreground" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search jobs, skills, or companies"
            className="flex-1 bg-transparent text-[12px] focus:outline-none placeholder:text-muted-foreground"
            aria-label="Search jobs"
          />
        </div>
        <select
          value={industry}
          onChange={e => setIndustry(e.target.value)}
          className="h-10 px-3 rounded-xl bg-secondary/60 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Industry"
        >
          {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
        </select>
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="h-10 px-3 rounded-xl bg-secondary/60 text-[12px] font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Job type"
        >
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-[12px] font-bold press">
          <SlidersHorizontal size={13} /> Filter
        </button>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(job => (
          <JobCard key={job.id} job={job as any} />
        ))}
      </div>
    </section>
  );
}
