"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, ArrowUpRight, Check, FileText, UserMinus } from "lucide-react";
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

function MaterialCardComponent({ card }: { card: DigestCard }) {
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
        <span className="text-[10px] text-finn-muted">
          Priority {card.materiality ? `${card.materiality}★` : "High"}
        </span>
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
    <div className="px-4 pt-14 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-finn-text">{greeting}</h1>
        <p className="text-sm text-finn-muted mt-1">
          <span className="text-finn-accent font-semibold">
            {material.length > 0 ? `${material.length} material items` : "Your brief"}
          </span>{" "}
          across your portfolio
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
              <MaterialCardComponent key={card.id} card={card} />
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
