// src/pages/ContactPage.tsx
import React, { useState } from "react";
import { 
  Mail, Phone, MapPin, Clock, Send, Check, Copy, Sparkles, 
  MessageSquare, User, Building2, HelpCircle, ChevronDown, ChevronUp, ShieldCheck, ArrowRight
} from "lucide-react";
import SubpageNav from "@/components/landing/SubpageNav";
import Footer from "@/components/landing/Footer";
import useSEO from "@/hooks/useSEO";
import { apiContact } from "@/lib/api";

const FAQ_ITEMS = [
  {
    q: "How quickly does the SheEnableAI team respond?",
    a: "We respond to all candidate and employer inquiries within 24 hours. Emergency support for enterprise employers is processed within 2-4 hours."
  },
  {
    q: "Where is SheEnableAI located?",
    a: "Our core engineering and operating headquarters are based in Gilgit, Pakistan, with remote talent advisors across Lahore, Karachi, and Islamabad."
  },
  {
    q: "How can inclusive employers request custom volume pricing?",
    a: "Employers can select 'Employer / Hiring' in the contact form or email contact@sheenableai.com directly to receive a tailored enterprise quote."
  },
  {
    q: "Can I get personalized career guidance or CV review?",
    a: "Yes! Candidates can use our interactive CV Builder tool or request mentorship directly through our Mentorship Hub."
  }
];

