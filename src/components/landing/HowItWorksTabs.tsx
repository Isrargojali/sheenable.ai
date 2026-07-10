import { useState } from "react";
import { LucideIcon, Search, Sparkles, Send, PartyPopper, FileEdit, Users, ClipboardList, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "candidate" | "employer";

const STEPS: Record<TabKey, { icon: LucideIcon; title: string; desc: string; accent: string }[]> = {
  candidate: [
    { icon: FileEdit, title: "Build your verified profile", desc: "Tell us your skills, experience, and what you're looking for. Our AI builds your match score immediately — no waiting, no guesswork.", accent: "border-l-primary/40" },
    { icon: Sparkles, title: "Get AI-precision matches", desc: "Our matching engine scores every open role against your profile. You see salary, employer DEI rating, and fit percentage upfront.", accent: "border-l-primary/60" },
    { icon: Send, title: "Apply with one tap", desc: "No cover letters required. One-tap applications go directly to the employer's ATS with your AI-optimised profile attached.", accent: "border-l-primary" },
    { icon: PartyPopper, title: "Onboard safely", desc: "We stay in the loop. Interview scheduling, offer negotiation support, and a 90-day placement guarantee included.", accent: "border-l-primary/80" },
  ],
  employer: [
    { icon: ClipboardList, title: "Post your role spec", desc: "Craft high-conversion listings with our intelligent, industry-specific DEI template builder.", accent: "border-l-primary/40" },
    { icon: Search, title: "Source vetted talent", desc: "Filter through an exclusive network of verified female tech leaders, researchers, and builders in Pakistan.", accent: "border-l-primary/60" },
    { icon: Users, title: "Direct ATS pipeline", desc: "Manage candidates through a fluid, collaborative visual pipeline built for modern HR workflows.", accent: "border-l-primary" },
    { icon: Handshake, title: "Close exceptional hires", desc: "Converse, schedule, and extend offers in a unified, secure, and professional communication hub.", accent: "border-l-primary/80" },
  ],
};

export default function HowItWorksTabs() {
  const [tab, setTab] = useState<TabKey>("candidate");
  const tabs: { key: TabKey; label: string }[] = [
    { key: "candidate", label: "For Candidates" },
    { key: "employer", label: "For Employers" },
  ];

  return (
    <section id="community" className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16 lg:py-24 bg-[var(--surface)]">
      <div className="text-center mb-12">
        <div className="inline-block px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--ink-100)] text-[var(--ink-700)] mb-3 font-sans border border-[var(--ink-300)]">
          The SheEnableAI pathway
        </div>
        <h2 className="font-sans font-semibold text-[28px] lg:text-[40px] text-[var(--ink-900)] tracking-tight">
          From profile to offer — <span className="font-sans font-bold text-[var(--brand-pink)]">faster than any other platform</span>
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
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-y-8">
        {STEPS[tab].map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={`${tab}-${i}`}
              className="bg-[var(--surface)] border border-[var(--ink-300)] rounded-xl p-6 shadow-card animate-fade-in"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--ink-100)] text-[var(--ink-900)] flex items-center justify-center mb-4">
                <Icon size={20} />
              </div>
              <h3 className="text-[18px] font-semibold text-[var(--ink-900)] mb-1.5">{s.title}</h3>
              <p className="text-[13px] text-[var(--ink-500)] leading-[1.6]">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
