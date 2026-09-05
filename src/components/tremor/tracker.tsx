import * as React from "react";
import { cn } from "@/lib/utils";

export interface TrackerItem {
  color?: "emerald" | "amber" | "rose" | "neutral" | "cyan";
  tooltip?: string;
}

export interface TrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  data: TrackerItem[];
}

const colorMap = {
  emerald: "bg-emerald-500 hover:bg-emerald-400",
  amber: "bg-amber-500 hover:bg-amber-400",
  rose: "bg-rose-500 hover:bg-rose-400",
  cyan: "bg-cyan-500 hover:bg-cyan-400",
  neutral: "bg-neutral-800 hover:bg-neutral-700",
};

export function Tracker({ data, className, ...props }: TrackerProps) {
  return (
    <div
      className={cn("flex h-6 w-full items-center gap-1 overflow-hidden", className)}
      {...props}
    >
      {data.map((item, idx) => (
        <div
          key={idx}
          title={item.tooltip}
          className={cn(
            "h-full flex-1 rounded-sm transition cursor-pointer first:rounded-l-md last:rounded-r-md",
            colorMap[item.color || "emerald"]
          )}
        />
      ))}
    </div>
  );
}
