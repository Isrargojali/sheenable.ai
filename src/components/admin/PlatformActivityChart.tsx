// src/components/admin/PlatformActivityChart.tsx
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
import { Activity, RefreshCw } from "lucide-react";

export type Timeframe = "today" | "7d" | "30d";

export interface ActivityDataPoint {
  label: string;
  signups: number;
  applications: number;
  fullDate?: string;
}

interface AnalyticsApiResponse {
  timeline?: ActivityDataPoint[];
  users?: Array<{ _id: string; count: number }>;
  applications?: Array<{ _id: string; count: number }>;
  jobs?: Array<{ _id: string; count: number }>;
}

interface PlatformActivityChartProps {
  timeframe?: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  className?: string;
  initialData?: Record<Timeframe, ActivityDataPoint[]>;
}

// Generate continuous timeline fallback in case of fresh DB initialization
function generateFallbackTimeline(timeframe: Timeframe): ActivityDataPoint[] {
  if (timeframe === "today") {
    return [
      { label: "00:00", signups: 0, applications: 0, fullDate: "Today 12:00 AM" },
      { label: "04:00", signups: 0, applications: 0, fullDate: "Today 04:00 AM" },
      { label: "08:00", signups: 0, applications: 0, fullDate: "Today 08:00 AM" },
      { label: "12:00", signups: 0, applications: 0, fullDate: "Today 12:00 PM" },
      { label: "16:00", signups: 0, applications: 0, fullDate: "Today 04:00 PM" },
      { label: "20:00", signups: 0, applications: 0, fullDate: "Today 08:00 PM" },
      { label: "23:59", signups: 0, applications: 0, fullDate: "Today 11:59 PM" },
    ];
  }

  const days = timeframe === "30d" ? 30 : 7;
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const list: ActivityDataPoint[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayName = dayNames[d.getDay()];
    list.push({
      label: days === 7 ? dayName : `${d.getMonth() + 1}/${d.getDate()}`,
      signups: 0,
      applications: 0,
      fullDate: d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    });
  }

  return list;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    dataKey: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const signups = payload.find((p) => p.dataKey === "signups")?.value ?? 0;
  const apps = payload.find((p) => p.dataKey === "applications")?.value ?? 0;
  const total = signups + apps;

  return (
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-[var(--ink-200)] shadow-xl rounded-xl p-3 text-xs min-w-[175px] animate-fade-in z-50">
      <div className="font-semibold text-[var(--ink-900)] dark:text-zinc-100 border-b border-[var(--ink-100)] pb-1.5 mb-2 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-[10px] font-mono text-[var(--ink-500)]">Total: {total}</span>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E6007E]" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Signups</span>
          </div>
          <span className="font-bold text-[#E6007E] font-mono">{signups}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#6366F1]" />
            <span className="text-[var(--ink-700)] dark:text-zinc-300 font-medium">Applications</span>
          </div>
          <span className="font-bold text-[#6366F1] font-mono">{apps}</span>
        </div>
      </div>
    </div>
  );
}

