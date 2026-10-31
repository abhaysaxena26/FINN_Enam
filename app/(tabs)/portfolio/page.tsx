"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ArrowUpRight, FileText } from "lucide-react";
import { cn, formatINR, formatPct } from "@/lib/utils";
import Link from "next/link";

const mockHoldings = [
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", qty: 25, avg_price: 2450, ltp: 2612.35, day_change_pct: 1.23, pnl: 4058.75, has_filing: true },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Banking", qty: 50, avg_price: 1580, ltp: 1742.10, day_change_pct: -0.45, pnl: 8105.00, has_filing: false },
  { symbol: "TCS", name: "TCS", sector: "IT", qty: 15, avg_price: 3650, ltp: 3892.55, day_change_pct: 0.67, pnl: 3638.25, has_filing: false },
  { symbol: "BHARTIARTL", name: "Bharti Airtel", sector: "Telecom", qty: 30, avg_price: 1420, ltp: 1685.20, day_change_pct: 2.10, pnl: 7956.00, has_filing: false },
  { symbol: "ITC", name: "ITC", sector: "FMCG", qty: 100, avg_price: 435, ltp: 468.75, day_change_pct: -0.18, pnl: 3375.00, has_filing: false },
  { symbol: "LT", name: "Larsen & Toubro", sector: "Infra", qty: 12, avg_price: 3250, ltp: 3520.60, day_change_pct: 0.82, pnl: 3247.20, has_filing: true },
  { symbol: "SUNPHARMA", name: "Sun Pharma", sector: "Pharma", qty: 40, avg_price: 1180, ltp: 1295.40, day_change_pct: -1.05, pnl: 4616.00, has_filing: false },
  { symbol: "MARUTI", name: "Maruti Suzuki", sector: "Auto", qty: 5, avg_price: 10200, ltp: 11485.30, day_change_pct: 1.45, pnl: 6426.50, has_filing: false },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "NBFC", qty: 10, avg_price: 6800, ltp: 7250.15, day_change_pct: -0.32, pnl: 4501.50, has_filing: true },
  { symbol: "TRENT", name: "Trent Ltd", sector: "Retail", qty: 20, avg_price: 5200, ltp: 5780.90, day_change_pct: 3.12, pnl: 11618.00, has_filing: true },
  { symbol: "DIXON", name: "Dixon Technologies", sector: "Electronics", qty: 8, avg_price: 12500, ltp: 14200.55, day_change_pct: 4.56, pnl: 13604.40, has_filing: false },
  { symbol: "POLYCAB", name: "Polycab India", sector: "Cables", qty: 15, avg_price: 5800, ltp: 6120.80, day_change_pct: 0.21, pnl: 4812.00, has_filing: false },
  { symbol: "PERSISTENT", name: "Persistent Systems", sector: "IT", qty: 18, avg_price: 4600, ltp: 5150.25, day_change_pct: -0.78, pnl: 9904.50, has_filing: false },
  { symbol: "TATAPOWER", name: "Tata Power", sector: "Power", qty: 80, avg_price: 390, ltp: 432.65, day_change_pct: 1.89, pnl: 3412.00, has_filing: false },
  { symbol: "ETERNAL", name: "Eternal Ltd", sector: "Food Tech", qty: 60, avg_price: 245, ltp: 268.30, day_change_pct: -2.15, pnl: 1398.00, has_filing: false },
  { symbol: "KPITTECH", name: "KPIT Technologies", sector: "Auto Tech", qty: 25, avg_price: 1450, ltp: 1380.60, day_change_pct: -6.20, pnl: -1735.00, has_filing: false },
  { symbol: "DEEPAKNTR", name: "Deepak Nitrite", sector: "Chemicals", qty: 22, avg_price: 2100, ltp: 2285.40, day_change_pct: 0.45, pnl: 4078.80, has_filing: false },
  { symbol: "CDSL", name: "CDSL", sector: "Capital Mkts", qty: 35, avg_price: 1650, ltp: 1820.90, day_change_pct: 1.12, pnl: 5981.50, has_filing: false },
];

export default function PortfolioPage() {
  const totalValue = mockHoldings.reduce((sum, h) => sum + h.ltp * h.qty, 0);
  const totalInvested = mockHoldings.reduce((sum, h) => sum + h.avg_price * h.qty, 0);
  const totalPnL = totalValue - totalInvested;
  const dayPnL = mockHoldings.reduce(
    (sum, h) => sum + h.ltp * h.qty * (h.day_change_pct / (100 + h.day_change_pct)),
    0
  );

  return (
    <div className="px-4 pt-14 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-finn-text">Portfolio</h1>
        <p className="text-xs text-finn-muted mt-0.5">{mockHoldings.length} holdings</p>
      </div>

      {/* Summary card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-finn-muted mb-1">Current value</p>
            <p className="text-2xl font-bold text-finn-text tabular-nums">
              {formatINR(totalValue)}
            </p>
          </div>
          <div className="text-right">
            <p className={cn(
              "text-sm font-semibold tabular-nums",
              dayPnL >= 0 ? "text-finn-gain" : "text-finn-loss"
            )}>
              {dayPnL >= 0 ? "▲" : "▼"} {formatINR(Math.abs(dayPnL))} today
            </p>
            <p className={cn(
              "text-xs tabular-nums",
              totalPnL >= 0 ? "text-finn-gain" : "text-finn-loss"
            )}>
              {totalPnL >= 0 ? "+" : "−"}{formatINR(Math.abs(totalPnL))} overall
            </p>
          </div>
        </div>
      </motion.div>

      {/* Holdings list */}
      <section className="space-y-0.5">
        {mockHoldings.map((h, i) => (
          <motion.div
            key={h.symbol}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
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
                    <p className="text-sm font-medium text-finn-text truncate">{h.symbol}</p>
                    {h.has_filing && (
                      <span className="w-1.5 h-1.5 rounded-full bg-finn-accent shrink-0" title="New material filing" />
                    )}
                  </div>
                  <p className="text-[11px] text-finn-muted">{h.qty} × {formatINR(h.avg_price)}</p>
                </div>
              </div>

              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-medium text-finn-text tabular-nums">
                  {formatINR(h.ltp, 2)}
                </p>
                <p className={cn(
                  "text-[11px] font-medium tabular-nums",
                  h.day_change_pct >= 0 ? "text-finn-gain" : "text-finn-loss"
                )}>
                  {h.day_change_pct >= 0 ? "▲" : "▼"} {formatPct(h.day_change_pct)}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>
    </div>
  );
}
