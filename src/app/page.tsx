import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ProjectStatus } from '@/types';
import { PROJECT_STATUS_LABELS } from '@/types';
import { IconPlus, IconHome, IconChartBar } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
              <IconChartBar className="h-6 w-6 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Rehab Budget Pro</h1>
              <p className="text-sm text-muted-foreground">Fix & Flip Budget Tracking</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild>
              <Link href="/projects/new">
                <IconPlus className="h-4 w-4" />
                New Project
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
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
          <h2 className="section-header-lg mb-0">Projects</h2>
        </div>

        {!projects || projects.length === 0 ? (
          <div className="empty-state-lg">
            <IconHome className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No projects yet</h3>
            <p className="empty-state-description">
              Create your first project to start tracking your rehab budget.
            </p>
            <Button asChild>
              <Link href="/projects/new">
                <IconPlus className="h-4 w-4" />
                Create Project
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="block"
              >
                <Card className="h-full hover-lift hover:border-accent/50">
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
