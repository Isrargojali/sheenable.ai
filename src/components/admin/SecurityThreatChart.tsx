// src/components/admin/SecurityThreatChart.tsx
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
import { ShieldAlert, RefreshCw, Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { DateRangePicker, type TimeframeOption } from "./DateRangePicker";

interface SecurityTimelinePoint {
  label: string;
  failedLogins: number;
  rateLimits: number;
  bruteBlocks: number;
  suspensions: number;
  total: number;
  fullDate?: string;
}

interface SecurityThreatChartProps {
  timeframe?: TimeframeOption;
  onTimeframeChange?: (val: TimeframeOption) => void;
  className?: string;
}

function CustomSecurityTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  const failedLogins = payload.find((p) => p.dataKey === "failedLogins")?.value ?? 0;
  const rateLimits = payload.find((p) => p.dataKey === "rateLimits")?.value ?? 0;
  const bruteBlocks = payload.find((p) => p.dataKey === "bruteBlocks")?.value ?? 0;
  const total = failedLogins + rateLimits + bruteBlocks;

  return (
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-[var(--ink-200)] shadow-xl rounded-xl p-3 text-xs min-w-[190px] animate-fade-in z-50">
      <div className="font-semibold text-[var(--ink-900)] dark:text-zinc-100 border-b border-[var(--ink-100)] pb-1.5 mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] font-mono text-[var(--ink-500)]">Total: {total}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Failed Logins</span>
          </div>
          <span className="font-bold text-rose-500 font-mono">{failedLogins}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Rate Limits</span>
          </div>
          <span className="font-bold text-amber-500 font-mono">{rateLimits}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Brute Blocks</span>
          </div>
          <span className="font-bold text-purple-500 font-mono">{bruteBlocks}</span>
        </div>
      </div>
    </div>
  );
}

export function SecurityThreatChart({
  timeframe: controlledTimeframe,
  onTimeframeChange,
  className,
}: SecurityThreatChartProps) {
  const [internalTimeframe, setInternalTimeframe] = useState<TimeframeOption>("7d");
  const activeTimeframe = controlledTimeframe ?? internalTimeframe;

  const handleTimeframeChange = (t: TimeframeOption) => {
    if (onTimeframeChange) {
      onTimeframeChange(t);
    } else {
      setInternalTimeframe(t);
    }
  };

  const { data: secData, isLoading, isFetching } = useQuery<{
    range: string;
    threatLevel: string;
    timeline: SecurityTimelinePoint[];
    totals: {
      blockedIPs: number;
      failedLogins24h: number;
      activeSessions: number;
      bruteBlocks24h: number;
      rateLimitHits: number;
    };
  }>({
    queryKey: ["securityAnalytics", activeTimeframe],
    queryFn: () => apiAdmin.getSecurityAnalytics(activeTimeframe),
    refetchInterval: 15000,
    staleTime: 10000,
  });

  const chartData: SecurityTimelinePoint[] = useMemo(() => {
    if (secData?.timeline && Array.isArray(secData.timeline) && secData.timeline.length > 0) {
      return secData.timeline;
    }
    return [];
  }, [secData]);

  const totalFailed = useMemo(() => chartData.reduce((acc, c) => acc + (c.failedLogins || 0), 0), [chartData]);
  const totalRateLimits = useMemo(() => chartData.reduce((acc, c) => acc + (c.rateLimits || 0), 0), [chartData]);
  const totalBrute = useMemo(() => chartData.reduce((acc, c) => acc + (c.bruteBlocks || 0), 0), [chartData]);
  const totalThreats = totalFailed + totalRateLimits + totalBrute;
  const hasActivity = totalThreats > 0;

  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 sm:p-6 shadow-[var(--shadow-card)] transition-all relative overflow-hidden",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[var(--ink-500)] dark:text-muted-foreground uppercase tracking-widest">
              SECURITY INCIDENTS & THREAT TRENDS
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE SHIELD
            </span>
            {isFetching && !isLoading && (
              <RefreshCw size={11} className="text-[var(--ink-400)] animate-spin" />
            )}
          </div>
          <p className="text-[12px] text-[var(--ink-400)] mt-0.5 font-normal">
            Failed logins, rate-limit triggers, and brute force lockout events ({totalThreats} total events in this window)
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

      {/* Chart Canvas */}
      <div className="w-full h-56 sm:h-64 relative">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[var(--ink-50)]/50 rounded-xl animate-pulse">
            <ShieldAlert className="w-6 h-6 text-rose-500 animate-bounce" />
            <span className="text-xs text-[var(--ink-500)] font-medium">Querying security incident logs...</span>
          </div>
        ) : (
          <>
            {!hasActivity && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="bg-background/90 backdrop-blur-sm border border-emerald-200 shadow-sm px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in">
                  <ShieldCheck size={15} className="text-emerald-500" />
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Zero threat incidents recorded in this {activeTimeframe === "today" ? "day" : activeTimeframe === "90d" ? "quarter" : activeTimeframe === "30d" ? "month" : "week"} — All systems secure
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
                  <linearGradient id="failedLoginsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="rateLimitsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="bruteBlocksGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
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

                <Tooltip content={<CustomSecurityTooltip />} />

                {/* Rose: Failed Logins */}
                <Area
                  type="monotone"
                  dataKey="failedLogins"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#failedLoginsGradient)"
                  activeDot={{ r: 5, fill: "#EF4444", stroke: "#FFFFFF", strokeWidth: 2 }}
                />

                {/* Amber: Rate Limits */}
                <Area
                  type="monotone"
                  dataKey="rateLimits"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#rateLimitsGradient)"
                  activeDot={{ r: 5, fill: "#F59E0B", stroke: "#FFFFFF", strokeWidth: 2 }}
                />

                {/* Purple: Brute Blocks */}
                <Area
                  type="monotone"
                  dataKey="bruteBlocks"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#bruteBlocksGradient)"
                  activeDot={{ r: 5, fill: "#8B5CF6", stroke: "#FFFFFF", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-[var(--ink-100)] flex-wrap">
        <div className="flex items-center gap-2 text-[12px] font-medium text-rose-600 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>Failed Logins ({totalFailed})</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-amber-600 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Rate Limit Hits ({totalRateLimits})</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-purple-600 select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>Brute Blocks ({totalBrute})</span>
        </div>
      </div>
    </div>
  );
}

export default SecurityThreatChart;
