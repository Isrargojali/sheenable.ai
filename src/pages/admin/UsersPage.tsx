// src/pages/admin/UsersPage.tsx
import { useState }     from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, UserCheck, Ban } from "lucide-react";
import { cn }           from "@/lib/utils";
import { apiAdmin }     from "@/lib/api";
import { DashboardShell, SectionCard, BtnPrimary } from "@/components/layout/DashboardShell";

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

function relTime(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  return d === 0 ? "Today" : `${d}d ago`;
}

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRole] = useState("ALL");

  const { data: users = [] as User[], isLoading } = useQuery<User[]>({ queryKey: ["adminUsers"], queryFn: apiAdmin.getUsers });

  const verifyMut  = useMutation({ mutationFn: (id: string) => apiAdmin.verifyUser(id),  onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }) });
  const suspendMut = useMutation({ mutationFn: (id: string) => apiAdmin.suspendUser(id), onSuccess: () => qc.invalidateQueries({ queryKey: ["adminUsers"] }) });

  // Extend mock data for display
  const allUsers = [...(users ?? []), ...Array.from({ length: 5 }, (_, i) => ({
    id: `mock_${i}`, email: [`sara@test.com`,`maria@test.com`,`fatima@test.com`,`zara@test.com`,`hira@test.com`][i],
    role: i < 2 ? "CANDIDATE" : "EMPLOYER", isVerified: i % 2 === 0, isSuspended: i === 3,
    profile: { firstName: [`Sara`,`Maria`,`Fatima`,`Zara`,`Hira`][i], lastName: `Ahmed`, category: [`Finance`,`Design & UX`,`Healthcare`,`IT & Tech`,`Education`][i], isAvailable: i % 2 === 0 },
  }))];

  const filtered = allUsers.filter((u: User) => {
    const name = `${u.profile?.firstName ?? ""} ${u.profile?.lastName ?? ""} ${u.email}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchRole   = roleFilter === "ALL" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <DashboardShell
      title="Users"
      subtitle={`${allUsers.length} registered users`}
      actions={<BtnPrimary>Export CSV</BtnPrimary>}
    >
      {/* Filters */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A89EC0]" size={13} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users…"
                 className="w-full pl-9 pr-4 py-2.5 rounded-full text-xs bg-white border border-[#E8E1F0] text-[#0F0B1A] placeholder:text-[#A89EC0] focus:outline-none focus:border-rose-400 transition-all" />
        </div>
        <div className="flex gap-2">
          {["ALL","CANDIDATE","EMPLOYER","ADMIN"].map(r => (
            <button key={r} onClick={() => setRole(r)}
                    className={cn("px-3 py-2 rounded-full text-[11px] font-bold border transition-all",
                      roleFilter === r ? "bg-rose-500 border-rose-500 text-white" : "bg-white border-[#E8E1F0] text-[#6B6480] hover:border-[#D4CBE8]")}>
              {r}
            </button>
          ))}
        </div>
      </div>

      <SectionCard noPad>
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E8E1F0]">
                {["User","Role","Category","Availability","Verified","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-[#A89EC0] uppercase tracking-[.6px] bg-[#F7F4F9] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#F3EFF8]">
                    {Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-5 py-3.5"><div className="h-4 bg-[#F3EFF8] rounded animate-pulse w-20" /></td>)}
                  </tr>
                ))
              ) : filtered.map((u: User, i: number) => (
                <tr key={u.id} className={cn("border-b border-[#F3EFF8] hover:bg-[#FAF8FC] transition-colors", i === filtered.length - 1 && "border-b-0")}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {(u.profile?.firstName?.[0] ?? u.email[0]).toUpperCase()}{(u.profile?.lastName?.[0] ?? "").toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0F0B1A]">{u.profile?.firstName} {u.profile?.lastName}</div>
                        <div className="text-[10px] text-[#A89EC0]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                      u.role === "CANDIDATE" ? "bg-rose-50 text-rose-500"
                      : u.role === "EMPLOYER" ? "bg-violet-50 text-violet-600"
                      : "bg-[#F7F4F9] text-[#6B6480]")}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-[#6B6480]">{u.profile?.category ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                      u.profile?.isAvailable ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                      {u.profile?.isAvailable ? "● Available" : "● Busy"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                      u.isVerified ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600")}>
                      {u.isVerified ? "✓ Verified" : "Pending"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                      u.isSuspended ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600")}>
                      {u.isSuspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      {!u.isVerified && (
                        <button onClick={() => verifyMut.mutate(u.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border border-emerald-200 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors">
                          <UserCheck size={10} /> Verify
                        </button>
                      )}
                      {!u.isSuspended ? (
                        <button onClick={() => suspendMut.mutate(u.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                          <Ban size={10} /> Suspend
                        </button>
                      ) : (
                        <button className="px-2.5 py-1.5 rounded-full text-[10px] font-semibold border border-[#E8E1F0] text-[#6B6480] hover:bg-[#F7F4F9] transition-colors">
                          Restore
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </DashboardShell>
  );
}
