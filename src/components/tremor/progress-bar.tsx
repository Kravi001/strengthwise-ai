import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  color?: "emerald" | "blue" | "amber" | "rose" | "purple" | "cyan";
  label?: string;
  showAnimation?: boolean;
}

const colorMap = {
  emerald: "bg-emerald-500 shadow-sm shadow-emerald-500/20",
  blue: "bg-blue-500 shadow-sm shadow-blue-500/20",
  amber: "bg-amber-500 shadow-sm shadow-amber-500/20",
  rose: "bg-rose-500 shadow-sm shadow-rose-500/20",
  purple: "bg-purple-500 shadow-sm shadow-purple-500/20",
  cyan: "bg-cyan-500 shadow-sm shadow-cyan-500/20",
};

export function ProgressBar({
  value,
  color = "emerald",
  label,
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, value));

  return (
    <div className={cn("w-full space-y-1.5", className)} {...props}>
      {label && (
        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>{label}</span>
          <span className="font-mono text-neutral-200">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorMap[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
