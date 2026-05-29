// src/components/landing/EmployerCTA.tsx
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function EmployerCTA() {
  return (
    <section id="employers" className="relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "var(--grad-mauve)" }} />
      <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle,rgba(212,162,76,.25),transparent 60%)", filter: "blur(80px)" }} />
      <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle,rgba(61,170,125,.20),transparent 60%)", filter: "blur(80px)" }} />

      <div className="relative max-w-[1280px] mx-auto px-5 lg:px-8 py-20 lg:py-24 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 bg-white/10 border border-white/20 text-white/85">
          Enterprise Partners
        </div>
        <h2 className="font-serif text-3xl md:text-5xl text-white max-w-3xl mx-auto leading-[1.1] tracking-tight mb-4">
          Partner in Leading the <span className="italic text-amber-300">Future of Work</span>
        </h2>
        <p className="text-[14px] md:text-base text-white/70 max-w-xl mx-auto mb-8">
          Integrate top-tier female talent into your engineering, executive, and creative pipelines. Begin with your first placement.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Link
            to="/auth/signup?role=EMPLOYER"
            className="inline-flex items-center gap-2 px-6 h-12 rounded-full text-[13px] font-bold bg-white text-foreground hover:-translate-y-0.5 hover:shadow-elev3 press"
          >
            Start Hiring Today <ArrowRight size={14} />
          </Link>
          <a
            href="#stories"
            className="inline-flex items-center gap-2 px-6 h-12 rounded-full text-[13px] font-semibold text-white/90 bg-white/8 border border-white/20 hover:bg-white/15 press"
          >
            See success stories
          </a>
        </div>

        <div className="flex justify-center gap-6 text-[11px] text-white/60 flex-wrap">
          {["First job free", "Verified candidates only", "Cancel anytime"].map(t => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-mint-300" /> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
