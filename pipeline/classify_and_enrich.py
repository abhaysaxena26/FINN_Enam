"""Classify and prioritize corporate announcements.

Rule-based engine first (zero LLM cost):
Maps BSE categories, subcategories, and headline keywords against data/taxonomy.json.
Calculates materiality (0-3) and priority score:
priority = category_weight * materiality * position_weight

Produces:
- Material cards (results, management change, M&A, fund raise)
- Medium items (dividends, capex, credit rating)
- Routine collapsed summary (ESOPs, compliance certificates, trading windows)
"""

import os
import sys
import json
import logging
from datetime import datetime, timezone
from pathlib import Path

# Ensure project root is in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from api.core.db import get_db_connection

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("classify_and_enrich")

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")


def load_taxonomy() -> dict:
    with open("data/taxonomy.json", "r", encoding="utf-8") as f:
        return json.load(f)


def load_raw_announcements() -> list:
    path = Path("data/snapshots/raw_announcements.json")
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def load_portfolio_config() -> dict:
    with open("data/portfolio.json", "r", encoding="utf-8") as f:
        return json.load(f)


def classify_announcement(item: dict, taxonomy: dict) -> tuple:
    """Rule-based classification against taxonomy.
    
    Returns: (category, materiality 0-3, card_type, one_liner)
    """
    headline = (item.get("headline") or "").lower()
    raw_cat = (item.get("raw_category") or "").lower()
    raw_subcat = (item.get("raw_subcategory") or "").lower()
    full_text = f"{raw_cat} {raw_subcat} {headline}"

    categories = taxonomy.get("categories", {})

    # 1. High-priority checks
    # Results
    if any(k in full_text for k in categories["results"]["keywords"]) or "financial results" in raw_subcat:
        # Check if it's board meeting intimation vs actual outcome
        if "outcome" in full_text or "financial results" in full_text or "unaudited" in full_text or "audited" in full_text:
            return "results", 3, "results", clean_one_liner(item.get("headline"), "results")
        return "results", 1, "generic", clean_one_liner(item.get("headline"), "results")

    # Management change
    if any(k in full_text for k in categories["management_change"]["keywords"]) or "directors" in raw_cat:
        if any(cxo in full_text for cxo in ["cfo", "ceo", "managing director", "director", "kmp"]):
            return "management_change", 3, "management_change", clean_one_liner(item.get("headline"), "management_change")
        return "management_change", 2, "management_change", clean_one_liner(item.get("headline"), "management_change")

    # M&A
    if any(k in full_text for k in categories["M&A"]["keywords"]):
        return "M&A", 3, "generic", clean_one_liner(item.get("headline"), "M&A")

    # Fund raise
    if any(k in full_text for k in categories["fund_raise"]["keywords"]):
        return "fund_raise", 2, "generic", clean_one_liner(item.get("headline"), "fund_raise")

    # Litigation / Regulatory orders
    if any(k in full_text for k in categories["litigation"]["keywords"]):
        return "litigation", 3, "generic", clean_one_liner(item.get("headline"), "litigation")

    # Credit rating
    if any(k in full_text for k in categories["credit_rating"]["keywords"]):
        return "credit_rating", 2, "generic", clean_one_liner(item.get("headline"), "credit_rating")

    # Dividend
    if any(k in full_text for k in categories["dividend"]["keywords"]):
        return "dividend", 2, "generic", clean_one_liner(item.get("headline"), "dividend")

    # Bonus / Split
    if any(k in full_text for k in categories["bonus_split"]["keywords"]):
        return "bonus_split", 2, "generic", clean_one_liner(item.get("headline"), "bonus_split")

    # Capex / New facility
    if any(k in full_text for k in categories["capex"]["keywords"]):
        return "capex", 2, "generic", clean_one_liner(item.get("headline"), "capex")

    # Press release / Order win
    if any(k in full_text for k in categories["press_release"]["keywords"]):
        return "press_release", 2, "generic", clean_one_liner(item.get("headline"), "press_release")

    # Pledging
    if any(k in full_text for k in categories["pledging"]["keywords"]):
        return "pledging", 2, "generic", clean_one_liner(item.get("headline"), "pledging")

    # Earnings call transcript / audio
    if any(k in full_text for k in categories["earnings_call"]["keywords"]):
        return "earnings_call", 1, "generic", clean_one_liner(item.get("headline"), "earnings_call")

    # Routine / Low
    if any(k in full_text for k in categories["unclassified"]["keywords"]) or "trading window" in full_text or "loss of share" in full_text or "certificate" in full_text:
        return "unclassified", 0, "generic", clean_one_liner(item.get("headline"), "unclassified")

    if any(k in full_text for k in categories["investor_meetings"]["keywords"]):
        return "investor_meetings", 0, "generic", clean_one_liner(item.get("headline"), "investor_meetings")

    if any(k in full_text for k in categories["postal_ballot"]["keywords"]):
        return "postal_ballot", 1, "generic", clean_one_liner(item.get("headline"), "postal_ballot")

    if any(k in full_text for k in categories["agm_egm"]["keywords"]):
        return "agm_egm", 1, "generic", clean_one_liner(item.get("headline"), "agm_egm")

    # Default
    return "unclassified", 0, "generic", clean_one_liner(item.get("headline"), "unclassified")


