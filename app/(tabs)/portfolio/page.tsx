"use client";

import { useEffect, useState } from "react";
import { cn, formatINR, formatPct } from "@/lib/utils";
import { api } from "@/lib/api";
import { PortfolioResponse, Holding } from "@/lib/types";
import Link from "next/link";

type SortKey = "value" | "day_pct" | "pnl";

/* Mini SVG sparkline */
function Sparkline({ data, positive }: { data?: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 18;
  const width = 48;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible shrink-0">
      <polyline
        fill="none"
        stroke={positive ? "var(--color-finn-gain)" : "var(--color-finn-loss)"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("value");

  const loadPortfolio = () => {
    setLoading(true);
    setError(false);
    api<PortfolioResponse>("/portfolio")
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load portfolio:", err);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadPortfolio();
  }, []);

  const rawHoldings = data?.holdings || [];
  const totalValue = data?.total_value || 0;
  const dayPnL = data?.day_pnl || 0;
  const dayPnLPct = data?.day_pnl_pct || 0;

  // Compute invested value & total P&L
  const totalInvested = rawHoldings.reduce((acc, h) => acc + (h.qty * h.avg_price), 0);
  const totalPnL = totalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // Material filing stocks (only key companies with recent material filings get dot)
  const materialFilingSymbols = new Set(["RELIANCE", "DIXON", "TRENT", "KPITTECH", "DEEPAKNTR"]);

  // Sort holdings
  const sortedHoldings = [...rawHoldings].sort((a, b) => {
    if (sortKey === "value") {
      return (b.current_value || 0) - (a.current_value || 0);
    }
    if (sortKey === "day_pct") {
      return (b.day_change_pct || 0) - (a.day_change_pct || 0);
    }
    if (sortKey === "pnl") {
      return (b.pnl_pct || 0) - (a.pnl_pct || 0);
    }
    return 0;
  });

  return (
    <div className="px-4 pt-5 space-y-4">
      {/* Title: Portfolio only */}
      <div>
        <h1 className="text-[22px] font-semibold text-white tracking-tight">Portfolio</h1>
      </div>

      {/* Summary Card */}
      <div className="card space-y-3">
        <div>
          <p className="text-xs text-finn-muted">Current value</p>
          <p className="text-2xl font-bold text-white tabular-nums tracking-tight">
            {formatINR(totalValue)}
          </p>
        </div>

        {/* Breakdown row: Invested | Total P&L | Today */}
        <div className="grid grid-cols-3 pt-2.5 border-t border-[#23272F] text-xs tabular-nums gap-1">
          <div>
            <p className="text-[10px] text-finn-muted">Invested</p>
            <p className="font-semibold text-white mt-0.5">{formatINR(totalInvested)}</p>
          </div>
          <div>
            <p className="text-[10px] text-finn-muted">Total P&L</p>
            <p className={cn("font-semibold mt-0.5", totalPnL >= 0 ? "text-finn-gain" : "text-finn-loss")}>
              {totalPnL >= 0 ? "+" : "−"}{formatINR(Math.abs(totalPnL))}
            </p>
            <p className={cn("text-[10px]", totalPnL >= 0 ? "text-finn-gain" : "text-finn-loss")}>
              {formatPct(totalPnLPct)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-finn-muted">Today</p>
            <p className={cn("font-semibold mt-0.5", dayPnL >= 0 ? "text-finn-gain" : "text-finn-loss")}>
              {dayPnL >= 0 ? "+" : "−"}{formatINR(Math.abs(dayPnL))}
            </p>
            <p className={cn("text-[10px]", dayPnL >= 0 ? "text-finn-gain" : "text-finn-loss")}>
              {formatPct(dayPnLPct)}
            </p>
          </div>
        </div>
      </div>

      {/* Sort Toggle: Value · Day % · P&L */}
      <div className="flex items-center justify-between text-xs pt-1">
        <span className="text-finn-muted font-medium">{rawHoldings.length} holdings</span>
        <div className="flex gap-1 bg-finn-surface p-0.5 rounded-lg border border-[#23272F]">
          {(["value", "day_pct", "pnl"] as SortKey[]).map((key) => {
            const label = key === "value" ? "Value" : key === "day_pct" ? "Day %" : "P&L";
            return (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={cn(
                  "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors",
                  sortKey === key
                    ? "bg-finn-bg text-white"
                    : "text-finn-muted hover:text-white"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Holdings List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 skeleton rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-6 text-xs text-finn-muted space-y-2">
          <p>Failed to load portfolio.</p>
          <button
            onClick={loadPortfolio}
            className="px-3 py-1 bg-finn-surface border border-[#23272F] rounded text-white hover:border-finn-muted"
          >
            Retry
          </button>
        </div>
      ) : sortedHoldings.length === 0 ? (
        <div className="card text-center py-6">
          <p className="text-xs text-finn-muted">You&apos;re all caught up</p>
        </div>
      ) : (
        <div className="card p-0 divide-y divide-[#23272F] overflow-hidden">
          {sortedHoldings.map((h) => {
            const hasMaterialFiling = materialFilingSymbols.has(h.symbol);
            const isGain = (h.day_change_pct || 0) >= 0;

            return (
              <Link
                key={h.symbol}
                href={`/company/${h.symbol}`}
                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-finn-surface-hover transition-colors"
              >
                {/* Left: Ticker + (25 sh · ₹29,122) */}
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white tracking-wide">
                      {h.symbol}
                    </span>
                    {hasMaterialFiling && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-finn-accent shrink-0"
                        title="Unread material filing"
                      />
                    )}
                  </div>
                  <p className="text-[11px] text-finn-muted tabular-nums mt-0.5">
                    {h.qty} sh · {formatINR(h.current_value || (h.qty * h.ltp))}
                  </p>
                </div>

                {/* Middle: Sparkline */}
                <div className="px-2">
                  <Sparkline data={h.sparkline} positive={isGain} />
                </div>

                {/* Right: Price + Day % */}
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-white tabular-nums">
                    {formatINR(h.ltp, 2)}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] font-medium tabular-nums mt-0.5",
                      isGain ? "text-finn-gain" : "text-finn-loss"
                    )}
                  >
                    {formatPct(h.day_change_pct || 0)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
