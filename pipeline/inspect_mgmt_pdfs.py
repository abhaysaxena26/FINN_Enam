import sys
import requests
import fitz

sys.stdout.reconfigure(encoding="utf-8")
headers = {"User-Agent": "Mozilla/5.0"}

urls = [
    ("HDFCBANK Change in Management (b36f...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/b36ff756-1cf7-44a3-9b2c-4583e7e0e792.pdf"),
    ("DIXON Change in Management (5352...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/53529778-f611-4f21-b789-0bc1bf52e7e5.pdf"),
    ("HDFCBANK MD CEO (e5b2...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/e5b2d06f-fea8-4dea-aa03-84674215a0fd.pdf"),
    ("TRENT Resignation (5f26...)", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/5f2619df-b01f-4905-978f-00de8477b2f8.pdf"),
]

for name, u in urls:
    print(f"\n==================== {name} ====================")
    try:
        r = requests.get(u, headers=headers, timeout=15)
        doc = fitz.open(stream=r.content, filetype="pdf")
        print(f"Pages: {len(doc)}")
        for i in range(min(3, len(doc))):
            print(f"--- Page {i+1} ---")
            lines = [l.strip() for l in doc[i].get_text().splitlines() if l.strip()]
            for l in lines[:35]:
                print(f"  {l}")
    except Exception as e:
        print(f"Error: {e}")
