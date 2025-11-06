'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Confetti from './Confetti';

export type ItemStatus = 'queued' | 'writing' | 'polishing' | 'complete' | 'failed';

export interface GenerationItem {
  id: string;
  title: string;
  status: ItemStatus;
  progress: number; // 0-100
  slug?: string;
  error?: string;
}

interface GenerationStatusPanelProps {
  items: GenerationItem[];
  isOpen: boolean;
  onClose: () => void;
  onGenerateMore: () => void;
}

export default function GenerationStatusPanel({
  items,
  isOpen,
  onClose,
  onGenerateMore,
}: GenerationStatusPanelProps) {
  const router = useRouter();
  const [showCelebration, setShowCelebration] = useState(false);

  const allComplete = items.length > 0 && items.every((item) => item.status === 'complete' || item.status === 'failed');
  const hasFailures = items.some((item) => item.status === 'failed');
  const completedCount = items.filter((item) => item.status === 'complete').length;
  const totalCount = items.length;

  const globalProgress =
    totalCount > 0
      ? items.reduce((sum, item) => sum + item.progress, 0) / totalCount
      : 0;

  useEffect(() => {
    if (allComplete && !hasFailures && completedCount > 0 && !showCelebration) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2000);
    }
  }, [allComplete, hasFailures, completedCount, showCelebration]);

  if (!isOpen) return null;

  const statusLabels: Record<ItemStatus, string> = {
    queued: 'Queued',
    writing: 'Writing',
    polishing: 'Polishing',
    complete: 'Complete',
    failed: 'Failed',
  };

  const statusColors: Record<ItemStatus, string> = {
    queued: 'text-gray-400',
    writing: 'text-blue-400',
    polishing: 'text-purple-400',
    complete: 'text-green-400',
    failed: 'text-red-400',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white/10 backdrop-blur-xl border-l border-white/20 shadow-2xl z-50 transform transition-transform duration-300 ease-out overflow-hidden flex flex-col"
        style={{
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
        role="dialog"
        aria-labelledby="status-panel-title"
        aria-live="polite"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between">
          <div>
            <h2 id="status-panel-title" className="text-2xl font-bold text-white">
              {allComplete ? (
                <span className="flex items-center gap-2">
                  {showCelebration && (
                    <span className="animate-bounce" aria-label="Celebration">🎉</span>
                  )}
                  Done!
                </span>
              ) : (
                'Generating your blogs…'
              )}
            </h2>
            {!allComplete && (
              <p className="text-white/70 text-sm mt-1" aria-live="polite">
                {completedCount} of {totalCount} complete
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white transition-colors text-2xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10"
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        {/* Global Progress Bar */}
        <div className="px-6 pt-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-white/80">Overall Progress</span>
            <span className="text-white/60">{Math.round(globalProgress)}%</span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${globalProgress}%` }}
            />
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" aria-live="polite" aria-atomic="false">
          {items.map((item, index) => (
            <GenerationItemCard
              key={item.id}
              item={item}
              index={index}
              statusLabels={statusLabels}
              statusColors={statusColors}
              router={router}
            />
          ))}
        </div>

        {/* Footer Actions */}
        {allComplete && (
          <div className="p-6 border-t border-white/20 space-y-3">
            <Link
              href="/blog"
              className="block w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-semibold text-center transition-all duration-300 hover:scale-[1.02]"
            >
              View Posts
            </Link>
            <button
              onClick={onGenerateMore}
              className="block w-full py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-colors"
            >
              Generate More
            </button>
          </div>
        )}
      </div>

      {/* Celebration Animation */}
      {showCelebration && (
        <>
          <Confetti show={showCelebration} />
          <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            <div className="text-6xl animate-scale-in">
              <span className="inline-block animate-bounce" style={{ animationDelay: '0ms' }}>
                ✓
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function GenerationItemCard({
  item,
  index,
  statusLabels,
  statusColors,
  router,
}: {
  item: GenerationItem;
  index: number;
  statusLabels: Record<ItemStatus, string>;
  statusColors: Record<ItemStatus, string>;
  router: ReturnType<typeof useRouter>;
}) {
  const isLoading = item.status === 'writing' || item.status === 'polishing' || item.status === 'queued';

  return (
    <div
      className="backdrop-blur-sm bg-white/5 rounded-lg p-4 border border-white/10"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-semibold text-sm flex-1 line-clamp-2">
          {item.title}
        </h3>
        <span className={`text-xs font-medium ml-2 ${statusColors[item.status]}`}>
          {statusLabels[item.status]}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            item.status === 'complete'
              ? 'bg-green-500'
              : item.status === 'failed'
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-blue-500 to-purple-500'
          }`}
          style={{ width: `${item.progress}%` }}
        />
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-white/60 text-xs">
          <div className="flex gap-1">
            <span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-current rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
          </div>
          <span>{item.status === 'writing' ? 'Writing content...' : 'Polishing article...'}</span>
        </div>
      )}

      {/* Error Message */}
      {item.status === 'failed' && item.error && (
        <p className="text-red-300 text-xs mt-2">{item.error}</p>
      )}

      {/* See Blog Button */}
      {item.status === 'complete' && item.slug && (
        <button
          onClick={() => router.push(`/blog/${item.slug}`)}
          className="mt-3 w-full py-2 px-3 bg-purple-600/50 hover:bg-purple-600/70 text-white rounded-lg text-sm font-medium transition-colors"
        >
          See blog →
        </button>
      )}
    </div>
  );
}

