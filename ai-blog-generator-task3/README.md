# 📌 Task 3 — AI Programming Article Generator (Gemini 2.5 Flash) – AeroLeads Assignment

## 🎯 Introduction

**Task 3** is an AI-powered content generation application that transforms programming topics into full-length blog articles. Users can enter up to 10 programming-related topics, and the app generates comprehensive blog articles using Google's Gemini 2.5 Flash AI model.

The application features a beautiful animated UI that shows real-time generation progress, automatically saves each article as Markdown under `/blog`, and provides article management capabilities including viewing and deleting generated content.

This project demonstrates end-to-end AI integration, from prompt engineering to full-stack implementation with a modern, user-friendly interface.

---

## ✅ Features

- **Gemini 2.5 Flash Integration**: Uses Google's latest Gemini model for fast, cost-effective article generation
- **Multi-Paragraph Content Input**: Accepts detailed briefs and context (up to 5000 words per input)
- **Full-Length Article Generation**: Creates comprehensive articles (1500–2000+ words each) with proper structure
- **Live Progress Panel**: Real-time generation status with animated progress indicators ("Generating article X of Y...")
- **Success Animation**: Confetti celebration on completion
- **Article Management**: View, browse, and delete generated articles
- **Markdown-Based Storage**: No database required – articles stored as Markdown files in `/content/posts/`
- **User API Key Support**: Users can connect their own Gemini API keys
- **Smart Input Parsing**: NLP-powered analysis to extract programming languages and topics from complex inputs
- **SEO Optimization**: Each article includes SEO metadata (title, description, keywords)
- **Code Highlighting**: Syntax-highlighted code blocks in generated articles
- **Responsive UI**: Beautiful glassmorphism design with animated gradients

---

## 🛠️ Tech Stack

| Area | Tech |
|------|------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS |
| **AI Model** | Gemini 2.5 Flash |
| **Storage** | Markdown files under `/content/posts` |
| **Markdown Rendering** | remark + rehype with syntax highlighting |
| **State Management** | React Hooks |

---

## 📂 Project Structure

```
task3-ai-programming-article-generator/
├── app/
│   ├── api/
│   │   ├── generate-single/      # Single article generation endpoint
│   │   ├── parse-input/          # Smart input parsing endpoint
│   │   ├── verify-key/            # API key verification
│   │   └── delete-post/           # Article deletion endpoint
│   ├── generate/                  # Article generation UI
│   │   └── page.tsx
│   ├── blog/                      # Blog listing and detail pages
│   │   ├── page.tsx               # Article list
│   │   └── [slug]/page.tsx       # Individual article view
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Global styles with animations
│
├── components/
│   ├── PromptForm.tsx             # Article input form
│   ├── ApiKeyManager.tsx          # API key connection UI
│   ├── PostCard.tsx               # Article card component
│   ├── DeleteButton.tsx           # Delete functionality
│   └── Confetti.tsx               # Success animation
│
├── lib/
│   ├── providers.ts               # Gemini API client
│   ├── promptBuilder.ts           # Prompt engineering logic
│   ├── smartParser.ts             # NLP input parsing
│   ├── fsPosts.ts                 # File system operations
│   ├── markdown.ts                # Markdown rendering
│   └── slugger.ts                 # URL slug generation
│
├── content/
│   ├── posts/                     # Generated Markdown files
│   └── posts.json                 # Article metadata index
│
└── README.md                      # This file
```

---

## 🔄 How It Works

### Flow Diagram

```
User Input
    ↓
[Parse Input with NLP] → Extract Topics/Languages
    ↓
[Generate Articles Sequentially]
    ↓
For Each Article:
    ├── Build Prompt (with structure requirements)
    ├── Call Gemini 2.5 Flash API
    ├── Continue Generation (if needed) → Up to 3 continuation attempts
    ├── Extract & Validate META Block
    ├── Save Markdown to /content/posts/{slug}.md
    └── Update posts.json index
    ↓
[Show Progress UI] → "Generating article X of Y..."
    ↓
[Completion Animation] → Confetti + Success Message
    ↓
[View Articles] → /blog
    ↓
[Manage Articles] → View Full Post / Delete
```

### Generation Process

1. **Input Parsing**: Smart NLP analysis extracts programming topics from user input
2. **Prompt Building**: Each article gets a structured prompt with:
   - Title and context
   - Target word count
   - Audience level
   - Required article structure
   - SEO metadata requirements
3. **AI Generation**: Gemini 2.5 Flash generates full articles
4. **Continuation Logic**: If article is incomplete, automatically continues up to 3 times
5. **File Storage**: Saves as Markdown with metadata in JSON index
6. **UI Updates**: Real-time progress tracking and success animations

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Steps

1. **Install Dependencies**:
   ```bash
   cd ai-blog-generator-task3
   npm install
   ```

