Scraper - LinkedIn (Test/Public Profiles Only)

Setup
1) Create and activate a virtual environment
```
python -m venv venv
# Windows PowerShell: .\venv\Scripts\Activate.ps1
# Windows cmd: venv\Scripts\activate.bat
# macOS/Linux: source venv/bin/activate
```
2) Install dependencies
```
pip install -r requirements.txt
```
3) Create .env from example and fill values
```
cp .env.example .env
```
Required:
- LINKEDIN_EMAIL, LINKEDIN_PASS (test account)
Optional:
- HEADLESS=true|false (default false)
- PROXY_URL= (leave blank for none)

4) Add profile URLs
- Put ~20 URLs (one per line) in profiles_input.txt, format: https://www.linkedin.com/in/...

Run
```
python linkedin_scraper.py
```

Output
- profiles.csv (UTF-8)
- images/ folder with downloaded jpgs

CSV columns (exact order)
- url,name,headline,location,about,image_file,experiences_json,education_json,projects_json,skills_csv

Notes and Legal
- Scraping LinkedIn may violate LinkedIn ToS. Use public/test profiles only. Do not scrape emails or private data. Educational use only.
- 2FA and bot detection may block automation. Try HEADLESS=false and complete prompts manually if they appear.
- If you see 429s/rate limiting, slow down and try a proxy via PROXY_URL.

Troubleshooting
- ChromeDriver mismatch: webdriver-manager downloads the right driver automatically; ensure Chrome is installed.
- Login failures: Verify credentials; avoid headless if blocked; complete additional challenges manually if possible.
- Sections missing: Public pages differ; scraper writes empty strings for missing fields.




