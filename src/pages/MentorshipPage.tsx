import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Sparkles, UserCheck, Loader2, MessageCircle, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { api } from "@/lib/api";
import SubpageNav from "@/components/landing/SubpageNav";
import useSEO from "@/hooks/useSEO";
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

  useSEO({
    title: "1-on-1 Mentorship for Women in Tech | SheEnableAI",
    description: "Connect with verified female engineering leaders, product managers, and design executives in Pakistan. Get 1-on-1 career guidance. Join free.",
  });

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
      return await api.post("/mentors/book", { mentorId });
    },
    onSuccess: () => {
      toast.success("Mentorship session requested successfully!");
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      setActiveMentor(null);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to book session");
    }
  });

  const handleBook = () => {
    if (!activeMentor) return;
    bookMutation.mutate(activeMentor._id);
  };

  const filteredMentors = (mentors || []).filter(m => 
    m.userId.firstName.toLowerCase().includes(search.toLowerCase()) ||
    m.userId.lastName.toLowerCase().includes(search.toLowerCase()) ||
    m.company.toLowerCase().includes(search.toLowerCase()) ||
    m.title.toLowerCase().includes(search.toLowerCase()) ||
    m.bio.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--surface-dark)] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Hero Section */}
      <section className="bg-[var(--surface-dark)] text-white py-16">
        <div className="relative max-w-[1200px] mx-auto px-6 text-center max-w-2xl space-y-3">
          <h1 className="font-serif text-3xl font-extrabold tracking-tight">
            1-on-1 Mentorship for <span className="italic text-[var(--brand-pink)]">Women in Tech</span>
          </h1>
          <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed">
            Get career guidance, resume reviews, and interview prep from Pakistan's leading female tech executives.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 bg-[var(--surface-dark)] text-white py-12">
        <div className="max-w-[1200px] mx-auto w-full px-6 flex flex-col items-center">
          {!token ? (
            /* Locked State for Guest Users */
            <div className="w-full flex flex-col items-center">
              {/* Feature Preview Section (NEW) */}
              <div className="grid md:grid-cols-3 gap-6 w-full max-w-[960px] mx-auto mt-8 mb-12">
                <div className="flex gap-3 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] p-4 rounded-2xl">
                  <UserCheck size={24} strokeWidth={1.75} className="text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[15px] font-semibold text-[var(--text-on-dark)]">Resume & Portfolio Reviews</h4>
                    <p className="text-[13px] text-[var(--text-on-dark-mute)] leading-relaxed mt-0.5">Get direct, honest feedback on your CV and technical portfolio from managers who hire for these roles daily.</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] p-4 rounded-2xl">
                  <Calendar size={24} strokeWidth={1.75} className="text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[15px] font-semibold text-[var(--text-on-dark)]">Mock Interview Practice</h4>
                    <p className="text-[13px] text-[var(--text-on-dark-mute)] leading-relaxed mt-0.5">Practice system design, coding, and product management interviews with experienced industry mentors.</p>
                  </div>
                </div>

                <div className="flex gap-3 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] p-4 rounded-2xl">
                  <MessageCircle size={24} strokeWidth={1.75} className="text-white flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[15px] font-semibold text-[var(--text-on-dark)]">Career Growth Blueprints</h4>
                    <p className="text-[13px] text-[var(--text-on-dark-mute)] leading-relaxed mt-0.5">Learn how to navigate salary negotiations, caregiving return-to-work phases, and transitions into leadership.</p>
                  </div>
                </div>
              </div>

              {/* Locked Card */}
              <div className="max-w-[560px] w-full text-center bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] p-10 space-y-4 shadow-xl">
                <div className="w-14 h-14 bg-[color-mix(in_oklab,var(--brand-pink)_12%,transparent)] rounded-full flex items-center justify-center mx-auto text-[var(--brand-pink)]">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-on-dark)]">Locked Mentor Profile</h3>
                <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed max-w-[440px] mx-auto">
                  Create a candidate account to unlock free 1-on-1 mentorship with Pakistan's top tech leaders.
                </p>
                <div className="pt-2 space-y-3 w-full">
                  <Link
                    to="/auth/signup"
                    className="w-full h-12 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-lg"
                  >
                    Create Free Account to Unlock Mentors
                  </Link>
                  <Link
                    to="/auth/login"
                    className="w-full h-12 bg-transparent hover:bg-white/5 border border-[var(--text-on-dark)] text-[var(--text-on-dark)] rounded-full text-xs font-bold transition-all flex items-center justify-center"
                  >
                    Login to Account
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* Mentorship board */
            <div className="space-y-6 w-full">
              <div className="grid md:grid-cols-3 gap-4 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-3xl p-4 shadow-xl">
                {/* Search */}
                <div className="md:col-span-2 relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-on-dark-mute)]" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search mentors by name, company, background..."
                    className="w-full bg-[var(--surface-dark)] border border-[var(--border-dark)] rounded-2xl pl-10 pr-4 py-3 text-xs text-[var(--text-on-dark)] placeholder:text-[var(--text-on-dark-mute)] focus:outline-none focus:border-[var(--brand-pink)]"
                  />
                </div>

                {/* Specialty selector */}
                <Select value={selectedExpertise} onValueChange={setSelectedExpertise}>
                  <SelectTrigger className="w-full bg-[var(--surface-dark)] border border-[var(--border-dark)] hover:bg-white/5 text-xs text-[var(--text-on-dark)] focus:ring-0 focus:ring-offset-0 focus:outline-none shadow-none cursor-pointer rounded-2xl px-4 py-3 h-auto flex items-center justify-between transition-colors">
                    <SelectValue placeholder="Specialty" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-xl shadow-2xl min-w-[200px] p-1 text-[var(--text-on-dark)]">
                    <SelectItem value="all" className="text-xs font-semibold text-[var(--text-on-dark-mute)] focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      All Specialties
                    </SelectItem>
                    <SelectItem value="System Architecture" className="text-xs font-semibold text-[var(--text-on-dark-mute)] focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      System Architecture
                    </SelectItem>
                    <SelectItem value="UX Research" className="text-xs font-semibold text-[var(--text-on-dark-mute)] focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      UX Research
                    </SelectItem>
                    <SelectItem value="React" className="text-xs font-semibold text-[var(--text-on-dark-mute)] focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      React
                    </SelectItem>
                    <SelectItem value="Product Strategy" className="text-xs font-semibold text-[var(--text-on-dark-mute)] focus:bg-white/10 focus:text-white rounded-lg cursor-pointer py-2 pl-8 pr-2">
                      Product Strategy
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="text-center py-20 animate-pulse">
                  <Loader2 className="animate-spin text-[var(--brand-pink)] mx-auto mb-2" size={24} />
                  <span className="text-xs text-[var(--text-on-dark-mute)]">Loading professional mentors cohort...</span>
                </div>
              ) : filteredMentors.length === 0 ? (
                <div className="text-center py-20 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-3xl text-[var(--text-on-dark-mute)] flex flex-col items-center gap-2 shadow-xl">
                  <UserCheck size={36} className="text-[var(--text-on-dark-mute)]/70" />
                  <div className="text-sm font-bold text-[var(--text-on-dark)]">No mentors matched your criteria</div>
                  <p className="text-[10px] text-[var(--text-on-dark-mute)]">Try clearing filters or search queries.</p>
                </div>
              ) : (
                /* Mentors Grid */
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMentors.map((mentor) => (
                    <div
                      key={mentor._id}
                      className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] hover:border-[var(--brand-pink)]/30 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4 hover:shadow-2xl transition-all duration-300 group text-[var(--text-on-dark)]"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          {mentor.avatarUrl ? (
                            <img
                              src={mentor.avatarUrl}
                              alt={`${mentor.userId.firstName} ${mentor.userId.lastName}`}
                              className="w-12 h-12 rounded-full object-cover border border-[var(--border-dark)]"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-bold text-[var(--text-on-dark)] border border-[var(--border-dark)]">
                              {mentor.userId.firstName[0]}
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-bold text-[var(--text-on-dark)]">{mentor.userId.firstName} {mentor.userId.lastName}</h4>
                            <p className="text-[10px] text-[var(--text-on-dark-mute)] mt-0.5">{mentor.title} · {mentor.company}</p>
                          </div>
                        </div>

                        <p className="text-[11px] text-[var(--text-on-dark-mute)] leading-relaxed line-clamp-3">
                          {mentor.bio}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {mentor.expertise.map((exp, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white/5 border border-[var(--border-dark)] rounded text-[8px] text-[var(--text-on-dark-mute)] font-bold uppercase tracking-wider">
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="border-t border-[var(--border-dark)] pt-3 flex items-center justify-between">
                        <div className="text-[9px] text-[var(--text-on-dark-mute)] flex items-center gap-0.5">
                          <Clock size={10} /> {mentor.availability.days.join(", ")}
                        </div>
                        <button
                          onClick={() => setActiveMentor(mentor)}
                          className="px-3.5 py-1.5 bg-[var(--brand-pink-tint)]/10 border border-[var(--brand-pink)]/20 text-[var(--brand-pink)] text-[10px] font-bold rounded-full group-hover:bg-[var(--brand-pink)] group-hover:text-white transition-all flex items-center gap-0.5 shadow"
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in text-[var(--text-on-dark)]">
          <div className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl relative text-center">
            <button
              onClick={() => setActiveMentor(null)}
              className="absolute top-4 right-4 text-[var(--text-on-dark-mute)] hover:text-white font-bold text-sm"
            >
              ×
            </button>
            <div className="w-12 h-12 bg-[var(--brand-pink-tint)]/10 rounded-full flex items-center justify-center mx-auto text-[var(--brand-pink)]">
              <Clock size={24} />
            </div>
            <h3 className="font-serif text-base font-bold text-[var(--text-on-dark)]">Book Mentorship Session</h3>
            <p className="text-xs text-[var(--text-on-dark-mute)] leading-relaxed">
              Confirm your booking request with <strong>{activeMentor.userId.firstName} {activeMentor.userId.lastName}</strong>.
            </p>
            <div className="bg-[var(--surface-dark)] border border-[var(--border-dark)] p-3 rounded-2xl text-[10px] text-[var(--text-on-dark-mute)] space-y-1 text-left">
              <div>📅 <strong>Availability Window:</strong> {activeMentor.availability.days.join(", ")}</div>
              <div>⏰ <strong>Active Hours:</strong> {activeMentor.availability.hours}</div>
              <div>🎯 <strong>Focus Expertise:</strong> {activeMentor.expertise.join(", ")}</div>
            </div>
            <div className="pt-2 space-y-2">
              <button
                onClick={handleBook}
                disabled={bookMutation.isPending}
                className="w-full py-2.5 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-lg"
              >
                {bookMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                Confirm Booking Request
              </button>
              <button
                onClick={() => setActiveMentor(null)}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-[var(--border-dark)] rounded-full text-xs font-bold transition-all text-[var(--text-on-dark-mute)]"
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
