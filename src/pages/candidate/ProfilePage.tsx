import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { X, Plus, Check, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiProfile, apiUpload } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";

const STEPS = ["Personal Info", "Education", "Skills", "Experience", "Preferences"];
const MAX_AVATAR_SIZE = 3 * 1024 * 1024; // 3MB

// ─── Types ────────────────────────────────────────────────────────────────────
interface EducationEntry {
  id: number;
  degree: string;
  institution: string;
  field: string;
  year: string;
}

interface CertificationEntry {
  id: number;
  name: string;
  issuer: string;
  year: string;
  url: string;
}

interface ExperienceEntry {
  id: number;
  title: string;
  company: string;
  from: string;
  to: string;
  isCurrent: boolean;
  desc: string;
}

interface RawEducation {
  _id?: string;
  degree: string;
  institution: string;
  year?: number;
  field: string;
}

interface RawCertification {
  _id?: string;
  name: string;
  issuer: string;
  year?: number;
  url?: string;
}

interface RawExperience {
  _id?: string;
  title: string;
  company: string;
  from?: string;
  to?: string;
  current: boolean;
  description: string;
}

interface RawSkill {
  name?: string;
}

interface RawProfile {
  userId?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  };
  cnic?: string;
  location?: { city?: string; country?: string };
  title?: string;
  bio?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  skills?: (RawSkill | string)[];
  category?: string;
  expectedSalary?: { min?: number };
  noticePeriod?: string;
  preferredMode?: string;
  languages?: string[];
  experience?: RawExperience[];
  education?: RawEducation[];
  certifications?: RawCertification[];
}

interface SavePayload {
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  title: string;
  bio: string;
  linkedinUrl: string;
  portfolioUrl: string;
  cnic: string;
  skills: { name: string }[];
  category: string;
  education: { degree: string; institution: string; field: string; year: number }[];
  certifications: { name: string; issuer: string; year: number; url: string }[];
  experience: {
    title: string; company: string;
    from?: string; to?: string;
    current: boolean; description: string;
  }[];
  expectedSalary: { min: number };
  noticePeriod: string;
  preferredMode: string;
  languages: string[];
}

