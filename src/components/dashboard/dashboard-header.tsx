'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ViewToggle } from './view-toggle';
import { IconPlus } from '@tabler/icons-react';

/**
 * Dashboard header with title, view toggle, and actions
 */
export function DashboardHeader() {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track your portfolio performance at a glance
        </p>
      </div>

      <div className="flex items-center gap-3">
        <ViewToggle />
        <Button asChild>
          <Link href="/projects/new">
            <IconPlus size={18} className="mr-2" />
            New Project
          </Link>
        </Button>
      </div>
    </header>
  );
}
