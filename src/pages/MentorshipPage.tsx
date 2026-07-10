import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Sparkles, Heart, Clock, Check, Plus, ArrowRight, UserCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { api } from "@/lib/api";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [selectedExpertise, setSelectedExpertise] = useState("all");
  const [activeMentor, setActiveMentor] = useState<Mentor | null>(null);

  // Fetch mentors from API
  const { data: mentors, isLoading } = useQuery<Mentor[]>({
    queryKey: ["mentors", selectedExpertise],
    queryFn: async () => {
      const res = await api.get("/mentors", {
        params: { expertise: selectedExpertise === "all" ? "" : selectedExpertise }
      }) as any;
      return res.data.data;
    },
    enabled: !!token // Protected route
  });

  // Book mentorship session
  const bookMutation = useMutation({
    mutationFn: async (mentorId: string) => {
      const res = await api.post(`/mentors/${mentorId}/book`) as any;
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
    <div className="min-h-screen bg-[var(--surface)] text-[var(--ink-700)] flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Hero Section (Dark) */}
      <section className="bg-[var(--surface-dark)] text-white py-16">
        <div className="relative max-w-[1200px] mx-auto px-6 text-center max-w-2xl space-y-3">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            Verified <span className="italic text-[var(--brand-pink)]">Mentorship Matchings</span>
          </h2>
          <p className="text-sm text-[var(--on-dark-secondary)] leading-relaxed">
            Accelerate your career through direct guidelines from Pakistan's top-tier female tech executives, engineering directors, and product leaders.
          </p>
        </div>
      </section>

      {/* Main Content (Light) */}
      <main className="flex-1 bg-[var(--surface)] text-[var(--ink-700)] py-12">
        <div className="max-w-[1200px] mx-auto w-full px-6 space-y-8">
          {!token ? (
            /* Locked State for Guest Users */
            <div className="max-w-md mx-auto text-center bg-white border border-[var(--ink-200)] rounded-3xl p-8 space-y-4 shadow-[var(--shadow-card)]">
              <div className="w-12 h-12 bg-[var(--brand-pink-tint)] rounded-full flex items-center justify-center mx-auto text-[var(--brand-pink)]">
                <Sparkles size={24} />
              </div>
              <h3 className="font-serif text-base font-bold text-[var(--ink-900)]">Mentorship Discovery is Locked</h3>
              <p className="text-xs text-[var(--ink-500)] leading-relaxed">
                Mentorship pairings and active scheduling windows are accessible exclusively to registered users of the SheEnableAI platform to maintain high-quality matches.
              </p>
              <div className="pt-2 space-y-2">
                <Link
                  to="/auth/signup"
                  className="w-full py-2.5 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-black transition-all flex items-center justify-center gap-1 shadow-lg"
                >
                  Sign Up as Candidate
                </Link>
                <Link
                  to="/auth/login"
                  className="w-full py-2.5 bg-[var(--ink-100)] hover:bg-[var(--ink-200)] text-[var(--ink-700)] border border-[var(--ink-300)] rounded-full text-xs font-bold transition-all flex items-center justify-center"
                >
                  Login to Account
                </Link>
              </div>
            </div>
          ) : (
            /* Mentorship board */
            <div className="space-y-6">
              <div className="grid md:grid-cols-3 gap-4 bg-white border border-[var(--ink-200)] rounded-3xl p-4 shadow-[var(--shadow-card)]">
                {/* Search */}
                <div className="md:col-span-2 relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-500)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search mentors by name, company, background..."
                    className="w-full bg-white border border-[var(--ink-300)] rounded-2xl pl-10 pr-4 py-3 text-xs text-[var(--ink-900)] focus:outline-none focus:border-[var(--brand-pink)]"
                  />
                </div>

                {/* Specialty selector */}
                <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                  <SelectTrigger className="w-full bg-white border border-[var(--ink-300)] hover:bg-[var(--ink-100)] text-xs text-[var(--ink-900)] focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none cursor-pointer rounded-2xl px-4 py-3 h-auto flex items-center justify-between transition-colors">
                    <SelectValue placeholder="Specialty" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[var(--ink-200)] rounded-xl shadow-2xl min-w-[200px] p-1 text-[var(--ink-900)]">
                    <SelectItem value="all" className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-tint)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      All Specialties
                    </SelectItem>
                    <SelectItem value="System Architecture" className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-tint)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      System Architecture
                    </SelectItem>
                    <SelectItem value="UX Research" className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-tint)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      UX Research
                    </SelectItem>
                    <SelectItem value="React" className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-tint)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      React
                    </SelectItem>
                    <SelectItem value="Product Strategy" className="text-xs font-semibold text-[var(--ink-700)] focus:bg-[var(--brand-pink-tint)] focus:text-[var(--brand-pink)] rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      Product Strategy
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="text-center py-20 animate-pulse">
                  <Loader2 className="animate-spin text-[var(--brand-pink)] mx-auto mb-2" size={24} />
                  <span className="text-xs text-[var(--ink-500)]">Loading professional mentors cohort...</span>
                </div>
              ) : filteredMentors.length === 0 ? (
                <div className="text-center py-20 bg-white border border-[var(--ink-200)] rounded-3xl text-[var(--ink-500)] flex flex-col items-center gap-2 shadow-[var(--shadow-card)]">
                  <UserCheck size={36} className="text-[var(--ink-400)]" />
                  <div className="text-sm font-bold text-[var(--ink-700)]">No mentors matched your criteria</div>
                  <p className="text-[10px] text-[var(--ink-500)]">Try clearing filters or search queries.</p>
                </div>
              ) : (
                /* Mentors Grid */
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMentors.map((mentor) => (
                    <div
                      key={mentor._id}
                      className="bg-white border border-[var(--ink-200)] hover:border-[var(--brand-pink)]/30 rounded-3xl p-5 shadow-[var(--shadow-card)] flex flex-col justify-between space-y-4 hover:shadow-xl transition-all duration-300 group text-[var(--ink-700)]"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {mentor.avatarUrl ? (
                            <img
                              src={mentor.avatarUrl}
                              alt={`${mentor.userId.firstName} ${mentor.userId.lastName}`}
                              className="w-12 h-12 rounded-full object-cover border border-[var(--ink-200)]"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-[var(--ink-100)] rounded-full flex items-center justify-center font-bold text-[var(--ink-700)] border border-[var(--ink-200)]">
                              {mentor.userId.firstName[0]}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-[var(--ink-900)]">{mentor.userId.firstName} {mentor.userId.lastName}</h4>
                            <p className="text-[10px] text-[var(--ink-500)] mt-0.5">{mentor.title} · {mentor.company}</p>
                          </div>
                        </div>

                        <p className="text-[11px] text-[var(--ink-500)] leading-relaxed line-clamp-3">
                          {mentor.bio}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {mentor.expertise.map((exp, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-[var(--ink-100)] border border-[var(--ink-200)] rounded text-[8px] text-[var(--ink-700)] font-bold uppercase tracking-wider">
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--ink-200)] pt-3 flex items-center justify-between">
                        <div className="text-[9px] text-[var(--ink-500)] flex items-center gap-0.5">
                          <Clock size={10} /> {mentor.availability.days.join(", ")}
                        </div>
                        <button
                          onClick={() => setActiveMentor(mentor)}
                          className="px-3.5 py-1.5 bg-[var(--brand-pink-tint)] border border-[var(--brand-pink)]/20 text-[var(--brand-pink)] text-[10px] font-bold rounded-full group-hover:bg-[var(--brand-pink)] group-hover:text-white transition-all flex items-center gap-0.5 shadow"
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
      </main>

      {/* Scheduler Modal */}
      {activeMentor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in text-[var(--ink-700)]">
          <div className="bg-white border border-[var(--ink-200)] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center">
            <button
              onClick={() => setActiveMentor(null)}
              className="absolute top-4 right-4 text-[var(--ink-500)] hover:text-[var(--ink-900)] font-bold text-sm"
            >
              ×
            </button>
            <div className="w-12 h-12 bg-[var(--brand-pink-tint)] rounded-full flex items-center justify-center mx-auto text-[var(--brand-pink)]">
              <Clock size={24} />
            </div>
            <h3 className="font-serif text-base font-bold text-[var(--ink-900)]">Book Mentorship Session</h3>
            <p className="text-xs text-[var(--ink-500)] leading-relaxed">
              Confirm your booking request with <strong>{activeMentor.userId.firstName} {activeMentor.userId.lastName}</strong>.
            </p>
            <div className="bg-[var(--surface-muted)] border border-[var(--ink-200)] p-3 rounded-2xl text-[10px] text-[var(--ink-700)] space-y-1 text-left">
              <div>📅 <strong>Availability Window:</strong> {activeMentor.availability.days.join(", ")}</div>
              <div>⏰ <strong>Active Hours:</strong> {activeMentor.availability.hours}</div>
              <div>🎯 <strong>Focus Expertise:</strong> {activeMentor.expertise.join(", ")}</div>
            </div>
            <div className="pt-2 space-y-2">
              <button
                onClick={handleBook}
                disabled={bookMutation.isPending}
                className="w-full py-2.5 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-black transition-all flex items-center justify-center gap-1 shadow-lg"
              >
                {bookMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Confirm Booking Request
              </button>
              <button
                onClick={() => setActiveMentor(null)}
                className="w-full py-2.5 bg-[var(--ink-100)] hover:bg-[var(--ink-200)] border border-[var(--ink-300)] rounded-full text-xs font-bold transition-all text-[var(--ink-700)]"
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
