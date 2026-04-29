// src/pages/candidate/ProfilePage.tsx
import { useState }           from "react";
import { useMutation }        from "@tanstack/react-query";
import { X, Plus, Check }     from "lucide-react";
import { cn }                 from "@/lib/utils";
import { apiProfile }         from "@/lib/api";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { MOCK_USERS }         from "@/mock/data";

// ── Step indicator ────────────────────────────────────────────────────────────
const STEPS = ["Personal Info", "Experience", "Education", "Preferences"];

function StepIndicator({ current, onChange }: { current: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => (
        <div key={s} className="flex items-center flex-1">
          <button
            onClick={() => onChange(i)}
            className="flex flex-col items-center gap-1 flex-shrink-0 group"
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
              i < current  ? "bg-emerald-500 text-white"
              : i === current ? "bg-rose-500 text-white ring-4 ring-rose-500/20"
              : "bg-[#EDE8F5] text-[#A89EC0] group-hover:bg-[#D4CBE8]"
            )}>
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span className={cn("text-[10px] font-semibold whitespace-nowrap",
              i === current ? "text-rose-500" : i < current ? "text-emerald-600" : "text-[#A89EC0]")}>
              {s}
            </span>
          </button>
          {i < STEPS.length - 1 && (
            <div className={cn("flex-1 h-0.5 mx-2 mb-4", i < current ? "bg-emerald-500" : "bg-[#EDE8F5]")} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, required, hint, error, children }: {
  label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-[#3D3656] uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-rose-500 font-normal normal-case">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-red-500 mt-1">{error}</p>}
      {!error && hint && <p className="text-[10px] text-[#A89EC0] mt-1">{hint}</p>}
    </div>
  );
}

const inp = "w-full px-3.5 py-2.5 border border-[#E8E1F0] rounded-xl text-sm bg-white text-[#0F0B1A] placeholder:text-[#C4BEDD] focus:outline-none focus:ring-2 focus:ring-rose-500/10 focus:border-rose-400 transition-all hover:border-[#D4CBE8]";

// ── Skill chip input ──────────────────────────────────────────────────────────
function SkillInput({ chips, onAdd, onRemove }: { chips: string[]; onAdd: (v: string) => void; onRemove: (i: number) => void }) {
  const [val, setVal] = useState("");
  function add() { const t = val.trim(); if (t && !chips.includes(t)) { onAdd(t); setVal(""); } }
  return (
    <div onClick={e => (e.currentTarget.querySelector("input") as HTMLInputElement)?.focus()}
         className="min-h-[44px] w-full px-3 py-2 border border-[#E8E1F0] rounded-xl cursor-text flex flex-wrap gap-1.5 items-center focus-within:border-rose-400 focus-within:ring-2 focus-within:ring-rose-500/10 transition-all">
      {chips.map((c, i) => (
        <span key={c} className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
          {c}<button type="button" onClick={() => onRemove(i)}><X size={10} /></button>
        </span>
      ))}
      <input value={val} onChange={e => setVal(e.target.value)}
             onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
             onBlur={add}
             placeholder={chips.length === 0 ? "Type a skill and press Enter…" : ""}
             className="flex-1 min-w-[120px] outline-none text-sm text-[#0F0B1A] placeholder:text-[#C4BEDD] bg-transparent" />
    </div>
  );
}

// ── Profile completion ring ───────────────────────────────────────────────────
function MiniRing({ score }: { score: number }) {
  const r = 18, circ = 2 * Math.PI * r;
  return (
    <div className="relative w-12 h-12">
      <svg width="48" height="48" viewBox="0 0 48 48" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="24" cy="24" r={r} fill="none" stroke="#F5DCEA" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke="#C8315A" strokeWidth="4"
                strokeDasharray={circ} strokeDashoffset={circ * (1 - score / 100)} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center font-serif text-xs text-rose-500">{score}%</div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const profile = MOCK_USERS[0].profile as any;

export default function ProfilePage() {
  const [step, setStep]       = useState(0);
  const [saved, setSaved]     = useState(false);

  // Step 1 — Personal
  const [firstName, setFirst]   = useState(profile.firstName ?? "Ayesha");
  const [lastName,  setLast]    = useState(profile.lastName  ?? "Khan");
  const [phone,     setPhone]   = useState(profile.phone     ?? "");
  const [location,  setLoc]     = useState(profile.location  ?? "Lahore, Pakistan");
  const [title,     setTitle]   = useState(profile.title     ?? "Full-Stack Developer");
  const [summary,   setSummary] = useState(profile.summary   ?? "");
  const [linkedin,  setLinkedin]= useState(profile.linkedin  ?? "");
  const [portfolio, setPort]    = useState(profile.portfolio ?? "");

  // Step 2 — Skills
  const [skills, setSkills] = useState<string[]>(profile.skills ?? ["React","TypeScript","Node.js"]);
  const [category, setCat]  = useState(profile.category ?? "IT & Tech");

  // Step 3 — Experience entries
  const [exps, setExps] = useState([
    { id: 1, title: "Senior Frontend Developer", company: "TechSolutions", from: "2021-01", to: "", isCurrent: true, desc: "" },
  ]);

  // Step 4 — Preferences
  const [salary,   setSalary]  = useState(String(profile.expectedSalary ?? "90000"));
  const [notice,   setNotice]  = useState(profile.noticePeriod ?? "1 month");
  const [prefMode, setPrefMode]= useState(profile.preferredMode ?? "REMOTE");
  const [langs,    setLangs]   = useState<string[]>(["English","Urdu"]);

  const mutation = useMutation({
    mutationFn: (data: any) => apiProfile.updateProfile(data),
    onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  function save() {
    mutation.mutate({ firstName, lastName, phone, location, title, summary, linkedin, portfolio, skills, category, expectedSalary: parseInt(salary), noticePeriod: notice, preferredMode: prefMode, languages: langs });
  }

  const score = [firstName, lastName, title, summary, skills.length > 0, linkedin, portfolio, phone, location].filter(Boolean).length * 11;

  const CATS = ["IT & Tech","Finance","Healthcare","Education","Sales & Marketing","Customer Service","Design & UX","Legal","Research","Engineering","Media & PR","Management"];

  return (
    <DashboardShell
      title="My Profile"
      subtitle="Complete your profile to get 3× more matches"
      actions={
        <div className="flex items-center gap-3">
          <MiniRing score={Math.min(score, 100)} />
          <BtnPrimary onClick={save} disabled={mutation.isPending}>
            {saved ? "Saved ✓" : mutation.isPending ? "Saving…" : "Save Profile"}
          </BtnPrimary>
        </div>
      }
    >
      <StepIndicator current={step} onChange={setStep} />

      {/* ── Step 0: Personal Info ─────────────────────────── */}
      {step === 0 && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <SectionCard title="Basic Information">
              <div className="space-y-4 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" required>
                    <input value={firstName} onChange={e => setFirst(e.target.value)} placeholder="Ayesha" className={inp} />
                  </Field>
                  <Field label="Last Name" required>
                    <input value={lastName} onChange={e => setLast(e.target.value)} placeholder="Khan" className={inp} />
                  </Field>
                </div>
                <Field label="Professional Title">
                  <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Full-Stack Developer" className={inp} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Phone">
                    <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+92 300 1234567" className={inp} />
                  </Field>
                  <Field label="Location">
                    <input value={location} onChange={e => setLoc(e.target.value)} placeholder="City, Country" className={inp} />
                  </Field>
                </div>
                <Field label="Professional Summary" hint={`${1000 - summary.length} chars`}>
                  <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={4} placeholder="Describe your experience, strengths, and what you're looking for…" className={cn(inp, "resize-y")} />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="LinkedIn URL">
                    <input value={linkedin} onChange={e => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/…" className={inp} />
                  </Field>
                  <Field label="Portfolio / Website">
                    <input value={portfolio} onChange={e => setPort(e.target.value)} placeholder="https://yoursite.com" className={inp} />
                  </Field>
                </div>
              </div>
            </SectionCard>
          </div>

          <div className="space-y-4">
            {/* Photo upload placeholder */}
            <SectionCard title="Profile Photo">
              <div className="text-center py-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {firstName[0]}{lastName[0]}
                </div>
                <p className="text-xs text-[#6B6480] mb-3">Upload a professional photo</p>
                <button className="px-4 py-2 border border-[#E8E1F0] rounded-full text-xs font-semibold text-[#6B6480] hover:bg-[#F7F4F9] transition-colors">
                  Upload Photo
                </button>
              </div>
            </SectionCard>

            {/* Completion score */}
            <SectionCard title="Completion Score">
              <div className="flex items-center gap-3 mt-2">
                <MiniRing score={Math.min(score, 100)} />
                <div className="flex-1">
                  <div className="h-1.5 bg-rose-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-rose-500 to-violet-500 rounded-full transition-all duration-500" style={{ width: `${Math.min(score, 100)}%` }} />
                  </div>
                  <p className="text-[10px] text-[#A89EC0] mt-1">{Math.min(score, 100)}% complete</p>
                </div>
              </div>
              <div className="space-y-1.5 mt-3">
                {[
                  ["Profile photo",  !!profile.photoUrl],
                  ["Professional title", !!title],
                  ["Summary",        summary.length > 30],
                  ["Skills added",   skills.length > 0],
                  ["LinkedIn URL",   !!linkedin],
                  ["Portfolio link", !!portfolio],
                ].map(([l, done]) => (
                  <div key={l as string} className="flex items-center gap-2 text-[11px]">
                    <span className={cn("w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]",
                      done ? "bg-emerald-100 text-emerald-600" : "bg-[#F3EFF8] text-[#A89EC0]")}>
                      {done ? "✓" : "○"}
                    </span>
                    <span className={cn(done ? "text-[#3D3656]" : "text-[#A89EC0]")}>{l}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ── Step 1: Skills ───────────────────────────────── */}
      {step === 1 && (
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Skills" subtitle="Add skills you're proficient in — AI uses these for matching">
            <div className="mt-3 space-y-3">
              <Field label="Category">
                <select value={category} onChange={e => setCat(e.target.value)} className={cn(inp, "cursor-pointer")}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Skills" hint="Press Enter or comma after each skill">
                <SkillInput chips={skills} onAdd={v => setSkills(s => [...s, v])} onRemove={i => setSkills(s => s.filter((_, idx) => idx !== i))} />
              </Field>

              {/* Common skills quick-add */}
              <div>
                <p className="text-[10px] text-[#A89EC0] mb-2 uppercase font-semibold tracking-wide">Quick add</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Python","SQL","Figma","Leadership","Communication","Excel","React","Node.js","AWS"].filter(s => !skills.includes(s)).map(s => (
                    <button key={s} onClick={() => setSkills(ps => [...ps, s])}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[#E8E1F0] bg-[#F7F4F9] text-[#6B6480] hover:border-rose-300 hover:text-rose-500 transition-all">
                      <Plus size={9} /> {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Resume / CV">
            <div className="text-center py-8 mt-2">
              <div className="text-4xl mb-3">📄</div>
              <p className="text-sm font-semibold text-[#0F0B1A] mb-1">Upload your CV</p>
              <p className="text-xs text-[#6B6480] mb-4">PDF format, max 10MB. AI will parse and enhance it.</p>
              <button className="px-4 py-2 border border-[#E8E1F0] rounded-full text-xs font-semibold text-[#6B6480] hover:bg-[#F7F4F9] transition-colors mr-2">
                Upload PDF
              </button>
              <button className="px-4 py-2 bg-rose-500 text-white rounded-full text-xs font-bold hover:bg-rose-600 transition-colors">
                Use AI CV Builder →
              </button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Step 2: Experience ───────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          {exps.map((exp, i) => (
            <SectionCard key={exp.id} title={`Experience ${i + 1}`}
              action={exps.length > 1 ? <button onClick={() => setExps(es => es.filter(e => e.id !== exp.id))} className="text-red-400 hover:text-red-600 transition-colors"><X size={15} /></button> : undefined}>
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Job Title" required>
                    <input value={exp.title} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, title: e.target.value } : x))} placeholder="e.g. Senior Developer" className={inp} />
                  </Field>
                  <Field label="Company" required>
                    <input value={exp.company} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))} placeholder="Company name" className={inp} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <Field label="From">
                    <input type="month" value={exp.from} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, from: e.target.value } : x))} className={inp} />
                  </Field>
                  <Field label="To">
                    <input type="month" value={exp.to} disabled={exp.isCurrent} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, to: e.target.value } : x))} className={cn(inp, exp.isCurrent && "opacity-40")} />
                  </Field>
                  <label className="flex items-center gap-2 pb-2 cursor-pointer">
                    <input type="checkbox" checked={exp.isCurrent} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, isCurrent: e.target.checked } : x))} className="accent-rose-500" />
                    <span className="text-xs font-semibold text-[#3D3656]">Current role</span>
                  </label>
                </div>
                <Field label="Description">
                  <textarea value={exp.desc} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, desc: e.target.value } : x))} rows={3} placeholder="Describe your responsibilities and achievements…" className={cn(inp, "resize-y")} />
                </Field>
              </div>
            </SectionCard>
          ))}
          <button onClick={() => setExps(es => [...es, { id: Date.now(), title: "", company: "", from: "", to: "", isCurrent: false, desc: "" }])}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#D4CBE8] rounded-2xl text-sm font-semibold text-[#6B6480] hover:border-rose-300 hover:text-rose-500 transition-all w-full justify-center">
            <Plus size={15} /> Add Another Experience
          </button>
        </div>
      )}

      {/* ── Step 3: Preferences ──────────────────────────── */}
      {step === 3 && (
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Work Preferences">
            <div className="space-y-4 mt-3">
              <Field label="Expected Salary (PKR/month)">
                <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="90,000" className={inp} />
              </Field>
              <Field label="Notice Period">
                <select value={notice} onChange={e => setNotice(e.target.value)} className={cn(inp, "cursor-pointer")}>
                  <option value="Immediate">Immediate</option>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="2 months">2 months</option>
                  <option value="3 months">3 months</option>
                </select>
              </Field>
              <Field label="Preferred Work Mode">
                <div className="flex gap-2 flex-wrap">
                  {[["REMOTE","Remote","🌍"],["HYBRID","Hybrid","🏢"],["ONSITE","On-site","🏗️"]].map(([v,l,e]) => (
                    <button key={v} onClick={() => setPrefMode(v)}
                            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all",
                              prefMode === v ? "bg-rose-500 border-rose-500 text-white" : "bg-[#F7F4F9] border-[#E8E1F0] text-[#6B6480] hover:border-rose-300")}>
                      {e} {l}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Languages">
            <div className="mt-3">
              <SkillInput chips={langs} onAdd={v => setLangs(l => [...l, v])} onRemove={i => setLangs(l => l.filter((_, idx) => idx !== i))} />
              <p className="text-[10px] text-[#A89EC0] mt-1">Add all languages you're proficient in</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {["English","Urdu","Punjabi","Sindhi","Pashto","Arabic","French"].filter(l => !langs.includes(l)).map(l => (
                  <button key={l} onClick={() => setLangs(ls => [...ls, l])}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border border-[#E8E1F0] bg-[#F7F4F9] text-[#6B6480] hover:border-rose-300 hover:text-rose-500 transition-all">
                    <Plus size={9} /> {l}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-5 border-t border-[#E8E1F0]">
        <BtnOutline onClick={() => setStep(s => Math.max(0, s - 1))} className={step === 0 ? "invisible" : ""}>
          ← Previous
        </BtnOutline>
        <div className="flex gap-3">
          {step < STEPS.length - 1 ? (
            <BtnPrimary onClick={() => setStep(s => s + 1)}>Next →</BtnPrimary>
          ) : (
            <BtnPrimary onClick={save} disabled={mutation.isPending}>
              {saved ? "Saved ✓" : mutation.isPending ? "Saving…" : "Save Profile"}
            </BtnPrimary>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
