import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

/**
 * Skeleton for a table row - matches budget table row structure
 */
function SkeletonTableRow({ columns = 9, className }: { columns?: number; className?: string }) {
  return (
    <tr className={cn("border-t", className)}>
      <td className="p-3 w-12">
        <Skeleton className="h-4 w-4" />
      </td>
      <td className="p-3">
        <div className="space-y-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
      </td>
      {Array.from({ length: columns - 2 }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton className="h-4 w-20 ml-auto" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Skeleton for a complete table with header and rows
 */
function SkeletonTable({ 
  rows = 5, 
  columns = 9,
  showHeader = true,
  className 
}: { 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
  className?: string 
}) {
  return (
    <div className={cn("rounded-lg border overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          {showHeader && (
            <thead>
              <tr className="bg-muted">
                {Array.from({ length: columns }).map((_, i) => (
                  <th key={i} className="p-3">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <SkeletonTableRow key={i} columns={columns} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Skeleton for a stat/metric card
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-6 w-28 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  )
}

/**
 * Skeleton for stat cards grid (like deal summary header)
 */
function SkeletonStatGrid({ 
  cards = 4, 
  columns = 4,
  className 
}: { 
  cards?: number; 
  columns?: number;
  className?: string 
}) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 4 ? "grid-cols-1 md:grid-cols-4" :
      columns === 3 ? "grid-cols-1 md:grid-cols-3" :
      columns === 2 ? "grid-cols-1 md:grid-cols-2" :
      "grid-cols-1",
      className
    )}>
      {Array.from({ length: cards }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for form fields
 */
function SkeletonFormField({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}

/**
 * Skeleton for a complete form
 */
function SkeletonForm({ 
  fields = 4, 
  columns = 2,
  className 
}: { 
  fields?: number; 
  columns?: number;
  className?: string 
}) {
  return (
    <div className={cn(
      "grid gap-4",
      columns === 2 ? "grid-cols-1 md:grid-cols-2" :
      columns === 3 ? "grid-cols-1 md:grid-cols-3" :
      "grid-cols-1",
      className
    )}>
      {Array.from({ length: fields }).map((_, i) => (
        <SkeletonFormField key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for list items
 */
function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-4 border-b last:border-b-0", className)}>
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-16" />
    </div>
  )
}

/**
 * Skeleton for a list of items
 */
function SkeletonList({ 
  items = 5, 
  className 
}: { 
  items?: number; 
  className?: string 
}) {
  return (
    <div className={cn("rounded-lg border divide-y", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton for budget summary bar
 */
function SkeletonBudgetSummary({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-4 gap-6 p-6 rounded-lg bg-muted", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  )
}

/**
 * Skeleton for budget category header row
 */
function SkeletonCategoryRow({ className }: { className?: string }) {
  return (
    <tr className={cn("bg-muted/50", className)}>
      <td className="p-3" colSpan={2}>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-16" />
        </div>
      </td>
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="p-3">
          <Skeleton className="h-4 w-20 ml-auto" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Skeleton for the complete budget table with categories
 */
function SkeletonBudgetTable({ 
  categories = 4, 
  itemsPerCategory = 3,
  className 
}: { 
  categories?: number; 
  itemsPerCategory?: number;
  className?: string 
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Bar */}
      <SkeletonBudgetSummary />
      
      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted">
                <th className="p-3 w-12"><Skeleton className="h-4 w-4" /></th>
                <th className="p-3 min-w-[200px]"><Skeleton className="h-4 w-16" /></th>
                <th className="p-3 w-28"><Skeleton className="h-4 w-24 ml-auto" /></th>
                <th className="p-3 w-28"><Skeleton className="h-4 w-20 ml-auto" /></th>
                <th className="p-3 w-28"><Skeleton className="h-4 w-16 ml-auto" /></th>
                <th className="p-3 w-28"><Skeleton className="h-4 w-24 ml-auto" /></th>
                <th className="p-3 w-28"><Skeleton className="h-4 w-24 ml-auto" /></th>
                <th className="p-3 w-28"><Skeleton className="h-4 w-16 mx-auto" /></th>
                <th className="p-3 w-28"><Skeleton className="h-4 w-16 mx-auto" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: categories }).map((_, catIdx) => (
                <React.Fragment key={catIdx}>
                  <SkeletonCategoryRow />
                  {Array.from({ length: itemsPerCategory }).map((_, rowIdx) => (
                    <SkeletonTableRow key={rowIdx} columns={9} />
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for vendor/draw cards
 */
function SkeletonEntityCard({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
      </div>
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-8 rounded-md" />
        <Skeleton className="h-8 w-8 rounded-md" />
      </div>
    </div>
  )
}

/**
 * Skeleton for deal summary tab
 */
function SkeletonDealSummary({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Property Info + Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <Skeleton className="h-5 w-24" />
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Budget Comparison */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg p-4 bg-muted/30 space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-8 w-28" />
              <div className="pt-3 border-t space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deal Analysis */}
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-3 w-24" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <SkeletonStatGrid cards={4} columns={4} />
    </div>
  )
}

// Need to import React for Fragment
import * as React from 'react'

export { 
  Skeleton,
  SkeletonTableRow,
  SkeletonTable,
  SkeletonCard,
  SkeletonStatGrid,
  SkeletonFormField,
  SkeletonForm,
  SkeletonListItem,
  SkeletonList,
  SkeletonBudgetSummary,
  SkeletonCategoryRow,
  SkeletonBudgetTable,
  SkeletonEntityCard,
  SkeletonDealSummary,
}
