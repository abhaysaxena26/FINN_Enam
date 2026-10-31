"""Verify all 22 demo tickers on yfinance and BSE."""

import sys
import yfinance as yf

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

symbols = [
    'RELIANCE', 'HDFCBANK', 'TCS', 'BHARTIARTL', 'ITC', 'LT', 'SUNPHARMA',
    'MARUTI', 'BAJFINANCE', 'TRENT', 'DIXON', 'POLYCAB', 'PERSISTENT',
    'TATAPOWER', 'ETERNAL', 'KPITTECH', 'DEEPAKNTR', 'CDSL',
    'ASIANPAINT', 'PIDILITIND', 'HAL', 'IRCTC'
]

results = {}
for sym in symbols:
    try:
        t = yf.Ticker(f"{sym}.NS")
        hist = t.history(period="5d")
        if not hist.empty:
            close = float(hist["Close"].iloc[-1])
            results[sym] = {"status": "ok", "close": close, "exchange": "NSE"}
            print(f"[OK] {sym} (NSE): {close:.2f}")
        else:
            t_bo = yf.Ticker(f"{sym}.BO")
            hist_bo = t_bo.history(period="5d")
            if not hist_bo.empty:
                close = float(hist_bo["Close"].iloc[-1])
                results[sym] = {"status": "ok_bo", "close": close, "exchange": "BSE"}
                print(f"[OK] {sym} (BSE): {close:.2f}")
            else:
                results[sym] = {"status": "missing"}
                print(f"[MISSING] {sym}: no data")
    except Exception as e:
        results[sym] = {"status": "error", "error": str(e)}
        print(f"[ERROR] {sym}: {e}")

print("\nSummary:", sum(1 for v in results.values() if "ok" in v["status"]), "/", len(symbols), "resolved")
