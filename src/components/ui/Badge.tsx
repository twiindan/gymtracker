import type { HTMLAttributes, ReactNode } from "react";

type BadgeColor = "emerald" | "blue" | "amber" | "red" | "gray" | "purple" | "sky" | "violet";

const colorClasses: Record<BadgeColor, string> = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  red: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  gray: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
};

type BadgeSize = "sm" | "md";

const sizeClasses: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[0.65rem]",
  md: "px-3 py-1 text-xs",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  color?: BadgeColor;
  size?: BadgeSize;
  children?: ReactNode;
}

export function Badge({ color = "gray", size = "md", children, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold transition-colors ${colorClasses[color]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
