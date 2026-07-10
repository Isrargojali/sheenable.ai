import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "I had 3 recruiter calls within 48 hours of creating my profile. The AI match percentage was 94% for the role I ended up getting. SheEnableAI is the only platform that actually understood my background.",
    name: "Aisha Khan",
    title: "Senior Staff Engineer",
    company: "TechFlow",
    avatar: "AK",
  },
  {
    quote: "I was returning after a 2-year caregiving break and terrified no one would take a chance on me. Within 2 weeks I had an offer that was 40% above my previous salary. SheEnableAI made my case for me.",
    name: "Maria Gomez",
    title: "Lead Product Designer",
    company: "Indie Health",
    avatar: "MG",
  },
  {
    quote: "We cut our time-to-hire from 6 weeks to 11 days and our first 4 hires through SheEnableAI are still with us 18 months later. The retention rate is unlike anything we've seen from other platforms.",
    name: "Sana Ahmed",
    title: "Head of Talent",
    company: "NorthStar",
    avatar: "SA",
  },
];

export default function Testimonials() {
  return (
    <section id="stories" className="bg-[var(--surface)]">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16 lg:py-24">
        <div className="text-center mb-12">
          <div className="inline-block px-3.5 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] bg-[var(--ink-100)] text-[var(--ink-700)] mb-3 font-sans border border-[var(--ink-300)]">
            Women who found their trajectory
          </div>
          <h2 className="font-sans font-semibold text-[28px] lg:text-[40px] text-[var(--ink-900)] tracking-tight">
            Real women. Real roles. <span className="font-sans font-bold text-[var(--brand-pink)]">Real impact.</span>
          </h2>
          <p className="text-[13px] text-[var(--ink-500)] leading-relaxed mt-2 max-w-xl mx-auto">
            These aren't stock quotes. Every story is verified by our placement team.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 md:gap-y-8">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className="bg-[var(--surface)] border border-[var(--ink-300)] rounded-xl p-6 shadow-card flex flex-col animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Quote className="text-[var(--ink-300)] mb-4" size={28} />
              <blockquote className="text-[18px] font-semibold text-[var(--ink-900)] leading-relaxed mb-5 flex-1">
                "{t.quote}"
              </blockquote>
              <div className="flex items-center gap-1 mb-4 text-[var(--ink-500)]">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={14} fill="currentColor" stroke="none" />
                ))}
              </div>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-[var(--ink-300)]">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white bg-[var(--ink-900)] flex-shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-[var(--ink-500)]">{t.name}</div>
                  <div className="text-[13px] text-[var(--ink-500)]">{t.title} · {t.company}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

