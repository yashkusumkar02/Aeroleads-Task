'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PostCardProps {
  slug: string;
  title: string;
  metaDesc: string;
  keywords: string[];
  createdAt: string;
  provider: string;
}

export default function PostCard({
  slug,
  title,
  metaDesc,
  keywords,
  createdAt,
  provider,
}: PostCardProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const date = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

      // Refresh the page to show updated list
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete post');
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl shadow-lg hover:shadow-2xl border border-white/20 p-6 mb-4 transition-all duration-300 hover:scale-[1.02] hover:border-white/30">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <Link href={`/blog/${slug}`}>
            <h2 className="text-2xl font-bold mb-2 text-white hover:text-purple-300 transition-colors">
              {title}
            </h2>
          </Link>
          <p className="text-white/80 mb-4">{metaDesc}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className={`ml-4 px-3 py-1 text-sm rounded-lg transition-colors ${
            showConfirm
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-white/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 border border-red-400/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isDeleting ? 'Deleting...' : showConfirm ? 'Confirm Delete' : 'Delete'}
        </button>
      </div>
      
      {showConfirm && (
        <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
          <p className="text-red-200 text-sm">Are you sure you want to delete this post?</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleDelete}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Yes, Delete
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1 bg-white/10 text-white text-sm rounded hover:bg-white/20"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {keywords.map((keyword) => (
          <span
            key={keyword}
            className="px-3 py-1 bg-purple-500/30 text-purple-200 text-sm rounded-lg backdrop-blur-sm border border-purple-400/30"
          >
            {keyword}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between text-sm text-white/70">
        <span>{date}</span>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
            {provider}
          </span>
          <Link
            href={`/blog/${slug}`}
            className="px-3 py-1 bg-purple-500/30 text-purple-200 rounded-lg hover:bg-purple-500/40 transition-colors text-sm"
          >
            View full post →
          </Link>
        </div>
      </div>
    </div>
  );
}
