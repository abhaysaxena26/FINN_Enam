"""Refresh daily prices for all tracked companies using yfinance.

Downloads ~1 year of daily OHLCV, computes:
- 1-day % change
- Volume / 20-day avg volume (volume multiple)
- 52-week high & low
- 30-day sparkline closes
Upserts into DB if configured, and saves full fallback snapshot to data/snapshots/portfolio.json.
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
import yfinance as yf

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.core.db import get_db_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("refresh_prices")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def load_portfolio_config() -> dict:
    """Load companies from data/portfolio.json."""
    config_path = Path("data/portfolio.json")
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def refresh_prices():
    """Main price refresh job."""
    config = load_portfolio_config()
    portfolio_holdings = {c["symbol"]: c for c in config.get("portfolio", [])}
    watchlist_items = {c["symbol"]: c for c in config.get("watchlist", [])}
    all_symbols = list(portfolio_holdings.keys()) + list(watchlist_items.keys())

    logger.info(f"Refreshing prices for {len(all_symbols)} symbols...")

    # Format for yfinance batch download
    tickers_map = {f"{sym}.NS": sym for sym in all_symbols}
    ticker_str = " ".join(tickers_map.keys())

    try:
        data = yf.download(ticker_str, period="1y", interval="1d", group_by="ticker", auto_adjust=True, progress=False)
    except Exception as e:
        logger.error(f"yfinance download failed: {e}")
        return

    processed_data = {}
    enriched_portfolio = []
    total_val = 0.0
    total_invested = 0.0
    day_pnl_total = 0.0

    for ticker_ns, sym in tickers_map.items():
        try:
            # Handle multi-index columns vs single ticker
            if len(all_symbols) == 1:
                df = data
            else:
                if ticker_ns in data.columns.levels[0]:
                    df = data[ticker_ns].dropna()
                else:
                    logger.warning(f"No data for {ticker_ns}")
                    continue

            if df.empty or len(df) < 2:
                continue

            latest_close = float(df["Close"].iloc[-1])
            prev_close = float(df["Close"].iloc[-2])
            day_change_pct = ((latest_close - prev_close) / prev_close) * 100.0

            # 20-day average volume
            vol_20d = float(df["Volume"].iloc[-21:-1].mean()) if len(df) > 20 else float(df["Volume"].mean())
            latest_vol = float(df["Volume"].iloc[-1])
            vol_multiple = round(latest_vol / vol_20d, 2) if vol_20d > 0 else 1.0

            # 52-week high & low
            high_52w = float(df["High"].max())
            low_52w = float(df["Low"].min())

            # 30-day sparkline
            sparkline = [round(float(c), 2) for c in df["Close"].iloc[-30:].tolist()]

            # Historical prices for DB upsert (last 30 days)
            recent_rows = []
            for date_idx, row in df.iloc[-30:].iterrows():
                d_str = date_idx.strftime("%Y-%m-%d")
                recent_rows.append({
                    "date": d_str,
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]),
                })

            item = {
                "symbol": sym,
                "ltp": round(latest_close, 2),
                "prev_close": round(prev_close, 2),
                "day_change_pct": round(day_change_pct, 2),
                "volume": int(latest_vol),
                "volume_multiple": vol_multiple,
                "high_52w": round(high_52w, 2),
                "low_52w": round(low_52w, 2),
                "sparkline": sparkline,
                "recent_prices": recent_rows,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            processed_data[sym] = item

            # If it's a portfolio company, enrich with qty, avg_price, pnl
            if sym in portfolio_holdings:
                p_info = portfolio_holdings[sym]
                qty = p_info.get("qty", 0)
                avg_price = p_info.get("avg_price", 0.0)
                cur_val = qty * latest_close
                inv_val = qty * avg_price
                pnl = cur_val - inv_val
                pnl_pct = ((latest_close - avg_price) / avg_price) * 100 if avg_price > 0 else 0.0
                day_pnl = qty * (latest_close - prev_close)

                total_val += cur_val
                total_invested += inv_val
                day_pnl_total += day_pnl

                enriched_portfolio.append({
                    "symbol": sym,
                    "name": p_info.get("name", sym),
                    "sector": p_info.get("sector", "Diversified"),
                    "mcap_bucket": p_info.get("mcap_bucket", "large"),
                    "qty": qty,
                    "avg_price": avg_price,
                    "ltp": round(latest_close, 2),
                    "day_change_pct": round(day_change_pct, 2),
                    "pnl": round(pnl, 2),
                    "pnl_pct": round(pnl_pct, 2),
                    "sparkline": sparkline,
                    "volume_multiple": vol_multiple,
                    "has_filing": False, # Populated by announcement classifier
                })

        except Exception as e:
            logger.error(f"Error processing {sym}: {e}")

    # Build snapshot payload
    snapshot_payload = {
        "holdings": enriched_portfolio,
        "total_value": round(total_val, 2),
        "total_invested": round(total_invested, 2),
        "total_pnl": round(total_val - total_invested, 2),
        "total_pnl_pct": round(((total_val - total_invested) / total_invested) * 100, 2) if total_invested > 0 else 0.0,
        "day_pnl": round(day_pnl_total, 2),
        "day_pnl_pct": round((day_pnl_total / (total_val - day_pnl_total)) * 100, 2) if (total_val - day_pnl_total) > 0 else 0.0,
        "all_prices": processed_data,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }

    # Save to data/snapshots/portfolio.json
    snapshot_dir = Path("data/snapshots")
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    with open(snapshot_dir / "portfolio.json", "w", encoding="utf-8") as f:
        json.dump(snapshot_payload, f, indent=2)

    logger.info(f"Saved price snapshot with {len(enriched_portfolio)} portfolio holdings and {len(processed_data)} total symbols.")

    # Upsert to database if connection available
    with get_db_connection() as conn:
        if conn:
            try:
                with conn.cursor() as cur:
                    for sym, p_data in processed_data.items():
                        for row in p_data["recent_prices"]:
                            cur.execute(
                                """
                                INSERT INTO prices (symbol, date, open, high, low, close, volume)
                                VALUES (%s, %s, %s, %s, %s, %s, %s)
                                ON CONFLICT (symbol, date) DO UPDATE SET
                                    open = EXCLUDED.open,
                                    high = EXCLUDED.high,
                                    low = EXCLUDED.low,
                                    close = EXCLUDED.close,
                                    volume = EXCLUDED.volume;
                                """,
                                (sym, row["date"], row["open"], row["high"], row["low"], row["close"], row["volume"])
                            )
                logger.info("Successfully upserted recent prices into DB.")
            except Exception as e:
                logger.error(f"Failed to upsert prices to DB: {e}")


if __name__ == "__main__":
    refresh_prices()
