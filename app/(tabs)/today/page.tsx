"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Check,
  Calendar,
  ArrowUpRight,
  ExternalLink,
  Info,
  Sparkles,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { cn, timeAgo, formatIndianNumber, cleanFilingText } from "@/lib/utils";
import { api } from "@/lib/api";
import { DigestCard, DigestItem } from "@/lib/types";

type TimeWindow = "24h" | "3d" | "7d" | "30d" | "custom";

interface MarketIndex {
  symbol: string;
  name: string;
  level: number;
  day_change: number;
  day_change_pct: number;
  sparkline: number[];
}

export default function TodayPage() {
  const [window, setWindow] = useState<TimeWindow>("24h");
  const [digest, setDigest] = useState<any>(null);
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

  // Interactive UI state
  const [showInsightMovers, setShowInsightMovers] = useState(false);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());
  const [whyOpenMap, setWhyOpenMap] = useState<Record<string, boolean>>({});
  const [routineOpen, setRoutineOpen] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  // Custom Date Picker Bottom Sheet state
  const [customSheetOpen, setCustomSheetOpen] = useState(false);
  const [fromDate, setFromDate] = useState("2026-10-15");
  const [toDate, setToDate] = useState("2026-11-03");

  // Load indices & digest
  useEffect(() => {
    // 1. Fetch indices
    fetch("/api/indices")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.indices) setIndices(data.indices);
      })
      .catch(() => {});

    // 2. Fetch portfolio for insight line
    fetch("/api/portfolio")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setPortfolioSummary(data);
      })
      .catch(() => {});

    // 3. Fetch digest
    loadDigest(window);
  }, [window]);

  const loadDigest = async (win: TimeWindow) => {
    setLoading(true);
    try {
      const data = await api<any>(`/digest?window=${win === "custom" ? "30d" : win}`);
      setDigest(data);
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const markSeen = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSeenIds((prev) => new Set([...prev, id]));
  };

  const toggleExpandResult = (id: string) => {
    setExpandedResults((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleWhy = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWhyOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Filter out seen items from Needs Attention
  const rawMaterial: DigestCard[] = digest?.material || [];
  const needsAttention = rawMaterial.filter((c) => !seenIds.has(c.id));
  const otherUpdates: DigestItem[] = (digest?.medium || []).filter((it: any) => !seenIds.has(it.id));
  const upcomingList = digest?.upcoming || [];
  const routine = digest?.routine || { count: 0, items: [] };

  // Generate plain-English headline from numbers
  const getPlainEnglishHeadline = (card: DigestCard): string => {
    const p = card.card_payload as any;
    if (card.category === "results" && p?.metrics) {
      const rev = p.metrics.find((m: any) => m.label === "Revenue" || m.label === "Net Interest Income");
      const pat = p.metrics.find((m: any) => m.label === "PAT");
      if (rev && pat) {
        const revSign = rev.yoy >= 0 ? "+" : "−";
        const patSign = pat.yoy >= 0 ? "+" : "−";
        if (rev.yoy >= 0 && pat.yoy < 0) {
          return `Revenue ${revSign}${Math.abs(rev.yoy).toFixed(1)}% YoY, but PAT ${patSign}${Math.abs(pat.yoy).toFixed(1)}% on margin pressure`;
        }
        if (rev.yoy >= 0 && pat.yoy >= 0) {
          return `Revenue ${revSign}${Math.abs(rev.yoy).toFixed(1)}% YoY and PAT ${patSign}${Math.abs(pat.yoy).toFixed(1)}% YoY`;
        }
        return `Revenue ${revSign}${Math.abs(rev.yoy).toFixed(1)}% YoY, PAT ${patSign}${Math.abs(pat.yoy).toFixed(1)}% YoY`;
      }
    }
    if (card.category === "management_change" && p) {
      return `${p.role || "Executive"} ${p.person} ${p.change || "transition"}, effective ${p.effective_date || "Oct 2026"}`;
    }
    return cleanFilingText(card.one_liner || card.headline);
  };

  // Market + portfolio insight line
  const nifty = indices.find((idx) => idx.name === "NIFTY 50");
  const niftyChg = nifty?.day_change_pct ?? 1.68;
  const portChg = portfolioSummary?.day_pnl_pct ?? 0.57;
  const holdings = portfolioSummary?.holdings || [];
  const sortedHoldings = [...holdings].sort((a, b) => b.day_change_pct - a.day_change_pct);
  const topMover = sortedHoldings[0] || { symbol: "TRENT", day_change_pct: 5.4 };
  const topGainers = sortedHoldings.slice(0, 3);
  const topLosers = sortedHoldings.slice(-3).reverse();

  return (
    <div className="flex-1 p-4 pb-24 space-y-4">
      {/* 1. Market Strip: Scrollable 4 index tiles */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
        <div className="flex gap-2.5 min-w-max">
          {(indices.length > 0
            ? indices
            : [
                { symbol: "^NSEI", name: "NIFTY 50", level: 23440.8, day_change: 387.7, day_change_pct: 1.68, sparkline: [23000, 23200, 23440] },
                { symbol: "^BSESN", name: "SENSEX", level: 75692.78, day_change: 1233.25, day_change_pct: 1.66, sparkline: [74000, 74800, 75692] },
                { symbol: "^NSEBANK", name: "BANK NIFTY", level: 55002.2, day_change: 315.25, day_change_pct: 0.58, sparkline: [54500, 54800, 55002] },
                { symbol: "^CNXIT", name: "NIFTY IT", level: 32442.5, day_change: -164.4, day_change_pct: -0.5, sparkline: [32600, 32500, 32442] },
              ]
          ).map((idx) => {
            const isGain = idx.day_change_pct >= 0;
            const minVal = Math.min(...(idx.sparkline || [1]));
            const maxVal = Math.max(...(idx.sparkline || [1]));
            const range = maxVal - minVal || 1;
            const pts = (idx.sparkline || [])
              .map((val, i, arr) => {
                const x = (i / (arr.length - 1)) * 48;
                const y = 20 - ((val - minVal) / range) * 16;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              })
              .join(" ");

            return (
              <div
                key={idx.symbol}
                className="w-[140px] p-2.5 rounded-xl bg-finn-surface border border-[#23272F] flex flex-col justify-between shrink-0"
              >
                <div className="flex justify-between items-start">
                  <span className="text-[11px] text-finn-muted uppercase tracking-wider font-medium">
                    {idx.name}
                  </span>
                  {/* Mini sparkline */}
                  <svg width="48" height="22" className="overflow-visible">
                    <polyline
                      fill="none"
                      stroke={isGain ? "#22C55E" : "#EF4444"}
                      strokeWidth="1.5"
                      points={pts}
                    />
                  </svg>
                </div>
                <div className="mt-1">
                  <div className="text-[16px] font-semibold text-white tabular-nums tracking-tight">
                    ₹{formatIndianNumber(idx.level)}
                  </div>
                  <div
                    className={cn(
                      "text-[11px] font-medium tabular-nums flex items-center gap-0.5",
                      isGain ? "text-finn-gain" : "text-finn-loss"
                    )}
                  >
                    <span>{isGain ? "▲" : "▼"}</span>
                    <span>{Math.abs(idx.day_change_pct).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Market + Portfolio Insight Line (Computed in code, no LLM) */}
      <div
        onClick={() => setShowInsightMovers(!showInsightMovers)}
        className="card p-3 cursor-pointer hover:border-[#2DD4BF]/50 transition-colors"
      >
        <div className="flex items-center justify-between text-xs">
          <p className="text-white leading-relaxed">
            Your portfolio{" "}
            <span className={portChg >= 0 ? "text-finn-gain font-semibold" : "text-finn-loss font-semibold"}>
              {portChg >= 0 ? "+" : "−"}{Math.abs(portChg).toFixed(1)}%
            </span>{" "}
            vs NIFTY{" "}
            <span className={niftyChg >= 0 ? "text-finn-gain font-semibold" : "text-finn-loss font-semibold"}>
              {niftyChg >= 0 ? "+" : "−"}{Math.abs(niftyChg).toFixed(1)}%
            </span>
            . Top mover: <span className="font-semibold text-white">{topMover.symbol}</span>{" "}
            <span className={topMover.day_change_pct >= 0 ? "text-finn-gain" : "text-finn-loss"}>
              +{topMover.day_change_pct.toFixed(1)}%
            </span>
            .
          </p>
          <ChevronDown
            size={14}
            className={`text-finn-muted shrink-0 ml-2 transition-transform ${showInsightMovers ? "rotate-180" : ""}`}
          />
        </div>

        {/* Expandable top 3 gainers & losers */}
        {showInsightMovers && (
          <div className="mt-2.5 pt-2.5 border-t border-[#23272F] grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-[10px] uppercase text-finn-muted font-semibold block mb-1">Top Gainers</span>
              {topGainers.map((g) => (
                <div key={g.symbol} className="flex justify-between py-0.5">
                  <span className="text-white font-medium">{g.symbol}</span>
                  <span className="text-finn-gain font-semibold tabular-nums">+{g.day_change_pct.toFixed(1)}%</span>
                </div>
              ))}
            </div>
            <div>
              <span className="text-[10px] uppercase text-finn-muted font-semibold block mb-1">Lagging</span>
              {topLosers.map((l) => (
                <div key={l.symbol} className="flex justify-between py-0.5">
                  <span className="text-white font-medium">{l.symbol}</span>
                  <span className={l.day_change_pct >= 0 ? "text-finn-gain font-semibold tabular-nums" : "text-finn-loss font-semibold tabular-nums"}>
                    {l.day_change_pct >= 0 ? "+" : ""}{l.day_change_pct.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Time Window Selector (Segmented control: 24h · 3d · 7d · 30d · Custom) */}
      <div className="flex items-center justify-between gap-1 bg-[#14171C] p-1 rounded-xl border border-[#23272F] h-9">
        {(["24h", "3d", "7d", "30d"] as const).map((w) => (
          <button
            key={w}
            onClick={() => setWindow(w)}
            className={cn(
              "flex-1 h-7 rounded-lg text-xs font-medium transition-all text-center flex items-center justify-center",
              window === w
                ? "bg-[#23272F] text-white font-semibold"
                : "text-finn-muted hover:text-white"
            )}
          >
            {w}
          </button>
        ))}
        <button
          onClick={() => {
            setWindow("custom");
            setCustomSheetOpen(true);
          }}
          className={cn(
            "flex-1 h-7 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1",
            window === "custom"
              ? "bg-[#23272F] text-white font-semibold"
              : "text-finn-muted hover:text-white"
          )}
        >
          <Calendar size={11} />
          <span>Custom</span>
        </button>
      </div>

      {/* 4. Section: Needs Attention (N) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-[13px] font-semibold text-white uppercase tracking-wider">
            Needs Attention ({needsAttention.length})
          </h2>
          <span className="text-[11px] text-finn-muted">Swipe or tap ✓ to dismiss</span>
        </div>

        {needsAttention.length === 0 ? (
          <div className="card p-6 text-center space-y-2">
            <div className="w-8 h-8 rounded-full bg-[#2DD4BF]/10 text-[#2DD4BF] flex items-center justify-center mx-auto">
              <Check size={18} />
            </div>
            <p className="text-sm font-semibold text-white">You&apos;re all caught up</p>
            <p className="text-xs text-finn-muted">No pending material items requiring immediate action.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            <AnimatePresence>
              {needsAttention.map((card) => {
                const p = card.card_payload as any;
                const isResult = card.category === "results";
                const isMgmt = card.category === "management_change";
                const isExpanded = expandedResults.has(card.id);
                const isWhyOpen = whyOpenMap[card.id] || false;

                // Revenue and PAT metrics for chips
                const rev = p?.metrics?.find((m: any) => m.label === "Revenue" || m.label === "Net Interest Income");
                const pat = p?.metrics?.find((m: any) => m.label === "PAT");

                return (
                  <motion.div
                    key={card.id}
                    layout
                    initial={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, x: 100, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.2 }}
                    className="card space-y-2.5 relative overflow-hidden"
                  >
                    {/* Top Row: TICKER (bold) · Category · Time · Dismiss ✓ */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white tracking-wide text-sm">{card.symbol}</span>
                        <span className="text-finn-muted">·</span>
                        <span className="text-[11px] uppercase tracking-wider text-finn-muted font-medium">
                          {card.category.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-finn-muted tabular-nums">
                          {timeAgo(card.filed_at)}
                        </span>
                        <button
                          onClick={(e) => markSeen(card.id, e)}
                          className="w-5 h-5 rounded-full hover:bg-[#23272F] text-finn-muted hover:text-white flex items-center justify-center transition-colors"
                          title="Mark as seen"
                        >
                          <Check size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Plain-English Headline */}
                    <p className="text-xs font-medium text-white leading-snug">
                      {getPlainEnglishHeadline(card)}
                    </p>

                    {/* Results Card: Collapsed 2 chips by default */}
                    {isResult && p?.metrics && (
                      <div className="space-y-2">
                        <div
                          onClick={() => toggleExpandResult(card.id)}
                          className="flex items-center justify-between cursor-pointer py-1"
                        >
                          <div className="flex items-center gap-2">
                            {rev && (
                              <span className={cn(
                                "text-[11px] px-2 py-0.5 rounded font-medium tabular-nums",
                                rev.yoy >= 0 ? "bg-finn-gain/10 text-finn-gain border border-finn-gain/30" : "bg-finn-loss/10 text-finn-loss border border-finn-loss/30"
                              )}>
                                Revenue {rev.yoy >= 0 ? "▲" : "▼"}{Math.abs(rev.yoy).toFixed(1)}%
                              </span>
                            )}
                            {pat && (
                              <span className={cn(
                                "text-[11px] px-2 py-0.5 rounded font-medium tabular-nums",
                                pat.yoy >= 0 ? "bg-finn-gain/10 text-finn-gain border border-finn-gain/30" : "bg-finn-loss/10 text-finn-loss border border-finn-loss/30"
                              )}>
                                PAT {pat.yoy >= 0 ? "▲" : "▼"}{Math.abs(pat.yoy).toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-[11px] text-finn-muted hover:text-white">
                            <span>{isExpanded ? "Collapse" : "Table"}</span>
                            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                          </div>
                        </div>

                        {/* Expanded 4-row results table */}
                        {isExpanded && (
                          <div className="pt-2 border-t border-[#23272F] space-y-2">
                            <table className="w-full text-[11px] tabular-nums table-fixed">
                              <thead>
                                <tr className="text-finn-muted border-b border-[#23272F]">
                                  <th className="text-left pb-1 font-normal text-[10px] w-[28%]">Metric</th>
                                  <th className="text-right pb-1 font-normal text-[10px] w-[32%]">Value</th>
                                  <th className="text-right pb-1 font-normal text-[10px] w-[20%]">QoQ</th>
                                  <th className="text-right pb-1 font-normal text-[10px] w-[20%]">YoY</th>
                                </tr>
                              </thead>
                              <tbody>
                                {p.metrics.map((m: any) => (
                                  <tr key={m.label} className="border-b border-[#23272F]/50 last:border-0">
                                    <td className="py-1.5 text-white font-medium">{m.label}</td>
                                    <td className="py-1.5 text-right text-white">
                                      ₹{formatIndianNumber(m.current)} {m.unit}
                                    </td>
                                    <td className={cn("py-1.5 text-right font-medium", m.qoq >= 0 ? "text-finn-gain" : "text-finn-loss")}>
                                      {m.qoq >= 0 ? "▲" : "▼"} {Math.abs(m.qoq).toFixed(1)}%
                                    </td>
                                    <td className={cn("py-1.5 text-right font-medium", m.yoy >= 0 ? "text-finn-gain" : "text-finn-loss")}>
                                      {m.yoy >= 0 ? "▲" : "▼"} {Math.abs(m.yoy).toFixed(1)}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {p.margins && (
                              <div className="text-[10px] text-finn-muted pt-1">
                                EBITDA margin {p.margins.ebitda}% ({p.margins.ebitda_change_bps >= 0 ? "+" : ""}{p.margins.ebitda_change_bps} bps) · PAT margin {p.margins.pat}% ({p.margins.pat_change_bps >= 0 ? "+" : ""}{p.margins.pat_change_bps} bps)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Management Change Card: Visible 2-line background */}
                    {isMgmt && p && (
                      <div className="p-2.5 rounded-lg bg-finn-surface border border-[#23272F] space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">
                            {p.person} · <span className="text-finn-muted">{p.role}</span>
                          </span>
                          <span className={cn(
                            "text-[10px] px-1.5 py-0.5 rounded font-medium uppercase",
                            p.change === "appointed" ? "bg-finn-gain/10 text-finn-gain" : "bg-[#23272F] text-finn-muted"
                          )}>
                            {p.change}
                          </span>
                        </div>
                        <p className="text-[11px] text-finn-muted leading-relaxed">
                          {p.bio}
                        </p>
                        {p.reason && (
                          <div className="text-[10px] text-finn-muted pt-1 border-t border-[#23272F]/50 flex justify-between">
                            <span>Reason: {p.reason}</span>
                            <span>Effective: {p.effective_date}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer: "Why this?" + "Filing ↗" */}
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#23272F]/50">
                      <button
                        onClick={(e) => toggleWhy(card.id, e)}
                        className="text-finn-muted hover:text-white transition-colors flex items-center gap-1"
                      >
                        <span>Why this?</span>
                        <ChevronDown size={11} className={`transition-transform ${isWhyOpen ? "rotate-180" : ""}`} />
                      </button>

                      {card.attachment_url && (
                        <a
                          href={card.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-finn-muted hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <span>Filing</span>
                          <ArrowUpRight size={11} />
                        </a>
                      )}
                    </div>

                    {/* Expandable Why This explanation */}
                    {isWhyOpen && (
                      <div className="p-2 rounded bg-finn-surface border border-[#23272F] text-[11px] text-finn-muted">
                        {card.category === "results"
                          ? "Quarterly financial results filing directly impacting valuation and consensus forecasts."
                          : card.category === "management_change"
                          ? "Key managerial personnel (KMP) transition impacting governance and operational execution."
                          : "High-materiality corporate event flagged by investor sensitivity rules."}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* 5. Section: Upcoming Board Meetings (Next 14 Days) */}
      {upcomingList.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="text-[13px] font-semibold text-white uppercase tracking-wider">
              Upcoming ({upcomingList.length})
            </h2>
            {upcomingList.length > 5 && (
              <button
                onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                className="text-[11px] text-finn-muted hover:text-white"
              >
                {showAllUpcoming ? "Show less" : "See all"}
              </button>
            )}
          </div>

          <div className="card divide-y divide-[#23272F] p-0 overflow-hidden">
            {(showAllUpcoming ? upcomingList : upcomingList.slice(0, 5)).map((item: any) => (
              <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="text-[11px] text-finn-muted font-medium w-18 shrink-0 tabular-nums">
                    {item.date}
                  </span>
                  <span className="font-semibold text-white">{item.symbol}</span>
                </div>
                <span className="text-[11px] text-finn-muted truncate max-w-[170px] text-right">
                  {item.purpose}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 6. Section: Other Updates (N) - Compact single lines */}
      {otherUpdates.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-[13px] font-semibold text-white uppercase tracking-wider px-0.5">
            Other Updates ({otherUpdates.length})
          </h2>
          <div className="card divide-y divide-[#23272F] p-0 overflow-hidden">
            {otherUpdates.slice(0, 8).map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-semibold text-white shrink-0">{item.symbol}</span>
                  <span className="text-finn-muted truncate">
                    {cleanFilingText(item.one_liner || item.headline)}
                  </span>
                </div>
                <span className="text-[10px] text-finn-muted shrink-0 tabular-nums">
                  {timeAgo(item.filed_at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 7. Section: Routine (N) - Collapsed into one row */}
      <section>
        <button
          onClick={() => setRoutineOpen(!routineOpen)}
          className="w-full card p-3 flex items-center justify-between text-xs hover:border-[#23272F] transition-colors"
        >
          <div className="flex items-center gap-2 text-finn-muted">
            <span className="font-medium text-white">{routine.count} routine filings</span>
            <span>·</span>
            <span className="text-[11px]">trading windows, compliances</span>
          </div>
          <ChevronDown
            size={14}
            className={`text-finn-muted transition-transform ${routineOpen ? "rotate-180" : ""}`}
          />
        </button>

        {routineOpen && (
          <div className="card mt-1.5 divide-y divide-[#23272F] p-0 overflow-hidden text-xs">
            {routine.items.map((it: any) => (
              <div key={it.id} className="p-2.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="font-medium text-white shrink-0">{it.symbol}</span>
                  <span className="text-finn-muted truncate text-[11px]">{it.one_liner || it.headline}</span>
                </div>
                <span className="text-[10px] text-finn-muted shrink-0 tabular-nums">{timeAgo(it.filed_at)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Custom Date Range Picker Bottom Sheet */}
      {customSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[430px] bg-[#14171C] border-t border-[#23272F] rounded-t-2xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Select Custom Date Range</span>
              <button onClick={() => setCustomSheetOpen(false)} className="text-finn-muted hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-finn-muted block mb-1">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#23272F] rounded-lg p-2 text-white"
                />
              </div>
              <div>
                <label className="text-finn-muted block mb-1">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-[#0B0D10] border border-[#23272F] rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setCustomSheetOpen(false);
                loadDigest("custom");
              }}
              className="w-full py-2.5 rounded-xl bg-[#2DD4BF] text-black font-semibold text-xs hover:opacity-90"
            >
              Apply Filter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
