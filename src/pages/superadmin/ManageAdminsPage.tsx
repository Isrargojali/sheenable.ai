// src/pages/superadmin/ManageAdminsPage.tsx
import { useState }    from "react";
import { Plus, X }     from "lucide-react";
import { cn }          from "@/lib/utils";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";

const ADMINS = [
  { id: "a1", name: "Platform Admin",    email: "admin@hercareer.pk",    role: "Full Admin",  perms: ["users","jobs","employers","security","reports"], status:"Active",  lastActive:"2 min ago",  grad:"from-rose-500 to-rose-700" },
  { id: "a2", name: "Content Moderator", email: "mod@hercareer.pk",      role: "Moderator",   perms: ["jobs","reports"],                               status:"Active",  lastActive:"1 hour ago", grad:"from-violet-500 to-violet-800" },
  { id: "a3", name: "Support Admin",     email: "support@hercareer.pk",  role: "Support",     perms: ["users (read only)"],                            status:"Away",    lastActive:"3 hours ago",grad:"from-emerald-500 to-emerald-800" },
];

const ALL_PERMS = ["users","jobs","employers","security","reports","audit","ai-config","system"];

interface NewAdmin { name: string; email: string; perms: string[] }

export default function ManageAdminsPage() {
  const [admins, setAdmins] = useState(ADMINS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewAdmin>({ name: "", email: "", perms: [] });

  function revokeAdmin(id: string) {
    setAdmins(a => a.filter(x => x.id !== id));
  }

  function createAdmin() {
    if (!form.name || !form.email) return;
    setAdmins(a => [...a, {
      id: `a_${Date.now()}`, name: form.name, email: form.email,
      role: "Custom Admin", perms: form.perms, status: "Active",
      lastActive: "Just now", grad: "from-slate-500 to-slate-800",
    }]);
    setForm({ name: "", email: "", perms: [] });
    setShowForm(false);
  }

  const STATUS_COLORS: Record<string,string> = {
    Active:"bg-emerald-50 text-emerald-600", Away:"bg-amber-50 text-amber-600",
  };

  return (
    <DashboardShell
      title="Manage Admins"
      subtitle="Control who has administrative access to the platform"
      actions={
        <button onClick={() => setShowForm(v => !v)}
                className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-full hover:bg-purple-700 transition-colors">
          <Plus size={13} /> Create Admin
        </button>
      }
    >
      {/* Create form */}
      {showForm && (
        <SectionCard title="Create New Admin Account" className="mb-5 border-purple-200 bg-purple-50/30">
          <div className="space-y-4 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#3D3656] uppercase tracking-wide mb-1.5">Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Admin name" className="w-full px-3.5 py-2.5 border border-[#E8E1F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-[#3D3656] uppercase tracking-wide mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="admin@hercareer.pk" className="w-full px-3.5 py-2.5 border border-[#E8E1F0] rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/10 focus:border-purple-400 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-[#3D3656] uppercase tracking-wide mb-2">Permissions</label>
              <div className="flex flex-wrap gap-2">
                {ALL_PERMS.map(p => {
                  const sel = form.perms.includes(p);
                  return (
                    <button key={p} onClick={() => setForm(f => ({ ...f, perms: sel ? f.perms.filter(x => x !== p) : [...f.perms, p] }))}
                            className={cn("px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all",
                              sel ? "bg-purple-500 border-purple-500 text-white" : "bg-white border-[#E8E1F0] text-[#6B6480] hover:border-purple-300")}>
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={createAdmin} className="px-5 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-full hover:bg-purple-700 transition-colors">
                Create Admin Account
              </button>
              <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-[#E8E1F0] rounded-full text-sm font-semibold text-[#6B6480] hover:bg-[#F7F4F9] transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Admin list */}
      <SectionCard noPad>
        <div className="overflow-x-auto rounded-2xl">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#E8E1F0]">
                {["Admin","Role","Permissions","Last Active","Status","Actions"].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-[10px] font-bold text-[#A89EC0] uppercase tracking-[.6px] bg-[#F7F4F9]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {admins.map((a, i) => (
                <tr key={a.id} className={cn("border-b border-[#F3EFF8] hover:bg-[#FAF8FC] transition-colors", i===admins.length-1&&"border-b-0")}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center text-white text-[10px] font-bold bg-gradient-to-br flex-shrink-0", a.grad)}>
                        {a.name.slice(0,2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#0F0B1A]">{a.name}</div>
                        <div className="text-[10px] text-[#A89EC0]">{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200">{a.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {a.perms.map(p => <span key={p} className="text-[9px] font-semibold text-[#6B6480] bg-[#F7F4F9] px-1.5 py-0.5 rounded-full">{p}</span>)}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-xs text-[#A89EC0]">{a.lastActive}</td>
                  <td className="px-5 py-4">
                    <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full", STATUS_COLORS[a.status] ?? STATUS_COLORS.Away)}>{a.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 border border-[#E8E1F0] rounded-full text-[10px] font-semibold text-[#6B6480] hover:bg-[#F7F4F9] transition-colors">Edit</button>
                      <button onClick={() => revokeAdmin(a.id)}
                              className="flex items-center gap-1 px-3 py-1.5 border border-red-200 rounded-full text-[10px] font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                        <X size={10} /> Revoke
                      </button>
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
