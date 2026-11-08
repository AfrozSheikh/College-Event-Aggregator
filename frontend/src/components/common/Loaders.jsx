import { Skeleton } from '@/components/ui/misc';
import { cn } from '@/lib/utils';

/** Full-screen loader (auth bootstrap, lazy routes). */
export function FullPageLoader({ label = 'Loading' }) {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground flex items-center gap-3 font-serif text-lg italic">
        <span className="border-foreground/20 border-t-foreground size-4 animate-spin rounded-full border-2" />
        {label}…
      </p>
    </div>
  );
}

/** Generic page skeleton: header + figures row + card grid. */
export function PageSkeleton({ stats = 4, cards = 6, className }) {
  return (
    <div className={cn('space-y-8', className)}>
      <div className="space-y-3 border-b pb-6">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      {stats > 0 && (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-9 w-14" />
            </div>
          ))}
        </div>
      )}
      {cards > 0 && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: cards }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border">
              <Skeleton className="h-40 rounded-none" />
              <div className="space-y-2.5 p-4">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/** Skeleton rows for tables / lists. */
export function ListSkeleton({ rows = 5, className }) {
  return (
    <div className={cn('divide-y rounded-lg border', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}
