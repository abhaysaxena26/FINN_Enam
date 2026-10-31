import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number in Indian locale with ₹ symbol.
 * e.g. 123456.78 → "₹1,23,456.78"
 */
export function formatINR(value: number, decimals = 0): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format large numbers in Crores.
 * e.g. 1234567890 → "₹123.46 Cr"
 */
export function formatCr(value: number): string {
  const cr = value / 1e7;
  if (cr >= 100) return `₹${Math.round(cr).toLocaleString("en-IN")} Cr`;
  if (cr >= 10) return `₹${cr.toFixed(1)} Cr`;
  return `₹${cr.toFixed(2)} Cr`;
}

/**
 * Format percentage with sign.
 * e.g. 1.23 → "+1.23%", -0.45 → "−0.45%"
 */
export function formatPct(value: number, decimals = 2): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(decimals)}%`;
}

/**
 * Relative time string (e.g. "2h ago", "3d ago").
 */
export function timeAgo(date: string | Date): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
