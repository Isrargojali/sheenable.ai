import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Search, Plus, X, MessageSquare, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiMessages, apiApplications, apiAI } from "@/lib/api";
import { DashboardShell, SectionCard, BtnPrimary, BtnOutline } from "@/components/layout/DashboardShell";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";

// ── Domain types ────────────────────────────────────────────────────────────

interface ThreadParticipant {
  name:     string;
  initials: string;
  color:    string;
}

interface Thread {
  id:          string;
  with:        ThreadParticipant;
  lastMessage: string;
  lastTime:    string;
  unread:      number;
  otherUserId: string;
}

interface Message {
  id:       string;
  threadId: string;
  text:     string;
  sentAt:   string;
  isMe:     boolean;
}

// ────────────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [activeThread, setActive] = useState<string>("thread_1");
  const [text, setText]           = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const bottomRef                  = useRef<HTMLDivElement>(null);

  // 1. Fetch threads with 5s real-time poll
  const { data: threadsData, refetch: refetchThreads, isLoading: threadsLoading } = useQuery<any>({
    queryKey: ["threads"],
    queryFn: apiMessages.getThreads,
    refetchInterval: 5000,
  });

  const rawThreads = threadsData?.results ?? [];

  // Map backend threads to UI layout
  const threads: Thread[] = rawThreads.map((t: any) => {
    const isCand = user?.role === "CANDIDATE";
    const otherUser = isCand ? t.employerId : t.candidateId;

    let name = "Conversation";
    if (otherUser) {
      if (isCand && t.employerId?.companyName) {
        name = t.employerId.companyName;
      } else if (otherUser.firstName) {
        name = `${otherUser.firstName} ${otherUser.lastName || ""}`.trim();
      }
    }

    const unread = isCand ? t.unreadCandidate : t.unreadEmployer;
    const lastTime = t.lastMessage?.sentAt
      ? new Date(t.lastMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : "";

    const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "C";

    const colors = [
      "from-violet-500 to-violet-700",
      "from-emerald-500 to-emerald-700",
      "from-rose-500 to-rose-700",
      "from-blue-500 to-blue-700",
      "from-amber-500 to-amber-700",
      "from-indigo-500 to-indigo-700"
    ];
    const nameHash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[nameHash % colors.length];

    return {
      id: t._id || t.id,
      with: {
        name,
        initials,
        color
      },
      lastMessage: t.lastMessage?.content || "No messages yet",
      lastTime,
      unread: unread || 0,
      otherUserId: otherUser?._id || otherUser?.id
    };
  });

  // Filter threads by search term
  const filteredThreads = threads.filter(t => 
    t.with.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Initialize first active thread
  useEffect(() => {
    if (threads.length > 0 && activeThread === "thread_1") {
      setActive(threads[0].id);
    }
  }, [threads, activeThread]);

  // 2. Fetch thread messages with 3s real-time poll
  const { data: messagesData, refetch: refetchMessages } = useQuery<any>({
    queryKey: ["thread-messages", activeThread],
    queryFn: () => apiMessages.getMessages(activeThread),
    enabled: !!activeThread && activeThread !== "thread_1",
    refetchInterval: 3000,
  });

  const rawMessages = messagesData?.results ?? [];
  const messages: Message[] = [...rawMessages].reverse().map((m: any) => ({
    id: m._id || m.id,
    threadId: m.threadId,
    text: m.content,
    sentAt: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isMe: m.senderId === user?.id
  }));

  // Send message
  const sendMut = useMutation({
    mutationFn: () => apiMessages.sendMessage(activeThread, text),
    onSuccess: () => {
      setText("");
      refetchMessages();
      refetchThreads();
      // Scroll to bottom immediately
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to send message");
    }
  });

  // Scroll to bottom on load or new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    if (!text.trim() || sendMut.isPending || activeThread === "thread_1") return;
    sendMut.mutate();
  }

  // ── Modal data loaders ──────────────────────────────────────────────────────
  const { data: appsData } = useQuery({
    queryKey: ["candidateAppsForChat"],
    queryFn: () => apiApplications.getApplications(),
    enabled: showNewChatModal && user?.role === "CANDIDATE"
  });

  const { data: matchedCandidates } = useQuery({
    queryKey: ["employerCandidatesForChat"],
    queryFn: () => apiAI.getMatchedCandidates(),
    enabled: showNewChatModal && user?.role === "EMPLOYER"
  });

  // Start a new thread
  const startThreadMut = useMutation({
    mutationFn: (data: { recipientId: string; jobId?: string }) => 
      apiMessages.startThread({ 
        recipientId: data.recipientId, 
        jobId: data.jobId,
        initialMessage: "Hello! Let's connect." 
      }),
    onSuccess: (newThread: any) => {
      const tId = newThread.threadId || newThread.data?.threadId || newThread.data?._id || newThread._id || newThread.id;
      setActive(tId);
      setShowNewChatModal(false);
      refetchThreads();
      qc.invalidateQueries({ queryKey: ["threadsBadge"] });
      toast.success("Conversation started!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start conversation");
    }
  });

  const active  = threads.find((t: Thread) => t.id === activeThread);

  // New Chat Contacts computation
  const newChatContacts = (() => {
    if (user?.role === "CANDIDATE") {
      const apps = Array.isArray(appsData) ? appsData : [];
      const uniqueEmps = Array.from(new Set(apps.map(a => a.job?.employer?.id).filter(Boolean)));
      return uniqueEmps.map(empId => {
        const app = apps.find(a => a.job?.employer?.id === empId);
        return {
          id: empId as string,
          name: app?.job?.employer?.companyName || "Employer",
          subtitle: `Regarding role: ${app?.job?.title || "Job Listing"}`,
          jobId: app?.job?.id || app?.job?._id
        };
      });
    } else {
      const candidates = Array.isArray(matchedCandidates) ? matchedCandidates : [];
      return candidates.map((c: any) => ({
        id: c.id || c._id,
        name: `${c.firstName} ${c.lastName || ""}`.trim(),
        subtitle: c.title || "Specialist",
        jobId: undefined
      }));
    }
  })();

  return (
    <DashboardShell
      title="Messages"
      subtitle={user?.role === "CANDIDATE" ? "Your conversations with employers" : "Your conversations with candidates"}
    >
      <div className="bg-card border border-border rounded-2xl overflow-hidden flex h-[calc(100vh-190px)] min-h-[520px] shadow-sm">
        
        {/* Thread sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-border flex flex-col bg-card">
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" size={13} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-8 pr-3 py-2 text-xs bg-secondary/50 border border-border rounded-xl focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {threadsLoading ? (
              <div className="p-8 flex flex-col justify-center items-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="animate-spin text-primary" size={16} />
                <span>Loading threads…</span>
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="text-center py-12 text-ink-300 text-xs font-semibold">No conversations found</div>
            ) : (
              filteredThreads.map((t: Thread) => (
                <button
                  key={t.id}
                  onClick={() => { setActive(t.id); }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 border-b border-border/40 text-left transition-all",
                    t.id === activeThread ? "bg-accent/40 border-l-4 border-primary" : "hover:bg-secondary/20"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br", t.with.color)}>
                    {t.with.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <span className="text-[12px] font-bold text-foreground truncate">{t.with.name}</span>
                      <span className="text-[9px] text-ink-300 flex-shrink-0 font-medium">{t.lastTime}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5 font-medium">{t.lastMessage}</div>
                  </div>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0 animate-pulse">
                      {t.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>

          <div className="p-3 border-t border-border bg-secondary/10 print:hidden">
            <button
              onClick={() => setShowNewChatModal(true)}
              className="w-full py-2 bg-primary text-white text-xs font-bold rounded-xl hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1 shadow-sm"
            >
              <Plus size={12} /> New Conversation
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0 bg-secondary/5">
          {activeThread === "thread_1" || !active ? (
            <div className="flex-1 flex items-center justify-center text-center p-6">
              <div className="max-w-sm">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3.5">
                  <MessageSquare className="text-primary animate-pulse" size={20} />
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">Your Conversation Hub</h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Select a message thread from the sidebar or start a new conversation to coordinate hiring details in real-time.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card flex-shrink-0 shadow-sm">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br", active.with.color)}>
                  {active.with.initials}
                </div>
                <div>
                  <div className="text-xs font-bold text-foreground leading-tight">{active.with.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                    <span className="text-[9px] text-emerald-600 font-bold">Coordinate Active</span>
                  </div>
                </div>
              </div>

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-ink-300 text-xs">Send your first message below!</div>
                ) : (
                  messages.map((msg: Message) => (
                    <div key={msg.id} className={cn("flex items-end gap-2.5", msg.isMe ? "justify-end" : "justify-start")}>
                      {!msg.isMe && (
                        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white text-[8px] font-bold bg-gradient-to-br flex-shrink-0", active.with.color)}>
                          {active.with.initials}
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[65%] px-3.5 py-2 rounded-2xl text-[12px] leading-relaxed shadow-sm transition-all",
                        msg.isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card text-foreground border border-border rounded-bl-sm"
                      )}>
                        <div>{msg.text}</div>
                        <div className={cn("text-[8px] mt-1.5 text-right font-medium", msg.isMe ? "text-primary-foreground/60" : "text-ink-300")}>
                          {msg.sentAt}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Message Input bar */}
              <div className="flex gap-2.5 p-4 border-t border-border bg-card flex-shrink-0 print:hidden">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Write a message… (Press Enter to send)"
                  className="flex-1 px-4 py-2 border border-border rounded-xl text-xs bg-background focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sendMut.isPending}
                  className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                >
                  <Send size={12} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── START NEW CHAT MODAL ────────────────────────────────────────────────── */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in print:hidden">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <header className="px-5 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Start Conversation</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Select a contact below to initiate a real-time chat</p>
              </div>
              <button onClick={() => setShowNewChatModal(false)} className="p-1 hover:bg-secondary rounded-full text-ink-300 hover:text-foreground transition-all">
                <X size={15} />
              </button>
            </header>

            <div className="p-4 overflow-y-auto scrollbar-thin flex-1 space-y-2 max-h-[50vh]">
              {newChatContacts.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground leading-relaxed">
                  No active contacts found. <br />
                  {user?.role === "CANDIDATE" 
                    ? "Apply for some job listings first to start conversations with employers."
                    : "Matched candidates will appear here once job applications are processed."}
                </div>
              ) : (
                newChatContacts.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => startThreadMut.mutate({ recipientId: contact.id, jobId: contact.jobId })}
                    disabled={startThreadMut.isPending}
                    className="w-full flex items-center gap-3 p-3 border border-border hover:border-primary/30 hover:bg-accent/10 rounded-xl text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[#C8315A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {contact.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">{contact.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate mt-0.5">{contact.subtitle}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}