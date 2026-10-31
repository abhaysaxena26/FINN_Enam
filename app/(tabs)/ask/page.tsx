"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, Clock, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import Link from "next/link";

interface SearchResult {
  symbol: string;
  name: string;
  sector?: string;
}

const recentSearches = ["RELIANCE", "HDFCBANK", "DIXON", "TRENT"];
const watchlist = [
  { symbol: "ASIANPAINT", name: "Asian Paints", sector: "Paints" },
  { symbol: "PIDILITIND", name: "Pidilite Industries", sector: "Chemicals" },
  { symbol: "HAL", name: "Hindustan Aeronautics", sector: "Defence" },
  { symbol: "IRCTC", name: "IRCTC", sector: "Travel" },
];

export default function AskPage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      api<{ results: SearchResult[] }>("/search", { params: { q: query.trim() } })
        .then((res) => setResults(res.results || []))
        .catch(() => {});
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="px-4 pt-14 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-finn-text">Research</h1>
        <p className="text-sm text-finn-muted mt-0.5">
          Ask or deep-dive into any NSE company
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all",
            focused
              ? "bg-finn-surface border-finn-accent/40 shadow-lg shadow-finn-accent/5"
              : "bg-finn-surface border-finn-border"
          )}
        >
          <Search size={18} className="text-finn-muted shrink-0" />
          <input
            type="text"
            placeholder="Search any NSE symbol (e.g. RELIANCE, TCS)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 250)}
            className="bg-transparent text-sm text-finn-text placeholder:text-finn-muted/60 outline-none w-full"
          />
        </div>

        {/* Autocomplete dropdown */}
        <AnimatePresence>
          {focused && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="absolute top-full left-0 right-0 mt-2 bg-finn-surface border border-finn-border rounded-2xl overflow-hidden z-50 shadow-2xl shadow-black/60"
            >
              {results.map((company) => (
                <Link
                  key={company.symbol}
                  href={`/company/${company.symbol}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-finn-surface-hover transition-colors border-b border-finn-border-subtle last:border-0"
                >
                  <div>
                    <span className="text-sm font-bold text-finn-text">
                      {company.symbol}
                    </span>
                    <span className="text-xs text-finn-muted ml-2">
                      {company.name} {company.sector ? `· ${company.sector}` : ""}
                    </span>
                  </div>
                  <ChevronRight size={14} className="text-finn-muted" />
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-finn-muted uppercase tracking-wider mb-3">
            Recent Queries
          </h3>
          <div className="flex gap-2 flex-wrap">
            {recentSearches.map((symbol) => (
              <Link
                key={symbol}
                href={`/company/${symbol}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-finn-surface border border-finn-border text-xs font-medium text-finn-text hover:border-finn-accent/30 transition-colors"
              >
                <Clock size={12} className="text-finn-muted" />
                {symbol}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Watchlist */}
      <section>
        <h3 className="text-xs font-semibold text-finn-muted uppercase tracking-wider mb-3">
          Research Watchlist
        </h3>
        <div className="space-y-1">
          {watchlist.map((company) => (
            <Link
              key={company.symbol}
              href={`/company/${company.symbol}`}
              className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-finn-surface transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-finn-accent/10 flex items-center justify-center text-finn-accent text-xs font-bold">
                  {company.symbol.slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-finn-text">
                    {company.symbol}
                  </p>
                  <p className="text-[11px] text-finn-muted">
                    {company.name} · {company.sector}
                  </p>
                </div>
              </div>
              <ChevronRight
                size={16}
                className="text-finn-muted opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
