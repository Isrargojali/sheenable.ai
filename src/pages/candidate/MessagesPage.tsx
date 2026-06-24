import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Send, Search, Plus, X, MessageSquare, Loader2,
  Paperclip, Link as LinkIcon, Smile, ChevronDown, ChevronUp, 
  CheckCheck, Building, Calendar, Mail, ArrowLeft
} from "lucide-react";
import { cn, initials, getCompanyGradient } from "@/lib/utils";
import FileAttachment from "@/components/ui/FileAttachment";
import { apiMessages, apiApplications, apiAI, apiUpload } from "@/lib/api";
import { DashboardShell, BtnOutline, BtnPrimary } from "@/components/layout/DashboardShell";
import { useAuthStore } from "@/store/authStore";
import { toast } from "sonner";
import { useLocation, Link } from "react-router-dom";
import { io } from "socket.io-client";

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
  application?: { id: string; stage: string; appliedAt: string } | null;
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

// FileAttachment is now imported from @/components/ui/FileAttachment

function MessageContent({ text, isMe }: { text: string; isMe: boolean }) {
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    if (matchIndex > lastIndex) {
      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex, matchIndex)}</span>);
    }

    const label = match[1];
    const url = match[2];

    if (label.startsWith("Attached CV:") || label.toLowerCase().endsWith(".pdf") || label.toLowerCase().endsWith(".doc") || label.toLowerCase().endsWith(".docx")) {
      const cleanName = label.replace("Attached CV:", "").trim();
      parts.push(
        <FileAttachment 
          key={`file-${matchIndex}`} 
          fileName={cleanName} 
          fileUrl={url} 
          isMe={isMe}
        />
      );
    } else {
      const isInternal = url.startsWith("/") || url.startsWith(window.location.origin);
      const toPath = isInternal ? url.replace(window.location.origin, "") : url;
      
      parts.push(
        isInternal ? (
          <Link 
            key={`link-${matchIndex}`} 
            to={toPath} 
            className={cn("underline font-extrabold transition-all hover:opacity-85", isMe ? "text-white" : "text-primary")}
          >
            {label}
          </Link>
        ) : (
          <a 
            key={`link-${matchIndex}`} 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={cn("underline font-extrabold transition-all hover:opacity-85", isMe ? "text-white" : "text-primary")}
          >
            {label}
          </a>
        )
      );
    }

    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>);
  }

  return parts.length > 0 ? <div className="space-y-1">{parts}</div> : <div>{text}</div>;
}

