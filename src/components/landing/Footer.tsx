// src/components/landing/Footer.tsx
import { Link } from "react-router-dom";
import { Heart, Twitter, Linkedin, Instagram, Mail, Phone, MapPin, X, Copy, Check } from "lucide-react";
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
  const [showContactModal, setShowContactModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <footer className="bg-[var(--ink-900)] text-white/80 relative">
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
          <div className="flex gap-5 items-center">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <button 
              onClick={() => setShowContactModal(true)} 
              className="hover:text-white transition-colors cursor-pointer bg-transparent border-none p-0 text-[14px] text-[var(--ink-300)]"
            >
              Contact
            </button>
          </div>
        </div>
      </div>

      {/* Contact Info Modal */}
      {showContactModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="relative w-full max-w-md bg-[#16161a] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl text-white space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button 
              onClick={() => setShowContactModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-pink)]/15 border border-[var(--brand-pink)]/30 text-[var(--brand-pink)] text-xs font-semibold">
                <Mail size={12} /> Contact Information
              </div>
              <h3 className="text-2xl font-bold text-white">Get in Touch</h3>
              <p className="text-xs text-[var(--ink-300)] leading-relaxed">
                We're here to assist you. Reach out to the SheEnableAI team directly through any of the details below:
              </p>
            </div>

            {/* Contact Cards */}
            <div className="space-y-3">
              {/* Email */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[var(--brand-pink)]/15 text-[var(--brand-pink)] flex items-center justify-center flex-shrink-0">
                    <Mail size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Email Address</div>
                    <a 
                      href="mailto:contact@sheenableai.com" 
                      className="text-xs font-bold text-white hover:text-[var(--brand-pink)] transition-colors truncate block"
                    >
                      contact@sheenableai.com
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard('contact@sheenableai.com', 'email')}
                  className="p-2 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
                  title="Copy email address"
                >
                  {copiedField === 'email' ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                </button>
              </div>

              {/* Phone */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Phone size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Phone / WhatsApp</div>
                    <a 
                      href="tel:+923471051782" 
                      className="text-xs font-bold text-white hover:text-emerald-400 transition-colors truncate block"
                    >
                      +92 347 1051782
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard('+92 347 1051782', 'phone')}
                  className="p-2 text-white/50 hover:text-white transition-colors rounded-lg hover:bg-white/10 cursor-pointer"
                  title="Copy phone number"
                >
                  {copiedField === 'phone' ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
                </button>
              </div>

              {/* Location */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Headquarters</div>
                    <div className="text-xs font-bold text-white truncate">
                      Gilgit, Pakistan
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

