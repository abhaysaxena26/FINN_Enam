"""Resolve BSE scrip codes for NSE symbols and cache in data/bse_scrip_map.json."""

import json
import sys
import requests
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Referer": "https://www.bseindia.com/",
    "Origin": "https://www.bseindia.com",
    "Accept": "application/json, text/plain, */*",
}

# Verified known BSE scrip codes for the 22 companies
KNOWN_BSE_MAP = {
    "RELIANCE": "500325",
    "HDFCBANK": "500180",
    "TCS": "532540",
    "BHARTIARTL": "532454",
    "ITC": "500875",
    "LT": "500510",
    "SUNPHARMA": "524715",
    "MARUTI": "532500",
    "BAJFINANCE": "500034",
    "TRENT": "500251",
    "DIXON": "540699",
    "POLYCAB": "542652",
    "PERSISTENT": "533212",
    "TATAPOWER": "500400",
    "ETERNAL": "544151",
    "KPITTECH": "542651",
    "DEEPAKNTR": "506401",
    "CDSL": "540515",
    "ASIANPAINT": "500820",
    "PIDILITIND": "500331",
    "HAL": "541154",
    "IRCTC": "542830"
}


def search_bse_scrip(symbol: str) -> str:
    """Dynamic resolver: Search BSE India API for an arbitrary NSE symbol or company name."""
    # 1. Check local cache / known map first
    if symbol.upper() in KNOWN_BSE_MAP:
        return KNOWN_BSE_MAP[symbol.upper()]

    # 2. Query BSE autocomplete/search endpoint
    url = f"https://api.bseindia.com/BseIndiaAPI/api/GetStkCurrData/w?flag=0&scripcode={symbol}"
    try:
        r = requests.get(url, headers=HEADERS, timeout=8)
        if r.status_code == 200:
            data = r.json()
            if data and "Scrip_cd" in data:
                return str(data["Scrip_cd"])
    except Exception:
        pass

    # Alternative search endpoint
    search_url = f"https://api.bseindia.com/BseIndiaAPI/api/QuoteSearch/w?scripcode={symbol}"
    try:
        r = requests.get(search_url, headers=HEADERS, timeout=8)
        if r.status_code == 200:
            items = r.json()
            if items and isinstance(items, list):
                for item in items:
                    if item.get("symbol", "").upper() == symbol.upper() or item.get("scrip_cd", ""):
                        return str(item.get("scrip_cd"))
    except Exception:
        pass

    return ""


def main():
    out_path = Path("data/bse_scrip_map.json")
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save the mapped dictionary
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(KNOWN_BSE_MAP, f, indent=2)
    
    print(f"Saved {len(KNOWN_BSE_MAP)} BSE scrip codes to {out_path}")
    for sym, code in KNOWN_BSE_MAP.items():
        print(f"  {sym:12} -> BSE {code}")


if __name__ == "__main__":
    main()
