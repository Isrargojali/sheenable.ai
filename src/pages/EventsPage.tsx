import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Sparkles, Loader2, MapPin, Users, Play, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { api } from "@/lib/api";
import SubpageNav from "@/components/landing/SubpageNav";
import useSEO from "@/hooks/useSEO";

interface Speaker {
  name: string;
  role: string;
  avatarUrl?: string;
}

interface EventItem {
  _id: string;
  title: string;
  description: string;
  dateTime: string;
  format: "ONLINE" | "IN_PERSON";
  location: string;
  speakers: Speaker[];
  coverUrl?: string;
  registrations: string[];
}

export default function EventsPage() {
  const queryClient = useQueryClient();
  const { user, token } = useAuthStore();
  const [filterMode, setFilterMode] = useState<"ALL" | "UPCOMING" | "PAST">("ALL");

  useSEO({
    title: "Webinars & Fairs for Women in Tech | SheEnableAI",
    description: "Join live webinars, masterclasses, and virtual career fairs for women in tech in Pakistan. Learn from industry leaders and connect with employers.",
  });

  // Fetch events from API
  const { data: events, isLoading } = useQuery<EventItem[]>({
    queryKey: ["events"],
    queryFn: async () => {
      const res = await api.get("/events");
      return res.data.data;
    }
  });

  // Register for event mutation
  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const res = await api.post(`/events/${eventId}/register`);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Successfully registered for the event!");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to register. Please make sure you are logged in.");
    }
  });

  const getFilteredEvents = () => {
    if (!events) return [];
    const now = new Date();

    return events.filter(e => {
      const date = new Date(e.dateTime);
      if (filterMode === "UPCOMING") return date >= now;
      if (filterMode === "PAST") return date < now;
      return true;
    });
  };

  const isRegistered = (event: EventItem) => {
    return user ? event.registrations.includes(user.id) : false;
  };

  return (
    <div className="min-h-screen bg-[var(--surface-dark)] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Hero Section */}
      <section className="bg-[var(--surface-dark)] text-white py-16">
        <div className="relative max-w-[1200px] mx-auto px-6 text-center max-w-2xl space-y-3">
          <h1 className="font-serif text-3xl font-extrabold tracking-tight">
            Webinars & Fairs for <span className="italic text-[var(--brand-pink)]">Women in Tech</span>
          </h1>
          <p className="text-sm text-[var(--text-on-dark-mute)] leading-relaxed">
            Join live career panel discussions, technical masterclasses, and virtual recruitment fairs custom-built for Pakistan's tech cohort.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 bg-[var(--surface-dark)] text-white py-12">
        <div className="max-w-[1200px] mx-auto w-full px-6 space-y-8">
          {/* Tab filters */}
          <div className="flex justify-center border-b border-[var(--border-dark)] pb-1 gap-8">
            {[
              { id: "ALL", label: "All Events" },
              { id: "UPCOMING", label: "Upcoming" },
              { id: "PAST", label: "Past Masterclasses" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterMode(tab.id as any)}
                className={`pb-3 text-[13px] font-semibold transition-all relative bg-transparent border-none ${
                  filterMode === tab.id ? "text-[var(--brand-pink)]" : "text-[var(--text-on-dark-mute)] hover:text-white"
                }`}
              >
                {tab.label}
                {filterMode === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--brand-pink)] translate-y-[4px]" />
                )}
              </button>
            ))}
          </div>

          {/* Main timeline listing */}
          {isLoading ? (
            <div className="text-center py-20 animate-pulse">
              <Loader2 className="animate-spin text-[var(--brand-pink)] mx-auto mb-2" size={24} />
              <span className="text-xs text-[var(--text-on-dark-mute)]">Loading community events timeline...</span>
            </div>
          ) : getFilteredEvents().length === 0 ? (
            <div className="text-center py-20 bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-3xl text-[var(--text-on-dark-mute)] flex flex-col items-center gap-2 shadow-xl">
              <Calendar size={36} className="text-[var(--text-on-dark-mute)]/70 animate-pulse" />
              <div className="text-sm font-bold text-[var(--text-on-dark)]">No events currently scheduled in this bracket</div>
              <p className="text-[10px] text-[var(--text-on-dark-mute)]">Keep checking back or join our newsletter alert.</p>
            </div>
          ) : (
            /* Events grid */
            <div className="grid md:grid-cols-2 gap-8">
              {getFilteredEvents().map((event) => {
                const isPast = new Date(event.dateTime) < new Date();
                return (
                  <div
                    key={event._id}
                    className="bg-[var(--surface-dark-card)] border border-[var(--border-dark)] rounded-[var(--radius-card)] overflow-hidden shadow-xl hover:border-[var(--brand-pink)]/30 transition-all duration-300 flex flex-col group text-white"
                  >
                    {event.coverUrl && (
                      <div className="w-full overflow-hidden relative border-b border-[var(--border-dark)] aspect-video">
                        <img
                          src={event.coverUrl}
                          alt={event.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute top-4 left-4 text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider bg-black/60 text-white">
                          {isPast ? "Archived Recording" : "Live Webinar"}
                        </span>
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div>
                          <div className="text-[12px] text-[var(--text-on-dark-mute)] font-semibold uppercase tracking-wider flex items-center gap-1.5">
                            <Calendar size={14} className="text-[var(--text-on-dark-mute)]" /> {new Date(event.dateTime).toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}
                          </div>
                          <h3 className="text-base font-semibold text-[var(--text-on-dark)] mt-1.5 group-hover:text-[var(--brand-pink)] transition-colors leading-snug">
                            {event.title}
                          </h3>
                          <p className="text-xs text-[var(--text-on-dark-mute)] flex items-center gap-1 mt-1">
                            <MapPin size={12} className="text-[var(--text-on-dark-mute)]" /> {event.location}
                          </p>
                        </div>

                        <p className="text-xs text-[var(--text-on-dark-mute)] leading-relaxed line-clamp-3">
                          {event.description}
                        </p>

                        {/* Speakers row */}
                        {event.speakers && event.speakers.length > 0 && (
                          <div className="pt-2">
                            <span className="block text-[10px] font-semibold uppercase tracking-wider text-[var(--text-on-dark-mute)] mb-2">Speakers Roundtable</span>
                            <div className="flex flex-row flex-wrap gap-6">
                              {event.speakers.map((sp, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  {sp.avatarUrl && (
                                    <img
                                      src={sp.avatarUrl}
                                      alt={sp.name}
                                      className="w-9 h-9 rounded-full object-cover border border-[var(--border-dark)]"
                                    />
                                  )}
                                  <div>
                                    <div className="text-xs font-semibold text-[var(--text-on-dark)] leading-tight">{sp.name}</div>
                                    <div className="text-[12px] text-[var(--text-on-dark-mute)] mt-0.5">{sp.role}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="border-t border-[var(--border-dark)] pt-4 flex items-center justify-between">
                        <span className="text-xs text-[var(--text-on-dark-mute)] flex items-center gap-1">
                          <Users size={14} className="text-[var(--text-on-dark-mute)]" /> {event.registrations.length} registered
                        </span>

                        {isPast ? (
                          <button
                            onClick={() => toast.success("Accessing archived recording link... Enjoy the lecture!")}
                            className="px-4 py-1.5 bg-transparent border border-[var(--brand-pink)] text-[var(--brand-pink)] hover:bg-[color-mix(in_oklab,var(--brand-pink)_10%,transparent)] text-[10px] font-semibold rounded-full transition-all flex items-center gap-1"
                          >
                            <Play size={12} className="text-[var(--brand-pink)]" /> Watch Recording
                          </button>
                        ) : isRegistered(event) ? (
                          <span className="px-4 py-1.5 bg-[var(--brand-pink-tint)]/10 border border-[var(--brand-pink)]/20 text-[var(--brand-pink)] text-[10px] font-bold rounded-full flex items-center gap-1">
                            <Check size={10} /> Registered
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              if (!token) {
                                toast.error("Please login or register to book your webinar slot.");
                                return;
                              }
                              registerMutation.mutate(event._id);
                            }}
                            disabled={registerMutation.isPending}
                            className="px-4 py-1.5 bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white text-[10px] font-black rounded-full shadow transition-all flex items-center gap-0.5"
                          >
                            {registerMutation.isPending && <Loader2 size={10} className="animate-spin" />}
                            Reserve Seat <ArrowRight size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
