import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ProjectTabs } from '@/components/project/project-tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconPencil } from '@tabler/icons-react';
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@/types';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Render the project page for a given project id.
 *
 * Fetches the project and related data (budget items, vendors, draws, cost reference)
 * from Supabase and renders the page header and ProjectTabs populated with that data.
 *
 * @param params - A promise resolving to an object with the route `id` of the project
 * @returns The page's JSX element showing project details and tabs populated with related data
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch project with budget items
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !project) {
    notFound();
  }

  // Fetch budget items for this project
  const { data: budgetItems } = await supabase
    .from('budget_items')
    .select('*')
    .eq('project_id', id)
    .order('category')
    .order('sort_order');

  // Fetch vendors used in this project
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .order('name');

  // Fetch draws for this project
  const { data: draws } = await supabase
    .from('draws')
    .select('*')
    .eq('project_id', id)
    .order('draw_number');

  // Fetch cost reference data
  const { data: costReference } = await supabase
    .from('cost_reference')
    .select('*')
    .order('category')
    .order('item');

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
        <div className="page-shell flex h-14 items-center justify-between">
          <div className="page-header-title">
            <div>
              <h1 className="text-lg font-semibold">{project.name}</h1>
              <p className="text-xs text-muted-foreground">
                {project.address}
                {project.city && `, ${project.city}`}
                {project.state && `, ${project.state}`}
              </p>
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${id}/edit`}>
                <IconPencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
          <Badge variant={getStatusVariant(project.status as ProjectStatus)}>
            {PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="page-shell py-8">
        <div className="page-stack">
          <ProjectTabs
            project={project}
            budgetItems={budgetItems || []}
            vendors={vendors || []}
            draws={draws || []}
            costReference={costReference || []}
          />
        </div>
      </main>
    </div>
  );
}