"""Debug and extract real concall guidance for TITAN using latest 4 transcripts.
"""

import os
import sys
import json
import logging
from pathlib import Path
import requests
import fitz # PyMuPDF

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from api.core.llm import call_llm

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("debug_titan")

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Referer": "https://www.bseindia.com/"
}

transcripts_meta = [
    {
        "quarter": "Q1 FY27",
        "date": "Aug 2026",
        "url": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=f70a0a33-43cf-40b6-a753-67b06123e8de.pdf"
    },
    {
        "quarter": "Q4 FY26",
        "date": "Jun 2026",
        "url": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=1a3bc0e3-c7ff-4887-a18a-f73fd400e8ca.pdf"
    },
    {
        "quarter": "Q3 FY26",
        "date": "Feb 2026",
        "url": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=0ee5b68b-8f66-4705-9a84-9debaa9aae1d.pdf"
    },
    {
        "quarter": "Q2 FY26",
        "date": "Nov 2025",
        "url": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=c3a5d70a-78ac-4407-aed7-e06b93e17a8f.pdf"
    }
]

def run_debug():
    print("=== STEP (A): LATEST 4 CONCALL TRANSCRIPTS ===")
    extracted_docs = []
    
    for t in transcripts_meta:
        print(f"Fetching {t['quarter']} ({t['date']}): {t['url']}")
        r = requests.get(t["url"], headers=headers, timeout=25)
        if r.status_code != 200:
            print(f"  FAILED to download {t['quarter']}: HTTP {r.status_code}")
            continue
        
        doc = fitz.open(stream=r.content, filetype="pdf")
        pages_text = []
        total_chars = 0
        for p_idx in range(len(doc)):
            page_str = doc[p_idx].get_text()
            pages_text.append({"page": p_idx + 1, "text": page_str})
            total_chars += len(page_str)
            
        print(f"=== STEP (B): {t['quarter']} EXTRACTED TEXT STATS ===")
        print(f"  Pages: {len(doc)}, Total Character Count: {total_chars:,}")
        
        extracted_docs.append({
            "quarter": t["quarter"],
            "url": t["url"],
            "pages": pages_text,
            "total_chars": total_chars
        })

    # Prepare input text for guidance extraction
    # Focus on management remarks and Q&A where guidance is typically offered
    combined_context = ""
    for doc in extracted_docs:
        q = doc["quarter"]
        u = doc["url"]
        for p in doc["pages"]:
            txt = p["text"]
            # Look for guidance keywords to keep prompt compact and cost-efficient
            if any(k in txt.lower() for k in ["guidance", "target", "outlook", "expect", "aim", "margin", "growth", "expansion", "capex", "store"]):
                combined_context += f"\n--- [{q} Transcript, Page {p['page']}, URL: {u}] ---\n{txt[:2500]}\n"

    print(f"\nFiltered Guidance Context Chars for LLM: {len(combined_context):,}")

    system_prompt = (
        "You are a strict financial auditor analyzing Indian equity earnings calls. "
        "Your task is to extract explicit, verifiable forward-looking guidance / promises made by management. "
        "CRITICAL RULES:\n"
        "1. NO FABRICATION. Every promise must have an exact verbatim quote from the text (max 25 words).\n"
        "2. Only include items where management explicitly guided on a metric (e.g. Revenue growth, EBITDA margin, store openings, capex).\n"
        "3. Provide the exact source page and doc name.\n"
        "4. Determine the verdict based ONLY on reported facts in subsequent quarters. If too recent, verdict is 'early'. "
        "Allowed verdicts: 'delivered', 'partial', 'missed', 'early'.\n"
        "5. Return strictly a JSON object with a 'promises' array."
    )

    user_prompt = f"""
Analyze the concall transcripts below for TITAN Company.
Extract all explicit guidance commitments.

Output JSON format:
{{
  "promises": [
    {{
      "quarter": "Q4 FY26",
      "metric": "Revenue Growth",
      "target": "Guided 18-20% topline growth in Jewellery",
      "actual": "Reported 21.4% growth in Q1 FY27",
      "verdict": "delivered",
      "quote": "Verbatim quote of under 25 words from management",
      "doc": "Q4 FY26 concall",
      "page": 7,
      "url": "URL of the pdf"
    }}
  ]
}}

Transcripts:
{combined_context[:50000]}
"""

    print("\nCalling LLM for guidance extraction...")
    res = call_llm(user_prompt, system_instruction=system_prompt, model_tier="flash", response_mime_type="application/json")
    response_json = res.get("content") or res.get("json")
    
    print("\n=== STEP (C): RAW JSON RETURNED BY GUIDANCE EXTRACTION ===")
    print(response_json)

if __name__ == "__main__":
    run_debug()
