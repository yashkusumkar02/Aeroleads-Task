'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DeleteButtonProps {
  slug: string;
  redirect?: string;
}

export default function DeleteButton({ slug, redirect }: DeleteButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = async () => {
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/delete-post?slug=${slug}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete post');
      }

      if (redirect) {
        router.push(redirect);
      } else {
        router.refresh();
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete post');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-red-300 text-sm">Are you sure?</span>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 disabled:opacity-50"
        >
          {isDeleting ? 'Deleting...' : 'Yes'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="px-3 py-1 bg-white/10 text-white text-sm rounded-lg hover:bg-white/20"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-red-300 hover:text-red-200 font-medium transition-colors px-4 py-2 rounded-lg hover:bg-red-500/20 disabled:opacity-50"
    >
      Delete
    </button>
  );
}
