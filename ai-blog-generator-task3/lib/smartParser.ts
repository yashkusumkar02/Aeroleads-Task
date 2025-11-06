interface ParseResult {
  type: 'template' | 'individual' | 'language_list';
  languages?: string[];
  template?: string;
  userInput?: string;
  articles: Array<{
    title: string;
    brief?: string;
    keywords?: string[];
    length?: number;
    audience?: string;
    style?: string;
  }>;
}

export async function smartParseInput(
  input: string,
  apiKey: string,
  defaults: {
    audience: string;
    style: string;
    length: number;
  }
): Promise<ParseResult> {
  // Use Gemini to analyze the input and extract structure
  const analysisPrompt = `Analyze this user input and determine what the user wants to generate.

User Input:
${input}

Determine:
1. Is this a template/instruction format asking to generate articles for multiple programming languages?
2. Is this a list of individual article titles/briefs?
3. If it's a template, extract the list of programming languages mentioned
4. If it's a template, extract any template instructions or structure requirements

Output JSON only in this exact format:
{
  "type": "template" | "individual" | "language_list",
  "languages": ["Python", "JavaScript", ...] (if type is template or language_list),
  "template": "template instructions if provided",
  "userInput": "any user input/context if provided",
  "articles": [
    {
      "title": "Article title",
      "brief": "brief/description if provided",
      "keywords": ["keyword1", "keyword2"],
      "length": 1500,
      "audience": "intermediate",
      "style": "tutorial"
    }
  ]
}

If type is "template" or "language_list", create one article entry per language in the articles array.
If type is "individual", parse each article as a separate entry.

Be smart: ignore instruction text, meta-commentary, and focus on actual content to generate.
Extract metadata (keywords, length, audience, style) from inline options if present (format: | keywords=... | length=...).`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: analysisPrompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze input');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('No response from analysis');
  }

  // Extract JSON from response (might have markdown code blocks)
  let jsonText = text.trim();
  
  // Remove markdown code blocks if present
  const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    jsonText = jsonMatch[1].trim();
  }

  // Remove any leading/trailing text before/after JSON
  const firstBrace = jsonText.indexOf('{');
  const lastBrace = jsonText.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed: ParseResult = JSON.parse(jsonText);
    
    // Ensure defaults are applied
    parsed.articles = parsed.articles.map(article => ({
      ...article,
      length: article.length || defaults.length,
      audience: article.audience || defaults.audience,
      style: article.style || defaults.style,
      keywords: article.keywords || [],
    }));

    return parsed;
  } catch (error) {
    // Fallback to simple parsing if JSON parse fails
    return fallbackParse(input, defaults);
  }
}

function fallbackParse(
  input: string,
  defaults: {
    audience: string;
    style: string;
    length: number;
  }
): ParseResult {
  // Simple fallback: look for common programming language names
  const commonLanguages = [
    'Python', 'JavaScript', 'Java', 'C#', 'C++', 'Go', 'PHP', 'Swift', 
    'Kotlin', 'Rust', 'TypeScript', 'Ruby', 'Scala', 'R', 'MATLAB',
    'Perl', 'Haskell', 'Clojure', 'Erlang', 'Elixir', 'Dart', 'Lua'
  ];

  const lines = input.split('\n').map(l => l.trim()).filter(Boolean);
  const foundLanguages: string[] = [];
  
  for (const line of lines) {
    for (const lang of commonLanguages) {
      if (line.includes(lang) && !foundLanguages.includes(lang)) {
        foundLanguages.push(lang);
      }
    }
  }

  if (foundLanguages.length > 0) {
    return {
      type: 'language_list',
      languages: foundLanguages,
      articles: foundLanguages.map(lang => ({
        title: `${lang} — Ultimate Guide`,
        keywords: [lang.toLowerCase()],
        length: defaults.length,
        audience: defaults.audience,
        style: defaults.style,
        brief: `Generate a comprehensive guide for ${lang} covering fundamentals, best practices, and practical examples.`,
      })),
    };
  }

  // If no languages found, treat as individual articles
  const articles = input.split(/\n\n+/).map(entry => {
    const lines = entry.split('\n').map(l => l.trim()).filter(Boolean);
    const firstLine = lines[0] || '';
    const parts = firstLine.split('|').map(p => p.trim());
    let title = parts[0];
    
    let keywords: string[] = [];
    let length = defaults.length;
    let audience = defaults.audience;
    let style = defaults.style;

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

    return {
      title,
      brief,
      keywords,
      length,
      audience,
      style,
    };
  }).filter(a => a.title.length > 0);

  return {
    type: 'individual',
    articles,
  };
}

