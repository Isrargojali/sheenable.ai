// src/components/landing/Footer.tsx
import { Link } from "react-router-dom";
import { Heart, Twitter, Linkedin, Instagram } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
const COL_CANDIDATES = [
  { label: "Browse Jobs", href: "/find-jobs-for-women-pakistan" },
  { label: "CV Builder", href: "/cv-builder" },
  { label: "Career Advice", href: "/career-hub-women-pakistan" },
  { label: "Salary Guide", href: "/pakistan-salary-transparency-index" },
];
const COL_EMPLOYERS = [
  { label: "Post a Job", href: "/hire-female-talent-pakistan" },
  { label: "Employer Pricing", href: "/employer-pricing-pakistan" },
  { label: "Talent Search", href: "/talent-search" },
  { label: "Inclusion Resources", href: "/dei-inclusion-resources-pakistan" },
];
const COL_COMMUNITY = [
  { label: "Mentorship", href: "/mentorship-women-pakistan" },
  { label: "Events", href: "/webinars-women-tech-pakistan" },
  { label: "Blog", href: "/career-blog-women-pakistan" },
  { label: "Newsletter", href: "#newsletter" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <footer className="bg-[var(--ink-900)] text-white/80">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16 lg:py-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand + mission */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
            </div>
             <img
                src={logo}
                alt="SheEnableAI logo"
                className="w-48 h-24 object-contain transition-transform group-hover:scale-105"
              />
                             
            <p className="text-[14px] leading-relaxed text-[var(--ink-300)] mb-5 max-w-xs">
              Pakistan's premium hiring platform built for ambitious women. Where talent finds its worth and where inclusive employers find extraordinary teams.
            </p>
            <div className="flex gap-2">
              {[Twitter, Linkedin, Instagram].map((Icon, i) => (
                <a key={i} href="#" aria-label="Social link" className="w-9 h-9 rounded-full bg-white/8 hover:bg-white/15 flex items-center justify-center press">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div>
            <h4 className="text-[14px] font-bold uppercase tracking-[1.5px] text-[var(--ink-300)] mb-4">For Candidates</h4>
            <ul className="space-y-2.5">
              {COL_CANDIDATES.map(l => (
                <li key={l.label}>
                  <Link to={l.href} className="text-[14px] text-[var(--ink-300)] hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-bold uppercase tracking-[1.5px] text-[var(--ink-300)] mb-4">For Employers</h4>
            <ul className="space-y-2.5">
              {COL_EMPLOYERS.map(l => (
                <li key={l.label}>
                  <Link to={l.href} className="text-[14px] text-[var(--ink-300)] hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community + Newsletter */}
          <div id="newsletter">
            <h4 className="text-[14px] font-bold uppercase tracking-[1.5px] text-[var(--ink-300)] mb-4">Community</h4>
            <ul className="space-y-2.5 mb-6">
              {COL_COMMUNITY.map(l => (
                <li key={l.label}>
                  {l.href.startsWith("/") ? (
                    <Link to={l.href} className="text-[14px] text-[var(--ink-300)] hover:text-white transition-colors">{l.label}</Link>
                  ) : (
                    <a href={l.href} className="text-[14px] text-[var(--ink-300)] hover:text-white transition-colors">{l.label}</a>
                  )}
                </li>
              ))}
            </ul>

            <form
              onSubmit={e => { e.preventDefault(); if (email.trim()) setDone(true); }}
              className="bg-white/5 border border-white/10 rounded-xl p-3"
            >
              <div className="text-[14px] font-semibold text-[var(--ink-300)] mb-2">Get weekly job alerts — free</div>
              {done ? (
                <div className="text-[14px] text-[var(--brand-pink)]">✓ Thanks — we'll be in touch.</div>
              ) : (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row gap-1.5">
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full sm:flex-1 h-10 px-4 rounded-full bg-white/10 text-[14px] text-[var(--ink-300)] placeholder:text-[var(--ink-500)] focus:outline-none focus:bg-white/15"
                      aria-label="Email for newsletter"
                    />
                    <button
                      type="submit"
                      className="h-10 px-6 rounded-full bg-[var(--brand-pink)] text-white hover:bg-[var(--brand-pink-hover)] text-[13px] font-bold press w-full sm:w-auto flex-shrink-0"
                    >
                      Subscribe
                    </button>
                  </div>
                  <div className="text-[11px] text-[var(--ink-500)] leading-tight">
                    No spam. Unsubscribe anytime. We never sell your data.
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[14px] text-[var(--ink-300)]">
          <div className="flex items-center gap-2">
             © {new Date().getFullYear()} SheEnableAI · Built for women
          </div>
          <div className="flex gap-5">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
