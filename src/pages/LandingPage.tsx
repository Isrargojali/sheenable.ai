import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Heart, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { ElegantShape } from "@/components/ui/shape-landing-hero";
import CountUp from "@/components/CountUp";
import { useReveal } from "@/hooks/useReveal";


import GlassNav        from "@/components/landing/GlassNav";
import JobTicker       from "@/components/landing/JobTicker";
import HowItWorksTabs  from "@/components/landing/HowItWorksTabs";
import FeaturedJobs    from "@/components/landing/FeaturedJobs";
import Testimonials    from "@/components/landing/Testimonials";
import EmployerCTA     from "@/components/landing/EmployerCTA";
import Footer          from "@/components/landing/Footer";

const PARTNER_LOGOS = [
  "Techflow", "NorthStar", "Atlas Bank", "Helix Health", "Cobalt Labs",
  "Lumen", "Orbit", "Vertex", "Pioneer", "Beacon",
];

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

  const SUGGESTIONS = [
    "Remote UX Lead",
    "Staff Backend Engineer",
    "Product VP in Karachi",
    "Hybrid HR Business Partner"
  ];

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
        className="relative overflow-hidden text-white flex flex-col items-center justify-center bg-[#0A0712]"
        style={{ background: "var(--grad-hero)", minHeight: "min(100vh, 880px)" }}
      >
        {/* Radial Mesh Gradient System with drifting color orbs */}
        <div 
          className="absolute inset-0 overflow-hidden pointer-events-none z-0"
          style={{ transform: "translate3d(0, 0, 0)", backfaceVisibility: "hidden", perspective: 1000 }}
        >
          {/* Fuchsia orb at top-right */}
          <div 
            className="absolute -top-[10%] -right-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full blur-[110px] opacity-[0.25] animate-drift-fuchsia"
            style={{
              background: "radial-gradient(circle, #d946ef 0%, rgba(217, 70, 239, 0) 70%)"
            }}
          />
          {/* Indigo orb at bottom-left */}
          <div 
            className="absolute -bottom-[10%] -left-[10%] w-[55vw] h-[55vw] max-w-[700px] max-h-[700px] rounded-full blur-[110px] opacity-[0.20] animate-drift-indigo"
            style={{
              background: "radial-gradient(circle, #6366f1 0%, rgba(99, 102, 241, 0) 70%)"
            }}
          />
          {/* Soft violet center-left orb for depth */}
          <div 
            className="absolute top-[30%] left-[15%] w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] rounded-full blur-[90px] opacity-[0.15] animate-drift-center"
            style={{
              background: "radial-gradient(circle, #a855f7 0%, rgba(168, 85, 247, 0) 70%)"
            }}
          />
        </div>

        {/* Float shapes behind the content */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <ElegantShape
            delay={0.3}
            width={600}
            height={140}
            rotate={12}
            gradient="from-mauve-500/[0.15]"
            className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
          />

          <ElegantShape
            delay={0.5}
            width={500}
            height={120}
            rotate={-15}
            gradient="from-mint-400/[0.15]"
            className="right-[-5%] md:right-[0%] top-[60%] md:top-[65%]"
          />

          <ElegantShape
            delay={0.4}
            width={300}
            height={80}
            rotate={-8}
            gradient="from-mauve-600/[0.15]"
            className="left-[5%] md:left-[10%] bottom-[15%] md:bottom-[20%]"
          />

          <ElegantShape
            delay={0.6}
            width={200}
            height={60}
            rotate={20}
            gradient="from-mint-300/[0.12]"
            className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
          />

          <ElegantShape
            delay={0.7}
            width={150}
            height={40}
            rotate={-25}
            gradient="from-mauve-400/[0.12]"
            className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
          />
        </div>

        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-5 lg:px-8 pt-20 lg:pt-28 pb-12 lg:pb-16 flex flex-col items-center text-center">
          <motion.div
            custom={0}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-7 bg-white/8 border border-white/15"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse-ring" />
            Pakistan's Premier Ecosystem for Female Leaders & Professionals
          </motion.div>

          <motion.div
            custom={1}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <h1 className="font-serif text-[40px] xs:text-[52px] md:text-[68px] lg:text-[88px] leading-[0.98] tracking-[-0.025em] max-w-5xl mb-6">
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                Where Ambition
              </span>
              <br />
              Meets <span className="italic text-shimmer">Opportunity</span>
            </h1>
          </motion.div>

          <motion.div
            custom={2}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
          >
            <p className="text-[14px] md:text-base lg:text-lg text-white/65 leading-relaxed max-w-2xl mb-9">
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
              <div className="glass-dark border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center justify-center min-h-[144px] animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white mb-4 animate-spin">
                  <Sparkles size={20} />
                </div>
                <div className="text-sm font-bold text-white mb-1.5 transition-all duration-300 animate-pulse">
                  {loadingText}
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">
                  Secure AI Engine v2.6.0
                </div>
              </div>
            ) : (
              <form onSubmit={handleMatchSubmit} className="space-y-4">
                <div className="glass-dark border border-white/10 p-2 rounded-2xl sm:rounded-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shadow-2xl focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-300">
                  <div className="flex-1 flex items-center gap-3 pl-4 pr-2 py-2 sm:py-0">
                    <Sparkles size={16} className="text-primary animate-pulse flex-shrink-0" />
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder='Ask AI: "Senior hybrid Fintech roles in Lahore" or "Remote Staff UX Lead"...'
                      className="bg-transparent text-[13px] text-white placeholder:text-white/40 focus:outline-none w-full font-medium"
                      aria-label="Futuristic AI job matching input"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="h-12 px-6 rounded-xl sm:rounded-full bg-white text-foreground hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-foreground transition-all duration-300 text-[12px] font-bold press flex items-center justify-center gap-1.5"
                  >
                    <span>Match Me</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {/* Pre-fill suggestion chips */}
                <div className="flex flex-wrap justify-center items-center gap-2 text-[10px]">
                  <span className="text-white/40 font-medium">Or try suggested:</span>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setPrompt(s)}
                      className="px-3 py-1.5 rounded-full border border-white/8 bg-white/4 text-white/70 hover:bg-white/10 hover:text-white hover:border-white/20 transition-all press font-medium"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </form>
            )}
          </motion.div>

          <motion.div
            custom={4}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col sm:flex-row gap-3 mb-10 w-full sm:w-auto relative z-20"
          >
            <Link
              to="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-7 h-12 rounded-full text-[13px] font-bold bg-white/8 text-white border border-white/20 backdrop-blur-md hover:bg-white/15 press"
            >
              Explore Job Board <ArrowRight size={14} />
            </Link>
            <Link
              to="/auth/signup?role=EMPLOYER"
              className="inline-flex items-center justify-center gap-2 px-7 h-12 rounded-full text-[13px] font-bold bg-primary text-white hover:bg-mauve-600 hover:-translate-y-0.5 hover:shadow-elev3 press"
            >
              Enterprise Integration <ArrowRight size={14} />
            </Link>
          </motion.div>

          {/* Job ticker */}
          <motion.div
            custom={5}
            variants={fadeUpVariants}
            initial="hidden"
            animate="visible"
            className="w-full max-w-[1100px] relative z-20"
          >
            <JobTicker />
          </motion.div>
        </div>

        {/* Trust bar */}
        <div className="relative w-full border-t border-white/8 py-6 z-20 mt-auto bg-[#0A0712]/40 backdrop-blur-[1px]">
          <div className="max-w-[1280px] mx-auto px-5 lg:px-8">
            <div className="text-center text-[10px] uppercase tracking-[2px] text-white/40 mb-4">
              Trusted by inclusive companies
            </div>
            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
              {PARTNER_LOGOS.map(p => (
                <div key={p} className="text-white/45 font-serif text-base tracking-wide">
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/*  STATS */}
      <section className="bg-secondary/40 border-b border-border bg-arcs">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16 lg:py-20">
          <div className="text-center mb-10">
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground mb-3">
              Quantifying Our Impact
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight">
              A community defining <span className="italic text-primary">the future of equitable work</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="bg-card border border-border rounded-2xl p-5 lg:p-6 lift animate-fade-in"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="font-serif text-4xl lg:text-5xl text-primary leading-none tracking-tight mb-3">
                  <CountUp end={s.v} suffix={s.suffix} />
                </div>
                <div className="text-[13px] font-bold text-foreground">{s.label}</div>
                <div className="text-[11px] text-muted-foreground mt-1">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  HOW IT WORKS  */}
      <HowItWorksTabs />

      {/*  FEATURED JOBS ── */}
      <FeaturedJobs />

      {/*  VALUE STRIP — between jobs and stories  */}
      <section className="border-y border-border bg-card">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-10 grid sm:grid-cols-3 gap-6">
          {[
            { icon: BadgeCheck,  title: "Verified employers only", desc: "Every company is vetted for inclusive policy." },
            { icon: Sparkles,    title: "AI-matched daily",         desc: "96% match accuracy on every recommendation." },
            { icon: ShieldCheck, title: "Bank-grade security",      desc: "Your data is encrypted and never sold." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-mauve-50 text-primary flex items-center justify-center flex-shrink-0">
                <Icon size={16} />
              </div>
              <div>
                <div className="text-[13px] font-bold text-foreground">{title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{desc}</div>
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
