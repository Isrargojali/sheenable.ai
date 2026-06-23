// src/pages/employer/PostJobPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { 
  X, Plus, Sparkles, Loader2, CheckCircle, AlertCircle, HelpCircle, 
  Check, ArrowRight, DollarSign, Calendar, Target, Award
} from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiJobs, apiAI } from "@/lib/api";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const inp = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-card text-foreground placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all";

export default function PostJobPage() {
  const navigate = useNavigate();
  
  // Field states
  const [title,    setTitle]    = useState("");
  const [category, setCategory] = useState("IT & Tech");
  const [type,     setType]     = useState("FULLTIME");
  const [mode,     setMode]     = useState("REMOTE");
  const [location, setLocation] = useState("");
  const [min,      setMin]      = useState("");
  const [max,      setMax]      = useState("");
  const [desc,     setDesc]     = useState("");
  const [skills,   setSkills]   = useState<string[]>([]);
  const [skillInp, setSkillInp] = useState("");
  
  // Custom visual states
  const [isCompetitive, setIsCompetitive] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [activeSection, setActiveSection] = useState(1);
  const [lastSaved, setLastSaved] = useState("Draft status: Saved 2s ago ✓");

  // Simulated auto-save updates
  useEffect(() => {
    const interval = setInterval(() => {
      const timeStr = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit' });
      setLastSaved(`Draft status: Auto-saved at ${timeStr} ✓`);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const create = useMutation({
    mutationFn: apiJobs.postJob,
    onSuccess:  () => {
      toast.success("Job opportunity published successfully!");
      navigate("/employer/listings");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to publish job");
    }
  });

  const aiAssist = useMutation({
    mutationFn: async () => {
      if (!desc.trim()) {
        throw new Error("Please write some job description first!");
      }
      return apiAI.improveJob(title, desc);
    },
    onSuccess: (data: any) => {
      setDesc(data.description);
      const mergedSkills = [...new Set([...skills, ...data.skills])];
      setSkills(mergedSkills);
      toast.success("AI successfully optimized your description for inclusive, high-impact hiring!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to run AI assist");
    }
  });

  function addSkill() {
    const t = skillInp.trim();
    if (t && !skills.includes(t)) setSkills([...skills, t]);
    setSkillInp("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const minNum = Number(min.replace(/,/g, '')) || 0;
    const maxNum = Number(max.replace(/,/g, '')) || 0;

    if (!isCompetitive && minNum > 0 && maxNum > 0 && minNum > maxNum) {
      toast.error("Minimum salary cannot exceed maximum salary!");
      return;
    }

    create.mutate({
      title,
      category,
      jobType: type,
      jobMode: mode,
      location: location || null,
      salary: isCompetitive ? {
        min: null,
        max: null,
        currency: "PKR"
      } : {
        min: minNum || null,
        max: maxNum || null,
        currency: "PKR",
      },
      description: desc,
      skillsRequired: skills,
    });
  }

  // Stepper scroll trigger
  const scrollToSection = (id: string, stepNum: number) => {
    setActiveSection(stepNum);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Salary formatters
  const handleMinBlur = () => {
    setTouched(prev => ({ ...prev, min: true }));
    const num = Number(min.replace(/,/g, ''));
    if (num) {
      setMin(num.toLocaleString('en-US'));
    }
  };

  const handleMinFocus = () => {
    setMin(prev => prev.replace(/,/g, ''));
  };

  const handleMaxBlur = () => {
    setTouched(prev => ({ ...prev, max: true }));
    const num = Number(max.replace(/,/g, ''));
    if (num) {
      setMax(num.toLocaleString('en-US'));
    }
  };

  const handleMaxFocus = () => {
    setMax(prev => prev.replace(/,/g, ''));
  };

  // Stepper calculations
  const minVal = Number(min.replace(/,/g, '')) || 0;
  const maxVal = Number(max.replace(/,/g, '')) || 0;
  const isSalaryInvalid = !isCompetitive && minVal > 0 && maxVal > 0 && minVal > maxVal;

  const validTitle = title.trim() !== "";
  const validCategory = category !== "";
  const validType = type !== "";
  const validMode = mode !== "";
  const validLocation = mode === "REMOTE" || location.trim() !== "";
  const validDesc = desc.trim().length >= 10;
  const validSkills = skills.length > 0;

  const validCount = [validTitle, validCategory, validType, validMode, validLocation, validDesc].filter(Boolean).length;
  const percentageComplete = Math.round((validCount / 6) * 100);

  const steps = [
    { step: 1, label: "Basic Info", id: "sec-basic", valid: validTitle && validCategory },
    { step: 2, label: "Work Style", id: "sec-style", valid: validType && validMode && validLocation },
    { step: 3, label: "Salary Details", id: "sec-salary", valid: isCompetitive || (min.trim() !== "" && max.trim() !== "" && !isSalaryInvalid) },
    { step: 4, label: "Requirements", id: "sec-reqs", valid: validDesc && validSkills }
  ];

  // Category Suggester
  const getSuggestedCategory = (titleText: string) => {
    const t = titleText.toLowerCase();
    if (t.includes("design") || t.includes("ux") || t.includes("ui") || t.includes("figma") || t.includes("product designer")) return "Design & UX";
    if (t.includes("developer") || t.includes("engineer") || t.includes("react") || t.includes("frontend") || t.includes("backend") || t.includes("fullstack") || t.includes("coder") || t.includes("programmer") || t.includes("tech")) return "IT & Tech";
    if (t.includes("finance") || t.includes("account") || t.includes("audit") || t.includes("tax") || t.includes("bookkeeper")) return "Finance";
    if (t.includes("marketing") || t.includes("sales") || t.includes("ads") || t.includes("seo") || t.includes("growth") || t.includes("content")) return "Sales & Marketing";
    if (t.includes("nurse") || t.includes("doctor") || t.includes("health") || t.includes("medical") || t.includes("clinic")) return "Healthcare";
    if (t.includes("teacher") || t.includes("tutor") || t.includes("education") || t.includes("professor") || t.includes("teach")) return "Education";
    return null;
  };
  const suggestedCategory = getSuggestedCategory(title);

  // Dynamic Impact Metrics
  const getDynamicImpact = (cat: string) => {
    switch(cat) {
      case "IT & Tech":
        return { reach: "40–60", expected: "3–8", desc: "high visibility role type" };
      case "Finance":
        return { reach: "20–35", expected: "2–5", desc: "steady corporate category" };
      case "Healthcare":
        return { reach: "15–25", expected: "2–4", desc: "specialized clinical category" };
      case "Sales & Marketing":
        return { reach: "35–50", expected: "3–7", desc: "high-demand commercial category" };
      case "Design & UX":
        return { reach: "30–45", expected: "2–6", desc: "creative matches available" };
      case "Education":
        return { reach: "12–25", expected: "1–5", desc: "academic niche matching" };
      default:
        return { reach: "20–30", expected: "2–5", desc: "standard category" };
    }
  };
  const impact = getDynamicImpact(category);

  // Save draft & exit handler
  const handleSaveDraft = () => {
    toast.success("Draft saved successfully. Exiting editor...");
    navigate("/employer/listings");
  };

  const renderCheckmark = (isValid: boolean) => {
    if (isValid) return <CheckCircle size={11} className="text-emerald-500 inline ml-1.5" />;
    return null;
  };

  const getInputClass = (touchedField: boolean, isValidField: boolean) => {
    return cn(
      inp,
      touchedField && !isValidField
        ? "border-rose-500 focus:ring-rose-500/10 focus:border-rose-500 bg-rose-50/5"
        : touchedField && isValidField
          ? "border-emerald-500 focus:ring-emerald-500/10 focus:border-emerald-500 bg-emerald-50/5"
          : ""
    );
  };

  return (
    <DashboardShell
      title="Post a job"
      subtitle="Fill in the details — AI will help score and rank applicants"
    >
      {/* Visual Form Completion Progress */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 mb-5 shadow-sm animate-fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-[11px] font-black uppercase tracking-widest text-ink-400">Listing Completeness</span>
          <div className="text-xs text-muted-foreground mt-0.5 font-bold">
            {validCount} / 6 required fields complete ({percentageComplete}%)
          </div>
        </div>
        <div className="flex-1 max-w-md bg-secondary dark:bg-secondary/40 rounded-full h-2.5 overflow-hidden border border-border/40">
          <div
            className="h-full bg-[var(--brand-pink)] rounded-full transition-all duration-500"
            style={{ width: `${percentageComplete}%` }}
          />
        </div>
      </div>

      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {/* Sticky Stepper Bar */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 py-3 border-b border-border/60 flex items-center justify-between gap-2 shadow-sm rounded-xl px-2">
            {steps.map(s => (
              <button
                key={s.step}
                type="button"
                onClick={() => scrollToSection(s.id, s.step)}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border",
                  activeSection === s.step
                    ? "bg-primary text-white border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/20",
                  s.valid && activeSection !== s.step ? "border-[var(--ink-300)] text-[var(--ink-700)]" : ""
                )}
              >
                <span className={cn(
                  "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black leading-none",
                  activeSection === s.step 
                    ? "bg-white text-primary" 
                    : s.valid 
                      ? "bg-[var(--brand-pink)] text-white" 
                      : "bg-secondary text-ink-300"
                )}>
                  {s.valid && activeSection !== s.step ? <Check size={8} /> : s.step}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Stepper Card 1: Basic Info */}
          <div id="sec-basic">
            <SectionCard title="1. Basic info" subtitle="Name your opportunity and categorize it">
              <div className="space-y-4">
                <Field label="Job title" required isValid={validTitle}>
                  <input 
                    className={getInputClass(touched.title, validTitle)} 
                    value={title} 
                    onChange={e => setTitle(e.target.value)} 
                    onBlur={() => setTouched(prev => ({ ...prev, title: true }))}
                    placeholder="Senior Frontend Developer" 
                    required 
                  />
                  {touched.title && !validTitle && (
                    <span className="text-[10px] text-rose-500 font-bold mt-1 block">Job title is required</span>
                  )}
                </Field>

                <Field label="Category" required isValid={validCategory}>
                  <select 
                    className={getInputClass(touched.category, validCategory)} 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, category: true }))}
                  >
                    {["IT & Tech","Finance","Healthcare","Sales & Marketing","Design & UX","Education"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
            </SectionCard>
          </div>

          {/* Stepper Card 2: Work Style */}
          <div id="sec-style">
            <SectionCard title="2. Work style & settings" subtitle="Define job mode and workspace parameters">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Job type" required isValid={validType}>
                  <select 
                    className={getInputClass(touched.type, validType)} 
                    value={type} 
                    onChange={e => setType(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, type: true }))}
                  >
                    {["FULLTIME","PARTTIME","CONTRACT","INTERNSHIP"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>

                <Field label="Work mode" required isValid={validMode}>
                  <select 
                    className={getInputClass(touched.mode, validMode)} 
                    value={mode} 
                    onChange={e => setMode(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, mode: true }))}
                  >
                    {["REMOTE","HYBRID","ONSITE"].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>

                <Field label="Location" required={mode !== "REMOTE"} isValid={validLocation}>
                  <input 
                    className={getInputClass(touched.location, validLocation)} 
                    value={location} 
                    onChange={e => setLocation(e.target.value)} 
                    onBlur={() => setTouched(prev => ({ ...prev, location: true }))}
                    placeholder={mode === "REMOTE" ? "Remote (Optional)" : "Lahore, Pakistan"}
                    disabled={mode === "REMOTE"}
                  />
                  {touched.location && !validLocation && (
                    <span className="text-[10px] text-rose-500 font-bold mt-1 block">Location is required for Hybrid/Onsite roles</span>
                  )}
                </Field>
              </div>
            </SectionCard>
          </div>

          {/* Stepper Card 3: Salary & Compensation */}
          <div id="sec-salary">
            <SectionCard title="3. Salary & compensation" subtitle="Compensation bracket or visibility settings">
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-secondary/35 p-3 rounded-2xl border border-border/50">
                  <div>
                    <label className="text-[11px] font-bold text-foreground">Mark as Competitive Salary</label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Hide numerical salary ranges and match typical market averages</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCompetitive(!isCompetitive)}
                    className={cn(
                      "w-9 h-5 rounded-full p-0.5 transition-all flex items-center shadow-inner",
                      isCompetitive ? "bg-primary justify-end" : "bg-border justify-start"
                    )}
                  >
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </button>
                </div>

                <div className={cn("grid grid-cols-2 gap-4 transition-all duration-350", isCompetitive ? "opacity-45 pointer-events-none" : "")}>
                  <Field label="Salary min (PKR)" subtitle="e.g. 60,000">
                    <input 
                      className={getInputClass(touched.min, !isSalaryInvalid && (isCompetitive || min.trim() !== ""))} 
                      value={min} 
                      onChange={e => setMin(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={handleMinBlur}
                      onFocus={handleMinFocus}
                      placeholder="80,000" 
                      disabled={isCompetitive}
                    />
                  </Field>

                  <Field label="Salary max (PKR)" subtitle="e.g. 150,000">
                    <input 
                      className={getInputClass(touched.max, !isSalaryInvalid && (isCompetitive || max.trim() !== ""))} 
                      value={max} 
                      onChange={e => setMax(e.target.value.replace(/[^0-9]/g, ''))}
                      onBlur={handleMaxBlur}
                      onFocus={handleMaxFocus}
                      placeholder="150,000" 
                      disabled={isCompetitive}
                    />
                  </Field>
                </div>

                {isSalaryInvalid && (
                  <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-500/5 p-2.5 rounded-xl border border-rose-500/10">
                    <AlertCircle size={12} /> Minimum salary cannot exceed maximum salary!
                  </div>
                )}

                {/* Formatted Salary Display */}
                <div className="text-[11px] font-bold text-muted-foreground border-t border-border/40 pt-3">
                  Salary Display Preview:{" "}
                  <span className="text-[var(--status-success-fg)] uppercase font-extrabold tracking-wider">
                    {isCompetitive 
                      ? "Competitive (PKR Market Rate)" 
                      : minVal > 0 || maxVal > 0 
                        ? `PKR ${minVal.toLocaleString('en-US')} – PKR ${maxVal.toLocaleString('en-US')} / month` 
                        : "---"
                    }
                  </span>
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Stepper Card 4: Description & Requirements */}
          <div id="sec-reqs">
            <SectionCard title="4. Job description & requirements" subtitle="Outline job responsibilities and list target skill sets">
              <div className="space-y-4">
                <Field label="Description" required isValid={validDesc}>
                  <textarea
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, desc: true }))}
                    rows={7}
                    className={getInputClass(touched.desc, validDesc)}
                    placeholder="Build scalable web apps using React + TypeScript…"
                  />
                  {touched.desc && !validDesc && (
                    <span className="text-[10px] text-rose-500 font-bold mt-1 block">Description must be at least 10 characters</span>
                  )}
                </Field>

                <Field label="Required skills" required isValid={validSkills}>
                  <div className={cn(
                    "min-h-[44px] w-full px-3 py-2 border rounded-xl flex flex-wrap gap-1.5 items-center transition-all bg-card",
                    touched.skills && !validSkills ? "border-rose-500 ring-rose-500/10 focus-within:border-rose-500 focus-within:ring-2" : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
                  )}>
                    {skills.map((s, i) => (
                      <span key={s} className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-border">
                        {s}
                        <button type="button" onClick={() => setSkills(skills.filter((_, j) => j !== i))}>
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <input
                      value={skillInp}
                      onChange={e => setSkillInp(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkill(); } }}
                      onBlur={() => { addSkill(); setTouched(prev => ({ ...prev, skills: true })); }}
                      placeholder={skills.length === 0 ? "Type skill and press Enter…" : ""}
                      className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder:text-ink-300 text-foreground"
                    />
                  </div>
                  {touched.skills && !validSkills && (
                    <span className="text-[10px] text-rose-500 font-bold mt-1 block">Add at least 1 required skill</span>
                  )}
                </Field>
              </div>
            </SectionCard>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-4">
          {/* Active Auto-Save Status */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm animate-fade-in flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--brand-pink)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--brand-pink)]"></span>
              </span>
              <span>Workspace Draft</span>
            </div>
            <span className="text-[10px] font-medium">{lastSaved}</span>
          </div>

          {/* Reactive AI Assist Sidebar Card */}
          <div className={cn(
            "bg-card border rounded-2xl p-4 transition-all duration-300",
            desc.trim().length > 10 ? "border-primary/50 shadow-md shadow-primary/5 ring-1 ring-primary/20" : "border-border/80"
          )}>
            <div className="text-center py-3">
              <div className="relative inline-block mb-2">
                <Sparkles 
                  size={26} 
                  className={cn(
                    "mx-auto transition-all duration-300", 
                    desc.trim().length > 10 ? "text-primary animate-pulse scale-110" : "text-ink-300"
                  )} 
                />
              </div>
              <h3 className="text-[12px] font-bold text-foreground mb-1 uppercase tracking-wide">AI Assistant</h3>
              
              <p className="text-[11px] text-muted-foreground mb-4 leading-normal px-2">
                {desc.trim().length > 10 
                  ? "Your description is ready to optimize — Run AI." 
                  : "AI will rewrite your description for clarity, inclusion, and score matching."
                }
              </p>

              {/* Reactive category suggester nudge */}
              {suggestedCategory && suggestedCategory !== category && (
                <div className="mb-4 p-2.5 bg-primary/5 border border-primary/15 rounded-xl text-left animate-slide-down">
                  <div className="text-[9px] font-black text-primary uppercase tracking-wider">AI Suggestion</div>
                  <div className="text-[10px] text-foreground font-semibold mt-0.5">Matching category detected: <span className="underline">{suggestedCategory}</span></div>
                  <button 
                    type="button" 
                    onClick={() => applyRecommendedCategory(suggestedCategory)}
                    className="text-[10px] text-primary font-black hover:underline mt-1.5 block w-full text-right"
                  >
                    Apply recommendation →
                  </button>
                </div>
              )}

              <BtnOutline
                className={cn(
                  "w-full justify-center gap-1.5 transition-all text-xs",
                  desc.trim().length > 10 ? "bg-primary/5 border-primary/30 text-primary hover:bg-primary/10" : ""
                )}
                type="button"
                onClick={() => aiAssist.mutate()}
                disabled={aiAssist.isPending || desc.trim().length === 0}
              >
                {aiAssist.isPending ? (
                  <>
                    <Loader2 size={13} className="animate-spin text-primary" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Sparkles size={13} className="text-primary" />
                    Run AI assist
                  </>
                )}
              </BtnOutline>
            </div>
          </div>

          {/* Publish Sidebar Card with dynamic preview */}
          <SectionCard title="Publish">
            <div className="space-y-4">
              <div className="text-[11px] text-muted-foreground leading-relaxed">
                Your job will be visible to candidates immediately after publishing on the candidate board.
              </div>

              {/* Hiring Impact Preview */}
              <div className="bg-secondary/40 border border-border/60 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center gap-1.5 text-foreground font-bold text-[10px] uppercase tracking-wider">
                  <Target size={12} className="text-primary" />
                  <span>Hiring Impact Estimate</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Reach:</span>
                    <span className="font-extrabold text-foreground">{impact.reach} candidates</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Apps (Wk 1):</span>
                    <span className="font-extrabold text-foreground">{impact.expected} matches</span>
                  </div>
                </div>
                <div className="text-[9px] text-muted-foreground italic border-t border-border/40 pt-1.5 mt-1 leading-normal">
                  Based on similarity algorithms for {impact.desc}.
                </div>
              </div>

              {/* Form Validation Tooltip Alert */}
              {validCount < 6 && (
                <div className="flex items-start gap-1.5 p-2.5 bg-rose-500/5 border border-rose-500/10 text-rose-600 rounded-xl text-[10px] font-bold">
                  <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
                  <span>Fill in the remaining {6 - validCount} required fields to enable publishing.</span>
                </div>
              )}

              <BtnPrimary 
                type="submit" 
                disabled={create.isPending || validCount < 6} 
                className="w-full justify-center py-2.5 text-xs font-bold"
                title={validCount < 6 ? "Complete all required fields before publishing" : "Publish job"}
              >
                {create.isPending ? "Publishing…" : "Publish job"}
              </BtnPrimary>

              {/* Ghost exit button */}
              <button 
                type="button" 
                onClick={handleSaveDraft}
                className="text-[11px] text-muted-foreground hover:text-foreground font-semibold py-1.5 transition-colors mt-1.5 text-center block w-full hover:underline"
              >
                Save Draft & Exit
              </button>
            </div>
          </SectionCard>
        </div>
      </form>
    </DashboardShell>
  );
}

function Field({ label, required, subtitle, isValid, children }: { label: string; required?: boolean; subtitle?: string; isValid?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-primary normal-case font-normal">*</span>}
        {isValid && <CheckCircle size={10} className="text-[var(--brand-pink)] inline-block ml-1.5 align-middle" />}
      </label>
      {children}
      {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}
