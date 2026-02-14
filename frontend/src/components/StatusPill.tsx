import React from "react";

type Props = {
  label: string;
  tone?: "neutral" | "success" | "danger";
};

export default function StatusPill({ label, tone = "neutral" }: Props) {
  return (
    <span className={`pill pill--${tone}`}>
      <span className="pill__dot" />
      {label}
    </span>
  );
}
