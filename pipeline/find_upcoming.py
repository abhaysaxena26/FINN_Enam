import json
import re

with open('data/snapshots/raw_announcements.json', encoding='utf-8') as f:
    items = json.load(f)

for it in items:
    h = it.get('headline', '')
    cat = it.get('raw_category', '')
    subcat = it.get('raw_subcategory', '')
    txt = (h + " " + cat + " " + subcat).lower()
    if ('board meeting' in txt or 'intimation of meeting' in txt) and 'outcome' not in txt:
        print(f"[{it['symbol']}] {h} (Filed: {it.get('filed_at')})")
