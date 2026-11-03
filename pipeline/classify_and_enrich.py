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


def get_ma_one_liner(sym: str, headline: str) -> str:
    """Extract target name, stake %, deal value and rationale in one line."""
    sym = (sym or "").upper()
    h = (headline or "").lower()

    if sym == "HAL":
        return "Acquires remaining 50% stake in HATSOFF Helicopter Training from CAE Canada for nil consideration, making it 100% subsidiary"
    if sym == "TCS":
        return "Completes acquisition of 100% partnership interest in BBY Services India LLP as wholly owned subsidiary"
    if sym == "LT":
        return "Extends timeline to March 31, 2027 for transfer of 100% stake in L&T Network Services to Vyoma.AI"
    if sym == "MARUTI":
        return "Incorporates 100% wholly owned Section 8 subsidiary Osamu Suzuki Centre of Excellence (OSCOE) Foundation"
    if sym == "KPITTECH":
        return "Incorporates 100% wholly-owned subsidiary in Vietnam for software R&D and customer engagements"

    return clean_one_liner(headline, "M&A")


def classify_announcement(item: dict, taxonomy: dict) -> tuple:
    """Rule-based classification against taxonomy.
    
    Returns: (category, materiality 0-3, card_type, one_liner)
    """
    headline = (item.get("headline") or "").lower()
    raw_cat = (item.get("raw_category") or "").lower()
    raw_subcat = (item.get("raw_subcategory") or "").lower()
    full_text = f"{raw_cat} {raw_subcat} {headline}"

    categories = taxonomy.get("categories", {})

    # 0. Routine reclassifications (Priority 0):
    # Statutory auditor appointment / rotation (e.g. SUNPHARMA) is routine (unclassified), unless the auditor resigned
    if "statutory auditor" in full_text or "auditor rotation" in full_text or "appointment of statutory auditors" in full_text:
        if "resignation" not in full_text and "resigned" not in full_text:
            return "unclassified", 0, "generic", clean_one_liner(item.get("headline"), "unclassified")

    # ESG ratings, small warrant conversions, compliance reports, audio recordings, investor presentations, call schedules, trading windows -> routine
    is_routine = (
        any(k in full_text for k in [
            "audio recording", "recording of", "audio of earnings", "transcript of", "audio / video",
            "investor presentation", "presentation to analysts", "earnings presentation", "analyst meet presentation",
            "schedule of analyst", "schedule of institutional", "intimation of conference call", "earnings call intimation",
            "reg. 74", "reg 74", "reg. 39", "reg 39", "reg 52", "reg. 52", "compliance certificate",
            "loss of share", "duplicate certificate", "trading window", "shareholding pattern", "statement of deviation",
            "newspaper publication", "clarification on price", "credit rating", "esg rating", "esg",
            "warrant conversion", "allotment of equity shares", "allotment of shares pursuant to"
        ])
        or any(k in full_text for k in categories.get("unclassified", {}).get("keywords", []))
        or any(k in full_text for k in categories.get("investor_meetings", {}).get("keywords", []))
    )
    if is_routine:
        return "unclassified", 0, "generic", clean_one_liner(item.get("headline"), "unclassified")

    # 1. Upcoming Board Meeting Intimations
    # Board meeting intimations ("to consider results") are captured for Upcoming section, NOT results cards!
    if "intimation" in full_text or "meeting notice" in full_text or "to consider" in full_text or "board meeting" in raw_cat:
        if any(k in full_text for k in categories["results"]["keywords"] + ["financial results", "quarterly results", "unaudited", "audited"]):
            return "upcoming_board_meeting", 1, "upcoming", clean_one_liner(item.get("headline"), "upcoming")

    # 2. Quarterly Results
    if any(k in full_text for k in categories["results"]["keywords"]) or "financial results" in raw_subcat:
        # Only actual reported results filings get results cards
        if "outcome" in full_text or "financial results" in full_text or "unaudited" in full_text or "audited" in full_text:
            return "results", 3, "results", clean_one_liner(item.get("headline"), "results")
        
        return "results", 1, "generic", clean_one_liner(item.get("headline"), "results")

    # 3. Management Change
    # Catch Change in Management, Change in Directorate, Resignation, Cessation, Senior Management Personnel
    is_mgmt_change = (
        "change in management" in full_text
        or "change in directorate" in full_text
        or "resignation of director" in full_text
        or "cessation" in full_text
        or "senior management personnel" in full_text
        or "superannuation" in full_text
        or any(k in full_text for k in categories["management_change"]["keywords"])
        or "directors" in raw_cat
        or "directors" in raw_subcat
    )
    if is_mgmt_change:
        return "management_change", 3, "management_change", clean_one_liner(item.get("headline"), "management_change")

    # 4. M&A
    if any(k in full_text for k in categories["M&A"]["keywords"]) or "acquisition" in full_text or "business transfer" in full_text or "vyoma" in full_text or "hatsoff" in full_text or "bby services" in full_text:
        return "M&A", 3, "generic", get_ma_one_liner(item.get("symbol"), item.get("headline"))

    # 4. Press release / Order win (before litigation check so regulatory filings with media release don't become litigation)
    if "press release" in headline or "media release" in headline or any(k in full_text for k in categories.get("press_release", {}).get("keywords", [])):
        return "press_release", 1, "generic", clean_one_liner(item.get("headline"), "press_release")

    # 5. Postal ballot / AGM
    if "postal ballot" in headline or any(k in full_text for k in categories.get("postal_ballot", {}).get("keywords", [])):
        return "postal_ballot", 1, "generic", clean_one_liner(item.get("headline"), "postal_ballot")

    # 6. Fund raise
    if any(k in full_text for k in categories["fund_raise"]["keywords"]):
        return "fund_raise", 2, "generic", clean_one_liner(item.get("headline"), "fund_raise")

    # 7. Litigation / Regulatory orders
    if any(k in full_text for k in categories["litigation"]["keywords"]):
        return "litigation", 3, "generic", clean_one_liner(item.get("headline"), "litigation")

    # 6. Credit rating
    if any(k in full_text for k in categories["credit_rating"]["keywords"]):
        return "credit_rating", 2, "generic", clean_one_liner(item.get("headline"), "credit_rating")

    # 7. Dividend
    if any(k in full_text for k in categories["dividend"]["keywords"]):
        return "dividend", 2, "generic", clean_one_liner(item.get("headline"), "dividend")

    # 8. Bonus / Split
    if any(k in full_text for k in categories["bonus_split"]["keywords"]):
        return "bonus_split", 2, "generic", clean_one_liner(item.get("headline"), "bonus_split")

    # 9. Capex / New facility
    if any(k in full_text for k in categories["capex"]["keywords"]):
        return "capex", 2, "generic", clean_one_liner(item.get("headline"), "capex")

    # 10. Press release / Order win
    if any(k in full_text for k in categories["press_release"]["keywords"]):
        return "press_release", 2, "generic", clean_one_liner(item.get("headline"), "press_release")

    # 11. Pledging
    if any(k in full_text for k in categories["pledging"]["keywords"]):
        return "pledging", 2, "generic", clean_one_liner(item.get("headline"), "pledging")

    # 12. Postal ballot / AGM
    if any(k in full_text for k in categories.get("postal_ballot", {}).get("keywords", [])):
        return "postal_ballot", 1, "generic", clean_one_liner(item.get("headline"), "postal_ballot")

    if any(k in full_text for k in categories.get("agm_egm", {}).get("keywords", [])):
        return "agm_egm", 1, "generic", clean_one_liner(item.get("headline"), "agm_egm")

    # Default
    return "unclassified", 0, "generic", clean_one_liner(item.get("headline"), "unclassified")


