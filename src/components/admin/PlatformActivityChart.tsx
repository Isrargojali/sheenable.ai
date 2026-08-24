// src/components/admin/PlatformActivityChart.tsx
import { useState } from "react";
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

export type Timeframe = "today" | "7d" | "30d";

export interface ActivityDataPoint {
  label: string;
  signups: number;
  applications: number;
  fullDate?: string;
}

interface PlatformActivityChartProps {
  timeframe?: Timeframe;
  onTimeframeChange?: (timeframe: Timeframe) => void;
  className?: string;
  data?: Record<Timeframe, ActivityDataPoint[]>;
}

// Default high-fidelity dataset matching exact visual curves
const DEFAULT_DATA: Record<Timeframe, ActivityDataPoint[]> = {
  today: [
    { label: "00:00", signups: 2, applications: 1, fullDate: "12:00 AM" },
    { label: "04:00", signups: 1, applications: 0, fullDate: "04:00 AM" },
    { label: "08:00", signups: 8, applications: 5, fullDate: "08:00 AM" },
    { label: "12:00", signups: 18, applications: 24, fullDate: "12:00 PM" },
    { label: "16:00", signups: 14, applications: 32, fullDate: "04:00 PM" },
    { label: "20:00", signups: 22, applications: 16, fullDate: "08:00 PM" },
    { label: "23:59", signups: 7, applications: 4, fullDate: "11:59 PM" },
  ],
  "7d": [
    { label: "Mon", signups: 2, applications: 12, fullDate: "Monday" },
    { label: "Tue", signups: 14, applications: 2, fullDate: "Tuesday" },
    { label: "Wed", signups: 1, applications: 1, fullDate: "Wednesday" },
    { label: "Thu", signups: 1, applications: 28, fullDate: "Thursday" },
    { label: "Fri", signups: 13, applications: 2, fullDate: "Friday" },
    { label: "Sat", signups: 1, applications: 14, fullDate: "Saturday" },
    { label: "Sun", signups: 1, applications: 1, fullDate: "Sunday" },
  ],
  "30d": [
    { label: "Week 1", signups: 45, applications: 38, fullDate: "Days 1–7" },
    { label: "Week 2", signups: 68, applications: 92, fullDate: "Days 8–14" },
    { label: "Week 3", signups: 84, applications: 76, fullDate: "Days 15–21" },
    { label: "Week 4", signups: 110, applications: 135, fullDate: "Days 22–28" },
    { label: "Current", signups: 32, applications: 44, fullDate: "Days 29–30" },
  ],
};

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
    <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-[var(--ink-200)] shadow-xl rounded-xl p-3 text-xs min-w-[170px] animate-fade-in z-50">
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
  data = DEFAULT_DATA,
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

  const chartData = data[activeTimeframe] || DEFAULT_DATA[activeTimeframe];

  return (
    <div
      className={cn(
        "bg-[var(--surface)] border border-[var(--ink-200)] rounded-[var(--radius-card)] p-5 sm:p-6 shadow-[var(--shadow-card)] transition-all",
        className
      )}
    >
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xs font-bold text-[var(--ink-500)] dark:text-muted-foreground uppercase tracking-widest">
            PLATFORM ACTIVITY
          </h3>
          <p className="text-[12px] text-[var(--ink-400)] mt-0.5 font-normal">
            Signups vs. applications · sample data, wire to your stats API
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
      <div className="w-full h-56 sm:h-64">
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

            <YAxis hide domain={[0, "dataMax + 8"]} />

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
      </div>

      {/* Centered Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-2 border-t border-[var(--ink-100)]">
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#E6007E] select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E6007E]" />
          <span>Signups</span>
        </div>
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#6366F1] select-none">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" />
          <span>Applications</span>
        </div>
      </div>
    </div>
  );
}

export default PlatformActivityChart;
