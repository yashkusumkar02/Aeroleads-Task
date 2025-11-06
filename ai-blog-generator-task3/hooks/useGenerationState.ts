'use client';

import { useState, useEffect, useCallback } from 'react';
import { GenerationItem, ItemStatus } from '@/components/GenerationStatusPanel';
import { Toast } from '@/components/Toast';

const STORAGE_KEY = 'generation-state';
const STORAGE_TIMEOUT = 1000 * 60 * 30; // 30 minutes

export interface StoredGenerationState {
  items: GenerationItem[];
  timestamp: number;
}

export function useGenerationState() {
  const [items, setItems] = useState<GenerationItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: StoredGenerationState = JSON.parse(stored);
        const age = Date.now() - state.timestamp;
        if (age < STORAGE_TIMEOUT && state.items.length > 0) {
          setItems(state.items);
          // If there are items still in progress, they're probably done
          const hasInProgress = state.items.some(
            (item) => item.status === 'writing' || item.status === 'polishing'
          );
          if (hasInProgress) {
            // Mark all as complete since we're restoring
            setItems((prev) =>
              prev.map((item) =>
                item.status === 'writing' || item.status === 'polishing'
                  ? { ...item, status: 'complete' as ItemStatus, progress: 100 }
                  : item
              )
            );
          }
        }
      }
    } catch (error) {
      console.error('Failed to load generation state:', error);
    }
  }, []);

  // Save state to localStorage whenever items change
  useEffect(() => {
    if (items.length > 0) {
      try {
        const state: StoredGenerationState = {
          items,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save generation state:', error);
      }
    }
  }, [items]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startGeneration = useCallback((titles: string[]) => {
    const newItems: GenerationItem[] = titles.map((title, index) => ({
      id: `item-${Date.now()}-${index}`,
      title,
      status: 'queued' as ItemStatus,
      progress: 0,
    }));

    setItems(newItems);
    setIsGenerating(true);
  }, []);

  const updateItemStatus = useCallback(
    (id: string, updates: Partial<GenerationItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const finishGeneration = useCallback(
    (results: { created: string[]; errors: Array<{ title: string; message: string }> }) => {
      setIsGenerating(false);

      // Update items with results - match by order
      setItems((prev) => {
        const updated = [...prev];
        let createdIdx = 0;
        let errorIdx = 0;

        // First, mark completed items
        for (let i = 0; i < updated.length; i++) {
          if (createdIdx < results.created.length) {
            updated[i] = {
              ...updated[i],
              status: 'complete' as ItemStatus,
              progress: 100,
              slug: results.created[createdIdx++],
            };
          } else if (errorIdx < results.errors.length) {
            const error = results.errors[errorIdx++];
            updated[i] = {
              ...updated[i],
              status: 'failed' as ItemStatus,
              progress: 100,
              error: error.message,
            };
          } else {
            // If we run out of results, mark as failed
            updated[i] = {
              ...updated[i],
              status: 'failed' as ItemStatus,
              progress: 100,
              error: 'Unknown error',
            };
          }
        }

        return updated;
      });

      // Show toast
      const successCount = results.created.length;
      const errorCount = results.errors.length;

      if (errorCount === 0) {
        addToast(`All ${successCount} blog${successCount > 1 ? 's' : ''} generated successfully!`, 'success');
      } else if (successCount > 0) {
        addToast(
          `${successCount} blog${successCount > 1 ? 's' : ''} generated, ${errorCount} failed.`,
          'info'
        );
      } else {
        addToast('Generation failed. Please try again.', 'error');
      }
    },
    [addToast]
  );

  const clearGeneration = useCallback(() => {
    setItems([]);
    setIsGenerating(false);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    items,
    isGenerating,
    toasts,
    addToast,
    removeToast,
    startGeneration,
    updateItemStatus,
    finishGeneration,
    clearGeneration,
  };
}

