"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, TrendingDown, BarChart3, FileText, Settings, X, ChevronRight } from "lucide-react";
import { cn, timeAgo, cleanFilingText, formatMultiple } from "@/lib/utils";
import { api } from "@/lib/api";
import { Alert, AlertSettings } from "@/lib/types";
import Link from "next/link";

interface MergedAlert {
  symbol: string;
  headline: string;
  linkedFiling?: string;
  type: "price_up" | "price_down" | "volume" | "filing";
  timeStr: string;
  isToday: boolean;
  seen: boolean;
  ids: string[];
}

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
  const [error, setError] = useState(false);

  const loadAlerts = () => {
    setLoading(true);
    setError(false);
    api<{ alerts: Alert[] }>("/alerts")
      .then((res) => {
        setAlerts(res.alerts || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load alerts:", err);
        setError(true);
        setLoading(false);
      });

    api<AlertSettings>("/settings/alerts")
      .then((res) => setSettings(res))
      .catch(() => {});
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleSaveSettings = async () => {
    try {
      await api("/settings/alerts", {
        method: "PUT",
        body: settings,
      });
      setShowSettings(false);
      loadAlerts();
    } catch (e) {
      console.error("Failed to save settings:", e);
    }
  };

  // Group and merge alerts by symbol & day
  const mergeAlerts = (raw: Alert[]): { today: MergedAlert[]; earlier: MergedAlert[] } => {
    const symbolMapToday = new Map<string, { items: Alert[]; isToday: boolean }>();
    const symbolMapEarlier = new Map<string, { items: Alert[]; isToday: boolean }>();

    raw.forEach((a) => {
      // Determine if today (less than 24 hours ago)
      const diffHrs = (Date.now() - new Date(a.triggered_at).getTime()) / 3600000;
      const isToday = diffHrs < 24;
      const targetMap = isToday ? symbolMapToday : symbolMapEarlier;

      if (!targetMap.has(a.symbol)) {
        targetMap.set(a.symbol, { items: [], isToday });
      }
      targetMap.get(a.symbol)!.items.push(a);
    });

    const buildMergedList = (map: Map<string, { items: Alert[]; isToday: boolean }>): MergedAlert[] => {
      const result: MergedAlert[] = [];
      map.forEach((val, sym) => {
        const items = val.items;
        let priceItem = items.find((i) => i.type === "price_move");
        let volItem = items.find((i) => i.type === "volume_spike");
        let filingItem = items.find((i) => i.type === "material_announcement");

        let headline = "";
        let type: MergedAlert["type"] = "volume";

        // Check if both price & volume
        if (priceItem && volItem) {
          const isUp = priceItem.value >= 0;
          type = isUp ? "price_up" : "price_down";
          const sign = isUp ? "+" : "−";
          const pctStr = `${sign}${Math.abs(priceItem.value).toFixed(1)}%`;
          const volStr = `Volume ${formatMultiple(volItem.value, 1)} avg`;
          headline = `${pctStr} · ${volStr}`;
        } else if (priceItem) {
          const isUp = priceItem.value >= 0;
          type = isUp ? "price_up" : "price_down";
          const sign = isUp ? "+" : "−";
          headline = `${sign}${Math.abs(priceItem.value).toFixed(1)}% move in a single day`;
        } else if (volItem) {
          type = "volume";
          headline = `Volume ${formatMultiple(volItem.value, 1)} its 20-day average`;
        } else if (filingItem) {
          type = "filing";
          headline = cleanFilingText(filingItem.message || "Material filing recorded");
        } else {
          headline = items[0].message;
        }

        // Linked filing (only for price/volume alerts, use cleaned one-liner)
        let linkedFiling: string | undefined = undefined;
        if (type !== "filing") {
          const filingLink = items.find((i: any) => i.coincident_filing)?.coincident_filing;
          if (filingLink) {
            linkedFiling = cleanFilingText(filingLink);
          }
        }

        const newest = items[0];
        const isMarketMove = type === "price_up" || type === "price_down" || type === "volume";
        const timeStr = isMarketMove ? "Fri 30 Oct close" : timeAgo(newest.triggered_at);

        result.push({
          symbol: sym,
          headline,
          linkedFiling,
          type,
          timeStr,
          isToday: val.isToday,
          seen: items.every((i) => i.seen),
          ids: items.map((i) => i.id),
        });
      });
      return result;
    };

    return {
      today: buildMergedList(symbolMapToday),
      earlier: buildMergedList(symbolMapEarlier),
    };
  };

  const { today, earlier } = mergeAlerts(alerts);

  const renderAlertCard = (item: MergedAlert) => {
    return (
      <div key={item.symbol} className="card p-3.5 space-y-2">
        <div className="flex items-start gap-3">
          {/* Icons: price up = green, price down = red, volume = grey bar-chart, filing = grey document */}
          <div className="pt-0.5 shrink-0">
            {item.type === "price_up" && <TrendingUp size={16} className="text-finn-gain" />}
            {item.type === "price_down" && <TrendingDown size={16} className="text-finn-loss" />}
            {item.type === "volume" && <BarChart3 size={16} className="text-finn-muted" />}
            {item.type === "filing" && <FileText size={16} className="text-finn-muted" />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs">
              <Link href={`/company/${item.symbol}`} className="font-bold text-white hover:underline">
                {item.symbol}
              </Link>
              <span className="text-[11px] text-finn-muted tabular-nums">{item.timeStr}</span>
            </div>

            <p className="text-xs text-white mt-0.5 font-medium">{item.headline}</p>

            {item.linkedFiling && (
              <Link
                href={`/company/${item.symbol}`}
                className="inline-flex items-center gap-1 text-[11px] text-finn-muted hover:text-white transition-colors mt-1"
              >
                <span>Linked: {item.linkedFiling}</span>
                <ChevronRight size={11} className="opacity-60" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 pt-5 space-y-4">
      {/* Header: Title + Thresholds Gear Icon */}
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold text-white tracking-tight">Alerts</h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg bg-finn-surface border border-[#23272F] text-finn-muted hover:text-white transition-colors"
          title="Thresholds"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Threshold Settings Sheet */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="card space-y-3 overflow-hidden p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-white">Thresholds</h2>
              <button onClick={() => setShowSettings(false)} className="text-finn-muted hover:text-white">
                <X size={14} />
              </button>
            </div>

            <div className="space-y-3 text-xs pt-1">
              <div className="flex items-center justify-between">
                <label className="text-finn-muted">Volume spike multiplier</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1.5"
                    max="5.0"
                    step="0.5"
                    value={settings.volume_multiple}
                    onChange={(e) =>
                      setSettings({ ...settings, volume_multiple: parseFloat(e.target.value) })
                    }
                    className="w-24 accent-finn-accent"
                  />
                  <span className="tabular-nums text-white w-10 text-right">
                    {settings.volume_multiple.toFixed(1)}×
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-finn-muted">Price move threshold</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="2.0"
                    max="10.0"
                    step="1.0"
                    value={settings.price_move_pct}
                    onChange={(e) =>
                      setSettings({ ...settings, price_move_pct: parseFloat(e.target.value) })
                    }
                    className="w-24 accent-finn-accent"
                  />
                  <span className="tabular-nums text-white w-10 text-right">
                    ±{settings.price_move_pct.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveSettings}
              className="w-full py-2 bg-finn-surface hover:bg-finn-surface-hover border border-[#23272F] text-xs font-medium text-white rounded-lg transition-colors mt-2"
            >
              Save Thresholds
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Skeletons / Error / Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 skeleton border-0" />
          ))}
        </div>
      ) : error ? (
        <div className="card text-center py-6 text-xs text-finn-muted space-y-2">
          <p>Failed to load alerts.</p>
          <button
            onClick={loadAlerts}
            className="px-3 py-1 bg-finn-surface border border-[#23272F] rounded text-white hover:border-finn-muted"
          >
            Retry
          </button>
        </div>
      ) : today.length === 0 && earlier.length === 0 ? (
        <div className="card text-center py-6">
          <p className="text-xs text-finn-muted">You&apos;re all caught up</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Today Group */}
          {today.length > 0 && (
            <section className="space-y-2">
              <h2 className="text-xs font-medium text-finn-muted uppercase tracking-wider">Today</h2>
              <div className="space-y-2">{today.map(renderAlertCard)}</div>
            </section>
          )}

          {/* Earlier Group */}
          {earlier.length > 0 && (
            <section className="space-y-2 pt-2">
              <h2 className="text-xs font-medium text-finn-muted uppercase tracking-wider">Earlier</h2>
              <div className="space-y-2 opacity-85">{earlier.map(renderAlertCard)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
