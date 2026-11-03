import sys
import requests
import fitz

sys.stdout.reconfigure(encoding="utf-8")
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}

r = requests.get("https://www.bseindia.com/xml-data/corpfiling/AttachLive/fca20bad-7bfe-438f-a526-d9f42ccf0346.pdf", headers=headers)
doc = fitz.open(stream=r.content, filetype="pdf")
print("Total pages in Maruti PDF:", len(doc))
for p in range(len(doc)):
    txt = doc[p].get_text()
    if "revenue from operations" in txt.lower():
        print(f"=== Maruti Page {p+1} ===")
        print(txt)
