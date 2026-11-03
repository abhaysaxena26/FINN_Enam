"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

export function Header() {
  const [dateText, setDateText] = useState("Tue, 3 Nov");
  const [marketDate, setMarketDate] = useState("Mon 2 Nov close");

  useEffect(() => {
    // Dynamic today's date in Asia/Kolkata
    try {
      const now = new Date();
      const formatted = now.toLocaleDateString("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short",
        day: "numeric",
        month: "short",
      });
      setDateText(formatted);
    } catch {
      // fallback
    }

    // Fetch latest market date from indices / portfolio
    fetch("/api/indices")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.latest_market_date) {
          setMarketDate(data.latest_market_date);
        }
      })
      .catch(() => {
        // fallback
      });
  }, []);

  return (
    <header className="border-b border-[#23272F] bg-finn-bg/95 backdrop-blur-md sticky top-0 z-40 shrink-0">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo with 22% rounded square mark and FINN wordmark */}
        <Link href="/today" className="hover:opacity-90 transition-opacity">
          <Logo size={24} />
        </Link>

        {/* Circular AS avatar button linking to /account */}
        <Link
          href="/account"
          className="w-7 h-7 rounded-full bg-[#1A1E24] border border-[#2DD4BF]/40 text-[#2DD4BF] text-[11px] font-semibold flex items-center justify-center hover:border-[#2DD4BF] hover:bg-[#2DD4BF]/10 transition-colors"
          title="Account (Abhay Saxena)"
        >
          AS
        </Link>
      </div>

      {/* Date and market status line */}
      <div className="px-4 pb-2 text-[11px] text-finn-muted tabular-nums flex items-center justify-between">
        <span>{dateText}</span>
        <span>Market data: {marketDate}</span>
      </div>
    </header>
  );
}

export default Header;
