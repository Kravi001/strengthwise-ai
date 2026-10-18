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
        {/* Subtle Dark Track */}
        <div
          className="pointer-events-none absolute inset-[18px] rounded-full border border-neutral-800 bg-neutral-950"
          aria-hidden="true"
        />

        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DonutChartDataItem;
                  return (
                    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-2.5 text-xs shadow-lg">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: item.color,
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

        {/* Center Core Disc & Label */}
        <div className="pointer-events-none absolute inset-[42px] rounded-full bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center text-center z-10 shadow-sm">
          <span className="relative text-xl font-bold text-neutral-100 tracking-tight font-mono">
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
              className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors duration-150 ease-out shadow-sm"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: item.color,
                }}
              />
              <span className="font-medium text-neutral-200">{item.name}</span>
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
