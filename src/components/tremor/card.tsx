import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  decoration?: "top" | "bottom" | "left" | "right";
  decorationColor?: "emerald" | "neutral";
}

const decorationColors = {
  emerald: "border-emerald-500",
  neutral: "border-neutral-700",
};

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, decoration, decorationColor = "emerald", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-6 text-neutral-100 shadow-sm transition-colors duration-150 ease-out",
          decoration === "top" && `border-t-4 ${decorationColors[decorationColor]}`,
          decoration === "bottom" && `border-b-4 ${decorationColors[decorationColor]}`,
          decoration === "left" && `border-l-4 ${decorationColors[decorationColor]}`,
          decoration === "right" && `border-r-4 ${decorationColors[decorationColor]}`,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = "Card";

export function Metric({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-3xl font-bold tracking-tight text-white", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Title({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-base font-semibold text-neutral-200", className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function Subtitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-neutral-400 mt-1", className)} {...props}>
      {children}
    </p>
  );
}

export function Text({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-neutral-400", className)} {...props}>
      {children}
    </p>
  );
}

export function Divider({
  className,
  ...props
}: React.HTMLAttributes<HTMLHRElement>) {
  return (
    <hr
      className={cn("my-4 border-t border-neutral-800", className)}
      {...props}
    />
  );
}
