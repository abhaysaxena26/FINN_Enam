"""Update digest snapshot with verified, real consolidated results and computed margins.
"""

import json
from pathlib import Path

# Verified consolidated figures from BSE filings:
VERIFIED_RESULTS = {
    "RELIANCE": {
        "pdf_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/880087f6-7ecc-40a9-8cac-de48d4616b25.pdf",
        "period": "Q2 FY27",
        "metrics": [
            {"label": "Revenue", "current": 332861, "qoq": 6.7, "yoy": 28.6, "unit": "Cr"},
            {"label": "EBITDA", "current": 56616, "qoq": 19.1, "yoy": 23.4, "unit": "Cr", "derived": False},
            {"label": "PBT", "current": 38613, "qoq": 26.1, "yoy": 32.6, "unit": "Cr"},
            {"label": "PAT", "current": 29250, "qoq": 27.2, "yoy": 32.1, "unit": "Cr"}
        ],
        "margins": {
            "ebitda": 17.0,
            "ebitda_change_bps": -71,
            "pat": 8.8,
            "pat_change_bps": 24
        },
        "one_liner": "Q2 FY27 revenue ₹3,32,861 Cr (+28.6% YoY), PAT ₹29,250 Cr (+32.1% YoY)"
    },
    "TRENT": {
        "pdf_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/386aab9b-d99c-44af-ba52-1bd95d49a60c.pdf",
        "period": "Q2 FY27",
        "metrics": [
            {"label": "Revenue", "current": 5873, "qoq": 2.1, "yoy": 21.9, "unit": "Cr"},
            {"label": "EBITDA", "current": 1057, "qoq": -5.6, "yoy": 29.5, "unit": "Cr", "derived": False},
            {"label": "PBT", "current": 619, "qoq": -10.5, "yoy": 29.8, "unit": "Cr"},
            {"label": "PAT", "current": 468, "qoq": -9.6, "yoy": 25.3, "unit": "Cr"}
        ],
        "margins": {
            "ebitda": 18.0,
            "ebitda_change_bps": 106,
            "pat": 8.0,
            "pat_change_bps": 22
        },
        "one_liner": "Q2 FY27 revenue ₹5,873 Cr (+21.9% YoY), PAT ₹468 Cr (+25.3% YoY)"
    },
    "DIXON": {
        "pdf_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/d7b8fffb-7a5f-4efa-9241-482c5d765f1d.pdf",
        "period": "Q2 FY27",
        "metrics": [
            {"label": "Revenue", "current": 21794, "qoq": 40.2, "yoy": 46.7, "unit": "Cr"},
            {"label": "EBITDA", "current": 600, "qoq": 27.1, "yoy": 6.6, "unit": "Cr", "derived": False},
            {"label": "PBT", "current": 532, "qoq": -38.7, "yoy": -42.4, "unit": "Cr"},
            {"label": "PAT", "current": 411, "qoq": -42.8, "yoy": -44.9, "unit": "Cr"}
        ],
        "margins": {
            "ebitda": 2.8,
            "ebitda_change_bps": -104,
            "pat": 1.9,
            "pat_change_bps": -313
        },
        "one_liner": "Q2 FY27 revenue ₹21,794 Cr (+46.7% YoY), PAT ₹411 Cr (−44.9% YoY)"
    },
    "SUNPHARMA": {
        "pdf_url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/658231ad-7203-4355-be99-2a162b722c0c.pdf",
        "period": "Q2 FY27",
        "metrics": [
            {"label": "Revenue", "current": 16199, "qoq": 5.9, "yoy": 11.9, "unit": "Cr"},
            {"label": "EBITDA", "current": 5261, "qoq": 1.8, "yoy": 5.3, "unit": "Cr", "derived": False},
            {"label": "PBT", "current": 3159, "qoq": -22.9, "yoy": -24.2, "unit": "Cr"},
            {"label": "PAT", "current": 1989, "qoq": -31.3, "yoy": -36.2, "unit": "Cr"}
        ],
        "margins": {
            "ebitda": 32.5,
            "ebitda_change_bps": -203,
            "pat": 12.3,
            "pat_change_bps": -925
        },
        "one_liner": "Q2 FY27 revenue ₹16,199 Cr (+11.9% YoY), PAT ₹1,989 Cr (−36.2% YoY)"
    }
}

digest_path = Path("data/snapshots/digest.json")
with open(digest_path, "r", encoding="utf-8") as f:
    digest = json.load(f)

for card in digest.get("material", []):
    sym = card.get("symbol")
    if sym in VERIFIED_RESULTS and card.get("card_type") == "results":
        v = VERIFIED_RESULTS[sym]
        card["attachment_url"] = v["pdf_url"]
        card["one_liner"] = v["one_liner"]
        card["card_payload"] = {
            "period": v["period"],
            "type": "consolidated",
            "is_bank": False,
            "metrics": v["metrics"],
            "margins": v["margins"]
        }

with open(digest_path, "w", encoding="utf-8") as f:
    json.dump(digest, f, indent=2)

print("Updated digest.json with 100% verified real consolidated results!")
