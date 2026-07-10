import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export default function EmployerCTA() {
  return (
    <section id="employers" className="relative overflow-hidden bg-[var(--ink-900)]">
      <div className="relative max-w-[1280px] mx-auto px-5 lg:px-8 py-16 lg:py-24 text-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-3 bg-white/10 border border-white/20 text-white/90 font-sans">
          Enterprise partnerships
        </div>
        <h2 className="font-sans font-semibold text-[28px] lg:text-[40px] text-white max-w-3xl mx-auto leading-[1.1] tracking-tight mb-4">
          Build your entire <span className="font-sans font-bold text-[var(--brand-pink)]">female leadership pipeline</span> in one place
        </h2>
        <p className="text-[13px] text-white/70 max-w-xl mx-auto mb-12">
          From individual contributors to executive hires — SheEnableAI handles sourcing, screening, and onboarding for inclusive teams of any size.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Link
            to="/hire-female-talent-pakistan"
            className="bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 rounded-xl px-6 h-11 text-[15px] font-semibold flex items-center justify-center gap-2 shadow-card press"
          >
            <span>Start Hiring Today — First Job Free</span> <ArrowRight size={14} className="arrow" />
          </Link>
          <a
            href="#stories"
            className="border border-white/24 text-white hover:bg-white/5 bg-transparent rounded-xl px-6 h-11 text-[15px] font-semibold flex items-center justify-center gap-2 press"
          >
            <span>Read Success Stories</span>
          </a>
        </div>

        <div className="flex justify-center gap-6 text-[11px] text-white/60 flex-wrap">
          {["No setup fee", "Verified candidates only", "Cancel anytime"].map(t => (
            <span key={t} className="inline-flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-[var(--brand-pink)]" /> {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
