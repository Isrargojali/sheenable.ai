// src/components/admin/AuditVolumeChart.tsx
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";
import { apiAdmin } from "@/lib/api";
import { ScrollText, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { DateRangePicker, type TimeframeOption } from "./DateRangePicker";

interface AuditTimelinePoint {
  label: string;
  success: number;
  failure: number;
  total: number;
  fullDate?: string;
}

interface AuditVolumeChartProps {
  timeframe?: TimeframeOption;
  onTimeframeChange?: (val: TimeframeOption) => void;
  className?: string;
}

function CustomAuditTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload || !payload.length) return null;

  const success = payload.find((p) => p.dataKey === "success")?.value ?? 0;
  const failure = payload.find((p) => p.dataKey === "failure")?.value ?? 0;
  const total = success + failure;

  return (
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-[var(--ink-200)] shadow-xl rounded-xl p-3 text-xs min-w-[175px] animate-fade-in z-50">
      <div className="font-semibold text-[var(--ink-900)] dark:text-zinc-100 border-b border-[var(--ink-100)] pb-1.5 mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] font-mono text-[var(--ink-500)]">Total: {total}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Successful</span>
          </div>
          <span className="font-bold text-emerald-600 font-mono">{success}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Security / Failed</span>
          </div>
          <span className="font-bold text-rose-500 font-mono">{failure}</span>
        </div>
      </div>
    </div>
  );
}

export function AuditVolumeChart({
  timeframe: controlledTimeframe,
  onTimeframeChange,
  className,
}: AuditVolumeChartProps) {
  const [internalTimeframe, setInternalTimeframe] = useState<TimeframeOption>("7d");
  const activeTimeframe = controlledTimeframe ?? internalTimeframe;

  const handleTimeframeChange = (t: TimeframeOption) => {
    if (onTimeframeChange) {
      onTimeframeChange(t);
    } else {
      setInternalTimeframe(t);
    }
  };

  const { data: auditData, isLoading, isFetching } = useQuery<{
    range: string;
    totalLogs: number;
    totalInPeriod: number;
    timeline: AuditTimelinePoint[];
    actionBreakdown: Array<{ action: string; count: number }>;
  }>({
    queryKey: ["auditAnalytics", activeTimeframe],
    queryFn: () => apiAdmin.getAuditAnalytics(activeTimeframe),
    refetchInterval: 20000,
    staleTime: 15000,
  });

  const chartData: AuditTimelinePoint[] = useMemo(() => {
    if (auditData?.timeline && Array.isArray(auditData.timeline) && auditData.timeline.length > 0) {
      return auditData.timeline;
    }
    return [];
  }, [auditData]);

  const totalSuccess = useMemo(() => chartData.reduce((acc, c) => acc + (c.success || 0), 0), [chartData]);
  const totalFailure = useMemo(() => chartData.reduce((acc, c) => acc + (c.failure || 0), 0), [chartData]);
  const totalEvents = totalSuccess + totalFailure;
  const hasActivity = totalEvents > 0;

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
              AUDIT EVENT VOLUME & COMPLIANCE ACTIVITY
            </h3>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE TELEMETRY
            </span>
            {isFetching && !isLoading && (
              <RefreshCw size={11} className="text-[var(--ink-400)] animate-spin" />
            )}
          </div>
          <p className="text-[12px] text-[var(--ink-400)] mt-0.5 font-normal">
            Real-time administrative ledger volume ({totalEvents} events logged in this timeframe)
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
      <div className="w-full h-52 sm:h-56 relative">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[var(--ink-50)]/50 rounded-xl animate-pulse">
            <ScrollText className="w-6 h-6 text-[var(--brand-pink)] animate-bounce" />
            <span className="text-xs text-[var(--ink-500)] font-medium">Aggregating compliance audit volume...</span>
          </div>
        ) : (
          <>
            {!hasActivity && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="bg-background/90 backdrop-blur-sm border border-[var(--ink-200)] shadow-sm px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in">
                  <ScrollText size={14} className="text-[var(--ink-400)]" />
                  <span className="text-xs font-medium text-[var(--ink-600)]">
                    No audit records in this {activeTimeframe === "today" ? "day" : activeTimeframe === "90d" ? "quarter" : activeTimeframe === "30d" ? "month" : "week"}
                  </span>
                </div>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
              >
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

                <Tooltip content={<CustomAuditTooltip />} />

                {/* Successful Events */}
                <Bar
                  dataKey="success"
                  fill="#10B981"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  stackId="a"
                />

                {/* Failed / Security Trigger Events */}
                <Bar
                  dataKey="failure"
                  fill="#EF4444"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Legend & Summary Badges */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t border-[var(--ink-100)]">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[12px] font-medium text-emerald-700 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Success Events ({totalSuccess})</span>
          </div>
          <div className="flex items-center gap-2 text-[12px] font-medium text-rose-600 select-none">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span>Security Blocks & Alerts ({totalFailure})</span>
          </div>
        </div>

        {auditData?.actionBreakdown && auditData.actionBreakdown.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-[10px] font-bold text-[var(--ink-400)] uppercase tracking-wider mr-1">Top Actions:</span>
            {auditData.actionBreakdown.slice(0, 3).map((a) => (
              <span
                key={a.action}
                className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--ink-100)] text-[var(--ink-700)] border border-[var(--ink-200)] whitespace-nowrap"
              >
                {a.action}: {a.count}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditVolumeChart;
