import { Briefcase, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiJobs } from "@/lib/api";

interface TickerItem {
  title: string;
  company: string;
  mode: string;
  salary: string;
  badge: "New" | "Urgent";
}

const MOCK_TICKER: TickerItem[] = [
  { title: "Senior Product Manager", company: "Atlas Bank",      mode: "Remote", salary: "PKR 250K", badge: "New" },
  { title: "Frontend Engineer",      company: "Techflow",        mode: "Hybrid", salary: "PKR 180K", badge: "Urgent" },
  { title: "UX Lead",                company: "Helix Health",    mode: "Remote", salary: "PKR 220K", badge: "New" },
  { title: "Data Analyst",           company: "NorthStar",       mode: "Onsite", salary: "PKR 140K", badge: "Urgent" },
  { title: "Content Strategist",     company: "Cobalt Labs",     mode: "Remote", salary: "PKR 130K", badge: "New" },
  { title: "HR Business Partner",    company: "Lumen",           mode: "Hybrid", salary: "PKR 200K", badge: "Urgent" },
  { title: "Backend Engineer",       company: "Orbit",           mode: "Remote", salary: "PKR 240K", badge: "New" },
  { title: "Brand Designer",         company: "Vertex",          mode: "Hybrid", salary: "PKR 150K", badge: "Urgent" },
];

export default function JobTicker() {
  // Fetch real-time job listings from the backend database
  const { data: realJobs = [] } = useQuery<any[]>({
    queryKey: ["landingTickerJobs"],
    queryFn: async () => {
      const res = await apiJobs.getJobs();
      return Array.isArray(res) ? res : [];
    },
    staleTime: 3 * 60 * 1000,
  });

  // Map real-time jobs or fallback to mock items
  const tickerItems: TickerItem[] = realJobs.length > 0 
    ? realJobs.map((j, idx) => {
        const salaryVal = j.salaryMax || j.salaryMin || 0;
        const compactSalary = salaryVal > 0 
          ? `PKR ${Math.round(salaryVal / 1000)}K` 
          : "Competitive";

        const rawMode = j.mode || "REMOTE";
        const formattedMode = rawMode.charAt(0) + rawMode.slice(1).toLowerCase();

        return {
          title: j.title,
          company: j.employer?.companyName || "Verified Employer",
          mode: formattedMode,
          salary: compactSalary,
          badge: idx % 2 === 0 ? "New" : "Urgent",
        };
      })
    : MOCK_TICKER;

  // Duplicate items to ensure a seamless infinite scrolling animation loop
  const items = [...tickerItems, ...tickerItems];

  return (
    <div 
      className="relative overflow-hidden py-3 w-full"
      style={{ 
        maskImage: "linear-gradient(90deg, transparent, black 40px, black calc(100% - 40px), transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 40px, black calc(100% - 40px), transparent)"
      }}
    >
      <div className="flex gap-4 w-max animate-ticker">
        {items.map((j, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 pl-4 pr-5 py-2.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm whitespace-nowrap"
          >
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--accent-green)]/20 text-[var(--accent-green)] flex-shrink-0">
              <Briefcase size={12} />
            </span>
            
            {j.badge === "New" ? (
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-green)] text-white">
                New
              </span>
            ) : (
              <span className="text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--brand-pink)] text-white">
                Urgent
              </span>
            )}
            
            <span className="text-[13px] text-white/90">
              {j.title} at <span className="font-semibold text-white">{j.company}</span>
            </span>
            
            <span className="text-[12px] text-white/50 inline-flex items-center gap-1">
              <MapPin size={11} className="text-white/40" /> {j.mode}
            </span>
            
            <span className="text-[13px] font-extrabold text-[var(--brand-pink)]">
              {j.salary}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
