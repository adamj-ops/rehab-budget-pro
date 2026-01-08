import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { IconPlus, IconHome, IconArrowLeft } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ProjectsTable } from '@/components/project/projects-table';

export default async function ProjectsListPage() {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from('project_summary')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching projects:', error);
  }

  return (
    <div className="page-shell py-8">
      <div className="page-stack">
        <div className="page-header">
          <div className="page-header-title">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <IconArrowLeft className="h-5 w-5" />
                <span className="sr-only">Back to Dashboard</span>
              </Link>
            </Button>
            <div className="space-y-2">
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
          <ProjectsTable projects={projects} />
        )}
      </div>
    </div>
  );
}