2. **Configure Environment**:
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add:
   ```
   GEMINI_API_KEY=your_api_key_here
   SITE_NAME=AI Programming Article Generator
   DEFAULT_LENGTH=1500
   DEFAULT_AUDIENCE=intermediate
   DEFAULT_STYLE=tutorial
   MAX_POSTS_PER_RUN=10
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Application**:
   - Open browser to `http://localhost:3000/generate`
   - Connect your Gemini API key (or use server's key if configured)
   - Start generating articles!

---

## 📖 How to Use

### Step 1: Connect API Key
- Click "Connect Your Gemini API Key" section
- Enter your API key from Google AI Studio
- Click "Verify & Connect"
- See confirmation: "✅ API Key Connected"

### Step 2: Enter Article Topics
- In the textarea, paste or type article briefs
- Format: `Title | keywords=comma,separated | length=1500 | audience=beginners | style=tutorial`
- Each article can be multi-paragraph (separate with blank lines)
- Example:
  ```
  Building REST APIs with Node.js | keywords=nodejs,api,backend
  
  This article should cover REST principles, Express.js setup, routing, 
  middleware, error handling, and best practices. Include complete 
  working code examples.
  
  React Hooks Complete Guide | keywords=react,hooks,frontend | length=1800
  
  Provide a comprehensive guide to React Hooks including useState, 
  useEffect, useContext, custom hooks, and common patterns.
  ```

### Step 3: Generate Articles
- Click "Generate Programming Articles"
- Watch the right-side progress panel:
  - ⏳ Pending
  - 🔄 Generating article X of Y...
  - ✅ Success
  - ❌ Failed (if any errors)

### Step 4: View Results
- After completion, see confetti animation 🎉
- Click "View Blog →" button
- Browse all generated articles
- Click any article to read full content
- Use "Delete" button to remove articles

### Step 5: Manage Articles
- **View Full Article**: Click "View full post →" on any card
- **Delete Article**: Click "Delete" → Confirm deletion
- Articles are permanently removed from storage

---

## 🧠 Prompt Engineering

### Why the Prompt Structure Matters

The prompt is carefully engineered to ensure high-quality, complete articles:

#### 1. **Full Article Generation**
```
"You are an expert programming educator.
Generate a full-length programming blog article.
Must be a full article, not a summary."
```
- **Why**: Prevents AI from generating short summaries or incomplete content
- **Result**: Articles consistently reach 1500-2000+ words with comprehensive coverage

#### 2. **Markdown-Only Output**
```
"Output ONLY pure Markdown (no JSON, no frontmatter)."
```
- **Why**: Ensures clean, renderable Markdown without formatting issues
- **Result**: Articles can be directly rendered without parsing errors

#### 3. **Structured Sections**
```
"Follow this structure:
## TL;DR
## Overview (what/why)
## Project Example (with full code)
## Deep Explanation
## Step-by-Step Implementation
## Testing and Validation
## Common Pitfalls
## FAQs
## Conclusion"
```
- **Why**: Ensures consistent, comprehensive article structure
- **Result**: All articles follow the same professional format

#### 4. **SEO META Block Requirement**
```
"Append at the end:
<!--META
title: SEO friendly title (max 60 chars)
description: meta description (max 150 chars)
keywords: {{KEYWORDS}}
-->"
```
- **Why**: Enables SEO optimization and proper metadata extraction
- **Result**: Each article has searchable metadata for better discoverability

#### 5. **Programming Focus Enforcement**
```
"Focus strictly on programming-related content 
(coding, tools, languages, frameworks, AI coding topics)."
```
- **Why**: Keeps content scope relevant and on-topic
- **Result**: All generated articles are programming-focused

#### 6. **Continuation Logic**
- If article is incomplete, automatically continues generation
- Checks for META block and word count
- Ensures articles reach target length

---

## 📸 Screenshots

### Screenshot 1: Generation Page with API Key Connection
*(UI showing the generate page with API key manager, input form, and gradient background)*

### Screenshot 2: Progress Panel During Generation
*(Right-side progress panel showing "Generating article 2 of 10..." with animated indicators)*

### Screenshot 3: Success Animation
*(Confetti animation with "All articles generated successfully!" message and "View Blog" button)*

### Screenshot 4: Blog Listing Page
*(Article cards displayed with images, titles, descriptions, keywords, and delete buttons)*

### Screenshot 5: Full Article View
*(Rendered article with syntax-highlighted code blocks, formatted sections, and footer)*

---

## 🎯 Conclusion

This task successfully demonstrates the ability to integrate AI into real-world products by combining:

- **AI Integration**: Seamless Gemini API integration with prompt engineering
- **Automation**: Independent article generation with continuation logic
- **UI/UX**: Modern, animated interface with real-time progress tracking
- **Full-Stack Development**: Next.js backend + React frontend with file-based storage
- **AI Agent Workflows**: Smart input parsing, sequential generation, and error handling

**Outcome**: A production-ready AI content generation system that transforms programming topics into comprehensive, SEO-optimized blog articles with a polished user experience.

---

## 📞 Contact

**Created by Suyash – AI Engineer**

📧 Email: [kusumkarsuyash1234@gmail.com](mailto:kusumkarsuyash1234@gmail.com)

---

## ⚠️ Notes

- Maximum 10 articles per generation run
- Articles must be programming-related
- Each article targets 1500+ words
- Requires Gemini API key (free tier available)
- All articles stored in `/content/posts/` as Markdown files

---

## 📄 License

This repository is part of the AeroLeads AI Engineer assignment submission.
