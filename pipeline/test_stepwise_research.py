"""
Test Stepwise Research Pipeline for Arbitrary Tickers
"""

import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Add project root to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from api.core.research_engine import create_job, execute_step, get_job

def test_stepwise():
    symbol = "TATAMOTORS"
    print(f"1. Creating research job for arbitrary ticker: {symbol}")
    job = create_job(symbol)
    job_id = job["job_id"]
    print(f"   Created Job ID: {job_id}, Initial step: {job['step']}")
    assert job["step"] == 1
    assert job["status"] == "in_progress"

    print("2. Advancing through steps 1 to 4...")
    for s in range(1, 5):
        updated = execute_step(job_id)
        print(f"   Step {s} complete -> Next step: {updated['step']}, Progress: {updated['progress_pct']}%, Status: {updated['status']}")
        if updated["status"] == "completed":
            break

    assert updated["status"] == "completed"
    assert updated["progress_pct"] == 100
    
    # Verify file was written
    out_file = ROOT / "data" / "snapshots" / "research" / f"{symbol}.json"
    assert out_file.exists(), f"Expected {out_file} to exist"
    print(f"3. Verified output snapshot: {out_file}")
    print("✓ All stepwise research tests passed!")

if __name__ == "__main__":
    test_stepwise()
