// src/components/layout/DashboardShell.tsx
import { ReactNode, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Briefcase, FileText, User, MessageSquare, FilePlus,
  Search, Users, ShieldCheck, ScrollText, ShieldAlert, UserCog, Activity,
  Bell, LogOut, Menu, X, Heart, Settings,
  type LucideIcon,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { useAuthStore, UserRole } from "@/store/authStore";
import { useNotifStore } from "@/store/notifStore";
import { MOCK_USERS } from "@/mock/data";

// ────────────────────────────────────────────────────────────────────────
// NAV CONFIG per role
// ────────────────────────────────────────────────────────────────────────
type NavItem = { to: string; label: string; icon: LucideIcon; badge?: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV: Record<UserRole, NavGroup[]> = {
  CANDIDATE: [
    {
      label: "Workspace",
      items: [
        { to: "/candidate/dashboard",    label: "Dashboard",     icon: LayoutDashboard },
        { to: "/candidate/jobs",         label: "Browse Jobs",   icon: Briefcase },
        { to: "/candidate/applications", label: "Applications",  icon: FileText, badge: "3" },
        { to: "/candidate/messages",     label: "Messages",      icon: MessageSquare, badge: "2" },
      ],
    },
    {
      label: "Profile",
      items: [
        { to: "/candidate/profile", label: "My Profile",  icon: User },
        { to: "/candidate/cv",      label: "CV Builder",  icon: FilePlus },
      ],
    },
  ],
  EMPLOYER: [
    {
      label: "Hiring",
      items: [
        { to: "/employer/dashboard", label: "Dashboard",     icon: LayoutDashboard },
        { to: "/employer/listings",  label: "My Listings",   icon: Briefcase },
        { to: "/employer/post-job",  label: "Post a Job",    icon: FilePlus },
        { to: "/employer/pipeline",  label: "ATS Pipeline",  icon: FileText },
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
        { to: "/admin/overview", label: "Overview",        icon: LayoutDashboard },
        { to: "/admin/users",    label: "Users",           icon: Users },
        { to: "/admin/security", label: "Security Center", icon: ShieldCheck },
        { to: "/admin/audit",    label: "Audit Log",       icon: ScrollText },
      ],
    },
  ],
  SUPER_ADMIN: [
    {
      label: "Administration",
      items: [
        { to: "/admin/overview", label: "Overview",        icon: LayoutDashboard },
        { to: "/admin/users",    label: "Users",           icon: Users },
        { to: "/admin/security", label: "Security Center", icon: ShieldCheck },
        { to: "/admin/audit",    label: "Audit Log",       icon: ScrollText },
      ],
    },
    {
      label: "Super Admin",
      items: [
        { to: "/super-admin/overview",        label: "Super Overview",   icon: ShieldAlert },
        { to: "/super-admin/manage-admins",   label: "Manage Admins",    icon: UserCog },
        { to: "/super-admin/threat-monitor",  label: "Threat Monitor",   icon: Activity },
      ],
    },
  ],
};

const ROLE_LABEL: Record<UserRole, string> = {
  CANDIDATE:   "Candidate",
  EMPLOYER:    "Employer",
  ADMIN:       "Administrator",
  SUPER_ADMIN: "Super Admin",
};

// ────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ────────────────────────────────────────────────────────────────────────
function Sidebar({ onNav }: { onNav?: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role ?? "CANDIDATE";
  const groups = NAV[role];

  // Try to get profile from mock data
  const mockUser = MOCK_USERS.find(u => u.id === user?.id);
  const profile = mockUser?.profile as {
    firstName?: string;
    lastName?: string;
    companyName?: string;
    isAvailable?: boolean;
  } | undefined;
  const displayName = profile?.firstName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.companyName ?? user?.email?.split("@")[0] ?? "User";

  const [available, setAvailable] = useState(profile?.isAvailable ?? true);

  function handleLogout() {
    logout();
    navigate("/auth/login");
  }

  return (
    <aside className="w-[240px] flex-shrink-0 bg-card border-r border-border flex flex-col h-full">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-border flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
             style={{ background: "var(--grad-mauve-rose)" }}>
          <Heart size={16} className="text-white" fill="white" />
        </div>
        <div>
          <div className="font-serif text-lg leading-none text-foreground">SheEnableAI</div>
          <div className="text-[9px] uppercase tracking-[1.5px] text-muted-foreground mt-0.5">
            Women's Platform
          </div>
        </div>
      </div>

      {/* User block */}
      <div className="px-4 py-3.5 border-b border-border">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
               style={{ background: "var(--grad-mauve)" }}>
            {initials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-semibold text-foreground truncate leading-tight">{displayName}</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">{ROLE_LABEL[role]}</div>
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
                  {item.badge && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground min-w-[18px] text-center">
                      {item.badge}
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

// ────────────────────────────────────────────────────────────────────────
// TOPBAR
// ────────────────────────────────────────────────────────────────────────
function Topbar({
  title, subtitle, actions, onMenu,
}: { title: string; subtitle?: string; actions?: ReactNode; onMenu: () => void }) {
  const { unread, markAllRead } = useNotifStore();
  const [showNotif, setShowNotif] = useState(false);
  const notifs = useNotifStore(s => s.notifs);

  return (
    <header className="bg-card border-b border-border px-5 lg:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onMenu} className="lg:hidden p-1.5 rounded-lg hover:bg-secondary">
          <Menu size={18} />
        </button>
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
            className="relative w-9 h-9 rounded-xl flex items-center justify-center bg-secondary hover:bg-ink-100 transition-colors"
          >
            <Bell size={15} className="text-foreground" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowNotif(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-card rounded-2xl border border-border shadow-xl z-40 overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="text-sm font-semibold">Notifications</span>
                  <button onClick={markAllRead} className="text-[11px] text-primary font-semibold hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-thin">
                  {notifs.length === 0 && (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">No notifications</div>
                  )}
                  {notifs.map(n => (
                    <div key={n.id} className={cn(
                      "px-4 py-3 border-b border-border last:border-0 flex gap-2.5",
                      n.unread && "bg-accent/40"
                    )}>
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

        <button className="w-9 h-9 rounded-xl flex items-center justify-center bg-secondary hover:bg-ink-100 transition-colors">
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SHELL
// ────────────────────────────────────────────────────────────────────────
export function DashboardShell({
  title, subtitle, actions, children,
}: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on route change
  if (mobileOpen) {
    setTimeout(() => {}, 0); // noop, kept for clarity
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 bg-foreground/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 lg:hidden animate-fade-in">
            <Sidebar onNav={() => setMobileOpen(false)} />
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 p-1.5 rounded-lg bg-card hover:bg-secondary"
            >
              <X size={16} />
            </button>
          </div>
        </>
      )}

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        <Topbar title={title} subtitle={subtitle} actions={actions} onMenu={() => setMobileOpen(true)} />
        <div className="flex-1 overflow-y-auto px-5 lg:px-6 py-5 scrollbar-thin" key={location.pathname}>
          <div className="animate-fade-in">{children}</div>
        </div>
      </main>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES (re-exported so pages can import from one place)
// ────────────────────────────────────────────────────────────────────────
export function SectionCard({
  title, subtitle, actions, action, children, className, noPad,
}: {
  title?: string; subtitle?: string; actions?: ReactNode; action?: ReactNode;
  children: ReactNode; className?: string; noPad?: boolean;
}) {
  const headerActions = actions ?? action;
  return (
    <section className={cn("bg-card border border-border rounded-2xl overflow-hidden", className)}>
      {(title || headerActions) && (
        <header className="px-4 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            {title    && <h2 className="text-sm font-bold text-foreground">{title}</h2>}
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
