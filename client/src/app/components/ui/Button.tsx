"use client";

import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline" | "ghost";
  loading?: boolean;
};

export default function Button({ variant = "primary", loading = false, className = "", children, ...props }: ButtonProps) {
  const base = "btn focus:outline-none";
  const variants: Record<string, string> = {
    primary: "btn-primary",
    outline: "btn-outline",
    ghost: "btn-ghost",
  };
  const classes = [base, variants[variant], className].filter(Boolean).join(" ");

  return (
    <button {...props} className={classes} disabled={loading || props.disabled}>
      {loading ? (
        <span style={{ opacity: 0.8 }}>Loading...</span>
      ) : (
        children
      )}
    </button>
  );
}