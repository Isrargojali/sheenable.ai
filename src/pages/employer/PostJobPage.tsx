// src/pages/employer/PostJobPage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { X, Plus, Sparkles } from "lucide-react";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { apiJobs } from "@/lib/api";
import { cn } from "@/lib/utils";

const inp = "w-full px-3.5 py-2.5 border border-border rounded-xl text-sm bg-card text-foreground placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all";

export default function PostJobPage() {
  const navigate = useNavigate();
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

  const create = useMutation({
    mutationFn: apiJobs.postJob,
    onSuccess:  () => navigate("/employer/listings"),
  });

  function addSkill() {
    const t = skillInp.trim();
    if (t && !skills.includes(t)) setSkills([...skills, t]);
    setSkillInp("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      title,
      category,
      jobType: type,
      jobMode: mode,
      location: location || null,
      salary: {
        min: Number(min) || null,
        max: Number(max) || null,
      },
      description: desc,
      skillsRequired: skills,
    });
  }

  return (
    <DashboardShell
      title="Post a job"
      subtitle="Fill in the details — AI will help score and rank applicants"
    >
      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <SectionCard title="Basic info">
            <div className="space-y-3">
              <Field label="Job title" required>
                <input className={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Senior Frontend Developer" required />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Category">
                  <select className={inp} value={category} onChange={e => setCategory(e.target.value)}>
                    {["IT & Tech","Finance","Healthcare","Sales & Marketing","Design & UX","Education"].map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Type">
                  <select className={inp} value={type} onChange={e => setType(e.target.value)}>
                    {["FULLTIME","PARTTIME","CONTRACT","INTERNSHIP"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="Work mode">
                  <select className={inp} value={mode} onChange={e => setMode(e.target.value)}>
                    {["REMOTE","HYBRID","ONSITE"].map(m => <option key={m}>{m}</option>)}
                  </select>
                </Field>
                <Field label="Location">
                  <input className={inp} value={location} onChange={e => setLocation(e.target.value)} placeholder="Lahore, Pakistan" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Salary min (USD)">
                  <input className={inp} type="number" value={min} onChange={e => setMin(e.target.value)} placeholder="60000" />
                </Field>
                <Field label="Salary max (USD)">
                  <input className={inp} type="number" value={max} onChange={e => setMax(e.target.value)} placeholder="90000" />
                </Field>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Description" subtitle="What will this person do day-to-day?">
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              rows={6}
              className={cn(inp, "resize-none")}
              placeholder="Build scalable web apps using React + TypeScript…"
            />
          </SectionCard>

          <SectionCard title="Required skills">
            <div className="min-h-[44px] w-full px-3 py-2 border border-border rounded-xl flex flex-wrap gap-1.5 items-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10 transition-all">
              {skills.map((s, i) => (
                <span key={s} className="inline-flex items-center gap-1 bg-accent text-accent-foreground text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
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
                onBlur={addSkill}
                placeholder={skills.length === 0 ? "Type and press Enter…" : ""}
                className="flex-1 min-w-[120px] outline-none text-sm bg-transparent placeholder:text-ink-300"
              />
            </div>
          </SectionCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <SectionCard title="AI assist">
            <div className="text-center py-3">
              <Sparkles size={24} className="mx-auto text-primary mb-2" />
              <div className="text-[12px] font-semibold text-foreground mb-1">Boost your post</div>
              <div className="text-[11px] text-muted-foreground mb-3">AI will rewrite your description for clarity and inclusivity.</div>
              <BtnOutline className="w-full justify-center" type="button">Run AI assist</BtnOutline>
            </div>
          </SectionCard>

          <SectionCard title="Publish">
            <div className="text-[11px] text-muted-foreground mb-3">
              Your job will be visible to candidates immediately after publishing.
            </div>
            <BtnPrimary type="submit" disabled={create.isPending} className="w-full justify-center">
              {create.isPending ? "Publishing…" : "Publish job"}
            </BtnPrimary>
            <BtnOutline type="button" className="w-full justify-center mt-2">Save draft</BtnOutline>
          </SectionCard>
        </div>
      </form>
    </DashboardShell>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-ink-500 uppercase tracking-wide mb-1.5">
        {label} {required && <span className="text-primary normal-case font-normal">*</span>}
      </label>
      {children}
    </div>
  );
}
