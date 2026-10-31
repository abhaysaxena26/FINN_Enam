"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, Check, FileText, UserMinus } from "lucide-react";
import { cn, formatINR, formatPct, timeAgo } from "@/lib/utils";

type TimeWindow = "24h" | "3d" | "7d" | "30d";

/* Category color/icon mapping */
const categoryMeta: Record<string, { color: string; label: string }> = {
  results: { color: "text-finn-accent", label: "Results" },
  "M&A": { color: "text-purple-400", label: "M&A" },
  management_change: { color: "text-amber-400", label: "Mgmt Change" },
  fund_raise: { color: "text-blue-400", label: "Fund Raise" },
  dividend: { color: "text-green-400", label: "Dividend" },
  litigation: { color: "text-red-400", label: "Litigation" },
  credit_rating: { color: "text-yellow-400", label: "Credit Rating" },
  pledging: { color: "text-orange-400", label: "Pledging" },
  capex: { color: "text-cyan-400", label: "Capex" },
  press_release: { color: "text-indigo-400", label: "Press Release" },
};

/* Mock demo data — will be replaced by API calls in Phase 2 */
const mockMaterial = [
  {
    id: "1",
    symbol: "RELIANCE",
    company: "Reliance Industries",
    category: "results",
    materiality: 3,
    headline: "Board Meeting Outcome - Financial Results",
    one_liner: "Q2 FY27 revenue ₹2.35L Cr (+7% YoY), PAT ₹19,101 Cr (+12% YoY)",
    card_type: "results",
    filed_at: new Date(Date.now() - 3 * 3600000).toISOString(),
    card_payload: {
      period: "Q2 FY27",
      type: "consolidated",
      metrics: [
        { label: "Revenue", current: 235089, qoq: 3.2, yoy: 7.1, unit: "Cr" },
        { label: "EBITDA", current: 43850, qoq: 4.5, yoy: 9.8, unit: "Cr", derived: false },
        { label: "PBT", current: 23800, qoq: 2.1, yoy: 11.2, unit: "Cr" },
        { label: "PAT", current: 19101, qoq: 1.8, yoy: 12.0, unit: "Cr" },
      ],
      margins: { ebitda: 18.7, ebitda_change_bps: 45, pat: 8.1, pat_change_bps: 32 },
    },
  },
  {
    id: "2",
    symbol: "TRENT",
    company: "Trent Ltd",
    category: "management_change",
    materiality: 3,
    headline: "Change in Key Managerial Personnel",
    one_liner: "CFO Rajesh Kulkarni resigned, effective Jan 2027",
    card_type: "management_change",
    filed_at: new Date(Date.now() - 8 * 3600000).toISOString(),
    card_payload: {
      person: "Rajesh Kulkarni",
      role: "CFO",
      change: "resigned",
      effective_date: "2027-01-15",
      reason: "Personal reasons",
      successor_named: false,
      bio: "15 years in retail finance. Previously CFO at Titan Company (2018–2024), VP Finance at Unilever India.",
    },
  },
];

const mockMedium = [
  {
    id: "3",
    symbol: "BAJFINANCE",
    category: "dividend",
    headline: "Interim Dividend Declaration",
    one_liner: "Interim dividend ₹36/share, record date Nov 15",
    filed_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: "4",
    symbol: "LT",
    category: "capex",
    headline: "Order Win Announcement",
    one_liner: "₹3,200 Cr power transmission order from Middle East utility",
    filed_at: new Date(Date.now() - 12 * 3600000).toISOString(),
  },
  {
    id: "5",
    symbol: "POLYCAB",
    category: "press_release",
    headline: "Press Release - New Manufacturing Facility",
    one_liner: "₹800 Cr greenfield plant in Dholera, Gujarat; 18-month timeline",
    filed_at: new Date(Date.now() - 14 * 3600000).toISOString(),
  },
];

