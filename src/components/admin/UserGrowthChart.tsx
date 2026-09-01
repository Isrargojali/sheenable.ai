// src/components/admin/UserGrowthChart.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { apiAdmin } from "@/lib/api";
import { Users, RefreshCw, UserCheck, ShieldCheck, Building2, Ban } from "lucide-react";
import { DateRangePicker, type TimeframeOption } from "./DateRangePicker";

interface UserTimelinePoint {
  label: string;
  candidates: number;
  employers: number;
  admins: number;
  total: number;
  fullDate?: string;
}

interface UserGrowthChartProps {
  timeframe?: TimeframeOption;
  onTimeframeChange?: (val: TimeframeOption) => void;
  className?: string;
}

function CustomUserTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  const candidates = payload.find((p) => p.dataKey === "candidates")?.value ?? 0;
  const employers = payload.find((p) => p.dataKey === "employers")?.value ?? 0;
  const admins = payload.find((p) => p.dataKey === "admins")?.value ?? 0;
  const total = candidates + employers + admins;

  return (
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-[var(--ink-200)] shadow-xl rounded-xl p-3 text-xs min-w-[175px] animate-fade-in z-50">
      <div className="font-semibold text-[var(--ink-900)] dark:text-zinc-100 border-b border-[var(--ink-100)] pb-1.5 mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] font-mono text-[var(--ink-500)]">New: {total}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E6007E]" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Candidates</span>
          </div>
          <span className="font-bold text-[#E6007E] font-mono">{candidates}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Employers</span>
          </div>
          <span className="font-bold text-[#10B981] font-mono">{employers}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Admins</span>
          </div>
          <span className="font-bold text-[#6366F1] font-mono">{admins}</span>
        </div>
      </div>
    </div>
  );
}

