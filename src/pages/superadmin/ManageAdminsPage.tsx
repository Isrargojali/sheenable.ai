// src/pages/superadmin/ManageAdminsPage.tsx
import { useState }    from "react";
import { Plus, X, Search, ShieldCheck, AlertTriangle, ShieldAlert, Lock, ArrowRight } from "lucide-react";
import { cn }          from "@/lib/utils";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { toast } from "sonner";

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

const INITIAL_ADMINS: AdminUser[] = [
  { id: "a1", name: "Platform Admin",    email: "admin@hercareer.pk",    role: "Full Admin",  perms: ["users","jobs","employers","security","reports"], status:"Active",  lastActive:"2 min ago",  grad:"from-rose-500 to-rose-700" },
  { id: "a2", name: "Content Moderator", email: "mod@hercareer.pk",      role: "Moderator",   perms: ["jobs","reports"],                               status:"Active",  lastActive:"1 hour ago", grad:"from-violet-500 to-violet-800" },
  { id: "a3", name: "Support Admin",     email: "support@hercareer.pk",  role: "Support",     perms: ["users"],                                        status:"Away",    lastActive:"3 hours ago",grad:"from-emerald-500 to-emerald-800", awayDuration: 3 },
  { id: "a4", name: "Billing Moderator", email: "billing@hercareer.pk",  role: "Support",     perms: ["reports"],                                     status:"Away",    lastActive:"5 hours ago",grad:"from-amber-500 to-amber-800",   awayDuration: 5 }
];

