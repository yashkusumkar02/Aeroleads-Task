# AI Programming Article Generator

Generate up to 10 full programming articles using AI. Articles are automatically saved under /blog.

## Setup

1. Install dependencies:
```bash
npm i
```

2. Copy environment file and configure:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and set:
- `GEMINI_API_KEY` - Your Google Gemini API key (get it from [Google AI Studio](https://makersuite.google.com/app/apikey))

3. Run the development server:
```bash
npm run dev
```

4. Open http://localhost:3000/generate

## Usage

1. Navigate to `/generate`
2. Write topics or paste up to 10 article inputs. Each input may be multi-paragraph and must be related to programming.
   - Optional inline options: `Title | keywords=node,rest | length=1200 | audience=beginners | style=tutorial`
3. Click "Generate Programming Articles"
4. View generated articles at `/blog`

## Notes

- Generate up to 10 full programming articles using AI
- Articles are automatically saved under /blog
- Generated articles are saved to `/content/posts` as Markdown files
- Post metadata is indexed in `/content/posts.json`
- Uses Gemini 2.5 Flash model for article generation
- Only generates programming-related articles (coding, tools, languages, frameworks, AI coding topics)
- Each article follows a structured format with TL;DR, Overview, Code Examples, FAQs, etc.

## Getting a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key and add it to your `.env.local` file

## Project Structure

```
ai-blog-generator-task3/
├── app/
│   ├── api/generate/route.ts    # API endpoint for article generation
│   ├── blog/                     # Blog listing and detail pages
│   ├── generate/                 # Article generation UI
│   └── layout.tsx                # Root layout
├── components/                    # React components
├── lib/                          # Utility functions
│   ├── providers.ts              # Gemini API client
│   ├── promptBuilder.ts          # Prompt construction
│   ├── fsPosts.ts                # File system operations
│   ├── slugger.ts                # Slug generation
│   └── markdown.ts               # Markdown rendering
└── content/                      # Generated content
    ├── posts/                    # Markdown files
    └── posts.json                # Post index
```
