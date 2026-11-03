"""Update portfolio holdings with realistic post-split/bonus average buy prices
and recompute current values and P&L.
"""

import json
from pathlib import Path

# Realistic post-split and post-bonus average buy prices (~6-12m historical basis)
REALISTIC_HOLDINGS = [
    {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy", "mcap_bucket": "large", "qty": 25, "avg_price": 1220.00, "ltp": 1164.90, "day_change_pct": -0.21},
    {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Banking", "mcap_bucket": "large", "qty": 50, "avg_price": 720.00, "ltp": 692.80, "day_change_pct": 1.39},
    {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT", "mcap_bucket": "large", "qty": 15, "avg_price": 2420.00, "ltp": 2502.60, "day_change_pct": 0.99},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel", "sector": "Telecom", "mcap_bucket": "large", "qty": 30, "avg_price": 1820.00, "ltp": 1973.70, "day_change_pct": 0.08},
    {"symbol": "ITC", "name": "ITC", "sector": "FMCG", "mcap_bucket": "large", "qty": 100, "avg_price": 285.00, "ltp": 265.60, "day_change_pct": 0.23},
    {"symbol": "LT", "name": "Larsen & Toubro", "sector": "Infrastructure", "mcap_bucket": "large", "qty": 12, "avg_price": 3650.00, "ltp": 3871.70, "day_change_pct": 0.90},
    {"symbol": "SUNPHARMA", "name": "Sun Pharma", "sector": "Pharma", "mcap_bucket": "large", "qty": 40, "avg_price": 1680.00, "ltp": 1777.70, "day_change_pct": 0.95},
    {"symbol": "MARUTI", "name": "Maruti Suzuki", "sector": "Auto", "mcap_bucket": "large", "qty": 5, "avg_price": 11800.00, "ltp": 11397.00, "day_change_pct": -0.42},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance", "sector": "NBFC", "mcap_bucket": "large", "qty": 10, "avg_price": 920.00, "ltp": 939.10, "day_change_pct": 1.15},
    {"symbol": "TRENT", "name": "Trent Ltd", "sector": "Retail", "mcap_bucket": "mid", "qty": 20, "avg_price": 2850.00, "ltp": 3017.30, "day_change_pct": 5.40},
    {"symbol": "DIXON", "name": "Dixon Technologies", "sector": "Electronics", "mcap_bucket": "mid", "qty": 8, "avg_price": 10800.00, "ltp": 11000.00, "day_change_pct": -1.20},
    {"symbol": "POLYCAB", "name": "Polycab India", "sector": "Cables", "mcap_bucket": "mid", "qty": 15, "avg_price": 7400.00, "ltp": 7787.00, "day_change_pct": 1.45},
    {"symbol": "PERSISTENT", "name": "Persistent Systems", "sector": "IT", "mcap_bucket": "mid", "qty": 18, "avg_price": 5400.00, "ltp": 6048.00, "day_change_pct": 2.10},
    {"symbol": "TATAPOWER", "name": "Tata Power", "sector": "Power", "mcap_bucket": "mid", "qty": 80, "avg_price": 360.00, "ltp": 345.00, "day_change_pct": 0.35},
    {"symbol": "ETERNAL", "name": "Eternal Ltd", "sector": "Food Tech", "mcap_bucket": "mid", "qty": 60, "avg_price": 260.00, "ltp": 285.00, "day_change_pct": 1.80},
    {"symbol": "KPITTECH", "name": "KPIT Technologies", "sector": "Auto Tech", "mcap_bucket": "mid", "qty": 25, "avg_price": 580.00, "ltp": 530.20, "day_change_pct": -0.85},
    {"symbol": "DEEPAKNTR", "name": "Deepak Nitrite", "sector": "Chemicals", "mcap_bucket": "mid", "qty": 22, "avg_price": 1620.00, "ltp": 1519.40, "day_change_pct": -0.65},
    {"symbol": "CDSL", "name": "CDSL", "sector": "Capital Markets", "mcap_bucket": "mid", "qty": 35, "avg_price": 1200.00, "ltp": 1263.00, "day_change_pct": 0.85}
]

# Update data/portfolio.json
p_config_path = Path("data/portfolio.json")
with open(p_config_path, "r", encoding="utf-8") as f:
    p_config = json.load(f)

for item in p_config["portfolio"]:
    for real in REALISTIC_HOLDINGS:
        if item["symbol"] == real["symbol"]:
            item["avg_price"] = real["avg_price"]

with open(p_config_path, "w", encoding="utf-8") as f:
    json.dump(p_config, f, indent=2)

# Update data/snapshots/portfolio.json
p_snap_path = Path("data/snapshots/portfolio.json")
with open(p_snap_path, "r", encoding="utf-8") as f:
    snap = json.load(f)

total_invested = 0
total_current = 0
today_pnl = 0

processed_holdings = []
for h in snap.get("holdings", []):
    sym = h["symbol"]
    real_match = next((r for r in REALISTIC_HOLDINGS if r["symbol"] == sym), None)
    if real_match:
        avg_price = real_match["avg_price"]
        ltp = real_match["ltp"]
        day_pct = real_match["day_change_pct"]
    else:
        avg_price = h.get("avg_price", 1000)
        ltp = h.get("ltp", 1000)
        day_pct = h.get("day_change_pct", 0)

    qty = h["qty"]
    invested = qty * avg_price
    cur_val = qty * ltp
    pnl = cur_val - invested
    pnl_pct = round((pnl / invested) * 100, 2)
    
    # Day P&L
    prev_close = ltp / (1 + (day_pct / 100))
    day_diff = cur_val - (qty * prev_close)

    total_invested += invested
    total_current += cur_val
    today_pnl += day_diff

    h["avg_price"] = avg_price
    h["ltp"] = ltp
    h["current_value"] = round(cur_val, 2)
    h["pnl"] = round(pnl, 2)
    h["pnl_pct"] = pnl_pct
    h["day_change_pct"] = day_pct
    processed_holdings.append(h)

snap["holdings"] = processed_holdings
snap["total_value"] = round(total_current, 2)
snap["invested_value"] = round(total_invested, 2)
snap["total_pnl"] = round(total_current - total_invested, 2)
snap["total_pnl_pct"] = round(((total_current - total_invested) / total_invested) * 100, 2)
snap["day_pnl"] = round(today_pnl, 2)
snap["day_pnl_pct"] = round((today_pnl / (total_current - today_pnl)) * 100, 2)

with open(p_snap_path, "w", encoding="utf-8") as f:
    json.dump(snap, f, indent=2)

print(f"Updated portfolio snapshot successfully:")
print(f"  Invested: ₹{total_invested:,.2f}")
print(f"  Current:  ₹{total_current:,.2f}")
print(f"  Total P&L: ₹{snap['total_pnl']:,.2f} ({snap['total_pnl_pct']}%)")
print(f"  Today:    ₹{snap['day_pnl']:,.2f} ({snap['day_pnl_pct']}%)")
