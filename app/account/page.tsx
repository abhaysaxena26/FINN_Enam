"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  User,
  PieChart,
  Eye,
  Sliders,
  Sparkles,
  Info,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Cpu,
  Layers,
} from "lucide-react";
import { formatINR, formatIndianNumber } from "@/lib/utils";

interface Holding {
  symbol: string;
  qty: number;
  avg_price: number;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<string | null>(null);

  // Editable portfolio state
  const [holdings, setHoldings] = useState<Holding[]>([
    { symbol: "RELIANCE", qty: 25, avg_price: 1164.9 },
    { symbol: "HDFCBANK", qty: 50, avg_price: 692.8 },
    { symbol: "TCS", qty: 15, avg_price: 2502.6 },
    { symbol: "BHARTIARTL", qty: 30, avg_price: 1973.7 },
    { symbol: "ITC", qty: 100, avg_price: 265.6 },
    { symbol: "LT", qty: 12, avg_price: 3871.7 },
    { symbol: "SUNPHARMA", qty: 40, avg_price: 1777.7 },
    { symbol: "TRENT", qty: 10, avg_price: 5873.0 },
  ]);
  const [newSym, setNewSym] = useState("");
  const [newQty, setNewQty] = useState(10);
  const [newPrice, setNewPrice] = useState(1000);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Watchlist state
  const [watchlist, setWatchlist] = useState<string[]>([
    "ASIANPAINT",
    "PIDILITIND",
    "HAL",
    "IRCTC",
    "TITAN",
  ]);
  const [newWatch, setNewWatch] = useState("");

  // Alert Thresholds
  const [volumeMultiple, setVolumeMultiple] = useState(3.0);
  const [priceMovePct, setPriceMovePct] = useState(5.0);
  const [lookbackDays, setLookbackDays] = useState(20);
  const [alertResults, setAlertResults] = useState(true);
  const [alertMgmt, setAlertMgmt] = useState(true);
  const [alertMA, setAlertMA] = useState(true);

  // Digest Preferences
  const [defaultWindow, setDefaultWindow] = useState("24h");

