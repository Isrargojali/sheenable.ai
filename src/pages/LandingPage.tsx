// src/pages/LandingPage.tsx
// HerCareer — premium women-only hiring platform landing page.
// Built mobile-first with Playfair Display + Plus Jakarta Sans, mauve/mint palette.
import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Heart, BadgeCheck } from "lucide-react";
import CountUp from "@/components/CountUp";
import { useReveal } from "@/hooks/useReveal";
import { demoLogin } from "@/lib/demoLogin";

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
  { v: 12400, suffix: "+", label: "Women Hired",          desc: "Across 47 industries since 2022" },
  { v: 98,    suffix: "%", label: "Employer Satisfaction",desc: "Based on post-hire NPS surveys" },
  { v: 500,   suffix: "+", label: "Partner Companies",    desc: "Vetted for inclusive hiring" },
  { v: 47,    suffix: "",  label: "Industries Covered",   desc: "From fintech to healthcare" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const containerRef = useReveal<HTMLDivElement>();

  // Set page title for SEO
  useEffect(() => {
    document.title = "HerCareer — Where Ambitious Women Find Careers That Match Their Worth";
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-background overflow-x-hidden">
      <GlassNav />

      {/* ─── HERO ─────────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: "var(--grad-hero)", minHeight: "min(100vh, 760px)" }}
      >
        {/* Soft geometric SVG background — no photos */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.18]" aria-hidden="true">
          <defs>
            <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
        {/* Glow blobs */}
        <div className="absolute -top-32 -right-20 w-[600px] h-[600px] rounded-full pointer-events-none animate-glow-pulse"
             style={{ background: "radial-gradient(circle,rgba(200,82,140,.30),transparent 65%)", filter: "blur(80px)" }} />
        <div className="absolute -bottom-32 -left-20 w-[500px] h-[500px] rounded-full pointer-events-none animate-glow-pulse"
             style={{ background: "radial-gradient(circle,rgba(61,170,125,.20),transparent 65%)", filter: "blur(90px)", animationDelay: "1.5s" }} />

        <div className="relative max-w-[1280px] mx-auto px-5 lg:px-8 pt-12 lg:pt-20 pb-12 lg:pb-16 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-7 bg-white/8 border border-white/15">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-400 animate-pulse-ring" />
            Pakistan's #1 women's career platform
          </div>

          <h1 className="font-serif text-[40px] xs:text-[52px] md:text-[68px] lg:text-[88px] leading-[0.98] tracking-[-0.025em] max-w-5xl mb-6">
            Where Ambitious Women<br />
            Find <span className="italic text-shimmer">Careers</span> That<br />
            Match Their <span className="italic">Worth</span>
          </h1>

          <p className="text-[14px] md:text-base lg:text-lg text-white/65 leading-relaxed max-w-2xl mb-9">
            10,000+ women hired. 500+ inclusive employers. Zero compromise.<br className="hidden md:block" />
            AI-matched roles, ATS-ready CV builder, and a safer hiring space — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mb-10 w-full sm:w-auto">
            <Link
              to="/auth/signup"
              className="inline-flex items-center justify-center gap-2 px-7 h-12 rounded-full text-[13px] font-bold bg-white text-foreground hover:-translate-y-0.5 hover:shadow-elev3 press"
            >
              Browse Jobs <ArrowRight size={14} />
            </Link>
            <Link
              to="/auth/signup?role=EMPLOYER"
              className="inline-flex items-center justify-center gap-2 px-7 h-12 rounded-full text-[13px] font-bold bg-white/8 text-white border border-white/20 backdrop-blur-md hover:bg-white/15 press"
            >
              Hire Women Talent <ArrowRight size={14} />
            </Link>
          </div>

          {/* Demo logins */}
          <div className="flex flex-wrap items-center gap-2 mb-8 text-[10px] text-white/50">
            <span className="uppercase tracking-wider">Or peek as:</span>
            {(["CANDIDATE", "EMPLOYER", "ADMIN"] as const).map(r => (
              <button
                key={r}
                onClick={async () => {
                  try { navigate(await demoLogin(r)); }
                  catch { navigate("/auth/login"); }
                }}
                className="px-2.5 py-1 rounded-full border border-white/15 text-white/75 hover:text-white hover:border-white/35 press"
              >
                {r === "CANDIDATE" ? "Candidate" : r === "EMPLOYER" ? "Employer" : "Admin"}
              </button>
            ))}
          </div>

          {/* Job ticker */}
          <div className="w-full max-w-[1100px]">
            <JobTicker />
          </div>
        </div>

        {/* Trust bar */}
        <div className="relative border-t border-white/8 py-6">
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

      {/* ─── STATS ─────────────────────────────────────────────────────── */}
      <section className="bg-secondary/40 border-b border-border bg-arcs">
        <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16 lg:py-20">
          <div className="text-center mb-10">
            <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground mb-3">
              By the numbers
            </div>
            <h2 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight">
              A community changing <span className="italic text-primary">what work looks like</span>
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

      {/* ─── HOW IT WORKS ──────────────────────────────────────────────── */}
      <HowItWorksTabs />

      {/* ─── FEATURED JOBS ─────────────────────────────────────────────── */}
      <FeaturedJobs />

      {/* ─── VALUE STRIP — between jobs and stories ───────────────────── */}
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

      {/* ─── TESTIMONIALS ──────────────────────────────────────────────── */}
      <Testimonials />

      {/* ─── EMPLOYER CTA BAND ─────────────────────────────────────────── */}
      <EmployerCTA />

      {/* ─── FOOTER ────────────────────────────────────────────────────── */}
      <Footer />
    </div>
  );
}
