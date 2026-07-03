// src/components/layout/DashboardShell.tsx
import { ReactNode, useState, useEffect, HTMLAttributes } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LayoutDashboard, Briefcase, FileText, User, MessageSquare, FilePlus,
  Search, Users, ShieldCheck, ScrollText, ShieldAlert, UserCog, Activity,
  Bell, LogOut, Menu, X, Heart, Settings, Loader2, Moon, Sun, ArrowUpRight,
  Check, Sparkles, Calendar, ChevronLeft, ChevronRight,
  type LucideIcon,
} from "lucide-react";
import logo from "../../assets/sheEnableAI-removebg-preview.png";
import { cn, initials, relativeTime, getCompanyGradient } from "@/lib/utils";
import { useAuthStore, UserRole } from "@/store/authStore";
import { useNotifStore } from "@/store/notifStore";
import { apiNotifications, apiProfile, apiMessages, apiApplications, apiJobs, apiAdmin } from "@/lib/api";
import { toast } from "sonner";
import { MOCK_USERS } from "@/mock/data";
import { ProfileDropdown } from "../ui/ProfileDropdown";

//
// NAV CONFIG per role
//
type NavItem = { to: string; label: string; icon: LucideIcon; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

interface Thread {
  unreadCandidate: number;
  unreadEmployer: number;
}

type ThreadsQueryData = Thread[] | { results?: Thread[] };

interface ApplicationData {
  updatedAt?: string;
  appliedAt?: string;
  createdAt?: string;
  stage?: string;
  status?: string;
}

interface ListingData {
  status?: string;
  expiresAt?: string;
  deadline?: string;
}

interface NotificationBadgeCounts {
  unreadMessagesCount: number;
  appsCount: number;
  atsPendingCount: number;
  expiringListingsCount: number;
}

interface SidebarProps {
  onNav?: () => void;
  available: boolean;
  setAvailable: (avail: boolean) => void;
  collapsed?: boolean;
  setCollapsed?: (val: boolean) => void;
}

interface AuditLogEntry {
  createdAt: string;
  [key: string]: unknown;
}

interface SecurityInfo {
  recentFailedLogins?: number;
  accountsLockedToday?: number;
  unverifiedAccounts?: number;
  suspendedUsers?: number;
  [key: string]: unknown;
}

interface AdminUser {
  id?: string;
  email?: string;
  role?: string;
  name?: string;
  [key: string]: unknown;
}

interface EmployerProfile {
  companyName?: string;
  companyLogoUrl?: string;
}

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
// Theme helper (Unified under single brand pink anchor)
const applyThemeVars = () => {
  const root = document.documentElement;
  root.style.setProperty("--primary", "327 100% 45%");
  root.style.setProperty("--ring", "327 100% 45%");
  root.style.setProperty("--hc-mauve", "#E6007E");
};

// Hook to fetch notification/message badges
function useNotificationBadges(role: UserRole): NotificationBadgeCounts {
  const { data: threadsData } = useQuery<ThreadsQueryData>({
    queryKey: ["threadsBadge", role],
    queryFn: async () => {
      const res = await apiMessages.getThreads();
      return res as ThreadsQueryData;
    },
    refetchInterval: 10000,
    enabled: role === "CANDIDATE" || role === "EMPLOYER"
  });

  const rawThreads = Array.isArray(threadsData) ? threadsData : (threadsData?.results ?? []);
  const unreadMessagesCount = rawThreads.reduce(
    (acc: number, t: Thread) => acc + (role === "CANDIDATE" ? t.unreadCandidate : t.unreadEmployer),
    0
  );

  // Candidate: my applications count
  const { data: myAppsData } = useQuery<unknown[]>({
    queryKey: ["myAppsBadge", role],
    queryFn: async () => {
      const res = await apiApplications.getApplications();
      return (res ?? []) as unknown[];
    },
    refetchInterval: 10000,
    enabled: role === "CANDIDATE"
  });
  const appsCount = Array.isArray(myAppsData) ? myAppsData.length : 0;

  // Employer: ATS pipeline — candidates pending action (stuck >3 days in a stage)
  const { data: pipelineApps } = useQuery<unknown, unknown, ApplicationData[]>({
    queryKey: ["pipelineBadge", role],
    queryFn: () => apiApplications.getApplications(),
    refetchInterval: 30000,
    enabled: role === "EMPLOYER",
    select: (data: unknown) => {
      const raw = Array.isArray(data)
        ? (data as ApplicationData[])
        : ((data as { results?: ApplicationData[]; applications?: ApplicationData[] })?.results
          ?? (data as { results?: ApplicationData[]; applications?: ApplicationData[] })?.applications
          ?? []);
      const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
      return raw.filter((a: ApplicationData) => {
        const updatedAt = a.updatedAt || a.appliedAt || a.createdAt;
        if (!updatedAt) return false;
        const isActionable = !["HIRED", "REJECTED", "OFFER"].includes(a.stage || a.status);
        return isActionable && (Date.now() - new Date(updatedAt).getTime()) > THREE_DAYS_MS;
      });
    }
  });
  const atsPendingCount = Array.isArray(pipelineApps) ? pipelineApps.length : 0;

  // Employer: Listings expiring in ≤7 days
  const { data: listingsData } = useQuery<unknown, unknown, ListingData[]>({
    queryKey: ["listingsBadge", role],
    queryFn: () => apiJobs.getMyListings(),
    refetchInterval: 60000,
    enabled: role === "EMPLOYER",
    select: (data: unknown) => {
      const raw = Array.isArray(data)
        ? (data as ListingData[])
        : ((data as { results?: ListingData[]; jobs?: ListingData[] })?.results
          ?? (data as { results?: ListingData[]; jobs?: ListingData[] })?.jobs
          ?? []);
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
      return raw.filter((j: ListingData) => {
        if (j.status !== "ACTIVE") return false;
        const expiresAt = j.expiresAt || j.deadline;
        if (!expiresAt) return false;
        const diff = new Date(expiresAt).getTime() - Date.now();
        return diff > 0 && diff <= SEVEN_DAYS_MS;
      });
    }
  });
  const expiringListingsCount = Array.isArray(listingsData) ? listingsData.length : 0;

  return { unreadMessagesCount, appsCount, atsPendingCount, expiringListingsCount };
}


function Sidebar({
  onNav,
  available,
  setAvailable,
  collapsed = false,
  setCollapsed,
}: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role ?? "CANDIDATE";
  const groups = NAV[role];

  const { unreadMessagesCount, appsCount, atsPendingCount, expiringListingsCount } = useNotificationBadges(role);

  type AuditLogEntry = { createdAt: string;[key: string]: unknown };
  type SecurityInfo = {
    recentFailedLogins?: number;
    accountsLockedToday?: number;
    unverifiedAccounts?: number;
    suspendedUsers?: number;
    [key: string]: unknown;
  };
  type AdminUser = { id?: string; email?: string; role?: string; name?: string;[key: string]: unknown };

  // Admin badges queries
  const { data: adminLogs = [] } = useQuery<AuditLogEntry[]>({
    queryKey: ["sidebarAuditLogs"],
    queryFn: async () => {
      const res = await apiAdmin.getAuditLogs();
      return (res ?? []) as AuditLogEntry[];
    },
    enabled: role === "ADMIN" || role === "SUPER_ADMIN",
  });

  const { data: secInfo } = useQuery<SecurityInfo>({
    queryKey: ["sidebarSecurityInfo"],
    queryFn: async () => {
      const res = await apiAdmin.getSecurityInfo();
      return res as SecurityInfo;
    },
    enabled: role === "ADMIN" || role === "SUPER_ADMIN",
    refetchInterval: 15000,
  });

  const { data: allUsers = [] } = useQuery<AdminUser[]>({
    queryKey: ["sidebarUsers"],
    queryFn: async () => {
      const res = await apiAdmin.getUsers();
      return (res ?? []) as AdminUser[];
    },
    enabled: role === "ADMIN" || role === "SUPER_ADMIN",
  });

  const lastVisitAudit = localStorage.getItem("last-visit-audit") || new Date(0).toISOString();
  const unseenAuditCount = adminLogs.filter((l: AuditLogEntry) => l.createdAt > lastVisitAudit).length;
  const activeThreats = (secInfo?.recentFailedLogins ?? 0) + (secInfo?.accountsLockedToday ?? 0);
  const usersToReview = (secInfo?.unverifiedAccounts ?? 0) + (secInfo?.suspendedUsers ?? 0);
  const pendingAdminRequests = parseInt(localStorage.getItem("admin-requests-pending") || "1", 10);

  type EmployerProfile = { companyName?: string; companyLogoUrl?: string };
  const employerProfile = user as EmployerProfile;

  // For EMPLOYER: use companyName for avatar; fall back to firstName+lastName
  const displayName = role === "EMPLOYER"
    ? employerProfile.companyName || (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split("@")[0] ?? "Employer")
    : (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split("@")[0] ?? "User");
  const avatarUrl = (role === "EMPLOYER" ? employerProfile.companyLogoUrl : null) || user?.avatarUrl || null;



  return (
    <aside className="w-full flex-shrink-0 bg-card flex flex-col h-full relative">
      {/* Collapsible toggle button - Only show on desktop (when setCollapsed is passed) */}
      {setCollapsed && (
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute top-6 -right-3 z-50 w-6 h-6 rounded-full border border-border bg-card flex items-center justify-center cursor-pointer shadow-md text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 active:scale-95"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      )}

      {/* ── TOP: Profile block for ALL roles ── */}
      <div className={cn(
        "border-b border-border transition-all duration-300",
        collapsed ? "px-2 py-3.5" : "px-4 py-3.5",
        (role === "ADMIN" || role === "SUPER_ADMIN") ? "pt-4" : "pt-6"
      )}>
        <div className={cn("flex items-center gap-2.5 mb-2", collapsed && "justify-center")}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex'); }}
              className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
            />
          ) : null}
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm flex-shrink-0 shadow-sm",
              getCompanyGradient(displayName)
            )}
            style={{ display: avatarUrl ? 'none' : 'flex' }}
          >
            {initials(displayName)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1 transition-opacity duration-300">
              <div className="text-[13px] font-semibold text-foreground truncate leading-tight">{displayName}</div>
              <div className="mt-1">
                <span className="inline-block text-[10px] font-semibold px-2 py-[2px] rounded-[var(--radius-pill)] bg-[var(--ink-100)] text-[var(--ink-700)] uppercase leading-none">
                  {ROLE_LABEL[role]}
                </span>
              </div>
            </div>
          )}
        </div>

        {role === "CANDIDATE" && (
          collapsed ? (
            <div className="flex justify-center mt-2">
              <span 
                className={cn(
                  "w-2.5 h-2.5 rounded-full ring-2 ring-card animate-pulse", 
                  available ? "bg-[var(--status-success-fg)]" : "bg-[var(--status-progress-fg)]"
                )}
                title={available ? "Available for hire" : "Not available"}
              />
            </div>
          ) : (
            <button
              onClick={() => setAvailable(!available)}
              className={cn(
                "w-full flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius-control)] transition-colors",
                available
                  ? "bg-[var(--status-success-bg)] text-[var(--status-success-fg)]"
                  : "bg-[var(--status-progress-bg)] text-[var(--status-progress-fg)]"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", available ? "bg-[var(--status-success-fg)]" : "bg-[var(--status-progress-fg)]")} />
              <span className="text-[11px] font-semibold">
                {available ? "Available for hire" : "Not available"}
              </span>
            </button>
          )
        )}
      </div>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto px-2 py-2 scrollbar-thin">
        {groups.map((g, gi) => (
          <div key={g.label} className={cn(gi > 0 && "mt-4")}>
            {!collapsed ? (
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)] px-2.5 pt-1.5 pb-1 transition-opacity duration-300">
                {g.label}
              </div>
            ) : gi > 0 ? (
              <div className="h-px bg-border/50 my-3 mx-2" />
            ) : null}
            {g.items.map(item => {
              const Icon = item.icon;

              // Dynamic badge overrides per nav item
              let badge = item.badge;
              let badgeVariant: "primary" | "amber" | "rose" = "primary";
              let showDot = false;

              if (item.to.includes("messages")) {
                badge = unreadMessagesCount > 0 ? String(unreadMessagesCount) : undefined;
              } else if (item.to.includes("applications") && role === "CANDIDATE") {
                badge = appsCount > 0 ? String(appsCount) : undefined;
              } else if (item.to.includes("pipeline") && role === "EMPLOYER") {
                // Amber badge — candidates awaiting action >3 days
                if (atsPendingCount > 0) {
                  badge = String(atsPendingCount);
                  badgeVariant = "amber";
                } 
              } else if (item.to.includes("listings") && role === "EMPLOYER") {
                // Rose badge — listings expiring within 7 days
                if (expiringListingsCount > 0) {
                  badge = String(expiringListingsCount);
                  badgeVariant = "rose";
                } 
              } else if (item.to.includes("dashboard") && role === "EMPLOYER") {
                // Pulsing dot — ambient "new AI matches available" awareness
                showDot = true;
              } else if (item.to.includes("/admin/audit") && (role === "ADMIN" || role === "SUPER_ADMIN")) {
                badge = unseenAuditCount > 0 ? String(unseenAuditCount) : undefined;
                badgeVariant = "primary";
              } else if (item.to.includes("/super-admin/threat-monitor") && (role === "ADMIN" || role === "SUPER_ADMIN")) {
                if (activeThreats > 0) {
                  badge = String(activeThreats);
                  badgeVariant = "rose";
                }
              } else if (item.to.includes("/admin/users") && (role === "ADMIN" || role === "SUPER_ADMIN")) {
                if (usersToReview > 0) {
                  badge = String(usersToReview);
                  badgeVariant = "amber";
                }
              } else if (item.to.includes("/super-admin/manage-admins") && (role === "ADMIN" || role === "SUPER_ADMIN")) {
                if (pendingAdminRequests > 0) {
                  badge = String(pendingAdminRequests);
                  badgeVariant = "amber";
                }
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNav}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium mb-0.5 transition-all border-l-[3px] border-transparent",
                    isActive
                      ? "bg-[var(--brand-pink-tint)] text-[var(--brand-pink)] font-semibold border-l-[var(--brand-pink)] rounded-l-none"
                      : "text-[var(--ink-700)] bg-transparent hover:bg-[var(--ink-100)] hover:text-[var(--ink-900)]",
                    collapsed && "justify-center px-0 h-10 w-10 mx-auto rounded-xl border-l-0"
                  )}
                >
                  {({ isActive }) => (
                    <>
                      <div className="relative flex-shrink-0 flex items-center justify-center">
                        <Icon size={16} className={cn("transition-colors", isActive ? "text-[var(--brand-pink)]" : "text-[var(--ink-500)]")} />
                        {/* Ambient dot for Dashboard */}
                        {showDot && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse ring-2 ring-card" />
                        )}
                        {collapsed && badge && (
                          <span className="absolute -top-2 -right-2 bg-[var(--brand-pink)] text-white w-4 h-4 flex items-center justify-center rounded-full text-[9px] font-bold leading-none shadow-sm">
                            {badge}
                          </span>
                        )}
                      </div>
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && badge && (
                        <span className="ml-auto flex items-center justify-center flex-shrink-0">
                          <span className="bg-[var(--brand-pink)] text-white w-[18px] h-[18px] flex items-center justify-center rounded-full text-[11px] font-semibold leading-none">
                            {badge}
                          </span>
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── BOTTOM: Logo + Powered By — for ALL roles ── */}
      <div className={cn(
        "mt-auto border-t border-border flex flex-col items-center gap-2 bg-secondary/15 transition-all duration-300",
        collapsed ? "p-2.5" : "p-4 items-start"
      )}>
        <Link to="/" className="relative z-10 flex items-center group" aria-label="SheEnableAI home">
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-[var(--brand-pink-soft)] flex items-center justify-center text-[var(--brand-pink)] font-black text-xs group-hover:scale-105 transition-transform shadow-sm">
              SE
            </div>
          ) : (
            <img
              src={logo}
              alt="SheEnableAI logo"
              className="w-[182px] h-[50px] object-contain transition-transform group-hover:scale-105"
            />
          )}
        </Link>
        {!collapsed && (
          <div className="text-[9px] font-sans font-bold tracking-wider text-[var(--ink-500)] uppercase">
            Powered By Arbob Tech Team
          </div>
        )}
      </div>
    </aside>
  );
}

const NOTIF_ICONS: Record<string, LucideIcon> = {
  JOB_MATCH: Sparkles,
  APPLICATION_STATUS: FileText,
  MESSAGE: MessageSquare,
  INTERVIEW: Calendar,
  SYSTEM: Settings,
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
  title = "", subtitle = "", actions, onMenu, onSettingsClick, onSearchClick, showHamburger = true, available,
}: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; onMenu: () => void; onSettingsClick?: () => void; onSearchClick?: () => void; showHamburger?: boolean; available: boolean }) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const role = user?.role ?? "CANDIDATE";
  const [showNotif, setShowNotif] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [navSearchQuery, setNavSearchQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setNavSearchQuery(params.get("q") ?? "");
  }, [location.search]);

  const handleNavSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      navigate(`/candidate/jobs?q=${encodeURIComponent(navSearchQuery.trim())}`);
    } else {
      navigate("/candidate/jobs");
    }
  };

  const { data: realNotifs } = useQuery<NotificationItem[]>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiNotifications.getAll();
      return (res ?? []) as NotificationItem[];
    },
    refetchInterval: 10000, // Real-time poll every 10s
  });

  const markAllReadMut = useMutation({
    mutationFn: async () => {
      await apiNotifications.markAllRead();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const markReadMut = useMutation({
    mutationFn: async (id: string) => {
      await apiNotifications.markRead(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  });

  const notifsList = (realNotifs ?? [])
    .filter(Boolean)
    .map((n: NotificationItem) => ({
      id: n._id || n.id,
      type: n.type || "SYSTEM",
      title: n.title || "Notification",
      body: n.body || "",
      unread: !n.isRead,
      icon: NOTIF_ICONS[n.type || "SYSTEM"] || Bell,
      timestamp: n.createdAt ? relativeTime(n.createdAt) : "Just now",
    }));

  const unreadCount = notifsList.filter(n => n.unread).length;

  return (
    <header className="bg-card px-5 lg:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
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

        {/* Logo shown on mobile screens only */}
        {role === "CANDIDATE" && (
          <Link to="/" className="lg:hidden flex items-center mr-2 flex-shrink-0" aria-label="SheEnableAI home">
            <img
              src={logo}
              alt="SheEnableAI logo"
              className="w-[136px] h-[36px] object-contain"
            />
          </Link>
        )}
        {(title || subtitle) && (
          <div className="min-w-0">
            {title && <h1 className="text-[20px] font-semibold text-[var(--ink-900)] leading-tight tracking-tight truncate">{title}</h1>}
            {subtitle && <p className="text-[14px] font-normal text-[var(--ink-500)] truncate mt-1">{subtitle}</p>}
          </div>
        )}
      </div>

      {role === "CANDIDATE" && (
        <form onSubmit={handleNavSearchSubmit} className="w-full md:hidden mt-2 flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-500)]" />
            <input
              type="text"
              value={navSearchQuery}
              onChange={(e) => setNavSearchQuery(e.target.value)}
              placeholder="Search jobs..."
              className="w-full h-9 pl-9 pr-3 bg-secondary hover:bg-ink-100 border border-border/80 focus:border-[var(--brand-pink)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[rgba(230,0,126,0.15)] text-foreground placeholder:text-[var(--ink-400)] transition-all duration-200"
            />
          </div>
        </form>
      )}

      <div className="flex items-center ml-auto">
        {role === "CANDIDATE" && (
          <form onSubmit={handleNavSearchSubmit} className="hidden md:flex items-center gap-2 mr-4">
            <div className="relative w-48 lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--ink-500)]" />
              <input
                type="text"
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                placeholder="Search jobs..."
                className="w-full h-9 pl-9 pr-3 bg-secondary hover:bg-ink-100 border border-border/80 focus:border-[var(--brand-pink)] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[rgba(230,0,126,0.15)] text-foreground placeholder:text-[var(--ink-400)] transition-all duration-200"
              />
            </div>
          </form>
        )}

        {actions}

        {/* Global Command Palette search input/button */}
        {(role === "ADMIN" || role === "SUPER_ADMIN") && (
          <button
            onClick={onSearchClick}
            className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-secondary hover:bg-ink-100 text-muted-foreground hover:text-foreground text-[11px] font-medium rounded-xl border border-border/80 transition-all cursor-pointer mr-2"
          >
            <Search size={12} />
            <span>Search platform...</span>
            <kbd className="bg-card px-1.5 py-0.2 rounded border border-border text-[9px] font-mono tracking-widest font-black uppercase text-ink-300 select-none ml-2">
              ⌘K
            </kbd>
          </button>
        )}

        {/* Unified Top-Right Utility Icon Cluster */}
        <div className="flex items-center gap-2 ml-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotif(v => !v)}
              aria-label="Open notifications"
              className="relative w-9 h-9 rounded-full flex items-center justify-center bg-transparent border border-[var(--ink-300)] hover:bg-[var(--ink-100)]/30 hover:border-[var(--ink-500)] transition-all cursor-pointer shadow-none select-none"
            >
              <Bell size={18} className="text-[var(--ink-700)]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotif && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
                <div className="fixed sm:absolute top-16 sm:top-auto left-4 right-4 sm:left-auto sm:right-0 mt-2 sm:w-80 w-auto bg-card rounded-2xl border border-border shadow-xl z-40 overflow-hidden animate-fade-in">
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
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0",
                          n.type === "JOB_MATCH" && "bg-[var(--brand-pink-soft)] text-[var(--brand-pink)]",
                          n.type === "APPLICATION_STATUS" && "bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400",
                          n.type === "MESSAGE" && "bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
                          n.type === "INTERVIEW" && "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400",
                          (!n.type || n.type === "SYSTEM" || !["JOB_MATCH", "APPLICATION_STATUS", "MESSAGE", "INTERVIEW"].includes(n.type)) && "bg-[var(--ink-100)] dark:bg-[var(--ink-700)]/40 text-[var(--ink-500)] dark:text-[var(--ink-300)]"
                        )}>
                          <n.icon size={15} />
                        </div>
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

          {/* Quick Dark Toggle */}
          <QuickDarkModeToggle />

          {/* Profile Dropdown */}
          <ProfileDropdown
            available={available}
            onSettingsClick={onSettingsClick}
          />
        </div>
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
  title = "", subtitle = "", actions, children,
}: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [available, setAvailable] = useState(true);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar-collapsed") === "true";
    }
    return false;
  });
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Load and apply the theme + dark mode on mount
  useEffect(() => {
    applyThemeVars();
    // Restore dark mode preference
    const isDark = localStorage.getItem("dashboard-dark-mode") === "true";
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.userAgent.toLowerCase().includes("mac");
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Global Search Shortcut: Ctrl+K or Cmd+K
      if (modifier && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch(true);
      }

      // Global Save Shortcut: Ctrl+S or Cmd+S
      if (modifier && e.key.toLowerCase() === "s") {
        e.preventDefault();
        const saveBtn = Array.from(document.querySelectorAll("button")).find((btn) => {
          const txt = btn.textContent?.toLowerCase() || "";
          return (txt.includes("save") || txt.includes("publish")) && !btn.disabled;
        });
        if (saveBtn) {
          saveBtn.click();
        }
      }

      // Escape key handler: dismiss modals/dialogs
      if (e.key === "Escape") {
        if (showSettings) {
          e.preventDefault();
          setShowSettings(false);
        }
        // Also trigger click on any close buttons matching standard selectors
        const closeButtons = document.querySelectorAll('button[aria-label="Close"], button[aria-label*="close"], button[title="Close"]');
        if (closeButtons.length > 0) {
          (closeButtons[0] as HTMLButtonElement).click();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSettings]);

  const { user } = useAuthStore();
  const role = user?.role ?? "CANDIDATE";
  const hasBottomNav = role === "CANDIDATE" || role === "EMPLOYER";

  const { unreadMessagesCount, appsCount } = useNotificationBadges(role);

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
      <div className={cn(
        "hidden lg:flex h-screen sticky top-0 transition-all duration-300 ease-in-out border-r border-border/80",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}>
        <Sidebar available={available} setAvailable={setAvailable} collapsed={collapsed} setCollapsed={setCollapsed} />
      </div>

      {/* Mobile drawer — Admin/SuperAdmin only (bottom nav handles Candidate/Employer) */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-fade-in">
            <Sidebar onNav={() => setMobileOpen(false)} available={available} setAvailable={setAvailable} />
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
          onSearchClick={() => setShowSearch(true)}
          showHamburger={!hasBottomNav}
          available={available}
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
              const isActive = location.pathname === item.to;
              let badgeCount = 0;
              if (item.to.includes("messages")) {
                badgeCount = unreadMessagesCount;
              } else if (item.to.includes("applications") && role === "CANDIDATE") {
                badgeCount = appsCount;
              }

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-all duration-200",
                    "text-[9px] font-bold uppercase tracking-wide rounded-token-md mx-0.5",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex items-center justify-center w-8 h-6 rounded-token-sm transition-all duration-200 relative",
                      isActive && "bg-primary/10"
                    )}
                  >
                    <Icon
                      size={16}
                      className={cn("transition-transform duration-200", isActive && "scale-110")}
                    />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground min-w-[14px]">
                        {badgeCount}
                      </span>
                    )}
                  </span>
                  <span>{item.label}</span>
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

      {/* Command Palette search modal */}
      <CommandPaletteModal isOpen={showSearch} onClose={() => setShowSearch(false)} />
    </div>
  );
}

