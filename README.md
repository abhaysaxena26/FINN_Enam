# FINN — Financial Investment Agent

> **Mobile-first financial investment intelligence for the Indian equity investor.**  
> Built as a submission for the **ENAM Holdings AI Engineer Build Challenge**.

[![Next.js 16](https://img.shields.io/badge/Next.js-16.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash_%26_Pro-4285F4?style=flat&logo=google)](https://ai.google.dev/)
[![PWA Ready](https://img.shields.io/badge/PWA-Installable-purple?style=flat)](https://web.dev/progressive-web-apps/)

---

## 1. Product Overview

Investors today are drowning in market noise — hundreds of daily regulatory disclosures, earnings press releases, and broker commentaries. **FINN** cuts through the noise with an editorial, high-density mobile interface operating in two distinct modes:

1. **Push (Proactive Intelligence)**: Automatically curates what changed across your portfolio and why it matters. Surfaces material announcements first, collapses routine paperwork, and detects market move coincidences (e.g. 3.2× volume spike coinciding with an acquisition or results release).
2. **Pull (Grounded Primary Research)**: Conducts on-demand fundamental deep-dives grounded **strictly** in primary sources (Annual Reports, Earnings Concall Transcripts, and BSE/NSE Regulatory Filings). Zero hallucination, zero broker commentary, zero secondary noise.

---

## 2. Architecture & Data Flow

```mermaid
flowchart TD
    subgraph DataSources["Data Sources & Exchange APIs"]
        BSE["BSE Corporate Filings API\n(Live 30-Day Disclosures)"]
        YF["yfinance (NSE / BSE EOD)\n(Prices, Volumes, Sparklines)"]
        SCR["Primary Filings & Concalls\n(Annual Reports & Transcripts)"]
    end

    subgraph Pipeline["Data & Intelligence Pipelines (GitHub Actions / Local)"]
        Fetch["pipeline/fetch_announcements.py"]
        Classify["pipeline/classify_and_enrich.py\n(Taxonomy Priority Scoring)"]
        Alerts["pipeline/run_alerts.py\n(Volume & Price Coincidence Engine)"]
        Precompute["pipeline/precompute_research.py\n(7 Grounded Fundamental Views)"]
    end

    subgraph LLMRouting["Smart Model Router & Cost Optimization"]
        Flash["Gemini 2.5 Flash\n(Bulk classification & data extraction)"]
        Pro["Gemini 2.5 Pro\n(High-reasoning Promised vs Delivered audit)"]
        Cache["SHA-256 Semantic & Prompt Cache\n(Zero-cost instant responses)"]
    end

    subgraph BackendAPI["Vercel Serverless Python API (/api/*)"]
        FastAPI["FastAPI Application (api/index.py)"]
        Stepper["Stepwise On-Demand Job Runner\n(api/core/research_engine.py)"]
        Snapshots["Persistent Snapshots Fallback\n(data/snapshots/*.json)"]
    end

    subgraph Frontend["Mobile-First UI (Next.js 16 + Tailwind CSS)"]
        Brief["/brief — Windowed Filing Digest"]
        AlertsUI["/alerts — Triggered Alerts & Config"]
        Ask["/ask — Ticker Search & Watchlist"]
        Company["/company/[symbol] — 7 Research Views"]
        Portfolio["/portfolio — Holdings & EOD Valuation"]
    end

    BSE --> Fetch --> Classify
    YF --> Pipeline
    SCR --> Precompute

    Classify --> Flash
    Precompute --> Pro
    Classify --> Cache
    Precompute --> Cache

    Classify --> Snapshots
    Alerts --> Snapshots
    Precompute --> Snapshots

    Snapshots --> FastAPI
    Stepper --> FastAPI
    FastAPI --> Frontend
```

---

## 3. Grounded Pull Research: 7 Structured Views

FINN never relies on generic LLM summaries. When deep-diving into a company, it presents 7 rigorous financial views with clickable primary citations (`[doc, page]`):

| View | Purpose | Primary Grounding Sources |
|---|---|---|
| **Promised vs Delivered** *(Flagship)* | Audits what management explicitly committed to in concalls over the last 4 quarters vs what was delivered in subsequent audited results. | Concall Transcripts (Q1-Q4), MD&A, Exchange Filings |
| **Business Snapshot** | Revenue mix, segment-level growth, and operational moats at a glance. | Latest Annual Report (Segment Reporting Note) |
| **Multi-Year Trajectory** | 3-year direction: what is expanding (margins, premium share) vs what is compressing. | Audited Financial Statements & P&L Tables |
| **Cash Quality** | Operating cash conversion (CFO ÷ PAT), free cash flow yield, and working capital drag. | Cash Flow Statement & Notes on Working Capital |
| **Balance Sheet Health** | Net debt, debt-to-equity, interest coverage, contingent liabilities, and pledge status. | Balance Sheet & Borrowing Disclosures |
| **Guidance Tracker** | Forward targets on revenue CAGR, EBITDA margins, and planned capex. | Latest Concall Transcript & Investor Presentation |
| **Bull vs Bear** | Tightly argued 3-pillar bull case vs 3 critical bear risks and key monitorable. | Synthesized from primary headwinds and tailwinds |

---

## 4. Model Routing & Cost Efficiency

FINN is engineered for aggressive token economy, achieving institutional-grade research at consumer-scale pricing:

```
┌─────────────────────────────────┬───────────────────┬──────────────┬──────────────┐
│ Operational Task                │ Model Selected    │ Tokens / Req │ Avg Cost     │
├─────────────────────────────────┼───────────────────┼──────────────┼──────────────┤
│ Announcement Categorization     │ Rule Taxonomy     │ 0 tokens     │ ₹0.00        │
│ Results Mini-Table Extraction   │ Gemini 2.5 Flash  │ ~1,800       │ ₹0.02        │
│ Executive Bio Enrichment        │ Tavily Search API │ 1 query      │ Free Tier    │
│ Promised vs Delivered Audit     │ Gemini 2.5 Pro    │ ~5,200       │ ₹0.62        │
│ 7-View Fundamental Synthesis    │ Flash x4 + Pro x1 │ ~14,250      │ ₹1.18        │
│ Repeat View Queries             │ SHA-256 Cache Hit │ 0 tokens     │ ₹0.00        │
└─────────────────────────────────┴───────────────────┴──────────────┴──────────────┘
```

Every research view features a live **Cost & Model Transparency Footer** displaying exact model routing, token counts, and Rupee conversion.

---

## 5. Stepwise Serverless Execution (Vercel Generalisation)

Vercel Serverless free-tier functions impose a **60-second execution timeout**. Running end-to-end PDF downloading, parsing, embedding, and LLM reasoning on an arbitrary stock within a single serverless invocation would crash or timeout.

FINN solves this via a **stepwise state-machine job runner** (`api/core/research_engine.py`):
1. **Step 1 (Resolving)**: Fetches ticker metadata, price, and 52-week statistics from exchange feeds.
2. **Step 2 (Fundamentals)**: Pulls quarterly financials, EBITDA margins, leverage, and cash conversion ratios.
3. **Step 3 (Transcripts)**: Audits earnings call transcripts for explicit management commitments.
4. **Step 4 (Synthesis)**: Synthesises all 7 views with exact page citations and caches the final JSON snapshot.

If a user searches for **any** arbitrary NSE symbol (e.g. `INFY`, `TATAMOTORS`, `ZOMATO`), the UI activates the interactive `OnDemandStepper` progress card, executing each 5-second step sequentially without serverless timeouts.

---

## 6. Local Development & Setup

### Prerequisites
- Node.js 18+ & pnpm
- Python 3.11+

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-username/finn.git
cd finn

# Frontend dependencies
pnpm install

# Python virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
pip install -r pipeline/requirements.txt
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```env
DATABASE_URL=                      # Optional Supabase Postgres URL (port 6543)
GEMINI_API_KEY=your_gemini_api_key  # Google AI Studio API key
GEMINI_FLASH_MODEL=gemini-2.5-flash
GEMINI_PRO_MODEL=gemini-2.5-pro
GEMINI_EMBED_MODEL=gemini-embedding-001
TAVILY_API_KEY=your_tavily_api_key  # Optional for management change bios
NEXT_PUBLIC_API_BASE=/api
```

### 3. Run Development Servers
```bash
# Terminal 1: Run Next.js Frontend
pnpm dev

# Terminal 2: Run FastAPI Backend
uvicorn api.index:app --reload --port 8000
```
Open [http://localhost:3000](http://localhost:3000) on your desktop or mobile browser.

---

## 7. Submission Checklist & Acceptance

- [x] **Mobile-first UI**: Max-width 430px mobile shell, bottom tab navigation, hairline borders (`#23272F`), teal accent (`#2DD4BF`), and tabular figures.
- [x] **Push Mode**: 24h/3d/7d/30d announcement digest, rich quarterly results cards (Revenue, EBITDA, PAT, margin changes in bps), management transition cards, and volume/price threshold alerts with coincidence detection.
- [x] **Pull Mode**: 7 grounded views strictly referencing primary sources (Annual Reports, Concalls, Regulatory Filings) with tappable source chips.
- [x] **Generalisation**: Dynamic support for arbitrary NSE tickers using serverless stepwise execution.
- [x] **Cost Efficiency**: Smart model routing (Flash for bulk, Pro for synthesis) with SHA-256 caching and live cost tracking.
- [x] **Deployability**: Vercel configuration (`vercel.json`), GitHub Actions cron jobs (`daily_refresh.yml`), and standalone offline fallback snapshots.
