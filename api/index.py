"""FINN — Financial Investment Agent API.

FastAPI application deployed as a Vercel Python serverless function.
All routes are prefixed with /api and served from this single entrypoint.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

app = FastAPI(
    title="FINN API",
    description="Financial Investment Agent — push intelligence & pull research",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    """Health check endpoint. Returns OK with server timestamp."""
    return {
        "status": "ok",
        "service": "finn",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/api/portfolio")
def get_portfolio():
    """Return demo portfolio holdings with mock price data."""
    # Phase 1: return mock data; Phase 2 will wire to the DB
    return {
        "holdings": [
            {"symbol": "RELIANCE", "name": "Reliance Industries", "sector": "Energy", "qty": 25, "avg_price": 2450.0, "ltp": 2612.35, "day_change_pct": 1.23, "pnl": 4058.75},
            {"symbol": "HDFCBANK", "name": "HDFC Bank", "sector": "Banking", "qty": 50, "avg_price": 1580.0, "ltp": 1742.10, "day_change_pct": -0.45, "pnl": 8105.00},
            {"symbol": "TCS", "name": "Tata Consultancy Services", "sector": "IT", "qty": 15, "avg_price": 3650.0, "ltp": 3892.55, "day_change_pct": 0.67, "pnl": 3638.25},
            {"symbol": "BHARTIARTL", "name": "Bharti Airtel", "sector": "Telecom", "qty": 30, "avg_price": 1420.0, "ltp": 1685.20, "day_change_pct": 2.10, "pnl": 7956.00},
            {"symbol": "ITC", "name": "ITC", "sector": "FMCG", "qty": 100, "avg_price": 435.0, "ltp": 468.75, "day_change_pct": -0.18, "pnl": 3375.00},
        ],
        "total_value": 842650.50,
        "day_pnl": 3245.80,
        "day_pnl_pct": 0.39,
    }


@app.get("/api/digest")
def get_digest():
    """Return demo digest feed. Phase 1: mock data."""
    return {
        "window": "24h",
        "material": [
            {
                "id": "demo-1",
                "symbol": "RELIANCE",
                "company": "Reliance Industries",
                "category": "results",
                "materiality": 3,
                "headline": "Board Meeting Outcome - Financial Results",
                "one_liner": "Q2 FY27 revenue ₹2.35L Cr (+7% YoY), PAT ₹19,101 Cr (+12% YoY)",
                "card_type": "results",
                "filed_at": "2026-10-28T16:30:00+05:30",
            },
            {
                "id": "demo-2",
                "symbol": "TRENT",
                "company": "Trent Ltd",
                "category": "management_change",
                "materiality": 3,
                "headline": "Change in Key Managerial Personnel",
                "one_liner": "CFO Rajesh Kulkarni resigned, effective Jan 2027",
                "card_type": "management_change",
                "filed_at": "2026-10-29T14:15:00+05:30",
            },
        ],
        "medium": [
            {
                "id": "demo-3",
                "symbol": "BAJFINANCE",
                "category": "dividend",
                "headline": "Dividend declaration",
                "one_liner": "Interim dividend ₹36/share, record date Nov 15",
                "filed_at": "2026-10-30T11:00:00+05:30",
            },
        ],
        "routine": {
            "count": 12,
            "summary": "ESOP allotments, trading window closures, compliance certificates",
            "items": [],
        },
    }


@app.get("/api/alerts")
def get_alerts():
    """Return demo alerts. Phase 1: mock data."""
    return {
        "alerts": [
            {
                "id": "alert-1",
                "symbol": "DIXON",
                "type": "volume_spike",
                "value": 3.4,
                "threshold": 2.0,
                "message": "Volume 3.4× its 20-day average",
                "triggered_at": "2026-10-31T15:30:00+05:30",
                "seen": False,
            },
            {
                "id": "alert-2",
                "symbol": "KPITTECH",
                "type": "price_move",
                "value": -6.2,
                "threshold": 5.0,
                "message": "Price dropped 6.2% in a single day",
                "triggered_at": "2026-10-31T15:30:00+05:30",
                "seen": False,
            },
        ],
    }
