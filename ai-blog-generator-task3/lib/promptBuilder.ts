interface PostOptions {
  title: string;
  brief?: string;
  keywords: string[];
  length: number;
  audience: string;
  style: string;
}

export function buildPrompt(options: PostOptions): string {
  const { title, brief, keywords, length, audience, style } = options;
  const keywordsStr = keywords.length > 0 ? keywords.join(', ') : 'programming';

  let prompt = `You are an expert programming educator.
Generate a full-length programming blog article.

Title: ${title}
Description / Context (user may paste multiple paragraphs):
${brief || 'A comprehensive programming article covering best practices, code examples, and practical implementation.'}
Audience: ${audience}
Keywords: ${keywordsStr}
Length: ${length} words

Rules:
- Output ONLY pure Markdown.
- Must be a full article, not a summary.
- Include runnable code examples.
- Focus strictly on programming-related content (coding, tools, languages, frameworks, AI coding topics).
- Follow this structure:

# ${title}

## TL;DR
- 3–5 bullets

## Overview (what/why)

## Project Example (with full code)

## Deep Explanation

## Step-by-Step Implementation

## Testing and Validation

## Common Pitfalls

## FAQs

## Conclusion

Append at the end:
<!--META
title: ${title.substring(0, 60)}
description: [Write a meta description, max 150 chars]
keywords: ${keywordsStr}
-->

Output ONLY the Markdown content, nothing else.`;

  return prompt;
}
