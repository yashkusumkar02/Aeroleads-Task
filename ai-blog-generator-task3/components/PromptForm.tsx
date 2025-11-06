'use client';

import { useState } from 'react';

interface PromptFormProps {
  onSubmit: (data: {
    titles: string[];
    defaults: {
      audience: string;
      style: string;
      length: number;
    };
  }) => Promise<void>;
  isGenerating?: boolean;
  hasApiKey?: boolean;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

export default function PromptForm({ onSubmit, isGenerating = false, hasApiKey = false }: PromptFormProps) {
  const [titles, setTitles] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(1500);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const maxInputWords = 5000; // Limit for input brief

  const wordCount = countWords(titles);
  const exceedsLimit = wordCount > maxInputWords;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (exceedsLimit) {
      // Show clear error notice
      const errorMsg = `Input too long: ${wordCount} words (max: ${maxInputWords} words). Please shorten your briefs.`;
      const textarea = document.getElementById('titles');
      if (textarea) {
        textarea.classList.add('border-red-500');
        setTimeout(() => {
          textarea.classList.remove('border-red-500');
        }, 3000);
      }
      // Note: Toast will be shown by parent component if available
      alert(errorMsg);
      setIsSubmitting(false);
      return;
    }

    // Split by double newlines or lines that look like article separators
    // This allows multi-paragraph briefs per article
    const articleEntries = titles
      .split(/\n\n+/)
      .map(t => t.trim())
      .filter(Boolean);

    if (articleEntries.length === 0) {
      // Show friendly inline nudge
      const textarea = document.getElementById('titles');
      if (textarea) {
        textarea.focus();
        textarea.setAttribute('placeholder', 'Please enter at least one article brief to get started...');
        setTimeout(() => {
          textarea.setAttribute('placeholder', 'Building a REST API with Node.js\n\nThis article should cover REST principles, Express.js setup, routing, middleware, and best practices. Include code examples for each concept.\n\n---\n\nReact Hooks Complete Guide | keywords=react,hooks | length=1800 | audience=beginners | style=tutorial\n\nProvide a comprehensive guide to React Hooks including useState, useEffect, useContext, and custom hooks. Include practical examples and common patterns.\n\n---\n\nTypeScript Best Practices | keywords=typescript,types | length=1500');
        }, 3000);
      }
      setIsSubmitting(false);
      return;
    }

    const maxPosts = 10; // Maximum 10 programming articles per run
    if (articleEntries.length > maxPosts) {
      alert(`Maximum ${maxPosts} posts per run. You entered ${articleEntries.length} articles. Please split into multiple batches.`);
      setIsSubmitting(false);
      return;
    }

    try {
      await onSubmit({
        titles: articleEntries,
        defaults: {
          audience: 'intermediate',
          style: 'tutorial',
          length: targetWordCount,
        },
      });
    } catch (error) {
      console.error('Error submitting:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="titles" className="block text-sm font-semibold text-white/90 mb-3">
          Write topics or paste up to 10 article inputs. Each input may be multi-paragraph and must be related to programming.
        </label>
        <textarea
          id="titles"
          value={titles}
          onChange={(e) => setTitles(e.target.value)}
          placeholder="Building REST APIs with Node.js | keywords=nodejs,api,backend | length=1500&#10;&#10;This article should cover REST principles, Express.js setup, routing, middleware, error handling, and best practices. Include complete working code examples.&#10;&#10;&#10;React Hooks Complete Guide | keywords=react,hooks,frontend | length=1800 | audience=beginners&#10;&#10;Provide a comprehensive guide to React Hooks including useState, useEffect, useContext, custom hooks, and common patterns. Include practical examples.&#10;&#10;&#10;TypeScript Best Practices | keywords=typescript,types,programming | length=1500&#10;&#10;Cover TypeScript fundamentals, advanced types, generics, decorators, and best practices for large-scale applications."
          rows={12}
          className={`w-full px-4 py-3 bg-white/10 backdrop-blur-sm border rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 font-mono text-sm text-white placeholder:text-white/50 transition-all duration-300 shadow-lg ${
            exceedsLimit ? 'border-red-400/50' : 'border-white/20'
          }`}
        />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-white/70">
            Format: Title (optional: | keywords=... | length=... | audience=... | style=...) followed by detailed brief. Each article must be programming-related.
          </p>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${exceedsLimit ? 'text-red-300' : 'text-white/70'}`}>
              {wordCount} / {maxInputWords} words
            </span>
          </div>
        </div>
        {exceedsLimit && (
          <p className="mt-2 text-sm text-red-300">
            Input exceeds maximum length. Please shorten your briefs.
          </p>
        )}
      </div>

      <div>
        <label htmlFor="targetWordCount" className="block text-sm font-semibold text-white/90 mb-3">
          Default Target Word Count per Article
        </label>
        <input
          id="targetWordCount"
          type="number"
          min="500"
          max="5000"
          step="100"
          value={targetWordCount}
          onChange={(e) => setTargetWordCount(parseInt(e.target.value, 10) || 1500)}
          className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-white placeholder:text-white/50 transition-all duration-300 shadow-lg"
        />
        <p className="mt-2 text-sm text-white/70">
          This will be used for articles that don't specify a length. You can override per article using | length=...
        </p>
      </div>

      {!hasApiKey && (
        <div className="backdrop-blur-sm bg-blue-500/20 border border-blue-400/30 rounded-xl p-4 mb-4">
          <p className="text-blue-200 text-sm">
            💡 Tip: Connect your API key above to use your own quota. The system will use the server's key if available.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting || exceedsLimit || isGenerating}
        className="w-full py-4 text-lg font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 text-white relative overflow-hidden"
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          {isSubmitting || isGenerating ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Generating…
            </>
          ) : (
            'Generate Programming Articles'
          )}
        </span>
        {(isSubmitting || isGenerating) && (
          <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></span>
        )}
      </button>
    </form>
  );
}
