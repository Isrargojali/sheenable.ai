import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Heart, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import CountUp from "@/components/CountUp";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";
import useSEO from "@/hooks/useSEO";

import GlassNav        from "@/components/landing/GlassNav";
import JobTicker       from "@/components/landing/JobTicker";
import HowItWorksTabs  from "@/components/landing/HowItWorksTabs";
import FeaturedJobs    from "@/components/landing/FeaturedJobs";
import Testimonials    from "@/components/landing/Testimonials";
import EmployerCTA     from "@/components/landing/EmployerCTA";
import Footer          from "@/components/landing/Footer";

const STATS = [
  { v: 12400, suffix: "+", label: "Careers Launched", desc: "Verified placements in engineering, product, finance, and design roles across Pakistan." },
  { v: 98,    suffix: "%", label: "Employer Retention Rate", desc: "Employers who hire through SheEnableAI return for their next role. The match quality speaks." },
  { v: 500,   suffix: "+", label: "Verified Inclusive Employers", desc: "Every employer is vetted against our DEI standards before publishing a single listing." },
  { v: 47,    suffix: "",  label: "Industry Sectors",       desc: "From fintech and healthtech to government and enterprise — we cover Pakistan's full professional landscape." },
];

const SUGGESTIONS = [
  "Remote UX Lead — Karachi",
  "Senior Backend Engineer — Lahore",
  "Product Manager — Islamabad",
  "Finance Lead — Hybrid"
];

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useReveal<HTMLDivElement>();

  useSEO({
    title: "Jobs for Women in Pakistan | SheEnableAI — AI-Powered Hiring",
    description: "Discover verified jobs for women in Pakistan. SheEnableAI uses AI matching to connect female professionals with inclusive employers. Join 12,400+ women. It's free.",
    schema: {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "SheEnableAI",
      "url": "https://sheenableai.com",
      "logo": "https://sheenableai.com/logo.png",
      "description": "Pakistan's AI-powered hiring platform connecting female professionals with verified inclusive employers.",
      "areaServed": "PK",
      "foundingDate": "2024",
      "sameAs": [
        "https://www.linkedin.com/company/sheenableai",
        "https://twitter.com/sheenableai"
      ]
    }
  });

  const [prompt, setPrompt] = useState("");
  const [aiStatus, setAiStatus] = useState<string | null>(null);
  const [loadingText, setLoadingText] = useState("");

  const handleMatchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;

    setAiStatus("analyzing");
    setLoadingText("Analyzing professional competencies...");

    setTimeout(() => {
      setAiStatus("matching");
      setLoadingText("Mapping secure, verified workspaces...");

      setTimeout(() => {
        setAiStatus("finalizing");
        setLoadingText("Success! Opening matching channels...");

        setTimeout(() => {
          setAiStatus("success");
          navigate(`/auth/signup?prompt=${encodeURIComponent(prompt)}`);
        }, 1000);
      }, 1200);
    }, 1200);
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        delay: 0.5 + i * 0.2,
        ease: [0.25, 0.4, 0.25, 1],
      },
    }),
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-background">
      <GlassNav />

      {/*  HERO */}
      <section
        className="relative overflow-hidden text-white flex flex-col items-center justify-center bg-[var(--ink-900)]"
        style={{ 
          minHeight: "min(100vh, 880px)",
          backgroundImage: "radial-gradient(ellipse at 50% 30%, rgba(230,0,126,.10), transparent 60%)"
        }}
      >
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-5 lg:px-8 pt-16 lg:pt-24 pb-16 lg:pb-24 flex flex-col items-center text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="text-[13px] uppercase tracking-[0.12em] text-[var(--ink-500)] mb-3 font-sans font-medium"
          >
            Pakistan's #1 Platform for Women in Tech
          </motion.div>
 
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="font-sans font-semibold text-[40px] lg:text-[64px] leading-[1.1] tracking-tight max-w-5xl mb-4 text-white">
              Pakistan's #1 Job Platform
              <br />
              for <span className="font-sans font-bold text-[var(--brand-pink)]">Women in Tech</span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-[13px] text-[var(--ink-500)] leading-[1.6] max-w-2xl mb-12">
              Verified, high-impact careers matched by AI.<br className="hidden md:block" />
              Built for Pakistani women. Free to join.
            </p>
          </motion.div>

          {/* Futuristic 2026 Interactive AI Matcher Panel */}
          <motion.div
            custom={3}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-2xl mx-auto mb-8 relative z-20"
          >
            {aiStatus ? (
              <div className="bg-[rgba(255,255,255,0.05)] border border-white/15 rounded-xl p-8 shadow-card flex flex-col items-center justify-center min-h-[144px] animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white mb-4 animate-spin">
                  <Sparkles size={20} />
                </div>
                <div className="text-sm font-bold text-white mb-1.5 transition-all duration-300 animate-pulse">
                  {loadingText}
                </div>
                <div className="text-[10px] text-white/45 uppercase tracking-widest">
                  Secure AI Engine v2.6.0
                </div>
              </div>
            ) : (
              <form onSubmit={handleMatchSubmit} className="space-y-4">
                <div className="bg-[rgba(255,255,255,0.05)] border border-white/15 p-2 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-card focus-within:border-[var(--brand-pink)]/50 focus-within:ring-2 focus-within:ring-[var(--brand-pink)]/10 transition-all duration-300">
                  <div className="flex-1 flex items-center gap-3 pl-4 pr-2 py-2 sm:py-0">
                    <Sparkles size={16} className="text-[var(--brand-pink)] animate-pulse flex-shrink-0" />
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Try: 'Senior React developer, remote Karachi' or 'Finance lead Lahore'"
                      className="bg-transparent text-[13px] text-white placeholder:text-white/50 focus:outline-none w-full font-medium"
                      aria-label="Futuristic AI job matching input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="h-11 px-6 rounded-xl bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 disabled:opacity-40 transition-all text-[15px] font-semibold press flex items-center justify-center gap-1.5"
                  >
                    <span>Find My Match — It's Free</span>
                    <ArrowRight size={13} className="arrow" />
                  </button>
                </div>
                
                {/* Suggestions Row */}
                <div className="flex flex-wrap justify-center gap-2 mt-3.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPrompt(s.split(" — ")[0])}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 hover:border-[var(--brand-pink)]/40 hover:bg-white/10 rounded-full text-[11px] text-[var(--ink-500)] hover:text-white transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </form>
            )}

            {/* Secondary outline CTA & demoted B2B link directly under search/suggestions */}
            <div className="flex flex-col items-center gap-4 mt-8 relative z-30">
              <Link
                to="/find-jobs-for-women-pakistan"
                className="inline-flex items-center px-6 h-11 rounded-xl border border-white/24 text-white bg-transparent hover:bg-white/5 transition-all text-[15px] font-semibold press"
              >
                See all verified openings
              </Link>
              <Link
                to="/hire-female-talent-pakistan"
                className="text-[13px] text-[var(--ink-500)] hover:text-white hover:underline flex items-center gap-1 transition-colors"
              >
                <span>I'm an Employer</span> <ArrowRight size={13} className="arrow" />
              </Link>
            </div>
          </motion.div>
        </div>

      </section>

      {/* Job Ticker below the fold */}
      <div className="bg-[var(--ink-900)] py-4">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <JobTicker />
        </div>
      </div>

      {/*  STATS */}
      <section className="relative overflow-hidden bg-[var(--surface)]">
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 py-16 lg:py-24 z-10">
          <div className="text-center mb-12">
            <div className="inline-block px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--surface)] text-[var(--ink-700)] mb-3 font-sans border border-[var(--ink-300)]">
              Trusted by Pakistan's most ambitious women in tech
            </div>
            <h2 className="font-sans font-semibold text-[32px] text-[var(--ink-900)] tracking-tight max-w-2xl mx-auto leading-tight">
              Real numbers. <span className="font-sans font-bold text-[var(--brand-pink)]">No inflated claims.</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 bg-[var(--surface)] border border-[var(--ink-300)] rounded-xl shadow-card overflow-hidden">
            {STATS.map((s, i) => {
              const borderClasses = cn(
                "border-[var(--ink-300)]",
                i % 2 === 0 ? "border-r" : "",
                i < 2 ? "border-b" : "",
                "md:border-b-0",
                i < 3 ? "md:border-r" : "md:border-r-0"
              );
              return (
                <div
                  key={s.label}
                  className={cn(
                    "p-6 md:py-6 md:px-8 flex flex-col justify-center animate-fade-in",
                    borderClasses
                  )}
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div>
                    <div className="text-[32px] font-black text-[var(--brand-pink)] leading-none font-sans whitespace-nowrap">
                      <CountUp end={s.v} suffix={s.suffix} duration={1200} />
                    </div>
                    <div className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)] mt-2 font-sans">
                      {s.label}
                    </div>
                  </div>
                  <p className="text-[13px] text-[var(--ink-500)] leading-relaxed mt-2 truncate max-w-full" title={s.desc}>
                    {s.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/*  HOW IT WORKS  */}
      <HowItWorksTabs />

      {/*  FEATURED JOBS ── */}
      <FeaturedJobs />

      {/*  VALUE STRIP — between jobs and stories  */}
      <section className="bg-[var(--surface)]">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16 grid sm:grid-cols-3 gap-6 lg:gap-8">
          {[
            { icon: BadgeCheck,  title: "Verified employers only", desc: "Every company is vetted for inclusive policy." },
            { icon: Sparkles,    title: "AI-matched daily",         desc: "96% match accuracy on every recommendation." },
            { icon: ShieldCheck, title: "Bank-grade security",      desc: "Your data is encrypted and never sold." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--ink-100)] text-[var(--brand-pink)] flex items-center justify-center flex-shrink-0">
                <Icon size={16} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-[var(--ink-900)]">{title}</div>
                <div className="text-[11px] text-[var(--ink-500)] mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/*  TESTIMONIALS  */}
      <Testimonials />

      {/*  EMPLOYER CTA BAND ─ */}
      <EmployerCTA />

      {/*  FOOTER  */}
      <Footer />
    </div>
  );
}
