"""
Script to capture clean screenshots of all 4 tabs at 390px mobile and 1280px desktop.
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

def take_screenshot(url, out_path, width, height, is_mobile=False):
    cmd = [
        CHROME_PATH,
        "--headless=new",
        "--hide-scrollbars",
        "--disable-gpu",
        "--force-device-scale-factor=1",
        f"--window-size={width},{height}",
        f"--screenshot={out_path}",
        "--virtual-time-budget=3000",
    ]
    if is_mobile:
        cmd.append('--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1')
    cmd.append(url)
    subprocess.run(cmd, check=True)
    print(f"Captured: {out_path} ({width}x{height})")

def main():
    print("1. Checking/Launching servers...")
    # Check if Next.js already running
    next_running = False
    try:
        r = requests.get("http://localhost:3000/brief", timeout=1)
        if r.status_code == 200:
            next_running = True
    except Exception:
        pass

    api_proc = None
    next_proc = None

    if not next_running:
        print("Starting FastAPI backend...")
        api_proc = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "api.index:app", "--port", "8000"],
            cwd=str(ROOT_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        time.sleep(2)

        print("Starting Next.js frontend...")
        # Use pnpm dev
        next_proc = subprocess.Popen(
            "pnpm dev",
            shell=True,
            cwd=str(ROOT_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        print("Waiting for Next.js to be ready at http://localhost:3000...")
        if not wait_for_url("http://localhost:3000/brief", timeout=45):
            print("Failed to connect to Next.js")
            if next_proc: next_proc.terminate()
            if api_proc: api_proc.terminate()
            return
    else:
        print("Next.js is already running on port 3000!")

    tabs = [
        ("brief", "http://localhost:3000/brief"),
        ("alerts", "http://localhost:3000/alerts"),
        ("ask", "http://localhost:3000/ask"),
        ("portfolio", "http://localhost:3000/portfolio"),
        ("company_titan", "http://localhost:3000/company/TITAN"),
    ]

    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    print("2. Taking screenshots for all 4 tabs...")
    for name, url in tabs:
        # Mobile view (exact 430px viewport on Windows requires 446 window size)
        mobile_out = ARTIFACT_DIR / f"{name}_mobile.png"
        take_screenshot(url, str(mobile_out), 446, 920, is_mobile=True)

        # Desktop view (1280x880 with centered 430px container)
        desktop_out = ARTIFACT_DIR / f"{name}_desktop.png"
        take_screenshot(url, str(desktop_out), 1280, 880, is_mobile=False)

    print("3. Done taking all screenshots!")
    if next_proc:
        next_proc.terminate()
    if api_proc:
        api_proc.terminate()

if __name__ == "__main__":
    main()
