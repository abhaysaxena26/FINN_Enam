"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Newspaper, Bell, Search, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const tabs = [
  { href: "/brief", label: "Brief", icon: Newspaper },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/ask", label: "Ask", icon: Search },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
] as const;

export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col min-h-dvh">
      {/* Desktop Top Header Bar (Groww / Kite Style) */}
      <header className="hidden md:flex items-center justify-between px-6 py-3.5 border-b border-finn-border bg-finn-surface/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-finn-accent/15 border border-finn-accent/30 flex items-center justify-center text-finn-accent font-bold text-sm tracking-wider shadow-sm">
            FN
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-finn-text tracking-tight">FINN</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-finn-accent/15 text-finn-accent border border-finn-accent/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-finn-muted">Indian Equity Intelligence Layer</p>
          </div>
        </div>

        {/* Desktop Header Navigation */}
        <div className="flex items-center gap-1 bg-finn-bg p-1 rounded-xl border border-finn-border">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  isActive
                    ? "bg-finn-surface text-finn-accent shadow-sm border border-finn-accent/20"
                    : "text-finn-muted hover:text-finn-text"
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom tab bar (Mobile primary, aligned to container) */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-3xl bg-finn-bg/95 backdrop-blur-2xl border-t border-finn-border safe-bottom z-50">
        <div className="flex items-center justify-around h-16 px-2">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-all min-w-[64px] min-h-[44px] justify-center",
                  isActive
                    ? "text-finn-accent font-semibold"
                    : "text-finn-muted hover:text-finn-text"
                )}
              >
                <div className="relative">
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} />
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-finn-accent shadow-sm shadow-finn-accent"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[11px] leading-none mt-1.5">
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
