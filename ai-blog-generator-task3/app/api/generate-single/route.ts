import { NextRequest, NextResponse } from 'next/server';
import { generateWithGemini } from '@/lib/providers';
import { buildPrompt } from '@/lib/promptBuilder';
import { savePost, getExistingSlugs } from '@/lib/fsPosts';
import { slugify, generateUniqueSlug } from '@/lib/slugger';

interface GenerateSingleRequest {
  title: string;
  defaults: {
    audience: string;
    style: string;
    length: number;
  };
}

function parseTitleLine(line: string, defaults: GenerateSingleRequest['defaults']) {
  const lines = line.split('\n').map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || '';
  
  const parts = firstLine.split('|').map(p => p.trim());
  let title = parts[0];
  
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

  const brief = lines.slice(1).join('\n').trim();
  return { title, brief, keywords, length, audience, style };
}

function extractMeta(markdown: string, title: string, keywords: string[]) {
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
    const body: GenerateSingleRequest & { apiKey?: string } = await request.json();
    const { title, defaults, apiKey: userApiKey } = body;

    // Use user's API key if provided, otherwise fall back to server key
    const apiKey = userApiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing API key. Please provide your Gemini API key or configure GEMINI_API_KEY on the server.' },
        { status: 400 }
      );
    }

    const parsed = parseTitleLine(title, defaults);
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
    
    if (!markdown.startsWith('#')) {
      markdown = `# ${parsed.title}\n\n${markdown}`;
    }

    const extractedMeta = extractMeta(markdown, parsed.title, parsed.keywords);
    
    const existingSlugs = await getExistingSlugs();
    const baseSlug = slugify(parsed.title);
    const slug = generateUniqueSlug(baseSlug, existingSlugs);

    // Prepare meta object with all required fields
    const meta = {
      title: parsed.title,
      metaTitle: extractedMeta.metaTitle,
      metaDesc: extractedMeta.metaDesc,
      keywords: extractedMeta.keywords,
    };

    await savePost(slug, markdown, meta, 'gemini');

    return NextResponse.json({ 
      success: true,
      slug,
      wordCount: response.wordCount,
      reachedTarget: response.reachedTarget
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

