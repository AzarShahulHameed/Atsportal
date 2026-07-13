// Shimmer placeholder blocks — used in place of plain "Loading…" text so a
// data fetch shows the SHAPE of what's coming, not a blank pause.
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-gradient-to-r from-lineSoft via-white/80 to-lineSoft bg-[length:200%_100%] ${className}`}
         style={{ animation: 'beacon-shimmer 1.6s ease-in-out infinite' }} />
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-lineSoft last:border-b-0">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24 ml-auto" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel rounded-2xl px-5 py-4">
          <Skeleton className="h-3 w-20 mb-2.5" />
          <Skeleton className="h-7 w-12" />
        </div>
      ))}
    </div>
  );
}
