import json
import random
import time
from pathlib import Path
from typing import Optional, Tuple

import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.chrome import ChromeDriverManager


ua_pool = [
    # A few modern user agents to rotate
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
]


def init_driver(headless: bool, proxy_url: Optional[str] = None):
    options = Options()
    if headless:
        options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1366,900")
    options.add_argument(f"--user-agent={random.choice(ua_pool)}")
    options.page_load_strategy = "eager"

    if proxy_url:
        options.add_argument(f"--proxy-server={proxy_url}")

    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_page_load_timeout(45)
    return driver


def human_scroll(driver, steps: int = 6, sleep_range: Tuple[float, float] = (0.5, 1.2)):
    height = driver.execute_script("return document.body.scrollHeight") or 2000
    for i in range(1, steps + 1):
        y = int(height * (i / steps))
        driver.execute_script(f"window.scrollTo(0, {y});")
        time.sleep(random.uniform(*sleep_range))


def wait_css(driver, selector: str, timeout: int = 8):
    try:
        return WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, selector))
        )
    except Exception:
        return None


def text_or_empty(node) -> str:
    if not node:
        return ""
    txt = getattr(node, "get_text", lambda: "")()
    return (txt or "").strip()


def json_dump_safe(obj) -> str:
    try:
        return json.dumps(obj, ensure_ascii=False)
    except Exception:
        return "[]" if isinstance(obj, list) else "{}"


def download_image(url: str, dst_path: Path) -> bool:
    if not url:
        return False
    try:
        resp = requests.get(url, timeout=20, stream=True)
        if resp.status_code != 200:
            return False
        dst_path.parent.mkdir(parents=True, exist_ok=True)
        with open(dst_path, "wb") as f:
            for chunk in resp.iter_content(8192):
                if chunk:
                    f.write(chunk)
        return True
    except Exception:
        return False