//
// SHARED PRIMITIVES (re-exported so pages can import from one place)
//
export function SectionCard({
  title, subtitle, actions, action, children, className, noPad, ...props
}: {
  title?: string; subtitle?: string; actions?: ReactNode; action?: ReactNode;
  children: ReactNode; className?: string; noPad?: boolean;
} & HTMLAttributes<HTMLElement>) {
  const headerActions = actions ?? action;
  return (
    <section className={cn("bg-[var(--surface)] border border-[var(--ink-300)] rounded-[var(--radius-card)] shadow-[var(--shadow-card)] overflow-hidden", className)} {...props}>
      {(title || headerActions) && (
        <header className="px-6 pt-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-[var(--ink-900)]">{title}</h2>}
            {subtitle && <p className="text-xs text-[var(--ink-500)] mt-0.5">{subtitle}</p>}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </header>
      )}
      <div className={cn(
        noPad ? "" : "px-6 pb-6",
        (title || headerActions) ? (noPad ? "mt-5" : "pt-5") : (noPad ? "" : "pt-6")
      )}>
        {children}
      </div>
    </section>
  );
}

export function Banner({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-[var(--brand-pink-soft)] border border-[var(--ink-300)] rounded-xl px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4", className)}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <Icon className="w-5 h-5 text-[var(--brand-pink)]" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[var(--ink-900)] uppercase tracking-wider">{title}</h4>
          <p className="text-sm text-[var(--ink-700)]">{description}</p>
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function Stepper({
  steps,
  currentStep,
  isRejected = false,
  onChange,
  disabledStepCheck,
}: {
  steps: readonly string[] | string[];
  currentStep: number;
  isRejected?: boolean;
  onChange?: (step: number) => void;
  disabledStepCheck?: (step: number) => boolean;
}) {
  return (
    <div className="flex items-center w-full overflow-x-auto pb-4 pt-2 scrollbar-thin">
      {steps.map((label, i) => {
        const isCompleted = !isRejected && i < currentStep;
        const isCurrent = !isRejected && i === currentStep;
        const isUpcoming = isRejected || i > currentStep;
        const isDisabled = disabledStepCheck ? disabledStepCheck(i) : false;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <button
              type="button"
              disabled={isDisabled || !onChange}
              onClick={() => onChange?.(i)}
              className={cn(
                "flex flex-col items-center focus:outline-none transition-all flex-shrink-0 group",
                onChange && !isDisabled ? "cursor-pointer hover:scale-105" : "cursor-default disabled:opacity-50"
              )}
            >
              {/* Circle */}
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
                  isCompleted && "bg-[var(--brand-pink)] text-white shadow-sm border border-[var(--brand-pink)]",
                  isCurrent && "bg-[var(--surface)] border-2 border-[var(--brand-pink)] text-[var(--brand-pink)] shadow-sm",
                  isUpcoming && "bg-[var(--ink-100)] text-[var(--ink-500)] border border-transparent"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3.5 h-3.5 stroke-[2.5px] text-white" />
                ) : (
                  <span>{i + 1}</span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] mt-2 whitespace-nowrap transition-all duration-200 capitalize",
                  isRejected && "line-through text-[var(--ink-500)]",
                  !isRejected && isCompleted && "text-[var(--ink-900)] font-medium",
                  !isRejected && isCurrent && "text-[var(--ink-900)] font-semibold",
                  !isRejected && isUpcoming && "text-[var(--ink-500)] font-medium"
                )}
              >
                {label.toLowerCase()}
              </span>
            </button>

            {/* Connector Line */}
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-[1px] mx-2 mb-6 min-w-[20px] transition-all duration-200 bg-[var(--ink-300)]"
              />
            )}
          </div>
        );
      })}
    </div>
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
        "h-11 inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-[var(--radius-control)] text-sm font-semibold text-white bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] focus:outline-none focus:ring-2 focus:ring-[rgba(230,0,126,0.4)] focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none shadow-none",
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
        "h-11 inline-flex items-center justify-center gap-1.5 px-[18px] py-3 rounded-[var(--radius-control)] text-sm font-medium text-[var(--ink-900)] bg-white border border-[var(--ink-300)] hover:border-[var(--ink-500)] hover:bg-[var(--ink-100)] focus:outline-none focus:ring-2 focus:ring-[rgba(230,0,126,0.4)] focus:ring-offset-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none shadow-none",
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
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/auth/login");
  };

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
    queryFn: async () => {
      const res = await apiProfile.getMe();
      return res as ProfileQueryData;
    },
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
      const storedEmail = localStorage.getItem("pref-email") !== "false";
      const storedSound = localStorage.getItem("pref-sound") === "true";
      setPrefs({ emailAlerts: storedEmail, soundAlerts: storedSound });
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
    mutationFn: async (data: UpdateProfileData) => {
      const res = await apiProfile.updateMe(data);
      return res as UpdateProfileResponse;
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["settingsProfile"] });
      qc.invalidateQueries({ queryKey: ["employerProfile"] });
      qc.invalidateQueries({ queryKey: ["candidateStats"] });
      qc.invalidateQueries({ queryKey: ["myApps"] });
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
          <button onClick={onClose} aria-label="Close" className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all">
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
              {/* Dark Mode toggle */}
              <div className="pt-2">
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

              {/* Session / Logout */}
              <div className="border-t border-border pt-4">
                <h3 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wide text-red-500">Account Session</h3>
                <div className="flex items-center justify-between bg-red-500/5 dark:bg-red-500/10 border border-red-500/10 rounded-2xl p-4">
                  <div>
                    <div className="text-[12px] font-bold text-foreground">Sign Out</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">Sign out of your active session on this device</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white active:scale-95 rounded-full text-[11px] font-bold shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <LogOut size={12} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPACT DARK MODE TOGGLE ──────────────────────────────────────────────
