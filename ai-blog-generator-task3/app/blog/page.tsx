import Link from 'next/link';
import { getAllPosts } from '@/lib/fsPosts';
import PostCard from '@/components/PostCard';

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">
              {process.env.SITE_NAME || 'Programming Articles'}
            </h1>
            <Link
              href="/generate"
              className="text-white/90 hover:text-white font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
            >
              Generate Articles →
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-4xl font-bold mb-8 text-white">Programming Articles</h2>

        {posts.length === 0 ? (
          <div className="backdrop-blur-xl bg-white/10 rounded-xl shadow-2xl border border-white/20 p-8 text-center">
            <p className="text-white/80 mb-4">No posts yet.</p>
            <Link
              href="/generate"
              className="text-purple-300 hover:text-purple-200 font-medium underline transition-colors"
            >
              Generate your first article
            </Link>
          </div>
        ) : (
          <div>
            {posts.map((post) => (
              <PostCard key={post.slug} {...post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

