// src/components/landing/SubpageNav.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const NAV_LINKS = [
  { label: "Find Jobs", href: "/#jobs" },
  { label: "For Employers", href: "/#employers" },
  { label: "Community", href: "/#community" },
  { label: "Success Stories", href: "/#stories" },
];

interface SubpageNavProps {
  actions?: React.ReactNode;
}

export default function SubpageNav({ actions }: SubpageNavProps = {}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const dashboardHref =
    user?.role === "EMPLOYER"
      ? "/employer/dashboard"
      : user?.role === "CANDIDATE"
      ? "/candidate/dashboard"
      : user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
      ? "/admin/overview"
      : "/";

  return (
    <>
      <nav
        className={cn(
          "sticky top-0 z-40 transition-all duration-300 bg-[var(--surface-dark)] border-b border-white/5",
          scrolled ? "shadow-2xl" : "shadow-none"
        )}
      >
        <div className="max-w-[1280px] mx-auto h-[72px] px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="SheEnableAI home">
            <img
              src={logo}
              alt="SheEnableAI logo"
              className="w-48 h-24 object-contain transition-transform group-hover:scale-105"
            />
          </Link>
 
          {/* Center links */}
          <div className="hidden lg:flex items-center gap-7">
            {NAV_LINKS.map(l => (
              <a
                key={l.label}
                href={l.href}
                className="text-[14px] font-medium relative group transition-colors duration-200 text-white hover:text-[var(--brand-pink)]"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 right-0 h-px scale-x-0 group-hover:scale-x-100 transition-transform origin-left bg-[var(--brand-pink)]" />
              </a>
            ))}
          </div>
 
          {/* CTAs */}
          <div className="flex items-center gap-3">
            {actions ? (
              actions
            ) : user ? (
              <Link
                to={dashboardHref}
                className="inline-flex items-center px-5 h-10 rounded-full text-[14px] font-medium transition-all shadow-md press bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink-hover)]"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/auth/signup?role=EMPLOYER"
                  className="hidden md:inline-flex items-center px-5 h-10 rounded-full text-[14px] font-medium border-[1.5px] press transition-colors duration-200 border-[var(--on-dark-border)] text-white hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]"
                >
                  Post a Job
                </Link>
                <Link
                  to="/auth/signup"
                  className="hidden lg:inline-flex items-center px-5 h-10 rounded-full text-[14px] font-medium shadow-sm press transition-all bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink-hover)]"
                >
                  Join Free
                </Link>
              </>
            )}
 
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden p-2 rounded-lg press transition-colors hover:bg-white/10 text-white"
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 lg:hidden animate-fade-in" onClick={() => setOpen(false)} />
          <aside className="fixed top-0 right-0 bottom-0 w-[80%] max-w-[320px] z-50 lg:hidden p-6 animate-slide-up transition-all bg-[#1A0A2E] border-l border-white/5 text-white">
            <div className="flex items-center justify-between mb-8">
              <span className="font-serif text-lg font-bold">Menu</span>
              <button
                onClick={() => setOpen(false)}
                className="p-2 rounded-lg press hover:bg-white/10 text-white"
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(l => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-xl text-sm font-semibold transition-colors text-white/80 hover:bg-white/5 hover:text-white"
                >
                  {l.label}
                </a>
              ))}
              <div className="my-3 h-px bg-white/5" />
              {actions ? (
                <div className="flex flex-col gap-2">{actions}</div>
              ) : user ? (
                <Link
                  to={dashboardHref}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-xl text-sm font-bold text-center mt-2 transition-colors bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink-hover)]"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/signup?role=EMPLOYER"
                    onClick={() => setOpen(false)}
                    className="px-3 py-3 rounded-xl text-sm font-semibold border-[1.5px] text-center transition-colors border-[var(--on-dark-border)] text-white hover:border-[var(--brand-pink)] hover:text-[var(--brand-pink)]"
                  >
                    Post a Job
                  </Link>
                  <Link
                    to="/auth/signup"
                    onClick={() => setOpen(false)}
                    className="px-3 py-3 rounded-xl text-sm font-bold text-center mt-2 transition-colors bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink-hover)]"
                  >
                    Join Free
                  </Link>
                  <Link
                    to="/auth/login"
                    onClick={() => setOpen(false)}
                    className="px-3 py-3 text-xs text-center mt-2 transition-colors text-white/40 hover:text-white/60"
                  >
                    Already have an account? Sign in
                  </Link>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}
