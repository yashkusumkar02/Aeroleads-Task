"""
LinkedIn Scraper Worker Service
FastAPI service that wraps the existing scraper and handles webhooks/upload
"""
import asyncio
import os
import random
import sys
import time
from pathlib import Path
from typing import List, Dict, Optional
import json

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import existing scraper modules
import linkedin_scraper
from utils import init_driver, human_scroll, wait_css, text_or_empty, json_dump_safe, download_image
from lk_selectors import SELECTORS
from bs4 import BeautifulSoup
from selenium.webdriver.common.by import By

ROOT = Path(__file__).resolve().parent
IMAGES_DIR = ROOT / "images"
CSV_PATH = ROOT / "profiles.csv"

app = FastAPI(title="LinkedIn Scraper Worker")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScrapeRequest(BaseModel):
    jobId: str
    email: str
    password: str
    urls: List[str]
    webhook: str


async def send_webhook(webhook_url: str, payload: dict):
    """Send webhook notification to backend"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(webhook_url, json=payload)
            resp.raise_for_status()
    except Exception as e:
        print(f"[ERROR] Failed to send webhook: {e}")


async def upload_csv(backend_base: str, csv_path: Path):
    """Upload CSV file to backend"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            with open(csv_path, "rb") as f:
                files = {"file": ("profiles.csv", f, "text/csv")}
                resp = await client.post(f"{backend_base}/api/upload/csv", files=files)
                resp.raise_for_status()
                print(f"[UPLOAD] CSV uploaded successfully")
    except Exception as e:
        print(f"[ERROR] Failed to upload CSV: {e}")


