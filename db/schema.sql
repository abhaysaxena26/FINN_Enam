-- FINN Database Schema
-- Supabase Postgres with pgvector extension

CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Companies tracked (portfolio + watchlist)
CREATE TABLE IF NOT EXISTS companies (
    symbol VARCHAR(30) PRIMARY KEY,
    bse_code VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    sector VARCHAR(100),
    mcap_bucket VARCHAR(20) CHECK (mcap_bucket IN ('large', 'mid', 'small')),
    in_portfolio BOOLEAN DEFAULT FALSE,
    qty INT DEFAULT 0,
    avg_price NUMERIC(12, 2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_portfolio ON companies(in_portfolio);
CREATE INDEX IF NOT EXISTS idx_companies_bse ON companies(bse_code);

-- 2. End-of-day prices
CREATE TABLE IF NOT EXISTS prices (
    symbol VARCHAR(30) NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
    date DATE NOT NULL,
    open NUMERIC(12, 2),
    high NUMERIC(12, 2),
    low NUMERIC(12, 2),
    close NUMERIC(12, 2) NOT NULL,
    volume BIGINT NOT NULL,
    PRIMARY KEY (symbol, date)
);

CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(date DESC);

-- 3. Corporate announcements & filings
CREATE TABLE IF NOT EXISTS announcements (
    id VARCHAR(100) PRIMARY KEY,
    symbol VARCHAR(30) NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
    bse_code VARCHAR(20),
    filed_at TIMESTAMPTZ NOT NULL,
    headline TEXT NOT NULL,
    raw_category VARCHAR(150),
    raw_subcategory VARCHAR(150),
    attachment_url TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'unclassified',
    materiality SMALLINT NOT NULL DEFAULT 1 CHECK (materiality BETWEEN 0 AND 3),
    one_liner TEXT,
    card_type VARCHAR(50) DEFAULT 'generic',
    card_payload JSONB DEFAULT '{}'::jsonb,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_symbol_date ON announcements(symbol, filed_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
CREATE INDEX IF NOT EXISTS idx_announcements_materiality ON announcements(materiality DESC);

-- 4. Triggered alerts
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(100) PRIMARY KEY,
    symbol VARCHAR(30) NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('volume_spike', 'price_move', 'material_announcement')),
    triggered_at TIMESTAMPTZ NOT NULL,
    value NUMERIC(12, 2) NOT NULL,
    threshold NUMERIC(12, 2) NOT NULL,
    message TEXT NOT NULL,
    announcement_id VARCHAR(100) REFERENCES announcements(id) ON DELETE SET NULL,
    seen BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_seen ON alerts(seen, triggered_at DESC);

-- 5. Configurable alert settings (singleton row id=1)
CREATE TABLE IF NOT EXISTS alert_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    volume_multiple NUMERIC(5, 2) DEFAULT 2.00,
    volume_lookback INT DEFAULT 20,
    price_move_pct NUMERIC(5, 2) DEFAULT 5.00,
    categories TEXT[] DEFAULT '{results,M&A,management_change,fund_raise,litigation,credit_rating,pledging}',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default settings if not exists
INSERT INTO alert_settings (id, volume_multiple, volume_lookback, price_move_pct, categories)
VALUES (1, 2.00, 20, 5.00, '{results,M&A,management_change,fund_raise,litigation,credit_rating,pledging}')
ON CONFLICT (id) DO NOTHING;

-- 6. Fundamental documents (AR, concalls, results PDFs)
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(100) PRIMARY KEY,
    symbol VARCHAR(30) NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
    doc_type VARCHAR(30) NOT NULL CHECK (doc_type IN ('annual_report', 'concall', 'results')),
    period_label VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    page_count INT DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_documents_symbol_type ON documents(symbol, doc_type);

-- 7. Document chunks with embeddings and full-text search
CREATE TABLE IF NOT EXISTS chunks (
    id VARCHAR(120) PRIMARY KEY,
    document_id VARCHAR(100) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    symbol VARCHAR(30) NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
    page INT NOT NULL,
    text TEXT NOT NULL,
    embedding VECTOR(768),
    tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', text)) STORED
);

CREATE INDEX IF NOT EXISTS idx_chunks_symbol ON chunks(symbol);
CREATE INDEX IF NOT EXISTS idx_chunks_doc ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_tsv ON chunks USING GIN(tsv);
-- Vector index (hnsw for cosine similarity)
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING hnsw (embedding vector_cosine_ops);

-- 8. Precomputed research views
CREATE TABLE IF NOT EXISTS research (
    symbol VARCHAR(30) NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
    view VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    sources JSONB DEFAULT '[]'::jsonb,
    model VARCHAR(50),
    tokens_in INT DEFAULT 0,
    tokens_out INT DEFAULT 0,
    cost_usd NUMERIC(8, 6) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (symbol, view)
);

-- 9. LLM prompt/response cache
CREATE TABLE IF NOT EXISTS llm_cache (
    key VARCHAR(64) PRIMARY KEY, -- sha256 hash of prompt + model
    model VARCHAR(50) NOT NULL,
    response JSONB NOT NULL,
    tokens_in INT DEFAULT 0,
    tokens_out INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Asynchronous stepwise research jobs (for on-demand tickers)
CREATE TABLE IF NOT EXISTS research_jobs (
    id VARCHAR(100) PRIMARY KEY,
    symbol VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'error')),
    step VARCHAR(100) NOT NULL DEFAULT 'init',
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