export function PlatformActivityChart({
  timeframe: controlledTimeframe,
  onTimeframeChange,
  className,
}: PlatformActivityChartProps) {
  const [internalTimeframe, setInternalTimeframe] = useState<Timeframe>("7d");
  const activeTimeframe = controlledTimeframe ?? internalTimeframe;

  const handleTimeframeChange = (t: Timeframe) => {
    if (onTimeframeChange) {
      onTimeframeChange(t);
    } else {
      setInternalTimeframe(t);
    }
  };

  // Real-time live data fetching from system database via apiAdmin
  const {
    data: liveTimeseries,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<AnalyticsApiResponse>({
    queryKey: ["adminTimeseries", activeTimeframe],
    queryFn: () => apiAdmin.getTimeseries(activeTimeframe),
    refetchInterval: 15000, // Live poll every 15s
    staleTime: 10000,
  });

  // Merge and sanitize live backend timeline data
  const chartData: ActivityDataPoint[] = useMemo(() => {
    if (liveTimeseries?.timeline && Array.isArray(liveTimeseries.timeline) && liveTimeseries.timeline.length > 0) {
      return liveTimeseries.timeline;
    }

    // Process raw user/app aggregation buckets if timeline is missing
    if (liveTimeseries?.users || liveTimeseries?.applications) {
      const userMap = Object.fromEntries((liveTimeseries.users || []).map((u) => [u._id, u.count]));
      const appMap = Object.fromEntries((liveTimeseries.applications || []).map((a) => [a._id, a.count]));

      const baseList = generateFallbackTimeline(activeTimeframe);
      return baseList.map((item) => ({
        ...item,
        signups: userMap[item.label] ?? item.signups,
        applications: appMap[item.label] ?? item.applications,
      }));
    }

    return generateFallbackTimeline(activeTimeframe);
  }, [liveTimeseries, activeTimeframe]);

  // Calculate live cumulative period metrics
  const totalSignups = useMemo(() => chartData.reduce((acc, curr) => acc + (curr.signups || 0), 0), [chartData]);
  const totalApps = useMemo(() => chartData.reduce((acc, curr) => acc + (curr.applications || 0), 0), [chartData]);
  const hasActivity = totalSignups > 0 || totalApps > 0;

  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 sm:p-6 shadow-[var(--shadow-card)] transition-all relative overflow-hidden",
        className
      )}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[var(--ink-500)] dark:text-muted-foreground uppercase tracking-widest">
              PLATFORM ACTIVITY
            </h3>
            {/* Live System Indicator */}
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE SYSTEM
            </span>
            {isFetching && !isLoading && (
              <RefreshCw size={11} className="text-[var(--ink-400)] animate-spin" />
            )}
          </div>
          <p className="text-[12px] text-[var(--ink-400)] mt-0.5 font-normal">
            Real-time signups vs. applications from database ({totalSignups} signups · {totalApps} applications in this timeframe)
          </p>
        </div>

        {/* Segmented Filter Control */}
        <div className="flex bg-[var(--ink-100)] p-1 rounded-full items-center self-start sm:self-auto select-none">
          {(["today", "7d", "30d"] as const).map((t) => {
            const isActive = activeTimeframe === t;
            const label = t === "today" ? "Today" : t === "7d" ? "7 Days" : "30 Days";

            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTimeframeChange(t)}
                className={cn(
                  "h-7 px-3.5 rounded-full text-[11.5px] font-semibold transition-all duration-200 border-0 cursor-pointer flex items-center justify-center",
                  isActive
                    ? "bg-[#E6007E] text-white shadow-sm"
                    : "bg-transparent text-[var(--ink-500)] hover:text-[var(--ink-900)]"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full h-56 sm:h-64 relative">
        {isLoading ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[var(--ink-50)]/50 rounded-xl animate-pulse">
            <Activity className="w-6 h-6 text-[var(--brand-pink)] animate-bounce" />
            <span className="text-xs text-[var(--ink-500)] font-medium">Aggregating live system telemetry...</span>
          </div>
        ) : (
          <>
            {!hasActivity && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
                <div className="bg-background/85 backdrop-blur-sm border border-[var(--ink-200)] shadow-sm px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in">
                  <Activity size={14} className="text-[var(--ink-400)]" />
                  <span className="text-xs font-medium text-[var(--ink-600)]">
                    No activity recorded in this {activeTimeframe === "today" ? "day" : activeTimeframe === "30d" ? "month" : "week"} yet
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
                  <linearGradient id="signupsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#E6007E" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#E6007E" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="applicationsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.18} />
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

                <Tooltip content={<CustomTooltip />} />

                {/* Pink Area: Signups */}
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="#E6007E"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#signupsGradient)"
                  activeDot={{
                    r: 5,
                    fill: "#E6007E",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                />

                {/* Blue Area: Applications */}
                <Area
                  type="monotone"
                  dataKey="applications"
                  stroke="#6366F1"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#applicationsGradient)"
                  activeDot={{
                    r: 5,
                    fill: "#6366F1",
                    stroke: "#FFFFFF",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      {/* Centered Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-[var(--ink-100)]">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#E6007E] select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E6007E]" />
          <span>Signups ({totalSignups})</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#6366F1] select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
          <span>Applications ({totalApps})</span>
        </div>
      </div>
    </div>
  );
}

export default PlatformActivityChart;
