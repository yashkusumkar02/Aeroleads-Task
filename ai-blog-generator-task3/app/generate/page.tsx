'use client';

import { useState } from 'react';
import Link from 'next/link';
import PromptForm from '@/components/PromptForm';
import ApiKeyManager from '@/components/ApiKeyManager';
import Confetti from '@/components/Confetti';

interface GenerationStatus {
  title: string;
  status: 'pending' | 'generating' | 'success' | 'failed';
  slug?: string;
  error?: string;
}

export default function GeneratePage() {
  const [result, setResult] = useState<{
    created: string[];
    errors: Array<{ title: string; message: string }>;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<GenerationStatus[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [userApiKey, setUserApiKey] = useState<string | null>(null);

  const handleSubmit = async (data: {
    titles: string[];
    defaults: {
      audience: string;
      style: string;
      length: number;
    };
  }) => {
    setIsGenerating(true);
    setResult(null);
    setShowCompletion(false);

    // First, try smart parsing to understand the input structure
    let articlesToGenerate: Array<{
      title: string;
      brief?: string;
      keywords?: string[];
      length?: number;
      audience?: string;
      style?: string;
    }> = [];

    try {
      // Combine all input into one text for analysis
      const combinedInput = data.titles.join('\n\n');
      
      const parseResponse = await fetch('/api/parse-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: combinedInput,
          defaults: data.defaults,
          apiKey: userApiKey,
        }),
      });

      if (parseResponse.ok) {
        const parseResult = await parseResponse.json();
        if (parseResult.articles && parseResult.articles.length > 0) {
          articlesToGenerate = parseResult.articles;
        }
      }
    } catch (error) {
      console.warn('Smart parsing failed, using fallback:', error);
    }

    // Fallback to original parsing if smart parse didn't work
    if (articlesToGenerate.length === 0) {
      articlesToGenerate = data.titles.map(title => {
        const lines = title.split('\n').map(l => l.trim()).filter(Boolean);
        const firstLine = lines[0] || '';
        const parts = firstLine.split('|').map(p => p.trim());
        const titleText = parts[0];
        
        let keywords: string[] = [];
        let length = data.defaults.length;
        let audience = data.defaults.audience;
        let style = data.defaults.style;

        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];
          if (part.startsWith('keywords=')) {
            keywords = part.replace('keywords=', '').split(',').map(k => k.trim()).filter(Boolean);
          } else if (part.startsWith('length=')) {
            length = parseInt(part.replace('length=', ''), 10) || data.defaults.length;
          } else if (part.startsWith('audience=')) {
            audience = part.replace('audience=', '').trim() || data.defaults.audience;
          } else if (part.startsWith('style=')) {
            style = part.replace('style=', '').trim() || data.defaults.style;
          }
        }

        return {
          title: titleText,
          brief: lines.slice(1).join('\n').trim(),
          keywords,
          length,
          audience,
          style,
        };
      }).filter(a => a.title.length > 0);
    }
    
    // Initialize status for all articles
    const statuses: GenerationStatus[] = articlesToGenerate.map(article => ({
      title: article.title,
      status: 'pending',
    }));
    setGenerationStatus(statuses);

    const created: string[] = [];
    const errors: Array<{ title: string; message: string }> = [];

    // Process each blog independently
    for (let i = 0; i < articlesToGenerate.length; i++) {
      const article = articlesToGenerate[i];
      const titleDisplay = article.title;

      // Update status to generating
      setGenerationStatus(prev => 
        prev.map((s, idx) => idx === i ? { ...s, status: 'generating' } : s)
      );

      // Add delay between requests (except first)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      try {
        // Format the article data for the API
        const articleInput = article.brief 
          ? `${article.title}${article.keywords && article.keywords.length > 0 ? ` | keywords=${article.keywords.join(',')}` : ''} | length=${article.length} | audience=${article.audience} | style=${article.style}\n\n${article.brief}`
          : `${article.title}${article.keywords && article.keywords.length > 0 ? ` | keywords=${article.keywords.join(',')}` : ''} | length=${article.length} | audience=${article.audience} | style=${article.style}`;

        const response = await fetch('/api/generate-single', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: articleInput,
            defaults: {
              audience: article.audience || data.defaults.audience,
              style: article.style || data.defaults.style,
              length: article.length || data.defaults.length,
            },
            apiKey: userApiKey, // Include user's API key if available
          }),
        });

        const resultData = await response.json();

        if (!response.ok || !resultData.success) {
          throw new Error(resultData.error || 'Generation failed');
        }

        created.push(resultData.slug);
        
        // Update status to success
        setGenerationStatus(prev => 
          prev.map((s, idx) => 
            idx === i 
              ? { ...s, status: 'success', slug: resultData.slug } 
              : s
          )
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          title: titleDisplay,
          message: errorMessage,
        });
        
        // Update status to failed
        setGenerationStatus(prev => 
          prev.map((s, idx) => 
            idx === i 
              ? { ...s, status: 'failed', error: errorMessage } 
              : s
          )
        );
      }
    }

    setIsGenerating(false);
    setResult({ created, errors });
    setShowCompletion(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">
              {process.env.NEXT_PUBLIC_SITE_NAME || 'AI Programming Article Generator'}
            </h1>
            <Link
              href="/blog"
              className="text-white/90 hover:text-white font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
            >
              View Blog →
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative">
        <div className="backdrop-blur-xl bg-white/10 p-10 rounded-2xl shadow-2xl border border-white/20 w-full max-w-2xl animate-fade">
          <h2 className="text-4xl font-bold mb-4 text-white text-center tracking-tight">
            Generate Programming Articles
          </h2>
          <p className="text-center text-white/70 mb-8">
            Generate up to 10 full programming articles using AI. Articles are automatically saved under /blog.
          </p>

          <ApiKeyManager onKeySet={setUserApiKey} />
          
          <PromptForm onSubmit={handleSubmit} isGenerating={isGenerating} hasApiKey={!!userApiKey} />

          {/* Progress Display - Right Side */}
          {isGenerating && generationStatus.length > 0 && (
            <div className="fixed right-8 top-1/2 transform -translate-y-1/2 backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm z-40 max-h-[80vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-4">Generation Progress</h3>
              <div className="space-y-3">
                {generationStatus.map((status, index) => (
                  <div
                    key={index}
                    className="backdrop-blur-sm bg-white/5 border border-white/10 rounded-lg p-4"
                  >
                  <div className="flex items-center justify-between">
                    <span className="text-white/90 text-sm">
                      {status.status === 'generating' && (
                        <span className="inline-block animate-pulse">🔄</span>
                      )}
                      {status.status === 'success' && (
                        <span className="inline-block">✅</span>
                      )}
                      {status.status === 'failed' && (
                        <span className="inline-block">❌</span>
                      )}
                      {status.status === 'pending' && (
                        <span className="inline-block">⏳</span>
                      )}
                      <span className="ml-2">
                        {status.status === 'generating' 
                          ? `Generating article ${index + 1} of ${generationStatus.length}...`
                          : status.title
                        }
                      </span>
                    </span>
                    {status.status === 'generating' && (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    )}
                  </div>
                  {status.error && (
                    <p className="text-red-300 text-xs mt-2">{status.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="mt-8 space-y-6">
              {result.created.length > 0 && (
                <div className="backdrop-blur-sm bg-green-500/20 border border-green-400/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-green-300">
                    Created ({result.created.length})
                  </h3>
                  <ul className="space-y-2">
                    {result.created.map((slug) => (
                      <li key={slug}>
                        <Link
                          href={`/blog/${slug}`}
                          className="text-green-200 hover:text-green-100 underline transition-colors"
                        >
                          /blog/{slug}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="backdrop-blur-sm bg-red-500/20 border border-red-400/30 rounded-xl p-6">
                  <h3 className="text-xl font-semibold mb-4 text-red-300">
                    Errors ({result.errors.length})
                  </h3>
                  <ul className="space-y-2">
                    {result.errors.map((error, idx) => (
                      <li key={idx} className="text-red-200">
                        <strong>{error.title}:</strong> {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Completion Animation & CTA */}
          {showCompletion && result && result.created.length > 0 && (
            <>
              <Confetti />
              <div className="mt-8 text-center animate-fade">
                <div className="mb-4">
                  <div className="inline-block text-6xl animate-bounce">🎉</div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  All articles generated successfully!
                </h3>
                <p className="text-white/70 mb-6">
                  {result.created.length} programming article{result.created.length !== 1 ? 's' : ''} saved to /blog
                </p>
                <Link
                  href="/blog"
                  className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(236,72,153,0.6)] hover:scale-105"
                >
                  View Blog →
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
