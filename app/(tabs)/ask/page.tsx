"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronRight, ArrowRight } from "lucide-react";
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);

  const handleSelect = (sym: string) => {
    router.push(`/company/${sym.trim().toUpperCase()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      handleSelect(query);
    }
  };

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
    <div className="px-4 pt-5 space-y-4">
      {/* Title: Research only, no subtitle */}
      <div>
        <h1 className="text-[22px] font-semibold text-white tracking-tight">Research</h1>
      </div>

      {/* Search bar */}
      <div className="space-y-1.5">
        <div
          className={cn(
            "flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-colors bg-finn-surface",
            focused ? "border-finn-accent/50" : "border-[#23272F]"
          )}
        >
          <Search size={16} className="text-finn-muted shrink-0" />
          <input
            type="text"
            placeholder="Search any NSE company"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 250)}
            className="bg-transparent text-xs text-white placeholder:text-finn-muted outline-none w-full"
          />
          {query.trim().length > 0 && (
            <button
              onClick={() => handleSelect(query)}
              className="px-2 py-0.5 rounded bg-finn-bg text-white text-xs hover:text-finn-accent transition-colors shrink-0 flex items-center gap-1"
            >
              <span>Go</span>
              <ArrowRight size={11} />
            </button>
          )}
        </div>

        {/* Small grey line under search bar */}
        <p className="text-[11px] text-finn-muted px-1">
          Answers cite annual reports and concall transcripts only.
        </p>

        {/* Autocomplete dropdown */}
        {focused && results.length > 0 && (
          <div className="card p-0 divide-y divide-[#23272F] overflow-hidden mt-1 shadow-xl">
            {results.map((company) => (
              <Link
                key={company.symbol}
                href={`/company/${company.symbol}`}
                className="flex items-center justify-between px-3.5 py-2.5 hover:bg-finn-surface-hover text-xs"
              >
                <div>
                  <span className="font-bold text-white">{company.symbol}</span>
                  <span className="text-finn-muted ml-2">
                    {company.name} {company.sector ? `· ${company.sector}` : ""}
                  </span>
                </div>
                <ChevronRight size={13} className="text-finn-muted" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent queries */}
      {recentSearches.length > 0 && (
        <section className="space-y-2 pt-1">
          <h2 className="text-xs font-medium text-finn-muted uppercase tracking-wider">
            Recent
          </h2>
          <div className="flex gap-1.5 flex-wrap">
            {recentSearches.map((symbol) => (
              <Link
                key={symbol}
                href={`/company/${symbol}`}
                className="px-3 py-1.5 rounded-lg bg-finn-surface border border-[#23272F] text-xs font-medium text-white hover:border-finn-muted transition-colors"
              >
                {symbol}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Watchlist */}
      <section className="space-y-2 pt-2">
        <h2 className="text-xs font-medium text-finn-muted uppercase tracking-wider">
          Watchlist
        </h2>
        <div className="card p-0 divide-y divide-[#23272F] overflow-hidden">
          {watchlist.map((company) => (
            <Link
              key={company.symbol}
              href={`/company/${company.symbol}`}
              className="flex items-center justify-between px-3.5 py-3 hover:bg-finn-surface-hover transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-white">{company.symbol}</p>
                <p className="text-[11px] text-finn-muted">
                  {company.name} · {company.sector}
                </p>
              </div>
              <ChevronRight size={14} className="text-finn-muted" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
