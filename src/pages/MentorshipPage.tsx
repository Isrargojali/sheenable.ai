import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Sparkles, Heart, Clock, Check, Plus, ArrowRight, UserCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import axios from "axios";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

interface Mentor {
  _id: string;
  userId: { _id: string; firstName: string; lastName: string; email: string };
  title: string;
  company: string;
  expertise: string[];
  bio: string;
  avatarUrl?: string;
  availability: { days: string[]; hours: string };
  bookingsCount: number;
}

export default function MentorshipPage() {
  const queryClient = useQueryClient();
  const { token } = useAuthStore();
  const [search, setSearch] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState("");
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);

  // Fetch mentors from API
  const { data: mentors, isLoading } = useQuery<Mentor[]>({
    queryKey: ["mentors", selectedExpertise],
    queryFn: async () => {
      const res = await axios.get("http://localhost:5000/api/mentors", {
        params: { expertise: selectedExpertise },
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return res.data.data;
    },
    enabled: !!token // Protected route
  });

  // Book mentorship session
  const bookMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      const res = await axios.post(`http://localhost:5000/api/mentors/${mentorId}/book`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Mentorship booking request submitted successfully!");
      setActiveMentor(null);
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to submit booking session.");
    }
  });

  const handleBook = () => {
    if (activeMentor) {
      bookMutation.mutate(activeMentor._id);
    }
  };

  const filteredMentors = (mentors || []).filter(m =>
    `${m.userId.firstName} ${m.userId.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.company.toLowerCase().includes(search.toLowerCase()) ||
    m.bio.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Main Content */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-8">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            Verified <span className="text-[#22C55E]">Mentorship Matchings</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Accelerate your career through direct guidelines from Pakistan's top-tier female tech executives, engineering directors, and product leaders.
          </p>
        </div>

        {!token ? (
          /* Locked State for Guest Users */
          <div className="max-w-md mx-auto text-center bg-[#0F0A1A] border border-white/5 rounded-3xl p-8 space-y-4 shadow-xl">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto text-purple-400">
              <Sparkles size={24} />
            </div>
            <h3 className="font-serif text-base font-bold text-white">Mentorship Discovery is Locked</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Mentorship pairings and active scheduling windows are accessible exclusively to registered users of the SheEnableAI platform to maintain high-quality matches.
            </p>
            <div className="pt-2 space-y-2">
              <Link
                to="/auth/signup"
                className="w-full py-2.5 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all flex items-center justify-center gap-1 shadow-lg"
              >
                Sign Up as Candidate
              </Link>
              <Link
                to="/auth/login"
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all flex items-center justify-center text-white/60"
              >
                Login to Account
              </Link>
            </div>
          </div>
        ) : (
          /* Mentorship board */
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4 bg-[#0F0A1A] border border-white/5 rounded-3xl p-4 shadow-lg">
              {/* Search */}
              <div className="md:col-span-2 relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search mentors by name, company, background..."
                  className="w-full bg-[#1A0D1F] border border-white/5 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-[#22C55E]"
                />
              </div>

              {/* Specialty selector */}
              <select
                value={selectedExpertise}
                onChange={(e) => setSelectedExpertise(e.target.value)}
                className="bg-[#1A0D1F] border border-white/5 rounded-2xl px-4 py-3 text-xs text-white/70 focus:outline-none focus:border-[#22C55E]"
              >
                <option value="">All Specialties</option>
                <option value="System Architecture">System Architecture</option>
                <option value="UX Research">UX Research</option>
                <option value="React">React</option>
                <option value="Product Strategy">Product Strategy</option>
              </select>
            </div>

            {isLoading ? (
              <div className="text-center py-20 animate-pulse">
                <Loader2 className="animate-spin text-[#22C55E] mx-auto mb-2" size={24} />
                <span className="text-xs text-white/40">Loading professional mentors cohort...</span>
              </div>
            ) : filteredMentors.length === 0 ? (
              <div className="text-center py-20 bg-[#0F0A1A] border border-white/5 rounded-3xl text-white/30 flex flex-col items-center gap-2">
                <UserCheck size={36} className="text-white/20" />
                <div className="text-sm font-bold">No mentors matched your criteria</div>
                <p className="text-[10px] text-white/20">Try clearing filters or search queries.</p>
              </div>
            ) : (
              /* Mentors Grid */
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMentors.map((mentor) => (
                  <div
                    key={mentor._id}
                    className="bg-[#0F0A1A] border border-white/5 hover:border-white/10 rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 hover:shadow-xl transition-all duration-300 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        {mentor.avatarUrl ? (
                          <img
                            src={mentor.avatarUrl}
                            alt={`${mentor.userId.firstName} ${mentor.userId.lastName}`}
                            className="w-12 h-12 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-bold text-white/70">
                            {mentor.userId.firstName[0]}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-bold text-white">{mentor.userId.firstName} {mentor.userId.lastName}</h4>
                          <p className="text-[10px] text-white/40 mt-0.5">{mentor.title} · {mentor.company}</p>
                        </div>
                      </div>

                      <p className="text-[11px] text-white/50 leading-relaxed line-clamp-3">
                        {mentor.bio}
                      </p>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {mentor.expertise.map((exp, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-[#1A0D1F] border border-white/5 rounded text-[8px] text-white/50 font-bold">
                            {exp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-3 flex items-center justify-between">
                      <div className="text-[9px] text-white/40 flex items-center gap-0.5">
                        <Clock size={10} /> {mentor.availability.days.join(", ")}
                      </div>
                      <button
                        onClick={() => setActiveMentor(mentor)}
                        className="px-3.5 py-1.5 bg-[#22C55E]/10 border border-[#22C55E]/20 text-[#22C55E] text-[10px] font-bold rounded-full group-hover:bg-[#22C55E] group-hover:text-[#0F0A1A] transition-all flex items-center gap-0.5 shadow"
                      >
                        Book Slot <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scheduler Modal */}
      {activeMentor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-[#0F0A1A] border border-white/5 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center">
            <button
              onClick={() => setActiveMentor(null)}
              className="absolute top-4 right-4 text-white/40 hover:text-white font-bold text-sm"
            >
              ×
            </button>
            <div className="w-12 h-12 bg-[#22C55E]/10 rounded-full flex items-center justify-center mx-auto text-[#22C55E]">
              <Clock size={24} />
            </div>
            <h3 className="font-serif text-base font-bold text-white">Book Mentorship Session</h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Confirm your booking request with <strong>{activeMentor.userId.firstName} {activeMentor.userId.lastName}</strong>.
            </p>
            <div className="bg-[#1A0D1F] border border-white/5 p-3 rounded-2xl text-[10px] text-white/60 space-y-1 text-left">
              <div>📅 <strong>Availability Window:</strong> {activeMentor.availability.days.join(", ")}</div>
              <div>⏰ <strong>Active Hours:</strong> {activeMentor.availability.hours}</div>
              <div>🎯 <strong>Focus Expertise:</strong> {activeMentor.expertise.join(", ")}</div>
            </div>
            <div className="pt-2 space-y-2">
              <button
                onClick={handleBook}
                disabled={bookMutation.isPending}
                className="w-full py-2.5 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] rounded-full text-xs font-black transition-all flex items-center justify-center gap-1 shadow-lg"
              >
                {bookMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Confirm Booking Request
              </button>
              <button
                onClick={() => setActiveMentor(null)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 rounded-full text-xs font-bold transition-all text-white/60"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
