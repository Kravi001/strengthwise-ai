"use client";

import * as React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export interface DonutChartDataItem {
  name: string;
  value: number;
  color: string; // Hex color or Tailwind class compatible
}

export interface DonutChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: DonutChartDataItem[];
  category?: string;
  index?: string;
  valueFormatter?: (value: number) => string;
  label?: string;
  showLegend?: boolean;
}

export function DonutChart({
  data,
  valueFormatter = (val: number) => `${val}`,
  label,
  showLegend = true,
  className,
  ...props
}: DonutChartProps) {
  const total = React.useMemo(
    () => data.reduce((acc, curr) => acc + curr.value, 0),
    [data]
  );

  return (
    <div
      className={cn("relative flex flex-col items-center justify-center", className)}
      {...props}
    >
      <div className="relative h-48 w-48 shrink-0 flex items-center justify-center">
        {/* Multi-tone Radial Glow Backdrop */}
        <div
          className="pointer-events-none absolute -inset-6 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.25)_0%,rgba(236,72,153,0.22)_40%,rgba(245,158,11,0.18)_70%,transparent_85%)] blur-2xl"
          aria-hidden="true"
        />

        {/* Concentric Subtle Dark Track & Framing Ring */}
        <div
          className="pointer-events-none absolute inset-[18px] rounded-full border border-white/10 bg-gradient-to-b from-neutral-900/90 via-neutral-950/80 to-neutral-950 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_0_25px_rgba(0,0,0,0.8)]"
          aria-hidden="true"
        />

        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DonutChartDataItem;
                  return (
                    <div className="rounded-xl border border-neutral-700 bg-neutral-950/95 backdrop-blur-md p-2.5 text-xs shadow-2xl">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shadow-sm"
                          style={{
                            backgroundColor: item.color,
                            boxShadow: `0 0 6px ${item.color}`,
                          }}
                        />
                        <span className="font-semibold text-white">{item.name}</span>
                      </div>
                      <p className="mt-1 font-mono font-bold text-neutral-200">
                        {valueFormatter(item.value)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={75}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#0a0a0a" strokeWidth={2} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Core Glassmorphic Disc & Label */}
        <div className="pointer-events-none absolute inset-[42px] rounded-full bg-gradient-to-b from-neutral-900/95 via-neutral-950/90 to-neutral-950 border border-white/10 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1),0_8px_20px_rgba(0,0,0,0.8)] backdrop-blur-md flex flex-col items-center justify-center text-center z-10 overflow-hidden">
          {/* Core Ambient Radial Light */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.16)_0%,rgba(236,72,153,0.12)_45%,transparent_75%)] pointer-events-none"
            aria-hidden="true"
          />
          <span className="relative text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-300 tracking-tight font-mono drop-shadow-[0_2px_8px_rgba(6,182,212,0.3)]">
            {valueFormatter(total)}
          </span>
          {label && (
            <span className="relative text-[9px] text-neutral-400 font-bold uppercase tracking-widest mt-0.5">
              {label}
            </span>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-neutral-200">
          {data.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/70 border border-neutral-800 hover:border-neutral-700 transition shadow-sm"
            >
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 8px ${item.color}90`,
                }}
              />
              <span className="font-semibold text-neutral-200">{item.name}</span>
              <span className="font-mono text-neutral-400">
                ({valueFormatter(item.value)})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
