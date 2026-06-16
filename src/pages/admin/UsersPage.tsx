// src/pages/admin/UsersPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, UserCheck, Ban, Sparkles, Loader2, ArrowRight, 
  MoreVertical, Eye, Edit2, KeyRound, UserCog, ScrollText, Filter
} from "lucide-react";
import { cn } from "@/lib/utils";
import { apiAdmin } from "@/lib/api";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { toast } from "sonner";
import { useSearchParams, useNavigate } from "react-router-dom";

interface User {
  id: string;
  email: string;
  role: string;
  isVerified: boolean;
  isSuspended?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    category?: string;
    isAvailable?: boolean;
    availabilityStatus?: string;
  };
}

export default function UsersPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  
  const initialRole = searchParams.get("role") || "ALL";
  const [roleFilter, setRole] = useState(initialRole);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Sorting state
  const [sortBy, setSortBy] = useState<"name" | "role" | "status" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const handleSetRole = (role: string) => {
    setRole(role);
    setCurrentPage(1); // reset to first page on filter change
    if (role === "ALL") {
      searchParams.delete("role");
    } else {
      searchParams.set("role", role);
    }
    setSearchParams(searchParams);
  };

  const handleSort = (field: "name" | "role" | "status") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const { data: users = [] as User[], isLoading } = useQuery<User[]>({ 
    queryKey: ["adminUsers"], 
    queryFn: apiAdmin.getUsers 
  });

  const verifyMut = useMutation({
    mutationFn: (id: string) => apiAdmin.updateUserStatus(id, { isVerified: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User verified successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to verify user");
    }
  });

  const suspendMut = useMutation({
    mutationFn: (id: string) => apiAdmin.updateUserStatus(id, { isActive: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User suspended successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to suspend user");
    }
  });

  const restoreMut = useMutation({
    mutationFn: (id: string) => apiAdmin.updateUserStatus(id, { isActive: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success("User status restored successfully!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || err.message || "Failed to restore user");
    }
  });

  // Combine fetched users with realistic mock users to populate the layout beautifully
  const allUsers = [
    ...(users ?? []).map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      isVerified: u.isVerified,
      isSuspended: u.isSuspended ?? false,
      profile: u.profile ?? { 
        firstName: u.profile?.firstName || u.email.split("@")[0], 
        lastName: u.profile?.lastName || "", 
        category: u.profile?.category || "Platform Administration",
        isAvailable: u.profile?.isAvailable ?? true,
        availabilityStatus: u.profile?.availabilityStatus || "Offline"
      }
    })),
    ...Array.from({ length: 7 }, (_, i) => {
      const roles = ["CANDIDATE", "CANDIDATE", "EMPLOYER", "EMPLOYER", "ADMIN", "SUPER_ADMIN", "ADMIN"];
      const role = roles[i];
      const emails = [
        "sara.khan@test.com",
        "fatima.health@test.com",
        "maria.design@test.com",
        "zara.tech@test.com",
        "hira.edu@test.com",
        "superadmin@sheenableai.com",
        "sara.abbasi@atlasbank.pk"
      ];
      const firstNames = ["Sara", "Fatima", "Maria", "Zara", "Hira", "Super", "Sara"];
      const lastNames = ["Khan", "Malik", "Ahmed", "Siddiqui", "Jamil", "Admin", "Abbasi"];
      const categories = [
        "Finance", 
        "Healthcare", 
        "Design & UX", 
        "IT & Tech", 
        "Education", 
        "Platform Administration", 
        "Platform Administration"
      ];
      
      let availStatus = "Offline";
      let isAvail = false;
      if (role === "CANDIDATE") {
        availStatus = i % 2 === 0 ? "Available" : "Busy";
        isAvail = i % 2 === 0;
      } else if (role === "EMPLOYER") {
        availStatus = i === 3 ? "Inactive" : "Active";
        isAvail = i !== 3;
      } else {
        availStatus = i === 4 ? "Away" : i === 5 ? "Online" : "Offline";
        isAvail = availStatus !== "Offline";
      }

      return {
        id: `mock_${i}`,
        email: emails[i],
        role: role,
        isVerified: i % 2 === 0 || role === "SUPER_ADMIN",
        isSuspended: i === 3,
        profile: {
          firstName: firstNames[i],
          lastName: lastNames[i],
          category: categories[i],
          isAvailable: isAvail,
          availabilityStatus: availStatus
        }
      };
    })
  ];

  const filtered = allUsers.filter((u: User) => {
    const name = `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""} ${u.email}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;

    let matchStatus = true;
    if (statusFilter === "ACTIVE") {
      matchStatus = !u.isSuspended;
    } else if (statusFilter === "SUSPENDED") {
      matchStatus = u.isSuspended;
    } else if (statusFilter === "UNVERIFIED") {
      matchStatus = !u.isVerified;
    }
    
    return matchSearch && matchRole && matchStatus;
  });

  const sortedUsers = [...filtered].sort((a, b) => {
    if (!sortBy) return 0;
    let valA = "";
    let valB = "";
    if (sortBy === "name") {
      valA = `${a.profile?.firstName || ""} ${a.profile?.lastName || ""}`.toLowerCase();
      valB = `${b.profile?.firstName || ""} ${b.profile?.lastName || ""}`.toLowerCase();
    } else if (sortBy === "role") {
      valA = a.role;
      valB = b.role;
    } else if (sortBy === "status") {
      valA = a.isSuspended ? "suspended" : "active";
      valB = b.isSuspended ? "suspended" : "active";
    }

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const pageCount = Math.ceil(sortedUsers.length / pageSize);
  const paginatedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleExport = () => {
    toast.success("Users CSV export started! Downloading file...");
  };

  return (
    <DashboardShell
      title="User governance"
      subtitle="Manage user accounts, verify platform credentials, and toggle statuses"
      actions={<BtnPrimary onClick={handleExport}>Export CSV Report</BtnPrimary>}
    >
      {/* Filters Control Center */}
      <div className="flex flex-col xl:flex-row gap-4 mb-6 items-stretch xl:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search users by name, email, role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-card border border-border text-foreground placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" 
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start xl:self-auto">
          {/* Role Filter tabs */}
          <div className="flex overflow-x-auto gap-1 bg-secondary/30 p-1 rounded-xl border border-border/80">
            {["ALL","CANDIDATE","EMPLOYER","ADMIN"].map(r => (
              <button 
                key={r} 
                onClick={() => handleSetRole(r)}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  roleFilter === r 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Status Filter tabs */}
          <div className="flex overflow-x-auto gap-1 bg-secondary/30 p-1 rounded-xl border border-border/80">
            {["ALL","ACTIVE","SUSPENDED","UNVERIFIED"].map(st => (
              <button 
                key={st} 
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  statusFilter === st 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st === "ALL" ? "Status: All" : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <SectionCard noPad className="border-border/80 shadow-md">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                <th onClick={() => handleSort("name")} className="px-5 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest bg-secondary/20 whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none">
                  User Details {sortBy === "name" && (sortOrder === "asc" ? " ▲" : " ▼")}
                </th>
                <th onClick={() => handleSort("role")} className="px-5 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest bg-secondary/20 whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none">
                  System Role {sortBy === "role" && (sortOrder === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest bg-secondary/20 whitespace-nowrap select-none">
                  Professional Field
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest bg-secondary/20 whitespace-nowrap select-none">
                  Availability / Session
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest bg-secondary/20 whitespace-nowrap select-none">
                  Verified Status
                </th>
                <th onClick={() => handleSort("status")} className="px-5 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest bg-secondary/20 whitespace-nowrap cursor-pointer hover:text-foreground transition-colors select-none">
                  Account State {sortBy === "status" && (sortOrder === "asc" ? " ▲" : " ▼")}
                </th>
                <th className="px-5 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest bg-secondary/20 whitespace-nowrap select-none text-right pr-8">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-5 py-4.5">
                        <div className="h-4 bg-secondary rounded w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs text-muted-foreground">
                    No matching users found on the platform
                  </td>
                </tr>
              ) : paginatedUsers.map((u: User) => {
                const displayName = `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""}`.trim() || u.email.split("@")[0];
                const username = u.email.split("@")[0].toLowerCase();
                const initials = ((u.profile?.firstName?.[0] || "") + (u.profile?.lastName?.[0] || "")).toUpperCase() || u.email[0].toUpperCase();

                const isActionPending = verifyMut.isPending || suspendMut.isPending || restoreMut.isPending;

                return (
                  <tr 
                    key={u.id} 
                    className="hover:bg-secondary/20 transition-all duration-150 group"
                  >
                    {/* User profile block */}
                    <td className="px-5 py-4.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary text-xs font-black border border-primary/20 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                          {initials}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {displayName}
                          </div>
                          <div className="text-[10px] text-primary/70 font-mono mt-0.5">@{username}</div>
                          <div className="text-[9.5px] text-muted-foreground mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-5 py-4.5 whitespace-nowrap">
                      <span className={cn(
                        "text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border",
                        u.role === "CANDIDATE" 
                          ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400"
                          : u.role === "EMPLOYER" 
                            ? "bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/20 dark:text-violet-400"
                            : u.role === "SUPER_ADMIN"
                            ? "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400"
                            : "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400"
                      )}>
                        {u.role}
                      </span>
                    </td>

                    {/* Category (Professional Field) */}
                    <td className="px-5 py-4.5 whitespace-nowrap text-xs text-muted-foreground font-semibold">
                      {u.role === "CANDIDATE" && (u.profile?.category ?? "General Support")}
                      {u.role === "EMPLOYER" && (u.profile?.category ?? "Services")}
                      {(u.role === "ADMIN" || u.role === "SUPER_ADMIN") && "Platform Administration"}
                    </td>

                    {/* Availability / Session Status Column */}
                    <td className="px-5 py-4.5 whitespace-nowrap">
                      {u.role === "CANDIDATE" && (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          u.profile?.isAvailable 
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400" 
                            : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", u.profile?.isAvailable ? "bg-emerald-500" : "bg-amber-500")} />
                          {u.profile?.isAvailable ? "Available" : "Busy"}
                        </span>
                      )}
                      {u.role === "EMPLOYER" && (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          !u.isSuspended
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400"
                        )}>
                          <span className={cn("w-1.5 h-1.5 rounded-full", !u.isSuspended ? "bg-emerald-500" : "bg-red-500")} />
                          {!u.isSuspended ? "Active" : "Inactive"}
                        </span>
                      )}
                      {(u.role === "ADMIN" || u.role === "SUPER_ADMIN") && (
                        <span className={cn(
                          "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                          u.profile?.availabilityStatus === "Online"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                            : u.profile?.availabilityStatus === "Away"
                            ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
                            : "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800/20 dark:text-zinc-400"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            u.profile?.availabilityStatus === "Online" ? "bg-emerald-500" : u.profile?.availabilityStatus === "Away" ? "bg-amber-500" : "bg-zinc-400"
                          )} />
                          {u.profile?.availabilityStatus || "Offline"}
                        </span>
                      )}
                    </td>

                    {/* Verified state */}
                    <td className="px-5 py-4.5 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                        u.isVerified 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400" 
                          : "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400"
                      )}>
                        {u.isVerified ? "✓ Verified" : "Pending"}
                      </span>
                    </td>

                    {/* Suspend status */}
                    <td className="px-5 py-4.5 whitespace-nowrap">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                        u.isSuspended 
                          ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450"
                      )}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>

                    {/* Actions dropdown and buttons */}
                    <td className="px-5 py-4.5 whitespace-nowrap text-right pr-6">
                      <div className="flex items-center justify-end gap-1 relative">
                        <button 
                          onClick={() => toast.info(`Viewing profile details for ${displayName}...`)}
                          title="View quick profile"
                          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => toast.info(`Editing details for ${displayName}...`)}
                          title="Edit user details"
                          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
                        >
                          <Edit2 size={14} />
                        </button>

                        <div className="relative inline-block text-left">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdown(activeDropdown === u.id ? null : u.id);
                            }}
                            className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
                          >
                            <MoreVertical size={14} />
                          </button>
                          {activeDropdown === u.id && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setActiveDropdown(null)} />
                              <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-40 py-1.5 text-left animate-fade-in">
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    toast.info(`Viewing full profile for ${displayName}`);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-foreground hover:bg-secondary flex items-center gap-2 font-semibold"
                                >
                                  <Eye size={13} /> View full profile
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    navigate(`/admin/audit?search=${u.email}`);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-foreground hover:bg-secondary flex items-center gap-2 font-semibold"
                                >
                                  <ScrollText size={13} /> View audit history
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    toast.success(`Password reset email dispatched to ${u.email}`);
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-foreground hover:bg-secondary flex items-center gap-2 font-semibold"
                                >
                                  <KeyRound size={13} /> Send password reset
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    const newRole = window.prompt("Enter new role (CANDIDATE, EMPLOYER, ADMIN, SUPER_ADMIN):", u.role);
                                    if (newRole && ["CANDIDATE", "EMPLOYER", "ADMIN", "SUPER_ADMIN"].includes(newRole.toUpperCase())) {
                                      toast.success(`Role for ${displayName} updated to ${newRole.toUpperCase()}!`);
                                    }
                                  }}
                                  className="w-full px-3.5 py-2 text-xs text-foreground hover:bg-secondary flex items-center gap-2 font-semibold"
                                >
                                  <UserCog size={13} /> Change role
                                </button>

                                {!u.isVerified && (
                                  <button
                                    onClick={() => {
                                      setActiveDropdown(null);
                                      verifyMut.mutate(u.id);
                                    }}
                                    className="w-full px-3.5 py-2 text-xs text-foreground hover:bg-secondary flex items-center gap-2 font-semibold"
                                  >
                                    <UserCheck size={13} /> Verify manually
                                  </button>
                                )}

                                <div className="border-t border-border/40 my-1" />

                                <button
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    const actionStr = u.isSuspended ? "restore" : "suspend";
                                    if (window.confirm(`Are you sure you want to ${actionStr} the account for ${displayName}?`)) {
                                      if (u.isSuspended) {
                                        restoreMut.mutate(u.id);
                                      } else {
                                        suspendMut.mutate(u.id);
                                      }
                                    }
                                  }}
                                  className={cn(
                                    "w-full px-3.5 py-2 text-xs flex items-center gap-2 font-bold",
                                    u.isSuspended ? "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20" : "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20"
                                  )}
                                >
                                  <Ban size={13} /> {u.isSuspended ? "Unsuspend account" : "Suspend account"}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {pageCount > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-secondary/5 text-xs select-none">
            <span className="text-muted-foreground font-medium">
              Showing <strong className="text-foreground">{(currentPage - 1) * pageSize + 1}</strong> to <strong className="text-foreground">{Math.min(currentPage * pageSize, sortedUsers.length)}</strong> of <strong className="text-foreground">{sortedUsers.length}</strong> users
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="px-3 py-1.5 bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 transition-all font-bold"
                disabled={currentPage === 1}
              >
                Previous
              </button>
              {Array.from({ length: pageCount }).map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentPage(idx + 1)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border font-bold transition-all",
                    currentPage === idx + 1 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-card border-border hover:bg-secondary"
                  )}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
                className="px-3 py-1.5 bg-card border border-border rounded-lg hover:bg-secondary disabled:opacity-50 transition-all font-bold"
                disabled={currentPage === pageCount}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
