linkedin-scraper-task1

Overview
- A complete demo stack to scrape public/test LinkedIn profiles, serve scraped data via an API, and render a UI.
- Legal note: Scraping LinkedIn may violate LinkedIn's Terms of Service. Use public/test profiles only. Do not scrape emails or private data. This project is for educational purposes.

Prerequisites
- Python 3.10+
- Node.js 18+
- Google Chrome installed

Project Structure
```
linkedin-scraper-task1/
  scraper/    # Python + Selenium scraper
  backend/    # Node + Express API
  frontend/   # React + Vite + TypeScript UI
```

Cross-app run sequence
1) Run the scraper
```
cd scraper
python -m venv venv
# activate venv (Windows PowerShell): .\venv\Scripts\Activate.ps1
# activate venv (cmd): venv\Scripts\activate.bat
# activate venv (macOS/Linux): source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Fill LINKEDIN_EMAIL and LINKEDIN_PASS with a test account (2FA may block automation)
# Add ~20 LinkedIn profile URLs (one per line) to profiles_input.txt
python linkedin_scraper.py
```

2) Run the backend
```
cd ../backend
npm install
npm start
# Test:
# http://localhost:4000/api/health
# http://localhost:4000/api/profiles
```

3) Run the frontend
```
cd ../frontend
npm install
npm run dev
# Open http://localhost:5173
```

Troubleshooting
- ChromeDriver mismatch: webdriver-manager downloads a matching driver automatically. Ensure Chrome is installed and up to date.
- Login failures: Verify credentials, avoid 2FA during automation, or complete 2FA manually if prompted (may not be supported in headless mode).
- HEADLESS mode: Set HEADLESS=true in .env to run without a visible browser. Some pages load differently in headless; try HEADLESS=false if scraping fails.
- Proxy: Set PROXY_URL in .env to route traffic through a proxy if your IP is being rate-limited.
- 2FA prompts and anti-bot: LinkedIn may challenge automation. Use public/test profiles, slow down scraping, add random delays, and respect robots and ToS.

Acceptance checks
- scraper/profiles.csv exists with columns:
  url,name,headline,location,about,image_file,experiences_json,education_json,projects_json,skills_csv
- Profile images downloaded to scraper/images/ and referenced in CSV image_file
- GET /api/profiles returns valid JSON array
- Frontend renders profile cards and opens LinkedIn profile links
- All READMEs exist; no secrets are committed; .env.example exists

Legal Notice
- Scraping may be restricted by LinkedIn's Terms of Service. Only use public/test data and never collect personal or private information such as emails. You are solely responsible for your use of this code.