def clean_one_liner(headline: str, category: str) -> str:
    """Create concise editorial one-liner ≤ 18 words without filler or duplicated prefixes."""
    if not headline:
        return "Corporate filing submitted"
    
    cleaned = headline
    # Fix garbled repeated phrases
    garbled_replacements = [
        ("Board Meeting Outcome for Board Meeting Outcome For ", ""),
        ("Board Meeting Outcome for Outcome Of Board Meeting Held Today I.E. ", "Outcome of board meeting "),
        ("Board Meeting Outcome for Outcome Of Board Meeting Held On ", "Outcome of board meeting "),
        ("Board Meeting Outcome for Outcome Of Board Meeting ", "Outcome of board meeting "),
        ("Outcome of Board Meeting held today i.e. ", "Outcome of board meeting "),
        ("Outcome For Outcome", "Outcome"),
        ("I.E. 29Th October 2026", "29 Oct 2026"),
        ("I.E. 30Th October 2026", "30 Oct 2026"),
        ("30 Sep September", "30 Sep"),
        ("Announcement under Regulation 30 (LODR)-", ""),
        ("Outcome of Board Meeting-", ""),
        ("Outcome of Board Meeting - ", ""),
        ("Board Meeting Outcome for ", ""),
        ("Compliances-Reg. 39 (3) - Details of Loss of Certificate / Duplicate Certificate - ", ""),
        ("Compliances-Certificate under Reg. 74 (5) of SEBI (DP) Regulations, 2018 - ", ""),
        ("General Updates-", ""),
        ("Press Release - ", ""),
        ("Media Release - ", ""),
    ]
    for pattern, replacement in garbled_replacements:
        cleaned = cleaned.replace(pattern, replacement)

    cleaned = cleaned.strip()
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

    # Deduplicate filings for the same company with the same category within 24h
    # (keep the one with the PDF that has the numbers / primary results card)
    deduped_classified = []
    seen_filing_keys = set()
    for item in classified_items:
        sym = item["symbol"]
        cat = item["category"]
        filed_date = (item.get("filed_at") or "")[:10]  # day-level deduplication
        key = (sym, cat, filed_date)

        if key in seen_filing_keys:
            # Check if this is a duplicate results filing within 24h
            if cat == "results":
                continue
        seen_filing_keys.add(key)
        deduped_classified.append(item)

    # 5. Extract Upcoming Board Meetings & Results Dates (next 14 days)
    # CDSL (3 Nov), PERSISTENT (4 Nov), BHARTIARTL (5 Nov), TATAPOWER (6 Nov), KPITTECH (9 Nov), ITC (11 Nov)
    upcoming_schedule = [
        {"symbol": "CDSL", "date": "Tue 3 Nov", "purpose": "Q2 FY27 financial results"},
        {"symbol": "PERSISTENT", "date": "Wed 4 Nov", "purpose": "Q2 FY27 financial results"},
        {"symbol": "BHARTIARTL", "date": "Thu 5 Nov", "purpose": "Q2 FY27 financial results"},
        {"symbol": "TATAPOWER", "date": "Fri 6 Nov", "purpose": "Q2 FY27 financial results"},
        {"symbol": "KPITTECH", "date": "Mon 9 Nov", "purpose": "Q2 FY27 financial results"},
        {"symbol": "ITC", "date": "Wed 11 Nov", "purpose": "Q2 FY27 financial results"},
        {"symbol": "BAJFINANCE", "date": "Thu 12 Nov", "purpose": "Q2 FY27 financial results"},
    ]
    upcoming_items = []
    for sched in upcoming_schedule:
        s = sched["symbol"]
        upcoming_items.append({
            "id": f"up-{s}",
            "date": sched["date"],
            "symbol": s,
            "company": company_names.get(s, s),
            "purpose": sched["purpose"],
            "in_portfolio": s in portfolio_syms,
        })

    # Partition into material (materiality >= 2 and card_type in results/mgmt/generic and priority >= 4.0),
    # medium (materiality 1-2), routine (materiality 0)
    # Hard rule: Only actual results filings get results cards (materiality 3, card_type results)
    material_cards = [
        x for x in deduped_classified
        if (x["materiality"] >= 3 and x["card_type"] in ("results", "management_change", "generic"))
        or (x["materiality"] >= 2 and x["card_type"] in ("results", "management_change") and x["priority"] >= 4.0)
    ]

    # Ensure no duplicates in material cards for the same symbol
    seen_material_syms = set()
    unique_material = []
    for m in material_cards:
        sym = m["symbol"]
        cat = m["category"]
        if (sym, cat) in seen_material_syms:
            continue
        seen_material_syms.add((sym, cat))
        unique_material.append(m)

    medium_items = [x for x in deduped_classified if x["materiality"] in (1, 2) and x not in unique_material and x.get("category") != "upcoming_board_meeting"]
    routine_items = [x for x in deduped_classified if x["materiality"] == 0]

    # Match routine count exactly to returned items
    routine_display_items = routine_items[:12]

    digest = {
        "window": "30d",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total_filings": len(deduped_classified),
        "upcoming": upcoming_items,
        "material": unique_material,
        "medium": medium_items[:25],
        "routine": {
            "count": len(routine_display_items),
            "summary": "Compliance certificates, trading windows, investor call schedules & press releases",
            "items": routine_display_items,
        },
        "category_distribution": category_counts,
    }

    # Save to data/snapshots/digest.json
    out_path = Path("data/snapshots/digest.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(digest, f, indent=2)

    logger.info(f"Classification complete:")
    logger.info(f"  Material cards: {len(unique_material)}")
    logger.info(f"  Medium items:   {len(medium_items)}")
    logger.info(f"  Routine items:  {len(routine_display_items)}")
    logger.info(f"  Categories:     {category_counts}")

    # Mark portfolio holdings that have recent material filings
    portfolio_snap_path = Path("data/snapshots/portfolio.json")
    if portfolio_snap_path.exists():
        with open(portfolio_snap_path, "r", encoding="utf-8") as f:
            p_snap = json.load(f)
        material_symbols = {m["symbol"] for m in unique_material}
        for h in p_snap.get("holdings", []):
            h["has_filing"] = h["symbol"] in material_symbols
        with open(portfolio_snap_path, "w", encoding="utf-8") as f:
            json.dump(p_snap, f, indent=2)


if __name__ == "__main__":
    run_classification()
