"use client";

import React, { use, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, TrendingUp, ExternalLink } from "lucide-react";
import { cn, formatINR, formatPct } from "@/lib/utils";
import Link from "next/link";

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
  const [activeView, setActiveView] = React.useState("promised");

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
              <span className="text-finn-text tabular-nums font-medium">₹2,612.35</span>
              <span className="text-finn-gain text-[11px]">▲ +1.23%</span>
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
              <h3 className="text-sm font-semibold text-finn-text">Promised vs. Delivered</h3>
              <p className="text-xs text-finn-muted">
                This view analyses management guidance from the last 4 concall transcripts
                against actual results. Research will be generated in Phase 4.
              </p>
              {/* Placeholder timeline */}
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-finn-accent" />
                      <div className="w-px h-full bg-finn-border" />
                    </div>
                    <div className="skeleton h-16 w-full mb-2" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView !== "promised" && (
            <div className="card">
              <h3 className="text-sm font-semibold text-finn-text mb-2 capitalize">{activeView}</h3>
              <p className="text-xs text-finn-muted">
                This research view will be populated in Phase 4 with data from
                annual reports and concall transcripts.
              </p>
              <div className="mt-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-4 w-full" style={{ width: `${100 - i * 15}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Cost footer */}
          <p className="text-[10px] text-finn-muted text-center">
            Data sourced from annual reports & concall transcripts · Phase 4
          </p>
        </motion.div>
      </div>
    </div>
  );
}
