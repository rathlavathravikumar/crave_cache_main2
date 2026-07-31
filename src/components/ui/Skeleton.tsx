import React from 'react';
import { cn } from './cn';

/**
 * Loading placeholder. Prefer these over a bare spinner for content that has a
 * known shape — the layout stops jumping when real data lands.
 */
export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('skeleton rounded-md', className)} aria-hidden="true" />
);

/** Text block placeholder; the last line is short, as real paragraphs are. */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className,
}) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/5' : 'w-full')} />
    ))}
  </div>
);

/** Mirrors the food/restaurant card footprint so grids don't reflow. */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      'overflow-hidden rounded-card border border-surface-line bg-white shadow-card',
      className
    )}
  >
    <Skeleton className="h-40 w-full rounded-none" />
    <div className="space-y-3 p-4">
      <Skeleton className="h-4 w-3/5" />
      <SkeletonText lines={2} />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-20 rounded-control" />
      </div>
    </div>
  </div>
);

/** Table placeholder that keeps column rhythm while rows load. */
export const SkeletonTableRows: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 4,
}) => (
  <>
    {Array.from({ length: rows }).map((_, r) => (
      <tr key={r} className="border-b border-surface-line last:border-0">
        {Array.from({ length: columns }).map((__, c) => (
          <td key={c} className="px-4 py-3.5">
            <Skeleton className={cn('h-3', c === 0 ? 'w-40' : 'w-20')} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export const SkeletonStatTile: React.FC = () => (
  <div className="rounded-card border border-surface-line bg-white p-5 shadow-card">
    <Skeleton className="h-3 w-24" />
    <Skeleton className="mt-3 h-7 w-20" />
    <Skeleton className="mt-3 h-3 w-16" />
  </div>
);
