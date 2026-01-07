'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IconArrowLeft, IconLoader2 } from '@tabler/icons-react';
import { ProjectForm } from '@/components/project/project-form';
import {
  transformFormToDatabase,
  transformDatabaseToForm,
  type ProjectFormValues,
} from '@/lib/validations/project';
import type { Project } from '@/types';

/**
 * Edit Project page component that provides a UI for viewing and editing a single project's details.
 *
 * Displays one of three states: a loading view while the project is fetched, a "not found" view if no project exists for the route ID, or an edit form populated with the project's data. Submits form changes to the backend, shows success/error toasts, and navigates to the project page on successful update.
 *
 * @returns The page's React element containing the header and either the loading spinner, not-found message, or the project edit form.
 */
export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch project data
  useEffect(() => {
    async function fetchProject() {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (error) {
        console.error('Error fetching project:', error);
        toast.error('Failed to load project');
        router.push('/');
      } finally {
        setIsLoading(false);
      }
    }

    if (projectId) {
      fetchProject();
    }
  }, [projectId, router]);

  const handleSubmit = async (values: ProjectFormValues) => {
    if (!project) return;

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();

      // Transform form values for database
      const dbValues = transformFormToDatabase(values);

      // Update project
      const { error } = await supabase
        .from('projects')
        .update(dbValues)
        .eq('id', projectId);

      if (error) throw error;

      toast.success('Project updated successfully!');
      router.push(`/projects/${projectId}`);
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <IconArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Edit Project</h1>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl flex items-center justify-center min-h-[50vh]">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <IconArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Project Not Found</h1>
              <p className="text-sm text-muted-foreground">
                The project you're looking for doesn't exist.
              </p>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Project not found</p>
            <Button asChild>
              <Link href="/">Return to Dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Transform project data to form values
  const defaultValues = transformDatabaseToForm(project);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/projects/${projectId}`}>
                <IconArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Edit Project</h1>
              <p className="text-sm text-muted-foreground">{project.name}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <ProjectForm
          mode="edit"
          defaultValues={defaultValues}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/projects/${projectId}`)}
          isSubmitting={isSubmitting}
          submitLabel="Save Changes"
        />
      </main>
    </div>
  );
}