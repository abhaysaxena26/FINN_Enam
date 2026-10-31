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
      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">{children}</main>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-finn-bg/90 backdrop-blur-xl border-t border-finn-border safe-bottom z-50">
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const isActive =
              pathname === tab.href || pathname.startsWith(tab.href + "/");
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-4 rounded-xl transition-colors min-w-[64px] min-h-[44px] justify-center",
                  isActive
                    ? "text-finn-accent"
                    : "text-finn-muted hover:text-finn-text"
                )}
              >
                <div className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                  {isActive && (
                    <motion.div
                      layoutId="tab-indicator"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-finn-accent"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none mt-1">
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