export function UserGrowthChart({
  timeframe: controlledTimeframe,
  onTimeframeChange,
  className,
}: UserGrowthChartProps) {
  const [internalTimeframe, setInternalTimeframe] = useState<TimeframeOption>("30d");
  const activeTimeframe = controlledTimeframe ?? internalTimeframe;

  const handleTimeframeChange = (t: TimeframeOption) => {
    if (onTimeframeChange) {
      onTimeframeChange(t);
    } else {
      setInternalTimeframe(t);
    }
  };

  const { data: userData, isLoading, isFetching } = useQuery<{
    range: string;
    timeline: UserTimelinePoint[];
    summary: {
      totalUsers: number;
      roles: { candidates: number; employers: number; admins: number; superAdmins: number };
      status: { active: number; suspended: number; verified: number; unverified: number };
      newInPeriod: number;
    };
  }>({
    queryKey: ["userAnalytics", activeTimeframe],
    queryFn: () => apiAdmin.getUserAnalytics(activeTimeframe),
    refetchInterval: 20000,
    staleTime: 15000,
  });

  const chartData: UserTimelinePoint[] = useMemo(() => {
    if (userData?.timeline && Array.isArray(userData.timeline) && userData.timeline.length > 0) {
      return userData.timeline;
    }
    return [];
  }, [userData]);

  const totalCandidates = useMemo(() => chartData.reduce((acc, c) => acc + (c.candidates || 0), 0), [chartData]);
  const totalEmployers = useMemo(() => chartData.reduce((acc, c) => acc + (c.employers || 0), 0), [chartData]);
  const totalAdmins = useMemo(() => chartData.reduce((acc, c) => acc + (c.admins || 0), 0), [chartData]);
  const totalNewUsers = totalCandidates + totalEmployers + totalAdmins;
  const hasActivity = totalNewUsers > 0;

  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 sm:p-6 shadow-[var(--shadow-card)] transition-all relative overflow-hidden mb-6",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[var(--ink-500)] dark:text-muted-foreground uppercase tracking-widest">
              USER GROWTH & ROLE DISTRIBUTION
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE DATABASE
            </span>
            {isFetching && !isLoading && (
              <RefreshCw size={11} className="text-[var(--ink-400)] animate-spin" />
            )}
          </div>
          <p className="text-[12px] text-[var(--ink-400)] mt-0.5 font-normal">
            New registrations by user role ({totalNewUsers} new accounts created in this window)
          </p>
        </div>

        <DateRangePicker
          value={activeTimeframe}
          onChange={handleTimeframeChange}
          options={[
            { key: "today", label: "Today" },
            { key: "7d", label: "7 Days" },
            { key: "30d", label: "30 Days" },
            { key: "90d", label: "90 Days" },
          ]}
        />
      </div>

      {/* Main Grid: Chart on Left, Breakdown Cards on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Chart Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col justify-between">
          <div className="w-full h-52 sm:h-56 relative">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[var(--ink-50)]/50 rounded-xl animate-pulse">
                <Users className="w-6 h-6 text-[var(--brand-pink)] animate-bounce" />
                <span className="text-xs text-[var(--ink-500)] font-medium">Aggregating user registrations...</span>
              </div>
            ) : (
              <>
                {!hasActivity && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                    <div className="bg-background/90 backdrop-blur-sm border border-[var(--ink-200)] shadow-sm px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in">
                      <Users size={14} className="text-[var(--ink-400)]" />
                      <span className="text-xs font-medium text-[var(--ink-600)]">
                        No new registrations in this {activeTimeframe === "today" ? "day" : activeTimeframe === "90d" ? "quarter" : activeTimeframe === "30d" ? "month" : "week"}
                      </span>
                    </div>
                  </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="candidateGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E6007E" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#E6007E" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="employerGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="adminGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid
                      stroke="var(--ink-200)"
                      strokeOpacity={0.7}
                      vertical={false}
                    />

                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                      tick={{
                        fill: "var(--ink-400)",
                        fontSize: 11,
                        fontWeight: 500,
                      }}
                    />

                    <YAxis hide domain={[0, hasActivity ? "dataMax + 2" : 4]} allowDecimals={false} />

                    <Tooltip content={<CustomUserTooltip />} />

                    {/* Pink: Candidates */}
                    <Area
                      type="monotone"
                      dataKey="candidates"
                      stroke="#E6007E"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#candidateGradient)"
                      activeDot={{ r: 5, fill: "#E6007E", stroke: "#FFFFFF", strokeWidth: 2 }}
                    />

                    {/* Emerald: Employers */}
                    <Area
                      type="monotone"
                      dataKey="employers"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#employerGradient)"
                      activeDot={{ r: 5, fill: "#10B981", stroke: "#FFFFFF", strokeWidth: 2 }}
                    />

                    {/* Indigo: Admins */}
                    <Area
                      type="monotone"
                      dataKey="admins"
                      stroke="#6366F1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#adminGradient)"
                      activeDot={{ r: 5, fill: "#6366F1", stroke: "#FFFFFF", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </>
            )}
          </div>

          {/* Chart Legend */}
          <div className="flex items-center justify-center gap-6 mt-3 pt-2 border-t border-[var(--ink-100)] flex-wrap">
            <div className="flex items-center gap-2 text-[12px] font-medium text-[#E6007E] select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E6007E]" />
              <span>Candidates ({totalCandidates})</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-600 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Employers ({totalEmployers})</span>
            </div>
            <div className="flex items-center gap-2 text-[12px] font-medium text-indigo-600 select-none">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>Admins ({totalAdmins})</span>
            </div>
          </div>
        </div>

        {/* Breakdown Stats Column (1/3) */}
        <div className="space-y-3 flex flex-col justify-between">
          <div className="p-3.5 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl">
            <div className="text-[10px] font-bold text-[var(--ink-500)] uppercase tracking-wider mb-2">Role Distribution</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--ink-700)] flex items-center gap-1.5">
                  <Users size={12} className="text-[#E6007E]" /> Candidates
                </span>
                <span className="font-mono font-bold text-[var(--ink-900)]">{userData?.summary?.roles?.candidates ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--ink-700)] flex items-center gap-1.5">
                  <Building2 size={12} className="text-emerald-600" /> Employers
                </span>
                <span className="font-mono font-bold text-[var(--ink-900)]">{userData?.summary?.roles?.employers ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--ink-700)] flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-indigo-600" /> Admins
                </span>
                <span className="font-mono font-bold text-[var(--ink-900)]">{userData?.summary?.roles?.admins ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[var(--ink-50)] border border-[var(--ink-200)] rounded-xl">
            <div className="text-[10px] font-bold text-[var(--ink-500)] uppercase tracking-wider mb-2">Account Health & Vetting</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--ink-700)] flex items-center gap-1.5">
                  <UserCheck size={12} className="text-emerald-600" /> Verified Accounts
                </span>
                <span className="font-mono font-bold text-emerald-600">{userData?.summary?.status?.verified ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--ink-700)] flex items-center gap-1.5">
                  <Ban size={12} className="text-rose-600" /> Suspended Accounts
                </span>
                <span className="font-mono font-bold text-rose-600">{userData?.summary?.status?.suspended ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserGrowthChart;
