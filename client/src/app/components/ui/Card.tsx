"use client";

import React from "react";

type CardProps = {
  title?: string;
  subtitle?: string;
  hover?: boolean;
  className?: string;
  children?: React.ReactNode;
};

export default function Card({ title, subtitle, hover = true, className = "", children }: CardProps) {
  const base = "card";
  const hoverCls = hover ? "card-hover" : "";
  return (
    <div className={[base, hoverCls, className].filter(Boolean).join(" ")}> 
      <div className="card-body">
        {title && <h3 className="card-title">{title}</h3>}
        {subtitle && <p className="card-subtitle mb-3">{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}