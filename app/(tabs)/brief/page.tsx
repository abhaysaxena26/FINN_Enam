"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ArrowUpRight } from "lucide-react";
import { cn, timeAgo, formatIndianNumber, cleanFilingText } from "@/lib/utils";
import { api } from "@/lib/api";
import { DigestResponse, DigestCard, DigestItem } from "@/lib/types";

type TimeWindow = "24h" | "3d" | "7d" | "30d";

/* 1. Results Card */
function ResultsCard({ card }: { card: DigestCard }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const p = card.card_payload as {
    period: string;
    type: string;
    metrics: Array<{ label: string; current: number; qoq: number; yoy: number; unit: string; derived?: boolean }>;
    margins: { ebitda: number; ebitda_change_bps: number; pat: number; pat_change_bps: number };
  };

  return (
    <div className="card space-y-3">
      {/* Top row: Ticker + Q2 FY27 results + Time */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-wide">{card.symbol}</span>
          <span className="text-finn-muted">·</span>
          <span className="text-finn-muted">{p?.period || "Q2 FY27"} results</span>
        </div>
        <span className="text-[11px] text-finn-muted tabular-nums">
          {timeAgo(card.filed_at)}
        </span>
      </div>

      {/* 4-row Results Table (drop header background) */}
      {p?.metrics && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-finn-muted border-b border-[#23272F]">
                <th className="text-left pb-1.5 font-normal text-[11px]">Metric</th>
                <th className="text-right pb-1.5 font-normal text-[11px]">Value</th>
                <th className="text-right pb-1.5 font-normal text-[11px]">QoQ</th>
                <th className="text-right pb-1.5 font-normal text-[11px]">YoY</th>
              </tr>
            </thead>
            <tbody>
              {p.metrics.map((m) => (
                <tr key={m.label} className="border-b border-[#23272F]/60 last:border-0">
                  <td className="py-2 text-white font-medium">{m.label}</td>
                  <td className="py-2 text-right text-white">
                    ₹{formatIndianNumber(m.current)} {m.unit}
                  </td>
                  <td className={cn("py-2 text-right font-medium", m.qoq >= 0 ? "text-finn-gain" : "text-finn-loss")}>
                    {m.qoq >= 0 ? "▲" : "▼"} {Math.abs(m.qoq).toFixed(1)}%
                  </td>
                  <td className={cn("py-2 text-right font-medium", m.yoy >= 0 ? "text-finn-gain" : "text-finn-loss")}>
                    {m.yoy >= 0 ? "▲" : "▼"} {Math.abs(m.yoy).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Margins: one small grey line */}
      {p?.margins && (
        <p className="text-[11px] text-finn-muted">
          EBITDA margin {p.margins.ebitda}% ({p.margins.ebitda_change_bps >= 0 ? "+" : ""}{p.margins.ebitda_change_bps} bps) · PAT margin {p.margins.pat}% ({p.margins.pat_change_bps >= 0 ? "+" : ""}{p.margins.pat_change_bps} bps)
        </p>
      )}

      {/* Footer: Why this? + BSE filing link */}
      <div className="flex items-center justify-between pt-2 border-t border-[#23272F] text-[11px]">
        <button
          onClick={() => setWhyOpen(!whyOpen)}
          className="text-finn-muted hover:text-white transition-colors"
        >
          Why this?
        </button>
        {card.attachment_url && (
          <a
            href={card.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-finn-accent hover:underline flex items-center gap-0.5"
          >
            <span>BSE filing</span>
            <ArrowUpRight size={11} />
          </a>
        )}
      </div>

      {whyOpen && (
        <div className="p-2 rounded bg-finn-bg text-[11px] text-finn-muted border border-[#23272F]">
          Results · high priority · 9% of portfolio
        </div>
      )}
    </div>
  );
}

/* 2. Management Change Card */
function ManagementChangeCard({ card }: { card: DigestCard }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const p = card.card_payload as {
    person: string;
    role: string;
    change: string;
    effective_date: string;
    bio?: string;
  };

  const isResignation = p?.change === "resigned" || p?.change === "retired";

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-wide">{card.symbol}</span>
          <span className="text-finn-muted">·</span>
          <span className="text-finn-muted">Management change</span>
        </div>
        <span className="text-[11px] text-finn-muted tabular-nums">
          {timeAgo(card.filed_at)}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-white">
          {p?.person ? `${p.person} (${p.role})` : card.one_liner}
        </p>
        <p className="text-xs text-finn-muted">
          {isResignation ? "Stepping down" : "Appointed"} · Effective {p?.effective_date || "immediately"}
        </p>
        {p?.bio && <p className="text-xs text-finn-muted pt-1">{p.bio}</p>}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#23272F] text-[11px]">
        <button
          onClick={() => setWhyOpen(!whyOpen)}
          className="text-finn-muted hover:text-white transition-colors"
        >
          Why this?
        </button>
        {card.attachment_url && (
          <a
            href={card.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-finn-accent hover:underline flex items-center gap-0.5"
          >
            <span>BSE filing</span>
            <ArrowUpRight size={11} />
          </a>
        )}
      </div>

      {whyOpen && (
        <div className="p-2 rounded bg-finn-bg text-[11px] text-finn-muted border border-[#23272F]">
          Executive transition · key decision-maker · material filing
        </div>
      )}
    </div>
  );
}

/* 3. Generic Material Card */
function GenericMaterialCard({ card }: { card: DigestCard }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const cleanHeadline = cleanFilingText(card.one_liner || card.headline);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white tracking-wide">{card.symbol}</span>
          <span className="text-finn-muted">·</span>
          <span className="text-finn-muted capitalize">{card.category.replace("_", " ")}</span>
        </div>
        <span className="text-[11px] text-finn-muted tabular-nums">
          {timeAgo(card.filed_at)}
        </span>
      </div>

      <p className="text-xs text-white leading-relaxed">{cleanHeadline}</p>

      <div className="flex items-center justify-between pt-2 border-t border-[#23272F] text-[11px]">
        <button
          onClick={() => setWhyOpen(!whyOpen)}
          className="text-finn-muted hover:text-white transition-colors"
        >
          Why this?
        </button>
        {card.attachment_url && (
          <a
            href={card.attachment_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-finn-accent hover:underline flex items-center gap-0.5"
          >
            <span>BSE filing</span>
            <ArrowUpRight size={11} />
          </a>
        )}
      </div>

      {whyOpen && (
        <div className="p-2 rounded bg-finn-bg text-[11px] text-finn-muted border border-[#23272F]">
          {card.category.replace("_", " ")} · material disclosure
        </div>
      )}
    </div>
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
  const [error, setError] = useState(false);
  const [routineOpen, setRoutineOpen] = useState(false);

  const windows: TimeWindow[] = ["24h", "3d", "7d", "30d"];

  const loadData = () => {
    setLoading(true);
    setError(false);
    api<DigestResponse>("/digest", { params: { window } })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load digest:", err);
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [window]);

  const material = data?.material || [];
  const medium = data?.medium || [];
  const routine = data?.routine || { count: 0, summary: "ESOPs, compliance certificates, trading windows", items: [] };

  return (
    <div className="px-4 pt-5 space-y-4">
      {/* Header: Title + One concise line */}
      <div>
        <h1 className="text-[22px] font-semibold text-white tracking-tight">Brief</h1>
        <p className="text-xs text-finn-muted mt-0.5">
          Sun, 1 Nov · 3 need attention · 7 updates
        </p>
      </div>

      {/* Window selector: smaller segmented control (height 36px) */}
      <div className="flex h-9 bg-finn-surface rounded-lg p-0.5 border border-[#23272F]">
        {windows.map((w) => (
          <button
            key={w}
            onClick={() => setWindow(w)}
            className={cn(
              "flex-1 text-xs font-medium rounded-md transition-colors",
              w === window
                ? "bg-finn-bg text-white shadow-sm"
                : "text-finn-muted hover:text-white"
            )}
          >
            {w}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="card h-40 skeleton border-0" />
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-6 text-xs text-finn-muted space-y-2">
          <p>Failed to load filings.</p>
          <button
            onClick={loadData}
            className="px-3 py-1 bg-finn-surface border border-[#23272F] rounded text-white hover:border-finn-muted"
          >
            Retry
          </button>
        </div>
      ) : material.length === 0 ? (
        <div className="card text-center py-6">
          <p className="text-xs text-finn-muted">You&apos;re all caught up</p>
        </div>
      ) : (
        <section className="space-y-3">
          {material.map((card) => (
            <MaterialCardRouter key={card.id} card={card} />
          ))}
        </section>
      )}

      {/* Medium items: compact single-row list (ticker · one-liner · time) */}
      {!loading && !error && medium.length > 0 && (
        <section className="pt-2">
          <h2 className="text-xs font-medium text-finn-muted uppercase tracking-wider mb-2">
            Also Noted ({medium.length})
          </h2>
          <div className="card p-0 divide-y divide-[#23272F] overflow-hidden">
            {medium.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-finn-surface-hover transition-colors gap-2"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-white shrink-0">{item.symbol}</span>
                  <span className="text-finn-muted">·</span>
                  <span className="text-finn-muted truncate">
                    {cleanFilingText(item.one_liner || item.headline)}
                  </span>
                </div>
                <span className="text-[11px] text-finn-muted tabular-nums shrink-0 ml-2">
                  {timeAgo(item.filed_at)}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Routine collapsed group: "8 routine filings" that expands */}
      {!loading && !error && (routine.count > 0 || routine.items?.length > 0) && (
        <section className="pt-1">
          <button
            onClick={() => setRoutineOpen(!routineOpen)}
            className="flex items-center justify-between w-full py-2.5 px-3 rounded-xl bg-finn-surface border border-[#23272F] text-xs text-finn-muted hover:text-white transition-colors"
          >
            <span>{routine.count || routine.items?.length || 8} routine filings</span>
            {routineOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {routineOpen && (
            <div className="mt-2 space-y-1.5 pl-2">
              {(routine.items || []).slice(0, 8).map((r) => (
                <div
                  key={r.id}
                  className="text-[11px] text-finn-muted py-1 flex items-center justify-between gap-2 border-b border-[#23272F]/50 last:border-0"
                >
                  <span className="font-semibold text-white shrink-0">{r.symbol}</span>
                  <span className="truncate flex-1">{cleanFilingText(r.headline)}</span>
                  <span className="shrink-0 text-[10px] tabular-nums">{timeAgo(r.filed_at)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
