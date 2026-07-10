import React, { useState } from "react";
import { toast } from "sonner";
import { Download, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Heart, FileText, Check, File } from "lucide-react";
import { Link } from "react-router-dom";
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
      highlighted = highlighted.replace(regex, `<span class="px-1.5 py-0.5 rounded bg-amber-100 border border-amber-200 text-amber-955 font-semibold">${word}</span>`);
    });

    // Highlight feminine terms
    FEMININE_WORDS.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      highlighted = highlighted.replace(regex, `<span class="px-1.5 py-0.5 rounded bg-[var(--brand-pink-tint)] border border-[var(--brand-pink)]/20 text-[var(--brand-pink)] font-semibold">${word}</span>`);
    });

    return highlighted;
  };

  return (
    <div className="min-h-screen bg-[var(--surface-dark)] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Hero Section */}
      <section className="bg-[var(--surface-dark)] text-white py-16">
        <div className="relative max-w-[1200px] mx-auto px-6 text-center max-w-2xl space-y-3">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            DEI & <span className="italic text-[var(--brand-pink)]">Inclusion Center</span>
          </h2>
          <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed">
            Free high-impact toolkits, hiring frameworks, and modern interactive utilities built to remove unconscious bias and foster inclusive team structures in Pakistan.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <main className="flex-1 bg-[var(--surface-dark)] text-white py-12">
        <div className="max-w-[1200px] mx-auto w-full px-6 space-y-12">
          {/* Decoder Workspace Grid */}
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            {/* Left Panel */}
            <div className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] p-8 space-y-4 shadow-xl flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sparkles size={18} className="text-[var(--brand-pink)]" /> Job Spec Gender Decoder
                </h3>
                <p className="text-xs text-[var(--text-on-dark-mute)] leading-relaxed">
                  Pasted job descriptions can contain gender-coded terms that unconsciously alienate qualified candidates. Paste your spec draft below to decode it instantly.
                </p>

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  placeholder="Paste your job description draft here... (e.g. We are looking for an ambitious leader who is competitive and loves analytical challenges...)"
                  className="w-full bg-white/5 border border-[var(--border-dark)] rounded-[var(--radius-input)] p-4 text-xs text-[var(--text-on-dark)] placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 resize-none transition-all min-h-[240px]"
                />
              </div>

              <button
                onClick={handleDecode}
                className="w-full h-12 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-1.5 mt-4"
              >
                Analyze Inclusion Score
              </button>
            </div>

            {/* Right Panel */}
            <div className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] p-8 shadow-xl flex flex-col justify-center min-h-[380px]">
              {!analyzed ? (
                <div className="text-center py-20 text-[var(--text-on-dark-mute)] flex flex-col items-center gap-2 rounded-xl">
                  <AlertCircle size={32} strokeWidth={1.5} className="text-[var(--text-on-dark-mute)]" />
                  <div className="text-base font-semibold text-[var(--text-on-dark)]">Results appear here after analysis</div>
                  <p className="text-xs text-[var(--text-on-dark-mute)] max-w-xs mx-auto">Fill in your text spec and click analyze to see coded term highlights.</p>
                </div>
              ) : (
                /* Analyzed results */
                <div className="space-y-6 animate-fade-in text-[var(--text-on-dark)]">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-on-dark-mute)]">Inclusion Index Score</span>
                      <div className="text-2xl font-black text-[var(--brand-pink)] mt-0.5">{score}%</div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-on-dark-mute)]">Verdict</span>
                      <div className="text-xs font-bold text-[var(--text-on-dark)] mt-0.5">{getVerdict()}</div>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--brand-pink)]" style={{ width: `${score}%` }} />
                  </div>

                  {/* Highlighting viewer */}
                  <div className="border border-[var(--border-dark)] bg-[var(--surface-dark)] p-4 rounded-xl space-y-2">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-on-dark-mute)] mb-1 border-b border-[var(--border-dark)] pb-1">Coded Highlighting</div>
                    <div
                      className="text-xs text-[var(--text-on-dark)] leading-relaxed whitespace-pre-wrap select-none"
                      dangerouslySetInnerHTML={{ __html: getHighlightedText() }}
                    />
                  </div>

                  {/* Match Details */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-amber-200">
                      <span className="text-[8px] font-bold uppercase text-amber-400">Masculine-Coded Terms</span>
                      <div className="text-xs font-black text-white mt-0.5">{mascMatches.length} found</div>
                      <p className="text-[9px] text-[var(--text-on-dark-mute)] mt-1 leading-snug">Can alienate she-talent cohorts.</p>
                    </div>

                    <div className="p-3 bg-[var(--brand-pink-tint)]/10 border border-[var(--brand-pink)]/20 rounded-xl text-[var(--brand-pink)]">
                      <span className="text-[8px] font-bold uppercase text-[var(--brand-pink)]">Feminine-Coded Terms</span>
                      <div className="text-xs font-black text-white mt-0.5">{femMatches.length} found</div>
                      <p className="text-[9px] text-[var(--text-on-dark-mute)] mt-1 leading-snug">Encourages diverse candidate matches.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Resources Cards section */}
          <div className="space-y-6">
            <div className="border-b border-[var(--border-dark)] pb-3">
              <h3 className="text-base font-semibold text-[var(--text-on-dark)] flex items-center gap-2">
                <FileText size={16} strokeWidth={1.75} className="text-[var(--text-on-dark-mute)]" /> DEI Recruitment Resources & Templates
              </h3>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {/* Card 1 */}
              <div className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] hover:border-[var(--brand-pink)]/30 rounded-[var(--radius-card)] p-6 flex justify-between items-center shadow-xl transition-all duration-300">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 bg-white/8 border border-[var(--border-dark)] text-[var(--text-on-dark-mute)] text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    <FileText size={12} className="text-[var(--text-on-dark-mute)]" /> PDF GUIDE
                  </span>
                  <h4 className="text-base font-semibold text-[var(--text-on-dark)] mt-1">Gender-Neutral Hiring Checklist</h4>
                  <p className="text-xs text-[var(--text-on-dark-mute)]">Step-by-step blueprint to construct inclusive job specs and interview loops.</p>
                </div>
                <button
                  onClick={() => toast.success("Inclusive Hiring Checklist PDF download started successfully!")}
                  className="w-9 h-9 rounded-full border border-[var(--border-dark)] hover:bg-white/5 flex items-center justify-center text-[var(--text-on-dark-mute)] transition-all flex-shrink-0"
                >
                  <Download size={14} />
                </button>
              </div>

              {/* Card 2 */}
              <div className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] hover:border-[var(--brand-pink)]/30 rounded-[var(--radius-card)] p-6 flex justify-between items-center shadow-xl transition-all duration-300">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1 bg-white/8 border border-[var(--border-dark)] text-[var(--text-on-dark-mute)] text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full">
                    <File size={12} className="text-[var(--text-on-dark-mute)]" /> DOC TEMPLATE
                  </span>
                  <h4 className="text-base font-semibold text-[var(--text-on-dark)] mt-1">DEI Policy Template for Startups</h4>
                  <p className="text-xs text-[var(--text-on-dark-mute)]">Standard corporate policy framework to integrate equity guidelines in teams.</p>
                </div>
                <button
                  onClick={() => toast.success("DEI Policy Template download started successfully!")}
                  className="w-9 h-9 rounded-full border border-[var(--border-dark)] hover:bg-white/5 flex items-center justify-center text-[var(--text-on-dark-mute)] transition-all flex-shrink-0"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
