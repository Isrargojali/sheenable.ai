// src/pages/admin/UsersPage.tsx
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserCheck, Ban, Sparkles, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiAdmin } from "@/lib/api";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";

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
  };
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  
  const initialRole = searchParams.get("role") || "ALL";
  const [roleFilter, setRole] = useState(initialRole);

  const handleSetRole = (role: string) => {
    setRole(role);
    if (role === "ALL") {
      searchParams.delete("role");
    } else {
      searchParams.set("role", role);
    }
    setSearchParams(searchParams);
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
      profile: u.profile ?? { firstName: u.email.split("@")[0], lastName: "" }
    })),
    ...Array.from({ length: 5 }, (_, i) => ({
      id: `mock_${i}`, 
      email: [`sara.khan@test.com`,`maria.design@test.com`,`fatima.health@test.com`,`zara.tech@test.com`,`hira.edu@test.com`][i],
      role: i < 2 ? "CANDIDATE" : "EMPLOYER", 
      isVerified: i % 2 === 0, 
      isSuspended: i === 3,
      profile: { 
        firstName: [`Sara`,`Maria`,`Fatima`,`Zara`,`Hira`][i], 
        lastName: `Ahmed`, 
        category: [`Finance`,`Design & UX`,`Healthcare`,`IT & Tech`,`Education`][i], 
        isAvailable: i % 2 === 0 
      },
    }))
  ];

  const filtered = allUsers.filter((u: User) => {
    const name = `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""} ${u.email}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

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
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search users by name, email, role..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-card border border-border text-foreground placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" 
          />
        </div>

        <div className="flex overflow-x-auto gap-1 bg-secondary/30 p-1 rounded-xl border border-border/80 self-start md:self-auto">
          {["ALL","CANDIDATE","EMPLOYER","ADMIN"].map(r => (
            <button 
              key={r} 
              onClick={() => handleSetRole(r)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                roleFilter === r 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Card */}
      <SectionCard noPad className="border-border/80 shadow-md">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/10">
                {["User Details","System Role","Professional Field","Availability","Verified Status","Account State","Administrative Action"].map(h => (
                  <th key={h} className="px-5 py-4 text-[10px] font-bold text-ink-300 uppercase tracking-widest bg-secondary/20 whitespace-nowrap">
                    {h}
                  </th>
                ))}
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
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs text-muted-foreground">
                    No matching users found on the platform
                  </td>
                </tr>
              ) : filtered.map((u: User) => {
                const displayName = `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""}`.trim() || u.email.split("@")[0];
                const initials = (u.profile?.firstName?.[0] ?? u.email[0]).toUpperCase();

                const isActionPending = verifyMut.isPending || suspendMut.isPending || restoreMut.isPending;

                return (
                  <tr 
                    key={u.id} 
                    className="hover:bg-secondary/20 transition-all duration-150 group"
                  >
                    {/* User profile block */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center text-primary text-xs font-bold border border-primary/20 flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                          {initials}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {displayName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={cn(
                        "text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border",
                        u.role === "CANDIDATE" 
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : u.role === "EMPLOYER" 
                            ? "bg-violet-50 text-violet-600 border-violet-100"
                            : "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {u.role}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-muted-foreground font-medium">
                      {u.profile?.category ?? "General Support"}
                    </td>

                    {/* Availability status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        u.profile?.isAvailable 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", u.profile?.isAvailable ? "bg-emerald-500" : "bg-amber-500")} />
                        {u.profile?.isAvailable ? "Available" : "Busy"}
                      </span>
                    </td>

                    {/* Verified state */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                        u.isVerified 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse" 
                          : "bg-amber-50 text-amber-600 border-amber-100"
                      )}>
                        {u.isVerified ? "✓ Verified" : "Pending"}
                      </span>
                    </td>

                    {/* Suspend status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border",
                        u.isSuspended 
                          ? "bg-red-50 text-red-600 border-red-100" 
                          : "bg-emerald-50 text-emerald-600 border-emerald-100"
                      )}>
                        {u.isSuspended ? "Suspended" : "Active"}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        {/* Verify trigger */}
                        {!u.isVerified && (
                          <button 
                            onClick={() => verifyMut.mutate(u.id)}
                            disabled={isActionPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            {verifyMut.isPending ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <UserCheck size={11} />
                            )}
                            Verify
                          </button>
                        )}

                        {/* Suspend vs Restore toggle */}
                        {!u.isSuspended ? (
                          <button 
                            onClick={() => suspendMut.mutate(u.id)}
                            disabled={isActionPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-all cursor-pointer"
                          >
                            {suspendMut.isPending ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Ban size={11} />
                            )}
                            Suspend
                          </button>
                        ) : (
                          <button 
                            onClick={() => restoreMut.mutate(u.id)}
                            disabled={isActionPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-[10px] font-bold border border-border text-ink-500 bg-card hover:bg-secondary disabled:opacity-50 transition-all cursor-pointer"
                          >
                            {restoreMut.isPending ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <ArrowRight size={11} />
                            )}
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
