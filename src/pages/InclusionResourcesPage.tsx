import React, { useState } from "react";
import { Download, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Heart, FileText, Check } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

// Lists of gender-coded terms
const MASCULINE_WORDS = ["leader", "competitive", "dominant", "analytics", "decisive", "champion", "independent", "ambitious", "challenge", "objective", "assertive", "opinionated"];
const FEMININE_WORDS = ["collaboration", "understand", "support", "dependable", "nurture", "connection", "interpersonal", "helpful", "empathy", "share", "communal", "inclusive"];

export default function InclusionResourcesPage() {
  const [text, setText] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [mascMatches, setMascMatches] = useState<string[]>([]);
  const [femMatches, setFemMatches] = useState<string[]>([]);
  const [score, setScore] = useState(100);

  const handleDecode = () => {
    if (!text.trim()) return;

    const tokens = text.toLowerCase().split(/[\s,.\-;:?!()]+/);
    const foundMasc = tokens.filter(t => MASCULINE_WORDS.includes(t));
    const foundFem = tokens.filter(t => FEMININE_WORDS.includes(t));

    setMascMatches(foundMasc);
    setFemMatches(foundFem);

    // Calculate score
    const totalCoded = foundMasc.length + foundFem.length;
    if (totalCoded === 0) {
      setScore(100);
    } else {
      const balance = Math.abs(foundMasc.length - foundFem.length);
      const calculatedScore = Math.max(0, Math.min(100, 100 - (balance * 12)));
      setScore(calculatedScore);
    }
    setAnalyzed(true);
  };

  const getVerdict = () => {
    if (mascMatches.length === 0 && femMatches.length === 0) return "Fully Neutral & Inclusive";
    const diff = mascMatches.length - femMatches.length;
    if (diff > 2) return "Masculine-skewed Coded";
    if (diff < -2) return "Feminine-skewed Coded";
    return "Neutral / Highly Inclusive balance";
  };

  const getHighlightedText = () => {
    if (!text) return "";
    let highlighted = text;
    
    // Highlight masculine terms
    MASCULINE_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      highlighted = highlighted.replace(regex, `<span class="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold">${word}</span>`);
    });

    // Highlight feminine terms
    FEMININE_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      highlighted = highlighted.replace(regex, `<span class="px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 text-purple-300 font-bold">${word}</span>`);
    });

    return highlighted;
  };

  return (
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Main Container */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-12">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            DEI & <span className="text-[#22C55E]">Inclusion Center</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Free high-impact toolkits, hiring frameworks, and modern interactive utilities built to remove unconscious bias and foster inclusive team structures in Pakistan.
          </p>
        </div>

        {/* Decoder Workspace Grid */}
        <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 grid md:grid-cols-2 gap-8 items-start shadow-xl">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-[#22C55E]" /> Job Spec Gender Decoder
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Pasted job descriptions can contain gender-coded terms that unconsciously alienate qualified candidates. Paste your spec draft below to decode it instantly.
            </p>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder="Paste your job description draft here... (e.g. We are looking for an ambitious leader who is competitive and loves analytical challenges...)"
              className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl p-4 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#22C55E] resize-none"
            />

            <button
              onClick={handleDecode}
              className="w-full py-3 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all shadow-lg flex items-center justify-center gap-1.5"
            >
              Analyze Inclusion Score
            </button>
          </div>

          <div className="bg-[#1A0D1F] border border-white/5 p-6 rounded-2xl space-y-6">
            {!analyzed ? (
              <div className="text-center py-20 text-white/30 flex flex-col items-center gap-2 border border-dashed border-white/5 rounded-xl">
                <AlertCircle size={32} className="text-white/20" />
                <div className="text-xs font-bold">Results appear here after analysis</div>
                <p className="text-[10px] text-white/20 max-w-xs mx-auto">Fill in your text spec and click analyze to see coded term highlights.</p>
              </div>
            ) : (
              /* Analyzed results */
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Inclusion Index Score</span>
                    <div className="text-2xl font-black text-[#22C55E] mt-0.5">{score}%</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Verdict</span>
                    <div className="text-xs font-bold text-white mt-0.5">{getVerdict()}</div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="h-2 bg-[#0F0A1A] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-[#22C55E]" style={{ width: `${score}%` }} />
                </div>

                {/* Highlighting viewer */}
                <div className="border border-white/5 bg-[#0F0A1A] p-4 rounded-xl space-y-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-white/40 mb-1 border-b border-white/5 pb-1">Coded Highlighting</div>
                  <div
                    className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap select-none"
                    dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
                  />
                </div>

                {/* Match Details */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                    <span className="text-[8px] font-bold uppercase text-amber-400">Masculine-Coded Terms</span>
                    <div className="text-xs font-black text-white mt-0.5">{mascMatches.length} found</div>
                    <p className="text-[9px] text-white/30 mt-1 leading-snug">Can alienate she-talent cohorts.</p>
                  </div>

                  <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                    <span className="text-[8px] font-bold uppercase text-purple-400">Feminine-Coded Terms</span>
                    <div className="text-xs font-black text-white mt-0.5">{femMatches.length} found</div>
                    <p className="text-[9px] text-white/30 mt-1 leading-snug">Encourages diverse candidate matches.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Resources Cards section */}
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText size={16} className="text-[#22C55E]" /> DEI Recruitment Resources & Templates
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-5 flex justify-between items-center shadow-lg hover:border-white/10 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-[9px] bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] font-bold px-2 py-0.5 rounded">PDF GUIDE</span>
                <h4 className="text-xs font-bold text-white mt-1">Gender-Neutral Hiring Checklist</h4>
                <p className="text-[10px] text-white/40">Step-by-step blueprint to construct inclusive job specs and interview loops.</p>
              </div>
              <button
                onClick={() => toast.success("Inclusive Hiring Checklist PDF download started successfully!")}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
              >
                <Download size={14} />
              </button>
            </div>

            <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-5 flex justify-between items-center shadow-lg hover:border-white/10 transition-all duration-300">
              <div className="space-y-1">
                <span className="text-[9px] bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold px-2 py-0.5 rounded">DOC TEMPLATE</span>
                <h4 className="text-xs font-bold text-white mt-1">DEI Policy Template for Startups</h4>
                <p className="text-[10px] text-white/40">Standard corporate policy framework to integrate equity guidelines in teams.</p>
              </div>
              <button
                onClick={() => toast.success("DEI Policy Template download started successfully!")}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
              >
                <Download size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
