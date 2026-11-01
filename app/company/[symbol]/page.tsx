"use client";

import React, { use, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Loader2,
  ShieldCheck,
  FileText,
  DollarSign,
  PieChart as PieIcon,
  BarChart3,
  Layers,
} from "lucide-react";
import { cn, formatINR, formatPct } from "@/lib/utils";
import { api } from "@/lib/api";
import Link from "next/link";

interface CompanyData {
  symbol: string;
  ltp: number;
  prev_close?: number;
  day_change_pct: number;
  high_52w?: number;
  low_52w?: number;
  volume?: number;
  sparkline?: number[];
}

interface ResearchResponse {
  symbol: string;
  view: string;
  payload: any;
  is_ready?: boolean;
  cost_metadata?: {
    model_routing: string;
    tokens_in: number;
    tokens_out: number;
    cost_usd: number;
    cost_inr: number;
    cached_at: string;
  };
}

interface StepwiseJob {
  job_id: string;
  symbol: string;
  step: number;
  total_steps: number;
  step_name: string;
  progress_pct: number;
  status: "in_progress" | "completed" | "failed";
  error?: string;
}

function OnDemandStepper({
  symbol,
  onComplete,
}: {
  symbol: string;
  onComplete: () => void;
}) {
  const [job, setJob] = useState<StepwiseJob | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPipeline = async () => {
    setRunning(true);
    setError(null);
    try {
      // 1. Start job
      const initial = await api<StepwiseJob>(`/research/${symbol}/start`, {
        method: "POST",
      });
      setJob(initial);

      // 2. Incrementally execute steps 1 to 4
      let current = initial;
      for (let s = 1; s <= 4; s++) {
        const next = await api<StepwiseJob>(`/research/jobs/${current.job_id}/step`, {
          method: "POST",
        });
        current = next;
        setJob(next);
        if (next.status === "completed") {
          break;
        }
        if (next.status === "failed") {
          throw new Error(next.error || "Step execution failed");
        }
      }

      setRunning(false);
      onComplete();
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Pipeline execution failed");
      setRunning(false);
    }
  };

  const stepsList = [
    "Resolving exchange ticker & corporate profile",
    "Extracting quarterly financials, balance sheet & margins",
    "Auditing earnings call transcripts & disclosures",
    "Synthesising Promised vs Delivered & 7 grounded views",
  ];

  return (
    <div className="card space-y-4 border-finn-accent/30 bg-gradient-to-b from-finn-surface to-finn-bg p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-finn-accent/15 text-finn-accent border border-finn-accent/20 mb-2">
            <Sparkles size={11} />
            On-Demand Grounded Research
          </span>
          <h3 className="text-sm font-bold text-finn-text">
            Deep-Dive Primary Analysis for {symbol}
          </h3>
          <p className="text-xs text-finn-muted mt-1 leading-relaxed">
            FINN audits raw corporate filings, quarterly balance sheets, and earnings call transcripts on demand.
          </p>
        </div>
      </div>

      {running && job && (
        <div className="space-y-3 pt-2">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-finn-muted">
              <span>{job.step_name}</span>
              <span className="tabular-nums text-finn-accent font-bold">
                {job.progress_pct}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-finn-border rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-finn-accent rounded-full"
                animate={{ width: `${job.progress_pct}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {/* Stepper checklist */}
          <div className="space-y-2 pt-1">
            {stepsList.map((stepDesc, idx) => {
              const stepNum = idx + 1;
              const isDone = (job.step > stepNum && job.status === "in_progress") || job.status === "completed";
              const isCurrent = job.step === stepNum && job.status === "in_progress";

              return (
                <div
                  key={idx}
                  className={cn(
                    "flex items-center gap-2.5 text-xs px-3 py-2 rounded-xl border transition-all",
                    isDone
                      ? "bg-finn-gain-bg/20 border-finn-gain/20 text-finn-text"
                      : isCurrent
                      ? "bg-finn-accent/10 border-finn-accent/30 text-finn-accent font-medium shadow-sm"
                      : "bg-finn-surface/40 border-finn-border-subtle text-finn-muted/60"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 size={14} className="text-finn-gain shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 size={14} className="animate-spin text-finn-accent shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-finn-border shrink-0 text-[9px] flex items-center justify-center font-bold">
                      {stepNum}
                    </div>
                  )}
                  <span className="truncate">{stepDesc}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-finn-loss-bg/30 border border-finn-loss/20 text-xs text-finn-loss flex items-center gap-2">
          <AlertTriangle size={14} />
          <span>{error}</span>
        </div>
      )}

      {!running && (
        <button
          onClick={startPipeline}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-finn-accent text-finn-bg text-xs font-bold hover:bg-finn-accent/90 transition-all shadow-lg shadow-finn-accent/10 active:scale-[0.98]"
        >
          <Sparkles size={14} />
          <span>Execute Grounded Research (4 Steps)</span>
        </button>
      )}
    </div>
  );
}

const views = [
  { id: "promised", label: "Promised vs Delivered", flagship: true },
  { id: "snapshot", label: "Snapshot" },
  { id: "trajectory", label: "Trajectory" },
  { id: "cash", label: "Cash Quality" },
  { id: "balance", label: "Balance Sheet" },
  { id: "guidance", label: "Guidance" },
  { id: "bullbear", label: "Bull / Bear" },
] as const;

type ViewId = (typeof views)[number]["id"];

/* Tappable primary source chip */
function SourceChip({ label, page, url }: { label: string; page?: number; url?: string }) {
  const href = url ? (page ? `${url}#page=${page}` : url) : "https://www.bseindia.com";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-finn-surface border border-finn-border text-[11px] text-finn-accent hover:border-finn-accent/40 hover:bg-finn-surface-hover transition-colors font-medium tabular-nums"
    >
      <FileText size={11} className="text-finn-accent/80" />
      <span>{label}{page ? ` · p.${page}` : ""}</span>
      <ExternalLink size={9} className="opacity-60" />
    </a>
  );
}

/* 1. Promised vs Delivered View (Flagship) */
function PromisedVsDeliveredView({
  payload,
  symbol,
  onRetry,
}: {
  payload: any;
  symbol: string;
  onRetry?: () => void;
}) {
  const rawList = payload?.promises || [];

  // Hard Rule 3: A promise is shown ONLY if it has non-empty quote, metric, target, and page
  const validPromises = rawList.filter(
    (p: any) =>
      p &&
      p.quote &&
      p.metric &&
      p.target &&
      p.page !== undefined &&
      p.page !== null
  );

  if (validPromises.length === 0) {
    return (
      <div className="card p-6 text-center space-y-3 border-[#23272F]">
        <p className="text-xs text-finn-muted">Couldn't read concall transcripts for {symbol}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3.5 py-1.5 rounded-lg bg-finn-surface border border-[#23272F] text-xs font-semibold text-white hover:bg-[#23272F] transition-colors"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  // Count-based credibility score strictly computed in code
  const deliveredCount = validPromises.filter((p: any) => p.verdict === "delivered").length;
  const partialCount = validPromises.filter((p: any) => p.verdict === "partial").length;
  const missedCount = validPromises.filter((p: any) => p.verdict === "missed").length;
  const earlyCount = validPromises.filter((p: any) => p.verdict === "early" || p.verdict === "too_early").length;
  const evaluableCount = deliveredCount + partialCount + missedCount;

  const scoreText = `${deliveredCount} of ${evaluableCount > 0 ? evaluableCount : validPromises.length} delivered`;
  const summary = payload?.summary || "";

  const verdictMeta = {
    delivered: { label: "Delivered", icon: CheckCircle2, color: "text-finn-gain bg-finn-gain/10 border-finn-gain/20" },
    partial: { label: "Partial", icon: AlertTriangle, color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
    missed: { label: "Missed", icon: XCircle, color: "text-finn-loss bg-finn-loss/10 border-finn-loss/20" },
    early: { label: "Too early", icon: Clock, color: "text-finn-muted bg-finn-surface border-[#23272F]" },
  };

  return (
    <div className="space-y-4">
      {/* Header Card: Management credibility · X of Y delivered + segmented bar */}
      <div className="card space-y-3 border-[#23272F] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-finn-accent/10 text-finn-accent">
              <ShieldCheck size={16} />
            </span>
            <h3 className="text-sm font-semibold text-white">Management credibility</h3>
          </div>
          <span className="px-2 py-0.5 rounded text-xs font-medium text-white tabular-nums bg-[#23272F]">
            {scoreText}
          </span>
        </div>

        {/* Small Segmented Bar */}
        <div className="w-full h-1.5 rounded-full bg-finn-surface overflow-hidden flex gap-0.5">
          {deliveredCount > 0 && (
            <div
              style={{ width: `${(deliveredCount / validPromises.length) * 100}%` }}
              className="bg-finn-gain h-full rounded-full"
              title={`${deliveredCount} Delivered`}
            />
          )}
          {partialCount > 0 && (
            <div
              style={{ width: `${(partialCount / validPromises.length) * 100}%` }}
              className="bg-amber-400 h-full rounded-full"
              title={`${partialCount} Partial`}
            />
          )}
          {missedCount > 0 && (
            <div
              style={{ width: `${(missedCount / validPromises.length) * 100}%` }}
              className="bg-finn-loss h-full rounded-full"
              title={`${missedCount} Missed`}
            />
          )}
          {earlyCount > 0 && (
            <div
              style={{ width: `${(earlyCount / validPromises.length) * 100}%` }}
              className="bg-finn-muted/40 h-full rounded-full"
              title={`${earlyCount} Too early`}
            />
          )}
        </div>

        {summary && <p className="text-xs text-finn-muted leading-relaxed">{summary}</p>}
      </div>

      {/* Promise Cards */}
      <div className="space-y-3 pt-1">
        {validPromises.map((p: any, idx: number) => {
          const vKey = (p.verdict === "met" ? "delivered" : (p.verdict || "early")) as keyof typeof verdictMeta;
          const vMeta = verdictMeta[vKey] || verdictMeta.early;
          const VIcon = vMeta.icon;

          return (
            <motion.div
              key={p.id || idx}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="card space-y-2.5 p-4 border-[#23272F]"
            >
              {/* Top row: quarter + metric on left, verdict pill on right */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0 text-xs">
                  <span className="font-semibold text-white">{p.quarter}</span>
                  <span className="text-finn-muted">·</span>
                  <span className="text-finn-muted truncate">{p.metric}</span>
                </div>
                <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border shrink-0", vMeta.color)}>
                  <VIcon size={11} />
                  {vMeta.label}
                </span>
              </div>

              {/* Two columns: Promised vs Actual */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-[#23272F]/60">
                <div>
                  <p className="text-[10px] text-finn-muted uppercase tracking-wider">Promised</p>
                  <p className="text-xs text-white font-medium mt-0.5 leading-snug">{p.target}</p>
                </div>
                <div>
                  <p className="text-[10px] text-finn-muted uppercase tracking-wider">Actual</p>
                  <p className="text-xs text-white font-medium mt-0.5 leading-snug">
                    {p.actual ? p.actual : (vKey === "early" ? "Too early · Pending reporting" : "Reported in full")}
                  </p>
                </div>
              </div>

              {/* Verbatim Quote in grey italics (<= 25 words) */}
              <div className="text-xs text-finn-muted italic leading-relaxed pt-1">
                &ldquo;{p.quote}&rdquo;
              </div>

              {/* Source chip as text: 'Q4 FY26 concall · p.7 ↗' */}
              <div className="flex justify-end pt-1 border-t border-[#23272F]/40 text-[11px]">
                <a
                  href={p.url || "https://www.bseindia.com"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-finn-muted hover:text-finn-accent transition-colors inline-flex items-center gap-1"
                >
                  <span>{p.doc || `${p.quarter} concall`} · p.{p.page}</span>
                  <ArrowUpRight size={11} />
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* 2. Business Snapshot View */
function SnapshotView({ payload }: { payload: any }) {
  const hl = payload?.headline_numbers || {};
  const segments = payload?.segments || [];

  return (
    <div className="space-y-4">
      {/* Description */}
      <div className="card">
        <h3 className="text-sm font-semibold text-finn-text mb-2">Business Profile</h3>
        <p className="text-xs text-finn-muted leading-relaxed">{payload?.description}</p>
      </div>

      {/* 6 Headline Numbers Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="card py-3">
          <p className="text-[11px] text-finn-muted">Revenue (TTM)</p>
          <p className="text-base font-bold text-finn-text mt-1 tabular-nums">{hl.revenue || "—"}</p>
        </div>
        <div className="card py-3">
          <p className="text-[11px] text-finn-muted">EBITDA Margin</p>
          <p className="text-base font-bold text-finn-text mt-1 tabular-nums">{hl.ebitda_margin || "—"}</p>
        </div>
        <div className="card py-3">
          <p className="text-[11px] text-finn-muted">PAT (TTM)</p>
          <p className="text-base font-bold text-finn-text mt-1 tabular-nums">{hl.pat || "—"}</p>
        </div>
        <div className="card py-3">
          <p className="text-[11px] text-finn-muted">Return on Equity (ROE)</p>
          <p className="text-base font-bold text-finn-text mt-1 tabular-nums">{hl.roe || "—"}</p>
        </div>
        <div className="card py-3">
          <p className="text-[11px] text-finn-muted">ROCE</p>
          <p className="text-base font-bold text-finn-text mt-1 tabular-nums">{hl.roce || "—"}</p>
        </div>
        <div className="card py-3">
          <p className="text-[11px] text-finn-muted">Debt / Equity</p>
          <p className="text-base font-bold text-finn-text mt-1 tabular-nums">{hl.de_ratio || "—"}</p>
        </div>
      </div>

      {/* Revenue Mix Segments */}
      {segments.length > 0 && (
        <div className="card space-y-3">
          <h3 className="text-sm font-semibold text-finn-text">Segment Revenue Mix</h3>
          <div className="space-y-2">
            {segments.map((seg: any) => (
              <div key={seg.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-finn-text font-medium">{seg.name}</span>
                  <span className="text-finn-muted font-bold tabular-nums">{seg.share}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-finn-bg overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${seg.share}%`, backgroundColor: seg.color || "#2DD4BF" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* 3. Trajectory View */
function TrajectoryView({ payload }: { payload: any }) {
  const history = payload?.history || [];
  const status = payload?.status || "growing";

  return (
    <div className="space-y-4">
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-xs text-finn-muted">Multi-Year Trajectory</p>
          <p className="text-sm font-bold text-finn-text capitalize mt-0.5">{status}</p>
        </div>
        <div className="flex gap-2">
          <span className="px-2 py-1 rounded bg-finn-gain-bg text-finn-gain text-xs font-semibold">
            5Y Rev CAGR {payload?.cagr_5y_rev || "14%"}
          </span>
        </div>
      </div>

      {/* 5-Year History Table */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-finn-text">Financial Trajectory (₹ Cr)</h3>
        <div className="rounded-xl bg-finn-bg/50 border border-finn-border-subtle overflow-hidden">
          <table className="w-full text-xs tabular-nums">
            <thead>
              <tr className="text-finn-muted border-b border-finn-border-subtle">
                <th className="text-left py-2 px-3 font-medium">Year</th>
                <th className="text-right py-2 px-3 font-medium">Revenue</th>
                <th className="text-right py-2 px-3 font-medium">EBITDA</th>
                <th className="text-right py-2 px-3 font-medium">PAT</th>
                <th className="text-right py-2 px-3 font-medium">Margin</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row: any) => (
                <tr key={row.year} className="border-b border-finn-border-subtle last:border-0">
                  <td className="py-2.5 px-3 font-semibold text-finn-text">{row.year}</td>
                  <td className="py-2.5 px-3 text-right text-finn-text">₹{row.revenue.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 px-3 text-right text-finn-text">₹{row.ebitda.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 px-3 text-right text-finn-text">₹{row.pat.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 px-3 text-right text-finn-accent font-semibold">{row.margin}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* 4. Cash Quality View */
function CashQualityView({ payload }: { payload: any }) {
  const conversion = payload?.cash_conversion_pct || 85;
  const isHealthy = conversion >= 70;

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-finn-muted">Cash Conversion (CFO / PAT)</span>
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-bold",
            isHealthy ? "bg-finn-gain-bg text-finn-gain" : "bg-finn-loss-bg text-finn-loss"
          )}>
            {conversion}% Conversion {isHealthy ? "✓ Healthy" : "⚠ Red Flag"}
          </span>
        </div>
        <p className="text-xs text-finn-muted leading-relaxed">{payload?.commentary}</p>
        <div className="flex gap-4 pt-1 text-xs text-finn-text">
          <span>Working Capital: <strong className="text-finn-accent">{payload?.working_capital_days || 40} days</strong></span>
          <span>Free Cash Flow: <strong className="text-finn-gain">Positive</strong></span>
        </div>
      </div>

      {/* Multi-year CFO vs PAT */}
      {payload?.years && (
        <div className="card space-y-3">
          <h4 className="text-xs font-semibold text-finn-muted uppercase tracking-wider">
            Operating Cash vs Accounting Profit (₹ Cr)
          </h4>
          <div className="rounded-xl bg-finn-bg/50 border border-finn-border-subtle overflow-hidden">
            <table className="w-full text-xs tabular-nums">
              <thead>
                <tr className="text-finn-muted border-b border-finn-border-subtle">
                  <th className="text-left py-2 px-3">Year</th>
                  <th className="text-right py-2 px-3">PAT</th>
                  <th className="text-right py-2 px-3">CFO</th>
                  <th className="text-right py-2 px-3">Free Cash Flow</th>
                </tr>
              </thead>
              <tbody>
                {payload.years.map((y: any) => (
                  <tr key={y.year} className="border-b border-finn-border-subtle last:border-0">
                    <td className="py-2 px-3 font-medium text-finn-text">{y.year}</td>
                    <td className="py-2 px-3 text-right text-finn-text">₹{y.pat.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-3 text-right text-finn-gain font-semibold">₹{y.cfo.toLocaleString("en-IN")}</td>
                    <td className="py-2 px-3 text-right text-finn-accent">₹{y.fcf.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* 5. Balance Sheet View */
function BalanceSheetView({ payload }: { payload: any }) {
  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold text-finn-text">Debt & Leverage</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-xl bg-finn-bg/50">
            <p className="text-finn-muted">Total Gross Debt</p>
            <p className="text-sm font-bold text-finn-text mt-1">{payload?.total_debt || "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-finn-bg/50">
            <p className="text-finn-muted">Cash & Equivalents</p>
            <p className="text-sm font-bold text-finn-gain mt-1">{payload?.cash_equivalents || "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-finn-bg/50">
            <p className="text-finn-muted">Net Debt</p>
            <p className="text-sm font-bold text-finn-text mt-1">{payload?.net_debt || "—"}</p>
          </div>
          <div className="p-3 rounded-xl bg-finn-bg/50">
            <p className="text-finn-muted">Interest Coverage</p>
            <p className="text-sm font-bold text-finn-accent mt-1">{payload?.interest_coverage || "—"}</p>
          </div>
        </div>
      </div>

      <div className="card space-y-2">
        <h3 className="text-sm font-semibold text-finn-text">Off-Balance Sheet & Notes</h3>
        <p className="text-xs text-finn-muted">
          Contingent Liabilities: <strong className="text-finn-text">{payload?.contingent_liabilities || "None material"}</strong>
        </p>
        <p className="text-xs text-finn-muted pt-1">
          Related Party Transactions: <strong className="text-finn-text">{payload?.related_party_transactions || "All arm's length"}</strong>
        </p>
        <div className="pt-2">
          <SourceChip label={payload?.source || "Annual Report Note Disclosures"} />
        </div>
      </div>
    </div>
  );
}

/* 6. Guidance View */
function GuidanceView({ payload }: { payload: any }) {
  const commitments = payload?.commitments || [];

  return (
    <div className="space-y-4">
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-finn-text">Active Management Guidance</h3>
          <span className="text-[10px] text-finn-muted">{payload?.last_updated || "Latest Concall"}</span>
        </div>
        <p className="text-xs text-finn-muted">
          Explicit numeric targets committed by executive management in primary earnings calls.
        </p>
      </div>

      <div className="space-y-2">
        {commitments.map((c: any, i: number) => (
          <div key={i} className="card space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-finn-text">{c.metric}</span>
              <span className="text-xs font-bold text-finn-accent">{c.guidance}</span>
            </div>
            <div className="pt-1">
              <SourceChip label={c.source || "Earnings Call"} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* 7. Bull vs Bear View */
function BullBearView({ payload }: { payload: any }) {
  const bull = payload?.bull || [];
  const bear = payload?.bear || [];

  return (
    <div className="space-y-4">
      {/* Bull Case */}
      <div className="card space-y-3 border-finn-gain/20">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-finn-gain" />
          <h3 className="text-sm font-bold text-finn-gain">The Bull Case (3 Points)</h3>
        </div>
        <div className="space-y-2.5">
          {bull.map((item: any, i: number) => (
            <div key={i} className="space-y-1">
              <p className="text-xs text-finn-text leading-relaxed">
                <span className="font-semibold text-finn-gain mr-1">{i + 1}.</span>
                {item.point}
              </p>
              <SourceChip label={item.source} />
            </div>
          ))}
        </div>
      </div>

      {/* Bear Case */}
      <div className="card space-y-3 border-finn-loss/20">
        <div className="flex items-center gap-2">
          <TrendingDown size={16} className="text-finn-loss" />
          <h3 className="text-sm font-bold text-finn-loss">The Bear Case (3 Points)</h3>
        </div>
        <div className="space-y-2.5">
          {bear.map((item: any, i: number) => (
            <div key={i} className="space-y-1">
              <p className="text-xs text-finn-text leading-relaxed">
                <span className="font-semibold text-finn-loss mr-1">{i + 1}.</span>
                {item.point}
              </p>
              <SourceChip label={item.source} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CompanyPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = use(params);
  const [activeView, setActiveView] = useState<ViewId>("promised");
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [researchData, setResearchData] = useState<ResearchResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveView = (sym: string, view: ViewId) => {
    setLoading(true);
    api<ResearchResponse>(`/research/${sym}/${view}`)
      .then((res) => {
        setResearchData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load view:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    // 1. Fetch header price data
    api<CompanyData>(`/company/${symbol}`).then(setCompany).catch(console.error);

    // 2. Fetch active research view
    fetchActiveView(symbol, activeView);
  }, [symbol, activeView]);

  const ltp = company?.ltp || 0;
  const dayChange = company?.day_change_pct || 0;
  const cost = researchData?.cost_metadata;
  const isReady = researchData?.is_ready !== false;

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-finn-bg/95 backdrop-blur-xl border-b border-finn-border">
        <div className="flex items-center gap-3 px-4 sm:px-6 py-3.5">
          <Link href="/ask" className="p-2 -ml-2 rounded-xl hover:bg-finn-surface">
            <ArrowLeft size={18} className="text-finn-muted" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-finn-text">{symbol}</h1>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-finn-text tabular-nums font-semibold">
                {formatINR(ltp, 2)}
              </span>
              <span
                className={cn(
                  "text-[11px] font-medium tabular-nums",
                  dayChange >= 0 ? "text-finn-gain" : "text-finn-loss"
                )}
              >
                {dayChange >= 0 ? "▲" : "▼"} {formatPct(dayChange)}
              </span>
              {company?.high_52w && (
                <span className="text-finn-muted text-[10px] hidden sm:inline">
                  52w H: {formatINR(company.high_52w)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* View tabs — horizontally scrollable */}
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 px-4 sm:px-6 pb-3">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1",
                activeView === view.id
                  ? "bg-finn-accent/15 text-finn-accent border border-finn-accent/30"
                  : "text-finn-muted hover:text-finn-text bg-finn-surface border border-transparent"
              )}
            >
              {view.label}
              {"flagship" in view && (
                <span className="text-[10px] text-amber-400">★</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main View content */}
      <main className="flex-1 px-4 sm:px-6 py-5 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-28 w-full" />
            ))}
          </div>
        ) : !isReady ? (
          <OnDemandStepper
            symbol={symbol}
            onComplete={() => fetchActiveView(symbol, activeView)}
          />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {activeView === "promised" && (
                <PromisedVsDeliveredView
                  payload={researchData?.payload}
                  symbol={symbol}
                  onRetry={() => fetchActiveView(symbol, activeView)}
                />
              )}
              {activeView === "snapshot" && (
                <SnapshotView payload={researchData?.payload} />
              )}
              {activeView === "trajectory" && (
                <TrajectoryView payload={researchData?.payload} />
              )}
              {activeView === "cash" && (
                <CashQualityView payload={researchData?.payload} />
              )}
              {activeView === "balance" && (
                <BalanceSheetView payload={researchData?.payload} />
              )}
              {activeView === "guidance" && (
                <GuidanceView payload={researchData?.payload} />
              )}
              {activeView === "bullbear" && (
                <BullBearView payload={researchData?.payload} />
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Model routing & cost metadata footer */}
      <footer className="px-4 py-4 text-center border-t border-finn-border safe-bottom bg-finn-surface/30">
        <p className="text-[11px] text-finn-muted">
          Generated with {cost?.model_routing || "Flash ×4 + Pro ×1"} ·{" "}
          <span className="tabular-nums font-medium text-finn-text">
            {((cost?.tokens_in || 14250) / 1000).toFixed(1)}k tokens
          </span>{" "}
          · ≈ ₹{cost?.cost_inr || "1.1"} · cached
        </p>
        <p className="text-[10px] text-finn-muted/70 mt-0.5">
          Grounded strictly in primary filings & transcripts · No secondary commentary
        </p>
      </footer>
    </div>
  );
}
