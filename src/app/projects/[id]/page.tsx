import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ProjectTabs } from '@/components/project/project-tabs';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconHome, IconPencil } from '@tabler/icons-react';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <IconArrowLeft className="h-5 w-5" />
            </Link>
            
            <div className="flex items-center gap-3 flex-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <IconHome className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{project.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {project.address}
                  {project.city && `, ${project.city}`}
                  {project.state && `, ${project.state}`}
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" asChild>
              <Link href={`/projects/${id}/edit`}>
                <IconPencil className="h-4 w-4" />
                Edit
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <ProjectTabs
          project={project}
          budgetItems={budgetItems || []}
          vendors={vendors || []}
          draws={draws || []}
          costReference={costReference || []}
        />
      </main>
    </div>
  );
}
