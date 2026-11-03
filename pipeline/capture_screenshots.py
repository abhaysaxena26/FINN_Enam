"""
Script to capture clean screenshots at 390px mobile viewport of:
1. Today (top and scrolled)
2. Alerts
3. Research search
4. Company page (Promised vs Delivered + Key takeaways)
5. Portfolio
6. Account
"""

import os
import sys
import time
import subprocess
import requests
from pathlib import Path

CHROME_PATH = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
ARTIFACT_DIR = Path(r"C:\Users\abhay\.gemini\antigravity\brain\2541d055-9bcd-4c6c-b85f-d1555c5d7bdb")
ROOT_DIR = Path(__file__).resolve().parent.parent

def wait_for_url(url, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url, timeout=2)
            if r.status_code == 200:
                return True
        except Exception:
            pass
        time.sleep(1)
    return False

def take_screenshot(url, out_path, width=390, height=844):
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--hide-scrollbars",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        f"--window-size={width},{height}",
        f"--screenshot={out_path}",
        "--virtual-time-budget=3000",
        '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        url
    ]
    subprocess.run(cmd, check=True)
    print(f"Captured: {out_path} ({width}x{height})")

def main():
    print("1. Launching FastAPI backend...")
    api_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "api.index:app", "--port", "8000"],
        cwd=str(ROOT_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(2)

    print("2. Launching Next.js frontend...")
    next_proc = subprocess.Popen(
        "pnpm start",
        shell=True,
        cwd=str(ROOT_DIR),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    print("Waiting for Next.js at http://localhost:3000/today...")
    if not wait_for_url("http://localhost:3000/today", timeout=30):
        print("Falling back to pnpm dev...")
        if next_proc: next_proc.terminate()
        next_proc = subprocess.Popen(
            "pnpm dev",
            shell=True,
            cwd=str(ROOT_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        if not wait_for_url("http://localhost:3000/today", timeout=45):
            print("Failed to start server")
            if next_proc: next_proc.terminate()
            if api_proc: api_proc.terminate()
            return

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    print("3. Taking screenshots at 390px mobile viewport...")
    screenshots = [
        ("today_top_390", "http://localhost:3000/today", 390, 844),
        ("today_scrolled_390", "http://localhost:3000/today", 390, 1400),
        ("alerts_mobile_390", "http://localhost:3000/alerts", 390, 844),
        ("research_search_mobile_390", "http://localhost:3000/ask", 390, 844),
        ("company_reliance_mobile_390", "http://localhost:3000/company/RELIANCE", 390, 1100),
        ("company_titan_mobile_390", "http://localhost:3000/company/TITAN", 390, 1100),
        ("portfolio_mobile_390", "http://localhost:3000/portfolio", 390, 844),
        ("account_mobile_390", "http://localhost:3000/account", 390, 950),
    ]

    for name, url, w, h in screenshots:
        out_file = ARTIFACT_DIR / f"{name}.png"
        try:
            take_screenshot(url, str(out_file), w, h)
        except Exception as e:
            print(f"Error capturing {name}: {e}")

    print("4. Cleaning up processes...")
    try:
        if next_proc: next_proc.kill()
        if api_proc: api_proc.kill()
    except Exception:
        pass
    print("Done!")

if __name__ == "__main__":
    main()
