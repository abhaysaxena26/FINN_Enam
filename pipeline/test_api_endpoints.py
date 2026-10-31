"""Test all FastAPI endpoints locally."""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import api.index as m

print("--- Test Health ---")
print(m.health())

print("\n--- Test Portfolio ---")
p = m.get_portfolio()
print(f"Total value: {p.get('total_value')}, Holdings: {len(p.get('holdings', []))}")
if p.get("holdings"):
    sample = p["holdings"][0]
    print(f"Sample holding: {sample['symbol']} | LTP: {sample['ltp']} | Day: {sample['day_change_pct']}% | PnL: {sample['pnl']}")

print("\n--- Test Digest ---")
d = m.get_digest("30d")
print(f"Material cards: {len(d.get('material', []))}, Medium: {len(d.get('medium', []))}, Routine count: {d.get('routine', {}).get('count')}")
if d.get("material"):
    sample_card = d["material"][0]
    print(f"Top Card: {sample_card['symbol']} | {sample_card['category']} | Pri: {sample_card['priority']} | One-liner: {sample_card['one_liner']}")

print("\n--- Test Alerts ---")
a = m.get_alerts()
print(f"Alerts triggered: {len(a.get('alerts', []))}")
if a.get("alerts"):
    sample_alert = a["alerts"][0]
    print(f"Sample alert: {sample_alert['symbol']} | {sample_alert['type']} | {sample_alert['message']}")

print("\n--- Test Company ---")
c = m.get_company("RELIANCE")
print(f"RELIANCE LTP: {c.get('ltp')} | 52w High: {c.get('high_52w')} | Sparkline points: {len(c.get('sparkline', []))}")

print("\n--- Test Search ---")
s = m.search_tickers("tat")
print(f"Search results for 'tat': {s.get('results')}")
