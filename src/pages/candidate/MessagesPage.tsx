// src/pages/candidate/MessagesPage.tsx
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation }       from "@tanstack/react-query";
import { Send, Search }               from "lucide-react";
import { cn }                         from "@/lib/utils";
import { apiMessages }                from "@/lib/api";
import { DashboardShell }             from "@/components/layout/DashboardShell";

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
}

interface Message {
  id:       string;
  threadId: string;
  text:     string;
  sentAt:   string;
  isMe:     boolean;
}

interface ThreadDetail {
  messages: Message[];
}

// ────────────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [activeThread, setActive] = useState("thread_1");
  const [text, setText]           = useState("");
  const [localMsgs, setLocal]     = useState<Message[]>([]);
  const bottomRef                  = useRef<HTMLDivElement>(null);

  const { data: threads = [] } = useQuery<Thread[]>({ queryKey: ["threads"], queryFn: apiMessages.getThreads });
  const { data: thread }       = useQuery<ThreadDetail>({ queryKey: ["thread", activeThread], queryFn: () => apiMessages.getThread(activeThread), enabled: !!activeThread });

  const sendMut = useMutation({
    mutationFn: () => apiMessages.sendMessage(activeThread, text),
    onSuccess: (msg: Message) => { setLocal(l => [...l, msg]); setText(""); },
  });

  const allMsgs = [...(thread?.messages ?? []), ...localMsgs.filter(m => m.threadId === activeThread)];
  const active  = threads.find((t: Thread) => t.id === activeThread);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [allMsgs.length]);

  function handleSend() {
    if (!text.trim() || sendMut.isPending) return;
    sendMut.mutate();
  }

  return (
    <DashboardShell title="Messages" subtitle="Your conversations with employers">
      <div className="bg-white border border-[#E8E1F0] rounded-2xl overflow-hidden flex h-[calc(100vh-200px)] min-h-[500px]">

        {/* Thread sidebar */}
        <div className="w-72 flex-shrink-0 border-r border-[#E8E1F0] flex flex-col">
          <div className="p-4 border-b border-[#E8E1F0]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A89EC0]" size={13} />
              <input placeholder="Search conversations…"
                     className="w-full pl-8 pr-3 py-2 text-xs bg-[#F7F4F9] border border-[#E8E1F0] rounded-xl focus:outline-none focus:border-rose-400 transition-all" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {threads.length === 0 ? (
              <div className="text-center py-10 text-[#A89EC0] text-xs">No conversations yet</div>
            ) : threads.map((t: Thread) => (
              <button
                key={t.id}
                onClick={() => { setActive(t.id); setLocal([]); }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#F3EFF8] text-left transition-colors",
                  t.id === activeThread ? "bg-rose-50" : "hover:bg-[#FAF8FC]"
                )}
              >
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 bg-gradient-to-br", t.with.color)}>
                  {t.with.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-1">
                    <span className="text-xs font-bold text-[#0F0B1A] truncate">{t.with.name}</span>
                    <span className="text-[9px] text-[#A89EC0] flex-shrink-0">{t.lastTime}</span>
                  </div>
                  <div className="text-[11px] text-[#6B6480] truncate mt-0.5">{t.lastMessage}</div>
                </div>
                {t.unread > 0 && (
                  <span className="w-5 h-5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                    {t.unread}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-[#E8E1F0]">
            <button className="w-full py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-colors">
              New Message
            </button>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <div><div className="text-4xl mb-3">💬</div><p className="text-sm text-[#6B6480]">Select a conversation to start messaging</p></div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#E8E1F0] flex-shrink-0">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br", active.with.color)}>
                  {active.with.initials}
                </div>
                <div>
                  <div className="text-sm font-bold text-[#0F0B1A]">{active.with.name}</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                    <span className="text-[10px] text-emerald-600 font-semibold">Online</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3">
                {allMsgs.map((msg: Message) => (
                  <div key={msg.id} className={cn("flex", msg.isMe ? "justify-end" : "justify-start")}>
                    {!msg.isMe && (
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold bg-gradient-to-br mr-2 flex-shrink-0 self-end", active.with.color)}>
                        {active.with.initials}
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed",
                      msg.isMe
                        ? "bg-gradient-to-br from-rose-500 to-rose-700 text-white rounded-br-sm"
                        : "bg-rose-50 text-rose-900 rounded-bl-sm"
                    )}>
                      {msg.text}
                      <div className={cn("text-[9px] mt-1", msg.isMe ? "text-white/60 text-right" : "text-rose-400")}>
                        {msg.sentAt}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="flex gap-3 p-4 border-t border-[#E8E1F0] flex-shrink-0">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message… (Enter to send)"
                  className="flex-1 px-4 py-2.5 border border-[#E8E1F0] rounded-full text-sm focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-500/10 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sendMut.isPending}
                  className="w-10 h-10 flex items-center justify-center bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}