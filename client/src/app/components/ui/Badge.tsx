"use client";

import React from "react";

type BadgeProps = {
  variant?: "brand" | "muted";
  className?: string;
  children?: React.ReactNode;
};

export default function Badge({ variant = "brand", className = "", children }: BadgeProps) {
  const variants: Record<string, string> = {
    brand: "badge badge-brand",
    muted: "badge badge-muted",
  };
  return <span className={[variants[variant], className].filter(Boolean).join(" ")}>{children}</span>;
}