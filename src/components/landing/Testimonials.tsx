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
    name: "Maria Gomez",
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
    <section id="stories" className="bg-secondary/50 border-y border-border">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-20 lg:py-24">
        <div className="text-center mb-12">
          <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent text-accent-foreground mb-3">
            Voices of the Community
          </div>
          <h2 className="font-serif text-3xl md:text-5xl text-foreground tracking-tight">
            Realizing Potential, <span className="italic text-primary">Redefining Industries</span>
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
};

