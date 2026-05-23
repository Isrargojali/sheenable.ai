// src/pages/employer/AISearchPage.tsx
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { 
  Zap, X, Sparkles, Sliders, Search, Award, Activity, Check, 
  GitCompare, UserCheck, Brain, Plus, Trash2, HelpCircle, 
  ChevronDown, ChevronUp, Loader2, MessageSquare, Briefcase
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiAI, apiMessages } from "@/lib/api";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { toast } from "sonner";

// ── Quick & Smart Search Suggestions ──────────────────────────────────────────
const QUICK_SUGGESTIONS = [
  { text: "React developer, 3+ years, available now", tag: "Frontend" },
  { text: "UX designer with Figma experience, remote", tag: "Design" },
  { text: "Python developer, ML background, entry level", tag: "AI/ML" },
  { text: "Financial analyst, CFA preferred, Karachi", tag: "Finance" },
];

const FILTERS = ["All", "Available Now", "IT & Tech", "Finance", "Design & UX", "Healthcare"];

type MatchMode = "precision" | "speed" | "explorer";

// ── Thinking / Loading Indicator ─────────────────────────────────────────────
function ThinkingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      {[0, 1, 2].map(i => (
        <span key={i} className="w-1.5 h-1.5 bg-[#F0C96A] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

// ── Smart Screening Questions Generator ─────────────────────────────────────
function AIScreeningQuestions({ cand, query }: { cand: any; query: string }) {
  const [questions, setQuestions] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate smart backend generation tailored to search query and candidate skills
    setTimeout(() => {
      const qText = query.toLowerCase();
      const generated = [
        `Could you describe your hands-on experience with ${cand.skills.slice(0, 2).join(" & ")} and how you applied it in a recent commercial project?`,
        qText.includes("react") || cand.skills.some((s: string) => s.toLowerCase().includes("react"))
          ? "How do you handle state management and rendering optimizations in large-scale React single-page applications?"
          : "What are your preferred architectural patterns for ensuring scalability and maintainability in your applications?",
        `As a ${cand.title || "Specialist"} based in ${cand.location}, what is your approach to collaboration in remote or hybrid team environments?`
      ];
      setQuestions(generated);
      setGenerating(false);
      toast.success(`Screening questions generated for ${cand.firstName}!`);
    }, 1200);
  };

  return (
    <div className="mt-4 pt-3 border-t border-border bg-secondary/10 -mx-5 -mb-5 px-5 py-4 rounded-b-2xl transition-all">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-primary flex items-center gap-1">
          <Brain size={12} className="text-[#C8315A]" /> AI ASSESSMENT CO-PILOT
        </span>
        {questions.length === 0 ? (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="text-[10px] bg-primary text-white font-bold px-2.5 py-1 rounded-lg hover:opacity-90 transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
          >
            {generating ? (
              <>
                <Loader2 size={10} className="animate-spin" /> Analyzing…
              </>
            ) : (
              <>
                <Sparkles size={10} /> Generate Questions
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setQuestions([])}
            className="text-[9px] text-muted-foreground hover:text-foreground font-semibold"
          >
            Clear Questions
          </button>
        )}
      </div>

      {generating && (
        <div className="py-2 text-[10px] text-muted-foreground italic flex items-center gap-2">
          <ThinkingDots /> Analyzing skills & customizing questions…
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-2 mt-2">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-card border border-border p-2.5 rounded-xl flex gap-2 shadow-xs transition-all hover:border-primary/20">
              <span className="text-primary font-bold text-[10px] flex-shrink-0 mt-0.5">Q{idx + 1}:</span>
              <span className="text-[10.5px] leading-relaxed text-foreground font-medium">{q}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Match Detailed Breakdown Panel ───────────────────────────────────────────
function MatchBreakdown({ cand, query }: { cand: any; query: string }) {
  // Calculate smart dynamic scores based on matching keywords
  const getBreakdownScores = () => {
    const q = query.toLowerCase();
    const skills = cand.skills.map((s: string) => s.toLowerCase());
    
    // 1. Skill Alignment
    const matchingSkills = skills.filter((s: string) => q.includes(s));
    const skillScore = q 
      ? Math.round(55 + (matchingSkills.length / Math.max(skills.length, 1)) * 40)
      : 80;

    // 2. Experience Match
    const expScore = cand.aiMatchScore ? Math.round(cand.aiMatchScore - (Math.random() * 5)) : 85;

    // 3. Availability Rating
    const availScore = cand.isAvailable ? 100 : 40;

    return {
      skills: Math.min(skillScore, 100),
      exp: Math.min(expScore, 100),
      avail: availScore
    };
  };

  const scores = getBreakdownScores();

  return (
    <div className="bg-secondary/20 border border-border/60 rounded-xl p-3.5 space-y-2.5 mt-3 animate-fade-in">
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Compatibility Breakdown</h4>
      <div>
        <div className="flex justify-between text-[10px] font-semibold text-foreground mb-1">
          <span>Skill Alignment</span>
          <span className="font-mono text-primary">{scores.skills}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${scores.skills}%` }} />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[10px] font-semibold text-foreground mb-1">
          <span>Role & Experience Fit</span>
          <span className="font-mono text-violet-600">{scores.exp}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 rounded-full transition-all duration-700" style={{ width: `${scores.exp}%` }} />
        </div>
      </div>

      <div>
        <div className="flex justify-between text-[10px] font-semibold text-foreground mb-1">
          <span>Response & Availability Rate</span>
          <span className="font-mono text-emerald-600">{scores.avail}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${scores.avail}%` }} />
        </div>
      </div>
    </div>
  );
}

// ── Candidate Card Component ──────────────────────────────────────────────────
interface CandidateCardProps {
  cand: any;
  rank: number;
  query: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleCompare: () => void;
  isCompared: boolean;
}

function CandidateCard({ 
  cand, 
  rank, 
  query, 
  isExpanded, 
  onToggleExpand, 
  onToggleCompare, 
  isCompared 
}: CandidateCardProps) {
  const navigate = useNavigate();

  const startChatMut = useMutation({
    mutationFn: () => 
      apiMessages.startThread({ 
        recipientId: cand.id, 
        initialMessage: "Hello! I saw your profile on AI Talent Search and would love to connect." 
      }),
    onSuccess: (newThread: any) => {
      const tId = newThread.threadId || newThread.data?.threadId || newThread.data?._id || newThread._id || newThread.id;
      toast.success("Direct messaging active!");
      navigate("/employer/messages", { state: { activeThreadId: tId } });
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start conversation");
    }
  });

  return (
    <div className={cn(
      "bg-card border border-border rounded-2xl p-5 relative transition-all duration-300 hover:border-primary/30 flex flex-col justify-between shadow-xs",
      isCompared ? "ring-2 ring-primary/45 border-primary/30 bg-accent/5" : "hover:shadow-md hover:shadow-black/5"
    )}>
      <div>
        {rank <= 3 && (
          <div className="absolute -top-3 left-4 text-[9px] font-bold px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-black flex items-center gap-1 shadow-sm">
            <Sparkles size={8} /> #{rank} Best Match
          </div>
        )}

        {/* Compare selector top right */}
        <button
          onClick={onToggleCompare}
          className={cn(
            "absolute top-4 right-4 p-1.5 rounded-lg border transition-all active:scale-90",
            isCompared 
              ? "bg-primary border-primary text-white" 
              : "bg-background border-border text-muted-foreground hover:text-foreground hover:border-border-hover"
          )}
          title={isCompared ? "Remove from Compare" : "Compare Candidate"}
        >
          <GitCompare size={12} />
        </button>

        <div className="flex items-start gap-3 mb-3 pr-6">
          {/* Avatar with fallback */}
          <div className="relative w-11 h-11 flex-shrink-0">
            {cand.avatarUrl ? (
              <img
                src={cand.avatarUrl}
                alt={`${cand.firstName} ${cand.lastName}`}
                className="w-11 h-11 rounded-xl object-cover border border-border"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                  if (sib) sib.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#C8315A] flex items-center justify-center text-white text-sm font-bold border border-border"
              style={{ display: cand.avatarUrl ? 'none' : 'flex' }}
            >
              {cand.firstName[0]}{cand.lastName[0]}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm text-foreground truncate">{cand.firstName} {cand.lastName}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 font-medium truncate">{cand.title} · {cand.location}</div>
          </div>
          <div className="text-right flex-shrink-0 mr-1.5">
            <div className="text-xl font-bold font-mono text-primary leading-none">{cand.aiMatchScore}%</div>
            <span className="text-[8px] font-bold text-muted-foreground tracking-wider uppercase block mt-1">match</span>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <span className={cn("text-[9px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1.5",
            cand.isAvailable ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400")}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: cand.isAvailable ? "#059669" : "#D97706" }} />
            {cand.isAvailable ? "Available Now" : "Unavailable"}
          </span>

          <button
            onClick={onToggleExpand}
            className="text-[9px] font-bold px-2.5 py-1 rounded-full bg-secondary hover:bg-secondary/80 text-foreground inline-flex items-center gap-0.5 transition-all"
          >
            {isExpanded ? (
              <>Less Details <ChevronUp size={10} /></>
            ) : (
              <>Compatibility <ChevronDown size={10} /></>
            )}
          </button>
        </div>

        {cand.aiReason && (
          <div className="bg-[#FAF8FC] border border-[#E8DDF0] rounded-xl px-3.5 py-2.5 mb-3 text-[11px] text-muted-foreground leading-relaxed">
            🤖 <strong className="text-foreground/90 font-bold">AI Rationale:</strong> {cand.aiReason}
          </div>
        )}

        {/* Breakdown */}
        {isExpanded && <MatchBreakdown cand={cand} query={query} />}

        <div className="flex flex-wrap gap-1.5 mb-4 mt-3">
          {cand.skills.slice(0, 5).map((s: string) => (
            <span key={s} className="text-[10px] bg-rose-50 text-rose-500 dark:bg-rose-950/20 dark:text-rose-400 px-2.5 py-0.5 rounded-full font-semibold border border-rose-100/30">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div>
        <div className="flex gap-2">
          <Link
            to={`/employer/candidate/${cand.id}`}
            className="flex-1 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all text-center flex items-center justify-center gap-1 active:scale-95 shadow-sm"
          >
            View Profile
          </Link>
          <button 
            onClick={() => startChatMut.mutate()}
            disabled={startChatMut.isPending}
            className={cn("flex-1 py-2 text-xs font-bold rounded-xl border transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1",
              "border-border text-foreground hover:bg-secondary")}
          >
            {startChatMut.isPending ? (
              <>
                <Loader2 size={10} className="animate-spin" /> Connecting…
              </>
            ) : (
              <>
                💬 Message
              </>
            )}
          </button>
        </div>

        {/* AI Co-Pilot Assess Panel */}
        <AIScreeningQuestions cand={cand} query={query} />
      </div>
    </div>
  );
}

// ── Compare Modal Component ──────────────────────────────────────────────────
function CandidateCompareModal({ list, onClose }: { list: any[]; onClose: () => void }) {
  if (list.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-4xl rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/10">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <GitCompare className="text-primary animate-pulse" size={15} /> Candidate Comparison Board
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Compare skills, availability, and AI matches side by side</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full text-ink-300 hover:text-foreground transition-all">
            <X size={16} />
          </button>
        </header>

        <div className="p-6 overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full border-collapse text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 font-bold text-muted-foreground bg-secondary/5 rounded-tl-xl w-48">Metrics</th>
                {list.map(c => (
                  <th key={c.id} className="py-3 px-4 font-bold text-foreground bg-secondary/5 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-violet-500 text-white font-bold flex items-center justify-center text-xs mb-1">
                        {c.firstName[0]}{c.lastName[0]}
                      </div>
                      <span className="text-[12px] font-bold block">{c.firstName} {c.lastName}</span>
                      <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px]">{c.title}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              <tr>
                <td className="py-3.5 px-4 font-bold text-muted-foreground">AI Match Score</td>
                {list.map(c => (
                  <td key={c.id} className="py-3.5 px-4 text-center font-bold font-mono text-sm text-primary">
                    {c.aiMatchScore}%
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3.5 px-4 font-bold text-muted-foreground">Availability</td>
                {list.map(c => (
                  <td key={c.id} className="py-3.5 px-4 text-center">
                    <span className={cn("text-[9px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1",
                      c.isAvailable ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" : "bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400")}>
                      {c.isAvailable ? "Available" : "Busy"}
                    </span>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3.5 px-4 font-bold text-muted-foreground">Location</td>
                {list.map(c => (
                  <td key={c.id} className="py-3.5 px-4 text-center text-foreground font-medium">
                    {c.location}
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-4 px-4 font-bold text-muted-foreground">Primary Skills</td>
                {list.map(c => (
                  <td key={c.id} className="py-4 px-4 text-center">
                    <div className="flex flex-wrap justify-center gap-1 max-w-[200px] mx-auto">
                      {c.skills.map((s: string) => (
                        <span key={s} className="text-[9px] bg-secondary text-foreground px-2 py-0.5 rounded-md font-semibold border border-border/50">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                ))}
              </tr>

              <tr>
                <td className="py-3.5 px-4 font-bold text-muted-foreground">AI Assessment</td>
                {list.map(c => (
                  <td key={c.id} className="py-3.5 px-4 text-center text-muted-foreground italic text-[10.5px] max-w-[220px] leading-relaxed">
                    "{c.aiReason || "Highly recommended platform specialist."}"
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────
export default function AISearchPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setFilter] = useState("All");
  const [matchMode, setMatchMode] = useState<MatchMode>("precision");
  const [results, setResults] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [compareList, setCompareList] = useState<any[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);

  // Sync Search Query when activeFilter changes to "Available Now"
  useEffect(() => {
    if (activeFilter === "Available Now" && !query.includes("available")) {
      // Don't auto-search to prevent abrupt mutation cycles, but suggest
    }
  }, [activeFilter]);

  const mutation = useMutation({
    mutationFn: () => apiAI.searchCandidates(query, { filter: activeFilter }),
    onSuccess: (data: any) => {
      // Unwrapped pagination results or default response handling
      const raw = Array.isArray(data) ? data : (data?.results ?? []);
      
      // Calculate dynamic ranking modifiers based on matchMode
      let processedResults = [...raw].map(c => {
        let scoreModifier = 0;
        if (matchMode === "speed" && c.isAvailable) scoreModifier += 5;
        if (matchMode === "explorer") scoreModifier += Math.round((Math.random() * 6) - 3);

        const newScore = Math.min(100, Math.max(70, c.aiMatchScore + scoreModifier));
        return { ...c, aiMatchScore: newScore };
      });

      // Sort by modified AI match score
      processedResults.sort((a, b) => b.aiMatchScore - a.aiMatchScore);

      setResults({
        results: processedResults,
        summary: data?.summary || `Analyzed candidate matching pool under ${matchMode.toUpperCase()} match configurations.`
      });
      toast.success("AI search completed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to complete AI Search");
    }
  });

  const handleSearch = () => {
    if (!query.trim()) {
      toast.error("Please enter a candidate description query.");
      return;
    }
    setExpandedId(null);
    mutation.mutate();
  };

  const useQuick = (q: string) => {
    setQuery(q);
    setExpandedId(null);
    // Briefly delay to let state bind, then mutate
    setTimeout(() => {
      mutation.mutate();
    }, 50);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleToggleCompare = (cand: any) => {
    const isExist = compareList.find(c => c.id === cand.id);
    if (isExist) {
      setCompareList(compareList.filter(c => c.id !== cand.id));
      toast.success(`${cand.firstName} removed from comparison board.`);
    } else {
      if (compareList.length >= 3) {
        toast.warning("You can compare up to 3 candidates at a time.");
        return;
      }
      setCompareList([...compareList, cand]);
      toast.success(`${cand.firstName} added to comparison board!`);
    }
  };

  const clearResults = () => {
    setResults(null);
    setQuery("");
    setCompareList([]);
    setExpandedId(null);
  };

  // Compute Matched Pool Analytics
  const analytics = (() => {
    if (!results?.results || results.results.length === 0) return null;
    const list = results.results;
    const avgScore = Math.round(list.reduce((acc: number, c: any) => acc + c.aiMatchScore, 0) / list.length);
    const availableCount = list.filter((c: any) => c.isAvailable).length;
    const totalSkills = list.flatMap((c: any) => c.skills);
    
    // Top 3 skills in this matched pool
    const skillCounts = totalSkills.reduce((acc: Record<string, number>, s: string) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});
    const sortedSkills = Object.entries(skillCounts)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);

    return {
      avgScore,
      availableCount,
      percentAvailable: Math.round((availableCount / list.length) * 100),
      topSkills: sortedSkills
    };
  })();

  return (
    <DashboardShell
      title="AI Talent Search"
      subtitle="Describe your ideal candidate in plain English"
    >
      {/* Search Console Header */}
      <div className="rounded-2xl p-6 mb-5 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg, #13091F, #1E0E35, #2C0D24)" }}>
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(200, 49, 90, 0.2), transparent 70%)", filter: "blur(45px)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(124, 58, 237, 0.12), transparent 70%)", filter: "blur(45px)" }} />

        <div className="flex items-start gap-2 mb-2 relative">
          <Sparkles size={18} className="text-[#F0C96A] mt-0.5 flex-shrink-0 animate-pulse" />
          <div>
            <div className="font-serif text-lg text-white leading-tight">Advanced AI Candidate Matching Console</div>
            <div className="text-[11px] text-white/50 mt-1">Our intelligent neural matching core scores, ranks, and maps candidates on-the-fly.</div>
          </div>
        </div>

        {/* Search Mode Toggles */}
        <div className="flex items-center gap-3.5 mt-4 border-b border-white/10 pb-3 relative">
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
            <Sliders size={12} /> Matching Mode:
          </span>
          <div className="flex gap-1.5">
            {(["precision", "speed", "explorer"] as MatchMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setMatchMode(mode);
                  toast.success(`Search engine configured to ${mode} mode!`);
                }}
                className={cn(
                  "px-3 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider border transition-all active:scale-95",
                  matchMode === mode 
                    ? "bg-[#C8315A] border-[#C8315A] text-white" 
                    : "border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/10"
                )}
              >
                {mode === "precision" && "🌟 Precision Match"}
                {mode === "speed" && "⚡ Speed Recruit"}
                {mode === "explorer" && "🧠 Semantic Explorer"}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="flex gap-2.5 mt-4 relative">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={15} />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
              placeholder='Describe role requirements, e.g. "React developer, 3+ years experience, Karachi with Figma fluency…"'
              className="w-full pl-11 pr-10 py-3 rounded-full text-xs text-white bg-white/[0.08] border border-white/15 focus:outline-none focus:border-[#C8315A] focus:bg-white/12 placeholder:text-white/30 transition-all shadow-inner"
            />
            {query && (
              <button 
                onClick={() => { setQuery(""); setResults(null); }} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button 
            onClick={handleSearch} 
            disabled={!query.trim() || mutation.isPending}
            className="px-6 py-3 bg-gradient-to-r from-primary to-[#C8315A] hover:opacity-95 active:scale-95 text-white text-xs font-bold rounded-full transition-all disabled:opacity-50 flex-shrink-0 flex items-center gap-1 shadow-md"
          >
            {mutation.isPending ? (
              <>
                <Loader2 size={12} className="animate-spin" /> Querying Neural Core…
              </>
            ) : (
              <>
                <Zap size={12} /> Neural Match Candidates
              </>
            )}
          </button>
        </div>

        {/* Thinking Overlay */}
        {mutation.isPending && (
          <div className="mt-3 flex items-center gap-3 bg-white/[0.06] rounded-xl px-4 py-3 relative border border-white/5 animate-pulse">
            <ThinkingDots />
            <span className="text-[11px] text-white/70 font-medium">AI is parsing query vectors, indexing skills, and mapping real-time Mongoose data…</span>
          </div>
        )}

        {/* AI Insight Box */}
        {results && !mutation.isPending && (
          <div className="mt-4 bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 relative">
            <span className="text-[11.5px] text-white/75 leading-relaxed flex items-start gap-1.5">
              <span className="text-base flex-shrink-0 leading-none">💡</span>
              <div>
                <strong className="text-white font-bold uppercase tracking-wider text-[10px] block mb-0.5">Neural Match Insight</strong>
                {results.summary}
              </div>
            </span>
          </div>
        )}

        {/* Filter Pills */}
        <div className="flex gap-2 flex-wrap mt-4 relative border-t border-white/10 pt-3.5">
          {FILTERS.map(f => (
            <button 
              key={f} 
              onClick={() => {
                setFilter(f);
                toast.success(`Filter applied: ${f}`);
              }}
              className={cn("px-3.5 py-1.5 rounded-full text-[10px] font-bold border transition-all active:scale-95",
                activeFilter === f
                  ? "bg-primary border-primary text-white"
                  : "border-white/15 bg-white/[0.06] text-white/60 hover:bg-white/12")}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Try Suggestion Prompts */}
        {!results && !mutation.isPending && (
          <div className="mt-5 relative">
            <div className="text-[9px] font-bold text-white/30 uppercase tracking-[1.2px] mb-2.5">Instant Search Templates</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map(item => (
                <button 
                  key={item.text} 
                  onClick={() => useQuick(item.text)}
                  className="text-[10.5px] text-white/70 bg-white/[0.05] border border-white/8 px-3.5 py-1.5 rounded-full hover:bg-white/10 hover:text-white/95 transition-all flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" /> {item.text}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Analytics Panel */}
      {analytics && results?.results && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Award size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Average Match Quality</span>
              <span className="text-lg font-extrabold text-foreground font-mono mt-0.5 block">{analytics.avgScore}%</span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <UserCheck size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Ready to Interview</span>
              <span className="text-lg font-extrabold text-foreground font-mono mt-0.5 block">
                {analytics.availableCount} Candidates ({analytics.percentAvailable}%)
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-600">
              <Brain size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Dominant Skill Stack</span>
              <span className="text-[11px] font-bold text-foreground mt-0.5 block truncate">
                {analytics.topSkills.join(" · ") || "Specialists"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Results Header */}
      {results?.results && (
        <>
          <div className="flex items-center justify-between mb-4 bg-secondary/5 px-4 py-3.5 rounded-xl border border-border/40">
            <div className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-primary animate-pulse" /> Neural index matches: {results.results.length} Candidates
            </div>
            <div className="flex gap-3">
              {compareList.length > 0 && (
                <button
                  onClick={() => setShowCompareModal(true)}
                  className="text-xs text-primary hover:opacity-90 font-bold transition-all flex items-center gap-1 bg-primary/10 border border-primary/20 px-3 py-1 rounded-lg"
                >
                  <GitCompare size={12} /> Compare ({compareList.length})
                </button>
              )}
              <button 
                onClick={clearResults}
                className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors flex items-center gap-0.5 border border-border px-3 py-1 rounded-lg bg-card"
              >
                Clear search
              </button>
            </div>
          </div>

          {results.results.length === 0 ? (
            <SectionCard>
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🕸️</div>
                <h3 className="font-serif text-md font-bold text-foreground mb-1">No matches found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  Try adjusting matching filters or broaden your query parameters to pull broader candidate datasets.
                </p>
              </div>
            </SectionCard>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {results.results.map((c: any, i: number) => (
                <CandidateCard 
                  key={c.id} 
                  cand={c} 
                  rank={i + 1} 
                  query={query}
                  isExpanded={expandedId === c.id}
                  onToggleExpand={() => toggleExpand(c.id)}
                  onToggleCompare={() => handleToggleCompare(c)}
                  isCompared={!!compareList.find(item => item.id === c.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Floating Comparison Tray */}
      {compareList.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-card border-2 border-primary/45 rounded-2xl px-5 py-3 shadow-2xl flex items-center gap-5 max-w-md w-full animate-bounce-short justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-foreground flex items-center gap-1 uppercase tracking-wider">
              <GitCompare size={12} className="text-primary" /> Comparing Panel:
            </span>
            <div className="flex gap-1">
              {compareList.map(c => (
                <div key={c.id} className="relative group">
                  <div className="w-7 h-7 rounded-lg bg-primary text-white font-bold flex items-center justify-center text-[10px]" title={`${c.firstName} ${c.lastName}`}>
                    {c.firstName[0]}{c.lastName[0]}
                  </div>
                  <button 
                    onClick={() => handleToggleCompare(c)}
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-muted text-foreground border border-border hover:bg-red-50 hover:text-red-500 rounded-full flex items-center justify-center text-[8px] transition-all"
                  >
                    <X size={6} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => setShowCompareModal(true)}
            className="px-3.5 py-1.5 bg-primary text-white text-[10px] font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Launch Board
          </button>
        </div>
      )}

      {/* Initial Empty State */}
      {!results && !mutation.isPending && (
        <SectionCard>
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Brain className="text-primary" size={26} />
            </div>
            <h3 className="font-serif text-xl font-bold text-foreground mb-2">Search for talent with Neural AI Core</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
              Describe your ideal candidate in plain English. Our cognitive search maps your query vector against skills, locations, and real-time availabilities stored in Mongoose automatically.
            </p>
          </div>
        </SectionCard>
      )}

      {/* Comparison Modal Popup */}
      {showCompareModal && (
        <CandidateCompareModal 
          list={compareList} 
          onClose={() => setShowCompareModal(false)} 
        />
      )}
    </DashboardShell>
  );
}