async def upload_image(backend_base: str, image_path: Path, name: str):
    """Upload image file to backend"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            with open(image_path, "rb") as f:
                files = {"file": (name, f, "image/jpeg")}
                params = {"name": name}
                resp = await client.post(f"{backend_base}/api/upload/image", files=files, params=params)
                resp.raise_for_status()
                print(f"[UPLOAD] Image {name} uploaded successfully")
    except Exception as e:
        print(f"[ERROR] Failed to upload image {name}: {e}")


async def run_scrape_task(req: ScrapeRequest):
    """Run the scraping task in background"""
    job_id = req.jobId
    webhook = req.webhook
    
    # Extract backend base URL
    try:
        from urllib.parse import urlparse
        parsed = urlparse(webhook)
        backend_base = f"{parsed.scheme}://{parsed.netloc}"
    except Exception:
        # Fallback: remove /api/scrape-webhook
        backend_base = webhook.replace("/api/scrape-webhook", "")

    driver = None
    try:
        # Initialize browser
        await send_webhook(webhook, {"jobId": job_id, "event": "browser-started", "message": "Browser starting..."})
        
        headless = os.getenv("HEADLESS", "true").lower() == "true"
        proxy_url = os.getenv("PROXY_URL", "").strip() or None
        driver = init_driver(headless=headless, proxy_url=proxy_url)

        # Login
        await send_webhook(webhook, {"jobId": job_id, "event": "log", "message": "Attempting login..."})
        
        if not linkedin_scraper.login(driver, req.email, req.password):
            await send_webhook(
                webhook,
                {
                    "jobId": job_id,
                    "event": "login-error",
                    "error": "Login failed. Check credentials or try again.",
                },
            )
            return

        await send_webhook(webhook, {"jobId": job_id, "event": "login-success", "message": "Login successful"})

        # Scrape URLs
        rows = []
        valid_urls = [url.strip() for url in req.urls if url.strip()][:20]  # Max 20

        for idx, url in enumerate(valid_urls, start=1):
            try:
                await send_webhook(
                    webhook,
                    {
                        "jobId": job_id,
                        "event": "scraping",
                        "current": idx,
                        "total": len(valid_urls),
                        "message": f"Scraping profile {idx}/{len(valid_urls)}: {url}",
                    },
                )

                driver.get(url)
                wait_css(driver, "main", timeout=15)
                human_scroll(driver, steps=random.randint(6, 9))

                # Try to expand "See more" sections
                try:
                    buttons = driver.find_elements(
                        By.XPATH,
                        "//button[.//span[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'see more')] or contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'see more')]",
                    )
                    for b in buttons[:5]:
                        try:
                            driver.execute_script("arguments[0].click();", b)
                            time.sleep(0.3)
                        except Exception:
                            pass
                except Exception:
                    pass

                html = driver.page_source
                soup = BeautifulSoup(html, "html.parser")

                name = linkedin_scraper.first_text(soup, SELECTORS["name"]) or ""
                headline = linkedin_scraper.first_text(soup, SELECTORS["headline"]) or ""
                location = linkedin_scraper.first_text(soup, SELECTORS["location"]) or ""
                about = linkedin_scraper.first_text(soup, SELECTORS["about"]) or ""
                image_url = linkedin_scraper.first_attr(soup, SELECTORS["image"], "src")

                # Fallbacks
                if not name:
                    title_node = soup.select_one("title")
                    if title_node:
                        t = (title_node.get_text() or "").strip()
                        if t:
                            name = t.split(" - ")[0].split("|")[0].strip()
                if not name:
                    og_title = linkedin_scraper.meta_content(soup, "og:title")
                    if og_title:
                        name = og_title.split(" - ")[0].split("|")[0].strip()

                if not image_url:
                    image_url = linkedin_scraper.meta_content(soup, "og:image")

                experiences = linkedin_scraper.parse_experiences(soup)
                education = linkedin_scraper.parse_education(soup)
                projects = linkedin_scraper.parse_projects(soup)
                skills = linkedin_scraper.parse_skills(soup)

                image_file = ""
                image_name = f"profile_{idx}.jpg"
                if image_url:
                    image_path = IMAGES_DIR / image_name
                    IMAGES_DIR.mkdir(parents=True, exist_ok=True)
                    if download_image(image_url, image_path):
                        image_file = f"images/{image_name}"

                row = {
                    "url": url,
                    "name": name,
                    "headline": headline,
                    "location": location,
                    "about": about,
                    "image_file": image_file,
                    "experiences_json": json_dump_safe(experiences),
                    "education_json": json_dump_safe(education),
                    "projects_json": json_dump_safe(projects),
                    "skills_csv": ", ".join(skills[:50]),
                }

                rows.append(row)
                printable_name = name or url
                await send_webhook(
                    webhook,
                    {
                        "jobId": job_id,
                        "event": "log",
                        "message": f"Extracted: {printable_name}",
                    },
                )

                # Random delay between requests
                time.sleep(random.uniform(2, 4))

            except Exception as e:
                error_msg = str(e).replace(req.password, "***")  # Never log password
                await send_webhook(
                    webhook,
                    {
                        "jobId": job_id,
                        "event": "log",
                        "message": f"Failed to scrape {url}: {error_msg}",
                    },
                )
                # Still append empty row
                rows.append(
                    {
                        "url": url,
                        "name": "",
                        "headline": "",
                        "location": "",
                        "about": "",
                        "image_file": "",
                        "experiences_json": "[]",
                        "education_json": "[]",
                        "projects_json": "[]",
                        "skills_csv": "",
                    }
                )

        # Save CSV
        import pandas as pd

        headers = [
            "url",
            "name",
            "headline",
            "location",
            "about",
            "image_file",
            "experiences_json",
            "education_json",
            "projects_json",
            "skills_csv",
        ]
        df = pd.DataFrame(rows, columns=headers)
        CSV_PATH.parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(CSV_PATH, index=False, encoding="utf-8")

        await send_webhook(
            webhook, {"jobId": job_id, "event": "log", "message": f"Saved CSV: {CSV_PATH}"}
        )

        # Upload CSV
        await upload_csv(backend_base, CSV_PATH)

        # Upload images
        for idx, row in enumerate(rows, start=1):
            if row.get("image_file"):
                image_name = f"profile_{idx}.jpg"
                image_path = IMAGES_DIR / image_name
                if image_path.exists():
                    await upload_image(backend_base, image_path, image_name)

        # Send done event
        await send_webhook(
            webhook,
            {
                "jobId": job_id,
                "event": "done",
                "total": len(valid_urls),
                "current": len(valid_urls),
                "message": "Scraping completed successfully",
            },
        )

    except Exception as e:
        error_msg = str(e).replace(req.password, "***")  # Never log password
        await send_webhook(
            webhook,
            {
                "jobId": job_id,
                "event": "error",
                "error": error_msg,
                "message": f"Scraping failed: {error_msg}",
            },
        )
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass


@app.post("/start")
async def start_scrape(req: ScrapeRequest):
    """Start a scraping job"""
    # Validate
    if not req.email or not req.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if not req.urls or len(req.urls) > 20:
        raise HTTPException(status_code=400, detail="URLs array must contain 1-20 URLs")
    if not req.webhook:
        raise HTTPException(status_code=400, detail="Webhook URL required")

    # Start background task
    asyncio.create_task(run_scrape_task(req))

    return {"ok": True, "message": "Scrape job started", "jobId": req.jobId}


@app.get("/health")
async def health():
    """Health check"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)

