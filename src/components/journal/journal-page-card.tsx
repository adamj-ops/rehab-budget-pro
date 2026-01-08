'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { IconPin, IconPinFilled, IconHome } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import type { JournalPageWithProject } from '@/types';
import { JOURNAL_PAGE_TYPE_CONFIG } from '@/types';
import { useToggleJournalPin } from '@/hooks/use-journal';

interface JournalPageCardProps {
  page: JournalPageWithProject;
  className?: string;
}

export function JournalPageCard({ page, className }: JournalPageCardProps) {
  const togglePin = useToggleJournalPin();
  const typeConfig = JOURNAL_PAGE_TYPE_CONFIG[page.page_type];
  
  // Extract plain text preview from HTML content
  const getPreview = (html: string | null): string => {
    if (!html) return '';
    // Strip HTML tags for preview
    const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePin.mutate({ id: page.id, is_pinned: !page.is_pinned });
  };

  return (
    <Link
      href={`/journal/${page.id}`}
      className={cn(
        'block rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30',
        page.is_pinned && 'border-primary/40 bg-primary/5',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Title with icon */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{page.icon || typeConfig.icon}</span>
            <h3 className="font-medium truncate">
              {page.title || 'Untitled'}
            </h3>
          </div>
          
          {/* Project tag */}
          {page.project && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <IconHome className="h-3 w-3" />
              <span className="truncate">{page.project.project_name}</span>
            </div>
          )}
          
          {/* Content preview */}
          {page.content && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {getPreview(page.content)}
            </p>
          )}
          
          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className={cn('flex items-center gap-1', typeConfig.color)}>
              {typeConfig.label}
            </span>
            <span>·</span>
            <span>
              {formatDistanceToNow(new Date(page.updated_at), { addSuffix: true })}
            </span>
          </div>
        </div>
        
        {/* Pin button */}
        <button
          type="button"
          onClick={handlePinClick}
          className={cn(
            'p-1.5 rounded-md transition-colors',
            page.is_pinned
              ? 'text-primary hover:bg-primary/10'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
          aria-label={page.is_pinned ? 'Unpin page' : 'Pin page'}
        >
          {page.is_pinned ? (
            <IconPinFilled className="h-4 w-4" />
          ) : (
            <IconPin className="h-4 w-4" />
          )}
        </button>
      </div>
    </Link>
  );
}

// Skeleton loader for the card
export function JournalPageCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-6 w-6 rounded bg-muted" />
            <div className="h-5 w-32 rounded bg-muted" />
          </div>
          <div className="h-4 w-24 rounded bg-muted mb-2" />
          <div className="space-y-1.5">
            <div className="h-4 w-full rounded bg-muted" />
            <div className="h-4 w-3/4 rounded bg-muted" />
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="h-3 w-16 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
        </div>
        <div className="h-8 w-8 rounded bg-muted" />
      </div>
    </div>
  );
}
