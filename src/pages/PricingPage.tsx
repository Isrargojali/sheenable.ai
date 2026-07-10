import React, { useState } from "react";
import { Sparkles, Check, HelpCircle, DollarSign, Calculator, Percent, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

export default function PricingPage() {
  const [headcount, setHeadcount] = useState(3);
  const [hoursSaved, setHoursSaved] = useState(25);

  // ROI Math
  const averageHourlyCost = 2500; // Recruiter PKR hourly average rate
  const totalSavings = headcount * hoursSaved * averageHourlyCost;

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink-700)] flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Hero Banner Section (Dark) */}
      <section className="bg-[var(--surface-dark)] text-white py-16">
        <div className="relative max-w-[1200px] mx-auto px-6 text-center max-w-2xl space-y-3">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            Flexible, transparent <span className="italic text-[var(--brand-pink)]">pricing tiers</span>
          </h2>
          <p className="text-sm text-[var(--on-dark-secondary)] leading-relaxed">
            Choose the right subscription plan to accelerate your diversity hiring benchmarks. Build outstanding tech teams through state-of-the-art AI screening.
          </p>
        </div>
      </section>

      {/* Main Container (Light) */}
      <main className="flex-1 bg-[var(--surface)] text-[var(--ink-700)] py-12">
        <div className="max-w-[1200px] mx-auto w-full px-6 space-y-12">
          {/* Pricing Matrix */}
          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {/* Plan 1 */}
            <div className="bg-white border border-[var(--ink-200)] rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-[var(--shadow-card)]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink-500)]">Starter Tier</h3>
                  <div className="text-2xl font-black text-[var(--ink-900)] mt-1">PKR 15,000<span className="text-xs text-[var(--ink-500)] font-normal"> /mo</span></div>
                  <p className="text-[10px] text-[var(--ink-500)] mt-1">Perfect for small startups hiring their first developers.</p>
                </div>

                <ul className="space-y-2 text-[11px] text-[var(--ink-700)] border-t border-[var(--ink-200)] pt-4">
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> 2 active job listings</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Standard candidate profiles access</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Basic screening filter systems</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Email support channel</li>
                </ul>
              </div>
              <Link
                to="/auth/signup?role=EMPLOYER"
                className="w-full py-2.5 bg-[var(--ink-100)] hover:bg-[var(--ink-200)] text-[var(--ink-900)] rounded-full text-xs font-bold text-center border border-[var(--ink-300)] transition-all"
              >
                Choose Starter
              </Link>
            </div>

            {/* Plan 2 (Highlighted) */}
            <div className="bg-white border-2 border-[var(--brand-pink)] rounded-3xl p-6 flex flex-col justify-between space-y-6 relative shadow-xl">
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[var(--brand-pink)] text-white text-[9px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
                Most Popular
              </span>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--brand-pink)] flex items-center gap-1.5">
                    Professional Tier <Sparkles size={12} fill="var(--brand-pink)" className="text-[var(--brand-pink)]" />
                  </h3>
                  <div className="text-3xl font-black text-[var(--ink-900)] mt-1">PKR 35,000<span className="text-xs text-[var(--ink-500)] font-normal"> /mo</span></div>
                  <p className="text-[10px] text-[var(--ink-500)] mt-1">For growing teams requiring automated AI screen workflows.</p>
                </div>

                <ul className="space-y-2 text-[11px] text-[var(--ink-700)] border-t border-[var(--brand-pink)]/10 pt-4">
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> 5 active job listings</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> AI Semantic Resume-Job matching</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Unlimited AI Talent Searches</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Premium candidate profiles access</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Interactive Gender Decoder access</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Priority 24/7 Slack channel support</li>
                </ul>
              </div>
              <Link
                to="/auth/signup?role=EMPLOYER"
                className="w-full py-2.5 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-black text-center transition-all shadow-lg"
              >
                Choose Professional
              </Link>
            </div>

            {/* Plan 3 */}
            <div className="bg-white border border-[var(--ink-200)] rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-[var(--shadow-card)]">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--ink-500)]">Enterprise Tier</h3>
                  <div className="text-2xl font-black text-[var(--ink-900)] mt-1">PKR 75,000<span className="text-xs text-[var(--ink-500)] font-normal"> /mo</span></div>
                  <p className="text-[10px] text-[var(--ink-500)] mt-1">For massive agencies requiring unlimited access and matching pipelines.</p>
                </div>

                <ul className="space-y-2 text-[11px] text-[var(--ink-700)] border-t border-[var(--ink-200)] pt-4">
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Unlimited active job listings</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Dedicated Talent Match Consultant</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Custom API and HRIS integrations</li>
                  <li className="flex items-center gap-2"><Check size={12} className="text-[var(--brand-pink)]" /> Customizable candidate assessment gates</li>
                </ul>
              </div>
              <Link
                to="/auth/signup?role=EMPLOYER"
                className="w-full py-2.5 bg-[var(--ink-100)] hover:bg-[var(--ink-200)] text-[var(--ink-900)] rounded-full text-xs font-bold text-center border border-[var(--ink-300)] transition-all"
              >
                Choose Enterprise
              </Link>
            </div>
          </div>

          {/* ROI Cost Savings Calculator */}
          <div className="bg-white border border-[var(--ink-200)] rounded-3xl p-6 grid md:grid-cols-2 gap-8 items-center shadow-[var(--shadow-card)] text-[var(--ink-700)]">
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[var(--ink-900)] flex items-center gap-2">
                <Calculator size={18} className="text-[var(--brand-pink)]" /> ROI Cost-Saving Calculator
              </h3>
              <p className="text-xs text-[var(--ink-500)] leading-relaxed">
                Recruitment is expensive. With SheEnableAI's semantic pipelines, you save dozens of manual filtering hours per candidate. Customize the sliders below to calculate your estimated quarterly cost savings.
              </p>

              {/* Sliders */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[var(--ink-900)]">
                    <span>Quarterly Headcounts</span>
                    <span className="text-[var(--brand-pink)]">{headcount} hires</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={headcount}
                    onChange={(e) => setHeadcount(Number(e.target.value))}
                    className="w-full accent-[var(--brand-pink)] cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-[var(--ink-900)]">
                    <span>Hours Saved per Hire</span>
                    <span className="text-[var(--brand-pink)]">{hoursSaved} hours</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="60"
                    value={hoursSaved}
                    onChange={(e) => setHoursSaved(Number(e.target.value))}
                    className="w-full accent-[var(--brand-pink)] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-muted)] border border-[var(--ink-200)] p-6 rounded-2xl text-center space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)]">Quarterly Cost Savings</span>
              <div className="text-3xl font-black text-[var(--brand-pink)]">
                PKR {totalSavings.toLocaleString()}
              </div>
              <p className="text-[10px] text-[var(--ink-500)] leading-relaxed">
                Based on average recruiter wages of PKR {averageHourlyCost.toLocaleString()}/hr and automated AI candidate vetting.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
