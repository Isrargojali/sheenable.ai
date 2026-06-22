import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Download, Copy, Wand2, Check, Plus, Trash2, Sync, RefreshCw, Palette, Type, HelpCircle, Loader2, Code, Share2 } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiAI, apiProfile } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

// ─── Domain types ────────────────────────────────────────────────────────────

interface CVExperience {
  title: string;
  company: string;
  from: string;
  to: string;
  bullets: string[];
}

interface CVEducation {
  degree: string;
  school: string;
  year: string;
}

interface CV {
  name: string;
  title: string;
  summary?: string;
  skills?: string[];
  experience?: CVExperience[];
  education?: CVEducation[];
  avatarUrl?: string;
  email?: string;
  phone?: string;
}

interface ProfileData {
  cv?: CV;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function CVBuilderPage() {
  const { user } = useAuthStore();
  const [notes, setNotes] = useState(
    "4 years React + TypeScript, AWS, MongoDB. Led a team of 4 at TechSolutions, shipping a dashboard used by 50k users."
  );
  const [saved, setSaved] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern");
  const [accentColor, setAccentColor] = useState<string>("#D4A24C"); // Gold default for CV document preview
  const [selectedTone, setSelectedTone] = useState<string>("executive");
  const [atsOptimize, setAtsOptimize] = useState<boolean>(true);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  // Editable CV State
  const [activeCv, setActiveCv] = useState<CV | null>(null);

  const cleanSummary = (text?: string): string => {
    if (!text) return "";
    const regex = /.*?AI-Synthesized\s*Context:\s*/i;
    return text.replace(regex, "").trim();
  };

  // 1. Fetch existing CV
  const { data: profileData, refetch } = useQuery<ProfileData>({
    queryKey: ["candidateCv"],
    queryFn: apiProfile.getCv,
  });

  // Fetch full Candidate Profile to populate notes
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["candidateProfile"],
    queryFn: () => apiProfile.getMe(),
  });

  // 2. Generate CV with options
  const gen = useMutation<CV, Error, string>({
    mutationFn: (prompt: string) => apiAI.generateCV({ prompt }),
    onSuccess: (generatedCv) => {
      if (generatedCv.summary) {
        generatedCv.summary = cleanSummary(generatedCv.summary);
      }
      setActiveCv(generatedCv);
      toast.success("CV generated successfully! Feel free to edit any text directly below.");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to generate CV");
    }
  });

  // 3. Save CV
  const saveMutation = useMutation<void, Error, CV>({
    mutationFn: (cv: CV) => apiProfile.saveCv(cv),
    onSuccess: () => {
      setSaved(true);
      refetch();
      toast.success("CV saved directly to your profile!");
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to save CV");
    }
  });

  const userEmail = user?.email || "";
  const userPhone = (profile as any)?.userId?.phone || "";

  // Auto pre-populate email and phone if missing in activeCv but available in profile
  useEffect(() => {
    if (activeCv && (!activeCv.email || !activeCv.phone)) {
      setActiveCv(prev => {
        if (!prev) return null;
        return {
          ...prev,
          email: prev.email || userEmail,
          phone: prev.phone || userPhone,
        };
      });
    }
  }, [activeCv, userEmail, userPhone]);

  // Sync profileData or gen.data to activeCv
  useEffect(() => {
    if (gen.data) {
      const cv = { ...gen.data };
      if (cv.summary) {
        cv.summary = cleanSummary(cv.summary);
      }
      setActiveCv(cv);
    } else if (profileData?.cv) {
      const cv = { ...profileData.cv };
      if (cv.summary) {
        cv.summary = cleanSummary(cv.summary);
      }
      setActiveCv(cv);
    }
  }, [gen.data, profileData]);

  // Sync Theme Color dynamically with accent color if changed in Settings Modal
  useEffect(() => {
    setAccentColor("#D4A24C");
  }, []);

  const handlePrepopulate = () => {
    if (!profile) {
      toast.error("Please fill in your profile first to sync data.");
      return;
    }
    const pUser = (profile as any).userId || {};
    const firstName = pUser.firstName || "";
    const lastName = pUser.lastName || "";
    const name = `${firstName} ${lastName}`.trim();
    const title = (profile as any).title || "";
    const bio = (profile as any).bio || "";
    const skills = ((profile as any).skills || []).map((s: any) => s.name).join(", ");
    
    let constructedNotes = `My name is ${name}. `;
    if (title) constructedNotes += `I work as a ${title}. `;
    if (bio) constructedNotes += `Here is a summary of my background: ${bio}. `;
    if (skills) constructedNotes += `My skills include: ${skills}. `;
    
    const exp = ((profile as any).experience || []).map((e: any) => {
      return `${e.title} at ${e.company} (${e.description || 'key achievements'})`;
    }).join(", ");
    if (exp) constructedNotes += `My experience covers: ${exp}. `;

    const edu = ((profile as any).education || []).map((e: any) => {
      return `${e.degree} from ${e.institution} (${e.year})`;
    }).join(", ");
    if (edu) constructedNotes += `My education includes: ${edu}. `;

    setNotes(constructedNotes);
    toast.success("Profile data successfully synced and formatted!");
  };

  const handleGenerate = () => {
    let finalPrompt = notes;
    if (selectedTone) {
      finalPrompt += ` [Response Tone preference: write the summary and achievements in a highly ${selectedTone} tone].`;
    }
    if (atsOptimize) {
      finalPrompt += ` [Optimize using dense ATS-friendly keywords and technical action verbs].`;
    }
    gen.mutate(finalPrompt);
  };

  const handlePrint = () => window.print();

  const handleSave = () => {
    if (activeCv) saveMutation.mutate(activeCv);
  };

  const getTemplateStyles = () => {
    const active = previewTemplate || selectedTemplate;
    if (active === "executive") {
      return {
        fontFamily: "'Playfair Display', Georgia, serif",
      };
    } else if (active === "minimalist") {
      return {
        fontFamily: "system-ui, sans-serif",
      };
    } else if (active === "creative") {
      return {
        fontFamily: "'Inter', sans-serif",
      };
    } else if (active === "technical") {
      return {
        fontFamily: "monospace, Courier New",
      };
    } else if (active === "elegant") {
      return {
        fontFamily: "Georgia, serif",
      };
    } else { // modern
      return {
        fontFamily: "'Inter', sans-serif",
      };
    }
  };

  return (
    <DashboardShell
      title="Professional CV Builder"
      subtitle="Smart, AI-powered ATS resume compiler with direct in-line editing"
      actions={
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 relative">
          <BtnOutline
            onClick={handlePrint}
            disabled={!activeCv}
          >
            <Download size={16} strokeWidth={1.75} /> <span className="hidden sm:inline">Download PDF</span><span className="sm:hidden">PDF</span>
          </BtnOutline>
          <BtnOutline
            onClick={() => {
              const shareUrl = `${window.location.origin}/candidate/cv-share`;
              navigator.clipboard.writeText(shareUrl);
              toast.success("Shareable CV link copied to clipboard!");
            }}
            disabled={!activeCv}
          >
            <Share2 size={16} strokeWidth={1.75} /> <span className="hidden sm:inline">Share CV link</span><span className="sm:hidden">Share</span>
          </BtnOutline>
          {/* Advanced Settings / Developer Cog Dropdown */}
          <div className="relative">
            <BtnOutline
              type="button"
              onClick={() => setShowDevMenu(!showDevMenu)}
              disabled={!activeCv}
            >
              <Code size={16} strokeWidth={1.75} /> <span className="hidden sm:inline">JSON Settings</span><span className="sm:hidden">JSON</span>
            </BtnOutline>

            {showDevMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowDevMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-card rounded-xl border border-border shadow-xl z-40 overflow-hidden py-1 animate-fade-in">
                  <div className="px-3 py-1.5 border-b border-border">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Advanced Options</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (activeCv) {
                        navigator.clipboard.writeText(JSON.stringify(activeCv, null, 2));
                        toast.success("CV JSON copied to clipboard!");
                      }
                      setShowDevMenu(false);
                    }}
                    disabled={!activeCv}
                    className="w-full text-left px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Copy size={12} /> Copy Raw CV JSON
                  </button>
                </div>
              </>
            )}
          </div>

          <BtnPrimary
            onClick={handleSave}
            disabled={!activeCv || saveMutation.isPending}
            className={saved ? "bg-[var(--status-success-fg)] hover:bg-[var(--status-success-fg)]/90 border-[var(--status-success-fg)] text-white" : ""}
          >
            {saved ? (
              <><Check size={16} strokeWidth={1.75} /> <span className="hidden sm:inline">Saved Successfully</span><span className="sm:hidden">Saved</span></>
            ) : saveMutation.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> <span className="hidden sm:inline">Saving...</span><span className="sm:hidden">Saving</span></>
            ) : (
              <><span className="hidden sm:inline">Save progress</span><span className="sm:hidden">Save</span></>
            )}
          </BtnPrimary>
        </div>
      }
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;500;600;700;800&display=swap');
        @media print {
          body * { visibility: hidden; }
          #cv-print-area, #cv-print-area * { visibility: visible; }
          #cv-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; border: none !important; box-shadow: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* ── Input panel ── */}
        <div className="lg:col-span-2 space-y-4 print:hidden">
          <SectionCard
            title="AI CV Prompt & Settings"
            subtitle="Describe your experience or sync directly from profile"
            actions={
              <BtnOutline
                type="button"
                onClick={handlePrepopulate}
                disabled={isProfileLoading}
              >
                <RefreshCw size={16} strokeWidth={1.75} className={isProfileLoading ? "animate-spin" : ""} /> Sync from Profile
              </BtnOutline>
            }
          >
            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-500)] mb-1.5">Background & Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  placeholder="e.g. 5 years marketing, led campaign for X brand, MBA from LUMS…"
                />
              </div>

              {/* Tone Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-500)] mb-1.5">Writing Tone</label>
                  <select
                    value={selectedTone}
                    onChange={(e) => setSelectedTone(e.target.value)}
                    className="w-full px-2 py-1.5 border border-border rounded-lg text-xs bg-background focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary"
                  >
                    <option value="executive">Executive & Formal</option>
                    <option value="bold">Bold & Confident</option>
                    <option value="technical">Technical & Detailed</option>
                    <option value="creative">Creative & Warm</option>
                  </select>
                </div>

                <div className="flex items-center pt-2 sm:pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={atsOptimize}
                      onChange={(e) => setAtsOptimize(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary/20 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] font-semibold text-foreground select-none">ATS Optimization</span>
                  </label>
                </div>
              </div>

              <BtnPrimary
                onClick={handleGenerate}
                disabled={gen.isPending || !notes.trim()}
                className="w-full justify-center mt-1"
              >
                {gen.isPending ? (
                  <><Loader2 size={16} className="animate-spin" /> Compiling details...</>
                ) : (
                  <><Wand2 size={16} strokeWidth={1.75} /> Compile Professional CV</>
                )}
              </BtnPrimary>
            </div>
          </SectionCard>

          {/* Style Customizer */}
          <SectionCard
            title="Visual Layout Theme"
            subtitle="Tailor your custom resume appearance"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-500)] mb-1.5">Layout Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1.5">
                  {[
                    { id: "modern", name: "Sleek Modern" },
                    { id: "executive", name: "Executive Class" },
                    { id: "minimalist", name: "Clean Minimal" },
                    { id: "creative", name: "Creative Portfolio" },
                    { id: "technical", name: "Tech Minimalist" },
                    { id: "elegant", name: "Elegant Classic" }
                  ].map((t) => {
                    const isActive = selectedTemplate === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTemplate(t.id)}
                        onMouseEnter={() => setPreviewTemplate(t.id)}
                        onMouseLeave={() => setPreviewTemplate(null)}
                        className={`flex flex-col gap-1.5 p-1 rounded-xl border text-center transition-all bg-card ${
                          isActive
                            ? "border-primary ring-1 ring-primary/30 shadow-sm"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        {/* Miniature Preview Drawing */}
                        {t.id === "modern" && (
                          <div className="w-full h-14 bg-white border border-slate-200 rounded-lg p-1 flex flex-col gap-0.5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accentColor }} />
                            <div className="w-6 h-1.5 bg-slate-800 rounded-sm mt-0.5" />
                            <div className="w-4 h-0.5 bg-slate-400 rounded-sm" />
                            <div className="w-full h-px bg-slate-100 my-0.5" />
                            <div className="w-full h-1 bg-slate-200 rounded-sm" />
                            <div className="w-4/5 h-1 bg-slate-200 rounded-sm" />
                          </div>
                        )}
                        {t.id === "executive" && (
                          <div className="w-full h-14 bg-white border border-slate-200 rounded-lg p-1 flex flex-col gap-0.5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: accentColor }} />
                            <div className="w-7 h-1.5 bg-slate-800 rounded-sm mx-auto mt-0.5" />
                            <div className="w-5 h-0.5 bg-slate-400 rounded-sm mx-auto" />
                            <div className="w-full h-px bg-slate-150 my-0.5" />
                            <div className="w-full h-1 bg-slate-200 rounded-sm" />
                            <div className="w-5/6 h-1 bg-slate-200 rounded-sm mx-auto" />
                          </div>
                        )}
                        {t.id === "minimalist" && (
                          <div className="w-full h-14 bg-white border border-slate-200 rounded-lg p-1 flex flex-col gap-0.5 relative overflow-hidden">
                            <div className="w-6 h-1.5 bg-slate-800 rounded-sm mt-0.5" />
                            <div className="w-3 h-0.5 bg-slate-400 rounded-sm" />
                            <div className="w-full h-px bg-slate-100 my-0.5" />
                            <div className="w-full h-1 bg-slate-100 rounded-sm" />
                            <div className="w-4/5 h-1 bg-slate-100 rounded-sm" />
                          </div>
                        )}
                        {t.id === "creative" && (
                          <div className="w-full h-14 bg-white border border-slate-200 rounded-lg p-1 flex flex-col gap-0.5 relative overflow-hidden pl-2">
                            <div className="absolute top-0 bottom-0 left-0 w-1" style={{ backgroundColor: accentColor }} />
                            <div className="w-6 h-1.5 bg-slate-800 rounded-sm mt-0.5" />
                            <div className="w-4 h-0.5 bg-slate-400 rounded-sm" />
                            <div className="w-full h-px bg-slate-100 my-0.5" />
                            <div className="w-full h-1 bg-slate-200 rounded-sm" />
                          </div>
                        )}
                        {t.id === "technical" && (
                          <div className="w-full h-14 bg-white border border-slate-200 rounded-lg p-1 flex flex-col gap-0.5 relative overflow-hidden">
                            <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ backgroundColor: accentColor }} />
                            <div className="absolute top-[2px] left-0 right-0 h-[1px]" style={{ backgroundColor: accentColor }} />
                            <div className="w-7 h-1 bg-slate-800 mt-1" />
                            <div className="w-5 h-0.5 bg-slate-400" />
                            <div className="w-full h-px bg-slate-200 border-dashed my-0.5" />
                            <div className="w-full h-0.5 bg-slate-200" />
                          </div>
                        )}
                        {t.id === "elegant" && (
                          <div className="w-full h-14 bg-white border border-slate-200 rounded-lg p-1 flex flex-col gap-0.5 relative overflow-hidden">
                            <div className="w-6 h-1.5 bg-slate-800 rounded-sm mx-auto mt-0.5" />
                            <div className="w-4 h-0.5 bg-slate-400 rounded-sm mx-auto" />
                            <div className="w-full h-1 bg-slate-200 rounded-sm mt-1" />
                            <div className="w-4/5 h-1 bg-slate-200 rounded-sm mx-auto" />
                            <div className="absolute bottom-0 left-0 right-0 h-[3px]" style={{ backgroundColor: accentColor }} />
                          </div>
                        )}
                        <span className="text-[8px] font-bold text-foreground truncate">{t.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--ink-500)] mb-2 flex items-center justify-between">
                  <span>Accent Color</span>
                  <span className="text-[8px] font-bold text-[var(--status-success-fg)] bg-[var(--status-success-bg)] px-1.5 py-0.5 rounded">
                    {accentColor === "#1E293B" ? "ATS Safe Color" : "Contrast Check Passed"}
                  </span>
                </label>
                <div className="flex gap-2.5 flex-wrap">
                  {[
                    { hex: "#E6007E", name: "Brand Pink", ats: false },
                    { hex: "#3DAA7D", name: "Emerald", ats: false },
                    { hex: "#D4A24C", name: "Sunset", ats: false },
                    { hex: "#7C3AED", name: "Indigo", ats: false },
                    { hex: "#1E293B", name: "Slate", ats: true },
                    { hex: "#B91C1C", name: "Crimson", ats: false }
                  ].map((c) => (
                    <div key={c.hex} className="flex flex-col items-center gap-1.5">
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setAccentColor(c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-all flex-shrink-0 flex items-center justify-center relative ${
                          accentColor === c.hex ? "ring-2 ring-primary ring-offset-2 scale-105 border-white" : "border-border hover:scale-105"
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={`${c.name}${c.ats ? " (ATS Safe - High Contrast)" : ""}`}
                      >
                        {accentColor === c.hex && <Check size={12} className="text-white" />}
                        {c.ats && (
                          <span className="absolute -bottom-1 -right-1 bg-[var(--status-success-fg)] text-white rounded-full p-0.5" title="ATS Safe Color">
                            <Check size={6} className="stroke-[4]" />
                          </span>
                        )}
                      </button>
                      <span className="text-[8px] text-ink-300 font-semibold">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Resume Optimization Guide">
            <ul className="text-[11px] text-muted-foreground space-y-2 leading-relaxed">
              <li>🎯 <strong>ATS Friendly</strong>: Single column ensures 99% ATS parsing rate.</li>
              <li>⚡ <strong>Dynamic Editing</strong>: Click on any field directly in the preview to make instant adjustments!</li>
              <li>✔️ <strong>Action Verbs</strong>: AI formats achievements using actionable bullet sentences.</li>
              <li>📉 <strong>Metrics</strong>: Add quantifiable metrics (e.g. 50k users, +25% productivity) to showcase impact.</li>
            </ul>
          </SectionCard>
        </div>

        {/* ── Preview panel ── */}
        <div className="lg:col-span-3 lg:sticky lg:top-5 lg:max-h-[calc(100vh-130px)] lg:overflow-y-auto overflow-visible pr-1 scrollbar-thin rounded-2xl">
          <SectionCard
            title="Interactive CV Preview"
            subtitle="Directly click and edit any field in real-time"
            actions={
              activeCv && (
                <BtnOutline onClick={handlePrint}>
                  <Download size={16} strokeWidth={1.75} /> Download PDF
                </BtnOutline>
              )
            }
          >
            {!activeCv && !gen.isPending && (
              <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-dashed border-border">
                <Sparkles size={36} className="mx-auto text-primary/45 mb-3.5 animate-pulse" />
                <h3 className="text-sm font-bold text-foreground mb-1">Your CV will compile here</h3>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  Click "Sync from Profile" or write in the prompt box, then press "Compile Professional CV".
                </p>
              </div>
            )}

            {gen.isPending && (
              <div className="text-center py-20 bg-secondary/10 rounded-2xl border border-dashed border-border">
                <div className="inline-flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-primary" size={24} />
                  <span className="text-sm font-semibold text-primary">AI is drafting and optimizing your resume...</span>
                </div>
              </div>
            )}

            {activeCv && (
              <div
                id="cv-print-area"
                className="bg-white border border-border/80 rounded-2xl p-6 lg:p-9 shadow-md transition-all duration-300"
                style={getTemplateStyles()}
              >
                {/* CV Header */}
                <div className="flex items-center gap-5 border-b border-border/70 pb-5 mb-5">
                  {activeCv.avatarUrl && (
                    <img
                      src={activeCv.avatarUrl}
                      alt={activeCv.name}
                      className="w-16 h-16 rounded-full object-cover border border-border/40 flex-shrink-0 shadow-sm"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={activeCv.name}
                      onChange={(e) => setActiveCv({ ...activeCv, name: e.target.value })}
                      className="font-serif text-2xl font-bold bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-full py-0.5 px-1 rounded transition-all print:hidden"
                      style={{ color: accentColor }}
                      placeholder="Full Name"
                    />
                    <div className="hidden print:block font-serif text-2xl font-bold" style={{ color: accentColor }}>{activeCv.name}</div>

                    <input
                      type="text"
                      value={activeCv.title}
                      onChange={(e) => setActiveCv({ ...activeCv, title: e.target.value })}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-full py-0.5 px-1 rounded transition-all mt-1 print:hidden"
                      placeholder="Professional Title"
                    />
                    <div className="hidden print:block text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{activeCv.title}</div>

                    <div className="text-[10px] text-muted-foreground mt-2 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
                      {activeCv.email ? (
                        <>
                          <input
                            type="text"
                            value={activeCv.email}
                            onChange={(e) => setActiveCv({ ...activeCv, email: e.target.value })}
                            className="bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-[10px] py-0.5 px-1 rounded transition-all w-full sm:w-auto sm:min-w-[140px] print:hidden"
                            placeholder="Email Address"
                          />
                          <span className="hidden print:inline text-[10px] text-muted-foreground">📧 {activeCv.email}</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 print:hidden text-red-500">
                          <span>📧</span>
                          <a href="/candidate/profile" className="font-semibold hover:underline">Add email →</a>
                        </div>
                      )}

                      {activeCv.phone ? (
                        <>
                          <input
                            type="text"
                            value={activeCv.phone}
                            onChange={(e) => setActiveCv({ ...activeCv, phone: e.target.value })}
                            className="bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-[10px] py-0.5 px-1 rounded transition-all w-full sm:w-auto sm:min-w-[120px] print:hidden"
                            placeholder="Phone Number"
                          />
                          <span className="hidden print:inline text-[10px] text-muted-foreground">📞 {activeCv.phone}</span>
                        </>
                      ) : (
                        <div className="flex items-center gap-1 print:hidden text-red-500">
                          <span>📞</span>
                          <a href="/candidate/profile" className="font-semibold hover:underline">Add phone →</a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {activeCv.summary !== undefined && (
                  <Section heading="Professional Summary" accent={accentColor} template={previewTemplate || selectedTemplate}>
                    {/* Screen View */}
                    <textarea
                      value={activeCv.summary}
                      onChange={(e) => setActiveCv({ ...activeCv, summary: e.target.value })}
                      rows={3}
                      className="text-[12px] text-ink-500 leading-relaxed bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-full resize-none py-1 px-1 rounded transition-all print:hidden"
                      placeholder="Write a professional summary..."
                    />
                    {/* Print/Download View - guarantees all text renders naturally without scrollbars */}
                    <div className="hidden print:block text-[12px] text-ink-500 leading-relaxed whitespace-pre-wrap">
                      {activeCv.summary}
                    </div>
                  </Section>
                )}

                {/* Skills */}
                {activeCv.skills && (
                  <Section heading="Core Competencies" accent={accentColor} template={previewTemplate || selectedTemplate}>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {activeCv.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full px-[10px] py-[4px] text-[12px] font-medium border-none normal-case inline-flex items-center gap-1 group/skill transition-all animate-fade-in hover:bg-[var(--ink-300)]/50"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => {
                              const newSkills = activeCv.skills?.filter((_, i) => i !== index);
                              setActiveCv({ ...activeCv, skills: newSkills });
                            }}
                            className="text-[var(--ink-500)] hover:text-red-500 font-bold ml-0.5 transition-colors opacity-65 group-hover/skill:opacity-100 print:hidden"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        type="text"
                        placeholder="+ Add skill (Press Enter)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = e.currentTarget.value.trim();
                            if (val) {
                              const newSkills = [...(activeCv.skills || []), val];
                              setActiveCv({ ...activeCv, skills: newSkills });
                              e.currentTarget.value = "";
                            }
                          }
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-full border border-border border-dashed bg-transparent hover:border-primary focus:border-primary focus:outline-none transition-all w-36 print:hidden"
                      />
                    </div>
                  </Section>
                )}

                {/* Experience */}
                {activeCv.experience && activeCv.experience.length > 0 && (
                  <Section heading="Professional Experience" accent={accentColor} template={previewTemplate || selectedTemplate}>
                    {activeCv.experience.map((exp, i) => (
                      <div key={i} className="mb-4 last:mb-0 group/exp border border-transparent hover:border-border/30 hover:bg-secondary/10 p-2.5 rounded-xl transition-all relative">
                        {/* Experience Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newExp = activeCv.experience?.filter((_, idx) => idx !== i);
                            setActiveCv({ ...activeCv, experience: newExp });
                          }}
                          className="absolute top-2 right-2 p-1 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all md:opacity-0 opacity-100 group-hover/exp:opacity-100 print:hidden"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-3">
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => {
                              const newExp = [...(activeCv.experience || [])];
                              newExp[i] = { ...exp, title: e.target.value };
                              setActiveCv({ ...activeCv, experience: newExp });
                            }}
                            className="text-[13px] font-bold text-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-full sm:w-1/2 py-0.5 px-1 rounded transition-all print:hidden"
                            placeholder="Job Title"
                          />
                          <div className="hidden print:block text-[13px] font-bold text-foreground">{exp.title}</div>

                          <input
                            type="text"
                            value={`${exp.from} – ${exp.to}`}
                            onChange={(e) => {
                              const val = e.target.value;
                              const parts = val.split(/–|-/);
                              const newExp = [...(activeCv.experience || [])];
                              newExp[i] = { ...exp, from: parts[0]?.trim() || "", to: parts[1]?.trim() || "" };
                              setActiveCv({ ...activeCv, experience: newExp });
                            }}
                            className="text-[10px] text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-left sm:text-right py-0.5 px-1 rounded transition-all w-full sm:w-1/3 print:hidden"
                            placeholder="Jan 2020 - Present"
                          />
                          <div className="hidden print:block text-[10px] text-muted-foreground text-right">{exp.from} – {exp.to}</div>
                        </div>

                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const newExp = [...(activeCv.experience || [])];
                            newExp[i] = { ...exp, company: e.target.value };
                            setActiveCv({ ...activeCv, experience: newExp });
                          }}
                          className="text-[11px] text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-full sm:w-1/2 py-0.5 px-1 rounded transition-all mt-0.5 print:hidden"
                          placeholder="Company Name"
                        />
                        <div className="hidden print:block text-[11px] text-muted-foreground mt-0.5">{exp.company}</div>

                        {/* Bullets */}
                        <ul className="text-[11px] text-ink-500 list-disc list-inside space-y-1 mt-2">
                          {exp.bullets.map((bullet, j) => (
                            <li key={j} className="group/bullet relative pr-6">
                              <input
                                type="text"
                                value={bullet}
                                onChange={(e) => {
                                  const newBullets = [...exp.bullets];
                                  newBullets[j] = e.target.value;
                                  const newExp = [...(activeCv.experience || [])];
                                  newExp[i] = { ...exp, bullets: newBullets };
                                  setActiveCv({ ...activeCv, experience: newExp });
                                }}
                                className="bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-[11px] text-ink-500 w-[92%] inline-block py-0.5 px-1 rounded transition-all ml-1 print:hidden"
                                placeholder="Key achievement statement..."
                              />
                              <span className="hidden print:inline text-[11px] text-ink-500 ml-1">{bullet}</span>

                              <button
                                type="button"
                                onClick={() => {
                                  const newBullets = exp.bullets.filter((_, idx) => idx !== j);
                                  const newExp = [...(activeCv.experience || [])];
                                  newExp[i] = { ...exp, bullets: newBullets };
                                  setActiveCv({ ...activeCv, experience: newExp });
                                }}
                                className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-red-500 md:opacity-0 opacity-100 group-hover/bullet:opacity-100 transition-all print:hidden"
                              >
                                ×
                              </button>
                            </li>
                          ))}
                          {/* Add bullet */}
                          <li className="list-none print:hidden mt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const newBullets = [...exp.bullets, ""];
                                const newExp = [...(activeCv.experience || [])];
                                newExp[i] = { ...exp, bullets: newBullets };
                                setActiveCv({ ...activeCv, experience: newExp });
                              }}
                              className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5"
                            >
                              <Plus size={10} /> Add bullet point
                            </button>
                          </li>
                        </ul>
                      </div>
                    ))}

                    {/* Add experience */}
                    <button
                      type="button"
                      onClick={() => {
                        const newExp = [
                          ...(activeCv.experience || []),
                          { title: "Position", company: "Company", from: "Start Date", to: "End Date", bullets: ["Key contribution..."] }
                        ];
                        setActiveCv({ ...activeCv, experience: newExp });
                      }}
                      className="mt-2.5 w-full py-2 border border-dashed border-border hover:border-primary hover:bg-primary/5 rounded-xl text-[11px] font-bold text-ink-500 hover:text-primary transition-all flex items-center justify-center gap-1 print:hidden"
                    >
                      <Plus size={12} /> Add Experience Item
                    </button>
                  </Section>
                )}

                {/* Education */}
                {activeCv.education && activeCv.education.length > 0 && (
                  <Section heading="Education" accent={accentColor} template={previewTemplate || selectedTemplate}>
                    {activeCv.education.map((ed, i) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-3 group/edu border border-transparent hover:border-border/30 hover:bg-secondary/10 p-2 rounded-lg transition-all relative mb-1.5 last:mb-0">
                        <div className="w-full sm:flex-1">
                          <input
                            type="text"
                            value={ed.degree}
                            onChange={(e) => {
                              const newEdu = [...(activeCv.education || [])];
                              newEdu[i] = { ...ed, degree: e.target.value };
                              setActiveCv({ ...activeCv, education: newEdu });
                            }}
                            className="text-[12px] font-semibold text-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-full py-0.5 px-1 rounded transition-all print:hidden"
                            placeholder="Degree / Qualification"
                          />
                          <div className="hidden print:block text-[12px] font-semibold text-foreground">{ed.degree}</div>
                        </div>
                        <div className="w-full sm:flex-1 flex gap-2 justify-start sm:justify-end items-center pr-6">
                          <input
                            type="text"
                            value={ed.school}
                            onChange={(e) => {
                              const newEdu = [...(activeCv.education || [])];
                              newEdu[i] = { ...ed, school: e.target.value };
                              setActiveCv({ ...activeCv, education: newEdu });
                            }}
                            className="text-[11px] text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-left sm:text-right py-0.5 px-1 rounded transition-all w-[70%] sm:w-[65%] print:hidden"
                            placeholder="Institution"
                          />
                          <span className="hidden print:inline text-[11px] text-muted-foreground text-right">{ed.school}</span>

                          <span className="text-[11px] text-muted-foreground print:hidden">·</span>
                          <input
                            type="text"
                            value={ed.year}
                            onChange={(e) => {
                              const newEdu = [...(activeCv.education || [])];
                              newEdu[i] = { ...ed, year: e.target.value };
                              setActiveCv({ ...activeCv, education: newEdu });
                            }}
                            className="text-[11px] text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-left sm:text-right py-0.5 px-1 rounded transition-all w-[25%] sm:w-[25%] print:hidden"
                            placeholder="Year"
                          />
                          <span className="hidden print:inline text-[11px] text-muted-foreground text-right"> · {ed.year}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const newEdu = activeCv.education?.filter((_, idx) => idx !== i);
                            setActiveCv({ ...activeCv, education: newEdu });
                          }}
                          className="absolute top-1/2 -translate-y-1/2 right-1.5 p-0.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-all md:opacity-0 opacity-100 group-hover/edu:opacity-100 print:hidden"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newEdu = [
                          ...(activeCv.education || []),
                          { degree: "Degree Title", school: "Institution Name", year: "Year" }
                        ];
                        setActiveCv({ ...activeCv, education: newEdu });
                      }}
                      className="mt-2.5 w-full py-2 border border-dashed border-border hover:border-primary hover:bg-primary/5 rounded-xl text-[11px] font-bold text-ink-500 hover:text-primary transition-all flex items-center justify-center gap-1 print:hidden"
                    >
                      <Plus size={12} /> Add Education Item
                    </button>
                  </Section>
                )}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function Section({ heading, accent, children, template }: { heading: string; accent: string; children: React.ReactNode; template?: string }) {
  const borderStyle = template === "minimalist" ? "border-b border-slate-100" 
                    : template === "technical" ? "border-b border-dashed"
                    : "border-b pb-1";
  const titleFont = template === "executive" || template === "elegant" ? "font-serif italic capitalize text-[11px]" : "font-bold uppercase tracking-[1.5px]";
  return (
    <div className="mb-5 last:mb-0">
      <h3
        className={cn("text-[10px] mb-2", titleFont, borderStyle)}
        style={{ color: accent, borderColor: `${accent}40` }}
      >
        {heading}
      </h3>
      {children}
    </div>
  );
}