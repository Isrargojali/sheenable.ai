import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Send, Search, Plus, X, MessageSquare, Loader2,
  Paperclip, Link as LinkIcon, Smile, ChevronDown, ChevronUp, 
  CheckCheck, Building, Calendar 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiMessages, apiApplications, apiAI, apiUpload } from "@/lib/api";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useLocation } from "react-router-dom";

// ── Domain types ────────────────────────────────────────────────────────────

interface ThreadParticipant {
  name:       string;
  initials:   string;
  color:      string;
  avatarUrl?: string | null;
}

interface Thread {
  id:          string;
  with:        ThreadParticipant;
  lastMessage: string;
  lastTime:    string;
  unread:      number;
  otherUserId: string;
  lastSentAt?: string;
  jobId?:      { id: string; title: string };
}

interface Message {
  id:       string;
  threadId: string;
  text:     string;
  sentAt:   string;
  isMe:     boolean;
  isRead:   boolean;
}

// ────────────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const location = useLocation();
  const [activeThread, setActive] = useState<string>(location.state?.activeThreadId || "thread_1");
  const [text, setText]           = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const bottomRef                  = useRef<HTMLDivElement>(null);
  const fileInputRef               = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);

  // 1. Fetch threads with 5s real-time poll
  const { data: threadsData, refetch: refetchThreads, isLoading: threadsLoading } = useQuery<any>({
    queryKey: ["threads"],
    queryFn: apiMessages.getThreads,
    refetchInterval: 5000,
  });

  const rawThreads = Array.isArray(threadsData) ? threadsData : (threadsData?.results ?? []);

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

    let mappedJob = undefined;
    if (t.jobId && typeof t.jobId === "object") {
      mappedJob = {
        id: t.jobId._id || t.jobId.id || "",
        title: t.jobId.title || ""
      };
    }

    return {
      id: t._id || t.id,
      with: {
        name,
        initials,
        color,
        avatarUrl: otherUser?.avatarUrl || null
      },
      lastMessage: t.lastMessage?.content || "No messages yet",
      lastTime,
      unread: unread || 0,
      otherUserId: otherUser?._id || otherUser?.id,
      lastSentAt: t.lastMessage?.sentAt || "",
      jobId: mappedJob
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

  const rawMessages = Array.isArray(messagesData) ? messagesData : (messagesData?.results ?? []);
  const messages: Message[] = [...rawMessages].reverse().map((m: any) => ({
    id: m._id || m.id,
    threadId: m.threadId,
    text: m.content,
    sentAt: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isMe: String(m.senderId?._id || m.senderId) === String(user?.id),
    isRead: m.isRead || false
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
  const { data: appsData } = useQuery<any[]>({
    queryKey: ["candidateAppsForChat"],
    queryFn: () => apiApplications.getApplications(),
    enabled: user?.role === "CANDIDATE"
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
    onSuccess: async (newThread: any) => {
      const tId = newThread.threadId || newThread.data?.threadId || newThread.data?._id || newThread._id || newThread.id;
      // Invalidate and await the query refetch to ensure the threads list contains the new thread before setting it active
      await qc.refetchQueries({ queryKey: ["threads"] });
      setActive(tId);
      setShowNewChatModal(false);
      qc.invalidateQueries({ queryKey: ["threadsBadge"] });
      toast.success("Conversation started!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start conversation");
    }
  });

  const active  = threads.find((t: Thread) => t.id === activeThread);
  const matchingApp = appsData?.find((app: any) => app.job?.id === active?.jobId?.id);

  // Timeago helper
  function formatRelativeTime(dateString: string) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    if (diffMs < 0) return "Just now";
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  // Header status builder
  const getHeaderStatusText = () => {
    if (!active) return "";
    if (matchingApp) {
      const stage = matchingApp.stage?.toLowerCase();
      if (stage === 'hired') return "Interview stage · Selected & Hired";
      if (stage === 'interview') return `Interview stage · ${active.with.name} is reviewing`;
      if (stage === 'offer') return "Offer stage · Reviewing contract details";
      if (stage === 'rejected') return "Application closed";
      return `Applied · Under review by ${active.with.name}`;
    }
    if (active.lastSentAt) {
      return `Active conversation · Last reply ${formatRelativeTime(active.lastSentAt)}`;
    }
    return "Active conversation";
  };

  // File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("cv", file);

    const uploadToast = toast.loading("Uploading CV...");
    try {
      const res = await apiUpload.uploadCv(formData);
      const url = res.cvFileUrl;
      toast.dismiss(uploadToast);
      toast.success("CV uploaded successfully!");
      setText(prev => {
        const attachStr = `[Attached CV: ${file.name}](${url})`;
        return prev ? `${prev} ${attachStr}` : attachStr;
      });
    } catch (err: any) {
      toast.dismiss(uploadToast);
      toast.error(err.message || "Failed to upload CV");
    }
  };

  // Share Profile
  const handleShareProfile = () => {
    if (!user) return;
    const profileUrl = `${window.location.origin}/employer/candidate/${user.id}`;
    setText(prev => {
      const shareStr = `[Candidate Profile Link](${profileUrl})`;
      return prev ? `${prev} ${shareStr}` : shareStr;
    });
    toast.success("Profile link inserted into message field!");
  };

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
          <div className="p-4 border-b border-border flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">Messages</h3>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary/60 rounded-lg transition-all"
                title="New Conversation"
              >
                <Plus size={16} />
              </button>
            </div>
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
                  {t.with.avatarUrl ? (
                    <img 
                      src={t.with.avatarUrl} 
                      alt={t.with.name} 
                      className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-border/50" 
                    />
                  ) : (
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br shadow-sm", t.with.color)}>
                      {t.with.initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <span className={cn(
                        "text-[12px] truncate",
                        t.unread > 0 ? "font-extrabold text-foreground" : "font-bold text-foreground/80"
                      )}>
                        {t.with.name}
                      </span>
                      <span className={cn(
                        "text-[9px] flex-shrink-0 font-medium",
                        t.unread > 0 ? "text-primary font-bold animate-pulse" : "text-ink-300"
                      )}>
                        {t.lastTime}
                      </span>
                    </div>
                    {t.jobId?.title && (
                      <div className="text-[10px] font-semibold text-primary/80 truncate mt-0.5">
                        {t.jobId.title}
                      </div>
                    )}
                    <div className={cn(
                      "text-[11px] truncate mt-0.5",
                      t.unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground/80"
                    )}>
                      {t.lastMessage}
                    </div>
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
                {active.with.avatarUrl ? (
                  <img 
                    src={active.with.avatarUrl} 
                    alt={active.with.name} 
                    className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-border/50" 
                  />
                ) : (
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br", active.with.color)}>
                    {active.with.initials}
                  </div>
                )}
                <div>
                  <div className="text-xs font-bold text-foreground leading-tight">{active.with.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      matchingApp?.stage?.toLowerCase() === 'rejected' ? "bg-muted-foreground" : "bg-emerald-500"
                    )} />
                    <span className={cn(
                      "text-[9px] font-bold",
                      matchingApp?.stage?.toLowerCase() === 'rejected' ? "text-muted-foreground" : "text-emerald-600"
                    )}>
                      {getHeaderStatusText()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapsible sticky context card */}
              {active.jobId && (
                <div className="bg-card/75 border-b border-border/80 backdrop-blur-sm sticky top-0 z-10 transition-all">
                  <div className="px-5 py-2 flex items-center justify-between border-b border-border/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[9px] font-bold text-primary uppercase tracking-wider">Job Context</span>
                      <span className="text-muted-foreground text-[10px]">·</span>
                      <span className="text-[10px] font-bold text-foreground truncate">
                        Re: {active.jobId.title} at {active.with.name}
                      </span>
                    </div>
                    <button
                      onClick={() => setContextCollapsed(!contextCollapsed)}
                      className="text-muted-foreground hover:text-foreground p-1 hover:bg-secondary/50 rounded-md transition-all flex items-center gap-1 text-[9px] font-bold"
                    >
                      {contextCollapsed ? (
                        <>
                          <span>Show Details</span>
                          <ChevronDown size={11} />
                        </>
                      ) : (
                        <>
                          <span>Collapse</span>
                          <ChevronUp size={11} />
                        </>
                      )}
                    </button>
                  </div>
                  
                  {!contextCollapsed && (
                    <div className="p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3 bg-secondary/10 animate-slide-down text-xs">
                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-primary/10 rounded-lg text-primary mt-0.5">
                          <Building size={12} />
                        </div>
                        <div>
                          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Company & Role</div>
                          <div className="font-bold text-foreground mt-0.5 text-[11px] leading-snug">{active.jobId.title}</div>
                          <div className="text-[9px] text-muted-foreground font-semibold mt-0.5">{active.with.name}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-amber-500/10 rounded-lg text-amber-600 mt-0.5">
                          <Calendar size={12} />
                        </div>
                        <div>
                          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Application Date</div>
                          <div className="font-semibold text-foreground mt-0.5 text-[11px]">
                            {matchingApp?.appliedAt ? new Date(matchingApp.appliedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : "Not applied yet"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-emerald-500/10 rounded-lg text-emerald-600 mt-0.5">
                          <span className="w-3 h-3 flex items-center justify-center font-bold text-[9px]">✓</span>
                        </div>
                        <div>
                          <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Application Status</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={cn(
                              "text-[9px] font-extrabold px-2 py-0.5 rounded-full border shadow-sm capitalize",
                              matchingApp?.stage?.toLowerCase() === 'hired' && "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                              matchingApp?.stage?.toLowerCase() === 'interview' && "bg-amber-50 text-amber-700 border-amber-200/60",
                              matchingApp?.stage?.toLowerCase() === 'rejected' && "bg-rose-50 text-rose-700 border-rose-200/60",
                              matchingApp?.stage?.toLowerCase() === 'offer' && "bg-indigo-50 text-indigo-700 border-indigo-200/60",
                              (!matchingApp || matchingApp?.stage?.toLowerCase() === 'applied') && "bg-blue-50 text-blue-700 border-blue-200/60"
                            )}>
                              {matchingApp?.stage || "Chat Open"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 scrollbar-thin">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-ink-300 text-xs">Send your first message below!</div>
                ) : (
                  messages.map((msg: Message) => (
                    <div key={msg.id} className={cn("flex items-end gap-2.5", msg.isMe ? "justify-end" : "justify-start")}>
                      {!msg.isMe && (
                        active.with.avatarUrl ? (
                          <img 
                            src={active.with.avatarUrl} 
                            alt={active.with.name} 
                            className="w-6 h-6 rounded-lg object-cover flex-shrink-0 border border-border/50" 
                          />
                        ) : (
                          <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-white text-[8px] font-bold bg-gradient-to-br flex-shrink-0", active.with.color)}>
                            {active.with.initials}
                          </div>
                        )
                      )}
                      <div className={cn(
                        "max-w-[65%] px-3.5 py-2 rounded-2xl text-[12px] leading-relaxed shadow-sm transition-all",
                        msg.isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-card text-foreground border border-border rounded-bl-sm"
                      )}>
                        <div>{msg.text}</div>
                        <div className="flex items-center justify-end gap-1 mt-1.5">
                          <span className={cn("text-[8px] font-medium", msg.isMe ? "text-primary-foreground/60" : "text-ink-300")}>
                            {msg.sentAt}
                          </span>
                          {msg.isMe && (
                            <CheckCheck 
                              size={11} 
                              className={cn(
                                msg.isRead ? "text-sky-300" : "text-primary-foreground/40"
                              )} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              {/* Message Input bar with quick actions */}
              <div className="p-4 border-t border-border bg-card flex-shrink-0 print:hidden flex flex-col gap-2">
                
                {/* Actions Toolbar */}
                <div className="flex items-center justify-between text-muted-foreground text-xs border-b border-border/40 pb-2">
                  <div className="flex items-center gap-3">
                    {/* Attach CV/File */}
                    {user?.role === "CANDIDATE" && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 hover:text-primary transition-all py-1 px-2 hover:bg-secondary/60 rounded-lg text-[10px] font-bold"
                          title="Attach CV / Portfolio"
                        >
                          <Paperclip size={12} className="rotate-45" />
                          <span>Attach CV</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                        />
                      </>
                    )}

                    {/* Share Profile */}
                    {user?.role === "CANDIDATE" && (
                      <button
                        type="button"
                        onClick={handleShareProfile}
                        className="flex items-center gap-1.5 hover:text-primary transition-all py-1 px-2 hover:bg-secondary/60 rounded-lg text-[10px] font-bold"
                        title="Share my profile link"
                      >
                        <LinkIcon size={12} />
                        <span>Share Profile</span>
                      </button>
                    )}

                    {/* Emoji Picker */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="flex items-center gap-1.5 hover:text-primary transition-all py-1 px-2 hover:bg-secondary/60 rounded-lg text-[10px] font-bold"
                        title="Insert Emoji"
                      >
                        <Smile size={12} />
                        <span>Emoji</span>
                      </button>
                      
                      {showEmojiPicker && (
                        <div className="absolute bottom-8 left-0 z-50 bg-card border border-border rounded-xl p-2.5 shadow-xl grid grid-cols-4 gap-2 w-36 animate-slide-up">
                          {["👋", "👍", "😊", "🎉", "🙌", "💼", "📄", "✉️"].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setText(prev => prev + emoji);
                                setShowEmojiPicker(false);
                              }}
                              className="text-lg hover:bg-secondary p-1 rounded-md transition-all active:scale-95"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-ink-300 font-medium select-none">
                    Press Enter to send
                  </span>
                </div>

                {/* Input Text Box */}
                <div className="flex gap-2.5 items-center">
                  <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Write a message… (Press Enter to send)"
                    className="flex-1 px-4 py-2 border border-border rounded-xl text-xs bg-background focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sendMut.isPending || activeThread === "thread_1"}
                    className="w-8 h-8 flex items-center justify-center bg-primary text-white rounded-xl hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                  >
                    {sendMut.isPending ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                  </button>
                </div>
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