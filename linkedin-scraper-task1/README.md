# 📌 Task 1 — LinkedIn Profile Scraper + Frontend UI (AeroLeads Assignment)

## 🎯 Introduction

This task is part of the **AeroLeads AI Engineer assignment** and demonstrates advanced web scraping capabilities using Python automation. The project scrapes 20+ LinkedIn profile URLs and extracts comprehensive profile details including personal information, work experience, education, and skills.

The solution combines Selenium automation for data extraction with a modern React frontend to display the scraped profiles in a beautiful, user-friendly interface.

---

## 🚀 Project Objective

This assignment demonstrates expertise in:

- **Automation using Selenium**: Automated browser control for web scraping
- **Bypassing LinkedIn login**: Handles authentication and session management
- **Rotating browser headers / proxy strategy**: Anti-detection techniques to avoid blocks
- **Structuring output into CSV**: Clean data export for further processing
- **Displaying data in frontend UI**: Beautiful React interface for viewing scraped profiles

---

## ✅ Features

- **Login Automation**: Uses Selenium to handle LinkedIn login with credential management
- **Comprehensive Data Extraction**: Fetches:
  - Full name
  - Profile title/headline
  - Location
  - About section
  - Work experience (company, position, duration)
  - Education (institution, degree, dates)
  - Skills (up to 50 skills)
- **Image Downloads**: Automatically downloads profile images to local storage
- **CSV Export**: Saves all extracted data into `profiles.csv` with structured columns
- **React Frontend**: Beautiful card-based UI displaying:
  - Profile images
  - Name and headline
  - Experience details
  - Education information
  - Skills list
- **Backend API**: Express.js server serves scraped data to frontend

---

## 🛠️ Tech Stack

| Area | Tech |
|------|------|
| **Scraper** | Python, Selenium, webdriver-manager |
| **Storage** | CSV |
| **Frontend** | React + Vite, TypeScript |
| **Backend** | Node.js + Express.js |
| **Other tools** | Chrome Driver, dotenv, BeautifulSoup4 |

---

## 📂 Project Structure

```
linkedin-scraper-task1/
├── scraper/
│   ├── linkedin_scraper.py       # Main scraper script
│   ├── lk_selectors.py           # CSS selectors for LinkedIn elements
│   ├── utils.py                   # Utility functions
│   ├── profiles_input.txt         # Input file with LinkedIn URLs
│   ├── profiles.csv               # Output CSV with scraped data
│   ├── images/                    # Downloaded profile images
│   ├── requirements.txt           # Python dependencies
│   └── .env                       # LinkedIn credentials (create from .env.example)
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Main React component
│   │   ├── components/
│   │   │   └── ProfileCard.tsx    # Profile card component
│   │   └── main.tsx               # React entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── server.js                  # Express API server
│   └── package.json
│
└── README.md                       # This file
```

---

## 📋 How to Run Scraper

### Prerequisites
- Python 3.8+
- Chrome browser installed
- LinkedIn account credentials

### Steps

1. **Navigate to scraper directory**:
   ```bash
   cd linkedin-scraper-task1/scraper
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
   
   Or use virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   - Rename `.env.example` to `.env` (or create new `.env` file)
   - Add your LinkedIn credentials:
     ```
     LINKEDIN_EMAIL=your_email@example.com
     LINKEDIN_PASSWORD=your_password
     ```

4. **Add profile URLs**:
   - Open `profiles_input.txt`
   - Add LinkedIn profile URLs (one per line)
   - Example:
     ```
     https://www.linkedin.com/in/john-doe/
     https://www.linkedin.com/in/jane-smith/
     ```

5. **Run the scraper**:
   ```bash
   python linkedin_scraper.py
   ```

6. **Check output**:
   - Scraped data: `profiles.csv`
   - Profile images: `images/` folder

---

## 📋 How to Run Frontend

### Prerequisites
- Node.js 16+ and npm

### Steps

1. **Navigate to frontend directory**:
   ```bash
   cd linkedin-scraper-task1/frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   - The terminal will show a local URL (usually `http://localhost:5173`)
   - Open the URL in your browser
   - View scraped profiles displayed in beautiful card layout

### Backend Server (Optional)

If you want to run the backend API separately:

```bash
cd linkedin-scraper-task1/backend
npm install
npm start
```

The backend serves scraped data from `profiles.csv` at `http://localhost:3001/api/profiles`

---

## 📸 Screenshots

### Screenshot 1: Terminal showing scraping logs
*(Terminal output showing successful profile extraction with progress indicators)*

### Screenshot 2: Frontend showing cards with profile details
*(React frontend displaying profile cards with images, experience, education, and skills)*

---

## 💡 Learning & Challenges

### Technical Challenges Overcome

- **Dynamic DOM Structure**: LinkedIn's DOM elements are dynamically loaded, requiring careful wait strategies and selector management
- **Anti-Bot Detection**: Implemented user-agent rotation and timing delays to avoid rate limits and blocks
- **Login Handling**: Successfully automated LinkedIn authentication flow with credential management
- **Data Extraction Accuracy**: Parsed complex nested HTML structures to extract clean, structured data
- **Browser Automation Troubleshooting**: Handled various edge cases in Selenium WebDriver interactions
- **Image Download Management**: Efficiently downloaded and stored profile images with proper naming conventions
- **CSV Data Structure**: Organized scraped data into clean, readable CSV format for easy analysis

### Key Learnings

- Advanced Selenium automation techniques
- Web scraping best practices and ethics
- Handling dynamic content with explicit waits
- Anti-detection strategies for web scraping
- Full-stack integration (Python backend + React frontend)

---

## 🎯 Conclusion

This task successfully demonstrates end-to-end automation capabilities, from web scraping with Selenium to displaying data in a modern React interface. The solution handles LinkedIn's complex structure, manages authentication, and presents scraped profiles in an intuitive UI.

**Outcome**: A production-ready LinkedIn profile scraper that extracts comprehensive profile data and displays it in a beautiful frontend interface, showcasing skills in automation, web scraping, and full-stack development.

---

## 📞 Contact

**Created by Suyash – AI Engineer**

📧 Email: [kusumkarsuyash1234@gmail.com](mailto:kusumkarsuyash1234@gmail.com)

---

## ⚠️ Disclaimer

This tool is for educational purposes as part of the AeroLeads assignment. Always respect LinkedIn's Terms of Service and use scraping responsibly.
