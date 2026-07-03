import { useState }    from "react";
import { Plus, X, Search, ShieldCheck, AlertTriangle, ShieldAlert, Lock, ArrowRight } from "lucide-react";
import { cn }          from "@/lib/utils";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiAdmin } from "@/lib/api";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  perms: string[];
  status: string;
  lastActive: string;
  grad: string;
  awayDuration?: number;
  isVerified?: boolean;
}

const ALL_PERMS = [
  { id: "users", name: "Users", desc: "Manage candidate/employer profiles" },
  { id: "jobs", name: "Jobs", desc: "Approve, reject or delete job listings" },
  { id: "employers", name: "Employers", desc: "Approve company vetting details" },
  { id: "security", name: "Security", desc: "Manage firewalls and lock down routes" },
  { id: "reports", name: "Reports", desc: "Access analytical and revenue logs" },
  { id: "audit", name: "Audit", desc: "View administrative audit log ledger" },
  { id: "ai-config", name: "AI Config", desc: "Modify matching weights and engines" },
  { id: "system", name: "System", desc: "Reboot servers and email relays" }
];

interface NewAdmin { name: string; email: string; perms: string[]; role: string }

export default function ManageAdminsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewAdmin>({ name: "", email: "", perms: [], role: "Full Admin" });
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Permission Matrix Modal
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Revoke Confirmation Modal (3-step action)
  const [adminToRevoke, setAdminToRevoke] = useState<AdminUser | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [superAdminPassword, setSuperAdminPassword] = useState("");

  const { data: rawUsers = [], isLoading } = useQuery<any[]>({
    queryKey: ["adminUsersList"],
    queryFn: async () => {
      const response = await apiAdmin.getUsers({ limit: 100 });
      // Filter only ADMIN and SUPER_ADMIN users
      const usersArray = Array.isArray(response) ? response : (response as any)?.data || [];
      return usersArray.filter((u: any) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (payload: { id: string; role: string }) => {
      return apiAdmin.updateUserRole(payload.id, payload.role);
    },
    onSuccess: () => {
      toast.success("Admin role updated successfully ✓");
      qc.invalidateQueries({ queryKey: ["adminUsersList"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update role");
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (payload: { id: string; isActive: boolean }) => {
      return apiAdmin.updateUserStatus(payload.id, { isActive: payload.isActive });
    },
    onSuccess: () => {
      toast.success("Admin status updated successfully ✓");
      qc.invalidateQueries({ queryKey: ["adminUsersList"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to update status");
    }
  });

  const deleteAdminMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiAdmin.deleteUser(id);
    },
    onSuccess: () => {
      toast.success("Admin access credentials revoked successfully ✓");
      qc.invalidateQueries({ queryKey: ["adminUsersList"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to revoke access");
    }
  });

  const STATUS_COLORS: Record<string,string> = {
    Active: "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450",
    Away: "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450",
    Suspended: "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 font-bold"
  };

  const admins: AdminUser[] = rawUsers.map((u: any) => {
    const isOnline = u.profile?.availabilityStatus === 'Online';
    const isAway = u.profile?.availabilityStatus === 'Away';
    
    return {
      id: u._id || u.id,
      name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email.split('@')[0],
      email: u.email,
      role: u.role === 'SUPER_ADMIN' ? 'Full Admin' : 'Moderator',
      perms: u.role === 'SUPER_ADMIN' ? ["users","jobs","employers","security","reports","audit","system"] : ["users","jobs","reports"],
      status: !u.isActive ? "Suspended" : isOnline ? "Active" : isAway ? "Away" : "Active",
      lastActive: u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never',
      grad: u.role === 'SUPER_ADMIN' ? "from-rose-500 to-rose-700" : "from-violet-500 to-violet-800",
      isVerified: u.isVerified
    };
  });

  const filteredAdmins = admins.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || 
                        (roleFilter === "Full Admin" && a.role === "Full Admin") ||
                        (roleFilter === "Moderator" && a.role === "Moderator") ||
                        (roleFilter === "Support" && a.role === "Support");
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: string) => {
    if (role === "Full Admin") {
      return "bg-[var(--ink-900)] text-white text-[11px] font-semibold px-2 py-[3px] rounded-[var(--radius-pill)] uppercase tracking-wider";
    }
    return "bg-[var(--ink-100)] text-[var(--ink-700)] text-[11px] font-semibold px-2 py-[3px] rounded-[var(--radius-pill)] uppercase tracking-wider border-0";
  };

  const handleOpenRevoke = (admin: AdminUser) => {
    setAdminToRevoke(admin);
    setConfirmText("");
    setSuperAdminPassword("");
  };

  const handleConfirmRevoke = () => {
    if (!adminToRevoke) return;

    if (confirmText !== "REVOKE") {
      toast.error("Type confirmation string exactly to proceed");
      return;
    }

    if (adminToRevoke.role === "Full Admin" && superAdminPassword !== "admin123") {
      toast.error("Super Admin authentication failed: Invalid password");
      return;
    }

    deleteAdminMutation.mutate(adminToRevoke.id);
    setAdminToRevoke(null);
  };

  const handleSavePermissions = () => {
    if (!editingAdmin) return;
    const backendRole = editingAdmin.role === "Full Admin" ? "SUPER_ADMIN" : "ADMIN";
    updateRoleMutation.mutate({ id: editingAdmin.id, role: backendRole });
    setEditingAdmin(null);
  };

  const createAdminMutation = useMutation({
    mutationFn: async (payload: { name: string; email: string; role: string }) => {
      return apiAdmin.createAdminUser(payload);
    },
    onSuccess: () => {
      toast.success("Admin account created successfully ✓");
      setShowForm(false);
      setForm({ name: "", email: "", perms: [], role: "Full Admin" });
      qc.invalidateQueries({ queryKey: ["adminUsersList"] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to create admin");
    }
  });

  const createAdmin = () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and Email are required");
      return;
    }
    createAdminMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role
    });
  };

  return (
    <DashboardShell
      title="Manage Admins"
      subtitle="Control role elevations, credential configurations, and administrative ingress tokens"
      actions={
        <button 
          onClick={() => setShowForm(v => !v)}
          className="bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] border-0 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center gap-1.5 cursor-pointer transition-all duration-200 select-none shadow-none"
        >
          <Plus size={14} strokeWidth={1.75} className="text-white" />
          <span>+ Create admin</span>
        </button>
      }
    >
      {/* Create form */}
      {showForm && (
        <SectionCard title="Create New Admin Account" className="mb-5 border border-[var(--ink-200)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
          <div className="space-y-4 mt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-500)] uppercase tracking-wide mb-1.5">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin name" className="w-full px-3.5 py-2.5 border border-[var(--ink-200)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(230,0,126,0.15)] focus:border-[var(--brand-pink)] transition-all text-foreground" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-500)] uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@hercareer.pk" className="w-full px-3.5 py-2.5 border border-[var(--ink-200)] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(230,0,126,0.15)] focus:border-[var(--brand-pink)] transition-all text-foreground" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--ink-500)] uppercase tracking-wide mb-1.5">System Role</label>
                <Select value={form.role} onValueChange={val => setForm(f => ({ ...f, role: val }))}>
                  <SelectTrigger className="w-full px-3.5 py-2.5 border border-[var(--ink-200)] rounded-xl text-sm bg-white focus:ring-2 focus:ring-[rgba(230,0,126,0.15)] focus:border-[var(--brand-pink)] transition-all text-foreground cursor-pointer h-[42px]">
                    <SelectValue placeholder="Select System Role" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border rounded-xl shadow-xl min-w-[200px] p-1">
                    <SelectItem value="Full Admin" className="text-xs font-semibold text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg cursor-pointer py-2 pl-8 pr-2">Full Admin</SelectItem>
                    <SelectItem value="Moderator" className="text-xs font-semibold text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg cursor-pointer py-2 pl-8 pr-2">Moderator</SelectItem>
                    <SelectItem value="Support" className="text-xs font-semibold text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg cursor-pointer py-2 pl-8 pr-2">Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-[var(--ink-500)] uppercase tracking-wide mb-2">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {ALL_PERMS.map(p => {
                  const sel = form.perms.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => setForm(f => ({ ...f, perms: sel ? f.perms.filter(x => x !== p.id) : [...f.perms, p.id] }))}
                            className={cn("px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer",
                              sel ? "bg-[var(--brand-pink)] border-[var(--brand-pink)] text-white" : "bg-white border-[var(--ink-200)] text-[var(--ink-700)] hover:border-[var(--ink-300)]")}>
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={createAdmin}
                className="bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] border-0 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 select-none shadow-none"
              >
                Create Admin Account
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="bg-[var(--surface)] hover:bg-[var(--ink-100)] border border-[var(--ink-200)] text-[var(--ink-900)] text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 select-none shadow-none"
              >
                Cancel
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Search Bar and Segmented Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6 items-stretch md:items-center justify-between select-none">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300" size={14} />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search admins by name or email..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl text-xs bg-card border border-border text-foreground placeholder:text-ink-300 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all" 
          />
        </div>

        {/* Role Filters */}
        <div className="flex overflow-x-auto gap-1 bg-[var(--ink-100)] p-1 rounded-full h-10 items-center border-0">
          {["All", "Full Admin", "Moderator", "Support"].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={cn(
                "h-8 px-4 rounded-full text-[12px] font-semibold uppercase transition-all border-0 cursor-pointer flex items-center justify-center select-none",
                roleFilter === role 
                  ? "bg-[var(--brand-pink)] text-white shadow-none" 
                  : "bg-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]"
              )}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Admin list */}
      <SectionCard noPad className="border-border/80 shadow-md">
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E8E1F0]">
                {["Admin","Role","Permissions","Last Active","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-4 text-[10px] font-bold text-[#A89EC0] uppercase tracking-[.6px] bg-[#F7F4F9] dark:bg-secondary/40 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
                      <ShieldAlert className="text-muted-foreground animate-pulse" size={32} />
                      <div className="text-sm font-bold text-foreground">No admins created yet</div>
                      <p className="text-xs text-muted-foreground">Start by creating your first administrative account to coordinate platform activities.</p>
                      <button 
                        onClick={() => setShowForm(true)}
                        className="bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] border-0 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center gap-1.5 cursor-pointer transition-all duration-200 select-none shadow-none"
                      >
                        + Create Admin
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                <>
                  {filteredAdmins.map((a, i) => {
                    const isEscalated = a.status === "Away" && a.awayDuration && a.awayDuration >= 4;
                    const durationText = a.awayDuration ? ` · ${a.awayDuration}h` : "";

                    return (
                      <tr key={a.id} className={cn("border-b border-[#F3EFF8] dark:border-border/40 hover:bg-[#FAF8FC] dark:hover:bg-secondary/10 transition-colors", i===filteredAdmins.length-1&&"border-b-0")}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br flex-shrink-0", a.grad)}>
                              {a.name.slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#0F0B1A] dark:text-foreground">{a.name}</div>
                              <div className="text-[10px] text-[#A89EC0] dark:text-muted-foreground">{a.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={cn("text-[9px] font-extrabold px-2.5 py-0.8 rounded-full uppercase tracking-wider border", getRoleBadgeClass(a.role))}>
                            {a.role} ({a.perms.length} {a.perms.length === 1 ? "perm" : "perms"})
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {a.perms.map(p => <span key={p} className="text-[9px] font-semibold text-[#6B6480] dark:text-slate-350 bg-[#F7F4F9] dark:bg-secondary border border-border/40 px-1.5 py-0.5 rounded-full">{p}</span>)}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-xs text-[#A89EC0] font-mono">{a.lastActive}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[9px] font-bold px-2 py-0.8 rounded border uppercase", isEscalated ? STATUS_COLORS.Escalated : (STATUS_COLORS[a.status] ?? STATUS_COLORS.Away))}>
                              {a.status}{durationText}
                            </span>
                            {isEscalated && (
                              <button 
                                onClick={() => toast.success(`Alert paged to ${a.name} cover response SLA`)}
                                className="text-[9px] font-bold text-rose-500 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                              >
                                Notify &rarr;
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => setEditingAdmin(a)}
                              className="px-3 py-1.5 border border-[#E8E1F0] dark:border-border/60 rounded-full text-[10px] font-semibold text-[#6B6480] dark:text-muted-foreground hover:bg-[#F7F4F9] dark:hover:bg-secondary transition-colors cursor-pointer"
                            >
                              Edit permissions
                            </button>
                            <button 
                              onClick={() => {
                                const newActive = a.status === "Suspended";
                                updateStatusMutation.mutate({ id: a.id, isActive: newActive });
                              }}
                              className={cn(
                                "px-3 py-1.5 border rounded-full text-[10px] font-semibold transition-colors cursor-pointer",
                                a.status === "Suspended"
                                  ? "border-emerald-250 text-emerald-500 bg-emerald-50/50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30"
                                  : "border-amber-250 text-amber-500 bg-amber-50/50 hover:bg-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
                              )}
                            >
                              {a.status === "Suspended" ? "Activate" : "Suspend"}
                            </button>
                            <button onClick={() => handleOpenRevoke(a)}
                                    className="flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-full text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30 transition-colors cursor-pointer">
                              <X size={10} /> Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Create admin ghost row shortcut */}
                  <tr 
                    onClick={() => {
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="border-t border-[#F3EFF8] dark:border-border/40 hover:bg-[#FAF8FC]/50 dark:hover:bg-secondary/5 transition-colors cursor-pointer group"
                  >
                    <td colSpan={6} className="px-5 py-4 text-center">
                      <span className="text-xs font-semibold text-muted-foreground group-hover:text-primary transition-colors flex items-center justify-center gap-1.5">
                        <Plus size={13} className="text-primary animate-pulse" />
                        Create another admin account shortcut...
                      </span>
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Permissions Matrix Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-xl rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-secondary/10">
              <div>
                <h3 className="font-serif text-base text-foreground font-bold flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-primary" />
                  Edit Admin Permissions & Role
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Modify access tokens and client scope of {editingAdmin.name}</p>
              </div>
              <button 
                onClick={() => setEditingAdmin(null)} 
                className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-6 overflow-y-auto scrollbar-thin flex-1 space-y-4">
              <div className="text-xs text-muted-foreground">
                Account ID: <span className="font-mono text-[11px] font-bold text-foreground bg-secondary px-2 py-0.5 rounded">{editingAdmin.id}</span>
                <span className="mx-2">·</span>
                Email: <span className="font-semibold text-foreground">{editingAdmin.email}</span>
              </div>

              {/* System Role Selector */}
              {editingAdmin && (
                <div>
                  <label className="block text-[10px] font-bold text-[#3D3656] uppercase tracking-wider mb-2">Change Role</label>
                  <Select value={editingAdmin.role} onValueChange={val => setEditingAdmin(prev => prev ? ({ ...prev, role: val }) : null)}>
                    <SelectTrigger className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-card focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all text-foreground cursor-pointer">
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border rounded-xl shadow-xl min-w-[200px] p-1">
                      <SelectItem value="Full Admin" className="text-xs font-semibold text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg cursor-pointer py-2 pl-8 pr-2">Full Admin</SelectItem>
                      <SelectItem value="Moderator" className="text-xs font-semibold text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg cursor-pointer py-2 pl-8 pr-2">Moderator</SelectItem>
                      <SelectItem value="Support" className="text-xs font-semibold text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg cursor-pointer py-2 pl-8 pr-2">Support</SelectItem>
                      <SelectItem value="Custom Admin" className="text-xs font-semibold text-foreground focus:bg-accent focus:text-accent-foreground rounded-lg cursor-pointer py-2 pl-8 pr-2">Custom Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Permissions Matrix list */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-[#3D3656] uppercase tracking-wider">Permissions Matrix</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_PERMS.map(p => {
                    const hasPerm = editingAdmin.perms.includes(p.id);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setEditingAdmin(prev => {
                            if (!prev) return null;
                            const sel = prev.perms.includes(p.id);
                            return {
                              ...prev,
                              perms: sel ? prev.perms.filter(x => x !== p.id) : [...prev.perms, p.id]
                            };
                          });
                        }}
                        className={cn(
                          "p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none",
                          hasPerm 
                            ? "bg-[var(--brand-pink)]/5 border-[var(--brand-pink)]/30 hover:bg-[var(--brand-pink)]/10"
                            : "bg-secondary/20 border-border/40 hover:border-[var(--brand-pink)]/10"
                        )}
                      >
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-foreground block">{p.name}</span>
                          <span className="text-[9px] text-muted-foreground block truncate">{p.desc}</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={hasPerm} 
                          onChange={() => {}} // toggled by parent div click
                          className="w-3.5 h-3.5 accent-[var(--brand-pink)] rounded" 
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <footer className="px-6 py-4 bg-secondary/10 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="bg-[var(--surface)] hover:bg-[var(--ink-100)] border border-[var(--ink-200)] text-[var(--ink-900)] text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)] text-white text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] border-0 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-none"
              >
                Save changes
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Revoke Confirmation Dialog (3-step action) */}
      {adminToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/45 backdrop-blur-sm animate-fade-in">
          <div className="bg-card w-full max-w-md rounded-3xl border border-border/80 shadow-2xl overflow-hidden flex flex-col">
            <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-rose-500/10">
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-rose-500 animate-bounce" />
                <h3 className="font-serif text-base text-foreground font-bold">
                  Revoke Admin Access
                </h3>
              </div>
              <button 
                onClick={() => setAdminToRevoke(null)} 
                className="p-1.5 hover:bg-secondary rounded-full text-ink-400 hover:text-foreground transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </header>

            <div className="p-6 space-y-4 text-left">
              <div className="text-xs text-muted-foreground leading-relaxed">
                Revoking access for <strong className="text-rose-600">{adminToRevoke.name}</strong> ({adminToRevoke.email}) is a highly destructive administrative action. This user will be immediately logged out and all ingress access keys invalidated.
              </div>

              {/* Full Admin Password Authentication */}
              {adminToRevoke.role === "Full Admin" && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                    <Lock size={12} /> Super Admin Password Required
                  </div>
                  <input 
                    type="password"
                    value={superAdminPassword}
                    onChange={e => setSuperAdminPassword(e.target.value)}
                    placeholder="Enter super admin password (hint: 'admin123')"
                    className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-400 transition-all text-foreground"
                  />
                </div>
              )}

              {/* Typing confirmation */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-[#3D3656] uppercase tracking-wide">
                  Type <strong className="text-rose-600 font-extrabold select-none">REVOKE</strong> to confirm:
                </label>
                <input 
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="Type REVOKE"
                  className="w-full px-3 py-2 border border-rose-300 focus:border-rose-500 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/10 transition-all text-foreground"
                />
              </div>
            </div>

            <footer className="px-6 py-4 bg-secondary/10 border-t border-border flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setAdminToRevoke(null)}
                className="bg-[var(--surface)] hover:bg-[var(--ink-100)] border border-[var(--ink-200)] text-[var(--ink-900)] text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none shadow-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={confirmText !== "REVOKE" || (adminToRevoke.role === "Full Admin" && !superAdminPassword)}
                className={cn(
                  "text-[13px] font-medium h-9 px-[14px] rounded-[var(--radius-input)] border-0 focus:outline-none focus:ring-2 focus:ring-[var(--brand-pink)] focus:ring-offset-2 flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200 select-none shadow-none text-white",
                  (confirmText !== "REVOKE" || (adminToRevoke.role === "Full Admin" && !superAdminPassword))
                    ? "bg-slate-300 opacity-50 cursor-not-allowed"
                    : "bg-[var(--brand-pink)] hover:bg-[var(--brand-pink-hover)]"
                )}
              >
                Confirm Revocation
              </button>
            </footer>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
