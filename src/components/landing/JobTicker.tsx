// src/components/landing/JobTicker.tsx
// Scrolling horizontal strip of "live" job postings under the hero CTAs.
import { Briefcase, MapPin } from "lucide-react";

const TICKER = [
  { title: "Senior Product Manager", company: "Atlas Bank",      mode: "Remote", salary: "PKR 250K" },
  { title: "Frontend Engineer",      company: "Techflow",        mode: "Hybrid", salary: "PKR 180K" },
  { title: "UX Lead",                company: "Helix Health",    mode: "Remote", salary: "PKR 220K" },
  { title: "Data Analyst",           company: "NorthStar",       mode: "Onsite", salary: "PKR 140K" },
  { title: "Content Strategist",     company: "Cobalt Labs",     mode: "Remote", salary: "PKR 130K" },
  { title: "HR Business Partner",    company: "Lumen",           mode: "Hybrid", salary: "PKR 200K" },
  { title: "Backend Engineer",       company: "Orbit",           mode: "Remote", salary: "PKR 240K" },
  { title: "Brand Designer",         company: "Vertex",          mode: "Hybrid", salary: "PKR 150K" },
];

export default function JobTicker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="relative overflow-hidden py-3"
         style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
      <div className="flex gap-3 w-max animate-ticker">
        {items.map((j, i) => (
          <div
            key={i}
            className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-full bg-white/8 border border-white/10 backdrop-blur-sm whitespace-nowrap"
          >
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-mint-400/20 text-mint-300">
              <Briefcase size={11} />
            </span>
            <span className="text-[11px] font-bold text-white/90">New</span>
            <span className="text-[11px] text-white/85">{j.title} at <span className="font-semibold text-white">{j.company}</span></span>
            <span className="text-[10px] text-white/40 inline-flex items-center gap-1">
              <MapPin size={9} /> {j.mode}
            </span>
            <span className="text-[11px] font-bold text-amber-300">{j.salary}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
