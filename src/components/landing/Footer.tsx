// src/components/landing/Footer.tsx
import { Link } from "react-router-dom";
import { Heart, Twitter, Linkedin, Instagram } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
const COL_CANDIDATES = [
  { label: "Browse Jobs", href: "#jobs" },
  { label: "CV Builder", href: "/auth/signup" },
  { label: "Career Advice", href: "#community" },
  { label: "Salary Guide", href: "#" },
];
const COL_EMPLOYERS = [
  { label: "Post a Job", href: "/auth/signup?role=EMPLOYER" },
  { label: "Employer Pricing", href: "#" },
  { label: "Talent Search", href: "#" },
  { label: "Inclusion Resources", href: "#" },
];
const COL_COMMUNITY = [
  { label: "Mentorship", href: "#community" },
  { label: "Events", href: "#" },
  { label: "Blog", href: "#" },
  { label: "Newsletter", href: "#newsletter" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  return (
    <footer className="bg-mauve-900 text-white/80">
      <div className="max-w-[1280px] mx-auto px-5 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand + mission */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              {/* <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--grad-mauve-rose)" }}>
                <Heart size={15} className="text-white" fill="white" />
              </div>
              <span className="font-serif text-xl text-white">SheEnableAI</span> */}
            </div>
             <img
                                src={logo}
                                alt="SheEnableAI logo"
                                className="w-48 h-24 object-contain transition-transform group-hover:scale-105"
                              />
                             
            <p className="text-[12px] leading-relaxed text-white/55 mb-5 max-w-xs">
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
            <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 mb-4">For Candidates</h4>
            <ul className="space-y-2.5">
              {COL_CANDIDATES.map(l => (
                <li key={l.label}>
                  <Link to={l.href} className="text-[12px] hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 mb-4">For Employers</h4>
            <ul className="space-y-2.5">
              {COL_EMPLOYERS.map(l => (
                <li key={l.label}>
                  <Link to={l.href} className="text-[12px] hover:text-white transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community + Newsletter */}
          <div id="newsletter">
            <h4 className="text-[11px] font-bold uppercase tracking-[1.5px] text-white/40 mb-4">Community</h4>
            <ul className="space-y-2.5 mb-6">
              {COL_COMMUNITY.map(l => (
                <li key={l.label}>
                  <a href={l.href} className="text-[12px] hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>

            <form
              onSubmit={e => { e.preventDefault(); if (email.trim()) setDone(true); }}
              className="bg-white/5 border border-white/10 rounded-2xl p-3"
            >
              <div className="text-[11px] font-bold text-white mb-2">Get weekly job alerts</div>
              {done ? (
                <div className="text-[11px] text-mint-300">✓ Thanks — we'll be in touch.</div>
              ) : (
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 h-9 px-3 rounded-full bg-white/10 text-[11px] text-white placeholder:text-white/40 focus:outline-none focus:bg-white/15"
                    aria-label="Email for newsletter"
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 rounded-full bg-mint-400 text-white text-[11px] font-bold press hover:bg-mint-500"
                  >
                    Join
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-[11px] text-white/45">
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