interface NewAdmin { name: string; email: string; perms: string[]; role: string }

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>(INITIAL_ADMINS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewAdmin>({ name: "", email: "", perms: [], role: "Support" });
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Permission Matrix Modal
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Revoke Confirmation Modal (3-step action)
  const [adminToRevoke, setAdminToRevoke] = useState<AdminUser | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [superAdminPassword, setSuperAdminPassword] = useState("");

  // Undo memory
  const [revocationBackup, setRevocationBackup] = useState<{ admin: AdminUser; index: number } | null>(null);

  const STATUS_COLORS: Record<string,string> = {
    Active: "bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450",
    Away: "bg-amber-50 border-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-450",
    Escalated: "bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450 animate-pulse font-bold"
  };

  const filteredAdmins = admins.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          a.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "All" || a.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role: string) => {
    if (role === "Full Admin") {
      return "bg-purple-600 border-purple-700 text-white font-extrabold shadow-sm hover:bg-purple-700";
    }
    if (role === "Moderator") {
      return "bg-teal-600 border-teal-700 text-white font-bold hover:bg-teal-700";
    }
    return "border border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400 font-semibold bg-transparent";
  };

  const handleOpenRevoke = (admin: AdminUser) => {
    setAdminToRevoke(admin);
    setConfirmText("");
    setSuperAdminPassword("");
  };

  const handleConfirmRevoke = () => {
    if (!adminToRevoke) return;

    // Validate confirmation string
    if (confirmText !== "REVOKE") {
      toast.error("Type confirmation string exactly to proceed");
      return;
    }

    // Validate Super Admin auth if Full Admin
    if (adminToRevoke.role === "Full Admin" && superAdminPassword !== "admin123") {
      toast.error("Super Admin authentication failed: Invalid password");
      return;
    }

    // Perform revocation
    const targetIndex = admins.findIndex(x => x.id === adminToRevoke.id);
    setRevocationBackup({ admin: adminToRevoke, index: targetIndex });
    setAdmins(prev => prev.filter(x => x.id !== adminToRevoke.id));
    setAdminToRevoke(null);

    toast.success(`Access credentials for ${adminToRevoke.name} revoked`, {
      duration: 10000,
      action: {
        label: "Undo (10s)",
        onClick: () => {
          // Restore action
          setAdmins(prev => {
            if (revocationBackup) {
              const copy = [...prev];
              copy.splice(targetIndex, 0, adminToRevoke);
              return copy;
            }
            return [...prev, adminToRevoke];
          });
          toast.success(`Restored admin access for ${adminToRevoke.name}`);
        }
      }
    });
  };

  const handleSavePermissions = () => {
    if (!editingAdmin) return;
    setAdmins(prev => prev.map(a => a.id === editingAdmin.id ? editingAdmin : a));
    toast.success(`Updated role and permissions matrix for ${editingAdmin.name}`);
    setEditingAdmin(null);
  };

  const createAdmin = () => {
    if (!form.name || !form.email) {
      toast.error("Complete name and email fields first");
      return;
    }
    
    const newId = `a_${Date.now()}`;
    const newAdmin: AdminUser = {
      id: newId,
      name: form.name,
      email: form.email,
      role: form.role,
      perms: form.perms,
      status: "Active",
      lastActive: "Just now",
      grad: form.role === "Full Admin" 
        ? "from-rose-500 to-rose-700" 
        : form.role === "Moderator" 
        ? "from-violet-500 to-violet-800" 
        : "from-slate-500 to-slate-800"
    };

    setAdmins(prev => [...prev, newAdmin]);
    setForm({ name: "", email: "", perms: [], role: "Support" });
    setShowForm(false);
    toast.success(`Created admin account for ${newAdmin.name}`);
  };

  return (
    <DashboardShell
      title="Manage Admins"
      subtitle="Control role elevations, credential configurations, and administrative ingress tokens"
      actions={
        <button onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-full hover:bg-purple-700 transition-colors cursor-pointer select-none">
          <Plus size={13} /> Create Admin
        </button>
      }
    >
      {/* Create form */}
      {showForm && (
        <SectionCard title="Create New Admin Account" className="mb-5 border-purple-200 bg-purple-50/30">
          <div className="space-y-4 mt-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#3D3656] uppercase tracking-wide mb-1.5">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin name" className="w-full px-3.5 py-2.5 border border-[#E8E1F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all text-foreground" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#3D3656] uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@hercareer.pk" className="w-full px-3.5 py-2.5 border border-[#E8E1F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all text-foreground" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#3D3656] uppercase tracking-wide mb-1.5">System Role</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3.5 py-2.5 border border-[#E8E1F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all text-foreground">
                  <option value="Full Admin">Full Admin</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Support">Support</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#3D3656] uppercase tracking-wide mb-2">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {ALL_PERMS.map(p => {
                  const sel = form.perms.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => setForm(f => ({ ...f, perms: sel ? f.perms.filter(x => x !== p.id) : [...f.perms, p.id] }))}
                            className={cn("px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer",
                              sel ? "bg-purple-500 border-purple-500 text-white" : "bg-white border-[#E8E1F0] text-[#6B6480] hover:border-purple-300")}>
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={createAdmin} className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-full hover:bg-purple-700 transition-colors cursor-pointer">
                Create Admin Account
              </button>
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-[#E8E1F0] rounded-full text-sm font-semibold text-[#6B6480] hover:bg-[#F7F4F9] transition-colors cursor-pointer">
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
        <div className="flex bg-secondary border border-border p-0.5 rounded-xl text-[10px] font-bold">
          {["All", "Full Admin", "Moderator", "Support"].map(role => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={cn(
                "px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all cursor-pointer",
                roleFilter === role 
                  ? "bg-background text-foreground shadow-sm font-black"
                  : "text-muted-foreground hover:text-foreground"
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
                        className="px-4 py-2 bg-purple-600 text-white rounded-full text-xs font-bold hover:bg-purple-700 cursor-pointer"
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
              <div>
                <label className="block text-[10px] font-bold text-[#3D3656] uppercase tracking-wider mb-2">Change Role</label>
                <select 
                  value={editingAdmin.role}
                  onChange={e => setEditingAdmin(prev => prev ? ({ ...prev, role: e.target.value }) : null)}
                  className="w-full px-3 py-2 border border-border rounded-xl text-xs bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all text-foreground"
                >
                  <option value="Full Admin">Full Admin</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Support">Support</option>
                  <option value="Custom Admin">Custom Admin</option>
                </select>
              </div>

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
                            ? "bg-purple-500/5 border-purple-500/30 hover:bg-purple-500/10"
                            : "bg-secondary/20 border-border/40 hover:border-primary/10"
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
                          className="w-3.5 h-3.5 accent-purple-600 rounded" 
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
                className="px-5 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-full text-[11px] font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePermissions}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-[11px] font-bold transition-all cursor-pointer"
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
                className="px-5 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-full text-[11px] font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={confirmText !== "REVOKE" || (adminToRevoke.role === "Full Admin" && !superAdminPassword)}
                className={cn(
                  "px-5 py-2 rounded-full text-[11px] font-bold text-white transition-all cursor-pointer",
                  (confirmText !== "REVOKE" || (adminToRevoke.role === "Full Admin" && !superAdminPassword))
                    ? "bg-slate-300 border-slate-300 cursor-not-allowed text-slate-500"
                    : "bg-rose-600 hover:bg-rose-700 hover:scale-102 active:scale-98"
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
