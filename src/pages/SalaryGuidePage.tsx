import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, ShieldAlert, Sparkles, Plus, Check, MapPin, Briefcase, RefreshCw, Send, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
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
      const res = await axios.get("http://localhost:5000/api/salaries");
      return res.data.data;
    }
  });

  // Submit salary mutation
  const submitMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await axios.post("http://localhost:5000/api/salaries", {
        ...data,
        salaryPKR: Number(data.salaryPKR),
        experienceYears: Number(data.experienceYears)
      }, {
        withCredentials: true // For auth middleware compatibility
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
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      {/* Header */}
      <SubpageNav
        actions={
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 h-9 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all flex items-center gap-1 shadow-lg press"
          >
            <Plus size={14} /> Contribute Anonymously
          </button>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-8">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            Salary <span className="text-[#22C55E]">Transparency Index</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Establishing wage equity in Pakistan's software industry through verified aggregates. Explore salary ranges, compare percentiles, and anonymously track the gender pay gap.
          </p>
        </div>

        {/* Global Stats Cards */}
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Verified Crowdsources</span>
            <div className="text-2xl font-black text-[#22C55E]">
              {salaryStats ? salaryStats.reduce((sum, s) => sum + s.count, 0) : "..."}
            </div>
            <p className="text-[10px] text-white/40">Active, clean, verified salary records in Pakistan.</p>
          </div>

          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-5 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">DEI Gender Parity Ratio</span>
            <div className="text-2xl font-black text-purple-400">
              {salaryStats && salaryStats.length > 0
                ? Math.round(salaryStats.reduce((sum, s) => sum + s.parityRatio, 0) / salaryStats.length)
                : "92"}%
            </div>
            <p className="text-[10px] text-white/40">Average female wage parity relative to male benchmarks.</p>
          </div>

          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-5 space-y-2 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Contribute Data</span>
            <button
              onClick={() => setShowAddForm(true)}
              className="py-1.5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold transition-all text-center"
            >
              Add Your Salary anonymously
            </button>
          </div>
        </div>

        {/* Main Explorer Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between bg-[#0F0A1A] border border-white/5 rounded-3xl p-4 shadow-lg">
            <div className="relative flex-1">
              <Plus size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search job roles (e.g. Frontend Engineer, Product Manager, Lahore)..."
                className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#22C55E]"
              />
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-3 bg-[#1A0D1F] border border-white/5 hover:bg-white/5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={12} /> Sync Data
            </button>
          </div>

          {isLoading ? (
            <div className="text-center py-20 animate-pulse">
              <Loader2 className="animate-spin text-[#22C55E] mx-auto mb-2" size={24} />
              <span className="text-xs text-white/40">Compiling crowdsourced indices...</span>
            </div>
          ) : filteredStats.length === 0 ? (
            <div className="text-center py-20 bg-[#0F0A1A] border border-white/5 rounded-3xl text-white/30 flex flex-col items-center gap-2">
              <DollarSign size={36} className="text-white/20" />
              <div className="text-sm font-bold">No salary indices matched your criteria</div>
              <p className="text-[10px] text-white/20">Be the first to contribute to this role category!</p>
            </div>
          ) : (
            /* Salary Stat Grid Cards */
            <div className="grid md:grid-cols-2 gap-6">
              {filteredStats.map((stat, idx) => (
                <div key={idx} className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 space-y-4 shadow-xl">
                  {/* Role Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Briefcase size={15} className="text-[#22C55E]" /> {stat.role}
                      </h3>
                      <div className="text-[10px] text-white/40 flex items-center gap-2 mt-1">
                        <span className="flex items-center gap-0.5"><MapPin size={10} /> {stat.cities.join(", ")}</span>
                        <span>·</span>
                        <span>Avg experience: {stat.avgExperience} yrs</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] rounded-full text-[9px] font-bold">
                      {stat.count} records
                    </span>
                  </div>

                  {/* Wage ranges bar chart */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/40">
                      <span>Min: PKR {stat.min.toLocaleString()}</span>
                      <span className="font-bold text-white">Median: PKR {stat.median.toLocaleString()}</span>
                      <span>Max: PKR {stat.max.toLocaleString()}</span>
                    </div>
                    <div className="h-2.5 bg-[#1A0D1F] border border-white/5 rounded-full overflow-hidden relative">
                      {/* Highlighted median range */}
                      <div className="h-full bg-gradient-to-r from-[#22C55E]/50 to-[#22C55E] rounded-full" style={{ width: "70%", marginLeft: "15%" }} />
                    </div>
                  </div>

                  {/* DEI pay parity scale */}
                  <div className="bg-[#1A0D1F] border border-white/5 p-3 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Pay Parity Index</span>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <Sparkles size={11} className="text-purple-400" />
                        {stat.parityRatio}% Equity ratio
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/40">Female Median</span>
                      <div className="text-xs font-bold text-[#22C55E] mt-0.5">PKR {stat.femaleMedian.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contribution Drawer/Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAddForm(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white font-bold text-sm"
            >
              ×
            </button>
            <h3 className="font-serif text-lg font-bold text-white flex items-center gap-2">
              <DollarSign size={18} className="text-[#22C55E]" /> Contribute Anonymously
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Your identity is protected. We completely anonymize and aggregates all reports. Contributions help verify pay scales and fight wage discrimination.
            </p>

            <form onSubmit={handleAddSubmit} className="space-y-3 pt-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Job Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#22C55E]"
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
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Experience (Years)</label>
                  <input
                    type="number"
                    value={form.experienceYears}
                    onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
                    className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#22C55E]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">City Hub</label>
                  <select
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Monthly Salary (PKR)</label>
                <input
                  type="number"
                  value={form.salaryPKR}
                  onChange={(e) => setForm({ ...form, salaryPKR: e.target.value })}
                  placeholder="e.g. 180000"
                  className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Your Gender</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none"
                  >
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Sector Industry</label>
                  <input
                    type="text"
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="w-full mt-3 py-3 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all flex items-center justify-center gap-1 shadow-lg"
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
