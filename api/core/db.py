"""Database connection helper with connection pooling and graceful offline fallback.

Uses psycopg2 with Supabase connection string. If DATABASE_URL is not set or
unreachable, returns None and callers seamlessly fallback to data/snapshots/*.json.
"""

import os
import logging
from typing import Optional, Any, List, Dict
from contextlib import contextmanager

logger = logging.getLogger("finn.db")

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()


def is_db_available() -> bool:
    """Check if DATABASE_URL is configured."""
    return bool(DATABASE_URL)


@contextmanager
def get_db_connection():
    """Context manager for DB connection with auto-commit/rollback.
    
    Yields connection or None if unavailable.
    """
    if not DATABASE_URL:
        yield None
        return

    try:
        import psycopg2
        import psycopg2.extras
        
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=5)
        try:
            yield conn
            conn.commit()
        except Exception as e:
            conn.rollback()
            logger.error(f"DB transaction error: {e}")
            raise
        finally:
            conn.close()
    except Exception as e:
        logger.warning(f"Could not connect to database: {e}")
        yield None


def execute_query(sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
    """Execute a read query and return list of dicts.
    
    Returns empty list if DB is unreachable.
    """
    with get_db_connection() as conn:
        if conn is None:
            return []
        try:
            import psycopg2.extras
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(sql, params)
                return [dict(row) for row in cur.fetchall()]
        except Exception as e:
            logger.error(f"Query error: {e}")
            return []


def execute_write(sql: str, params: tuple = ()) -> bool:
    """Execute an insert/update query. Returns True if successful."""
    with get_db_connection() as conn:
        if conn is None:
            return False
        try:
            with conn.cursor() as cur:
                cur.execute(sql, params)
            return True
        except Exception as e:
            logger.error(f"Write error: {e}")
            return False