/* Results card component */
function ResultsCard({ card }: { card: typeof mockMaterial[0] }) {
  const payload = card.card_payload as {
    period: string;
    type: string;
    metrics: Array<{ label: string; current: number; qoq: number; yoy: number; unit: string; derived?: boolean }>;
    margins: { ebitda: number; ebitda_change_bps: number; pat: number; pat_change_bps: number };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-finn-accent/10 text-finn-accent">
            {card.symbol}
          </span>
          <span className="text-xs text-finn-muted">{payload.period} · {payload.type}</span>
        </div>
        <span className="text-[11px] text-finn-muted">{timeAgo(card.filed_at)}</span>
      </div>

      {/* Company name + one-liner */}
      <div>
        <p className="text-sm font-semibold text-finn-text">{card.company}</p>
        <p className="text-[13px] text-finn-muted mt-0.5">{card.one_liner}</p>
      </div>

      {/* Metrics table */}
      <div className="rounded-xl bg-finn-bg/50 border border-finn-border-subtle overflow-hidden">
        <table className="w-full text-xs tabular-nums">
          <thead>
            <tr className="text-finn-muted border-b border-finn-border-subtle">
              <th className="text-left py-2 px-3 font-medium">Metric</th>
              <th className="text-right py-2 px-3 font-medium">Value</th>
              <th className="text-right py-2 px-3 font-medium">QoQ</th>
              <th className="text-right py-2 px-3 font-medium">YoY</th>
            </tr>
          </thead>
          <tbody>
            {payload.metrics.map((m) => (
              <tr key={m.label} className="border-b border-finn-border-subtle last:border-0">
                <td className="py-2 px-3 text-finn-text font-medium">
                  {m.label}
                  {m.derived && <span className="text-finn-muted ml-1 text-[10px]">*</span>}
                </td>
                <td className="py-2 px-3 text-right text-finn-text">
                  ₹{(m.current).toLocaleString("en-IN")} {m.unit}
                </td>
                <td className={cn("py-2 px-3 text-right", m.qoq >= 0 ? "text-finn-gain" : "text-finn-loss")}>
                  {m.qoq >= 0 ? "▲" : "▼"} {Math.abs(m.qoq).toFixed(1)}%
                </td>
                <td className={cn("py-2 px-3 text-right", m.yoy >= 0 ? "text-finn-gain" : "text-finn-loss")}>
                  {m.yoy >= 0 ? "▲" : "▼"} {Math.abs(m.yoy).toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Margin badges */}
      <div className="flex gap-2">
        <span className={cn(
          "text-[11px] px-2 py-1 rounded-md",
          payload.margins.ebitda_change_bps >= 0 ? "bg-finn-gain-bg text-finn-gain" : "bg-finn-loss-bg text-finn-loss"
        )}>
          EBITDA margin {payload.margins.ebitda}%
          {" "}({payload.margins.ebitda_change_bps >= 0 ? "+" : ""}{payload.margins.ebitda_change_bps} bps)
        </span>
        <span className={cn(
          "text-[11px] px-2 py-1 rounded-md",
          payload.margins.pat_change_bps >= 0 ? "bg-finn-gain-bg text-finn-gain" : "bg-finn-loss-bg text-finn-loss"
        )}>
          PAT margin {payload.margins.pat}%
          {" "}({payload.margins.pat_change_bps >= 0 ? "+" : ""}{payload.margins.pat_change_bps} bps)
        </span>
      </div>

      {/* View filing link */}
      <div className="flex justify-end">
        <button className="text-[11px] text-finn-accent flex items-center gap-1 hover:underline">
          View filing <ArrowUpRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}

/* Management change card */
function ManagementChangeCard({ card }: { card: typeof mockMaterial[0] }) {
  const payload = card.card_payload as {
    person: string;
    role: string;
    change: string;
    effective_date: string;
    reason: string;
    successor_named: boolean;
    bio: string;
  };

  const isResignation = payload.change === "resigned" || payload.change === "retired";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">
            {card.symbol}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-md",
            isResignation ? "bg-finn-loss-bg text-finn-loss" : "bg-finn-gain-bg text-finn-gain"
          )}>
            {payload.change}
          </span>
        </div>
        <span className="text-[11px] text-finn-muted">{timeAgo(card.filed_at)}</span>
      </div>

      <div>
        <p className="text-sm font-semibold text-finn-text">{card.company}</p>
        <p className="text-[13px] text-finn-text mt-1">
          <UserMinus size={14} className="inline mr-1 text-amber-400" />
          <span className="font-medium">{payload.person}</span>
          <span className="text-finn-muted"> · {payload.role}</span>
        </p>
      </div>

      {/* Bio */}
      <div className="rounded-xl bg-finn-bg/50 border border-finn-border-subtle p-3">
        <p className="text-xs text-finn-muted leading-relaxed">{payload.bio}</p>
      </div>

      {/* Details */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-finn-muted">
        <span>Effective: {new Date(payload.effective_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span>Reason: {payload.reason}</span>
        {isResignation && (
          <span className={payload.successor_named ? "text-finn-gain" : "text-finn-amber"}>
            {payload.successor_named ? "Successor named" : "No successor named"}
          </span>
        )}
      </div>

      <div className="flex justify-end">
        <button className="text-[11px] text-finn-accent flex items-center gap-1 hover:underline">
          View filing <ArrowUpRight size={12} />
        </button>
      </div>
    </motion.div>
  );
}

/* Material card router */
function MaterialCard({ card }: { card: typeof mockMaterial[0] }) {
  switch (card.card_type) {
    case "results":
      return <ResultsCard card={card} />;
    case "management_change":
      return <ManagementChangeCard card={card} />;
    default:
      return (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-finn-accent/10 text-finn-accent">
              {card.symbol}
            </span>
            <span className={cn("text-xs", categoryMeta[card.category]?.color || "text-finn-muted")}>
              {categoryMeta[card.category]?.label || card.category}
            </span>
          </div>
          <p className="text-sm text-finn-text">{card.one_liner}</p>
          <p className="text-[11px] text-finn-muted mt-2">{timeAgo(card.filed_at)}</p>
        </motion.div>
      );
  }
}

export default function BriefPage() {
  const [window, setWindow] = useState<TimeWindow>("24h");
  const [routineOpen, setRoutineOpen] = useState(false);

  const windows: TimeWindow[] = ["24h", "3d", "7d", "30d"];

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="px-4 pt-14 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-finn-text">{greeting}</h1>
        <p className="text-sm text-finn-muted mt-1">
          <span className="text-finn-accent font-semibold">3 things</span> that matter today
        </p>
      </div>

      {/* Time window selector */}
      <div className="flex gap-1 bg-finn-surface rounded-xl p-1">
        {windows.map((w) => (
          <button
            key={w}
            onClick={() => setWindow(w)}
            className={cn(
              "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
              w === window
                ? "bg-finn-accent/15 text-finn-accent"
                : "text-finn-muted hover:text-finn-text"
            )}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Material cards */}
      <section className="space-y-3">
        <AnimatePresence mode="popLayout">
          {mockMaterial.map((card) => (
            <MaterialCard key={card.id} card={card} />
          ))}
        </AnimatePresence>
      </section>

      {/* Medium items */}
      {mockMedium.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-finn-muted uppercase tracking-wider">
            Also noted
          </h3>
          {mockMedium.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-3 py-2.5 border-b border-finn-border-subtle last:border-0"
            >
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5",
                categoryMeta[item.category]?.color || "text-finn-muted",
                "bg-finn-surface"
              )}>
                {item.symbol}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-finn-text leading-snug">{item.one_liner}</p>
                <p className="text-[11px] text-finn-muted mt-0.5">
                  {categoryMeta[item.category]?.label} · {timeAgo(item.filed_at)}
                </p>
              </div>
            </motion.div>
          ))}
        </section>
      )}

      {/* Routine collapsed group */}
      <section>
        <button
          onClick={() => setRoutineOpen(!routineOpen)}
          className="flex items-center gap-2 w-full py-3 text-xs text-finn-muted hover:text-finn-text transition-colors"
        >
          {routineOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="font-medium">Routine (12)</span>
          <span className="text-finn-muted">· ESOP allotments, trading window closures, compliance</span>
        </button>
        <AnimatePresence>
          {routineOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <p className="text-xs text-finn-muted py-4 text-center">
                12 routine filings collapsed. Expand in full view →
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
