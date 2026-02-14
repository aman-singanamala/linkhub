import React from "react";

type Props = {
  label?: string;
};

export default function Loader({ label = "Loading" }: Props) {
  return (
    <div className="loader">
      <span className="spinner" />
      <span>{label}</span>
    </div>
  );
}
