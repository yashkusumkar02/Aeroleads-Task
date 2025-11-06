interface ProviderResponse {
  markdown: string;
  wordCount?: number;
  reachedTarget?: boolean;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function hasMetaBlock(text: string): boolean {
  return /<!--META[\s\S]*?-->/.test(text);
}

function isComplete(text: string, targetWordCount: number): boolean {
  const wordCount = countWords(text);
  return wordCount >= targetWordCount * 0.9 && hasMetaBlock(text);
}

export async function generateWithGemini(
  prompt: string,
  apiKey: string,
  targetWordCount: number = 1500
): Promise<ProviderResponse> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  let fullMarkdown = '';
  let conversationHistory: Array<{ role: string; parts: Array<{ text: string }> }> = [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ];
  
  const maxContinuations = 3;
  let continuationAttempts = 0;

  // First generation
  let response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: conversationHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('Gemini: No text in response');
  }

  fullMarkdown = text.trim();
  
  // Add to conversation history
  conversationHistory.push({
    role: 'model',
    parts: [{ text }],
  });

  // Continue if needed
  while (!isComplete(fullMarkdown, targetWordCount) && continuationAttempts < maxContinuations) {
    const currentWordCount = countWords(fullMarkdown);
    const hasMeta = hasMetaBlock(fullMarkdown);
    
    // If we have META block but not enough words, remove it and continue
    if (hasMeta && currentWordCount < targetWordCount * 0.9) {
      const metaMatch = fullMarkdown.match(/([\s\S]*?)(<!--META[\s\S]*?-->)/);
      if (metaMatch) {
        fullMarkdown = metaMatch[1].trim();
      }
    }

    continuationAttempts++;
    
    // Add delay before continuation
    await new Promise(resolve => setTimeout(resolve, 1000));

    const continuationPrompt = hasMeta
      ? `Continue from where you stopped. Do not repeat. Output pure markdown only. Continue the article and ensure it reaches approximately ${targetWordCount} words. End with the META block: <!--META\ntitle: [title]\ndescription: [description]\nkeywords: [keywords]\n-->`
      : `Continue from where you stopped. Do not repeat. Output pure markdown only. Continue until you reach approximately ${targetWordCount} words total, then end with: <!--META\ntitle: [title]\ndescription: [description]\nkeywords: [keywords]\n-->`;

    conversationHistory.push({
      role: 'user',
      parts: [{ text: continuationPrompt }],
    });

    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: conversationHistory,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error: ${error}`);
    }

    const continuationData = await response.json();
    const continuationText = continuationData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!continuationText) {
      break; // No more content, stop trying
    }

    fullMarkdown += '\n\n' + continuationText.trim();
    
    conversationHistory.push({
      role: 'model',
      parts: [{ text: continuationText }],
    });
  }

  // Ensure META block exists
  if (!hasMetaBlock(fullMarkdown)) {
    const titleMatch = fullMarkdown.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Article';
    
    const keywordsMatch = prompt.match(/Focus on:\s*(.+)/);
    const keywords = keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()).join(',') : 'programming';
    
    const descMatch = fullMarkdown.match(/#\s+.+\n\n(.+?)(?:\n\n|$)/);
    const description = descMatch ? descMatch[1].substring(0, 150).trim() : 'A comprehensive programming article';
    
    fullMarkdown += `\n\n<!--META\ntitle: ${title.substring(0, 60)}\ndescription: ${description}\nkeywords: ${keywords}\n-->`;
  }

  const finalWordCount = countWords(fullMarkdown);
  
  return { 
    markdown: fullMarkdown,
    wordCount: finalWordCount,
    reachedTarget: finalWordCount >= targetWordCount * 0.9
  };
}
