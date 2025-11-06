# 📌 AeroLeads Assignment – AI Automation + AI Content Generator

## 🎯 Introduction

This repository contains **two comprehensive tasks** completed as part of the AeroLeads AI Engineer assignment. Both projects demonstrate hands-on expertise in AI automation, web scraping, full-stack development, and AI-powered content generation.

**Task 1** showcases advanced web scraping capabilities using Python and Selenium to automate LinkedIn profile data extraction, with a beautiful React frontend to display the results. **Task 3** demonstrates AI content generation using Google's Gemini AI to create full-length programming articles, complete with a modern Next.js interface and article management system.

Together, these projects highlight proficiency in building end-to-end AI automation solutions, from data collection and processing to AI-driven content creation with polished user interfaces.

---

## 📂 Folder Structure

```
Aeroleads-Assignment/
│
├── linkedin-scraper-task1/
│   ├── scraper/
│   │   ├── linkedin_scraper.py
│   │   ├── profiles_input.txt
│   │   ├── profiles.csv
│   │   └── requirements.txt
│   ├── frontend/
│   │   ├── src/
│   │   ├── public/
│   │   └── package.json
│   ├── backend/
│   │   ├── server.js
│   │   └── package.json
│   └── README.md (Task-level documentation)
│
└── ai-blog-generator-task3/
    ├── app/
    │   ├── api/
    │   ├── blog/
    │   └── generate/
    ├── components/
    ├── lib/
    ├── content/
    │   ├── posts/
    │   └── posts.json
    └── README.md (Task-level documentation)
```

---

## ✅ Task 1 – LinkedIn Scraper

### ⭐ Goal
Scrape LinkedIn profile data (name, headline, profile image, experience, education, skills) from 20 URLs and display results in a beautiful React frontend interface.

### 🚀 Features
- **Selenium Automation**: Handles LinkedIn login with credential management
- **User-Agent Spoofing**: Bypasses basic bot detection mechanisms
- **Data Extraction**: Captures profile images, experience, education, and skills
- **CSV Storage**: Saves all scraped data to `profiles.csv` for persistence
- **React Frontend**: Beautiful UI displaying scraped profiles with images in cards
- **Backend API**: Express.js server serves scraped data to frontend

### 🛠️ Tech Stack
- **Backend**: Python 3.x, Selenium, webdriver-manager, BeautifulSoup4
- **Frontend**: React + Vite, TypeScript, Tailwind CSS
- **Storage**: CSV files (no database required)
- **API**: Node.js + Express.js

### 📋 How to Run

1. **Setup Environment**:
   ```bash
   cd linkedin-scraper-task1/scraper
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Credentials**:
   - Create `.env` file in `scraper/` directory
   - Add your LinkedIn test account credentials:
     ```
     LINKEDIN_EMAIL=your_email@example.com
     LINKEDIN_PASSWORD=your_password
     ```

3. **Run the Scraper**:
   ```bash
   cd linkedin-scraper-task1/scraper
   python linkedin_scraper.py
   ```
   - Scraper reads URLs from `profiles_input.txt`
   - Outputs data to `profiles.csv`
   - Downloads profile images to `images/` folder

4. **Start Backend Server**:
   ```bash
   cd linkedin-scraper-task1/backend
   npm install
   npm start
   ```

5. **Start Frontend**:
   ```bash
   cd linkedin-scraper-task1/frontend
   npm install
   npm run dev
   ```

6. **View Results**:
   - Open browser to `http://localhost:5173`
   - View scraped profiles in beautiful card layout with images

### 📸 Output Screenshots
- *(Scraper CLI screenshot showing successful extraction)*
- *(Frontend profile list screenshot with cards and images)*

---

## ✅ Task 3 – AI Programming Article Generator

### ⭐ Goal
User enters up to 10 programming topics → Gemini AI generates full blog articles → automatically saved under `/blog` with beautiful UI and article management.

### 🚀 Features
- **Gemini AI Integration**: Uses Gemini 2.5 Flash model for fast, cost-effective generation
- **Multi-Paragraph Input**: Accepts detailed briefs and context per article
- **Full Article Generation**: Creates complete Markdown articles (1500+ words) with:
  - TL;DR section
  - Code examples
  - Step-by-step implementation
  - FAQs and common pitfalls
- **Smart Parsing**: NLP-powered input analysis to extract programming languages/topics
- **Article Management**: View, delete, and browse generated articles
- **Progress Tracking**: Real-time generation progress with status indicators
- **Success Animation**: Confetti celebration on completion
- **User API Key Support**: Users can connect their own Gemini API keys
- **File-Based Storage**: Markdown files in `/content/posts/` with JSON metadata

### 🛠️ Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with glassmorphism effects
- **AI Provider**: Google Gemini 2.5 Flash API
- **Storage**: File-based (Markdown + JSON, no database)
- **Markdown Rendering**: remark + rehype with syntax highlighting

### 📋 How to Run

1. **Install Dependencies**:
   ```bash
   cd ai-blog-generator-task3
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.local.example .env.local
   ```
   - Edit `.env.local` and add your `GEMINI_API_KEY`
   - Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Application**:
   - Open browser to `http://localhost:3000/generate`
   - Connect your Gemini API key (or use server's key)
   - Enter up to 10 programming article topics
   - Click "Generate Programming Articles"
   - View generated articles at `/blog`

### 📝 Article Format
Each generated article includes:
- **TL;DR** (3-5 bullet points)
- **Overview** (what/why)
- **Project Example** (with full working code)
- **Deep Explanation**
- **Step-by-Step Implementation**
- **Testing and Validation**
- **Common Pitfalls**
- **FAQs**
- **Conclusion**
- **SEO Metadata** (title, description, keywords)

---

## 🎯 Value Delivered

### For Recruiter Review
- ✅ **AI Automation Expertise**: Demonstrated ability to create AI-powered automation workflows and agent systems
- ✅ **Web Scraping Mastery**: Advanced Selenium automation with anti-detection techniques
- ✅ **Full-Stack Development**: Complete solutions from backend APIs to polished frontend UIs
- ✅ **AI Integration**: Hands-on experience with prompt engineering and AI content generation
- ✅ **Production-Ready Code**: Clean architecture, error handling, and user-friendly interfaces
- ✅ **End-to-End Delivery**: From data collection to AI-powered content creation with deployment-ready solutions

---

## 📹 Video Demo

*[YouTube demo link will be added here]*

---

## 🔗 Links

- ✅ **Task 1 - LinkedIn Scraper**: [`linkedin-scraper-task1/`](./linkedin-scraper-task1/)
- ✅ **Task 3 - AI Article Generator**: [`ai-blog-generator-task3/`](./ai-blog-generator-task3/)

---

## 📞 Contact

**Created by Suyash – AI Engineer**

📧 Email: [kusumkarsuyash1234@gmail.com](mailto:kusumkarsuyash1234@gmail.com)

---

## 📄 License

This repository is part of the AeroLeads AI Engineer assignment submission.

