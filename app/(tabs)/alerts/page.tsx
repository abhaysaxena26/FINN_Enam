"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, TrendingUp, TrendingDown, Volume2, FileText, Settings, X, ChevronRight, Check } from "lucide-react";
import { cn, formatPct, timeAgo } from "@/lib/utils";
import { api } from "@/lib/api";
import { Alert, AlertSettings } from "@/lib/types";
import Link from "next/link";

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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [settings, setSettings] = useState<AlertSettings>({
    volume_multiple: 2.0,
    volume_lookback: 20,
    price_move_pct: 5.0,
    categories: ["results", "M&A", "management_change", "fund_raise", "litigation"],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load alerts
    api<{ alerts: Alert[] }>("/alerts")
      .then((res) => {
        setAlerts(res.alerts || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load alerts:", err);
        setLoading(false);
      });

    // Load alert settings
    api<AlertSettings>("/settings/alerts")
      .then((res) => setSettings(res))
      .catch(() => {});
  }, []);

  const handleMarkSeen = async (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, seen: true } : a))
    );
    try {
      await api(`/alerts/${id}/seen`, { method: "POST" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await api("/settings/alerts", {
        method: "PUT",
        body: settings,
      });
      setShowSettings(false);
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  const unseen = alerts.filter((a) => !a.seen);
  const seen = alerts.filter((a) => a.seen);

  return (
    <div className="px-4 sm:px-6 pt-5 sm:pt-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-finn-text">Triggered Alerts</h1>
          <p className="text-xs sm:text-sm text-finn-muted mt-0.5">
            <span className="text-finn-accent font-semibold">{unseen.length} active anomalies</span> evaluated against your thresholds
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-finn-surface border border-finn-border text-xs font-semibold text-finn-text hover:border-finn-accent/40 transition-colors shadow-sm"
        >
          <Settings size={15} className="text-finn-muted" />
          <span className="hidden sm:inline">Sensitivity Rules</span>
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
              <h3 className="text-sm font-semibold">Alert Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-finn-muted"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs text-finn-muted">
                  Volume spike multiplier
                </label>
                <span className="text-xs tabular-nums text-finn-text font-medium bg-finn-bg px-2 py-1 rounded-lg">
                  {settings.volume_multiple}×
                </span>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-finn-muted">
                  Price move threshold
                </label>
                <span className="text-xs tabular-nums text-finn-text font-medium bg-finn-bg px-2 py-1 rounded-lg">
                  ±{settings.price_move_pct}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-finn-muted">
                  Lookback days
                </label>
                <span className="text-xs tabular-nums text-finn-text font-medium bg-finn-bg px-2 py-1 rounded-lg">
                  {settings.volume_lookback} days
                </span>
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-finn-accent/15 text-finn-accent text-xs font-semibold rounded-xl hover:bg-finn-accent/25 transition-colors"
            >
              Save Settings
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unseen alerts */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 w-full" />
          ))}
        </div>
      ) : unseen.length > 0 ? (
        <section className="space-y-2">
          {unseen.map((alert) => {
            const Icon = alertIcons[alert.type] || Bell;
            const colorClass =
              alertColors[alert.type] || "text-finn-accent bg-finn-accent-dim";
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
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/company/${alert.symbol}`}
                          className="text-xs font-bold text-finn-text hover:underline"
                        >
                          {alert.symbol}
                        </Link>
                        <span className="text-[10px] text-finn-muted tabular-nums">
                          {timeAgo(alert.triggered_at)}
                        </span>
                      </div>
                      <button
                        onClick={() => handleMarkSeen(alert.id)}
                        className="text-[10px] text-finn-muted hover:text-finn-accent flex items-center gap-0.5"
                        title="Mark read"
                      >
                        <Check size={12} />
                      </button>
                    </div>

                    <p className="text-[13px] text-finn-text mt-1 leading-snug">
                      {alert.message}
                    </p>

                    {(alert as any).coincident_filing && (
                      <Link
                        href={`/company/${alert.symbol}`}
                        className="flex items-center gap-1 mt-2 text-[11px] text-finn-accent hover:underline"
                      >
                        Why it moved: {(alert as any).coincident_filing}
                        <ChevronRight size={12} />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </section>
      ) : (
        <div className="card text-center py-8">
          <p className="text-sm font-medium text-finn-text">No active alerts</p>
          <p className="text-xs text-finn-muted mt-1">
            Thresholds are being monitored at end-of-day.
          </p>
        </div>
      )}

      {/* Seen alerts */}
      {seen.length > 0 && (
        <section className="space-y-2 pt-4">
          <h3 className="text-xs font-semibold text-finn-muted uppercase tracking-wider">
            Earlier
          </h3>
          {seen.map((alert) => {
            const Icon = alertIcons[alert.type] || Bell;
            return (
              <div
                key={alert.id}
                className="flex items-start gap-3 py-2.5 border-b border-finn-border-subtle last:border-0 opacity-60"
              >
                <Icon size={14} className="text-finn-muted mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-finn-muted">
                      {alert.symbol}
                    </span>
                    <span className="text-[10px] text-finn-muted">
                      {timeAgo(alert.triggered_at)}
                    </span>
                  </div>
                  <p className="text-xs text-finn-muted mt-0.5">
                    {alert.message}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
