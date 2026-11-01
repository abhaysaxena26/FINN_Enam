"""Extract guidance from TITAN concall transcripts with strict grounding.
"""

import sys
import json
from pathlib import Path
import fitz
import requests

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from api.core.llm import call_llm

transcripts_meta = [
    {
        "quarter": "Q1 FY27",
        "doc": "Q1 FY27 concall",
        "date": "Aug 2026",
        "url": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=f70a0a33-43cf-40b6-a753-67b06123e8de.pdf"
    },
    {
        "quarter": "Q4 FY26",
        "doc": "Q4 FY26 concall",
        "date": "Jun 2026",
        "url": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=1a3bc0e3-c7ff-4887-a18a-f73fd400e8ca.pdf"
    },
    {
        "quarter": "Q3 FY26",
        "doc": "Q3 FY26 concall",
        "date": "Feb 2026",
        "url": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=0ee5b68b-8f66-4705-9a84-9debaa9aae1d.pdf"
    },
    {
        "quarter": "Q2 FY26",
        "doc": "Q2 FY26 concall",
        "date": "Nov 2025",
        "url": "https://www.bseindia.com/stockinfo/AnnPdfOpen.aspx?Pname=c3a5d70a-78ac-4407-aed7-e06b93e17a8f.pdf"
    }
]

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Referer": "https://www.bseindia.com/"
}

def extract_titan_promises():
    extracted_docs = []
    print("=== (a) TRANSCRIPTS FETCHED ===")
    for t in transcripts_meta:
        print(f"Fetching {t['quarter']} ({t['date']}) from {t['url']}...")
        r = requests.get(t["url"], headers=headers, timeout=25)
        doc = fitz.open(stream=r.content, filetype="pdf")
        pages_text = []
        total_chars = 0
        for i in range(len(doc)):
            txt = doc[i].get_text()
            total_chars += len(txt)
            pages_text.append({"page": i + 1, "text": txt})
        print(f"=== (b) {t['quarter']} CHARACTER COUNT: {total_chars:,} chars ({len(doc)} pages) ===")
        extracted_docs.append({**t, "pages": pages_text, "total_chars": total_chars})

    # Find the top management remarks & guidance paragraphs per doc
    guidance_excerpts = []
    for d in extracted_docs:
        q = d["quarter"]
        u = d["url"]
        doc_name = d["doc"]
        for p in d["pages"]:
            txt = p["text"]
            # Look for explicit commitments
            lines = txt.split("\n")
            for idx, line in enumerate(lines):
                if any(w in line.lower() for w in ["guidance", "target", "aiming", "outlook", "expect to grow", "expand our margin", "store additions", "new stores"]):
                    # Grab surrounding context (10 lines before, 10 lines after)
                    start = max(0, idx - 8)
                    end = min(len(lines), idx + 12)
                    chunk = " ".join([l.strip() for l in lines[start:end] if l.strip()])
                    if len(chunk) > 60:
                        guidance_excerpts.append({
                            "quarter": q,
                            "doc": doc_name,
                            "page": p["page"],
                            "url": u,
                            "excerpt": chunk[:500]
                        })

    print(f"\nFound {len(guidance_excerpts)} potential guidance excerpts.")
    prompt_context = ""
    for ex in guidance_excerpts[:12]:
        prompt_context += f"\n[{ex['quarter']} | {ex['doc']} | Page {ex['page']} | {ex['url']}]\nExcerpt: {ex['excerpt']}\n"

    system_instruction = (
        "You are an expert equity research auditor. Analyze the following excerpts from TITAN concall transcripts. "
        "Extract 4 to 6 explicit forward-looking promises made by management with targets and exact verbatim quotes (max 25 words). "
        "For each promise:\n"
        "- metric: the business metric (e.g. Jewellery Growth, Eyewear Breakeven, Store Additions, International Expansion)\n"
        "- target: the exact numerical or qualitative target management set\n"
        "- actual: the actual reported delivery in subsequent quarters, or if too recent write 'Pending subsequent reporting'\n"
        "- verdict: 'delivered' if met or exceeded, 'partial' if partially achieved, 'missed' if failed, or 'early' if pending subsequent reporting\n"
        "- quote: verbatim quote (<= 25 words)\n"
        "- doc, page, url: verbatim from the citation\n"
        "Return strictly a JSON object with 'promises' list."
    )

    prompt = f"""
Extract guidance promises from these TITAN concall citations:
{prompt_context}

Output format:
{{
  "promises": [
    {{
      "quarter": "Q2 FY26",
      "metric": "Jewellery Growth",
      "target": "20% YoY growth in domestic jewellery",
      "actual": "Delivered 22% growth in Q3 and 21% in Q4 FY26",
      "verdict": "delivered",
      "quote": "verbatim quote from excerpt <= 25 words",
      "doc": "Q2 FY26 concall",
      "page": 5,
      "url": "..."
    }}
  ]
}}
"""

    res = call_llm(prompt, system_instruction=system_instruction, model_tier="flash", response_mime_type="application/json")
    print("\n=== (c) RAW JSON RETURNED BY GUIDANCE EXTRACTION ===")
    content = res.get("content") or json.dumps(res.get("json"))
    print(content)
    
    # Save to data/snapshots/research/TITAN.json with full schema
    if res.get("json") or content:
        data = res.get("json") or json.loads(content)
        promises = data.get("promises", [])
        
        # Calculate count-based credibility score strictly in code
        delivered_count = sum(1 for p in promises if p.get("verdict") == "delivered")
        total_evaluable = sum(1 for p in promises if p.get("verdict") in ("delivered", "partial", "missed"))
        early_count = sum(1 for p in promises if p.get("verdict") == "early")
        
        score_text = f"{delivered_count} of {total_evaluable} delivered" if total_evaluable > 0 else f"{delivered_count} of {len(promises)} delivered"
        
        print("\n=== COMPUTED CREDIBILITY METRICS ===")
        print(f"Credibility Score: {score_text} (Early/In-progress: {early_count})")
        
        # Load existing TITAN.json to preserve snapshot and trajectory tabs
        titan_path = Path("data/snapshots/research/TITAN.json")
        with open(titan_path, "r", encoding="utf-8") as f:
            titan_data = json.load(f)
            
        titan_data["views"]["promised"] = {
            "credibility_score": score_text,
            "delivered_count": delivered_count,
            "total_count": len(promises),
            "partial_count": sum(1 for p in promises if p.get("verdict") == "partial"),
            "missed_count": sum(1 for p in promises if p.get("verdict") == "missed"),
            "early_count": early_count,
            "summary": f"Audit of the latest 4 concall transcripts (Q2 FY26 to Q1 FY27) shows management delivered on {delivered_count} of {total_evaluable} evaluated guidance commitments across jewellery expansion and retail store rollouts.",
            "promises": promises
        }
        
        with open(titan_path, "w", encoding="utf-8") as f:
            json.dump(titan_data, f, indent=2)
        print("Updated data/snapshots/research/TITAN.json successfully!")

if __name__ == "__main__":
    extract_titan_promises()
