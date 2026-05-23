import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Download, Copy, Wand2, Check, Plus, Trash2, Sync, RefreshCw, Palette, Type, HelpCircle, Loader2 } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiAI, apiProfile } from "@/lib/api";
import { toast } from "sonner";

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
  const [notes, setNotes] = useState(
    "4 years React + TypeScript, AWS, MongoDB. Led a team of 4 at TechSolutions, shipping a dashboard used by 50k users."
  );
  const [saved, setSaved] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<"executive" | "modern" | "minimalist">("modern");
  const [accentColor, setAccentColor] = useState<string>("#7C3B6E"); // Lavender-ish default
  const [selectedTone, setSelectedTone] = useState<string>("executive");
  const [atsOptimize, setAtsOptimize] = useState<boolean>(true);

  // Editable CV State
  const [activeCv, setActiveCv] = useState<CV | null>(null);

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

  // Sync profileData or gen.data to activeCv
  useEffect(() => {
    if (gen.data) {
      setActiveCv(gen.data);
    } else if (profileData?.cv) {
      setActiveCv(profileData.cv);
    }
  }, [gen.data, profileData]);

  // Sync Theme Color dynamically with accent color if changed in Settings Modal
  useEffect(() => {
    const storedTheme = localStorage.getItem("dashboard-theme") || "lavender";
    if (storedTheme === "lavender") setAccentColor("#7C3B6E");
    else if (storedTheme === "emerald") setAccentColor("#3DAA7D");
    else if (storedTheme === "sunset") setAccentColor("#D4A24C");
    else if (storedTheme === "indigo") setAccentColor("#7C3AED");
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
    if (selectedTemplate === "executive") {
      return {
        fontFamily: "'Playfair Display', Georgia, serif",
        borderTop: `6px solid ${accentColor}`,
      };
    } else if (selectedTemplate === "minimalist") {
      return {
        fontFamily: "system-ui, sans-serif",
        borderTop: "1px solid #e2e8f0",
      };
    } else { // modern
      return {
        fontFamily: "'Inter', sans-serif",
        borderTop: `6px solid ${accentColor}`,
      };
    }
  };

  return (
    <DashboardShell
      title="Professional CV Builder"
      subtitle="Smart, AI-powered ATS resume compiler with direct in-line editing"
      actions={
        <>
          <BtnOutline
            onClick={() => {
              if (activeCv) {
                navigator.clipboard.writeText(JSON.stringify(activeCv, null, 2));
                toast.success("CV JSON copied to clipboard!");
              }
            }}
            disabled={!activeCv}
          >
            <Copy size={12} /> Copy JSON
          </BtnOutline>
          <BtnPrimary
            onClick={handleSave}
            disabled={!activeCv || saveMutation.isPending}
            className={saved ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-500" : ""}
          >
            {saved ? (
              <><Check size={12} /> Saved Successfully</>
            ) : saveMutation.isPending ? (
              <><Loader2 size={12} className="animate-spin" /> Saving...</>
            ) : (
              "Save to Profile"
            )}
          </BtnPrimary>
        </>
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
              <button
                type="button"
                onClick={handlePrepopulate}
                disabled={isProfileLoading}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2.5 py-1 rounded-full border border-primary/10 transition-colors"
              >
                <RefreshCw size={10} className={isProfileLoading ? "animate-spin" : ""} /> Sync from Profile
              </button>
            }
          >
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Background & Details</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  placeholder="e.g. 5 years marketing, led campaign for X brand, MBA from LUMS…"
                />
              </div>

              {/* Tone Selection */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Writing Tone</label>
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

                <div className="flex items-center pt-5">
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
                  <><Loader2 size={12} className="animate-spin" /> Compiling details...</>
                ) : (
                  <><Wand2 size={12} /> Compile Professional CV</>
                )}
              </BtnPrimary>
            </div>
          </SectionCard>

          {/* Style Customizer */}
          <SectionCard
            title="Visual Layout Theme"
            subtitle="Tailor your custom resume appearance"
          >
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Layout Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "modern", name: "Sleek Modern", icon: Type },
                    { id: "executive", name: "Executive Class", icon: Palette },
                    { id: "minimalist", name: "Clean Minimal", icon: HelpCircle }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTemplate(t.id as any)}
                      className={`py-2 px-1 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        selectedTemplate === t.id
                          ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                          : "border-border hover:border-primary/20 text-ink-500 hover:text-foreground"
                      }`}
                    >
                      <t.icon size={12} />
                      <span className="text-[9px] truncate">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Accent Color</label>
                <div className="flex gap-2">
                  {[
                    { hex: "#7C3B6E", name: "Lavender" },
                    { hex: "#3DAA7D", name: "Emerald" },
                    { hex: "#D4A24C", name: "Sunset" },
                    { hex: "#7C3AED", name: "Indigo" },
                    { hex: "#1E293B", name: "Slate" },
                    { hex: "#B91C1C", name: "Crimson" }
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setAccentColor(c.hex)}
                      className={`w-6 h-6 rounded-full border transition-all flex-shrink-0 flex items-center justify-center ${
                        accentColor === c.hex ? "ring-2 ring-primary ring-offset-2 border-transparent scale-105" : "border-border"
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.name}
                    >
                      {accentColor === c.hex && <Check size={10} className="text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Resume Optimization Guide">
            <ul className="text-[11px] text-muted-foreground space-y-2 leading-relaxed">
              <li>🎯 **ATS Friendly**: Single column ensures 99% ATS parsing rate.</li>
              <li>⚡ **Dynamic Editing**: Click on any section header or text to tweak directly!</li>
              <li>✔️ **Action Verbs**: AI formats achievements using actionable bullet sentences.</li>
              <li>📉 **Metrics**: Add quantifiable metrics (e.g. 50k users, +25% productivity).</li>
            </ul>
          </SectionCard>
        </div>

        {/* ── Preview panel ── */}
        <div className="lg:col-span-3">
          <SectionCard
            title="Interactive CV Preview"
            subtitle="Directly click and edit any field in real-time"
            actions={
              activeCv && (
                <BtnOutline onClick={handlePrint}>
                  <Download size={12} /> Download PDF
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
                      className="font-serif text-2xl text-foreground font-bold bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-full py-0.5 px-1 rounded transition-all print:hidden"
                      placeholder="Full Name"
                    />
                    <div className="hidden print:block font-serif text-2xl text-foreground font-bold">{activeCv.name}</div>

                    <input
                      type="text"
                      value={activeCv.title}
                      onChange={(e) => setActiveCv({ ...activeCv, title: e.target.value })}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-full py-0.5 px-1 rounded transition-all mt-1 print:hidden"
                      placeholder="Professional Title"
                    />
                    <div className="hidden print:block text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{activeCv.title}</div>

                    <div className="text-[10px] text-muted-foreground mt-2 flex gap-3 flex-wrap">
                      <input
                        type="text"
                        value={activeCv.email || ""}
                        onChange={(e) => setActiveCv({ ...activeCv, email: e.target.value })}
                        className="bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-[10px] py-0.5 px-1 rounded transition-all min-w-[140px] print:hidden"
                        placeholder="📧 email@example.com"
                      />
                      <span className="hidden print:inline text-[10px] text-muted-foreground">📧 {activeCv.email}</span>

                      <input
                        type="text"
                        value={activeCv.phone || ""}
                        onChange={(e) => setActiveCv({ ...activeCv, phone: e.target.value })}
                        className="bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-[10px] py-0.5 px-1 rounded transition-all min-w-[120px] print:hidden"
                        placeholder="📞 +1 (555) 000-0000"
                      />
                      <span className="hidden print:inline text-[10px] text-muted-foreground">📞 {activeCv.phone}</span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {activeCv.summary !== undefined && (
                  <Section heading="Professional Summary" accent={accentColor}>
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
                  <Section heading="Core Competencies" accent={accentColor}>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {activeCv.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-semibold inline-flex items-center gap-1 group/skill transition-all animate-fade-in"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => {
                              const newSkills = activeCv.skills?.filter((_, i) => i !== index);
                              setActiveCv({ ...activeCv, skills: newSkills });
                            }}
                            className="text-muted-foreground hover:text-red-500 font-bold ml-0.5 transition-colors opacity-60 group-hover/skill:opacity-100 print:hidden"
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
                  <Section heading="Professional Experience" accent={accentColor}>
                    {activeCv.experience.map((exp, i) => (
                      <div key={i} className="mb-4 last:mb-0 group/exp border border-transparent hover:border-border/30 hover:bg-secondary/10 p-2.5 rounded-xl transition-all relative">
                        {/* Experience Delete Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const newExp = activeCv.experience?.filter((_, idx) => idx !== i);
                            setActiveCv({ ...activeCv, experience: newExp });
                          }}
                          className="absolute top-2 right-2 p-1 text-ink-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover/exp:opacity-100 print:hidden"
                        >
                          <Trash2 size={12} />
                        </button>

                        <div className="flex items-baseline justify-between gap-3">
                          <input
                            type="text"
                            value={exp.title}
                            onChange={(e) => {
                              const newExp = [...(activeCv.experience || [])];
                              newExp[i] = { ...exp, title: e.target.value };
                              setActiveCv({ ...activeCv, experience: newExp });
                            }}
                            className="text-[13px] font-bold text-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-1/2 py-0.5 px-1 rounded transition-all print:hidden"
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
                            className="text-[10px] text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-right py-0.5 px-1 rounded transition-all w-1/3 print:hidden"
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
                          className="text-[11px] text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none w-1/2 py-0.5 px-1 rounded transition-all mt-0.5 print:hidden"
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
                                className="absolute right-0 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-red-500 opacity-0 group-hover/bullet:opacity-100 transition-all print:hidden"
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
                  <Section heading="Education" accent={accentColor}>
                    {activeCv.education.map((ed, i) => (
                      <div key={i} className="flex items-baseline justify-between gap-3 group/edu border border-transparent hover:border-border/30 hover:bg-secondary/10 p-2 rounded-lg transition-all relative mb-1.5 last:mb-0">
                        <div className="flex-1">
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
                        <div className="flex-1 flex gap-2 justify-end items-center pr-6">
                          <input
                            type="text"
                            value={ed.school}
                            onChange={(e) => {
                              const newEdu = [...(activeCv.education || [])];
                              newEdu[i] = { ...ed, school: e.target.value };
                              setActiveCv({ ...activeCv, education: newEdu });
                            }}
                            className="text-[11px] text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-right py-0.5 px-1 rounded transition-all w-[65%] print:hidden"
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
                            className="text-[11px] text-muted-foreground bg-transparent border-b border-transparent hover:border-border/30 focus:border-primary focus:outline-none text-right py-0.5 px-1 rounded transition-all w-[25%] print:hidden"
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
                          className="absolute top-1/2 -translate-y-1/2 right-1.5 p-0.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded transition-all opacity-0 group-hover/edu:opacity-100 print:hidden"
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

function Section({ heading, accent, children }: { heading: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 last:mb-0">
      <h3
        className="text-[10px] font-bold uppercase tracking-[1.5px] mb-2 border-b pb-1"
        style={{ color: accent, borderColor: `${accent}25` }}
      >
        {heading}
      </h3>
      {children}
    </div>
  );
}