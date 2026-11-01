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
 * Format percentage with sign and 1 decimal place.
 * e.g. 5.41 → "+5.4%", -0.21 → "−0.2%"
 */
export function formatPct(value: number, decimals = 1): string {
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${Math.abs(value).toFixed(decimals)}%`;
}

/**
 * Format volume or valuation multiple.
 * e.g. 3.86 → "3.9×"
 */
export function formatMultiple(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}×`;
}

/**
 * Format number with Indian commas without currency.
 * e.g. 235089 → "2,35,089"
 */
export function formatIndianNumber(value: number): string {
  return Math.round(value).toLocaleString("en-IN");
}

/**
 * Clean raw corporate announcement text into concise sentence-case summary.
 */
export function cleanFilingText(text: string): string {
  if (!text) return "";
  let clean = text
    .replace(/^Board Meeting Outcome for Board Meeting Outcome For/i, "Board meeting outcome:")
    .replace(/^Board Meeting Outcome for Outcome Of Board Meeting Held Today/i, "Board meeting outcome:")
    .replace(/^Board Meeting Outcome for Outcome Of Board Meeting/i, "Board meeting outcome:")
    .replace(/^Board Meeting Outcome for/i, "Board meeting outcome:")
    .replace(/^Board Meeting Intimation for/i, "Board meeting intimation:")
    .replace(/^Announcement under Regulation 30 \(LODR\)-/i, "")
    .replace(/^Outcome of Board Meeting held today i\.e\. 29th/i, "Board meeting outcome (29 Oct):")
    .replace(/I\.E\.\s*29Th\s*(October)?/gi, "29 Oct")
    .replace(/30Th\s+September/gi, "30 Sep")
    .replace(/31St\s+March/gi, "31 Mar")
    .replace(/30Th\s+June/gi, "30 Jun")
    .replace(/31St\s+December/gi, "31 Dec")
    .replace(/30Th/gi, "30 Sep")
    .replace(/31St/gi, "31 Mar")
    .replace(/29Th/gi, "29 Oct")
    .replace(/Unaudited Financial Results? \(Consolidated And Standalone\)/i, "Financial results")
    .replace(/Unaudited Financial Results?/i, "Financial results")
    .replace(/For The Quarter And Half Year Ended September 30, 2026/i, "Q2 FY27")
    .replace(/For The Quarter And Half Year Ended 30Th September, 2026/i, "Q2 FY27")
    .replace(/For Quarter Ended September 30, 2026/i, "Q2 FY27")
    .replace(/And Issuance Non-Convertible Debentures/i, "and NCD issuance")
    .replace(/30 Sep September/gi, "30 Sep")
    .replace(/\s+/g, " ")
    .trim();

  // If starts with lower case, capitalize first letter
  if (clean.length > 0) {
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
  }
  return clean;
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
