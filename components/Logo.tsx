"use client";

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
  showWordmark?: boolean;
}

export function Logo({ className = "", size = 24, showWordmark = true }: LogoProps) {
  // Mark: rounded square (radius 22%) with teal/near-black theme and 3 decreasing horizontal bars (shortest in white)
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Rounded square container with 22% radius */}
        <rect
          width="100"
          height="100"
          rx="22"
          fill="#14171C"
          stroke="#2DD4BF"
          strokeWidth="6"
        />
        {/* Three horizontal bars of decreasing length (funnel / signal filter) */}
        {/* Top bar: Longest (teal) */}
        <rect x="22" y="28" width="56" height="8" rx="4" fill="#2DD4BF" />
        {/* Middle bar: Medium (teal accent) */}
        <rect x="22" y="46" width="38" height="8" rx="4" fill="#2DD4BF" />
        {/* Bottom bar: Shortest (white) - the high-conviction signal */}
        <rect x="22" y="64" width="22" height="8" rx="4" fill="#FFFFFF" />
      </svg>
      {showWordmark && (
        <span
          className="text-white font-semibold tracking-[-0.02em] font-sans"
          style={{ fontSize: `${Math.round(size * 0.75)}px`, lineHeight: 1 }}
        >
          FINN
        </span>
      )}
    </div>
  );
}

export default Logo;
