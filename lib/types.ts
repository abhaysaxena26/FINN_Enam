/* FINN — shared TypeScript types */

export interface Holding {
  symbol: string;
  name: string;
  sector: string;
  qty: number;
  avg_price: number;
  ltp: number;
  day_change_pct: number;
  pnl: number;
  sparkline?: number[];
  has_filing?: boolean;
}

export interface PortfolioResponse {
  holdings: Holding[];
  total_value: number;
  day_pnl: number;
  day_pnl_pct: number;
}

export interface DigestCard {
  id: string;
  symbol: string;
  company: string;
  category: string;
  materiality: number;
  headline: string;
  one_liner: string;
  card_type: string;
  card_payload?: Record<string, unknown>;
  filed_at: string;
  attachment_url?: string;
}

export interface DigestItem {
  id: string;
  symbol: string;
  category: string;
  headline: string;
  one_liner: string;
  filed_at: string;
}

export interface DigestResponse {
  window: string;
  material: DigestCard[];
  medium: DigestItem[];
  routine: {
    count: number;
    summary?: string;
    items: DigestItem[];
  };
}

export interface Alert {
  id: string;
  symbol: string;
  type: "volume_spike" | "price_move" | "material_announcement";
  value: number;
  threshold: number;
  message: string;
  triggered_at: string;
  seen: boolean;
  announcement_id?: string;
}

export interface AlertSettings {
  volume_multiple: number;
  volume_lookback: number;
  price_move_pct: number;
  categories: string[];
}

export interface ResearchView {
  symbol: string;
  view: string;
  payload: Record<string, unknown>;
  sources: Array<{ doc: string; page: number; label: string; url: string }>;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_usd: number;
  created_at: string;
}

export interface ResearchJob {
  id: string;
  symbol: string;
  status: "pending" | "running" | "done" | "error";
  step: string;
  error?: string;
}

export type AnnouncementCategory =
  | "results"
  | "M&A"
  | "fund_raise"
  | "management_change"
  | "litigation"
  | "insider_trading"
  | "earnings_call"
  | "investor_meetings"
  | "credit_rating"
  | "dividend"
  | "bonus_split"
  | "capex"
  | "press_release"
  | "postal_ballot"
  | "agm_egm"
  | "pledging"
  | "unclassified";
