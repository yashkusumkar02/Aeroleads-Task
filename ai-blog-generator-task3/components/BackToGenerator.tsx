import Link from 'next/link';

export default function BackToGenerator() {
  return (
    <Link
      href="/generate"
      className="text-white/90 hover:text-white font-medium transition-colors px-4 py-2 rounded-lg hover:bg-white/10"
    >
      Generate →
    </Link>
  );
}
