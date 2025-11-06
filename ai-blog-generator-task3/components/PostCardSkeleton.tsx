export default function PostCardSkeleton() {
  return (
    <div className="backdrop-blur-xl bg-white/10 rounded-xl shadow-lg border border-white/20 p-6 mb-4 animate-pulse-subtle">
      <div className="h-7 bg-white/20 rounded w-3/4 mb-3"></div>
      <div className="h-4 bg-white/10 rounded w-full mb-2"></div>
      <div className="h-4 bg-white/10 rounded w-5/6 mb-4"></div>
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-white/10 rounded-full w-20"></div>
        <div className="h-6 bg-white/10 rounded-full w-24"></div>
        <div className="h-6 bg-white/10 rounded-full w-16"></div>
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 bg-white/10 rounded w-24"></div>
        <div className="h-6 bg-white/10 rounded w-16"></div>
      </div>
    </div>
  );
}


