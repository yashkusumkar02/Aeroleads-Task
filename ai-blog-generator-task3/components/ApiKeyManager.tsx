'use client';

import { useState, useEffect } from 'react';

interface ApiKeyManagerProps {
  onKeySet: (key: string | null) => void;
}

export default function ApiKeyManager({ onKeySet }: ApiKeyManagerProps) {
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(false);

  // Check if API key is already stored
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setIsVerified(true);
      onKeySet(storedKey);
    }
  }, [onKeySet]);

  const handleVerify = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Verification failed');
      }

      // Store the verified key
      localStorage.setItem('gemini_api_key', apiKey);
      setIsVerified(true);
      onKeySet(apiKey);
      setShowInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify API key');
      setIsVerified(false);
      onKeySet(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRemove = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setIsVerified(false);
    onKeySet(null);
    setShowInput(false);
    setError(null);
  };

  if (isVerified && !showInput) {
    return (
      <div className="backdrop-blur-sm bg-green-500/20 border border-green-400/30 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-green-300 font-semibold">API Key Connected</p>
              <p className="text-green-200 text-sm">Using your Gemini API key</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowInput(true)}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors border border-white/20"
            >
              Change Key
            </button>
            <button
              onClick={handleRemove}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm rounded-lg transition-colors border border-red-400/30"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-sm bg-blue-500/20 border border-blue-400/30 rounded-xl p-6 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>🔑</span>
        Connect Your Gemini API Key
      </h3>
      <p className="text-white/70 text-sm mb-4">
        Enter your Gemini 2.5 Flash API key to generate articles. Get your key from{' '}
        <a
          href="https://makersuite.google.com/app/apikey"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-300 hover:text-blue-200 underline"
        >
          Google AI Studio
        </a>
      </p>

      <div className="space-y-3">
        <div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setError(null);
            }}
            placeholder="Enter your Gemini API key"
            className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder:text-white/50 transition-all duration-300 shadow-lg"
            disabled={isVerifying}
          />
          {error && (
            <p className="mt-2 text-red-300 text-sm">{error}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleVerify}
            disabled={isVerifying || !apiKey.trim()}
            className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <span className="flex items-center justify-center gap-2">
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
                Verifying...
              </span>
            ) : (
              'Verify & Connect'
            )}
          </button>
          {showInput && (
            <button
              onClick={() => {
                setShowInput(false);
                setError(null);
              }}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white text-sm rounded-xl transition-colors border border-white/20"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

