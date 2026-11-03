import sys
import json

sys.stdout.reconfigure(encoding="utf-8")

with open("data/snapshots/raw_announcements.json", "r", encoding="utf-8") as f:
    raw = json.load(f)

print(f"Total raw announcements: {len(raw)}")
for item in raw:
    hl = item.get("headline", "")
    cat = item.get("raw_category", "")
    subcat = item.get("raw_subcategory", "")
    txt = f"{hl} {cat} {subcat}".lower()
    if any(w in txt for w in ["management", "director", "kmp", "cfo", "ceo", "auditor", "resignation", "appointment", "cessation"]):
        print(f"[{item['symbol']}] {hl}")
        print(f"   URL: {item.get('attachment_url')}")
        print(f"   Category: {cat} / Subcat: {subcat}")
