"""Fetch corporate announcements from BSE API for all tracked companies.

Fetches the last 30 days of corporate announcements with headers:
User-Agent, Referer, Origin. Retries with backoff and saves full snapshot.
"""

import os
import sys
import json
import time
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
import requests

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.core.db import get_db_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("fetch_announcements")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
    "Origin": "https://www.bseindia.com",
    "Accept": "application/json, text/plain, */*",
}


def load_bse_map() -> dict:
    """Load symbol to BSE code map."""
    path = Path("data/bse_scrip_map.json")
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def load_portfolio_symbols() -> list:
    """Load all tracked symbols."""
    path = Path("data/portfolio.json")
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            return [c["symbol"] for c in data.get("portfolio", [])] + [c["symbol"] for c in data.get("watchlist", [])]
    return []


def fetch_announcements_for_scrip(bse_code: str, days: int = 30, retries: int = 3) -> list:
    """Fetch announcements for a single BSE scrip code."""
    today_str = datetime.now().strftime("%Y%m%d")
    prev_str = (datetime.now() - timedelta(days=days)).strftime("%Y%m%d")
    url = f"https://api.bseindia.com/BseIndiaAPI/api/AnnSubCategoryGetData/w?pageno=1&strCat=-1&strPrevDate={prev_str}&strScrip={bse_code}&strSearch=P&strToDate={today_str}&strType=C&subcategory=-1"

    for attempt in range(retries):
        try:
            r = requests.get(url, headers=HEADERS, timeout=10)
            if r.status_code == 200:
                data = r.json()
                table = data.get("Table", [])
                if isinstance(table, list):
                    return table
            time.sleep(1 * (attempt + 1))
        except Exception as e:
            logger.warning(f"BSE fetch attempt {attempt + 1} failed for {bse_code}: {e}")
            time.sleep(1.5 * (attempt + 1))

    return []


def run_fetch():
    """Main announcement fetcher."""
    bse_map = load_bse_map()
    symbols = load_portfolio_symbols()
    
    logger.info(f"Fetching announcements for {len(symbols)} tracked companies...")

    all_announcements = []
    seen_ids = set()

    for sym in symbols:
        bse_code = bse_map.get(sym)
        if not bse_code:
            logger.warning(f"No BSE code for {sym}")
            continue

        raw_items = fetch_announcements_for_scrip(bse_code, days=30)
        logger.info(f"{sym} ({bse_code}): found {len(raw_items)} filings")

        for item in raw_items:
            news_id = str(item.get("NEWSID", "")).strip()
            if not news_id or news_id in seen_ids:
                continue
            seen_ids.add(news_id)

            headline = (item.get("NEWSSUB") or item.get("HEADLINE") or "").strip()
            raw_cat = (item.get("CATEGORYNAME") or "").strip()
            raw_subcat = (item.get("SUBCATNAME") or "").strip()
            dt_tm = item.get("DT_TM") or item.get("NEWS_DT") or datetime.now(timezone.utc).isoformat()
            
            attach_name = item.get("ATTACHMENTNAME", "")
            attachment_url = f"https://www.bseindia.com/xml-data/corpfiling/AttachLive/{attach_name}" if attach_name else None

            all_announcements.append({
                "id": news_id,
                "symbol": sym,
                "bse_code": bse_code,
                "headline": headline,
                "raw_category": raw_cat,
                "raw_subcategory": raw_subcat,
                "attachment_url": attachment_url,
                "attachment_name": attach_name,
                "filed_at": dt_tm,
                "critical": bool(item.get("CRITICALNEWS", 0)),
            })
        
        # Polite delay between BSE requests
        time.sleep(0.3)

    # Sort newest first
    all_announcements.sort(key=lambda x: str(x.get("filed_at")), reverse=True)

    # Save to data/snapshots/raw_announcements.json
    snapshot_path = Path("data/snapshots/raw_announcements.json")
    snapshot_path.parent.mkdir(parents=True, exist_ok=True)
    with open(snapshot_path, "w", encoding="utf-8") as f:
        json.dump(all_announcements, f, indent=2)

    logger.info(f"Total deduplicated announcements fetched: {len(all_announcements)}")
    return all_announcements


if __name__ == "__main__":
    run_fetch()
