import { PipelineClient } from './pipeline-client';
import { getDashboardData } from '@/lib/dashboard-data';

export default async function PipelinePage() {
  const { projects } = await getDashboardData();

  return (
    <div className="page-shell py-4">
      <div className="page-stack">
        <div className="page-header">
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold">Active Pipeline</h1>
            <p className="text-sm text-muted-foreground">
              Manage and prioritize your current deals.
            </p>
          </div>
        </div>

        <PipelineClient projects={projects} />
      </div>
    </div>
  );
}
