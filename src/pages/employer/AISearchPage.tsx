// src/pages/employer/AISearchPage.tsx
import { useState }       from "react";
import { useMutation }    from "@tanstack/react-query";
import { Link }           from "react-router-dom";
import { Zap, X }         from "lucide-react";
import { cn }             from "@/lib/utils";
import { apiAI }          from "@/lib/api";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";

const QUICK = [
  "React developer, 3+ years, available now",
  "UX designer with Figma experience, remote",
  "Financial analyst, CFA preferred, Karachi",
  "Python developer, ML background, entry level",
];

const FILTERS = ["All", "Available Now", "IT & Tech", "Finance", "Design & UX", "Healthcare"];

function ThinkingDots() {
  return (
    <span className="inline-flex gap-1 items-center">
      {[0,1,2].map(i => (
        <span key={i} className="w-1.5 h-1.5 bg-[#F0C96A] rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
      ))}
    </span>
  );
}

function CandidateCard({ cand, rank }: { cand: any; rank: number }) {
  const [msgSent, setMsgSent] = useState(false);

  return (
    <div className="bg-white border border-[#E8E1F0] rounded-2xl p-5 relative hover:border-[#D4CBE8] hover:shadow-md hover:shadow-black/5 transition-all">
      {rank <= 2 && (
        <div className="absolute -top-3 left-4 text-[9px] font-bold px-3 py-1 rounded-full"
             style={{ background: "linear-gradient(135deg,#C09030,#F0C96A)", color: "#0F0B1A" }}>
          #{rank} Best Match
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        {/* Avatar: real photo with initials fallback */}
        <div className="relative w-11 h-11 flex-shrink-0">
          {cand.avatarUrl && (
            <img
              src={cand.avatarUrl}
              alt={`${cand.firstName} ${cand.lastName}`}
              className="w-11 h-11 rounded-xl object-cover absolute inset-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                const sib = e.currentTarget.nextElementSibling as HTMLElement | null;
                if (sib) sib.style.display = 'flex';
              }}
            />
          )}
          <div
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-sm font-bold"
            style={{ display: cand.avatarUrl ? 'none' : 'flex' }}
          >
            {cand.firstName[0]}{cand.lastName[0]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-[#0F0B1A]">{cand.firstName} {cand.lastName}</div>
          <div className="text-[11px] text-[#6B6480] mt-0.5">{cand.title} · {cand.location}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-xl font-bold font-mono text-emerald-600">{cand.aiMatchScore}%</div>
          <div className="text-[9px] text-[#A89EC0] mt-0.5">match</div>
        </div>
      </div>

      <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1 mb-3",
        cand.isAvailable ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: cand.isAvailable ? "#059669" : "#D97706" }} />
        {cand.isAvailable ? "Available Now" : "Busy"}
      </span>

      {cand.aiReason && (
        <div className="bg-rose-50 rounded-xl px-3 py-2 mb-3 text-[11px] italic text-[#6B6480] leading-relaxed">
          🤖 {cand.aiReason}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {cand.skills.slice(0, 4).map((s: string) => (
          <span key={s} className="text-[10px] bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full font-semibold">{s}</span>
        ))}
      </div>

      <div className="h-1.5 bg-rose-100 rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all duration-700"
             style={{ width: `${cand.aiMatchScore}%` }} />
      </div>

      <div className="flex gap-2">
        <Link
          to={`/employer/candidate/${cand.id}`}
          className="flex-1 py-2 bg-rose-500 text-white text-xs font-bold rounded-full hover:bg-rose-600 transition-colors text-center"
        >
          View Profile
        </Link>
        <button onClick={() => setMsgSent(true)}
                className={cn("flex-1 py-2 text-xs font-bold rounded-full border transition-all",
                  msgSent ? "bg-emerald-50 border-emerald-200 text-emerald-600 cursor-default"
                          : "border-[#E8E1F0] text-[#6B6480] hover:border-teal-400 hover:text-teal-600")}>
          {msgSent ? "Message Sent ✓" : "💬 Message"}
        </button>
      </div>
    </div>
  );
}

export default function AISearchPage() {
  const [query,      setQuery]  = useState("");
  const [activeFilter, setFilter] = useState("All");
  const [results,    setResults] = useState<any>(null);

  const mutation = useMutation({
    mutationFn: () => apiAI.searchCandidates(query, { filter: activeFilter }),
    onSuccess: data => setResults(data),
  });

  function handleSearch() {
    if (!query.trim()) return;
    mutation.mutate();
  }

  function useQuick(q: string) {
    setQuery(q);
    setTimeout(() => mutation.mutate(), 10);
  }

  return (
    <DashboardShell
      title="AI Talent Search"
      subtitle="Describe your ideal candidate in plain English"
    >
      {/* AI search box */}
      <div className="rounded-2xl p-6 mb-5 relative overflow-hidden"
           style={{ background: "linear-gradient(135deg,#13091F,#1E0E35,#2C0D24)" }}>
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle,rgba(200,49,90,.18),transparent 65%)", filter: "blur(40px)" }} />

        <div className="flex items-start gap-2 mb-1 relative">
          <Zap size={16} className="text-[#F0C96A] mt-0.5 flex-shrink-0" />
          <div>
            <div className="font-serif text-lg text-white leading-tight">Natural Language Talent Search</div>
            <div className="text-[11px] text-white/50 mt-0.5">Our AI parses your query and ranks candidates automatically</div>
          </div>
        </div>

        <div className="flex gap-2.5 mt-4 relative">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            placeholder='"React developer, 3+ years, available now, strong communication…"'
            className="flex-1 px-4 py-2.5 rounded-full text-sm text-white bg-white/[0.08] border border-white/15 focus:outline-none focus:border-[rgba(240,201,106,.5)] focus:bg-white/12 placeholder:text-white/30 transition-all"
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults(null); }} className="absolute right-[110px] top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
              <X size={13} />
            </button>
          )}
          <button onClick={handleSearch} disabled={!query.trim() || mutation.isPending}
                  className="px-5 py-2.5 bg-rose-500 text-white text-xs font-bold rounded-full hover:bg-rose-600 transition-colors disabled:opacity-50 flex-shrink-0">
            {mutation.isPending ? <ThinkingDots /> : "Search AI"}
          </button>
        </div>

        {/* Thinking state */}
        {mutation.isPending && (
          <div className="mt-3 flex items-center gap-3 bg-white/[0.06] rounded-xl px-4 py-3 relative">
            <ThinkingDots />
            <span className="text-[11px] text-white/60">AI is analyzing {query} and ranking candidates…</span>
          </div>
        )}

        {/* AI insight */}
        {results && !mutation.isPending && (
          <div className="mt-3 bg-white/[0.07] border border-white/10 rounded-xl px-4 py-3 relative">
            <span className="text-[11px] text-white/70 leading-relaxed">💡 <strong className="text-white/90">AI Insight:</strong> {results.summary}</span>
          </div>
        )}

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap mt-4 relative">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
                    className={cn("px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all",
                      activeFilter === f
                        ? "bg-rose-500 border-rose-500 text-white"
                        : "border-white/15 bg-white/[0.06] text-white/60 hover:bg-white/12")}>
              {f}
            </button>
          ))}
        </div>

        {/* Quick searches */}
        {!results && !mutation.isPending && (
          <div className="mt-5 relative">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-[.8px] mb-2">Try these searches</div>
            <div className="flex flex-wrap gap-2">
              {QUICK.map(q => (
                <button key={q} onClick={() => useQuick(q)}
                        className="text-[11px] text-white/60 bg-white/[0.05] border border-white/10 px-3 py-1.5 rounded-full hover:bg-white/10 hover:text-white/80 transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results?.results && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-bold text-[#0F0B1A]">
              {results.results.length} candidates matched
            </div>
            <button onClick={() => setResults(null)}
                    className="text-xs text-rose-500 hover:text-rose-600 font-semibold transition-colors">
              Clear results
            </button>
          </div>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.results.map((c: any, i: number) => (
              <CandidateCard key={c.id} cand={c} rank={i + 1} />
            ))}
          </div>
        </>
      )}

      {/* Empty / initial state */}
      {!results && !mutation.isPending && (
        <SectionCard>
          <div className="py-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-serif text-xl text-[#0F0B1A] mb-2">Search for talent with AI</h3>
            <p className="text-sm text-[#6B6480] max-w-md mx-auto leading-relaxed">
              Type a natural language description of your ideal candidate. AI will parse filters, score all available candidates, and rank results by fit.
            </p>
          </div>
        </SectionCard>
      )}
    </DashboardShell>
  );
}
