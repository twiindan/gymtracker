import type { HTMLAttributes, ReactNode } from "react";

type CardPadding = "sm" | "md" | "lg";

const paddingClasses: Record<CardPadding, string> = {
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding;
  children?: ReactNode;
}

export function Card({ padding = "md", children, className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface ${paddingClasses[padding]} ${className}`}
      {...props}
    />
  );
}
