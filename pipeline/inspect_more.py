import sys
import requests
import fitz

sys.stdout.reconfigure(encoding="utf-8")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
}

urls = [
    ("KPITTECH Results (c0d5...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/c0d52f59-f997-494d-918e-7e0d4d3eda65.pdf"),
    ("MARUTI Results (fca2...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/fca20bad-7bfe-438f-a526-d9f42ccf0346.pdf"),
    ("LT Results (be28...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/be28659d-c65e-4500-917e-02ef891caee6.pdf"),
    ("KPITTECH M&A (d6ee...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/d6ee0e49-1938-4648-a9e4-d6979352fe8e.pdf"),
    ("TCS M&A (ad95...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/ad952e13-3c76-410e-81f8-4fe3d108a196.pdf"),
    ("LT M&A Vyoma (13e5...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/13e50739-50e7-4b5a-8dba-ac92ece6d35f.pdf"),
]

for name, u in urls:
    print(f"\n==================== {name} ====================")
    try:
        r = requests.get(u, headers=headers, timeout=15)
        if r.status_code != 200:
            print(f"HTTP {r.status_code}")
            continue
        doc = fitz.open(stream=r.content, filetype="pdf")
        print(f"Pages: {len(doc)}")
        for i in range(len(doc)):
            txt = doc[i].get_text()
            print(f"--- Page {i+1} ({len(txt)} chars) ---")
            lines = [l.strip() for l in txt.splitlines() if l.strip()]
            for l in lines[:40]:
                print(f"  {l}")
    except Exception as e:
        print(f"Error: {e}")
