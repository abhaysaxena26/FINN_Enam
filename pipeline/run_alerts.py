"""Alerts evaluation engine.

Monitors:
- Volume spike: volume > volume_multiple * 20-day avg volume
- Price move: |day_change_pct| > price_move_pct
- Material announcement: high-materiality filing in user categories
- Coincidence detection: links price/volume move to filings on the same/previous day ("Why it moved")
"""

import os
import sys
import json
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.core.db import get_db_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("run_alerts")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def load_alert_settings() -> dict:
    """Load settings or default."""
    path = Path("data/alert_settings.json")
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "volume_multiple": 2.0,
        "volume_lookback": 20,
        "price_move_pct": 5.0,
        "categories": ["results", "M&A", "management_change", "fund_raise", "litigation", "credit_rating", "pledging"]
    }


def run_alerts():
    settings = load_alert_settings()
    vol_thresh = float(settings.get("volume_multiple", 2.0))
    price_thresh = float(settings.get("price_move_pct", 5.0))
    watched_cats = set(settings.get("categories", []))

    # Load price snapshot
    p_path = Path("data/snapshots/portfolio.json")
    if not p_path.exists():
        logger.warning("No portfolio snapshot found.")
        return
    with open(p_path, "r", encoding="utf-8") as f:
        p_snap = json.load(f)

    # Load announcements snapshot
    d_path = Path("data/snapshots/digest.json")
    announcements_by_sym = {}
    if d_path.exists():
        with open(d_path, "r", encoding="utf-8") as f:
            d_snap = json.load(f)
            for item in d_snap.get("material", []) + d_snap.get("medium", []):
                sym = item["symbol"]
                if sym not in announcements_by_sym:
                    announcements_by_sym[sym] = []
                announcements_by_sym[sym].append(item)

    alerts = []
    alert_idx = 1
    all_prices = p_snap.get("all_prices", {})

    for sym, p_info in all_prices.items():
        vol_mult = p_info.get("volume_multiple", 1.0)
        day_chg = p_info.get("day_change_pct", 0.0)
        updated_at = p_info.get("updated_at", datetime.now(timezone.utc).isoformat())

        # Check for coincident filing
        coincident = None
        if sym in announcements_by_sym and announcements_by_sym[sym]:
            latest_filing = announcements_by_sym[sym][0]
            coincident = f"{latest_filing.get('category').capitalize()}: {latest_filing.get('one_liner')}"

        # 1. Volume spike
        if vol_mult >= vol_thresh:
            alerts.append({
                "id": f"alert-vol-{sym}-{alert_idx}",
                "symbol": sym,
                "type": "volume_spike",
                "value": vol_mult,
                "threshold": vol_thresh,
                "message": f"Volume {vol_mult}x its 20-day average",
                "coincident_filing": coincident,
                "triggered_at": updated_at,
                "seen": False,
            })
            alert_idx += 1

        # 2. Price move
        if abs(day_chg) >= price_thresh:
            dir_str = "jumped" if day_chg > 0 else "dropped"
            alerts.append({
                "id": f"alert-prc-{sym}-{alert_idx}",
                "symbol": sym,
                "type": "price_move",
                "value": round(day_chg, 2),
                "threshold": price_thresh,
                "message": f"Price {dir_str} {abs(day_chg):.1f}% in a single day",
                "coincident_filing": coincident,
                "triggered_at": updated_at,
                "seen": False,
            })
            alert_idx += 1

    # 3. Material announcements in watched categories
    if d_path.exists():
        with open(d_path, "r", encoding="utf-8") as f:
            d_snap = json.load(f)
            for card in d_snap.get("material", [])[:15]:
                if card.get("category") in watched_cats and card.get("materiality", 0) >= 3:
                    alerts.append({
                        "id": f"alert-ann-{card['id']}",
                        "symbol": card["symbol"],
                        "type": "material_announcement",
                        "value": card.get("materiality", 3),
                        "threshold": 3,
                        "message": f"{card['company']}: {card.get('one_liner')}",
                        "coincident_filing": f"{card.get('headline')}",
                        "triggered_at": card.get("filed_at", datetime.now(timezone.utc).isoformat()),
                        "seen": False,
                        "announcement_id": card["id"],
                    })

    # Sort alerts newest first
    alerts.sort(key=lambda x: str(x.get("triggered_at")), reverse=True)

    # Save to data/snapshots/alerts.json
    snapshot_dir = Path("data/snapshots")
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    with open(snapshot_dir / "alerts.json", "w", encoding="utf-8") as f:
        json.dump({"alerts": alerts, "updated_at": datetime.now(timezone.utc).isoformat()}, f, indent=2)

    logger.info(f"Triggered {len(alerts)} alerts based on current settings.")


if __name__ == "__main__":
    run_alerts()
