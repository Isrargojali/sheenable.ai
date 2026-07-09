import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, ShieldAlert, Sparkles, Plus, Check, MapPin, Briefcase, RefreshCw, Send, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

interface SalaryStat {
  role: string;
  count: number;
  min: number;
  median: number;
  max: number;
  avgExperience: number;
  cities: string[];
  femaleMedian: number;
  maleMedian: number;
  parityRatio: number;
}

export default function SalaryGuidePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [form, setForm] = useState({
    role: "Frontend Engineer",
    industry: "SaaS",
    experienceYears: "3",
    city: "Lahore",
    salaryPKR: "",
    gender: "FEMALE"
  });

  // Fetch salary stats
  const { data: salaryStats, isLoading, refetch } = useQuery<SalaryStat[]>({
    queryKey: ["salaryStats"],
    queryFn: async () => {
      const res = await api.get("/salaries");
      return res.data.data;
    }
  });

  // Submit salary mutation
  const submitMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await api.post("/salaries", {
        ...data,
        salaryPKR: Number(data.salaryPKR),
        experienceYears: Number(data.experienceYears)
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Thank you! Your anonymous salary contribution has been verified.");
      setShowAddForm(false);
      setForm({
        role: "Frontend Engineer",
        industry: "SaaS",
        experienceYears: "3",
        city: "Lahore",
        salaryPKR: "",
        gender: "FEMALE"
      });
      queryClient.invalidateQueries({ queryKey: ["salaryStats"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit report. Please make sure you are logged in.");
    }
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.salaryPKR) {
      toast.error("Please specify your monthly salary in PKR.");
      return;
    }
    submitMutation.mutate(form);
  };

  const filteredStats = (salaryStats || []).filter(s =>
    s.role.toLowerCase().includes(search.toLowerCase()) ||
    s.cities.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink-700)] flex flex-col">
      {/* Header Band (Dark) */}
      <div className="bg-[var(--surface-dark)]">
        <SubpageNav
          actions={
            <button
              onClick={() => setShowAddForm(true)}
              className="px-5 h-10 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-[14px] font-medium transition-all flex items-center gap-1.5 shadow-sm press"
            >
              <Plus size={14} className="text-white" /> Contribute Anonymously
            </button>
          }
        />
      </div>

      {/* Hero Title Section (Dark) */}
      <section className="bg-[var(--surface-dark)] text-white pb-16 pt-6">
        <div className="relative max-w-[1200px] mx-auto px-6 text-center max-w-2xl space-y-3">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            Salary <span className="text-[var(--brand-pink)]">Transparency Index</span>
          </h2>
          <p className="text-sm text-[var(--on-dark-secondary)] leading-relaxed">
            Establishing wage equity in Pakistan's software industry through verified aggregates. Explore salary ranges, compare percentiles, and anonymously track the gender pay gap.
          </p>
        </div>
      </section>

      {/* Main Content Area (Light) */}
      <main className="flex-1 bg-[var(--surface)] text-[var(--ink-700)] -mt-8 relative z-10">
        <div className="max-w-[1200px] mx-auto w-full px-6 pb-16 space-y-8">
          {/* Global Stats Cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-6 flex flex-col justify-between shadow-[var(--shadow-card)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Verified Crowdsources</span>
              <div className="text-[40px] font-semibold tracking-tight text-[var(--ink-900)] leading-none my-2">
                {salaryStats ? salaryStats.reduce((sum, s) => sum + s.count, 0) : "..."}
              </div>
              <p className="text-[13px] font-normal text-[var(--ink-500)]">Active, clean, verified salary records in Pakistan.</p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-6 flex flex-col justify-between shadow-[var(--shadow-card)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">DEI Gender Parity Ratio</span>
              <div className="text-[40px] font-semibold tracking-tight text-[var(--brand-pink)] leading-none my-2">
                {salaryStats && salaryStats.length > 0
                  ? Math.round(salaryStats.reduce((sum, s) => sum + s.parityRatio, 0) / salaryStats.length)
                  : "92"}%
              </div>
              <p className="text-[13px] font-normal text-[var(--ink-500)]">Average female wage parity relative to male benchmarks.</p>
            </div>

            <div className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-6 flex flex-col justify-between shadow-[var(--shadow-card)]">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Contribute Data</span>
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full h-10 px-5 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white text-[14px] font-medium rounded-full transition-all shadow-sm flex items-center justify-center gap-1.5 press mt-2"
              >
                Add Your Salary anonymously
              </button>
            </div>
          </div>

          {/* Main Explorer Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-input)] p-2 shadow-[var(--shadow-card)]">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-500)]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search roles (e.g. Frontend Engineer, Product Manager)..."
                  className="w-full bg-transparent border-0 rounded-none pl-10 pr-4 py-3 text-xs text-[var(--ink-900)] placeholder:text-[var(--ink-500)] focus:outline-none focus:ring-0"
                />
              </div>
              <button
                onClick={() => refetch()}
                className="px-4 h-9 bg-transparent border-[1.5px] border-[var(--brand-pink)] text-[var(--brand-pink)] hover:bg-[var(--brand-pink-soft)] rounded-full text-[13px] font-medium transition-all flex items-center justify-center gap-1.5 press"
              >
                <RefreshCw size={12} className="text-[var(--brand-pink)]" /> Sync Data
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-20 animate-pulse">
                <Loader2 className="animate-spin text-[var(--brand-pink)] mx-auto mb-2" size={24} />
                <span className="text-xs text-[var(--ink-500)]">Compiling crowdsourced indices...</span>
              </div>
            ) : filteredStats.length === 0 ? (
              <div className="text-center py-20 bg-[var(--surface)] border border-[var(--ink-200)] rounded-3xl text-[var(--ink-500)] flex flex-col items-center gap-2">
                <DollarSign size={36} className="text-[var(--ink-400)]" />
                <div className="text-sm font-bold">No salary indices matched your criteria</div>
                <p className="text-[10px] text-[var(--ink-400)]">Be the first to contribute to this role category!</p>
              </div>
            ) : (
              /* Salary Stat Grid Cards */
              <div className="grid md:grid-cols-2 gap-4">
                {filteredStats.map((stat, idx) => (
                  <div key={idx} className="bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-6 space-y-4 shadow-[var(--shadow-card)] transition-all hover:border-[var(--brand-pink)]/30 text-[var(--ink-700)]">
                    {/* Role Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        <Briefcase size={16} className="text-[var(--ink-500)]" />
                        <h3 className="text-[16px] font-semibold text-[var(--ink-900)]">
                          {stat.role}
                        </h3>
                      </div>
                      <span className="px-[10px] py-[2px] bg-[var(--ink-100)] text-[var(--ink-700)] rounded-full text-[11px] font-normal lowercase">
                        {stat.count} records
                      </span>
                    </div>

                    {/* Location and experience */}
                    <div className="text-[12px] font-normal text-[var(--ink-500)] flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-0.5"><MapPin size={10} /> {stat.cities.join(", ")}</span>
                      <span>·</span>
                      <span>Avg experience: {stat.avgExperience} yrs</span>
                    </div>

                    {/* Wage ranges bar chart */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[12px] font-normal text-[var(--ink-500)]">
                        <span>Min: PKR {stat.min.toLocaleString()}</span>
                        <span className="font-semibold text-[var(--ink-900)]">Median: PKR {stat.median.toLocaleString()}</span>
                        <span>Max: PKR {stat.max.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 bg-[var(--ink-100)] rounded-full overflow-hidden relative">
                        {/* Highlighted median range */}
                        <div className="h-full bg-[var(--brand-pink)] rounded-full" style={{ width: "70%", marginLeft: "15%" }} />
                      </div>
                    </div>

                    {/* DEI pay parity scale */}
                    <div className="bg-[var(--surface-muted)] border border-[var(--ink-200)] rounded-[var(--radius-input)] p-3 flex justify-between items-center">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Pay Parity Index</span>
                        <div className="text-[13px] font-medium text-[var(--ink-900)] flex items-center gap-1.5 mt-0.5">
                          <Sparkles size={12} strokeWidth={1.75} className="text-[var(--ink-500)]" />
                          {stat.parityRatio}% Equity ratio
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Female Median</span>
                        <div className="text-[13px] font-semibold text-[var(--brand-pink)] mt-0.5">PKR {stat.femaleMedian.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Contribution Drawer/Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-[var(--ink-200)] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative text-[var(--ink-700)]">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-[var(--ink-500)] hover:text-[var(--ink-900)] font-bold text-sm"
            >
              ×
            </button>
            <h3 className="font-serif text-lg font-bold text-[var(--ink-900)] flex items-center gap-2">
              <DollarSign size={18} className="text-[var(--brand-pink)]" /> Contribute Anonymously
            </h3>
            <p className="text-xs text-[var(--ink-500)] leading-relaxed">
              Your identity is protected. We completely anonymize and aggregate all reports. Contributions help verify pay scales and fight wage discrimination.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">Job Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-white border border-[var(--ink-300)] rounded-2xl px-4 py-3 text-xs text-[var(--ink-900)] focus:outline-none focus:border-[var(--brand-pink)]"
                >
                  <option value="Frontend Engineer">Frontend Engineer</option>
                  <option value="Backend Engineer">Backend Engineer</option>
                  <option value="Senior Product Manager">Senior Product Manager</option>
                  <option value="UX Lead">UX Lead</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Content Strategist">Content Strategist</option>
                  <option value="HR Business Partner">HR Business Partner</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                    className="w-full bg-white border border-[var(--ink-300)] rounded-2xl px-4 py-3 text-xs text-[var(--ink-900)] focus:outline-none focus:border-[var(--brand-pink)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">City Hub</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-white border border-[var(--ink-300)] rounded-2xl px-4 py-3 text-xs text-[var(--ink-900)] focus:outline-none focus:border-[var(--brand-pink)]"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">Monthly Salary (PKR)</label>
                <input
                  type="number"
                  value={form.salaryPKR}
                  onChange={(e) => setForm({ ...form, salaryPKR: e.target.value })}
                  placeholder="e.g. 180000"
                  className="w-full bg-white border border-[var(--ink-300)] rounded-2xl px-4 py-3 text-xs text-[var(--ink-900)] placeholder:text-[var(--ink-500)] focus:outline-none focus:border-[var(--brand-pink)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">Your Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full bg-white border border-[var(--ink-300)] rounded-2xl px-4 py-3 text-xs text-[var(--ink-900)] focus:outline-none focus:border-[var(--brand-pink)]"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--ink-500)] mb-1">Sector Industry</label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    placeholder="e.g. SaaS"
                    className="w-full bg-white border border-[var(--ink-300)] rounded-2xl px-4 py-3 text-xs text-[var(--ink-900)] focus:outline-none focus:border-[var(--brand-pink)]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full mt-3 py-3 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-black transition-all flex items-center justify-center gap-1 shadow-lg"
              >
                {submitMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Verify & Submit anonymously
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
