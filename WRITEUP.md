# Covering Note: FINN — Financial Investment Agent

**To:** assessment@enam.com  
**Subject:** ENAM - IIT screening - 2027  

Dear ENAM Team,

Here is **FINN**, a mobile-first financial investment agent designed for an active Indian equity investor.

### What I Built
FINN operates in two disciplined modes:
1. **Push Intelligence**: A windowed filing digest (24h to 30d) across a 22-stock portfolio that prioritises material disclosures over routine compliance noise. It extracts rich quarterly results cards with QoQ/YoY margin deltas (in basis points) and enriches CXO transitions with executive background bios. Configurable alerts watch for volume anomalies (e.g. >2× 20-day average) and price moves, automatically surfacing "Why it moved" coincidence links to regulatory filings.
2. **Pull Research**: On-demand deep-dives across 7 structured views—led by **Promised vs Delivered**, which audits what management explicitly guided in earnings concalls over four quarters against subsequently audited financials. Every claim is grounded strictly in primary sources with tappable document and page citations (`[doc, page]`).

### Key Decisions & Trade-Offs
- **Primary-Source Grounding Over Outside LLM Knowledge**: I deliberately restricted the pull side to annual reports, concall transcripts, and exchange disclosures. No broker notes, no news sentiment, and no ungrounded LLM generalisations. Differentiated equity research lives in primary disclosures; secondary commentary introduces noise and bias.
- **Aggressive Cost Routing**: Rather than passing raw PDFs to an expensive model, I routed bulk extraction to Gemini 2.5 Flash and reserved Gemini 2.5 Pro exclusively for multi-quarter synthesis (Promised vs Delivered and Bull/Bear cases). Coupled with SHA-256 caching and high-value annual report section extraction (MD&A, Notes on Borrowings), full institutional research costs under ₹1.20 per company.
- **Serverless Stepwise Execution**: Vercel’s 60-second execution limit cannot parse long transcripts synchronously. I designed a 4-step state-machine engine allowing FINN to research **any** arbitrary NSE ticker on demand without timeout crashes or heavy infrastructure overhead.

### What I Deliberately Left Out
- **News Aggregation & Social Sentiment**: Financial media recycles press releases with delay; raw exchange filings provide zero-lag truth.
- **Complex Chat / Conversational Slop**: Investors need high-density, tabular figures, and scan-friendly timelines on a mobile screen, not conversational chit-chat.

### Where I'd Take It Next
1. **Real-time Broker Webhooks & Direct Order Placement**: Connecting directly to Zerodha/Upstox APIs for one-click rebalancing on filing triggers.
2. **Live Concall Audio Streaming**: Processing live audio feeds during earnings calls to detect real-time executive voice tone shifts.

**Prototype & Repo:** [Live URL] | [GitHub Repository]

Sincerely,  
Abhay
