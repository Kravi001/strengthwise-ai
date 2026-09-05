"use client";

import * as React from "react";
import {
  Area,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";

export interface AreaChartProps extends React.HTMLAttributes<HTMLDivElement> {
  data: Record<string, unknown>[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
}

const defaultColors = ["#10b981", "#06b6d4", "#a855f7"];

export function AreaChart({
  data,
  index,
  categories,
  colors = defaultColors,
  valueFormatter = (val: number) => `${val}`,
  className,
  ...props
}: AreaChartProps) {
  return (
    <div className={cn("h-64 w-full", className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            {categories.map((cat, i) => {
              const color = colors[i % colors.length];
              return (
                <linearGradient key={cat} id={`gradient-${cat}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                </linearGradient>
              );
            })}
          </defs>
          <XAxis
            dataKey={index}
            stroke="#525252"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#525252"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-xl border border-neutral-800 bg-neutral-950/95 p-3 text-xs shadow-2xl backdrop-blur-md">
                    <p className="font-semibold text-neutral-200 mb-1.5">{label}</p>
                    {payload.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="text-neutral-400 capitalize">{item.name}</span>
                        </div>
                        <span className="font-mono font-medium text-white">
                          {valueFormatter(Number(item.value))}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          {categories.map((cat, i) => {
            const color = colors[i % colors.length];
            return (
              <Area
                key={cat}
                type="monotone"
                dataKey={cat}
                stroke={color}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${cat})`}
              />
            );
          })}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
