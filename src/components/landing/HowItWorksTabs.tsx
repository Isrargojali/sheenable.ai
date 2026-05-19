// src/components/landing/HowItWorksTabs.tsx
// Two-tab "I'm looking for a job" / "I'm hiring" with smooth underline animation.
import { useState } from "react";
import { LucideIcon, Search, Sparkles, Send, PartyPopper, FileEdit, Users, ClipboardList, Handshake } from "lucide-react";
import { cn } from "@/lib/utils";

type TabKey = "candidate" | "employer";

const STEPS: Record<TabKey, { icon: LucideIcon; title: string; desc: string; accent: string }[]> = {
  candidate: [
    { icon: FileEdit, title: "Build your profile", desc: "Sign up free, add skills and experience. Our AI scores completeness in real time.", accent: "border-l-mauve-400" },
    { icon: Sparkles, title: "Get matched daily", desc: "Receive curated job matches based on skills, location and salary expectations.", accent: "border-l-mint-400" },
    { icon: Send, title: "Apply with one click", desc: "ATS-ready CV, tailored cover letter — submit a polished application in seconds.", accent: "border-l-amber-400" },
    { icon: PartyPopper, title: "Land the offer", desc: "Track every application, message HR directly, and accept your next role.", accent: "border-l-rose-400" },
  ],
  employer: [
    { icon: ClipboardList, title: "Post your role", desc: "Use our 5-step wizard. Pre-filled templates for 47 industries.", accent: "border-l-mauve-400" },
    { icon: Search, title: "Discover talent", desc: "AI search filters 50,000+ verified women candidates by skill, role and availability.", accent: "border-l-mint-400" },
    { icon: Users, title: "Build a shortlist", desc: "Drag-and-drop pipeline keeps your team aligned through every hiring stage.", accent: "border-l-amber-400" },
    { icon: Handshake, title: "Make the hire", desc: "Message, schedule interviews, send offers — all without leaving the platform.", accent: "border-l-rose-400" },
  ],
};

export default function HowItWorksTabs() {
  const [tab, setTab] = useState<TabKey>("candidate");
  const tabs: { key: TabKey; label: string }[] = [
    { key: "candidate", label: "I'm looking for a job" },
    { key: "employer", label: "I'm hiring" },
  ];

  return (
    <section id="community" className="max-w-[1280px] mx-auto px-5 lg:px-8 py-20 lg:py-28">
      <div className="text-center mb-10">
        <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground mb-3">
          How it works
        </div>
        <h2 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight">
          A simple path to your <span className="italic text-primary">next chapter</span>
        </h2>
      </div>

      {/* Tab switcher */}
      <div className="relative flex justify-center mb-10">
        <div className="inline-flex items-center bg-card border border-border rounded-full p-1 relative">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "relative z-10 px-8 h-10 rounded-full text-[12px] font-bold press transition-colors",
                tab === t.key ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
          {/* sliding pill */}
          <div
            className="absolute top-1 bottom-1 rounded-full bg-primary shadow-elev1 transition-all duration-300"
            style={{
              width: "calc(50% - 0.25rem)",
              left: tab === "candidate" ? "0.25rem" : "calc(50% + 0.0rem)",
            }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STEPS[tab].map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={`${tab}-${i}`}
              className={cn(
                "bg-card border border-border border-l-[3px] rounded-2xl p-5 lift animate-fade-in",
                s.accent,
              )}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-mauve-50 text-primary flex items-center justify-center font-serif text-base font-bold">
                  {i + 1}
                </div>
                <Icon size={18} className="text-primary/70" />
              </div>
              <h3 className="text-[14px] font-bold text-foreground mb-1.5">{s.title}</h3>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
