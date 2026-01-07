import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ProjectStatus } from '@/types';
import { PROJECT_STATUS_LABELS } from '@/types';
import { IconPlus, IconHome, IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function ProjectsListPage() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('project_summary')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }

  const getStatusVariant = (status: ProjectStatus) => {
    switch (status) {
      case 'in_rehab': return 'active';
      case 'under_contract': return 'pending';
      case 'sold': return 'success';
      case 'listed': return 'complete';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <IconArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back to Dashboard</span>
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">All Projects</h1>
            <p className="text-sm text-muted-foreground">
              {projects?.length || 0} projects total
            </p>
          </div>
        </div>

        <Button asChild>
          <Link href="/projects/new">
            <IconPlus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Projects Grid */}
      {!projects || projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <IconHome className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Create your first project to start tracking your rehab budget.
            </p>
            <Button asChild>
              <Link href="/projects/new">
                <IconPlus className="h-4 w-4 mr-2" />
                Create Project
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="block"
            >
              <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">{project.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {project.address || 'No address'}
                        {project.city && `, ${project.city}`}
                      </p>
                    </div>
                    <Badge variant={getStatusVariant(project.status as ProjectStatus)} className="ml-2 shrink-0">
                      {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">ARV</p>
                      <p className="font-medium tabular-nums">{formatCurrency(project.arv)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Purchase</p>
                      <p className="font-medium tabular-nums">{formatCurrency(project.purchase_price)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Budget</p>
                      <p className="font-medium tabular-nums">{formatCurrency(project.rehab_budget)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">ROI</p>
                      <p className="font-medium tabular-nums">
                        {project.total_investment > 0
                          ? `${((project.gross_profit / project.total_investment) * 100).toFixed(1)}%`
                          : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                    Updated {formatDate(project.updated_at)}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
