import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Heart, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import CountUp from "@/components/CountUp";
import { useReveal } from "@/hooks/useReveal";
import { cn } from "@/lib/utils";


import GlassNav        from "@/components/landing/GlassNav";
import JobTicker       from "@/components/landing/JobTicker";
import HowItWorksTabs  from "@/components/landing/HowItWorksTabs";
import FeaturedJobs    from "@/components/landing/FeaturedJobs";
import Testimonials    from "@/components/landing/Testimonials";
import EmployerCTA     from "@/components/landing/EmployerCTA";
import Footer          from "@/components/landing/Footer";

const PARTNERS = [
  { name: "Techflow", element: <div className="flex items-center gap-1.5 font-sans font-black tracking-tight text-[18px] uppercase"><span className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center text-[10px] text-white font-sans font-bold">TF</span>tech<span className="text-white/60">flow</span></div> },
  { name: "NorthStar", element: <div className="flex items-center gap-1 font-serif italic font-extrabold text-[20px] tracking-tight"><span>✦</span> NorthStar</div> },
  { name: "Atlas Bank", element: <div className="flex items-center gap-1.5 font-sans font-extrabold tracking-[0.15em] text-[16px] uppercase"><span className="w-1 h-5 bg-white/40 rounded-full" />ATLAS<span className="font-light text-white/60">BANK</span></div> },
  { name: "Helix Health", element: <div className="flex items-center gap-1 font-sans font-bold tracking-tighter text-[19px] lowercase"><span className="text-white/80 font-black">helix</span><span className="text-[12px] py-0.5 px-1 bg-white/10 rounded-sm font-semibold tracking-normal uppercase">health</span></div> },
  { name: "Cobalt Labs", element: <div className="flex items-center gap-1 font-mono font-bold tracking-tight text-[17px] uppercase">[COBALT<span className="text-white/60 font-light">labs</span>]</div> },
  { name: "Lumen", element: <div className="flex items-center gap-1 font-sans font-black tracking-[0.2em] text-[18px] uppercase">◇ LUMEN</div> },
  { name: "Orbit", element: <div className="flex items-center gap-1.5 font-sans font-medium tracking-tight text-[19px]"><span className="w-4 h-4 rounded-full border-2 border-white/40 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-white" /></span>orbit</div> },
  { name: "Vertex", element: <div className="flex items-center gap-1.5 font-serif font-black tracking-tight text-[20px] uppercase">▲ Vertex</div> },
  { name: "Pioneer", element: <div className="flex items-center gap-1 font-sans font-black tracking-tighter text-[20px] uppercase italic">PIO<span className="text-white/50">NEER</span></div> },
  { name: "Beacon", element: <div className="flex items-center gap-1.5 font-sans font-extrabold tracking-widest text-[16px] uppercase"><span>⚲</span> BEACON</div> }
];

const MARQUEE_PARTNERS = [...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS];

const STATS = [
  { v: 12400, suffix: "+", label: "Careers Accelerated",      desc: "Exceptional women placed in trajectory-defining roles" },
  { v: 98,    suffix: "%", label: "Retention Rate",           desc: "Securing thriving long-term matches for both parties" },
  { v: 500,   suffix: "+", label: "Verified Partners",        desc: "Top-tier enterprises committed to equitable workplaces" },
  { v: 47,    suffix: "",  label: "Sector Specialties",       desc: "From pioneering FinTech to advanced research" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useReveal<HTMLDivElement>();

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

  // Set page title for SEO
  useEffect(() => {
    document.title = "SheEnableAI — Where Ambitious Women Find Careers That Match Their Worth";
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-x-hidden">
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
            Pakistan's Premier Ecosystem for Female Leaders & Professionals
          </motion.div>
 
          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="font-sans font-semibold text-[40px] lg:text-[64px] leading-[1.1] tracking-tight max-w-5xl mb-4 text-white">
              Where Ambition
              <br />
              Meets <span className="font-sans font-bold text-[var(--brand-pink)]">Opportunity</span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-[13px] text-[var(--ink-500)] leading-[1.6] max-w-2xl mb-12">
              Empowering Pakistan’s female professionals with hand-vetted, high-impact careers.<br className="hidden md:block" />
              Powered by AI-precision matching, built for safe hiring.
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
                      placeholder='Ask AI: "Senior hybrid Fintech roles in Lahore" or "Remote Staff UX Lead"...'
                      className="bg-transparent text-[13px] text-white placeholder:text-white/50 focus:outline-none w-full font-medium"
                      aria-label="Futuristic AI job matching input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="h-11 px-6 rounded-xl bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 disabled:opacity-40 transition-all text-[15px] font-semibold press flex items-center justify-center gap-1.5"
                  >
                    <span>Match Me</span>
                    <ArrowRight size={13} className="arrow" />
                  </button>
                </div>

              </form>
            )}

            {/* Secondary outline CTA & demoted B2B link directly under search/suggestions */}
            <div className="flex flex-col items-center gap-4 mt-8 relative z-30">
              <Link
                to="/auth/signup"
                className="inline-flex items-center px-6 h-11 rounded-xl border border-white/24 text-white bg-transparent hover:bg-white/5 transition-all text-[15px] font-semibold press"
              >
                Create Job Search
              </Link>
              <Link
                to="/auth/signup?role=EMPLOYER"
                className="text-[13px] text-[var(--ink-500)] hover:text-white hover:underline flex items-center gap-1 transition-colors"
              >
                <span>Enterprise Integration</span> <ArrowRight size={13} className="arrow" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Trust bar */}
        <div className="relative w-full border-t border-white/8 py-8 z-20 mt-auto bg-[var(--ink-900)]">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
            <div className="text-center text-[13px] font-black uppercase tracking-[0.25em] text-white/50 mb-4 font-sans">
              Backed by leading companies
            </div>
            <div 
              className="relative overflow-hidden h-24 flex items-center w-full"
              style={{ maskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 15%, black 85%, transparent)" }}
            >
              <div className="flex gap-20 w-max animate-ticker">
                {MARQUEE_PARTNERS.map((p, idx) => (
                  <div 
                    key={idx} 
                    className="h-9 flex items-center text-white/35 hover:text-white/85 transition-all duration-300 flex-shrink-0 cursor-default select-none"
                  >
                    {p.element}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Job Ticker below the fold */}
      <div className="bg-[var(--ink-900)] py-4 border-b border-[var(--ink-300)]">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
          <JobTicker />
        </div>
      </div>

      {/*  STATS */}
      <section className="relative border-b border-[var(--ink-300)] overflow-hidden bg-[var(--surface)]">
        <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 py-16 lg:py-24 z-10">
          <div className="text-center mb-12">
            <div className="inline-block px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--surface)] text-[var(--ink-700)] mb-3 font-sans border border-[var(--ink-300)]">
              Quantifying Our Impact
            </div>
            <h2 className="font-sans font-semibold text-[32px] text-[var(--ink-900)] tracking-tight max-w-2xl mx-auto leading-tight">
              A community defining <span className="font-sans font-bold text-[var(--brand-pink)]">the future of equitable work</span>
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
                    <div className="text-[40px] font-bold text-[var(--brand-pink)] leading-none font-sans whitespace-nowrap">
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
      <section className="border-b border-[var(--ink-300)] bg-[var(--surface)]">
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
