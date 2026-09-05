import * as React from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type DeltaType =
  | "increase"
  | "moderateIncrease"
  | "unchanged"
  | "moderateDecrease"
  | "decrease";

export interface BadgeDeltaProps extends React.HTMLAttributes<HTMLSpanElement> {
  deltaType?: DeltaType;
}

const deltaConfig: Record<
  DeltaType,
  { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
  increase: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-400",
    icon: ArrowUpRight,
  },
  moderateIncrease: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    text: "text-emerald-400",
    icon: ArrowUpRight,
  },
  unchanged: {
    bg: "bg-neutral-800 border-neutral-700",
    text: "text-neutral-400",
    icon: Minus,
  },
  moderateDecrease: {
    bg: "bg-rose-500/10 border-rose-500/20",
    text: "text-rose-400",
    icon: ArrowDownRight,
  },
  decrease: {
    bg: "bg-rose-500/10 border-rose-500/20",
    text: "text-rose-400",
    icon: ArrowDownRight,
  },
};

export function BadgeDelta({
  deltaType = "increase",
  className,
  children,
  ...props
}: BadgeDeltaProps) {
  const config = deltaConfig[deltaType] || deltaConfig.increase;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-tight",
        config.bg,
        config.text,
        className
      )}
      {...props}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span>{children}</span>
    </span>
  );
}
