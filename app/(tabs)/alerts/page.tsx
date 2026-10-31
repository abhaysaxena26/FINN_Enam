"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, TrendingUp, TrendingDown, Volume2, FileText, Settings, X, ChevronRight } from "lucide-react";
import { cn, formatPct, timeAgo } from "@/lib/utils";

const mockAlerts = [
  {
    id: "a1",
    symbol: "DIXON",
    type: "volume_spike" as const,
    value: 3.4,
    threshold: 2.0,
    message: "Volume 3.4× its 20-day average",
    triggered_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    seen: false,
    coincident_filing: "Board approved bonus issue 1:1",
  },
  {
    id: "a2",
    symbol: "KPITTECH",
    type: "price_move" as const,
    value: -6.2,
    threshold: 5.0,
    message: "Price dropped 6.2% in a single day",
    triggered_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    seen: false,
    coincident_filing: null,
  },
  {
    id: "a3",
    symbol: "BAJFINANCE",
    type: "material_announcement" as const,
    value: 3,
    threshold: 2,
    message: "Interim dividend ₹36/share declared",
    triggered_at: new Date(Date.now() - 6 * 3600000).toISOString(),
    seen: true,
    coincident_filing: null,
  },
];

const alertIcons = {
  volume_spike: Volume2,
  price_move: TrendingDown,
  material_announcement: FileText,
};

const alertColors = {
  volume_spike: "text-purple-400 bg-purple-400/10",
  price_move: "text-finn-loss bg-finn-loss-bg",
  material_announcement: "text-finn-accent bg-finn-accent-dim",
};

export default function AlertsPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [alerts, setAlerts] = useState(mockAlerts);

  const unseen = alerts.filter((a) => !a.seen);
  const seen = alerts.filter((a) => a.seen);

  return (
    <div className="px-4 pt-14 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-finn-text">Alerts</h1>
          <p className="text-sm text-finn-muted mt-0.5">
            {unseen.length} new trigger{unseen.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2.5 rounded-xl bg-finn-surface border border-finn-border text-finn-muted hover:text-finn-text transition-colors"
        >
          <Settings size={18} />
        </button>
      </div>

      {/* Settings sheet */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Alert settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-finn-muted">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-finn-muted">Volume spike multiplier</label>
                <span className="text-xs tabular-nums text-finn-text font-medium bg-finn-bg px-2 py-1 rounded-lg">2.0×</span>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-finn-muted">Volume lookback days</label>
                <span className="text-xs tabular-nums text-finn-text font-medium bg-finn-bg px-2 py-1 rounded-lg">20</span>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-finn-muted">Price move threshold</label>
                <span className="text-xs tabular-nums text-finn-text font-medium bg-finn-bg px-2 py-1 rounded-lg">±5.0%</span>
              </div>
            </div>
            <p className="text-[10px] text-finn-muted">Settings are editable when connected to the backend.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unseen alerts */}
      {unseen.length > 0 && (
        <section className="space-y-2">
          {unseen.map((alert) => {
            const Icon = alertIcons[alert.type];
            const colorClass = alertColors[alert.type];
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                className="card relative overflow-hidden"
              >
                {/* Unseen indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-finn-accent" />
                <div className="flex items-start gap-3">
                  <div className={cn("p-2 rounded-xl shrink-0", colorClass)}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-finn-text">{alert.symbol}</span>
                      <span className="text-[10px] text-finn-muted">{timeAgo(alert.triggered_at)}</span>
                    </div>
                    <p className="text-[13px] text-finn-text mt-0.5">{alert.message}</p>
                    {alert.coincident_filing && (
                      <button className="flex items-center gap-1 mt-2 text-[11px] text-finn-accent hover:underline">
                        Why it moved: {alert.coincident_filing}
                        <ChevronRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>
      )}

      {/* Seen alerts */}
      {seen.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-finn-muted uppercase tracking-wider">Earlier</h3>
          {seen.map((alert) => {
            const Icon = alertIcons[alert.type];
            return (
              <div key={alert.id} className="flex items-start gap-3 py-2.5 border-b border-finn-border-subtle last:border-0 opacity-60">
                <Icon size={14} className="text-finn-muted mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-finn-muted">{alert.symbol}</span>
                    <span className="text-[10px] text-finn-muted">{timeAgo(alert.triggered_at)}</span>
                  </div>
                  <p className="text-xs text-finn-muted mt-0.5">{alert.message}</p>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
