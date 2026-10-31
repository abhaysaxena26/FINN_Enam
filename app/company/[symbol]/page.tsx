"use client";

import React, { use, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
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

const views = [
  { id: "promised", label: "Promised vs Delivered" },
  { id: "snapshot", label: "Snapshot" },
  { id: "trajectory", label: "Trajectory" },
  { id: "cash", label: "Cash Quality" },
  { id: "balance", label: "Balance Sheet" },
  { id: "guidance", label: "Guidance" },
  { id: "bullbear", label: "Bull / Bear" },
];

interface CompanyPageProps {
  params: Promise<{ symbol: string }>;
}

export default function CompanyPage({ params }: CompanyPageProps) {
  const { symbol } = use(params);
  const [activeView, setActiveView] = useState("promised");
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<CompanyData>(`/company/${symbol}`)
      .then((res) => {
        setCompany(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load company:", err);
        setLoading(false);
      });
  }, [symbol]);

  const ltp = company?.ltp || 0;
  const dayChange = company?.day_change_pct || 0;

  return (
    <div className="min-h-dvh">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-finn-bg/95 backdrop-blur-xl border-b border-finn-border">
        <div className="flex items-center gap-3 px-4 py-3">
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
        <div className="flex overflow-x-auto no-scrollbar gap-1 px-4 pb-3">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0",
                activeView === view.id
                  ? "bg-finn-accent/15 text-finn-accent"
                  : "text-finn-muted hover:text-finn-text"
              )}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* View content */}
      <div className="px-4 py-6">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {activeView === "promised" && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-finn-text">
                  Promised vs. Delivered
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded bg-finn-accent/10 text-finn-accent font-medium">
                  Flagship View
                </span>
              </div>
              <p className="text-xs text-finn-muted leading-relaxed">
                Extracts management targets from recent concall transcripts and
                synthesises verdicts (Delivered, Partial, Missed) against actual numbers.
              </p>
              <div className="space-y-3 pt-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-finn-accent" />
                      <div className="w-px h-full bg-finn-border" />
                    </div>
                    <div className="skeleton h-20 w-full mb-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView !== "promised" && (
            <div className="card">
              <h3 className="text-sm font-semibold text-finn-text mb-2 capitalize">
                {activeView}
              </h3>
              <p className="text-xs text-finn-muted">
                Synthesised from primary filings, annual report disclosures, and
                earnings concall transcripts.
              </p>
              <div className="mt-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="skeleton h-4 w-full"
                    style={{ width: `${100 - i * 15}%` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Cost footer */}
          <div className="pt-2 text-center">
            <p className="text-[10px] text-finn-muted">
              Live quotes from NSE/BSE · Primary sources grounded in filings
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