  // Load from localStorage or API
  useEffect(() => {
    try {
      const savedH = localStorage.getItem("finn_portfolio_holdings");
      if (savedH) setHoldings(JSON.parse(savedH));

      const savedW = localStorage.getItem("finn_watchlist");
      if (savedW) setWatchlist(JSON.parse(savedW));

      const savedT = localStorage.getItem("finn_alert_thresholds");
      if (savedT) {
        const t = JSON.parse(savedT);
        if (t.volume_threshold) setVolumeMultiple(t.volume_threshold);
        if (t.price_change_threshold) setPriceMovePct(t.price_change_threshold);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveHoldings = (newH: Holding[]) => {
    setHoldings(newH);
    try {
      localStorage.setItem("finn_portfolio_holdings", JSON.stringify(newH));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      // ignore
    }
  };

  const addHolding = () => {
    if (!newSym.trim()) return;
    const updated = [
      ...holdings,
      { symbol: newSym.trim().toUpperCase(), qty: Number(newQty), avg_price: Number(newPrice) },
    ];
    saveHoldings(updated);
    setNewSym("");
  };

  const removeHolding = (symbol: string) => {
    const updated = holdings.filter((h) => h.symbol !== symbol);
    saveHoldings(updated);
  };

  const addWatch = () => {
    if (!newWatch.trim()) return;
    const updated = [...watchlist, newWatch.trim().toUpperCase()];
    setWatchlist(updated);
    localStorage.setItem("finn_watchlist", JSON.stringify(updated));
    setNewWatch("");
  };

  const removeWatch = (sym: string) => {
    const updated = watchlist.filter((s) => s !== sym);
    setWatchlist(updated);
    localStorage.setItem("finn_watchlist", JSON.stringify(updated));
  };

  const saveThresholds = () => {
    const t = {
      volume_threshold: volumeMultiple,
      price_change_threshold: priceMovePct,
      lookback_days: lookbackDays,
    };
    localStorage.setItem("finn_alert_thresholds", JSON.stringify(t));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="flex-1 p-4 pb-24 space-y-4">
      {/* Back button and Title */}
      <div className="flex items-center justify-between">
        <Link
          href="/today"
          className="inline-flex items-center gap-1 text-xs text-finn-muted hover:text-white transition-colors"
        >
          <ChevronLeft size={16} />
          <span>Back</span>
        </Link>
        <span className="text-xs uppercase tracking-wider text-finn-muted font-semibold">Account</span>
        <div className="w-8" />
      </div>

      {/* Profile Header */}
      <div className="card flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-[#1A1E24] border border-[#2DD4BF] text-[#2DD4BF] text-base font-semibold flex items-center justify-center shrink-0">
          SJ
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-white">Sanyam Jain</span>
            <span className="text-[10px] bg-finn-surface px-1.5 py-0.5 rounded text-finn-muted border border-[#23272F]">
              Demo
            </span>
          </div>
          <p className="text-xs text-finn-muted truncate">sanyam@enam.com</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-[#2DD4BF]/10 border border-[#2DD4BF]/40 text-[#2DD4BF] text-xs px-3 py-2 rounded-lg flex items-center gap-2">
          <Check size={14} />
          <span>Settings saved successfully.</span>
        </div>
      )}

      {/* iOS-Style Settings Groups */}
      <div className="space-y-3">
        {/* Group 1: Portfolio & Watchlist */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-finn-muted uppercase tracking-wider px-1">
            Investments
          </span>
          <div className="card divide-y divide-[#23272F] p-0 overflow-hidden">
            {/* My Portfolio */}
            <button
              onClick={() => setActiveTab(activeTab === "portfolio" ? null : "portfolio")}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#1A1E24] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <PieChart size={16} className="text-[#2DD4BF]" />
                <span className="text-xs font-medium text-white">My Portfolio</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-finn-muted">
                <span>{holdings.length} holdings</span>
                <ChevronRight
                  size={14}
                  className={`transition-transform ${activeTab === "portfolio" ? "rotate-90" : ""}`}
                />
              </div>
            </button>

            {activeTab === "portfolio" && (
              <div className="p-3 bg-[#111418] space-y-3 text-xs">
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {holdings.map((h) => (
                    <div
                      key={h.symbol}
                      className="flex items-center justify-between p-2 rounded bg-finn-surface border border-[#23272F]"
                    >
                      <div>
                        <span className="font-semibold text-white">{h.symbol}</span>
                        <div className="text-[10px] text-finn-muted">
                          {h.qty} shares @ ₹{h.avg_price}
                        </div>
                      </div>
                      <button
                        onClick={() => removeHolding(h.symbol)}
                        className="text-finn-loss hover:opacity-80 p-1"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add holding form */}
                <div className="pt-2 border-t border-[#23272F] grid grid-cols-4 gap-1.5">
                  <input
                    type="text"
                    placeholder="TICKER"
                    value={newSym}
                    onChange={(e) => setNewSym(e.target.value.toUpperCase())}
                    className="col-span-2 bg-[#0B0D10] border border-[#23272F] rounded px-2 py-1 text-white text-xs"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="bg-[#0B0D10] border border-[#23272F] rounded px-2 py-1 text-white text-xs"
                  />
                  <button
                    onClick={addHolding}
                    className="bg-[#2DD4BF] text-black font-semibold rounded px-2 py-1 text-xs hover:opacity-90 flex items-center justify-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            {/* Watchlist */}
            <button
              onClick={() => setActiveTab(activeTab === "watchlist" ? null : "watchlist")}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#1A1E24] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Eye size={16} className="text-[#2DD4BF]" />
                <span className="text-xs font-medium text-white">Watchlist</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-finn-muted">
                <span>{watchlist.length} tracked</span>
                <ChevronRight
                  size={14}
                  className={`transition-transform ${activeTab === "watchlist" ? "rotate-90" : ""}`}
                />
              </div>
            </button>

            {activeTab === "watchlist" && (
              <div className="p-3 bg-[#111418] space-y-3 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {watchlist.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-1 rounded bg-finn-surface border border-[#23272F] text-white flex items-center gap-1.5"
                    >
                      <span>{w}</span>
                      <button onClick={() => removeWatch(w)} className="text-finn-muted hover:text-white">
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    placeholder="Add NSE Symbol (e.g. COLPAL)"
                    value={newWatch}
                    onChange={(e) => setNewWatch(e.target.value.toUpperCase())}
                    className="flex-1 bg-[#0B0D10] border border-[#23272F] rounded px-2 py-1 text-white text-xs"
                  />
                  <button
                    onClick={addWatch}
                    className="bg-[#2DD4BF] text-black font-semibold rounded px-3 py-1 text-xs hover:opacity-90"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Group 2: Intelligence & Preferences */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-finn-muted uppercase tracking-wider px-1">
            Rules & Digest
          </span>
          <div className="card divide-y divide-[#23272F] p-0 overflow-hidden">
            {/* Alert Thresholds */}
            <button
              onClick={() => setActiveTab(activeTab === "thresholds" ? null : "thresholds")}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#1A1E24] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Sliders size={16} className="text-[#2DD4BF]" />
                <span className="text-xs font-medium text-white">Alert Thresholds</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-finn-muted">
                <span>{volumeMultiple}× vol · {priceMovePct}% price</span>
                <ChevronRight
                  size={14}
                  className={`transition-transform ${activeTab === "thresholds" ? "rotate-90" : ""}`}
                />
              </div>
            </button>

            {activeTab === "thresholds" && (
              <div className="p-3 bg-[#111418] space-y-3 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-finn-muted">Volume Multiple Threshold:</span>
                    <span className="font-semibold text-white">{volumeMultiple.toFixed(1)}×</span>
                  </div>
                  <input
                    type="range"
                    min="1.5"
                    max="6.0"
                    step="0.5"
                    value={volumeMultiple}
                    onChange={(e) => setVolumeMultiple(Number(e.target.value))}
                    className="w-full accent-[#2DD4BF]"
                  />

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-finn-muted">Price Move Trigger (1-day):</span>
                    <span className="font-semibold text-white">±{priceMovePct.toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="10.0"
                    step="0.5"
                    value={priceMovePct}
                    onChange={(e) => setPriceMovePct(Number(e.target.value))}
                    className="w-full accent-[#2DD4BF]"
                  />
                </div>
                <button
                  onClick={saveThresholds}
                  className="w-full py-1.5 rounded bg-[#2DD4BF] text-black font-semibold text-xs hover:opacity-90 mt-2"
                >
                  Save Thresholds
                </button>
              </div>
            )}

            {/* Digest Preferences */}
            <button
              onClick={() => setActiveTab(activeTab === "digest" ? null : "digest")}
              className="w-full flex items-center justify-between p-3.5 hover:bg-[#1A1E24] transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles size={16} className="text-[#2DD4BF]" />
                <span className="text-xs font-medium text-white">Digest Preferences</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-finn-muted">
                <span>Default: {defaultWindow}</span>
                <ChevronRight
                  size={14}
                  className={`transition-transform ${activeTab === "digest" ? "rotate-90" : ""}`}
                />
              </div>
            </button>

            {activeTab === "digest" && (
              <div className="p-3 bg-[#111418] space-y-3 text-xs">
                <span className="text-finn-muted">Default Time Window:</span>
                <div className="grid grid-cols-4 gap-2">
                  {(["24h", "3d", "7d", "30d"] as const).map((w) => (
                    <button
                      key={w}
                      onClick={() => setDefaultWindow(w)}
                      className={`py-1.5 rounded text-xs font-medium border ${
                        defaultWindow === w
                          ? "bg-[#2DD4BF] text-black border-[#2DD4BF]"
                          : "bg-finn-surface text-finn-muted border-[#23272F]"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Group 3: LLM Efficiency & Cost Dashboard */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-finn-muted uppercase tracking-wider px-1">
            System & LLM Cost
          </span>
          <div className="card space-y-3">
            <div className="flex items-center justify-between border-b border-[#23272F] pb-2">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-[#2DD4BF]" />
                <span className="text-xs font-semibold text-white">Gemini Model Routing</span>
              </div>
              <span className="text-[10px] bg-[#2DD4BF]/10 text-[#2DD4BF] px-1.5 py-0.5 rounded border border-[#2DD4BF]/30 font-semibold">
                Flash + Pro Tier
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-finn-surface border border-[#23272F] space-y-1">
                <span className="text-[10px] text-finn-muted uppercase">Today&apos;s LLM Calls</span>
                <p className="text-sm font-semibold text-white tabular-nums">24 calls</p>
                <span className="text-[10px] text-finn-muted">21 Flash · 3 Pro</span>
              </div>
              <div className="p-2.5 rounded bg-finn-surface border border-[#23272F] space-y-1">
                <span className="text-[10px] text-finn-muted uppercase">Tokens Processed</span>
                <p className="text-sm font-semibold text-white tabular-nums">68,420</p>
                <span className="text-[10px] text-finn-muted">84% cache hit rate</span>
              </div>
            </div>

            <div className="p-2.5 rounded bg-finn-surface border border-[#23272F] flex items-center justify-between text-xs">
              <div>
                <span className="text-white font-medium">Estimated Daily Cost</span>
                <p className="text-[10px] text-finn-muted">Zero-cost rule classification + chunked retrieval</p>
              </div>
              <span className="text-sm font-bold text-[#2DD4BF] tabular-nums">≈ ₹3.42</span>
            </div>

            <div className="text-[11px] text-finn-muted space-y-1 border-t border-[#23272F] pt-2">
              <div className="flex justify-between">
                <span>Rule-based extraction:</span>
                <span className="text-white">Free (Python engine)</span>
              </div>
              <div className="flex justify-between">
                <span>Gemini 2.5 Flash:</span>
                <span className="text-white">Guidance & Fact Extraction</span>
              </div>
              <div className="flex justify-between">
                <span>Gemini 2.5 Pro:</span>
                <span className="text-white">Credibility & Verdict Synthesis</span>
              </div>
            </div>
          </div>
        </div>

        {/* Group 4: About */}
        <div className="space-y-1">
          <span className="text-[11px] font-semibold text-finn-muted uppercase tracking-wider px-1">
            About
          </span>
          <div className="card divide-y divide-[#23272F] p-0 overflow-hidden text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="text-finn-muted">Data Sources</span>
              <span className="text-white font-medium text-right">
                yfinance EOD · BSE Filings · Concall Transcripts
              </span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-finn-muted">Version</span>
              <span className="text-white font-medium">FINN v2.0.0</span>
            </div>
            <a
              href="https://github.com/abhaysaxena26/FINN_Enam"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 flex items-center justify-between hover:bg-[#1A1E24] transition-colors"
            >
              <span className="text-white font-medium">GitHub Repository</span>
              <ExternalLink size={14} className="text-finn-muted" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
