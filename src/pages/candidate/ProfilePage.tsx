import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Plus, Check, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiProfile, apiUpload } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";

const STEPS = ["Personal Info", "Experience", "Education", "Preferences"];
const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3MB

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

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Step 1 — Personal
  const [firstName, setFirst] = useState(user?.firstName ?? "");
  const [lastName, setLast] = useState(user?.lastName ?? "");
  const [cnic, setCnic] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLoc] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPort] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");

  // Step 2 — Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [category, setCat] = useState("IT & Tech");

  // Step 3 — Experience entries
  const [exps, setExps] = useState([
    { id: 1, title: "", company: "", from: "", to: "", isCurrent: false, desc: "" },
  ]);

  // Step 4 — Preferences
  const [salary, setSalary] = useState("90000");
  const [notice, setNotice] = useState("1 month");
  const [prefMode, setPrefMode] = useState("REMOTE");
  const [langs, setLangs] = useState<string[]>(["English"]);

  // Fetch existing profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await apiProfile.getMe();
        const profile = response.data?.data || response.data;

        if (profile) {
          setFirst(profile.userId?.firstName || user?.firstName || "");
          setLast(profile.userId?.lastName || user?.lastName || "");
          setCnic(profile.cnic || "");
          setPhone(profile.phone || "");
          setAvatarUrl(profile.userId?.avatarUrl || user?.avatarUrl || "");
          setLocation(profile.location?.city ? `${profile.location.city}${profile.location.country ? ', ' + profile.location.country : ''}` : "");
          setTitle(profile.title || "");
          setSummary(profile.bio || "");
          setLinkedin(profile.linkedinUrl || "");
          setPort(profile.portfolioUrl || "");
          setSkills(profile.skills?.map((s: any) => s.name || s) || []);
          setCategory(profile.category || "IT & Tech");
          setSalary(String(profile.expectedSalary?.min || 90000));
          setLangs(profile.cv?.skills || ["English"]);
          if (profile.experience?.length) setExps(profile.experience.map((e: any) => ({
            id: e._id || Math.random(),
            title: e.title,
            company: e.company,
            from: e.from ? new Date(e.from).toISOString().split('T')[0] : "",
            to: e.to ? new Date(e.to).toISOString().split('T')[0] : "",
            isCurrent: e.current,
            desc: e.description
          })));
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    loadProfile();
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: any) => apiProfile.updateProfile(data),
    onSuccess: () => {
      setSaved(true);
      // Update auth store with new firstName/lastName
      if (user) setUser({ ...user, firstName, lastName });
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: any) => {
      console.error("Save error:", err);
    }
  });

  const avatarUpload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiUpload.uploadAvatar(formData);
    },
    onSuccess: (response) => {
      const avatarUrl = response.data?.data?.avatarUrl || response.data?.avatarUrl;
      setAvatarUrl(avatarUrl);
      if (user) setUser({ ...user, avatarUrl });
      setAvatarError("");
    },
    onError: (err: any) => {
      setAvatarError(err.response?.data?.message || "Upload failed");
    }
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Image must be smaller than 3MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setAvatarError("Please upload an image file");
      return;
    }

    setUploadingAvatar(true);
    avatarUpload.mutate(file);
    setUploadingAvatar(false);
  }

  function save() {
    mutation.mutate({
      firstName,
      lastName,
      phone,
      location,
      title,
      summary,
      linkedin,
      portfolio,
      cnic,
      skills: skills.map(s => ({ name: s })),
      category,
      experience: exps.filter(e => e.title || e.company),
      expectedSalary: { min: parseInt(salary) },
      noticePeriod: notice,
      preferredMode: prefMode,
      languages: langs,
    });
  }

  const score = [firstName, lastName, title, summary, skills.length > 0, linkedin, portfolio, phone, location].filter(Boolean).length * 11;
  const CATS = ["IT & Tech", "Finance", "Healthcare", "Education", "Sales & Marketing", "Customer Service", "Design & UX", "Legal", "Research", "Engineering", "Media & PR", "Management"];

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

      {/* Step 0: Personal Info */}
      {step === 0 && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <SectionCard title="Basic Information">
              <div className="space-y-4 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First Name" required>
                    <input value={firstName} onChange={e => setFirst(e.target.value)} placeholder="First name" className={inp} />
                  </Field>
                  <Field label="Last Name" required>
                    <input value={lastName} onChange={e => setLast(e.target.value)} placeholder="Last name" className={inp} />
                  </Field>
                </div>
                <Field label="CNIC">
                  <input value={cnic} onChange={e => setCnic(e.target.value)} placeholder="e.g. 12345-1234567-1" className={inp} />
                </Field>
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
            <SectionCard title="Profile Photo">
              <div className="text-center py-6">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover mx-auto mb-3" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                    {firstName[0]}{lastName[0]}
                  </div>
                )}
                <p className="text-xs text-[#6B6480] mb-3">Upload a professional photo (max 3MB)</p>
                <label className="inline-flex items-center gap-2 px-4 py-2 border border-[#E8E1F0] rounded-full text-xs font-semibold text-[#6B6480] hover:bg-[#F7F4F9] transition-colors cursor-pointer">
                  <Upload size={14} />
                  {uploadingAvatar || avatarUpload.isPending ? "Uploading…" : "Upload Photo"}
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploadingAvatar || avatarUpload.isPending} />
                </label>
                {avatarError && <p className="text-xs text-red-500 mt-2">{avatarError}</p>}
              </div>
            </SectionCard>

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
            </SectionCard>
          </div>
        </div>
      )}

      {/* Step 1: Skills */}
      {step === 1 && (
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Skills" subtitle="Add skills you're proficient in">
            <div className="mt-3 space-y-3">
              <Field label="Category">
                <select value={category} onChange={e => setCat(e.target.value)} className={cn(inp, "cursor-pointer")}>
                  {CATS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Skills" hint="Press Enter or comma after each skill">
                <SkillInput chips={skills} onAdd={v => setSkills(s => [...s, v])} onRemove={i => setSkills(s => s.filter((_, idx) => idx !== i))} />
              </Field>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Step 2: Experience */}
      {step === 2 && (
        <div className="space-y-4">
          {exps.map((exp, i) => (
            <SectionCard key={exp.id} title={`Experience ${i + 1}`}
              action={exps.length > 1 ? <button onClick={() => setExps(es => es.filter(e => e.id !== exp.id))} className="text-red-400"><X size={15} /></button> : undefined}>
              <div className="space-y-3 mt-3">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Job Title" required>
                    <input value={exp.title} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, title: e.target.value } : x))} className={inp} />
                  </Field>
                  <Field label="Company" required>
                    <input value={exp.company} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, company: e.target.value } : x))} className={inp} />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3 items-end">
                  <Field label="From">
                    <input type="date" value={exp.from} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, from: e.target.value } : x))} className={inp} />
                  </Field>
                  <Field label="To">
                    <input type="date" value={exp.to} disabled={exp.isCurrent} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, to: e.target.value } : x))} className={cn(inp, exp.isCurrent && "opacity-40")} />
                  </Field>
                  <label className="flex items-center gap-2 pb-2 cursor-pointer">
                    <input type="checkbox" checked={exp.isCurrent} onChange={e => setExps(es => es.map(x => x.id === exp.id ? { ...x, isCurrent: e.target.checked } : x))} className="accent-rose-500" />
                    <span className="text-xs font-semibold">Current</span>
                  </label>
                </div>
              </div>
            </SectionCard>
          ))}
          <button onClick={() => setExps(es => [...es, { id: Date.now(), title: "", company: "", from: "", to: "", isCurrent: false, desc: "" }])}
                  className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-2xl text-sm font-semibold w-full justify-center">
            <Plus size={15} /> Add Experience
          </button>
        </div>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <div className="grid lg:grid-cols-2 gap-5">
          <SectionCard title="Work Preferences">
            <div className="space-y-4 mt-3">
              <Field label="Expected Salary (PKR/month)">
                <input type="number" value={salary} onChange={e => setSalary(e.target.value)} className={inp} />
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
                  {[["REMOTE", "Remote"], ["HYBRID", "Hybrid"], ["ONSITE", "On-site"]].map(([v, l]) => (
                    <button key={v} onClick={() => setPrefMode(v)}
                            className={cn("flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all",
                              prefMode === v ? "bg-rose-500 border-rose-500 text-white" : "bg-[#F7F4F9] border-[#E8E1F0]")}>
                      {l}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </SectionCard>

          <SectionCard title="Languages">
            <div className="mt-3">
              <SkillInput chips={langs} onAdd={v => setLangs(l => [...l, v])} onRemove={i => setLangs(l => l.filter((_, idx) => idx !== i))} />
              <div className="flex flex-wrap gap-1.5 mt-3">
                {["Urdu", "Punjabi", "Sindhi", "Pashto"].filter(l => !langs.includes(l)).map(l => (
                  <button key={l} onClick={() => setLangs(ls => [...ls, l])}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border">
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
