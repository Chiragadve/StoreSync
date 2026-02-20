export default function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="animate-shimmer h-4 w-2/3 rounded mb-3" />
      <div className="animate-shimmer h-3 w-1/2 rounded mb-4" />
      <div className="animate-shimmer h-8 w-1/3 rounded mb-3" />
      <div className="animate-shimmer h-2 w-full rounded" />
    </div>
  );
}
