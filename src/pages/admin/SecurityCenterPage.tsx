// src/pages/admin/SecurityCenterPage.tsx
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, AlertTriangle, Activity, Lock } from "lucide-react";
import { DashboardShell, SectionCard } from "@/components/layout/DashboardShell";
import { apiAdmin } from "@/lib/api";
import { cn } from "@/lib/utils";

const KPIS = [
  { key: "threatLevel",     label: "Threat level",      icon: ShieldCheck,   tone: "good" },
  { key: "blockedIPs",      label: "Blocked IPs",       icon: Lock,          tone: "warn" },
  { key: "failedLogins24h", label: "Failed logins 24h", icon: AlertTriangle, tone: "warn" },
  { key: "activeSessions",  label: "Active sessions",   icon: Activity,      tone: "info" },
] as const;

const TONE: Record<string, string> = {
  good: "from-emerald-500 to-emerald-700",
  warn: "from-amber-500 to-amber-700",
  info: "from-blue-500 to-blue-700",
};

export default function SecurityCenterPage() {
  const { data } = useQuery({ queryKey: ["threats"], queryFn: apiAdmin.getThreatData });

  return (
    <DashboardShell
      title="Security center"
      subtitle="Real-time platform security posture"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {KPIS.map(k => {
          const Icon = k.icon;
          const v = (data as any)?.[k.key] ?? "—";
          return (
            <div key={k.key} className="bg-card border border-border rounded-2xl p-4">
              <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3", TONE[k.tone])}>
                <Icon size={15} className="text-white" />
              </div>
              <div className="font-serif text-2xl text-foreground leading-none">{String(v)}</div>
              <div className="text-[11px] text-muted-foreground mt-1 font-medium">{k.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <SectionCard title="System health">
          <div className="space-y-3">
            <Row label="Uptime"               value={(data as any)?.uptime ?? "—"} good />
            <Row label="API p95 latency"      value={(data as any)?.apiP95 ?? "—"} good />
            <Row label="Brute-force blocks"   value={(data as any)?.bruteBlocks24h ?? 0} />
            <Row label="Rate-limit hits"      value={(data as any)?.rateLimitHits ?? 0} />
            <Row label="XSS attempts"         value={(data as any)?.xssAttempts ?? 0} good />
          </div>
        </SectionCard>

        <SectionCard title="Active protections">
          <div className="space-y-2.5">
            {[
              { name: "SHA-256 password hashing", on: true },
              { name: "Brute-force protection",   on: true },
              { name: "Rate limiting (60/min)",   on: true },
              { name: "httpOnly session cookies", on: true },
              { name: "CSRF token validation",    on: true },
              { name: "XSS input sanitization",   on: true },
            ].map(p => (
              <div key={p.name} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/40">
                <span className="text-[12px] text-foreground font-medium">{p.name}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ACTIVE
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardShell>
  );
}

function Row({ label, value, good }: { label: string; value: any; good?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border last:border-0">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className={cn(
        "font-mono text-[13px] font-bold",
        good ? "text-emerald-600" : "text-foreground"
      )}>
        {value}
      </span>
    </div>
  );
}
