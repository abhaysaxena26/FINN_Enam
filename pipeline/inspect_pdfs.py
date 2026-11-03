import sys
import requests
import fitz  # PyMuPDF
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
}

def inspect_pdf(name, url):
    print(f"\n==================== {name} ====================")
    print(f"URL: {url}")
    try:
        r = requests.get(url, headers=headers, timeout=15)
        if r.status_code != 200:
            print(f"HTTP Error {r.status_code}")
            return
        doc = fitz.open(stream=r.content, filetype="pdf")
        print(f"Total Pages: {len(doc)}")
        for page_idx in range(min(5, len(doc))):
            text = doc[page_idx].get_text()
            print(f"--- PAGE {page_idx+1} ({len(text)} chars) ---")
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            for line in lines[:25]:
                print(f"  {line}")
    except Exception as e:
        print(f"Error: {e}")

urls = [
    ("DEEPAKNTR Results", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/a59f1b7a-6692-4d45-9886-f842d7faf839.pdf"),
    ("KPITTECH Results", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/741a7974-4bc2-47a3-b638-63131bfd70a0.pdf"),
    ("MARUTI Results", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/fca20bad-7bfe-438f-a526-d9f42ccf0346.pdf"),
    ("LT Results", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/be28659d-c65e-4500-917e-02ef891caee6.pdf"),
    ("KPITTECH M&A", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/d6ee0e49-1938-4648-a9e4-d6979352fe8e.pdf"),
    ("MARUTI M&A", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/9ec6c385-b23c-49cd-9d07-b09dc86c3df7.pdf"),
    ("LT M&A Vyoma", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/13e50739-50e7-4b5a-8dba-ac92ece6d35f.pdf"),
    ("HAL M&A", "https://www.bseindia.com/xml-data/corpfiling/AttachLive/70bc729d-e921-4367-9add-cb9cdb5162fc.pdf"),
]

for name, u in urls:
    inspect_pdf(name, u)