// ─── Components ───────────────────────────────────────────────────────────────
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
              i < current ? "bg-emerald-500 text-white"
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
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

  // Step 1 — Education
  const [edus, setEdus] = useState<EducationEntry[]>([
    { id: 1, degree: "", institution: "", field: "", year: "" },
  ]);
  const [certs, setCerts] = useState<CertificationEntry[]>([]);

  // Step 2 — Skills
  const [skills, setSkills] = useState<string[]>([]);
  const [category, setCat] = useState("IT & Tech");

  // Step 3 — Experience entries
  const [exps, setExps] = useState<ExperienceEntry[]>([
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
        // apiProfile.getMe() applies .then(unwrap), so `response` is already
        // the inner data object — no need for .data?.data double-unwrap
        const profile: RawProfile = await apiProfile.getMe() as unknown as RawProfile;

        if (profile) {
          setFirst(profile.userId?.firstName || user?.firstName || "");
          setLast(profile.userId?.lastName || user?.lastName || "");
          setCnic(profile.cnic || "");
          // phone is stored on the User document, returned via populate
          setPhone(profile.userId?.phone || "");
          setAvatarUrl(profile.userId?.avatarUrl || user?.avatarUrl || "");
          setLoc(
            profile.location?.city
              ? `${profile.location.city}${profile.location.country ? ', ' + profile.location.country : ''}`
              : ""
          );
          setTitle(profile.title || "");
          setSummary(profile.bio || "");
          setLinkedin(profile.linkedinUrl || "");
          setPort(profile.portfolioUrl || "");
          setSkills(
            (profile.skills ?? []).map((s: RawSkill | string) =>
              typeof s === "string" ? s : (s.name ?? "")
            ).filter(Boolean)
          );
          setCat(profile.category || "IT & Tech");
          setSalary(String(profile.expectedSalary?.min || 90000));
          // `languages` is its own top-level array in the schema
          if (profile.languages && profile.languages.length > 0) {
            setLangs(profile.languages);
          }
          if (profile.noticePeriod) setNotice(profile.noticePeriod);
          if (profile.preferredMode) setPrefMode(profile.preferredMode);
          if (profile.education?.length) {
            setEdus(profile.education.map((e: RawEducation) => ({
              id: e._id ? parseInt(e._id, 16) : Math.random(),
              degree: e.degree || "",
              institution: e.institution || "",
              field: e.field || "",
              year: e.year ? String(e.year) : "",
            })));
          }
          if (profile.certifications?.length) {
            setCerts(profile.certifications.map((c: RawCertification) => ({
              id: c._id ? parseInt(c._id, 16) : Math.random(),
              name: c.name || "",
              issuer: c.issuer || "",
              year: c.year ? String(c.year) : "",
              url: c.url || "",
            })));
          }
          if (profile.experience?.length) {
            setExps(profile.experience.map((e: RawExperience) => ({
              id: e._id ? parseInt(e._id, 16) : Math.random(),
              title: e.title,
              company: e.company,
              from: e.from ? new Date(e.from).toISOString().split('T')[0] : "",
              to: e.to ? new Date(e.to).toISOString().split('T')[0] : "",
              isCurrent: e.current,
              desc: e.description,
            })));
          }
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      }
    };
    loadProfile();
  }, []);

  const mutation = useMutation({
    mutationFn: (data: SavePayload) => apiProfile.updateProfile(data),
    onSuccess: (response) => {
      setSaved(true);
      // The backend now returns { profile, user } — sync ALL user fields into the global auth store
      const updatedUser = (response as { user?: { id: string; email: string; role: string; firstName: string; lastName: string; avatarUrl?: string } }).user
        ?? (response as { data?: { user?: { id: string; email: string; role: string; firstName: string; lastName: string; avatarUrl?: string } } }).data?.user;
      if (user && updatedUser) {
        setUser({
          id: updatedUser.id ?? user.id,
          email: updatedUser.email ?? user.email,
          role: (updatedUser.role ?? user.role) as import("@/store/authStore").UserRole,
          firstName: updatedUser.firstName ?? firstName,
          lastName: updatedUser.lastName ?? lastName,
          avatarUrl: updatedUser.avatarUrl ?? avatarUrl ?? user.avatarUrl,
        });
      } else if (user) {
        // Fallback: at minimum sync the local form state
        setUser({ ...user, firstName, lastName, avatarUrl: avatarUrl || user.avatarUrl });
      }
      setTimeout(() => setSaved(false), 3000);
    },
    onError: (err: Error) => {
      console.error("Save error:", err);
    }
  });

  const avatarUpload = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return apiUpload.uploadAvatar(formData);
    },
    onSuccess: (response) => {
      // apiUpload.uploadAvatar uses .then(unwrap), so `response` is already the
      // unwrapped inner data object: { avatarUrl: "https://..." }
      const url: string =
        (response as { avatarUrl?: string })?.avatarUrl ??
        (response as { data?: { avatarUrl?: string } })?.data?.avatarUrl ??
        "";
      if (url) {
        setAvatarUrl(url);
        if (user) setUser({ ...user, avatarUrl: url });
      }
      setAvatarError("");
    },
    onError: (err: Error) => {
      const message = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setAvatarError(message || "Upload failed. Please try again.");
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

    setAvatarError("");
    avatarUpload.mutate(file);
  }

  function save() {
    mutation.mutate({
      firstName,
      lastName,
      phone,
      location,
      title,
      bio: summary,            // CandidateProfile stores this as `bio`
      linkedinUrl: linkedin,   // CandidateProfile stores this as `linkedinUrl`
      portfolioUrl: portfolio, // CandidateProfile stores this as `portfolioUrl`
      cnic,
      skills: skills.map(s => ({ name: s })),
      category,
      education: edus
        .filter(e => e.degree || e.institution)
        .map(e => ({
          degree: e.degree,
          institution: e.institution,
          field: e.field,
          year: parseInt(e.year, 10) || new Date().getFullYear(),
        })),
      certifications: certs
        .filter(c => c.name)
        .map(c => ({
          name: c.name,
          issuer: c.issuer,
          year: parseInt(c.year, 10) || new Date().getFullYear(),
          url: c.url,
        })),
      experience: exps
        .filter(e => e.title || e.company)
        .map(e => ({
          title: e.title,
          company: e.company,
          from: e.from || undefined,
          to: e.isCurrent ? undefined : (e.to || undefined),
          current: e.isCurrent,
          description: e.desc,
        })),
      expectedSalary: { min: parseInt(salary, 10) || 0 },
      noticePeriod: notice,
      preferredMode: prefMode,
      languages: langs,
    });
  }

  const score = [
    firstName, lastName, title, summary, phone, location,
    skills.length > 0, linkedin, portfolio,
    edus.some(e => e.degree),
    exps.some(e => e.title),
  ].filter(Boolean).length * 9;
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
                  {avatarUpload.isPending ? "Uploading…" : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={avatarUpload.isPending}
                  />
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

      {/* Step 1: Education & Certifications */}
      {step === 1 && (
        <div className="space-y-5">
          {/* ── Education entries ─────────────────────────────────── */}
          <div className="space-y-3">
            {edus.map((edu, i) => (
              <SectionCard
                key={edu.id}
                title={`Education ${i + 1}`}
                action={
                  edus.length > 1
                    ? <button type="button" onClick={() => setEdus(es => es.filter(e => e.id !== edu.id))} className="text-red-400 hover:text-red-600 transition-colors"><X size={15} /></button>
                    : undefined
                }
              >
                <div className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Degree / Qualification" required>
                      <input
                        value={edu.degree}
                        onChange={e => setEdus(es => es.map(x => x.id === edu.id ? { ...x, degree: e.target.value } : x))}
                        placeholder="e.g. Bachelor of Science"
                        className={inp}
                      />
                    </Field>
                    <Field label="Institution" required>
                      <input
                        value={edu.institution}
                        onChange={e => setEdus(es => es.map(x => x.id === edu.id ? { ...x, institution: e.target.value } : x))}
                        placeholder="e.g. LUMS, NUST, IBA"
                        className={inp}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Field of Study">
                      <input
                        value={edu.field}
                        onChange={e => setEdus(es => es.map(x => x.id === edu.id ? { ...x, field: e.target.value } : x))}
                        placeholder="e.g. Computer Science"
                        className={inp}
                      />
                    </Field>
                    <Field label="Graduation Year">
                      <input
                        type="number"
                        min="1970"
                        max={new Date().getFullYear() + 5}
                        value={edu.year}
                        onChange={e => setEdus(es => es.map(x => x.id === edu.id ? { ...x, year: e.target.value } : x))}
                        placeholder={String(new Date().getFullYear())}
                        className={inp}
                      />
                    </Field>
                  </div>
                </div>
              </SectionCard>
            ))}
            <button
              type="button"
              onClick={() => setEdus(es => [...es, { id: Date.now(), degree: "", institution: "", field: "", year: "" }])}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#E8E1F0] rounded-2xl text-sm font-semibold w-full justify-center text-[#6B6480] hover:border-rose-300 hover:text-rose-500 transition-colors"
            >
              <Plus size={15} /> Add Education
            </button>
          </div>

          {/* ── Certifications ─────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#3D3656]">Certifications</h3>
                <p className="text-[11px] text-[#A89EC0] mt-0.5">Add any professional certifications you hold</p>
              </div>
            </div>
            <div className="space-y-3">
              {certs.map((cert, i) => (
                <SectionCard
                  key={cert.id}
                  title={`Certification ${i + 1}`}
                  action={
                    <button type="button" onClick={() => setCerts(cs => cs.filter(c => c.id !== cert.id))} className="text-red-400 hover:text-red-600 transition-colors"><X size={15} /></button>
                  }
                >
                  <div className="space-y-3 mt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Certification Name" required>
                        <input
                          value={cert.name}
                          onChange={e => setCerts(cs => cs.map(x => x.id === cert.id ? { ...x, name: e.target.value } : x))}
                          placeholder="e.g. AWS Solutions Architect"
                          className={inp}
                        />
                      </Field>
                      <Field label="Issuing Organisation">
                        <input
                          value={cert.issuer}
                          onChange={e => setCerts(cs => cs.map(x => x.id === cert.id ? { ...x, issuer: e.target.value } : x))}
                          placeholder="e.g. Amazon, Google, Coursera"
                          className={inp}
                        />
                      </Field>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Year Issued">
                        <input
                          type="number"
                          min="1990"
                          max={new Date().getFullYear()}
                          value={cert.year}
                          onChange={e => setCerts(cs => cs.map(x => x.id === cert.id ? { ...x, year: e.target.value } : x))}
                          placeholder={String(new Date().getFullYear())}
                          className={inp}
                        />
                      </Field>
                      <Field label="Certificate URL" hint="Link to verify online">
                        <input
                          type="url"
                          value={cert.url}
                          onChange={e => setCerts(cs => cs.map(x => x.id === cert.id ? { ...x, url: e.target.value } : x))}
                          placeholder="https://credential.net/…"
                          className={inp}
                        />
                      </Field>
                    </div>
                  </div>
                </SectionCard>
              ))}
              <button
                type="button"
                onClick={() => setCerts(cs => [...cs, { id: Date.now(), name: "", issuer: "", year: "", url: "" }])}
                className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-[#E8E1F0] rounded-2xl text-sm font-semibold w-full justify-center text-[#6B6480] hover:border-violet-300 hover:text-violet-500 transition-colors"
              >
                <Plus size={15} /> Add Certification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Skills */}
      {step === 2 && (
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

      {/* Step 3: Experience */}
      {step === 3 && (
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

      {/* Step 4: Preferences */}
      {step === 4 && (
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