export default function MessagesPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const location = useLocation();
  const [activeThread, setActive] = useState<string>(location.state?.activeThreadId || "thread_1");
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(!!location.state?.activeThreadId);
  const [text, setText]           = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const bottomRef                  = useRef<HTMLDivElement>(null);
  const fileInputRef               = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = user?.role === "EMPLOYER" ? [
    { label: "Request Screening", text: "Hi! Thanks for applying. I would love to schedule a phone screening with you." },
    { label: "Invite to Assessment", text: "We've reviewed your CV and would like to invite you for a technical assessment." },
    { label: "Extend Job Offer", text: "We are pleased to extend a formal job offer! Please check your dashboard to review it." }
  ] : [
    { label: "Express Interest", text: "Hi! Thank you for reaching out. I am very interested in this role and look forward to speaking." },
    { label: "Assessment Done", text: "I have completed the required assessment. Looking forward to your feedback!" },
    { label: "Accept Offer", text: "Thank you so much. I have accepted the job offer and look forward to onboarding." }
  ];

  const NEXT_STAGE_MAP: Record<string, { nextStage: string; label: string }> = {
    APPLIED: { nextStage: "SCREENING", label: "Move to Screening →" },
    SCREENING: { nextStage: "INTERVIEW", label: "Advance to Interview →" },
    INTERVIEW: { nextStage: "ASSESSMENT", label: "Advance to Assessment →" },
    ASSESSMENT: { nextStage: "OFFER", label: "Advance to Offer →" },
    OFFER: { nextStage: "HIRED", label: "Mark as Hired →" }
  };

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) =>
      await apiApplications.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      qc.invalidateQueries({ queryKey: ["thread-messages"] });
      toast.success("Candidate status updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update status");
    }
  });

  // 1. Fetch threads with 5s real-time poll
  const { data: threadsData, refetch: refetchThreads, isLoading: threadsLoading } = useQuery<any>({
    queryKey: ["threads"],
    queryFn: async () => await apiMessages.getThreads(),
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
    const lastTime = (() => {
      if (!t.lastMessage?.sentAt) return "";
      const dateObj = new Date(t.lastMessage.sentAt);
      return !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "";
    })();

    const initialsVal = initials(name) || "C";
    const color = getCompanyGradient(name);

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
        initials: initialsVal,
        color,
        avatarUrl: otherUser?.avatarUrl || null
      },
      lastMessage: t.lastMessage?.content || "No messages yet",
      lastTime,
      unread: unread || 0,
      otherUserId: otherUser?._id || otherUser?.id,
      lastSentAt: t.lastMessage?.sentAt || "",
      jobId: mappedJob,
      application: t.application || null
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
    queryFn: async () => await apiMessages.getMessages(activeThread),
    enabled: !!activeThread && activeThread !== "thread_1",
    refetchInterval: 3000,
  });

  const rawMessages = Array.isArray(messagesData) ? messagesData : (messagesData?.results ?? []);
  const messages: Message[] = [...rawMessages].reverse().map((m: any) => ({
    id: m._id || m.id,
    threadId: m.threadId,
    text: m.content,
    sentAt: (() => {
      const dateObj = new Date(m.createdAt);
      return !isNaN(dateObj.getTime())
        ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "";
    })(),
    isMe: String(m.senderId?._id || m.senderId) === String(user?.id),
    isRead: m.isRead || false
  }));

  // Send message
  const sendMut = useMutation({
    mutationFn: async () => await apiMessages.sendMessage(activeThread, text),
    onSuccess: () => {
      setText("");
      refetchMessages();
      refetchThreads();
      toast.success("Message sent ✓");
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
    queryFn: async () => (await apiApplications.getApplications()) as any[],
    enabled: user?.role === "CANDIDATE"
  });

  const { data: matchedCandidates } = useQuery({
    queryKey: ["employerCandidatesForChat"],
    queryFn: async () => await apiAI.getMatchedCandidates(),
    enabled: showNewChatModal && user?.role === "EMPLOYER"
  });

  // Start a new thread
  const startThreadMut = useMutation({
    mutationFn: async (data: { recipientId: string; jobId?: string }) => 
      await apiMessages.startThread({ 
        recipientId: data.recipientId, 
        jobId: data.jobId,
        initialMessage: "Hello! Let's connect." 
      }),
    onSuccess: async (newThread: any) => {
      const tId = newThread.threadId || newThread.data?.threadId || newThread.data?._id || newThread._id || newThread.id;
      // Invalidate and await the query refetch to ensure the threads list contains the new thread before setting it active
      await qc.refetchQueries({ queryKey: ["threads"] });
      setActive(tId);
      setMobileShowChat(true);
      setShowNewChatModal(false);
      qc.invalidateQueries({ queryKey: ["threadsBadge"] });
      toast.success("Conversation started!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to start conversation");
    }
  });

  const active  = threads.find((t: Thread) => t.id === activeThread);
  const matchingApp = active?.application || appsData?.find((app: any) => app.job?.id === active?.jobId?.id);

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
      const res = await apiUpload.uploadCv(formData) as any;
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

  const isEmployer = user?.role === "EMPLOYER";

  return (
    <DashboardShell
      title="Messages"
      subtitle={isEmployer ? "Coordinate and chat with matching candidates" : "Coordinate and chat with employers"}
      actions={
        isEmployer ? (
          <BtnPrimary 
            onClick={() => setShowNewChatModal(true)}
            className="h-10 px-4 text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={16} />
            <span>New message</span>
          </BtnPrimary>
        ) : undefined
      }
    >
      <div className="bg-[var(--surface)] border border-[var(--ink-300)] rounded-[var(--radius-card)] overflow-hidden flex h-[calc(100vh-210px)] md:h-[calc(100vh-140px)] min-h-[520px] shadow-[var(--shadow-card)]">
        
        {/* Thread sidebar */}
        <div className={cn("w-full md:w-72 flex-shrink-0 border-r border-[var(--ink-300)] flex flex-col bg-[var(--surface)]", mobileShowChat ? "hidden md:flex" : "flex")}>
          <div className="p-4 border-b border-[var(--ink-300)] flex flex-col gap-3">
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
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" size={13} />
              <input
                id="global-search"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search conversations…"
                className="w-full pl-8 pr-12 py-2 text-xs bg-secondary/50 border border-[var(--ink-300)] rounded-xl focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
              />
              <kbd className="absolute right-3 hidden sm:inline-flex items-center gap-0.5 text-[9px] font-sans font-bold bg-[var(--surface)] border border-[var(--ink-300)] px-1 py-0.2 rounded text-muted-foreground shadow-xs select-none">
                <span>{navigator.userAgent.toLowerCase().includes("mac") ? "⌘" : "Ctrl"}</span><span>K</span>
              </kbd>
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
                  onClick={() => { 
                    setActive(t.id);
                    setMobileShowChat(true);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 border-b border-[var(--ink-300)]/40 text-left transition-all border-l-[3px] border-transparent",
                    t.id === activeThread 
                      ? "bg-[var(--brand-pink-soft)] border-l-[3px] border-[var(--brand-pink)] rounded-l-none" 
                      : t.unread > 0
                        ? "bg-primary/[0.04] hover:bg-primary/[0.08]"
                        : "bg-[var(--surface)] hover:bg-secondary/20"
                  )}
                >
                  {t.with.avatarUrl ? (
                    <img 
                      src={t.with.avatarUrl} 
                      alt={t.with.name} 
                      className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-[var(--ink-300)]/50" 
                    />
                  ) : (
                    <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br shadow-sm", t.with.color)}>
                      {t.with.initials}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-1">
                      <span className={cn(
                        "text-[16px] truncate",
                        t.unread > 0 ? "font-semibold text-[var(--ink-900)]" : "font-semibold text-[var(--ink-700)]"
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
                      <div className={cn(
                        "text-[10px] truncate mt-0.5",
                        t.unread > 0 ? "font-bold text-primary" : "font-semibold text-primary/80"
                      )}>
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
        <div className={cn("flex-1 flex flex-col min-w-0 bg-[var(--surface)]", mobileShowChat ? "flex" : "hidden md:flex")}>
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
              <div className="flex items-center gap-3 px-4 md:px-6 py-3.5 md:py-4.5 border-b border-[var(--ink-300)] bg-[var(--surface)] flex-shrink-0 shadow-sm">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="p-1.5 mr-1 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition-all md:hidden"
                  aria-label="Back to threads"
                >
                  <ArrowLeft size={16} />
                </button>
                {active.with.avatarUrl ? (
                  <img 
                    src={active.with.avatarUrl} 
                    alt={active.with.name} 
                    className="w-9 h-9 rounded-xl object-cover flex-shrink-0 border border-[var(--ink-300)]/50" 
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
                      matchingApp?.stage?.toLowerCase() === 'rejected' ? "bg-muted-foreground" : "bg-[var(--status-success-fg)]"
                    )} />
                    <span className={cn(
                      "text-[9px] font-bold",
                      matchingApp?.stage?.toLowerCase() === 'rejected' ? "text-muted-foreground" : "text-[var(--status-success-fg)]"
                    )}>
                      {getHeaderStatusText()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Collapsible sticky context card */}
              {active.jobId && (
                <div className="bg-[var(--surface)]/75 border-b border-[var(--ink-300)] backdrop-blur-sm sticky top-0 z-10 transition-all">
                  <div className="px-5 py-2 flex items-center justify-between border-b border-[var(--ink-300)]/30">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="label-tracked text-[10px] text-[var(--ink-500)]">Job Context</span>
                      <span className="text-muted-foreground text-[10px]">·</span>
                      <span className="text-[10px] font-bold text-foreground truncate">
                        Re: {active.jobId.title} at {active.with.name}
                      </span>
                    </div>
                    <BtnOutline
                      onClick={() => setContextCollapsed(!contextCollapsed)}
                    >
                      {contextCollapsed ? (
                        <>
                          <span>Show Details</span>
                          <ChevronDown size={16} strokeWidth={1.75} />
                        </>
                      ) : (
                        <>
                          <span>Collapse</span>
                          <ChevronUp size={16} strokeWidth={1.75} />
                        </>
                      )}
                    </BtnOutline>
                  </div>
                  
                  {!contextCollapsed && (
                    <div className="p-3.5 grid grid-cols-1 md:grid-cols-3 gap-3 bg-secondary/10 animate-slide-down text-xs">
                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-primary/10 rounded-lg text-primary mt-0.5">
                          <Building size={12} />
                        </div>
                        <div>
                          <div className="label-tracked text-[10px] text-[var(--ink-500)]">Company & Role</div>
                          <div className="font-bold text-foreground mt-0.5 text-[11px] leading-snug">{active.jobId.title}</div>
                          <div className="text-[9px] text-muted-foreground font-semibold mt-0.5">{active.with.name}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-[var(--status-progress-bg)] rounded-lg text-[var(--status-progress-fg)] mt-0.5">
                          <Calendar size={12} />
                        </div>
                        <div>
                          <div className="label-tracked text-[10px] text-[var(--ink-500)]">Application Date</div>
                          <div className="font-semibold text-foreground mt-0.5 text-[11px]">
                            {(() => {
                              if (!matchingApp?.appliedAt) return "Not applied yet";
                              const dateObj = new Date(matchingApp.appliedAt);
                              return !isNaN(dateObj.getTime())
                                ? dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                : "Not applied yet";
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="p-1 bg-[var(--status-success-bg)] rounded-lg text-[var(--status-success-fg)] mt-0.5">
                          <span className="w-3 h-3 flex items-center justify-center font-bold text-[9px]">✓</span>
                        </div>
                        <div>
                          <div className="label-tracked text-[10px] text-[var(--ink-500)]">Application Status</div>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              "rounded-full px-[10px] py-[4px] text-[12px] font-semibold uppercase tracking-[0.04em] border-none",
                              matchingApp?.stage?.toLowerCase() === 'hired' && "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]",
                              matchingApp?.stage?.toLowerCase() === 'screening' && "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]",
                              matchingApp?.stage?.toLowerCase() === 'interview' && "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]",
                              matchingApp?.stage?.toLowerCase() === 'assessment' && "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]",
                              matchingApp?.stage?.toLowerCase() === 'rejected' && "bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]",
                              matchingApp?.stage?.toLowerCase() === 'offer' && "bg-[var(--status-neutral-bg)] text-[var(--status-neutral-fg)]",
                              (!matchingApp || matchingApp?.stage?.toLowerCase() === 'applied') && "bg-[var(--status-info-bg)] text-[var(--status-info-fg)]"
                            )}>
                              {matchingApp?.stage || "Chat Open"}
                            </span>
                            {user?.role === "EMPLOYER" && matchingApp && NEXT_STAGE_MAP[matchingApp.stage] && (
                              <button
                                onClick={() => {
                                  const nextInfo = NEXT_STAGE_MAP[matchingApp.stage];
                                  updateStatusMut.mutate({ id: matchingApp.id, status: nextInfo.nextStage });
                                }}
                                disabled={updateStatusMut.isPending}
                                className="text-[10px] font-bold text-primary hover:underline transition-all flex items-center gap-1.5 ml-1 disabled:opacity-65"
                              >
                                {updateStatusMut.isPending ? (
                                  <Loader2 size={10} className="animate-spin" />
                                ) : (
                                  NEXT_STAGE_MAP[matchingApp.stage].label
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Messages viewport */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
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
                        "max-w-[85%] md:max-w-[75%] px-3.5 py-2 rounded-[12px] text-[14px] font-normal leading-relaxed shadow-sm transition-all",
                        msg.isMe
                          ? "bg-[var(--brand-pink)] text-white"
                          : "bg-[var(--ink-100)] text-[var(--ink-900)] border border-border"
                      )}>
                        <MessageContent text={msg.text} isMe={msg.isMe} />
                        <div className="flex items-center justify-end gap-1 mt-1.5">
                          <span className={cn("text-[8px] font-medium", msg.isMe ? "text-primary-foreground/60" : "text-ink-300")}>
                            {msg.sentAt}
                          </span>
                          {msg.isMe && (
                            <CheckCheck 
                              size={11} 
                              className={cn(
                                msg.isRead ? "text-white" : "text-white/40"
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
              <div className="p-4 md:p-6 border-t border-border bg-card flex-shrink-0 print:hidden flex flex-col gap-2">
                
                {/* Actions Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-muted-foreground text-xs border-b border-border/40 pb-2">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Attach CV/File */}
                    {user?.role === "CANDIDATE" && (
                      <>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 hover:text-primary transition-all py-1 px-1.5 hover:bg-secondary/60 rounded-lg text-[10px] font-bold"
                          title="Attach file (PDF, DOC, DOCX)"
                        >
                          <Paperclip size={12} className="rotate-45" />
                          <span>Attach file</span>
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

                    {/* Share profile link */}
                    {user?.role === "CANDIDATE" && (
                      <button
                        type="button"
                        onClick={handleShareProfile}
                        className="flex items-center gap-1.5 hover:text-primary transition-all py-1 px-1.5 hover:bg-secondary/60 rounded-lg text-[10px] font-bold"
                        title="Share profile link"
                      >
                        <LinkIcon size={12} />
                        <span>Share profile link</span>
                      </button>
                    )}

                    {/* Template replies */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setShowTemplates(!showTemplates); setShowEmojiPicker(false); }}
                        className="flex items-center gap-1.5 hover:text-primary transition-all py-1 px-1.5 hover:bg-secondary/60 rounded-lg text-[10px] font-bold"
                        title="Use a template reply"
                      >
                        <Mail size={12} />
                        <span>Template replies</span>
                      </button>
                      
                      {showTemplates && (
                        <div className="absolute bottom-8 left-0 z-50 bg-card border border-border rounded-xl p-2 shadow-xl w-64 flex flex-col gap-1 animate-slide-up text-left">
                          <div className="px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-ink-300 border-b border-border/50 mb-1">
                            Select Template
                          </div>
                          {templates.map((tpl) => (
                            <button
                              key={tpl.label}
                              type="button"
                              onClick={() => {
                                setText(tpl.text);
                                setShowTemplates(false);
                              }}
                              className="text-[10.5px] text-foreground font-bold hover:bg-secondary p-2 rounded-lg text-left transition-all truncate"
                              title={tpl.text}
                            >
                              {tpl.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Emoji */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowTemplates(false); }}
                        className="flex items-center gap-1.5 hover:text-primary transition-all py-1 px-1.5 hover:bg-secondary/60 rounded-lg text-[10px] font-bold"
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
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-[var(--brand-pink-hover)] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
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