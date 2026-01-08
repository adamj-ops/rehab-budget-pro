'use client';

import { 
  Skeleton, 
  SkeletonDealSummary, 
  SkeletonBudgetTable, 
  SkeletonList,
  SkeletonEntityCard,
  SkeletonStatGrid,
} from '@/components/ui/skeleton';

/**
 * Loading skeleton for the Deal Summary tab
 */
export function DealSummaryLoading() {
  return <SkeletonDealSummary />;
}

/**
 * Loading skeleton for the Budget Detail tab
 */
export function BudgetDetailLoading() {
  return <SkeletonBudgetTable categories={6} itemsPerCategory={2} />;
}

/**
 * Loading skeleton for the Vendors tab
 */
export function VendorsLoading() {
  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <SkeletonStatGrid cards={4} columns={4} />
      
      {/* Filters */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-36" />
      </div>
      
      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonEntityCard key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Loading skeleton for the Draws tab
 */
export function DrawsLoading() {
  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-lg bg-muted">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
      
      {/* Add Draw Button */}
      <div className="flex justify-end">
        <Skeleton className="h-9 w-32" />
      </div>
      
      {/* Draws List */}
      <SkeletonList items={5} />
    </div>
  );
}

/**
 * Loading skeleton for the Cost Reference tab
 */
export function CostReferenceLoading() {
  return (
    <div className="space-y-6">
      {/* Search/Filter */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 flex-1 max-w-md" />
        <Skeleton className="h-10 w-36" />
      </div>
      
      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted">
              <th className="p-3"><Skeleton className="h-4 w-24" /></th>
              <th className="p-3"><Skeleton className="h-4 w-32" /></th>
              <th className="p-3"><Skeleton className="h-4 w-16" /></th>
              <th className="p-3"><Skeleton className="h-4 w-16" /></th>
              <th className="p-3"><Skeleton className="h-4 w-20" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="border-t">
                <td className="p-3"><Skeleton className="h-4 w-28" /></td>
                <td className="p-3"><Skeleton className="h-4 w-48" /></td>
                <td className="p-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                <td className="p-3"><Skeleton className="h-4 w-12 ml-auto" /></td>
                <td className="p-3"><Skeleton className="h-4 w-16" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Generic loading state for project tabs container
 */
export function ProjectTabsLoading() {
  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b pb-4">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-28" />
          ))}
        </div>
      </div>
      
      {/* Tab Content (default to deal summary) */}
      <DealSummaryLoading />
    </div>
  );
}

/**
 * Loading state for inline editing row
 */
export function InlineEditLoading() {
  return (
    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
      <Skeleton className="h-4 w-24 animate-pulse" />
    </div>
  );
}

/**
 * Loading overlay for mutations
 */
export function MutationLoadingOverlay({ message = 'Saving...' }: { message?: string }) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        {message}
      </div>
    </div>
  );
}
