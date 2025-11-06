import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/providers';
import { buildPrompt } from '@/lib/promptBuilder';
import { savePost, getExistingSlugs } from '@/lib/fsPosts';
import { slugify, generateUniqueSlug } from '@/lib/slugger';

interface GenerateRequest {
  titles: string[];
  defaults: {
    audience: string;
    style: string;
    length: number;
  };
}

interface ParsedTitle {
  title: string;
  brief: string;
  keywords: string[];
  length: number;
  audience: string;
  style: string;
}

function parseTitleLine(line: string, defaults: GenerateRequest['defaults']): ParsedTitle {
  const lines = line.split('\n').map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || '';
  
  // Parse first line for title and options
  const parts = firstLine.split('|').map(p => p.trim());
  let title = parts[0];
  
  // Use env defaults if not provided in request
  const envDefaults = {
    audience: process.env.DEFAULT_AUDIENCE || defaults.audience,
    style: process.env.DEFAULT_STYLE || defaults.style,
    length: parseInt(process.env.DEFAULT_LENGTH || String(defaults.length), 10),
  };
  
  let keywords: string[] = [];
  let length = envDefaults.length;
  let audience = envDefaults.audience;
  let style = envDefaults.style;

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith('keywords=')) {
      keywords = part.replace('keywords=', '').split(',').map(k => k.trim()).filter(Boolean);
    } else if (part.startsWith('length=')) {
      length = parseInt(part.replace('length=', ''), 10) || defaults.length;
    } else if (part.startsWith('audience=')) {
      audience = part.replace('audience=', '').trim() || defaults.audience;
    } else if (part.startsWith('style=')) {
      style = part.replace('style=', '').trim() || defaults.style;
    }
  }

  // Extract brief from remaining lines
  const brief = lines.slice(1).join('\n').trim();

  return { title, brief, keywords, length, audience, style };
}

function extractMeta(markdown: string, title: string, keywords: string[]): {
  metaTitle: string;
  metaDesc: string;
  keywords: string[];
} {
  const metaMatch = markdown.match(/<!--META\n([\s\S]*?)-->/);
  
  if (metaMatch) {
    const metaContent = metaMatch[1];
    const titleMatch = metaContent.match(/title:\s*(.+)/);
    const descMatch = metaContent.match(/description:\s*(.+)/);
    const keywordsMatch = metaContent.match(/keywords:\s*(.+)/);

    return {
      metaTitle: titleMatch?.[1]?.trim() || title.substring(0, 60),
      metaDesc: descMatch?.[1]?.trim() || '',
      keywords: keywordsMatch?.[1]?.split(',').map(k => k.trim()).filter(Boolean) || keywords,
    };
  }

  // Synthesize meta from content
  const lines = markdown.split('\n').filter(l => l.trim());
  const firstPara = lines.find(l => l.startsWith('#') && !l.startsWith('##')) || '';
  const descStart = markdown.substring(0, 200).replace(/^#.*?\n/, '').replace(/\n/g, ' ').trim();
  const metaDesc = descStart.substring(0, 150) + (descStart.length > 150 ? '...' : '');

  return {
    metaTitle: title.substring(0, 60),
    metaDesc: metaDesc || 'A programming article',
    keywords: keywords.length > 0 ? keywords : ['programming'],
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { titles, defaults } = body;

    // Filter out empty titles before validation
    const validTitles = titles.filter(t => t.trim().length > 0);
    
    const maxPosts = parseInt(process.env.MAX_POSTS_PER_RUN || '10', 10);
    if (validTitles.length > maxPosts) {
      return NextResponse.json(
        { error: `Maximum ${maxPosts} posts per run. You entered ${validTitles.length} titles.` },
        { status: 400 }
      );
    }

    if (validTitles.length === 0) {
      return NextResponse.json(
        { error: 'Please enter at least one article title' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing GEMINI_API_KEY in environment variables' },
        { status: 400 }
      );
    }

    const existingSlugs = await getExistingSlugs();
    const created: string[] = [];
    const errors: Array<{ title: string; message: string }> = [];

    // Process each blog independently
    for (let i = 0; i < validTitles.length; i++) {
      const titleLine = validTitles[i];
      if (!titleLine.trim()) continue;

      // Add delay between requests (except for the first one)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      try {
        const parsed = parseTitleLine(titleLine, defaults);
        const prompt = buildPrompt({
          title: parsed.title,
          brief: parsed.brief,
          keywords: parsed.keywords,
          length: parsed.length,
          audience: parsed.audience,
          style: parsed.style,
        });
        
        const response = await generateWithGemini(prompt, apiKey, parsed.length);
        let markdown = response.markdown.trim();
        
        // Check if target length was reached
        if (!response.reachedTarget && response.wordCount) {
          const shortfall = parsed.length - response.wordCount;
          if (shortfall > parsed.length * 0.1) { // More than 10% short
            errors.push({
              title: parsed.title,
              message: `Article only reached ${response.wordCount} words (target: ${parsed.length} words). Please try again.`,
            });
            continue;
          }
        }

        // Ensure it starts with the title heading
        if (!markdown.startsWith('#')) {
          markdown = `# ${parsed.title}\n\n${markdown}`;
        }

        const extractedMeta = extractMeta(markdown, parsed.title, parsed.keywords);
        
        const baseSlug = slugify(parsed.title);
        const slug = generateUniqueSlug(baseSlug, existingSlugs);
        existingSlugs.push(slug);

        // Prepare meta object with all required fields
        const meta = {
          title: parsed.title,
          metaTitle: extractedMeta.metaTitle,
          metaDesc: extractedMeta.metaDesc,
          keywords: extractedMeta.keywords,
          provider: 'gemini',
        };

        await savePost(slug, markdown, meta, 'gemini');
        created.push(slug);
      } catch (error) {
        errors.push({
          title: titleLine,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json({ created, errors });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
