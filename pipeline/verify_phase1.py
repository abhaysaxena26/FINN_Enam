import json
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

with open("data/snapshots/digest.json", encoding="utf-8") as f:
    digest = json.load(f)

print("=" * 110)
print("FINN v2 — RESULTS CARDS VERIFICATION TABLE (CONSOLIDATED REVENUE FROM OPERATIONS)")
print("=" * 110)
print(f"{'Company':<12} | {'Metric':<22} | {'Current (₹ Cr)':<16} | {'QoQ %':<8} | {'YoY %':<8} | {'Source PDF'}")
print("-" * 110)

from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from pipeline.enrich_cards import VERIFIED_BENCHMARKS

for sym in ["RELIANCE", "TRENT", "LT", "SUNPHARMA", "DIXON", "KPITTECH", "MARUTI", "POLYCAB", "HDFCBANK", "TCS"]:
    if sym in VERIFIED_BENCHMARKS:
        b = VERIFIED_BENCHMARKS[sym]
        url = b.get("pdf_url", "")
        # Shorten display URL
        short_url = url if len(url) <= 45 else url[:42] + "..."
        for m in b.get("metrics", []):
            print(f"{sym:<12} | {m['label']:<22} | ₹{m['current']:>10,d} Cr    | {m['qoq']:>+6.1f}% | {m['yoy']:>+6.1f}% | {short_url}")
        print("-" * 110)

print("\n" + "=" * 110)
print("FINN v2 — MANAGEMENT CHANGE CARDS VERIFICATION TABLE")
print("=" * 110)
print(f"{'Company':<12} | {'Person':<18} | {'Role':<28} | {'Change':<14} | {'Effective'}")
print("-" * 110)

for m in digest.get("material", []):
    if m.get("category") == "management_change":
        p = m.get("card_payload", {})
        print(f"{m['symbol']:<12} | {p.get('person',''):<18} | {p.get('role',''):<28} | {p.get('change',''):<14} | {p.get('effective_date','')}")

print("\n" + "=" * 110)
print("FINN v2 — UPCOMING BOARD MEETINGS & RESULTS DATES (NEXT 14 DAYS)")
print("=" * 110)
for u in digest.get("upcoming", []):
    print(f"{u['date']:<14} | {u['symbol']:<12} | {u['company']:<25} | {u['purpose']}")
print("=" * 110)
