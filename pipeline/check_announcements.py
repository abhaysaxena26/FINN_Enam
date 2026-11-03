import json
with open('data/snapshots/raw_announcements.json', encoding='utf-8') as f:
    items = json.load(f)

for item in items:
    sym = item.get('symbol')
    head = item.get('headline', '')
    if any(k in head.lower() for k in ['result', 'financial', 'outcome', 'board meeting', 'acquisition']) or sym in ['DEEPAKNTR', 'PERSISTENT', 'KPITTECH', 'MARUTI', 'LT']:
        d = item.get('filed_at', '')[:10]
        url = item.get('attachment_url', '')
        print(f"{sym} | {d} | {head[:80]} | {url}")
