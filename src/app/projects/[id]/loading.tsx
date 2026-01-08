import { Skeleton } from '@/components/ui/skeleton';
import { ProjectTabsLoading } from '@/components/project/tabs/loading-states';

export default function ProjectLoading() {
  return (
    <div className="flex-1 overflow-auto">
      {/* Page Header Skeleton */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-64" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <ProjectTabsLoading />
      </main>
    </div>
  );
}
