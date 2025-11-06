import csv
import os
import random
import sys
import time
from pathlib import Path
from typing import List, Dict

import pandas as pd
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

from utils import init_driver, human_scroll, wait_css, text_or_empty, json_dump_safe, download_image
from lk_selectors import SELECTORS


ROOT = Path(__file__).resolve().parent
IMAGES_DIR = ROOT / "images"
CSV_PATH = ROOT / "profiles.csv"
INPUT_PATH = ROOT / "profiles_input.txt"


def load_env():
    # Support both .env and env.example fallback content
    load_dotenv(ROOT / ".env")
    os.environ.setdefault("HEADLESS", "false")


def read_input_urls() -> List[str]:
    if not INPUT_PATH.exists():
        print(f"Input file not found: {INPUT_PATH}")
        return []
    urls: List[str] = []
    with open(INPUT_PATH, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            urls.append(line)
    return urls


def login(driver, email: str, password: str) -> bool:
    driver.get("https://www.linkedin.com/login")
    email_input = wait_css(driver, "input#username", timeout=15)
    pass_input = wait_css(driver, "input#password", timeout=15)
    if not email_input or not pass_input:
        return False
    email_input.clear()
    email_input.send_keys(email)
    pass_input.clear()
    pass_input.send_keys(password)
    pass_input.send_keys(Keys.ENTER)

    # Basic post-login check
    if wait_css(driver, "input[placeholder='Search']", timeout=15) or wait_css(driver, "img.global-nav__me-photo", timeout=15):
        return True
    return False


def first_text(soup: BeautifulSoup, selectors: List[str]) -> str:
    for sel in selectors:
        node = soup.select_one(sel)
        if node:
            txt = text_or_empty(node)
            if txt:
                return txt
    return ""


def first_attr(soup: BeautifulSoup, selectors: List[str], attr: str) -> str:
    for sel in selectors:
        node = soup.select_one(sel)
        if node and node.has_attr(attr):
            val = (node[attr] or "").strip()
            if val:
                return val
        if node and attr == "src":
            # Some LinkedIn images use data-* attributes
            for candidate in ["data-delayed-url", "data-src", "data-original"]:
                if node.has_attr(candidate):
                    val = (node.get(candidate) or "").strip()
                    if val:
                        return val
    return ""


def meta_content(soup: BeautifulSoup, prop: str) -> str:
    node = soup.select_one(f"meta[property='{prop}']") or soup.select_one(f"meta[name='{prop}']")
    if node and node.has_attr('content'):
        return (node['content'] or '').strip()
    return ''


def find_section_by_heading(soup: BeautifulSoup, heading_text: str):
    # Look for an h2 containing the text and return the nearest section ancestor
    # LinkedIn often nests h2 inside divs within a section.artdeco-card
    candidates = soup.find_all('h2')
    for h in candidates:
        txt = (h.get_text() or '').strip().lower()
        if heading_text.lower() in txt:
            # climb up to a <section> if possible
            parent = h
            for _ in range(6):
                if not parent:
                    break
                if parent.name == 'section':
                    return parent
                parent = parent.parent
            # fallback: return the immediate container div
            return h.parent
    return None


def parse_experiences(soup: BeautifulSoup) -> List[Dict]:
    section = find_section_by_heading(soup, 'Experience')
    if not section:
        return []
    items: List[Dict] = []
    # Primary modern layout: list items under .pvs-list
    nodes = section.select('li.pvs-list__item') or section.select('li')
    for n in nodes:
        # try several title/company/date/desc patterns
        title = text_or_empty(n.select_one('.t-bold')) or text_or_empty(n.select_one('span.mr1.t-bold')) or text_or_empty(n.select_one('h3'))
        company = text_or_empty(n.select_one('.t-14.t-normal')) or text_or_empty(n.select_one('.pv-entity__secondary-title'))
        if not company:
            # sometimes company is after a bullet
            company = text_or_empty(n.select_one('span.t-normal'))
        date_range = text_or_empty(n.select_one('.t-14.t-normal.t-black--light')) or text_or_empty(n.select_one('.pv-entity__date-range span:nth-of-type(2)'))
        description = text_or_empty(n.select_one('div.inline-show-more-text')) or text_or_empty(n.select_one('p'))
        if any([title, company, date_range, description]):
            items.append({
                'title': title,
                'company': company,
                'date_range': date_range,
                'description': description,
            })
    return items


def parse_education(soup: BeautifulSoup) -> List[Dict]:
    section = find_section_by_heading(soup, 'Education')
    if not section:
        return []
    items: List[Dict] = []
    nodes = section.select('li.pvs-list__item') or section.select('li')
    for n in nodes:
        school = text_or_empty(n.select_one('.t-bold')) or text_or_empty(n.select_one('.pv-entity__school-name'))
        degree = text_or_empty(n.select_one('.t-14.t-normal')) or text_or_empty(n.select_one('.pv-entity__degree-name .pv-entity__comma-item'))
        year = text_or_empty(n.select_one('.t-14.t-normal.t-black--light')) or text_or_empty(n.select_one('.pv-entity__dates time'))
        if any([school, degree, year]):
            items.append({'school': school, 'degree': degree, 'year': year})
    return items


def parse_projects(soup: BeautifulSoup) -> List[Dict]:
    section = find_section_by_heading(soup, 'Projects')
    if not section:
        return []
    items: List[Dict] = []
    nodes = section.select('li.pvs-list__item') or section.select('li')
    for n in nodes:
        title = text_or_empty(n.select_one('.t-bold')) or text_or_empty(n.select_one('.mr1.t-bold'))
        desc = text_or_empty(n.select_one('.t-14.t-normal')) or text_or_empty(n.select_one('.t-14.t-normal.t-black--light'))
        if title or desc:
            items.append({'title': title, 'description': desc})
    return items


def parse_skills(soup: BeautifulSoup) -> List[str]:
    section = find_section_by_heading(soup, 'Skills')
    if not section:
        return []
    # Try common skill selectors
    nodes = section.select('span.pv-skill-category-entity__name-text') or section.select('span.mr1.t-bold') or section.select('li span')
    skills = [text_or_empty(n) for n in nodes]
    skills = [s for s in skills if s]
    # Deduplicate while preserving order
    seen = set()
    uniq: List[str] = []
    for s in skills:
        if s not in seen:
            seen.add(s)
            uniq.append(s)
    return uniq[:50]


def main():
    load_env()
    email = os.getenv("LINKEDIN_EMAIL", "")
    password = os.getenv("LINKEDIN_PASS", "")
    headless = os.getenv("HEADLESS", "false").lower() == "true"
    proxy_url = os.getenv("PROXY_URL", "").strip() or None

    urls = read_input_urls()
    if not urls:
        print("No URLs in profiles_input.txt. Add linkedin.com/in/... URLs (one per line).")
        sys.exit(1)

    driver = init_driver(headless=headless, proxy_url=proxy_url)
    try:
        if not login(driver, email, password):
            print("Login failed. Check credentials or disable headless mode.")
            sys.exit(2)

        rows = []
        for idx, url in enumerate(urls, start=1):
            try:
                driver.get(url)
                # initial wait for top section
                wait_css(driver, "main", timeout=15)
                human_scroll(driver, steps=random.randint(6, 9))

                # Try to expand "See more" sections to reveal details
                try:
                    # Click a few visible see-more/show-all buttons if present
                    buttons = driver.find_elements(By.XPATH, "//button[.//span[contains(translate(text(),'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'see more')] or contains(translate(.,'ABCDEFGHIJKLMNOPQRSTUVWXYZ','abcdefghijklmnopqrstuvwxyz'),'see more')]")
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

                name = first_text(soup, SELECTORS["name"]) or ""
                headline = first_text(soup, SELECTORS["headline"]) or ""
                location = first_text(soup, SELECTORS["location"]) or ""
                about = first_text(soup, SELECTORS["about"]) or ""
                image_url = first_attr(soup, SELECTORS["image"], "src")

                # Fallbacks (meta/title) if basic selectors miss
                if not name:
                    # Try <title> e.g., "Jane Doe - Something | LinkedIn"
                    title_node = soup.select_one('title')
                    if title_node:
                        t = (title_node.get_text() or '').strip()
                        if t:
                            name = t.split(' - ')[0].split('|')[0].strip()
                if not name:
                    og_title = meta_content(soup, 'og:title')
                    if og_title:
                        name = og_title.split(' - ')[0].split('|')[0].strip()

                if not image_url:
                    image_url = meta_content(soup, 'og:image')

                experiences = parse_experiences(soup)
                education = parse_education(soup)
                projects = parse_projects(soup)
                skills = parse_skills(soup)

                image_file = ""
                if image_url:
                    image_path = IMAGES_DIR / f"profile_{idx}.jpg"
                    if download_image(image_url, image_path):
                        image_file = f"images/{image_path.name}"

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
                print(f"[{idx}/{len(urls)}] Scraped: {printable_name}")
            except Exception as e:
                print(f"[{idx}/{len(urls)}] Failed: {url} ({e})")
                # Still append an empty row to preserve indexing
                rows.append({
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
                })

        # Save CSV with exact headers and UTF-8
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
        df.to_csv(CSV_PATH, index=False, encoding="utf-8")
        print(f"Saved: {CSV_PATH}")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()