function QuickDarkModeToggle() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isDark = document.documentElement.classList.contains("dark");
    setDarkMode(isDark);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains("dark");
      setDarkMode(isDark);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  const toggleMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem("dashboard-dark-mode", String(next));
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label="Toggle dark appearance"
      className="w-9 h-9 rounded-full flex items-center justify-center bg-transparent border border-[var(--ink-300)] hover:bg-[var(--ink-100)]/30 hover:border-[var(--ink-500)] transition-all cursor-pointer shadow-none select-none"
    >
      {darkMode ? <Sun size={18} className="text-[var(--ink-700)]" /> : <Moon size={18} className="text-[var(--ink-700)]" />}
    </button>
  );
}

// ─── COMMAND PALETTE SEARCH DIALOG ──────────────────────────────────────────
interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  category: "Users" | "Audit Logs" | "Job Listings" | "Administrators";
  route: string;
}

function CommandPaletteModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: users = [] } = useQuery<{ id?: string; _id?: string; email: string; role: string; profile?: { firstName?: string; lastName?: string } }[]>({
    queryKey: ["commandPaletteUsers"],
    queryFn: async () => {
      const res = await apiAdmin.getUsers();
      return (res ?? []) as { id?: string; _id?: string; email: string; role: string; profile?: { firstName?: string; lastName?: string } }[];
    },
    enabled: isOpen,
  });

  const { data: auditLogs = [] } = useQuery<{ id?: string; _id?: string; action: string; userId?: string; detail: string }[]>({
    queryKey: ["commandPaletteAudits"],
    queryFn: async () => {
      const res = await apiAdmin.getAuditLogs();
      return (res ?? []) as { id?: string; _id?: string; action: string; userId?: string; detail: string }[];
    },
    enabled: isOpen,
  });

  const { data: jobs = [] } = useQuery<{ id?: string; _id?: string; title: string; companyName?: string; status: string }[]>({
    queryKey: ["commandPaletteJobs"],
    queryFn: async () => {
      const res = await apiAdmin.getJobs();
      return (res ?? []) as { id?: string; _id?: string; title: string; companyName?: string; status: string }[];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const results: SearchResult[] = [];

  // Index Users
  users.forEach((u) => {
    const name = `${u.profile?.firstName || ""} ${u.profile?.lastName || ""}`.trim() || u.email;
    results.push({
      id: `user-${u.id || u._id}`,
      title: name,
      subtitle: `Role: ${u.role} · ${u.email}`,
      category: u.role === "ADMIN" || u.role === "SUPER_ADMIN" ? "Administrators" : "Users",
      route: `/admin/users?search=${encodeURIComponent(u.email)}`,
    });
  });

  // Index Audit Logs
  auditLogs.forEach((l) => {
    results.push({
      id: `audit-${l.id || l._id}`,
      title: l.action.replace(/_/g, " "),
      subtitle: `Operator: ${l.userId || "System"} · ${l.detail}`,
      category: "Audit Logs",
      route: `/admin/audit?search=${encodeURIComponent(l.action)}`,
    });
  });

  // Index Jobs
  jobs.forEach((j) => {
    results.push({
      id: `job-${j.id || j._id}`,
      title: j.title,
      subtitle: `Company: ${j.companyName || "Employer"} · Status: ${j.status}`,
      category: "Job Listings",
      route: `/employer/listings`,
    });
  });

  const filteredResults = results.filter((r) => {
    const text = `${r.title} ${r.subtitle} ${r.category}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

  const categories = ["Users", "Administrators", "Audit Logs", "Job Listings"] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in pt-16">
      <div className="bg-card w-full max-w-lg rounded-3xl border border-border/85 shadow-2xl overflow-hidden flex flex-col max-h-[70vh] animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-secondary/15">
          <Search size={16} className="text-ink-300" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, audit logs, jobs, or admins..."
            className="w-full bg-transparent border-0 focus:outline-none focus:ring-0 text-foreground text-xs placeholder:text-ink-300"
          />
          <button
            onClick={onClose}
            className="text-[9px] font-bold text-muted-foreground hover:text-foreground bg-secondary px-2 py-1 rounded-lg border border-border cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-thin p-4 flex-1 space-y-4 max-h-[50vh]">
          {filteredResults.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">
              No matching records found.
            </div>
          ) : (
            categories.map((cat) => {
              const catItems = filteredResults.filter((r) => r.category === cat);
              if (catItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-1.5 text-left">
                  <div className="text-[9px] font-bold uppercase tracking-widest text-ink-300 px-2">
                    {cat}
                  </div>
                  <div className="space-y-1">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => {
                          navigate(item.route);
                          onClose();
                        }}
                        className="px-3 py-2 hover:bg-secondary/40 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-medium truncate max-w-sm">
                            {item.subtitle}
                          </div>
                        </div>
                        <ArrowUpRight size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all animate-fade-in" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

