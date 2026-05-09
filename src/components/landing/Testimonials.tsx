import { Quote, Star } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "I landed a senior frontend role in 11 days. Every job in my feed felt hand-picked — the AI match was scarily accurate.",
    name: "Aisha Khan",
    title: "Senior Frontend Engineer",
    company: "Techflow",
    avatar: "AK",
  },
  {
    quote: "As a returning mother, I worried about the gap on my CV. HerCareer's CV builder turned my career break into a strength.",
    name: "Maria Gomez",
    title: "UX Lead",
    company: "Helix Health",
    avatar: "MG",
  },
  {
    quote: "We cut our time-to-hire from 42 days to 16. The pipeline view alone is worth it — our HR team finally feels in control.",
    name: "Saira Ahmed",
    title: "Head of Talent",
    company: "NorthStar",
    avatar: "SA",
  },
];

export default function Testimonials() {
  return (
    <section id="stories" className="bg-secondary/50 border-y border-border">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-20 lg:py-24">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground mb-3">
            Success stories
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight">
            Real women, <span className="italic text-primary">real results</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className="bg-card border border-border border-l-[3px] border-l-primary rounded-2xl p-6 lift flex flex-col animate-fade-in"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <Quote className="text-primary/25 mb-4" size={28} />
              <blockquote className="text-[14px] text-foreground leading-relaxed mb-5 flex-1 font-medium">
                "{t.quote}"
              </blockquote>
              <div className="flex items-center gap-1 mb-4 text-amber-400">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} size={13} fill="currentColor" stroke="none" />
                ))}
              </div>
              <figcaption className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold text-white"
                  style={{ background: "var(--grad-mauve-rose)" }}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-foreground">{t.name}</div>
                  <div className="text-[11px] text-muted-foreground">{t.title} · {t.company}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
