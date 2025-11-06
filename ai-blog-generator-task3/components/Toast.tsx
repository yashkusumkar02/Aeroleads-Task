'use client';

import { useEffect, useState } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const bgColor =
    toast.type === 'success'
      ? 'bg-green-500/90 border-green-400'
      : toast.type === 'error'
      ? 'bg-red-500/90 border-red-400'
      : 'bg-blue-500/90 border-blue-400';

  return (
    <div
      className={`${bgColor} backdrop-blur-sm border rounded-lg px-4 py-3 text-white shadow-lg pointer-events-auto animate-slide-in-right min-w-[300px] max-w-[400px]`}
      role="alert"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{toast.message}</p>
        <button
          onClick={() => onRemove(toast.id)}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}



