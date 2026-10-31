"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight, FileText } from "lucide-react";
import { cn, formatINR, formatPct } from "@/lib/utils";
import { api } from "@/lib/api";
import { PortfolioResponse, Holding } from "@/lib/types";
import Link from "next/link";

/* Mini SVG sparkline */
function Sparkline({ data, positive }: { data?: number[]; positive: boolean }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const height = 24;
  const width = 64;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
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

  useEffect(() => {
    api<PortfolioResponse>("/portfolio")
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load portfolio:", err);
        setLoading(false);
      });
  }, []);

  const holdings = data?.holdings || [];
  const totalValue = data?.total_value || 0;
  const dayPnL = data?.day_pnl || 0;
  const dayPnLPct = data?.day_pnl_pct || 0;

  return (
    <div className="px-4 pt-14 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-finn-text">Portfolio</h1>
        <p className="text-xs text-finn-muted mt-0.5">
          {holdings.length} tracked holdings · Live end-of-day
        </p>
      </div>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-finn-muted mb-1">Portfolio value</p>
            <p className="text-2xl font-bold text-finn-text tabular-nums">
              {formatINR(totalValue)}
            </p>
          </div>
          <div className="text-right">
            <p
              className={cn(
                "text-sm font-semibold tabular-nums",
                dayPnL >= 0 ? "text-finn-gain" : "text-finn-loss"
              )}
            >
              {dayPnL >= 0 ? "▲" : "▼"} {formatINR(Math.abs(dayPnL))} today
            </p>
            <p
              className={cn(
                "text-xs tabular-nums",
                dayPnLPct >= 0 ? "text-finn-gain" : "text-finn-loss"
              )}
            >
              {formatPct(dayPnLPct)} today
            </p>
          </div>
        </div>
      </motion.div>

      {/* Holdings list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-14 w-full" />
          ))}
        </div>
      ) : (
        <section className="space-y-1">
          {holdings.map((h, i) => (
            <motion.div
              key={h.symbol}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
            >
              <Link
                href={`/company/${h.symbol}`}
                className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-finn-surface transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-finn-surface border border-finn-border flex items-center justify-center text-[11px] font-bold text-finn-accent shrink-0">
                    {h.symbol.slice(0, 3)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-finn-text truncate">
                        {h.symbol}
                      </p>
                      {h.has_filing && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-finn-accent shrink-0"
                          title="Recent material corporate announcement"
                        />
                      )}
                    </div>
                    <p className="text-[11px] text-finn-muted truncate">
                      {h.qty} shares · {h.sector}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-2">
                  {/* Sparkline */}
                  <div className="hidden sm:block">
                    <Sparkline
                      data={h.sparkline}
                      positive={h.day_change_pct >= 0}
                    />
                  </div>

                  {/* Price & Change */}
                  <div className="text-right">
                    <p className="text-sm font-semibold text-finn-text tabular-nums">
                      {formatINR(h.ltp, 2)}
                    </p>
                    <p
                      className={cn(
                        "text-[11px] font-medium tabular-nums",
                        h.day_change_pct >= 0
                          ? "text-finn-gain"
                          : "text-finn-loss"
                      )}
                    >
                      {h.day_change_pct >= 0 ? "▲" : "▼"}{" "}
                      {formatPct(h.day_change_pct)}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </section>
      )}
    </div>
  );
}
