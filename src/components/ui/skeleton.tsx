import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

export function SkeletonText({ className }: SkeletonProps) {
  return <div className={cn('skeleton skeleton-text', className)} />;
}

export function SkeletonCard({ className }: SkeletonProps) {
  return <div className={cn('skeleton skeleton-card', className)} />;
}

// Composite skeleton components for common patterns

export function SkeletonStatCard() {
  return (
    <div className="stat-card-compact">
      <div className="skeleton skeleton-text-lg w-24 mx-auto mb-2" />
      <div className="skeleton skeleton-text-sm w-16 mx-auto" />
    </div>
  );
}

export function SkeletonProjectCard() {
  return (
    <div className="card-grid-item space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="skeleton skeleton-text w-3/4" />
          <div className="skeleton skeleton-text-sm w-1/2" />
        </div>
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="skeleton skeleton-text-sm w-8" />
          <div className="skeleton skeleton-text w-16" />
        </div>
        <div className="space-y-1">
          <div className="skeleton skeleton-text-sm w-12" />
          <div className="skeleton skeleton-text w-16" />
        </div>
      </div>
      <div className="pt-3 border-t">
        <div className="skeleton skeleton-text-sm w-24" />
      </div>
    </div>
  );
}

export function SkeletonVendorCard() {
  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="skeleton skeleton-text w-32" />
          <div className="skeleton skeleton-text-sm w-20" />
        </div>
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton h-4 w-4 rounded" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="skeleton skeleton-text-sm w-24" />
        <div className="skeleton skeleton-text-sm w-28" />
      </div>
      <div className="flex gap-4">
        <div className="skeleton skeleton-text-sm w-16" />
        <div className="skeleton skeleton-text-sm w-16" />
      </div>
      <div className="pt-4 border-t flex justify-between">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton skeleton-text-sm w-20" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 5 }: { columns?: number }) {
  return (
    <tr className="border-t">
      {[...Array(columns)].map((_, i) => (
        <td key={i} className="p-3">
          <div className="skeleton skeleton-text" />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonBudgetRow() {
  return (
    <tr className="border-t">
      <td className="p-3 w-8" />
      <td className="p-3">
        <div className="space-y-1">
          <div className="skeleton skeleton-text w-32" />
          <div className="skeleton skeleton-text-sm w-48" />
        </div>
      </td>
      <td className="p-3"><div className="skeleton skeleton-text w-20 ml-auto" /></td>
      <td className="p-3"><div className="skeleton skeleton-text w-20 ml-auto" /></td>
      <td className="p-3"><div className="skeleton skeleton-text w-20 ml-auto" /></td>
      <td className="p-3"><div className="skeleton skeleton-text w-16 ml-auto" /></td>
      <td className="p-3"><div className="skeleton skeleton-text w-16 ml-auto" /></td>
      <td className="p-3 text-center"><div className="skeleton h-6 w-20 rounded-full mx-auto" /></td>
      <td className="p-3 text-center">
        <div className="flex justify-center gap-1">
          <div className="skeleton h-7 w-7 rounded" />
          <div className="skeleton h-7 w-7 rounded" />
        </div>
      </td>
    </tr>
  );
}