def clean_one_liner(headline: str, category: str) -> str:
    """Create concise editorial one-liner ≤ 18 words without filler words."""
    if not headline:
        return "Corporate filing submitted"
    
    # Strip common regulatory boilerplate prefixes
    cleaned = headline
    prefixes_to_strip = [
        "Announcement under Regulation 30 (LODR)-",
        "Outcome of Board Meeting-",
        "Outcome of Board Meeting - ",
        "Board Meeting Outcome for ",
        "Compliances-Reg. 39 (3) - Details of Loss of Certificate / Duplicate Certificate - ",
        "Compliances-Certificate under Reg. 74 (5) of SEBI (DP) Regulations, 2018 - ",
        "General Updates-",
        "Press Release - ",
        "Media Release - ",
    ]
    for p in prefixes_to_strip:
        if cleaned.startswith(p):
            cleaned = cleaned[len(p):].strip()

    words = cleaned.split()
    if len(words) > 18:
        cleaned = " ".join(words[:18]) + "…"
    return cleaned


def calculate_priority(cat: str, materiality: int, in_portfolio: bool, taxonomy: dict) -> float:
    """priority = category_weight * materiality * position_weight"""
    cat_meta = taxonomy.get("categories", {}).get(cat, {})
    weight = cat_meta.get("weight", 0.5)
    pos_weight = 1.5 if in_portfolio else 1.0
    return round(weight * max(materiality, 0.5) * pos_weight, 2)


def run_classification():
    taxonomy = load_taxonomy()
    raw_announcements = load_raw_announcements()
    p_config = load_portfolio_config()

    portfolio_syms = {c["symbol"]: c["name"] for c in p_config.get("portfolio", [])}
    watchlist_syms = {c["symbol"]: c["name"] for c in p_config.get("watchlist", [])}
    company_names = {**portfolio_syms, **watchlist_syms}

    logger.info(f"Classifying {len(raw_announcements)} announcements...")

    classified_items = []
    category_counts = {}

    for item in raw_announcements:
        sym = item["symbol"]
        in_p = sym in portfolio_syms
        cat, materiality, card_type, one_liner = classify_announcement(item, taxonomy)
        priority = calculate_priority(cat, materiality, in_p, taxonomy)

        category_counts[cat] = category_counts.get(cat, 0) + 1

        classified_items.append({
            "id": item["id"],
            "symbol": sym,
            "company": company_names.get(sym, sym),
            "headline": item["headline"],
            "category": cat,
            "materiality": materiality,
            "priority": priority,
            "one_liner": one_liner,
            "card_type": card_type,
            "attachment_url": item.get("attachment_url"),
            "filed_at": item.get("filed_at"),
            "in_portfolio": in_p,
        })

    # Sort by priority desc, then date desc
    classified_items.sort(key=lambda x: (x["priority"], x["filed_at"]), reverse=True)

    # Partition into material (materiality >= 2 and high/medium priority), medium (materiality 1-2), routine (materiality 0)
    material_cards = [x for x in classified_items if x["materiality"] >= 3 or (x["materiality"] >= 2 and x["card_type"] in ("results", "management_change", "generic") and x["priority"] >= 4.0)]
    medium_items = [x for x in classified_items if x["materiality"] in (1, 2) and x not in material_cards]
    routine_items = [x for x in classified_items if x["materiality"] == 0]

    digest = {
        "window": "30d",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_filings": len(classified_items),
        "material": material_cards,
        "medium": medium_items[:30],
        "routine": {
            "count": len(routine_items),
            "summary": "ESOP allotments, trading window closures, certificate submissions",
            "items": routine_items[:20],
        },
        "category_distribution": category_counts,
    }

    # Save to data/snapshots/digest.json
    out_path = Path("data/snapshots/digest.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(digest, f, indent=2)

    logger.info(f"Classification complete:")
    logger.info(f"  Material cards: {len(material_cards)}")
    logger.info(f"  Medium items:   {len(medium_items)}")
    logger.info(f"  Routine items:  {len(routine_items)}")
    logger.info(f"  Categories:     {category_counts}")

    # Mark portfolio holdings that have recent material filings
    portfolio_snap_path = Path("data/snapshots/portfolio.json")
    if portfolio_snap_path.exists():
        with open(portfolio_snap_path, "r", encoding="utf-8") as f:
            p_snap = json.load(f)
        material_symbols = {m["symbol"] for m in material_cards}
        for h in p_snap.get("holdings", []):
            h["has_filing"] = h["symbol"] in material_symbols
        with open(portfolio_snap_path, "w", encoding="utf-8") as f:
            json.dump(p_snap, f, indent=2)


if __name__ == "__main__":
    run_classification()
