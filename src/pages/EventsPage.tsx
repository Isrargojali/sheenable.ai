import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, MapPin, Users, Sparkles, Check, ArrowRight, Loader2, Play } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { api } from "@/lib/api";
import logo from "@/assets/sheEnableAI-removebg-preview.png";
import SubpageNav from "@/components/landing/SubpageNav";

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
    <div className="min-h-screen bg-[#1A0D1F] text-white flex flex-col">
      {/* Header */}
      <SubpageNav />

      {/* Main Content */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full p-6 space-y-8">
        {/* Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3 py-6">
          <h2 className="font-serif text-3xl font-extrabold tracking-tight">
            SheEnableAI <span className="text-[#22C55E]">Webinars & Fairs</span>
          </h2>
          <p className="text-sm text-white/50 leading-relaxed">
            Attend live interactive webinars, panel discussions with local tech executives, and high-performance recruitment fairs designed to kickstart your career.
          </p>
        </div>

        {/* Tab filters */}
        <div className="flex justify-center border-b border-white/5 pb-1 gap-6">
          {[
            { id: "ALL", label: "All Events" },
            { id: "UPCOMING", label: "Upcoming" },
            { id: "PAST", label: "Past Masterclasses" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as any)}
              className={`pb-3 text-xs font-bold transition-all relative ${filterMode === tab.id ? "text-[#22C55E]" : "text-white/40 hover:text-white/60"
                }`}
            >
              {tab.label}
              {filterMode === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#22C55E]" />
              )}
            </button>
          ))}
        </div>

        {/* Main timeline listing */}
        {isLoading ? (
          <div className="text-center py-20 animate-pulse">
            <Loader2 className="animate-spin text-[#22C55E] mx-auto mb-2" size={24} />
            <span className="text-xs text-white/40">Loading community events timeline...</span>
          </div>
        ) : getFilteredEvents().length === 0 ? (
          <div className="text-center py-20 bg-[#0F0A1A] border border-white/5 rounded-3xl text-white/30 flex flex-col items-center gap-2">
            <Calendar size={36} className="text-white/20 animate-pulse" />
            <div className="text-sm font-bold">No events currently scheduled in this bracket</div>
            <p className="text-[10px] text-white/20">Keep checking back or join our newsletter alert.</p>
          </div>
        ) : (
          /* Events grid */
          <div className="grid md:grid-cols-2 gap-8">
            {getFilteredEvents().map((event) => {
              const isPast = new Date(event.dateTime) < new Date();
              return (
                <div
                  key={event._id}
                  className="bg-[#0F0A1A] border border-white/5 rounded-3xl overflow-hidden shadow-xl hover:border-white/10 transition-all duration-300 flex flex-col group"
                >
                  {event.coverUrl && (
                    <div className="h-48 overflow-hidden relative border-b border-white/5">
                      <img
                        src={event.coverUrl}
                        alt={event.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className={`absolute top-4 left-4 text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${isPast
                          ? "bg-white/10 text-white/70"
                          : "bg-[#22C55E] text-[#0F0A1A]"
                        }`}>
                        {isPast ? "Archived Recording" : "Live Webinar"}
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider flex items-center gap-1.5">
                          <Calendar size={12} /> {new Date(event.dateTime).toLocaleString("en-PK", { dateStyle: "long", timeStyle: "short" })}
                        </div>
                        <h3 className="font-serif text-base font-extrabold text-white mt-1.5 group-hover:text-[#22C55E] transition-colors leading-snug">
                          {event.title}
                        </h3>
                        <p className="text-[10px] text-white/40 flex items-center gap-1 mt-1">
                          <MapPin size={10} /> {event.location}
                        </p>
                      </div>

                      <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
                        {event.description}
                      </p>

                      {/* Speakers row */}
                      {event.speakers && event.speakers.length > 0 && (
                        <div className="pt-2">
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-white/40 mb-2">Speakers Roundtable</span>
                          <div className="flex gap-4">
                            {event.speakers.map((sp, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                {sp.avatarUrl && (
                                  <img
                                    src={sp.avatarUrl}
                                    alt={sp.name}
                                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                                  />
                                )}
                                <div>
                                  <div className="text-[10px] font-bold text-white leading-tight">{sp.name}</div>
                                  <div className="text-[8px] text-white/40 mt-0.5">{sp.role}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-white/5 pt-4 flex items-center justify-between">
                      <span className="text-[10px] text-white/40 flex items-center gap-1">
                        <Users size={12} /> {event.registrations.length} registered
                      </span>

                      {isPast ? (
                        <button
                          onClick={() => toast.success("Accessing archived recording link... Enjoy the lecture!")}
                          className="px-4 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold rounded-full transition-all flex items-center gap-1"
                        >
                          <Play size={10} fill="white" /> Watch Recording
                        </button>
                      ) : isRegistered(event) ? (
                        <span className="px-4 py-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold rounded-full flex items-center gap-1">
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
                          className="px-4 py-1.5 bg-[#22C55E] hover:bg-[#1eb053] text-[#0F0A1A] text-[10px] font-black rounded-full shadow transition-all flex items-center gap-0.5"
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
    </div>
  );
}
