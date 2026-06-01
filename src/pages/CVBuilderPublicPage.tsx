import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sparkles, Download, Copy, Wand2, Check, Plus, Trash2, Loader2, Type, Palette, ArrowRight, UserCheck } from "lucide-react";
import { apiProfile } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

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
  email?: string;
  phone?: string;
}

export default function CVBuilderPublicPage() {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const [step, setStep] = useState<"info" | "experience" | "education" | "skills" | "preview">("info");
  const [selectedTemplate, setSelectedTemplate] = useState<"executive" | "modern" | "minimalist">("modern");
  const [accentColor, setAccentColor] = useState<string>("#22C55E"); // SheEnableAI Green
  const [showRegModal, setShowRegModal] = useState(false);

  // Form State
  const [cv, setCv] = useState<CV>({
    name: "",
    title: "",
    summary: "",
    skills: [],
    email: "",
    phone: "",
    experience: [],
    education: []
  });

  // Load from local storage draft if guest
  useEffect(() => {
    const draft = localStorage.getItem("she-enable-cv-draft");
    if (draft) {
      try {
        setCv(JSON.parse(draft));
      } catch (e) {
        // ignore
      }
    }
  }, []);

  // Save to local storage on changes
  const updateCv = (newCv: CV) => {
    setCv(newCv);
    localStorage.setItem("she-enable-cv-draft", JSON.stringify(newCv));
  };

  // If user is logged in as candidate, pre-populate from profile
  const { data: profileData } = useQuery({
    queryKey: ["candidateCvPublic"],
    queryFn: apiProfile.getCv,
    enabled: !!token && user?.role === "CANDIDATE"
  });

  useEffect(() => {
    if (profileData?.cv) {
      setCv(profileData.cv);
    }
  }, [profileData]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: CV) => apiProfile.saveCv(data),
    onSuccess: () => {
      toast.success("CV saved directly to your professional profile!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save CV");
    }
  });

  const handleSave = () => {
    if (!token) {
      // Store current CV in localStorage and show registration modal
      localStorage.setItem("she-enable-cv-draft", JSON.stringify(cv));
      setShowRegModal(true);
      return;
    }
    saveMutation.mutate(cv);
  };

  const handlePrint = () => {
    window.print();
  };

  const getTemplateStyles = () => {
    if (selectedTemplate === "executive") {
      return {
        fontFamily: "'Playfair Display', Georgia, serif",
        borderTop: `8px solid ${accentColor}`,
      };
    } else if (selectedTemplate === "minimalist") {
      return {
        fontFamily: "system-ui, sans-serif",
        borderTop: "1px solid #e2e8f0",
      };
    } else { // modern
      return {
        fontFamily: "'Inter', sans-serif",
        borderTop: `8px solid ${accentColor}`,
      };
    }
  };

  return (
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Inter:wght@300;400;500;600;700;800&display=swap');
        @media print {
          body * { visibility: hidden; background: white !important; color: black !important; }
          #cv-print-area, #cv-print-area * { visibility: visible; }
          #cv-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; border: none !important; box-shadow: none !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>

      {/* Premium Header */}
      <div className="print:hidden">
        <SubpageNav
          actions={
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="px-4 h-9 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 press text-white"
              >
                <Download size={14} /> Download PDF
              </button>
              <button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="px-5 h-9 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all shadow-lg flex items-center gap-1.5 press"
              >
                {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                {token ? "Save to Profile" : "Save & Create Profile"}
              </button>
            </div>
          }
        />
      </div>

      <div className="flex-1 max-w-[1400px] mx-auto w-full p-6 grid lg:grid-cols-12 gap-8">
        {/* Left Form Panel */}
        <div className="lg:col-span-5 space-y-6 print:hidden">
          {/* Progress Tabs */}
          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-4 flex justify-between overflow-x-auto gap-2">
            {[
              { id: "info", label: "Info" },
              { id: "experience", label: "Work" },
              { id: "education", label: "Edu" },
              { id: "skills", label: "Skills" },
              { id: "preview", label: "Layout" }
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id as any)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                  step === s.id
                    ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
                    : "text-white/40 hover:text-white/60"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Form Step Cards */}
          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 shadow-xl">
            {step === "info" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#22C55E] flex items-center gap-2">
                  <Sparkles size={16} /> Personal Details
                </h3>
                <p className="text-xs text-white/50 mb-4">Start by adding your basic contact details to head your CV.</p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={cv.name}
                      onChange={(e) => updateCv({ ...cv, name: e.target.value })}
                      placeholder="e.g. Ayesha Rahman"
                      className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#22C55E] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Professional Title</label>
                    <input
                      type="text"
                      value={cv.title}
                      onChange={(e) => updateCv({ ...cv, title: e.target.value })}
                      placeholder="e.g. Senior Frontend Engineer"
                      className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#22C55E] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Email</label>
                      <input
                        type="email"
                        value={cv.email}
                        onChange={(e) => updateCv({ ...cv, email: e.target.value })}
                        placeholder="ayesha@example.com"
                        className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#22C55E] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Phone</label>
                      <input
                        type="text"
                        value={cv.phone}
                        onChange={(e) => updateCv({ ...cv, phone: e.target.value })}
                        placeholder="+92 300 1234567"
                        className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#22C55E] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Professional Summary</label>
                    <textarea
                      value={cv.summary}
                      onChange={(e) => updateCv({ ...cv, summary: e.target.value })}
                      rows={5}
                      placeholder="Briefly state your core expertise, key achievements, and the value you deliver."
                      className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#22C55E] transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    onClick={() => setStep("experience")}
                    className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    Work Experience <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {step === "experience" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#22C55E] flex items-center gap-2">
                  <Sparkles size={16} /> Professional Experience
                </h3>
                <p className="text-xs text-white/50 mb-4">List your past job roles, dates, and core quantifiable achievements.</p>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {(cv.experience || []).map((exp, i) => (
                    <div key={i} className="border border-white/5 bg-[#1A0D1F] p-4 rounded-2xl relative space-y-2">
                      <button
                        onClick={() => {
                          const newExp = [...(cv.experience || [])];
                          newExp.splice(i, 1);
                          updateCv({ ...cv, experience: newExp });
                        }}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-300 p-1 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.title}
                          onChange={(e) => {
                            const newExp = [...(cv.experience || [])];
                            newExp[i] = { ...exp, title: e.target.value };
                            updateCv({ ...cv, experience: newExp });
                          }}
                          placeholder="Job Title"
                          className="bg-[#0F0A1A] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => {
                            const newExp = [...(cv.experience || [])];
                            newExp[i] = { ...exp, company: e.target.value };
                            updateCv({ ...cv, experience: newExp });
                          }}
                          placeholder="Company Name"
                          className="bg-[#0F0A1A] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={exp.from}
                          onChange={(e) => {
                            const newExp = [...(cv.experience || [])];
                            newExp[i] = { ...exp, from: e.target.value };
                            updateCv({ ...cv, experience: newExp });
                          }}
                          placeholder="Start (e.g. Jan 2022)"
                          className="bg-[#0F0A1A] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          value={exp.to}
                          onChange={(e) => {
                            const newExp = [...(cv.experience || [])];
                            newExp[i] = { ...exp, to: e.target.value };
                            updateCv({ ...cv, experience: newExp });
                          }}
                          placeholder="End (e.g. Present)"
                          className="bg-[#0F0A1A] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>

                      {/* Achievement bullet */}
                      <div className="space-y-1">
                        <label className="block text-[8px] font-bold uppercase tracking-wider text-white/40">Achievements</label>
                        {exp.bullets.map((bullet, j) => (
                          <input
                            key={j}
                            type="text"
                            value={bullet}
                            onChange={(e) => {
                              const newBullets = [...exp.bullets];
                              newBullets[j] = e.target.value;
                              const newExp = [...(cv.experience || [])];
                              newExp[i] = { ...exp, bullets: newBullets };
                              updateCv({ ...cv, experience: newExp });
                            }}
                            placeholder="Add bullet achievement statement..."
                            className="w-full bg-[#0F0A1A] border border-white/5 rounded-xl px-3 py-1.5 text-[10px] text-white focus:outline-none"
                          />
                        ))}
                        <button
                          onClick={() => {
                            const newExp = [...(cv.experience || [])];
                            newExp[i] = { ...exp, bullets: [...exp.bullets, ""] };
                            updateCv({ ...cv, experience: newExp });
                          }}
                          className="text-[10px] text-[#22C55E] hover:underline font-bold flex items-center gap-0.5 mt-1"
                        >
                          <Plus size={10} /> Add Bullet
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const newExp = [...(cv.experience || []), { title: "", company: "", from: "", to: "", bullets: [""] }];
                    updateCv({ ...cv, experience: newExp });
                  }}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold border border-dashed border-white/15 transition-all flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> Add Role
                </button>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep("info")}
                    className="px-5 py-2 hover:bg-white/5 rounded-full text-xs font-bold transition-all text-white/60"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("education")}
                    className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    Education <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {step === "education" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#22C55E] flex items-center gap-2">
                  <Sparkles size={16} /> Education
                </h3>
                <p className="text-xs text-white/50 mb-4">Add your degrees, school certifications, and years of completion.</p>

                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {(cv.education || []).map((edu, i) => (
                    <div key={i} className="border border-white/5 bg-[#1A0D1F] p-4 rounded-2xl relative space-y-2">
                      <button
                        onClick={() => {
                          const newEdu = [...(cv.education || [])];
                          newEdu.splice(i, 1);
                          updateCv({ ...cv, education: newEdu });
                        }}
                        className="absolute top-3 right-3 text-red-400 hover:text-red-300 p-1 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>

                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => {
                          const newEdu = [...(cv.education || [])];
                          newEdu[i] = { ...edu, degree: e.target.value };
                          updateCv({ ...cv, education: newEdu });
                        }}
                        placeholder="Degree Title (e.g. BS Computer Science)"
                        className="w-full bg-[#0F0A1A] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => {
                            const newEdu = [...(cv.education || [])];
                            newEdu[i] = { ...edu, school: e.target.value };
                            updateCv({ ...cv, education: newEdu });
                          }}
                          placeholder="Institution Name (e.g. NUST)"
                          className="bg-[#0F0A1A] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                        <input
                          type="text"
                          value={edu.year}
                          onChange={(e) => {
                            const newEdu = [...(cv.education || [])];
                            newEdu[i] = { ...edu, year: e.target.value };
                            updateCv({ ...cv, education: newEdu });
                          }}
                          placeholder="Year of Graduation"
                          className="bg-[#0F0A1A] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const newEdu = [...(cv.education || []), { degree: "", school: "", year: "" }];
                    updateCv({ ...cv, education: newEdu });
                  }}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold border border-dashed border-white/15 transition-all flex items-center justify-center gap-1"
                >
                  <Plus size={14} /> Add Education Item
                </button>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep("experience")}
                    className="px-5 py-2 hover:bg-white/5 rounded-full text-xs font-bold transition-all text-white/60"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("skills")}
                    className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    Skills <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {step === "skills" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#22C55E] flex items-center gap-2">
                  <Sparkles size={16} /> Skills & Competencies
                </h3>
                <p className="text-xs text-white/50 mb-4">Add relevant technical stack and soft skills.</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(cv.skills || []).map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-semibold flex items-center gap-1"
                    >
                      {skill}
                      <button
                        onClick={() => {
                          const newSkills = (cv.skills || []).filter((_, idx) => idx !== index);
                          updateCv({ ...cv, skills: newSkills });
                        }}
                        className="text-white/40 hover:text-red-400 font-bold ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="+ Add skill (Press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = e.currentTarget.value.trim();
                      if (val) {
                        const newSkills = [...(cv.skills || []), val];
                        updateCv({ ...cv, skills: newSkills });
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                  className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-none focus:border-[#22C55E]"
                />

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep("education")}
                    className="px-5 py-2 hover:bg-white/5 rounded-full text-xs font-bold transition-all text-white/60"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("preview")}
                    className="px-5 py-2 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    Visual Theme <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}

            {step === "preview" && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-[#22C55E] flex items-center gap-2">
                  <Palette size={16} /> Theme Customizer
                </h3>
                <p className="text-xs text-white/50 mb-4">Customize the structure and colors of your generated PDF.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Select Template Style</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: "modern", name: "Sleek Modern", icon: Type },
                        { id: "executive", name: "Executive Class", icon: Palette },
                        { id: "minimalist", name: "Clean Minimal", icon: Sparkles }
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setSelectedTemplate(t.id as any)}
                          className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                            selectedTemplate === t.id
                              ? "border-[#22C55E] bg-[#22C55E]/5 text-[#22C55E] font-bold shadow-sm"
                              : "border-white/5 hover:border-white/10 text-white/55 hover:text-white"
                          }`}
                        >
                          <t.icon size={14} />
                          <span className="text-[10px] truncate">{t.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Accent Highlights</label>
                    <div className="flex gap-2.5">
                      {[
                        { hex: "#22C55E", name: "Emerald" },
                        { hex: "#7C3AED", name: "Violet" },
                        { hex: "#EC4899", name: "Rose" },
                        { hex: "#F59E0B", name: "Amber" },
                        { hex: "#3B82F6", name: "Sky" },
                        { hex: "#1F2937", name: "Dark" }
                      ].map((c) => (
                        <button
                          key={c.hex}
                          onClick={() => setAccentColor(c.hex)}
                          className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center ${
                            accentColor === c.hex ? "ring-2 ring-[#22C55E] ring-offset-2 ring-offset-[#1A0D1F]" : "border-white/10"
                          }`}
                          style={{ backgroundColor: c.hex }}
                        >
                          {accentColor === c.hex && <Check size={12} className="text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    onClick={() => setStep("skills")}
                    className="px-5 py-2 hover:bg-white/5 rounded-full text-xs font-bold transition-all text-white/60"
                  >
                    Back
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-5 py-2 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all shadow-lg flex items-center gap-1"
                  >
                    <Download size={12} /> Compile & Print PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Preview Panel */}
        <div className="lg:col-span-7 bg-white/5 border border-white/5 rounded-3xl p-6 overflow-y-auto max-h-[85vh]">
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#22C55E] mb-4 print:hidden">Live Interactive Document Preview</h4>

          {(!cv.name && !cv.title) ? (
            <div className="text-center py-24 text-white/30 border border-dashed border-white/5 rounded-2xl flex flex-col items-center gap-2">
              <Sparkles size={36} className="text-white/20 animate-pulse" />
              <div className="text-sm font-bold">Your CV compilations appear here</div>
              <p className="text-[10px] text-white/20 max-w-xs mx-auto">Fill out the basic details on the left to see the template populate in real-time.</p>
            </div>
          ) : (
            <div
              id="cv-print-area"
              className="bg-white text-black p-8 rounded-2xl shadow-xl transition-all"
              style={getTemplateStyles()}
            >
              {/* Header */}
              <div className="border-b border-gray-200 pb-5 mb-5 flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-black tracking-tight" style={{ color: selectedTemplate === "minimalist" ? "black" : accentColor }}>
                    {cv.name || "Ayesha Rahman"}
                  </h1>
                  <p className="text-xs uppercase font-extrabold tracking-wider text-gray-500 mt-1">
                    {cv.title || "Professional Developer"}
                  </p>
                  <div className="flex gap-4 mt-2.5 text-[10px] text-gray-400">
                    {cv.email && <span>📧 {cv.email}</span>}
                    {cv.phone && <span>📞 {cv.phone}</span>}
                  </div>
                </div>
              </div>

              {/* Summary */}
              {cv.summary && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color: accentColor, borderColor: `${accentColor}20` }}>
                    Professional Profile
                  </h3>
                  <p className="text-[11px] text-gray-600 leading-relaxed whitespace-pre-wrap">{cv.summary}</p>
                </div>
              )}

              {/* Skills */}
              {cv.skills && cv.skills.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color: accentColor, borderColor: `${accentColor}20` }}>
                    Key Competencies
                  </h3>
                  <div className="flex flex-wrap gap-1">
                    {cv.skills.map((s, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 text-[9px] font-bold px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {cv.experience && cv.experience.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color: accentColor, borderColor: `${accentColor}20` }}>
                    Professional Experience
                  </h3>
                  <div className="space-y-4">
                    {cv.experience.map((exp, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between items-baseline text-[11px] font-bold text-gray-800">
                          <span>{exp.title}</span>
                          <span className="text-[9px] text-gray-400">{exp.from} – {exp.to}</span>
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 mt-0.5">{exp.company}</p>
                        <ul className="list-disc list-inside mt-1.5 text-[10px] text-gray-500 space-y-1">
                          {exp.bullets.filter(Boolean).map((bullet, bulletIdx) => (
                            <li key={bulletIdx}>{bullet}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {cv.education && cv.education.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-extrabold uppercase tracking-widest mb-2 pb-1 border-b" style={{ color: accentColor, borderColor: `${accentColor}20` }}>
                    Education & Credentials
                  </h3>
                  <div className="space-y-2">
                    {cv.education.map((edu, idx) => (
                      <div key={idx} className="flex justify-between items-baseline text-[10px] text-gray-600">
                        <div>
                          <span className="font-bold text-gray-800">{edu.degree}</span>
                          <span className="text-gray-400"> · {edu.school}</span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400">{edu.year}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Guest Registration Dialog */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in print:hidden">
          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto text-[#22C55E]">
              <UserCheck size={24} />
            </div>
            <h3 className="font-serif text-lg font-bold text-white">Save CV to Profile</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Create a free candidate profile on SheEnableAI to persist your CV online, unlock direct 1-click job applications, and receive smart AI recommendations.
            </p>
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowRegModal(false);
                  navigate("/auth/signup");
                }}
                className="w-full py-2.5 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all"
              >
                Sign Up as Candidate
              </button>
              <button
                onClick={() => setShowRegModal(false)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all text-white/60"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
