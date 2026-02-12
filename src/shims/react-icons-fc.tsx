import React from "react";

type IconProps = {
  className?: string;
  size?: number | string;
};

export const FcGoogle = ({ className, size = 16 }: IconProps) => (
  <span
    className={className}
    style={{
      display: "inline-block",
      width: typeof size === "number" ? `${size}px` : size,
      height: typeof size === "number" ? `${size}px` : size,
      textAlign: "center",
      lineHeight: typeof size === "number" ? `${size}px` : size,
      borderRadius: "9999px",
      background:
        "conic-gradient(from 0deg, #4285F4, #34A853, #FBBC05, #EA4335, #4285F4)",
      fontSize:
        typeof size === "number" ? `${Math.max(10, size - 6)}px` : "0.8em",
      color: "white",
      fontWeight: 700,
    }}
    aria-hidden="true"
  >
    G
  </span>
);