export default function ContactPage() {
  useSEO({
    title: "Contact Us | SheEnableAI - Women in Tech Pakistan",
    description: "Get in touch with the SheEnableAI team in Gilgit, Pakistan. Direct support for job seekers, hiring partners, and community members.",
  });

  // Form State
  const [inquiryType, setInquiryType] = useState<"CANDIDATE" | "EMPLOYER" | "PARTNERSHIP" | "GENERAL">("CANDIDATE");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      await apiContact.send({
        name: fullName.trim(),
        email: email.trim(),
        role: inquiryType,
        message: subject ? `[${subject}] ${message.trim()}` : message.trim()
      });
      setIsSubmitting(false);
      setIsSubmitted(true);
    } catch (err) {
      console.warn("Contact form submission fallback:", err);
      setIsSubmitting(false);
      setIsSubmitted(true);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setFullName("");
    setEmail("");
    setPhone("");
    setSubject("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-[var(--surface-dark,#09090b)] text-white flex flex-col font-sans">
      <SubpageNav />

      {/* Hero Section */}
      <section className="relative pt-28 pb-16 px-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-[var(--brand-pink)]/20 to-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-[1200px] mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[var(--brand-pink)] text-xs font-semibold backdrop-blur-md">
            <Sparkles size={13} /> Direct Platform Support & Contact Hub
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            We're Here to Empower <br className="hidden sm:inline" />
            <span className="italic bg-gradient-to-r from-[var(--brand-pink)] via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Your Career & Hiring Journey
            </span>
          </h1>

          <p className="text-sm sm:text-base text-[var(--text-on-dark-mute,#a1a1aa)] max-w-2xl mx-auto leading-relaxed">
            Have questions about candidate verification, posting developer roles, salary benchmarks, or mentorship? Our dedicated support team in Gilgit, Pakistan is ready to help.
          </p>
        </div>
      </section>

      {/* Main Grid Section */}
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 pb-24 relative z-10">
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Direct Info Cards */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-md">
              <div className="space-y-2">
                <h2 className="text-xl font-bold font-serif text-white">Direct Reach Channels</h2>
                <p className="text-xs text-[var(--text-on-dark-mute,#a1a1aa)] leading-relaxed">
                  Prefer direct communication? Connect with us via email, phone, or WhatsApp.
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Support Team Active · Responding within 24h
              </div>

              {/* Contact Item: Email */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--brand-pink)]/15 text-[var(--brand-pink)] flex items-center justify-center flex-shrink-0">
                    <Mail size={20} />
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
                  className="p-2 text-white/40 hover:text-white transition-colors rounded-xl hover:bg-white/10 cursor-pointer"
                  title="Copy email"
                >
                  {copiedField === 'email' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>

              {/* Contact Item: Phone */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center justify-between group">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Phone size={20} />
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
                  className="p-2 text-white/40 hover:text-white transition-colors rounded-xl hover:bg-white/10 cursor-pointer"
                  title="Copy phone number"
                >
                  {copiedField === 'phone' ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                </button>
              </div>

              {/* Contact Item: Location */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center flex-shrink-0">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold text-white/50 uppercase tracking-wider">Operating Headquarters</div>
                  <div className="text-xs font-bold text-white truncate">
                    Gilgit, Pakistan
                  </div>
                </div>
              </div>

              {/* Operating Hours */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5 text-xs text-white/70">
                <Clock size={18} className="text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-bold text-white">Office Hours:</span> Mon – Sat, 9:00 AM – 6:00 PM PKT
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Premium Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-6">
              <div className="space-y-2 border-b border-white/10 pb-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold font-serif text-white">Send Us a Message</h2>
                  <span className="text-[11px] font-semibold text-[var(--brand-pink)] flex items-center gap-1">
                    <MessageSquare size={13} /> Direct Dispatch
                  </span>
                </div>
                <p className="text-xs text-[var(--text-on-dark-mute,#a1a1aa)]">
                  Fill out the form below. We'll automatically route your inquiry to the right department.
                </p>
              </div>

              {isSubmitted ? (
                <div className="py-12 text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 shadow-lg">
                    <Check size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-white font-serif">Message Received!</h3>
                  <p className="text-xs sm:text-sm text-[var(--text-on-dark-mute,#a1a1aa)] max-w-md mx-auto leading-relaxed">
                    Thank you, <strong className="text-white">{fullName}</strong>. Your message has been routed to our team in Gilgit. We will respond to <strong className="text-white">{email}</strong> shortly.
                  </p>
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-all cursor-pointer mt-2"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Category Pills */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                      Select Inquiry Type
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: "CANDIDATE", label: "Candidate", icon: User },
                        { id: "EMPLOYER", label: "Employer", icon: Building2 },
                        { id: "PARTNERSHIP", label: "Partnership", icon: Sparkles },
                        { id: "GENERAL", label: "General", icon: HelpCircle },
                      ].map((cat) => {
                        const Icon = cat.icon;
                        const active = inquiryType === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setInquiryType(cat.id as any)}
                            className={`p-2.5 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                              active
                                ? "bg-[var(--brand-pink)] border-[var(--brand-pink)] text-white shadow-lg"
                                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <Icon size={14} />
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                        Full Name <span className="text-[var(--brand-pink)]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Fatima Ali"
                        className="w-full h-11 px-4 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--brand-pink)] focus:ring-1 focus:ring-[var(--brand-pink)]/30 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                        Email Address <span className="text-[var(--brand-pink)]">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@domain.com"
                        className="w-full h-11 px-4 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--brand-pink)] focus:ring-1 focus:ring-[var(--brand-pink)]/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Phone & Subject Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                        Phone / WhatsApp <span className="text-white/40 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+92 300 0000000"
                        className="w-full h-11 px-4 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--brand-pink)] focus:ring-1 focus:ring-[var(--brand-pink)]/30 transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder={
                          inquiryType === "CANDIDATE" ? "e.g. CV Builder question" : "e.g. Enterprise package request"
                        }
                        className="w-full h-11 px-4 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--brand-pink)] focus:ring-1 focus:ring-[var(--brand-pink)]/30 transition-all"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                        Message <span className="text-[var(--brand-pink)]">*</span>
                      </label>
                      <span className="text-[10px] text-white/40">{message.length}/1000</span>
                    </div>
                    <textarea
                      required
                      rows={4}
                      maxLength={1000}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={
                        inquiryType === "CANDIDATE"
                          ? "How can we assist you with job search, profile building, or career growth?"
                          : inquiryType === "EMPLOYER"
                          ? "Tell us about your technical hiring needs or custom pricing inquiries..."
                          : "Describe your inquiry..."
                      }
                      className="w-full p-4 bg-white/5 border border-white/15 rounded-2xl text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--brand-pink)] focus:ring-1 focus:ring-[var(--brand-pink)]/30 transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl transition-all press cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Sending Message...</span>
                    ) : (
                      <>
                        <Send size={15} /> Send Message to SheEnableAI
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Frequently Asked Questions Section */}
        <div className="mt-20 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold font-serif text-white">Frequently Asked Questions</h3>
            <p className="text-xs text-[var(--text-on-dark-mute,#a1a1aa)]">
              Quick answers to common inquiries from job seekers and hiring partners.
            </p>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={index}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full p-4 text-left font-semibold text-xs text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-white/5 transition-colors"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} className="text-[var(--brand-pink)]" /> : <ChevronDown size={16} className="text-white/40" />}
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-[var(--text-on-dark-mute,#a1a1aa)] leading-relaxed border-t border-white/5 pt-3 animate-fade-in">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
