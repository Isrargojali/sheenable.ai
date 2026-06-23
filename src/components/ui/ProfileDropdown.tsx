import { Link, useNavigate } from "react-router-dom";
import { User, FileText, Settings, LogOut, Briefcase, HelpCircle } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useQuery } from "@tanstack/react-query";
import { apiProfile } from "@/lib/api";
import { cn, initials, getCompanyGradient } from "@/lib/utils";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "./dropdown-menu";

export function ProfileDropdown({
  available,
  onSettingsClick,
}: {
  available: boolean;
  onSettingsClick: () => void;
}) {
  const { user, logout } = useAuthStore();
  const role = user?.role ?? "CANDIDATE";
  const navigate = useNavigate();

  // Query candidate profile for title/role details if CANDIDATE
  const { data: profile } = useQuery({
    queryKey: ["profileCompletion"],
    queryFn: () => apiProfile.getMe(),
    enabled: role === "CANDIDATE",
  });

  const displayName = role === "EMPLOYER"
    ? (user as any)?.companyName || (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split("@")[0] ?? "Employer")
    : (user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email?.split("@")[0] ?? "User");

  const avatarUrl = (role === "EMPLOYER" ? (user as any)?.companyLogoUrl : null) || user?.avatarUrl || null;
  const titleText = role === "CANDIDATE" 
    ? (profile as any)?.title || "Candidate" 
    : role === "EMPLOYER" 
      ? "Employer" 
      : "Administrator";

  function handleLogout() {
    logout();
    navigate("/auth/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-haspopup="true"
          className="relative w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface)] border border-[var(--ink-300)] hover:border-[var(--brand-pink)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:border-[var(--brand-pink)] transition-all cursor-pointer select-none group"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover rounded-full"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
                (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
              }}
            />
          ) : null}
          <div
            className={cn(
              "w-full h-full flex items-center justify-center text-white text-xs font-bold rounded-full bg-gradient-to-br",
              getCompanyGradient(displayName)
            )}
            style={{ display: avatarUrl ? 'none' : 'flex' }}
          >
            {initials(displayName)}
          </div>
          {role === "CANDIDATE" && available && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--accent-green)] border-2 border-[var(--surface)]" />
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-[260px] bg-card border border-[var(--ink-300)] rounded-xl shadow-lg p-1.5 z-50">
        {/* Section A: Mini Profile Header */}
        <div className="px-3 py-2.5 flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[var(--ink-100)]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                  (e.currentTarget.nextElementSibling as HTMLElement | null)?.style.setProperty('display', 'flex');
                }}
              />
            ) : null}
            <div
              className={cn(
                "w-full h-full flex items-center justify-center text-white text-sm font-bold bg-gradient-to-br",
                getCompanyGradient(displayName)
              )}
              style={{ display: avatarUrl ? 'none' : 'flex' }}
            >
              {initials(displayName)}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-foreground truncate leading-snug">{displayName}</h4>
            <p className="text-xs text-muted-foreground truncate leading-normal capitalize">{titleText.toLowerCase()}</p>
            {role === "CANDIDATE" && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={cn("w-1.5 h-1.5 rounded-full", available ? "bg-[var(--accent-green)]" : "bg-[var(--ink-500)]")} />
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {available ? "Available for hire" : "Not available"}
                </span>
              </div>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-[var(--ink-300)]/40 my-1" />

        {/* Section B: Account actions */}
        {role === "CANDIDATE" && (
          <>
            <DropdownMenuItem asChild className="hover:bg-[var(--brand-pink-soft)] focus:bg-[var(--brand-pink-soft)] hover:text-foreground focus:text-foreground rounded-lg py-2 px-3 flex items-center gap-2.5 text-sm cursor-pointer transition-colors">
              <Link to="/candidate/profile">
                <User size={15} className="text-muted-foreground" />
                <span>My Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-[var(--brand-pink-soft)] focus:bg-[var(--brand-pink-soft)] hover:text-foreground focus:text-foreground rounded-lg py-2 px-3 flex items-center gap-2.5 text-sm cursor-pointer transition-colors">
              <Link to="/candidate/profile">
                <User size={15} className="text-muted-foreground" />
                <span>Edit Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-[var(--brand-pink-soft)] focus:bg-[var(--brand-pink-soft)] hover:text-foreground focus:text-foreground rounded-lg py-2 px-3 flex items-center gap-2.5 text-sm cursor-pointer transition-colors">
              <Link to="/candidate/cv">
                <FileText size={15} className="text-muted-foreground" />
                <span>Build Resume</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="hover:bg-[var(--brand-pink-soft)] focus:bg-[var(--brand-pink-soft)] hover:text-foreground focus:text-foreground rounded-lg py-2 px-3 flex items-center gap-2.5 text-sm cursor-pointer transition-colors">
              <Link to="/candidate/applications">
                <Briefcase size={15} className="text-muted-foreground" />
                <span>My Applications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[var(--ink-300)]/40 my-1" />
          </>
        )}

        {/* Section C: Settings */}
        <DropdownMenuItem 
          onClick={onSettingsClick}
          className="hover:bg-[var(--brand-pink-soft)] focus:bg-[var(--brand-pink-soft)] hover:text-foreground focus:text-foreground rounded-lg py-2 px-3 flex items-center gap-2.5 text-sm cursor-pointer transition-colors"
        >
          <Settings size={15} className="text-muted-foreground" />
          <span>Account Settings</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => toast.info("Help & Support feature coming soon!")}
          className="hover:bg-[var(--brand-pink-soft)] focus:bg-[var(--brand-pink-soft)] hover:text-foreground focus:text-foreground rounded-lg py-2 px-3 flex items-center gap-2.5 text-sm cursor-pointer transition-colors"
        >
          <HelpCircle size={15} className="text-muted-foreground" />
          <span>Help & Support</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-[var(--ink-300)]/40 my-1" />

        {/* Section D: Danger zone */}
        <DropdownMenuItem 
          onClick={handleLogout}
          className="hover:bg-red-50 focus:bg-red-50 text-red-500 hover:text-red-600 focus:text-red-600 rounded-lg py-2 px-3 flex items-center gap-2.5 text-sm cursor-pointer transition-colors"
        >
          <LogOut size={15} />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
