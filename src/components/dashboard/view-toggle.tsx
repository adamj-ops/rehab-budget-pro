'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useDashboardStore } from '@/lib/stores/dashboard-store';
import type { DashboardView } from '@/types/dashboard';
import {
  IconLayoutKanban,
  IconTimeline,
  IconLayoutGrid,
} from '@tabler/icons-react';

const VIEW_OPTIONS: { id: DashboardView; label: string; icon: React.ReactNode }[] = [
  { id: 'kanban', label: 'Kanban', icon: <IconLayoutKanban size={18} /> },
  { id: 'gantt', label: 'Timeline', icon: <IconTimeline size={18} /> },
  { id: 'grid', label: 'Grid', icon: <IconLayoutGrid size={18} /> },
];

/**
 * View toggle for switching between Kanban, Gantt, and Grid views
 */
export function ViewToggle() {
  const { currentView, setCurrentView } = useDashboardStore();

  return (
    <div className="inline-flex rounded-lg border bg-muted p-1">
      {VIEW_OPTIONS.map((option) => (
        <Button
          key={option.id}
          variant="ghost"
          size="sm"
          className={cn(
            'gap-2 px-3',
            currentView === option.id &&
              'bg-background shadow-sm hover:bg-background'
          )}
          onClick={() => setCurrentView(option.id)}
        >
          {option.icon}
          <span className="hidden sm:inline">{option.label}</span>
        </Button>
      ))}
    </div>
  );
}
