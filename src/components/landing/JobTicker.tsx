import { Briefcase } from "lucide-react";

const TICKER_ITEMS = [
  "Maham S. — Hired as Full Stack Developer at TechFlow · PKR 150K/mo",
  "Aisha K. — Product Manager role at Lumen · 2x salary increase",
  "Sara A. — Remote UX Lead at FinTech startup · Hired in 9 days",
];

export default function JobTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <div 
      className="relative overflow-hidden py-3 w-full"
      style={{ 
        maskImage: "linear-gradient(90deg, transparent, black 40px, black calc(100% - 40px), transparent)",
        WebkitMaskImage: "linear-gradient(90deg, transparent, black 40px, black calc(100% - 40px), transparent)"
      }}
    >
      <div className="flex gap-4 w-max animate-ticker">
        {items.map((text, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 pl-4 pr-5 py-2.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm whitespace-nowrap"
          >
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/90 flex-shrink-0">
              <Briefcase size={14} />
            </span>
            <span className="text-sm text-white/95 font-medium">
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
