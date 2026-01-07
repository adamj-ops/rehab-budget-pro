import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ProjectStatus } from '@/types';
import { PROJECT_STATUS_LABELS } from '@/types';
import { IconPlus, IconHome } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function HomePage() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('projects')
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
    <div className="flex-1 overflow-auto">
      {/* Page Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <Button asChild>
            <Link href="/projects/new">
              <IconPlus className="h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">{projects?.length || 0}</p>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Rehab
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-accent tabular-nums">
                {projects?.filter((p) => p.status === 'in_rehab').length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Under Contract
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold tabular-nums">
                {projects?.filter((p) => p.status === 'under_contract').length || 0}
              </p>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sold This Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success tabular-nums">
                {projects?.filter((p) => p.status === 'sold').length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Projects</h2>
        </div>

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
                  <IconPlus className="h-4 w-4" />
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
                <Card className="h-full card-hover hover:border-accent/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {project.address || 'No address'}
                          {project.city && `, ${project.city}`}
                        </p>
                      </div>
                      <Badge variant={getStatusVariant(project.status as ProjectStatus)}>
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
                    </div>

                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      Created {formatDate(project.created_at)}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

