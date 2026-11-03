import sys
import requests
import fitz

sys.stdout.reconfigure(encoding="utf-8")

headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}

def search_financials(pdf_name, url):
    print(f"\n==================== {pdf_name} ====================")
    r = requests.get(url, headers=headers, timeout=20)
    doc = fitz.open(stream=r.content, filetype="pdf")
    for i, page in enumerate(doc):
        text = page.get_text()
        text_lower = text.lower()
        if "revenue from operations" in text_lower or "total income" in text_lower or "profit for the period" in text_lower:
            print(f"--- Page {i+1} ---")
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            for l in lines[:50]:
                print(f"  {l}")

search_financials("KPITTECH", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/c0d52f59-f997-494d-918e-7e0d4d3eda65.pdf")
search_financials("MARUTI", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/fca20bad-7bfe-438f-a526-d9f42ccf0346.pdf")
search_financials("LT", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/be28659d-c65e-4500-917e-02ef891caee6.pdf")
