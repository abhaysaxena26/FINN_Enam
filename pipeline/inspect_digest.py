import sys
import json

sys.stdout.reconfigure(encoding="utf-8")

with open("data/snapshots/digest.json", "r", encoding="utf-8") as f:
    digest = json.load(f)

print(f"Total filings: {digest.get('total_filings')}")
material = digest.get("material", [])
print(f"Material cards count: {len(material)}")
for i, m in enumerate(material[:30]):
    p = m.get("card_payload")
    p_info = ""
    if p and "metrics" in p:
        p_info = f"Rev: {p['metrics'][0]['current']} PAT: {p['metrics'][3]['current']}"
    print(f"{i+1}. [{m.get('symbol')}] cat={m.get('category')} card_type={m.get('card_type')} prio={m.get('priority')} {p_info}")
    print(f"   Headline: {m.get('headline')[:70]}")
    print(f"   One-liner: {m.get('one_liner')}")
    print(f"   URL: {m.get('attachment_url')}")
