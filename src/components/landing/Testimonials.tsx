import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "Within two weeks, I secured a senior staff engineering role. The precision of the match engine bypasses the typical digital noise completely.",
    name: "Aisha Khan",
    title: "Senior Staff Engineer",
    company: "Techflow",
    avatar: "AK",
  },
  {
    quote: "Returning after a caregiving break is challenging, but SheEnable's ATS toolkit reframed my trajectory as a major strategic asset.",
    name: "Natasha Ali",
    title: "UX Lead",
    company: "Helix Health",
    avatar: "MG",
  },
  {
    quote: "We reduced our time-to-hire by half while expanding our executive female representation. It is a game-changer for modern teams.",
    name: "Saira Ahmed",
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
            Voices of the Community
          </div>
          <h2 className="font-sans font-semibold text-[28px] lg:text-[40px] text-[var(--ink-900)] tracking-tight">
            Realizing Potential, <span className="font-sans font-bold text-[var(--brand-pink)]">Redefining Industries</span>
          </h2>
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
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white bg-[var(--ink-900)]">
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
};

