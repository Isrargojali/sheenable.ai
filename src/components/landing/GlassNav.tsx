// src/components/landing/GlassNav.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Find Jobs", href: "#jobs" },
  { label: "For Employers", href: "#employers" },
  { label: "Community", href: "#community" },
  { label: "Success Stories", href: "#stories" },
];

export default function GlassNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { hash } = useLocation();

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY ?? document.documentElement?.scrollTop ?? document.body?.scrollTop ?? 0;
      setScrolled(scrollY > 20);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          scrolled
            ? "bg-white/95 backdrop-blur-md shadow-md border-b border-black/5"
            : "bg-transparent border-b border-transparent"
        )}
      >
        <div className="max-w-[1280px] mx-auto h-16 px-5 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="SheEnableAI home">
            <img
              src={logo}
              alt="SheEnableAI logo"
              className={cn(
                "w-48 h-24 object-contain transition-all duration-300 ease-in-out group-hover:scale-105",
                scrolled ? "" : "brightness-0 invert"
              )}
            />
          </Link>

          {/* Center links */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                className={cn(
                  "text-[13px] font-medium relative group transition-colors duration-300 ease-in-out",
                  hash === l.href
                    ? "text-[var(--brand-pink)]"
                    : scrolled
                      ? "text-[#111111] hover:text-[var(--brand-pink)]"
                      : "text-white hover:text-white/80"
                )}
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-[var(--brand-pink)] scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </a>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-2">
            <Link
              to="/auth/signup?role=EMPLOYER"
              className={cn(
                "hidden md:inline-flex items-center px-4 h-9 rounded-xl text-[12px] font-semibold border-[1.5px] press transition-all duration-300 ease-in-out",
                scrolled
                  ? "border-[#111111]/30 text-[#111111] hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]"
                  : "border-white/30 text-white hover:border-white hover:bg-white/10"
              )}
            >
              Post a Job
            </Link>
            <Link
              to="/auth/signup"
              className="hidden lg:inline-flex items-center px-4 h-9 rounded-xl text-[12px] font-bold bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 hover:-translate-y-0.5 hover:shadow-card press"
            >
              Join Free
            </Link>

            <button
              onClick={() => setOpen(true)}
              className={cn(
                "lg:hidden p-2 rounded-lg press transition-all duration-300 ease-in-out",
                scrolled
                  ? "text-[#111111] hover:bg-black/5"
                  : "text-white hover:bg-white/10"
              )}
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
          <aside className="fixed top-0 right-0 bottom-0 w-[80%] max-w-[320px] bg-[var(--surface)] border-l border-[var(--ink-300)] z-50 lg:hidden p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-8">
              <span className="font-sans font-semibold text-lg text-[var(--ink-900)]">Menu</span>
              <button onClick={() => setOpen(false)} className="p-2 rounded-lg hover:bg-[var(--ink-100)] text-[var(--ink-700)] press" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-xl text-sm font-semibold text-[var(--ink-700)] hover:bg-[var(--ink-100)] hover:text-[var(--ink-900)]"
                >
                  {l.label}
                </a>
              ))}
              <div className="my-3 h-px bg-[var(--ink-300)]" />
              <Link to="/auth/signup?role=EMPLOYER" onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-xl text-sm font-semibold border-[1.5px] border-[var(--ink-300)] text-[var(--ink-700)] hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)] text-center">
                Post a Job
              </Link>
              <Link to="/auth/signup" onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-xl text-sm font-bold bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink)]/90 text-center mt-2">
                Join Free
              </Link>
              <Link to="/auth/login" onClick={() => setOpen(false)}
                className="px-3 py-3 text-xs text-[var(--ink-500)] hover:text-[var(--ink-900)] text-center mt-2">
                Already have an account? Sign in
              </Link>
            </div>
          </aside>
        </>
      )}
    </>
  );
}