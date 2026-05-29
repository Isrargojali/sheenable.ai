import React, { useState } from "react";
import { Sparkles, Check, HelpCircle, DollarSign, Calculator, Percent, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";

export default function PricingPage() {
  const [headcount, setHeadcount] = useState(3);
  const [hoursSaved, setHoursSaved] = useState(25);

  // ROI Math
  const averageHourlyCost = 2500; // Recruiter PKR hourly average rate
  const totalSavings = headcount * hoursSaved * averageHourlyCost;

  return (
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0F0A1A]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="SheEnableAI logo" className="h-10 object-contain" />
        </Link>
        <Link
          to="/auth/signup?role=EMPLOYER"
          className="px-5 py-2 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all shadow-lg"
        >
          Get Started
        </Link>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-12">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            Flexible, transparent <span className="text-[#22C55E]">pricing tiers</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Choose the right subscription plan to accelerate your diversity hiring benchmarks. Build outstanding tech teams through state-of-the-art AI screening.
          </p>
        </div>

        {/* Pricing Matrix */}
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {/* Plan 1 */}
          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white/70">Starter Tier</h3>
                <div className="text-2xl font-black text-white mt-1">PKR 15,000<span className="text-xs text-white/40 font-normal"> /mo</span></div>
                <p className="text-[10px] text-white/40 mt-1">Perfect for small startups hiring their first developers.</p>
              </div>

              <ul className="space-y-2 text-[11px] text-white/70 border-t border-white/5 pt-4">
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> 2 active job listings</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Standard candidate profiles access</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Basic screening filter systems</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Email support channel</li>
              </ul>
            </div>
            <Link
              to="/auth/signup?role=EMPLOYER"
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold text-center border border-white/10 transition-all"
            >
              Choose Starter
            </Link>
          </div>

          {/* Plan 2 (Highlighted) */}
          <div className="bg-[#0F0A1A] border-2 border-[#22C55E] rounded-3xl p-6 flex flex-col justify-between space-y-6 relative shadow-2xl">
            <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#22C55E] text-[#0F0A1A] text-[9px] font-black px-3.5 py-1 rounded-full uppercase tracking-wider">
              Most Popular
            </span>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-[#22C55E] flex items-center gap-1.5">
                  Professional Tier <Sparkles size={12} fill="#22C55E" />
                </h3>
                <div className="text-3xl font-black text-white mt-1">PKR 35,000<span className="text-xs text-white/40 font-normal"> /mo</span></div>
                <p className="text-[10px] text-white/40 mt-1">For growing teams requiring automated AI screen workflows.</p>
              </div>

              <ul className="space-y-2 text-[11px] text-white/80 border-t border-[#22C55E]/10 pt-4">
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> 5 active job listings</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> AI Semantic Resume-Job matching</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Unlimited AI Talent Searches</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Premium candidate profiles access</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Interactive Gender Decoder access</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Priority 24/7 Slack channel support</li>
              </ul>
            </div>
            <Link
              to="/auth/signup?role=EMPLOYER"
              className="w-full py-2.5 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black text-center transition-all shadow-lg"
            >
              Choose Professional
            </Link>
          </div>

          {/* Plan 3 */}
          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white/70">Enterprise Tier</h3>
                <div className="text-2xl font-black text-white mt-1">PKR 75,000<span className="text-xs text-white/40 font-normal"> /mo</span></div>
                <p className="text-[10px] text-white/40 mt-1">For massive agencies requiring unlimited access and matching pipelines.</p>
              </div>

              <ul className="space-y-2 text-[11px] text-white/70 border-t border-white/5 pt-4">
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Unlimited active job listings</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Dedicated Talent Match Consultant</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Custom API and HRIS integrations</li>
                <li className="flex items-center gap-2"><Check size={12} className="text-[#22C55E]" /> Customizable candidate assessment gates</li>
              </ul>
            </div>
            <Link
              to="/auth/signup?role=EMPLOYER"
              className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold text-center border border-white/10 transition-all"
            >
              Choose Enterprise
            </Link>
          </div>
        </div>

        {/* ROI Cost Savings Calculator */}
        <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 grid md:grid-cols-2 gap-8 items-center shadow-xl">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calculator size={18} className="text-[#22C55E]" /> ROI Cost-Saving Calculator
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Recruitment is expensive. With SheEnableAI's semantic pipelines, you save dozens of manual filtering hours per candidate. Customize the sliders below to calculate your estimated quarterly cost savings.
            </p>

            {/* Sliders */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Quarterly Headcounts</span>
                  <span className="text-[#22C55E]">{headcount} hires</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={headcount}
                  onChange={(e) => setHeadcount(Number(e.target.value))}
                  className="w-full accent-[#22C55E]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Hours Saved per Hire</span>
                  <span className="text-[#22C55E]">{hoursSaved} hours</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="60"
                  value={hoursSaved}
                  onChange={(e) => setHoursSaved(Number(e.target.value))}
                  className="w-full accent-[#22C55E]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#1A0D1F] border border-white/5 p-6 rounded-2xl text-center space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Quarterly Cost Savings</span>
            <div className="text-3xl font-black text-[#22C55E]">
              PKR {totalSavings.toLocaleString()}
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Based on average recruiter wages of PKR {averageHourlyCost.toLocaleString()}/hr and automated AI candidate vetting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
