// src/components/landing/GlassNav.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Find Jobs",       href: "#jobs" },
  { label: "For Employers",   href: "#employers" },
  { label: "Community",       href: "#community" },
  { label: "Success Stories", href: "#stories" },
];

export default function GlassNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { hash } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-40 transition-all duration-300",
          scrolled ? "glass shadow-soft" : "bg-transparent"
        )}
      >
        <div className="max-w-[1280px] mx-auto h-16 px-5 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="HerCareer home">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105"
                 style={{ background: "var(--grad-mauve)" }}>
              <Heart size={15} className="text-white" fill="white" />
            </div>
            <span className="font-serif text-xl text-foreground leading-none">HerCareer</span>
          </Link>

          {/* Center links */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                className={cn(
                  "text-[13px] font-medium relative group transition-colors",
                  hash === l.href ? "text-primary" : "text-foreground/75 hover:text-foreground"
                )}
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              to="/auth/signup?role=EMPLOYER"
              className="hidden md:inline-flex items-center px-4 h-9 rounded-full text-[12px] font-semibold border-[1.5px] border-foreground/15 text-foreground/85 hover:border-primary hover:text-primary press"
            >
              Post a Job
            </Link>
            <Link
              to="/auth/signup"
              className="inline-flex items-center px-4 h-9 rounded-full text-[12px] font-bold bg-primary text-primary-foreground hover:bg-mauve-600 hover:-translate-y-0.5 hover:shadow-elev2 press"
            >
              Join Free
            </Link>

            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary press"
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <>
          <div className="fixed inset-0 bg-foreground/40 z-50 lg:hidden animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="fixed top-0 right-0 bottom-0 w-[80%] max-w-[320px] bg-card z-50 lg:hidden p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <span className="font-serif text-lg">Menu</span>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-secondary press" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-xl text-sm font-semibold text-foreground hover:bg-secondary"
                >
                  {l.label}
                </a>
              ))}
              <div className="my-3 h-px bg-border" />
              <Link to="/auth/signup?role=EMPLOYER" onClick={() => setOpen(false)}
                    className="px-3 py-3 rounded-xl text-sm font-semibold border-[1.5px] border-border text-foreground hover:border-primary hover:text-primary text-center">
                Post a Job
              </Link>
              <Link to="/auth/signup" onClick={() => setOpen(false)}
                    className="px-3 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground text-center mt-2">
                Join Free
              </Link>
              <Link to="/auth/login" onClick={() => setOpen(false)}
                    className="px-3 py-3 text-xs text-muted-foreground text-center mt-2">
                Already have an account? Sign in
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}
