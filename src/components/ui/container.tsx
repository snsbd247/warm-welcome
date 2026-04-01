import * as React from "react";
import { cn } from "@/lib/utils";

/* ─── Container ─── */
interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max width: sm | md | lg | xl | full */
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeMap: Record<string, string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function Container({ size = "xl", className, ...props }: ContainerProps) {
  return <div className={cn("mx-auto w-full px-4 sm:px-6", sizeMap[size], className)} {...props} />;
}

/* ─── Stack ─── */
interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Direction */
  direction?: "row" | "col";
  /** Gap size (Tailwind gap-*) */
  gap?: 1 | 2 | 3 | 4 | 5 | 6 | 8;
  /** Alignment */
  align?: "start" | "center" | "end" | "stretch";
  /** Wrap */
  wrap?: boolean;
}

export function Stack({
  direction = "col",
  gap = 4,
  align = "stretch",
  wrap = false,
  className,
  ...props
}: StackProps) {
  return (
    <div
      className={cn(
        "flex",
        direction === "col" ? "flex-col" : "flex-row",
        `gap-${gap}`,
        align === "start" && "items-start",
        align === "center" && "items-center",
        align === "end" && "items-end",
        align === "stretch" && "items-stretch",
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    />
  );
}

/* ─── Grid ─── */
interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Columns at different breakpoints */
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Gap */
  gap?: 2 | 3 | 4 | 6 | 8;
}

const colsMap: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

export function Grid({ cols = 3, gap = 4, className, ...props }: GridProps) {
  return (
    <div className={cn("grid", colsMap[cols], `gap-${gap}`, className)} {...props} />
  );
}
