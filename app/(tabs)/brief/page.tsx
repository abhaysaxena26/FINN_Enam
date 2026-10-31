"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, Check, FileText, UserMinus, UserCheck } from "lucide-react";
import { cn, formatINR, formatPct, timeAgo } from "@/lib/utils";
import { api } from "@/lib/api";
import { DigestResponse, DigestCard, DigestItem } from "@/lib/types";

type TimeWindow = "24h" | "3d" | "7d" | "30d";

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
  earnings_call: { color: "text-teal-400", label: "Earnings Call" },
  unclassified: { color: "text-finn-muted", label: "Routine" },
};

/* Rich Quarterly Results Card */
function ResultsCard({ card }: { card: DigestCard }) {
  const p = card.card_payload as {
    period: string;
    type: string;
    is_bank?: boolean;
    metrics: Array<{ label: string; current: number; qoq: number; yoy: number; unit: string; derived?: boolean }>;
    margins: { ebitda: number; ebitda_change_bps: number; pat: number; pat_change_bps: number; note?: string };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-finn-accent/10 text-finn-accent">
            {card.symbol}
          </span>
          <span className="text-xs text-finn-muted font-medium">
            {p?.period || "Q2 FY27"} · {p?.type || "Consolidated"}
          </span>
        </div>
        <span className="text-[11px] text-finn-muted tabular-nums">
          {timeAgo(card.filed_at)}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-finn-text">{card.company}</p>
        <p className="text-[13px] text-finn-muted mt-0.5 leading-snug">
          {card.one_liner || card.headline}
        </p>
      </div>

      {/* Mini 4-row Results Table */}
      {p?.metrics && (
        <div className="rounded-xl bg-finn-bg/60 border border-finn-border-subtle overflow-hidden">
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
              {p.metrics.map((m) => (
                <tr key={m.label} className="border-b border-finn-border-subtle last:border-0">
                  <td className="py-2 px-3 text-finn-text font-medium">
                    {m.label}
                    {m.derived && <span className="text-finn-muted ml-1 text-[10px]">*</span>}
                  </td>
                  <td className="py-2 px-3 text-right text-finn-text">
                    ₹{m.current.toLocaleString("en-IN")} {m.unit}
                  </td>
                  <td className={cn("py-2 px-3 text-right font-medium", m.qoq >= 0 ? "text-finn-gain" : "text-finn-loss")}>
                    {m.qoq >= 0 ? "▲" : "▼"} {Math.abs(m.qoq).toFixed(1)}%
                  </td>
                  <td className={cn("py-2 px-3 text-right font-medium", m.yoy >= 0 ? "text-finn-gain" : "text-finn-loss")}>
                    {m.yoy >= 0 ? "▲" : "▼"} {Math.abs(m.yoy).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Margin line chips */}
      {p?.margins && (
        <div className="flex flex-wrap gap-2 pt-0.5">
          <span className={cn(
            "text-[11px] px-2 py-1 rounded-md",
            p.margins.ebitda_change_bps >= 0 ? "bg-finn-gain-bg text-finn-gain" : "bg-finn-loss-bg text-finn-loss"
          )}>
            EBITDA Margin {p.margins.ebitda}% ({p.margins.ebitda_change_bps >= 0 ? "+" : ""}{p.margins.ebitda_change_bps} bps)
          </span>
          <span className={cn(
            "text-[11px] px-2 py-1 rounded-md",
            p.margins.pat_change_bps >= 0 ? "bg-finn-gain-bg text-finn-gain" : "bg-finn-loss-bg text-finn-loss"
          )}>
            PAT Margin {p.margins.pat}% ({p.margins.pat_change_bps >= 0 ? "+" : ""}{p.margins.pat_change_bps} bps)
          </span>
          {p.margins.note && (
            <span className="text-[10px] text-finn-muted w-full">
              {p.margins.note}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-finn-border-subtle">
        <span className="text-[10px] text-finn-muted">Primary BSE Results Filing</span>
        {card.attachment_url && (
          <a
            href={card.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-finn-accent flex items-center gap-1 hover:underline"
          >
            Original PDF <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* Rich Management Change Card */
function ManagementChangeCard({ card }: { card: DigestCard }) {
  const p = card.card_payload as {
    person: string;
    role: string;
    change: string;
    effective_date: string;
    reason: string;
    successor_named: boolean;
    bio: string;
  };

  const isResignation = p?.change === "resigned" || p?.change === "retired";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400">
            {card.symbol}
          </span>
          <span className={cn(
            "text-xs px-2 py-0.5 rounded-md font-medium",
            isResignation ? "bg-finn-loss-bg text-finn-loss" : "bg-finn-gain-bg text-finn-gain"
          )}>
            {p?.change ? p.change.toUpperCase() : "MANAGEMENT CHANGE"}
          </span>
        </div>
        <span className="text-[11px] text-finn-muted tabular-nums">
          {timeAgo(card.filed_at)}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-finn-text">{card.company}</p>
        <p className="text-[13px] text-finn-text mt-1">
          {isResignation ? (
            <UserMinus size={14} className="inline mr-1 text-amber-400" />
          ) : (
            <UserCheck size={14} className="inline mr-1 text-finn-accent" />
          )}
          <span className="font-semibold">{p?.person || "Key Executive"}</span>
          <span className="text-finn-muted"> · {p?.role || "Management"}</span>
        </p>
      </div>

      {/* Bio / Background */}
      {p?.bio && (
        <div className="rounded-xl bg-finn-bg/60 border border-finn-border-subtle p-3">
          <p className="text-xs text-finn-muted leading-relaxed">{p.bio}</p>
        </div>
      )}

      {/* Details metadata */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-finn-muted pt-1">
        {p?.effective_date && (
          <span>Effective: {new Date(p.effective_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        )}
        {p?.reason && <span>Reason: {p.reason}</span>}
        {isResignation && (
          <span className={p.successor_named ? "text-finn-gain" : "text-finn-amber"}>
            {p.successor_named ? "Successor named" : "No successor named"}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-finn-border-subtle">
        <span className="text-[10px] text-finn-muted">SEBI Regulation 30 Filing</span>
        {card.attachment_url && (
          <a
            href={card.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-finn-accent flex items-center gap-1 hover:underline"
          >
            Filing PDF <ArrowUpRight size={12} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* Generic Material Card */
function GenericMaterialCard({ card }: { card: DigestCard }) {
  const meta = categoryMeta[card.category] || { color: "text-finn-accent", label: card.category };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="card space-y-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-finn-accent/10 text-finn-accent">
            {card.symbol}
          </span>
          <span className={cn("text-xs font-medium", meta.color)}>
            {meta.label}
          </span>
        </div>
        <span className="text-[11px] text-finn-muted tabular-nums">
          {timeAgo(card.filed_at)}
        </span>
      </div>

      <div>
        <p className="text-sm font-semibold text-finn-text">{card.company}</p>
        <p className="text-[13px] text-finn-muted mt-1 leading-snug">
          {card.one_liner || card.headline}
        </p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-finn-border-subtle">
        <span className="text-[10px] text-finn-muted">Priority {card.materiality ? `${card.materiality}★` : "High"}</span>
        {card.attachment_url ? (
          <a
            href={card.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-finn-accent flex items-center gap-1 hover:underline"
          >
            Filing PDF <ArrowUpRight size={12} />
          </a>
        ) : (
          <span className="text-[10px] text-finn-muted">Exchange Filing</span>
        )}
      </div>
    </motion.div>
  );
}

function MaterialCardRouter({ card }: { card: DigestCard }) {
  if (card.card_type === "results" && card.card_payload?.metrics) {
    return <ResultsCard card={card} />;
  }
  if (card.card_type === "management_change" && card.card_payload) {
    return <ManagementChangeCard card={card} />;
  }
  return <GenericMaterialCard card={card} />;
}

export default function BriefPage() {
  const [window, setWindow] = useState<TimeWindow>("24h");
  const [data, setData] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [routineOpen, setRoutineOpen] = useState(false);

  const windows: TimeWindow[] = ["24h", "3d", "7d", "30d"];

  useEffect(() => {
    setLoading(true);
    api<DigestResponse>("/digest", { params: { window } })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load digest:", err);
        setLoading(false);
      });
  }, [window]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  })();

  const material = data?.material || [];
  const medium = data?.medium || [];
  const routine = data?.routine || { count: 0, summary: "ESOPs, compliance certificates, trading windows", items: [] };

  return (
    <div className="px-4 sm:px-6 pt-5 sm:pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-finn-text">{greeting}</h1>
          <p className="text-xs sm:text-sm text-finn-muted mt-0.5">
            <span className="text-finn-accent font-semibold">
              {material.length > 0 ? `${material.length} key items` : "Your brief"}
            </span>{" "}
            ranked by investor materiality
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-finn-surface border border-finn-border text-xs text-finn-muted">
          <span className="w-2 h-2 rounded-full bg-finn-accent animate-pulse" />
          <span>NSE Corporate Filings Feed</span>
        </div>
      </div>

      {/* Time window selector */}
      <div className="flex gap-1.5 bg-finn-surface/90 border border-finn-border p-1 rounded-xl">
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
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 w-full" />
          ))}
        </div>
      ) : material.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-sm font-medium text-finn-text">All caught up ✓</p>
          <p className="text-xs text-finn-muted mt-1">
            No material filings detected in this window.
          </p>
        </div>
      ) : (
        <section className="space-y-3">
          <AnimatePresence mode="popLayout">
            {material.map((card) => (
              <MaterialCardRouter key={card.id} card={card} />
            ))}
          </AnimatePresence>
        </section>
      )}

      {/* Medium items */}
      {!loading && medium.length > 0 && (
        <section className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold text-finn-muted uppercase tracking-wider">
            Also Noted ({medium.length})
          </h3>
          <div className="space-y-1">
            {medium.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start gap-3 py-2.5 border-b border-finn-border-subtle last:border-0"
              >
                <span
                  className={cn(
                    "text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 mt-0.5 bg-finn-surface",
                    categoryMeta[item.category]?.color || "text-finn-muted"
                  )}
                >
                  {item.symbol}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-finn-text leading-snug">
                    {item.one_liner || item.headline}
                  </p>
                  <p className="text-[11px] text-finn-muted mt-0.5">
                    {categoryMeta[item.category]?.label || item.category} ·{" "}
                    {timeAgo(item.filed_at)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Routine collapsed group */}
      {!loading && routine.count > 0 && (
        <section className="pt-2">
          <button
            onClick={() => setRoutineOpen(!routineOpen)}
            className="flex items-center gap-2 w-full py-3 text-xs text-finn-muted hover:text-finn-text transition-colors"
          >
            {routineOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <span className="font-semibold text-finn-text">Routine ({routine.count})</span>
            <span className="text-finn-muted truncate">
              · {routine.summary}
            </span>
          </button>
          <AnimatePresence>
            {routineOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-2 overflow-hidden pb-4"
              >
                {routine.items.slice(0, 10).map((r) => (
                  <div
                    key={r.id}
                    className="text-[12px] text-finn-muted py-1.5 border-b border-finn-border-subtle last:border-0 flex items-center justify-between gap-2"
                  >
                    <span className="font-medium text-finn-text shrink-0">{r.symbol}</span>
                    <span className="truncate flex-1">{r.headline}</span>
                    <span className="shrink-0 text-[10px]">{timeAgo(r.filed_at)}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
}
