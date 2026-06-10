// src/components/layout/DashboardShell.tsx
import { ReactNode, useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Briefcase, FileText, User, MessageSquare, FilePlus,
  Search, Users, ShieldCheck, ScrollText, ShieldAlert, UserCog, Activity,
  Bell, LogOut, Menu, X, Heart, Settings, Loader2, Moon, Sun,
  type LucideIcon,
} from "lucide-react";
import logo from "../../assets/sheEnableAI-removebg-preview.png";
import { cn, initials, relativeTime } from "@/lib/utils";
import { useAuthStore, UserRole } from "@/store/authStore";
import { useNotifStore } from "@/store/notifStore";
import { apiNotifications, apiProfile, apiMessages, apiApplications } from "@/lib/api";
import { toast } from "sonner";
import { MOCK_USERS } from "@/mock/data";

//
// NAV CONFIG per role
//
type NavItem = { to: string; label: string; icon: LucideIcon; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: Record<UserRole, NavGroup[]> = {
  CANDIDATE: [
    {
      label: "Workspace",
      items: [
        { to: "/candidate/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/candidate/jobs", label: "Browse Jobs", icon: Briefcase },
        { to: "/candidate/applications", label: "Applications", icon: FileText, badge: "3" },
        { to: "/candidate/messages", label: "Messages", icon: MessageSquare, badge: "2" },
      ],
    },
    {
      label: "Profile",
      items: [
        { to: "/candidate/profile", label: "My Profile", icon: User },
        { to: "/candidate/cv", label: "CV Builder", icon: FilePlus },
      ],
    },
  ],
  EMPLOYER: [
    {
      label: "Hiring",
      items: [
        { to: "/employer/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { to: "/employer/listings", label: "My Listings", icon: Briefcase },
        { to: "/employer/post-job", label: "Post a Job", icon: FilePlus },
        { to: "/employer/pipeline", label: "ATS Pipeline", icon: FileText },
        { to: "/employer/messages", label: "Messages", icon: MessageSquare, badge: "2" },
      ],
    },
    {
      label: "Discover",
      items: [
        { to: "/employer/ai-search", label: "AI Search", icon: Search },
      ],
    },
  ],
  ADMIN: [
    {
      label: "Administration",
      items: [
        { to: "/admin/overview", label: "Overview", icon: LayoutDashboard },
        { to: "/admin/users", label: "Users", icon: Users },
        { to: "/admin/security", label: "Security Center", icon: ShieldCheck },
        { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      label: "Administration",
      items: [
        { to: "/admin/overview", label: "Overview", icon: LayoutDashboard },
        { to: "/admin/users", label: "Users", icon: Users },
        { to: "/admin/security", label: "Security Center", icon: ShieldCheck },
        { to: "/admin/audit", label: "Audit Log", icon: ScrollText },
      ],
    },
    {
      label: "Super Admin",
      items: [
        { to: "/super-admin/overview", label: "Super Overview", icon: ShieldAlert },
        { to: "/super-admin/manage-admins", label: "Manage Admins", icon: UserCog },
        { to: "/super-admin/threat-monitor", label: "Threat Monitor", icon: Activity },
      ],
    },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  CANDIDATE: "Candidate",
  EMPLOYER: "Employer",
  ADMIN: "Administrator",
  SUPER_ADMIN: "Super Admin",
};

//
// SIDEBAR
//
function Sidebar({ onNav }: { onNav?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role ?? "CANDIDATE";
  const groups = NAV[role];

  // Dynamic real-time messages unread badges query
  type Thread = { unreadCandidate: number; unreadEmployer: number };
  type ThreadsQueryData = Thread[] | { results: Thread[] };

  const { data: threadsData } = useQuery<ThreadsQueryData>({
    queryKey: ["threadsBadge", role],
    queryFn: apiMessages.getThreads,
    refetchInterval: 10000, // Poll threads every 10s for unread badges
    enabled: role === "CANDIDATE" || role === "EMPLOYER"
  });

  const rawThreads = Array.isArray(threadsData) ? threadsData : (threadsData?.results ?? []);
  const unreadMessagesCount = rawThreads.reduce(
    (acc: number, t: Thread) => acc + (role === "CANDIDATE" ? t.unreadCandidate : t.unreadEmployer),
    0
  );

  // Dynamic real-time applications badge query
  const { data: myAppsData } = useQuery<unknown[]>({
    queryKey: ["myAppsBadge", role],
    queryFn: apiApplications.getApplications,
    refetchInterval: 10000, // Poll applications count every 10s
    enabled: role === "CANDIDATE"
  });

  const appsCount = Array.isArray(myAppsData) ? myAppsData.length : 0;

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email?.split("@")[0] ?? "User";
  const avatarUrl = user?.avatarUrl ?? null;

  const [available, setAvailable] = useState(true);

  function handleLogout() {
    logout();
    navigate("/auth/login");
  }

  return (
    <aside className="w-[240px] flex-shrink-0 bg-card border-r border-border flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-border flex items-center gap-2.5">
        <Link to="/" className="relative z-10 flex items-center gap-2.5 group" aria-label="SheEnableAI home">
          <img
            src={logo}
            alt="SheEnableAI logo"
            className="w-48 h-24 object-contain transition-transform group-hover:scale-105"
          />
        </Link>
        <div>
        </div>
      </div>

      {/* User block */}
      <div className="px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 mb-2">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex'); }}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            />
          ) : null}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: "var(--grad-mauve)", display: avatarUrl ? 'none' : 'flex' }}
          >
            {initials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-foreground truncate leading-tight">{displayName}</div>
            <div className="mt-1">
              <span className={cn(
                "inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider leading-none",
                role === "SUPER_ADMIN"
                  ? "bg-purple-100 border-purple-200 text-purple-700 dark:bg-purple-950/40 dark:border-purple-900/50 dark:text-purple-400"
                  : role === "ADMIN"
                    ? "bg-blue-50 border-blue-100 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400"
                    : role === "EMPLOYER"
                      ? "bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400"
                      : "bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-900/30 dark:text-emerald-400"
              )}>
                {ROLE_LABEL[role]}
              </span>
            </div>
          </div>
        </div>

        {role === "CANDIDATE" && (
          <button
            onClick={() => setAvailable(v => !v)}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-lg transition-colors",
              available ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full", available ? "bg-emerald-500" : "bg-amber-500")} />
            <span className="text-[11px] font-semibold">
              {available ? "Available for hire" : "Not available"}
            </span>
          </button>
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {groups.map((g, gi) => (
          <div key={g.label} className={cn(gi > 0 && "mt-2 pt-2 border-t border-border")}>
            <div className="text-[9px] font-bold uppercase tracking-[1.2px] text-ink-200 px-2.5 pt-1.5 pb-1">
              {g.label}
            </div>
            {g.items.map(item => {
              const Icon = item.icon;

              // Dynamic unread count badge override for messages
              let badge = item.badge;
              if (item.to.includes("messages")) {
                badge = unreadMessagesCount > 0 ? String(unreadMessagesCount) : undefined;
              } else if (item.to.includes("applications") && role === "CANDIDATE") {
                badge = appsCount > 0 ? String(appsCount) : undefined;
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNav}
                  className={({ isActive }) => cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium mb-0.5 transition-all",
                    isActive
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon size={15} className="flex-shrink-0 opacity-80" />
                  <span className="truncate">{item.label}</span>
                  {badge && (
                    <span className="ml-auto flex items-center gap-1.5">
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground min-w-[18px] text-center">
                        {badge}
                      </span>
                      {item.to.includes("applications") && role === "CANDIDATE" && unreadMessagesCount > 0 && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse shadow-sm">
                          NEW
                        </span>
                      )}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </aside>
  );
}

const NOTIF_ICONS: Record<string, string> = {
  JOB_MATCH: "✨",
  APPLICATION_STATUS: "📋",
  MESSAGE: "💬",
  INTERVIEW: "🤝",
  SYSTEM: "⚙️",
};

type NotificationItem = {
  _id?: string;
  id?: string;
  type: string;
  title: string;
  body: string;
  isRead?: boolean;
  createdAt: string;
};

function Topbar({
  title, subtitle, actions, onMenu, onSettingsClick, showHamburger = true,
}: { title: string; subtitle?: string; actions?: ReactNode; onMenu: () => void; onSettingsClick?: () => void; showHamburger?: boolean }) {
  const qc = useQueryClient();
  const [showNotif, setShowNotif] = useState(false);

  const { data: realNotifs } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: () => apiNotifications.getAll(),
    refetchInterval: 10000, // Real-time poll every 10s
  });

  const markAllReadMut = useMutation({
    mutationFn: () => apiNotifications.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markReadMut = useMutation({
    mutationFn: (id: string) => apiNotifications.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const notifsList = (realNotifs ?? []).map((n: NotificationItem) => ({
    id: n._id || n.id,
    type: n.type,
    title: n.title,
    body: n.body,
    unread: !n.isRead,
    icon: NOTIF_ICONS[n.type] || "🔔",
    timestamp: relativeTime(n.createdAt),
  }));

  const unreadCount = notifsList.filter(n => n.unread).length;

  return (
    <header className="bg-card border-b border-border px-5 lg:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger — hidden when bottom nav handles mobile navigation */}
        {showHamburger && (
          <button
            onClick={onMenu}
            aria-label="Open navigation menu"
            className="lg:hidden p-1.5 rounded-lg hover:bg-secondary"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-serif text-xl text-foreground leading-tight tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-[12px] text-muted-foreground truncate">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {actions}

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(v => !v)}
            aria-label="Open notifications"
            className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-secondary hover:bg-ink-100 transition-colors"
          >
            <Bell size={15} className="text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-card rounded-2xl border border-border shadow-xl z-40 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold">Notifications</span>
                  <button onClick={() => markAllReadMut.mutate()} className="text-[11px] text-primary font-semibold hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notifsList.length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications</div>
                  )}
                  {notifsList.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.unread) {
                          markReadMut.mutate(n.id);
                        }
                      }}
                      className={cn(
                        "px-4 py-3 border-b border-border last:border-0 flex gap-2.5 cursor-pointer hover:bg-secondary/30 transition-all",
                        n.unread && "bg-accent/40"
                      )}
                    >
                      <div className="text-lg flex-shrink-0">{n.icon}</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[12px] font-semibold text-foreground">{n.title}</div>
                        <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.body}</div>
                        <div className="text-[10px] text-ink-300 mt-1">{n.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          onClick={onSettingsClick}
          aria-label="Open settings"
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary hover:bg-ink-100 transition-colors"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}

function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("dashboard-dark-mode");
    const initial = stored !== null
      ? stored === "true"
      : document.documentElement.classList.contains("dark");
    setDarkMode(initial);
    document.documentElement.classList.toggle("dark", initial);
  }, []);

  const toggleMode = () => {
    setDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("dashboard-dark-mode", String(next));
      }
      document.documentElement.classList.toggle("dark", next);
      return next;
    });
  };

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label="Toggle dark mode"
      className={cn(
        "w-12 h-6 rounded-full p-1 transition-all flex items-center",
        darkMode ? "bg-primary justify-end" : "bg-border justify-start"
      )}
    >
      <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
    </button>
  );
}

//
// SHELL
//
export function DashboardShell({
  title, subtitle, actions, children,
}: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  if (mobileOpen) {
    setTimeout(() => { }, 0); // noop, kept for clarity
  }

  // Load and apply the theme + dark mode on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("dashboard-theme") || "lavender";
    const root = document.documentElement;
    if (storedTheme === "lavender") {
      root.style.setProperty("--primary", "317 35% 36%");
      root.style.setProperty("--ring", "317 35% 36%");
      root.style.setProperty("--hc-mauve", "#7C3B6E");
    } else if (storedTheme === "emerald") {
      root.style.setProperty("--primary", "159 47% 45%");
      root.style.setProperty("--ring", "159 47% 45%");
      root.style.setProperty("--hc-mauve", "#3DAA7D");
    } else if (storedTheme === "sunset") {
      root.style.setProperty("--primary", "30 70% 50%");
      root.style.setProperty("--ring", "30 70% 50%");
      root.style.setProperty("--hc-mauve", "#D4A24C");
    } else if (storedTheme === "indigo") {
      root.style.setProperty("--primary", "260 70% 55%");
      root.style.setProperty("--ring", "260 70% 55%");
      root.style.setProperty("--hc-mauve", "#7C3AED");
    }
    // Restore dark mode preference
    const isDark = localStorage.getItem("dashboard-dark-mode") === "true";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const { user } = useAuthStore();
  const role = user?.role ?? "CANDIDATE";
  const hasBottomNav = role === "CANDIDATE" || role === "EMPLOYER";

  // Bottom nav items per role (max 5)
  const bottomNavItems: NavItem[] = role === "CANDIDATE"
    ? [
      { to: "/candidate/dashboard", label: "Home", icon: LayoutDashboard },
      { to: "/candidate/jobs", label: "Jobs", icon: Briefcase },
      { to: "/candidate/applications", label: "Applied", icon: FileText },
      { to: "/candidate/messages", label: "Messages", icon: MessageSquare },
      { to: "/candidate/profile", label: "Profile", icon: User },
    ]
    : [
      { to: "/employer/dashboard", label: "Home", icon: LayoutDashboard },
      { to: "/employer/listings", label: "Listings", icon: Briefcase },
      { to: "/employer/post-job", label: "Post Job", icon: FilePlus },
      { to: "/employer/pipeline", label: "Pipeline", icon: FileText },
      { to: "/employer/messages", label: "Messages", icon: MessageSquare },
    ];

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile drawer — Admin/SuperAdmin only (bottom nav handles Candidate/Employer) */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-fade-in">
            <Sidebar onNav={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation"
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-card hover:bg-secondary"
            >
              <X size={16} />
            </button>
          </div>
        </>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <Topbar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onMenu={() => setMobileOpen(true)}
          onSettingsClick={() => setShowSettings(true)}
          showHamburger={!hasBottomNav}
        />
        {/* Extra bottom padding on mobile to clear the bottom nav bar */}
        <div
          className={cn(
            "flex-1 overflow-y-auto px-5 lg:px-6 py-5 scrollbar-thin",
            hasBottomNav && "pb-24 lg:pb-5"
          )}
          key={location.pathname}
        >
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>

      {/* Mobile bottom nav — CANDIDATE & EMPLOYER only */}
      {hasBottomNav && (
        <nav
          aria-label="Mobile navigation"
          className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
          style={{
            background: "hsl(var(--card) / 0.96)",
            backdropFilter: "saturate(180%) blur(16px)",
            WebkitBackdropFilter: "saturate(180%) blur(16px)",
            borderTop: "1px solid hsl(var(--border))",
          }}
        >
          <div className="flex items-stretch justify-around h-16 px-1">
            {bottomNavItems.map(item => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200",
                      "text-[9px] font-bold uppercase tracking-wide rounded-token-md mx-0.5",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "flex items-center justify-center w-8 h-6 rounded-token-sm transition-all duration-200",
                          isActive && "bg-primary/10"
                        )}
                      >
                        <Icon
                          size={16}
                          className={cn("transition-transform duration-200", isActive && "scale-110")}
                        />
                      </span>
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
          {/* iOS home indicator safe area */}
          <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
        </nav>
      )}

      {/* Settings modal */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

//
// SHARED PRIMITIVES (re-exported so pages can import from one place)
//
export function SectionCard({
  title, subtitle, actions, action, children, className, noPad,
}: {
  title?: string; subtitle?: string; actions?: ReactNode; action?: ReactNode;
  children: ReactNode; className?: string; noPad?: boolean;
}) {
  const headerActions = actions ?? action;
  return (
    <section className={cn("bg-card border border-border rounded-token-lg overflow-hidden", className)}>
      {(title || headerActions) && (
        <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-bold text-foreground">{title}</h2>}
            {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </header>
      )}
      <div className={cn(noPad ? "" : "p-4")}>{children}</div>
    </section>
  );
}

export function BtnPrimary({
  children, onClick, type = "button", disabled, className,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold text-primary-foreground bg-primary press",
        "hover:bg-mauve-600 hover:-translate-y-0.5 hover:shadow-elev1",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function BtnOutline({
  children, onClick, type = "button", disabled, className,
}: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit"; disabled?: boolean; className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-semibold transition-all",
        "bg-transparent border-[1.5px] border-ink-200 text-ink-500",
        "hover:border-primary hover:text-primary",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

// ─── SETTINGS MODAL ──────────────────────────────────────────────────────────
function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<"profile" | "preferences">("profile");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    companyName: "",
    title: "",
    bio: "",
  });

  const [prefs, setPrefs] = useState({
    theme: "lavender",
    emailAlerts: true,
    soundAlerts: false,
  });

  type ProfileUser = {
    firstName?: string;
    lastName?: string;
    phone?: string;
  };

  type ProfileQueryData = {
    userId?: ProfileUser;
    companyName?: string;
    title?: string;
    bio?: string;
  };

  type UpdateProfileData = {
    firstName?: string;
    lastName?: string;
    phone?: string;
    companyName?: string;
    title?: string;
    bio?: string;
  };

  type AuthUser = ReturnType<typeof useAuthStore> extends { user: infer U } ? U : unknown;

  type UpdateProfileResponse = {
    user?: AuthUser;
  };

  // Fetch full profile when modal opens
  const { data: profile, isLoading } = useQuery<ProfileQueryData>({
    queryKey: ["settingsProfile"],
    queryFn: () => apiProfile.getMe(),
    enabled: isOpen,
  });

  // Sync profile data to form
  useEffect(() => {
    if (profile) {
      const pUser = profile.userId ?? {};
      setFormData({
        firstName: pUser.firstName || "",
        lastName: pUser.lastName || "",
        phone: pUser.phone || "",
        companyName: profile.companyName || "",
        title: profile.title || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  // Load preferences from local storage
  useEffect(() => {
    if (isOpen) {
      const storedTheme = localStorage.getItem("dashboard-theme") || "lavender";
      const storedEmail = localStorage.getItem("pref-email") !== "false";
      const storedSound = localStorage.getItem("pref-sound") === "true";
      setPrefs({ theme: storedTheme, emailAlerts: storedEmail, soundAlerts: storedSound });
    }
  }, [isOpen]);

  const getMutationErrorMessage = (err: unknown): string | undefined => {
    if (err instanceof Error) return err.message;
    if (typeof err === "object" && err !== null && "response" in err) {
      const apiErr = err as { response?: { data?: { message?: string } } };
      return apiErr.response?.data?.message;
    }
    return undefined;
  };

  const updateProfileMut = useMutation<UpdateProfileResponse, unknown, UpdateProfileData>({
    mutationFn: (data: UpdateProfileData) => apiProfile.updateMe(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["settingsProfile"] });
      qc.invalidateQueries({ queryKey: ["employerProfile"] });
      qc.invalidateQueries({ queryKey: ["candidateStats"] });
      qc.invalidateQueries({ queryKey: ["myApps"] });
      qc.invalidateQueries({ queryKey: ["employerProfile"] });
      // Update auth store user
      if (res?.user && typeof res.user === 'object' && 'id' in res.user && 'email' in res.user) {
        setUser(res.user as Parameters<typeof setUser>[0]);
      }
      toast.success("Settings updated successfully!");
    },
    onError: (err: unknown) => {
      toast.error(getMutationErrorMessage(err) || "Failed to update profile settings");
    }
  });

  const applyTheme = (themeName: string) => {
    const root = document.documentElement;
    if (themeName === "lavender") {
      root.style.setProperty("--primary", "317 35% 36%");
      root.style.setProperty("--ring", "317 35% 36%");
      root.style.setProperty("--hc-mauve", "#7C3B6E");
    } else if (themeName === "emerald") {
      root.style.setProperty("--primary", "159 47% 45%");
      root.style.setProperty("--ring", "159 47% 45%");
      root.style.setProperty("--hc-mauve", "#3DAA7D");
    } else if (themeName === "sunset") {
      root.style.setProperty("--primary", "30 70% 50%");
      root.style.setProperty("--ring", "30 70% 50%");
      root.style.setProperty("--hc-mauve", "#D4A24C");
    } else if (themeName === "indigo") {
      root.style.setProperty("--primary", "260 70% 55%");
      root.style.setProperty("--ring", "260 70% 55%");
      root.style.setProperty("--hc-mauve", "#7C3AED");
    }
    setPrefs(p => ({ ...p, theme: themeName }));
    localStorage.setItem("dashboard-theme", themeName);
    toast.success(`Theme updated to ${themeName}!`);
  };

  const handlePrefChange = (key: "emailAlerts" | "soundAlerts", value: boolean) => {
    setPrefs(p => ({ ...p, [key]: value }));
    localStorage.setItem(key === "emailAlerts" ? "pref-email" : "pref-sound", String(value));
    toast.success("Preference saved!");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
      <div className="bg-card w-full max-w-lg rounded-3xl border border-border/85 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-foreground font-bold">Account Settings</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">Customize your personal profile and theme preferences</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all">
            <X size={16} />
          </button>
        </header>

        {/* Tabs */}
        <div className="flex border-b border-border bg-secondary/20">
          <button
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex-1 py-3 text-xs font-bold text-center border-b-[2.5px] transition-all",
              activeTab === "profile" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            User Profile
          </button>
          <button
            onClick={() => setActiveTab("preferences")}
            className={cn(
              "flex-1 py-3 text-xs font-bold text-center border-b-[2.5px] transition-all",
              activeTab === "preferences" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Preferences
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto scrollbar-thin flex-1 space-y-4">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center gap-2 text-muted-foreground">
              <Loader2 className="animate-spin text-primary" size={20} />
              <span>Loading details…</span>
            </div>
          ) : activeTab === "profile" ? (
            <form onSubmit={(e) => { e.preventDefault(); updateProfileMut.mutate(formData); }} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(d => ({ ...d, firstName: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(d => ({ ...d, lastName: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Email (Read Only)</label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-3.5 py-2 border border-border rounded-xl text-xs bg-secondary/50 text-muted-foreground focus:outline-none cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))}
                  placeholder="e.g. +1 555-0199"
                  className="w-full px-3.5 py-2 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                />
              </div>

              {user?.role === "EMPLOYER" ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData(d => ({ ...d, companyName: e.target.value }))}
                    className="w-full px-3.5 py-2 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Professional Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(d => ({ ...d, title: e.target.value }))}
                      placeholder="e.g. Senior Software Engineer"
                      className="w-full px-3.5 py-2 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wide text-ink-300 mb-1.5">Short Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(d => ({ ...d, bio: e.target.value }))}
                      rows={3}
                      placeholder="Write a brief professional summary..."
                      className="w-full px-3.5 py-2 border border-border rounded-xl text-xs bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all resize-none"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border text-ink-500 hover:bg-secondary rounded-full text-[11px] font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMut.isPending}
                  className="px-5 py-2 bg-primary text-white hover:opacity-90 active:scale-95 rounded-full text-[11px] font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {updateProfileMut.isPending ? <Loader2 size={11} className="animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 py-2">
              {/* Theme customizer */}
              <div>
                <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide">Interface Accent Theme</h3>
                <div className="grid grid-cols-4 gap-2.5">
                  {[
                    { key: "lavender", name: "Lavender", bg: "bg-[#7C3B6E]", border: "border-[#7C3B6E]" },
                    { key: "emerald", name: "Emerald", bg: "bg-[#3DAA7D]", border: "border-[#3DAA7D]" },
                    { key: "sunset", name: "Sunset", bg: "bg-[#D4A24C]", border: "border-[#D4A24C]" },
                    { key: "indigo", name: "Indigo", bg: "bg-[#7C3AED]", border: "border-[#7C3AED]" },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => applyTheme(t.key)}
                      className={cn(
                        "p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 hover:shadow-sm",
                        prefs.theme === t.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-full flex-shrink-0", t.bg)} />
                      <span className="text-[10px] font-semibold text-foreground">{t.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dark Mode toggle */}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-bold text-foreground mb-3.5 uppercase tracking-wide">Appearance</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] font-bold text-foreground flex items-center gap-2">
                      {typeof window !== 'undefined' && document.documentElement.classList.contains('dark')
                        ? <Moon size={13} className="text-primary" />
                        : <Sun size={13} className="text-amber-500" />
                      }
                      Dark Mode
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Switch between light and dark interface</div>
                  </div>
                  <DarkModeToggle />
                </div>
              </div>

              {/* Notification Toggles */}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-bold text-foreground mb-3.5 uppercase tracking-wide">Notification Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-bold text-foreground">Email Notifications</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Receive immediate email alerts for status changes or messages</div>
                    </div>
                    <button
                      onClick={() => handlePrefChange("emailAlerts", !prefs.emailAlerts)}
                      className={cn(
                        "w-9 h-5 rounded-full p-0.5 transition-all flex items-center",
                        prefs.emailAlerts ? "bg-primary justify-end" : "bg-border justify-start"
                      )}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[12px] font-bold text-foreground">Sound Effects</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Play audio cues upon receiving instant message updates</div>
                    </div>
                    <button
                      onClick={() => handlePrefChange("soundAlerts", !prefs.soundAlerts)}
                      className={cn(
                        "w-9 h-5 rounded-full p-0.5 transition-all flex items-center",
                        prefs.soundAlerts ? "bg-primary justify-end" : "bg-border justify-start"
                      )}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}