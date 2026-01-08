import { TimelineClient } from './timeline-client';
import { getDashboardData } from '@/lib/dashboard-data';

export default async function TimelinePage() {
  const { projects } = await getDashboardData();

  return (
    <div className="page-shell py-8">
      <div className="page-stack">
        <div className="page-header">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Project Timeline</h1>
            <p className="text-sm text-muted-foreground">
              Track milestones and schedules across your portfolio.
            </p>
          </div>
        </div>

        <TimelineClient projects={projects} />
      </div>
    </div>
  );
}
