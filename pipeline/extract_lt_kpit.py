import sys
import requests
import fitz

sys.stdout.reconfigure(encoding="utf-8")
headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36"}

# LT
r = requests.get("https://www.bseindia.com/xml-data/corpfiling/AttachLive/be28659d-c65e-4500-917e-02ef891caee6.pdf", headers=headers)
doc = fitz.open(stream=r.content, filetype="pdf")
print("=== LT CONSOLIDATED P&L (Page 11) ===")
print(doc[10].get_text())

# KPITTECH
r = requests.get("https://www.bseindia.com/xml-data/corpfiling/AttachLive/c0d52f59-f997-494d-918e-7e0d4d3eda65.pdf", headers=headers)
doc = fitz.open(stream=r.content, filetype="pdf")
print("=== KPITTECH CONSOLIDATED P&L (Page 9 & 10) ===")
print(doc[8].get_text())
print(doc[9].get_text())
