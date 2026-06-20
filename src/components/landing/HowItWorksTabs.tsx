// src/components/landing/HowItWorksTabs.tsx
// Two-tab "I'm looking for a job" / "I'm hiring" with smooth underline animation.
import { useState } from "react";
import { LucideIcon, Search, Sparkles, Send, PartyPopper, FileEdit, Users, ClipboardList, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "candidate" | "employer";

const STEPS: Record<TabKey, { icon: LucideIcon; title: string; desc: string; accent: string }[]> = {
  candidate: [
    { icon: FileEdit, title: "Design Your Profile", desc: "Build an exquisite, AI-optimized digital footprint that highlights your unique expertise.", accent: "border-l-primary/40" },
    { icon: Sparkles, title: "High-Precision Matching", desc: "Our AI-engine analyzes verified openings to deliver matches aligned with your career goals and worth.", accent: "border-l-primary/60" },
    { icon: Send, title: "Frictionless Application", desc: "Deploy a tailored, ATS-optimized dossier with single-click precision directly to hiring decision-makers.", accent: "border-l-primary" },
    { icon: PartyPopper, title: "Secure Onboarding", desc: "Communicate directly through our encrypted portal, negotiate with confidence, and step into your new role.", accent: "border-l-primary/80" },
  ],
  employer: [
    { icon: ClipboardList, title: "Curate Your Opportunity", desc: "Craft high-conversion listings with our intelligent, industry-specific template builder.", accent: "border-l-primary/40" },
    { icon: Search, title: "Source Vetted Talent", desc: "Filter through an exclusive network of verified female leaders, researchers, and builders.", accent: "border-l-primary/60" },
    { icon: Users, title: "Direct ATS Pipeline", desc: "Manage candidates through a fluid, collaborative visual pipeline built for modern HR workflows.", accent: "border-l-primary" },
    { icon: Handshake, title: "Close Exceptional Hires", desc: "Converse, schedule, and extend offers in a unified, safe, and professional communication hub.", accent: "border-l-primary/80" },
  ],
};

export default function HowItWorksTabs() {
  const [tab, setTab] = useState<TabKey>("candidate");
  const tabs: { key: TabKey; label: string }[] = [
    { key: "candidate", label: "For Talented Professionals" },
    { key: "employer", label: "For Progressive Enterprises" },
  ];

  return (
    <section id="community" className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16 lg:py-24 bg-[var(--surface)]">
      <div className="text-center mb-12">
        <div className="inline-block px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--ink-100)] text-[var(--ink-700)] mb-3 font-sans border border-[var(--ink-300)]">
          The SheEnable Pathway
        </div>
        <h2 className="font-sans font-semibold text-3xl md:text-5xl text-[var(--ink-900)] tracking-tight">
          A simple path to your <span className="font-sans font-bold text-[var(--brand-pink)]">next chapter</span>
        </h2>
      </div>

      {/* Tab switcher */}
      <div className="relative flex justify-center mb-12">
        <div className="inline-flex items-center bg-[var(--surface)] border border-[var(--ink-300)] rounded-xl p-1 relative">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative z-10 px-8 h-10 rounded-xl text-[12px] font-bold press transition-colors",
                tab === t.key ? "text-white" : "text-[var(--ink-700)] hover:text-[var(--ink-900)]"
              )}
            >
              {t.label}
            </button>
          ))}
          {/* sliding pill */}
          <div
            className="absolute top-1 bottom-1 rounded-xl bg-[var(--ink-900)] shadow-card transition-all duration-300"
            style={{
              width: "calc(50% - 0.25rem)",
              left: tab === "candidate" ? "0.25rem" : "calc(50% + 0.0rem)",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
        {STEPS[tab].map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={`${tab}-${i}`}
              className="bg-[var(--surface)] border border-[var(--ink-300)] rounded-xl p-6 lg:p-8 shadow-card animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-[var(--ink-100)] text-[var(--brand-pink)] flex items-center justify-center font-sans text-base font-bold">
                  {i + 1}
                </div>
                <Icon size={18} className="text-[var(--ink-700)]" />
              </div>
              <h3 className="text-[14px] font-bold text-[var(--ink-900)] mb-1.5">{s.title}</h3>
              <p className="text-[12px] text-[var(--ink-500)] leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
