import React, { useState } from "react";
import { Sparkles, Check, Calculator, HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import SubpageNav from "@/components/landing/SubpageNav";
import Footer from "@/components/landing/Footer";
import useSEO from "@/hooks/useSEO";

export default function PricingPage() {
  const [headcount, setHeadcount] = useState(3);
  const [hoursSaved, setHoursSaved] = useState(25);

  const averageHourlyCost = 2500;
  const totalSavings = headcount * hoursSaved * averageHourlyCost;

  useSEO({
    title: "Employer Pricing Plans | Diversity Hiring — SheEnableAI",
    description: "Choose the pricing plan that fits your diversity hiring goals. Transparent plans for startups, growth companies, and enterprises. First job posting free.",
    schema: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "How does the first job free promotion work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Every employer account gets their first job posting completely free. No credit card required. The listing remains active for 30 days and includes basic candidate matching."
          }
        },
        {
          "@type": "Question",
          "name": "Can I cancel or change my plan anytime?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. All our subscriptions are month-to-month. You can upgrade, downgrade, or cancel your subscription directly from your dashboard at any time."
          }
        },
        {
          "@type": "Question",
          "name": "How does the AI match score work?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Our semantic match engine scores candidates based on their verified skills and experience compared to your job description. We do not use age, gender, or name in our scoring models."
          }
        },
        {
          "@type": "Question",
          "name": "Do you offer custom pricing for recruitment agencies?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes. We offer custom volume pricing and agency licenses under our Enterprise plan. Contact our enterprise sales team for a custom quote."
          }
        }
      ]
    }
  });

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink-700)] flex flex-col">
      <SubpageNav />
      {/* Upper Section: Hero + Cards Grid (Dark) */}
      <div className="bg-[var(--surface-dark)] text-white pb-16">
        <div className="max-w-[1200px] mx-auto w-full px-6 pt-6 space-y-12">
          {/* Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
            <h1 className="font-serif text-3xl font-extrabold tracking-tight">
              Flexible, transparent <span className="italic text-[var(--brand-pink)]">pricing plans</span>
            </h1>
            <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed">
              Choose the right subscription plan to accelerate your diversity hiring benchmarks. Build outstanding tech teams through state-of-the-art AI screening.
            </p>
          </div>

          {/* Pricing Matrix */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Starter Plan */}
            <div className="w-full bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] p-8 flex flex-col justify-between space-y-6 shadow-xl relative">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-on-dark)]">Starter Tier</h3>
                  <div className="text-2xl font-black text-[var(--text-on-dark)] mt-1">PKR 15,000<span className="text-xs text-[var(--text-on-dark-mute)] font-normal"> /mo</span></div>
                  <p className="text-[10px] text-[var(--text-on-dark-mute)] mt-1">Perfect for small startups hiring their first developers.</p>
                </div>

                <ul className="space-y-2 text-[11px] text-[var(--text-on-dark-mute)] border-t border-[var(--border-dark)] pt-4">
                  <li className="flex items-center gap-2"><Check size={14} className="text-white/60" /> 1 active job listing</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-white/60" /> Basic AI matching score</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-white/60" /> Standard candidate search</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-white/60" /> Email support</li>
                </ul>
              </div>
              <Link
                to="/auth/signup?role=EMPLOYER"
                className="w-full h-11 bg-transparent hover:bg-white/5 text-[var(--text-on-dark)] rounded-full text-xs font-bold text-center border border-[var(--border-dark)] transition-all flex items-center justify-center"
              >
                Choose Starter
              </Link>
            </div>

            {/* Professional Plan (Highlighted) */}
            <div className="w-full bg-[var(--surface-dark-card)] border-2 border-[var(--brand-pink)] rounded-[var(--radius-card)] p-8 flex flex-col justify-between space-y-6 relative shadow-2xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--brand-pink)] text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--brand-pink)] flex items-center gap-1.5">
                    Professional Tier <Sparkles size={12} fill="var(--brand-pink)" className="text-[var(--brand-pink)]" />
                  </h3>
                  <div className="text-3xl font-black text-[var(--brand-pink)] mt-1">PKR 35,000<span className="text-xs text-[var(--text-on-dark-mute)] font-normal"> /mo</span></div>
                  <p className="text-[10px] text-[var(--text-on-dark-mute)] mt-1">For growing teams requiring automated AI screen workflows.</p>
                </div>

                <ul className="space-y-2 text-[11px] text-[var(--text-on-dark-mute)] border-t border-[var(--brand-pink)]/10 pt-4">
                  <li className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-pink)]" /> 3 active job listings</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-pink)]" /> Advanced AI match matching</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-pink)]" /> Verified talent pool access</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-pink)]" /> Gender-neutral job decoder</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-[var(--brand-pink)]" /> Priority email & chat support</li>
                </ul>
              </div>
              <Link
                to="/auth/signup?role=EMPLOYER"
                className="w-full h-11 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-bold text-center transition-all shadow-lg flex items-center justify-center"
              >
                Choose Professional
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="w-full bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] p-8 flex flex-col justify-between space-y-6 shadow-xl relative">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-on-dark)]">Enterprise Tier</h3>
                  <div className="text-2xl font-black text-[var(--text-on-dark)] mt-1">PKR 75,000<span className="text-xs text-[var(--text-on-dark-mute)] font-normal"> /mo</span></div>
                  <p className="text-[10px] text-[var(--text-on-dark-mute)] mt-1">For massive agencies requiring unlimited access and matching pipelines.</p>
                </div>

                <ul className="space-y-2 text-[11px] text-[var(--text-on-dark-mute)] border-t border-[var(--border-dark)] pt-4">
                  <li className="flex items-center gap-2"><Check size={14} className="text-white/60" /> Unlimited active job listings</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-white/60" /> Custom AI models for screening</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-white/60" /> Dedicated account manager</li>
                  <li className="flex items-center gap-2"><Check size={14} className="text-white/60" /> HRIS integration & custom SLA</li>
                </ul>
              </div>
              <Link
                to="/auth/signup?role=EMPLOYER"
                className="w-full h-11 bg-transparent hover:bg-white/5 text-[var(--text-on-dark)] rounded-full text-xs font-bold text-center border border-[var(--border-dark)] transition-all flex items-center justify-center"
              >
                Choose Enterprise
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: ROI Calculator (Light surface) */}
      <div className="bg-[var(--surface)] border-t border-[var(--ink-200)] py-16">
        <div className="max-w-[1200px] mx-auto w-full px-6">
          <div className="bg-white border border-[var(--ink-200)] rounded-3xl p-8 grid md:grid-cols-2 gap-8 items-center shadow-[var(--shadow-card)] text-[var(--ink-700)]">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[var(--ink-900)] flex items-center gap-2">
                <Calculator size={18} className="text-[var(--ink-500)]" /> ROI Cost-Saving Calculator
              </h3>
              <p className="text-xs text-[var(--ink-700)] leading-relaxed">
                Recruitment is expensive. With SheEnableAI's semantic pipelines, you save dozens of manual filtering hours per candidate. Customize the sliders below to calculate your estimated quarterly cost savings.
              </p>

              {/* Sliders */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[var(--ink-900)]">
                    <span>Quarterly Headcounts</span>
                    <span className="text-[var(--brand-pink)] text-[13px] font-semibold">{headcount} hires</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={headcount}
                    onChange={(e) => setHeadcount(Number(e.target.value))}
                    className="w-full accent-[var(--brand-pink)] cursor-pointer h-1.5 bg-[var(--ink-200)] rounded-lg appearance-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[var(--ink-900)]">
                    <span>Hours Saved per Hire</span>
                    <span className="text-[var(--brand-pink)] text-[13px] font-semibold">{hoursSaved} hours</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={hoursSaved}
                    onChange={(e) => setHoursSaved(Number(e.target.value))}
                    className="w-full accent-[var(--brand-pink)] cursor-pointer h-1.5 bg-[var(--ink-200)] rounded-lg appearance-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-[var(--ink-200)] rounded-[var(--radius-card)] p-8 shadow-[var(--shadow-card)] text-center space-y-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">Estimated Quarterly Savings</span>
              <div className="text-[40px] font-bold text-[var(--brand-pink)] leading-none">
                PKR {totalSavings.toLocaleString()}
              </div>
              <p className="text-[13px] text-[var(--ink-500)] leading-relaxed">
                Based on an average HR hourly wage of PKR {averageHourlyCost.toLocaleString()}/hr and automated candidate screening.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-[var(--surface-muted)] border-t border-[var(--ink-200)] py-16">
        <div className="max-w-[800px] mx-auto w-full px-6 space-y-8">
          <h2 className="font-serif text-2xl lg:text-3xl font-extrabold text-[var(--ink-900)] text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--ink-900)] flex items-start gap-2">
                <HelpCircle size={16} className="text-[var(--brand-pink)] flex-shrink-0 mt-0.5" />
                <span>How does the first job free promotion work?</span>
              </h3>
              <p className="text-xs text-[var(--ink-500)] leading-relaxed mt-2 pl-6">
                Every employer account gets their first job posting completely free. No credit card required. The listing remains active for 30 days and includes basic candidate matching.
              </p>
            </div>

            <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--ink-900)] flex items-start gap-2">
                <HelpCircle size={16} className="text-[var(--brand-pink)] flex-shrink-0 mt-0.5" />
                <span>Can I cancel or change my plan anytime?</span>
              </h3>
              <p className="text-xs text-[var(--ink-500)] leading-relaxed mt-2 pl-6">
                Yes. All our subscriptions are month-to-month. You can upgrade, downgrade, or cancel your subscription directly from your dashboard at any time.
              </p>
            </div>

            <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--ink-900)] flex items-start gap-2">
                <HelpCircle size={16} className="text-[var(--brand-pink)] flex-shrink-0 mt-0.5" />
                <span>How does the AI match score work?</span>
              </h3>
              <p className="text-xs text-[var(--ink-500)] leading-relaxed mt-2 pl-6">
                Our semantic match engine scores candidates based on their verified skills and experience compared to your job description. We do not use age, gender, or name in our scoring models.
              </p>
            </div>

            <div className="bg-white border border-[var(--ink-200)] rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[var(--ink-900)] flex items-start gap-2">
                <HelpCircle size={16} className="text-[var(--brand-pink)] flex-shrink-0 mt-0.5" />
                <span>Do you offer custom pricing for recruitment agencies?</span>
              </h3>
              <p className="text-xs text-[var(--ink-500)] leading-relaxed mt-2 pl-6">
                Yes. We offer custom volume pricing and agency licenses under our Enterprise plan. Contact our enterprise sales team for a custom quote.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
