'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IconArrowLeft } from '@tabler/icons-react';
import { ProjectForm } from '@/components/project/project-form';
import {
  transformFormToDatabase,
  type ProjectFormValues,
} from '@/lib/validations/project';

export default function NewProjectPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: ProjectFormValues) => {
    // Prevent submission while auth is still loading to avoid race conditions
    if (isLoading) {
      toast.error('Please wait for authentication to complete.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();

      // Transform form values for database
      const dbValues = transformFormToDatabase(values);

      // Ensure name is set (use address if not provided)
      const projectData = {
        ...dbValues,
        name: dbValues.name || dbValues.address || 'Untitled Project',
        user_id: user?.id ?? null, // Use authenticated user's ID
      };

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert(projectData)
        .select()
        .single();

      if (projectError) throw projectError;

      // Seed budget categories from templates
      const { data: templates, error: templatesError } = await supabase
        .from('budget_category_templates')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (templatesError) throw templatesError;

      // Create budget items from templates
      const budgetItemsToInsert: Array<{
        project_id: string;
        category: string;
        item: string;
        qty: number;
        unit: string;
        rate: number;
        underwriting_amount: number;
        forecast_amount: number;
        actual_amount: null;
        status: string;
        cost_type: string;
        priority: string;
        sort_order: number;
      }> = [];

      for (const template of templates || []) {
        const lineItems = template.default_line_items as string[] | null;

        if (lineItems && lineItems.length > 0) {
          lineItems.forEach((itemName, index) => {
            budgetItemsToInsert.push({
              project_id: project.id,
              category: template.category,
              item: itemName,
              qty: 1,
              unit: 'ea' as const,
              rate: 0,
              underwriting_amount: 0,
              forecast_amount: 0,
              actual_amount: null,
              status: 'not_started' as const,
              cost_type: 'both' as const,
              priority: 'medium' as const,
              sort_order: template.sort_order * 1000 + index,
            });
          });
        }
      }

      if (budgetItemsToInsert.length > 0) {
        const { error: budgetItemsError } = await supabase
          .from('budget_items')
          .insert(budgetItemsToInsert);

        if (budgetItemsError) {
          console.error('Error seeding budget items:', budgetItemsError);
          // Don't throw - project was created successfully
        }
      }

      toast.success('Project created successfully!');
      router.push(`/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <IconArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-xl font-semibold">New Project</h1>
              <p className="text-sm text-muted-foreground">
                Create a new fix & flip project
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
              <p className="text-sm text-muted-foreground">
                Loading authentication state...
              </p>
            </div>
          </div>
        ) : (
          <ProjectForm
            mode="create"
            onSubmit={handleSubmit}
            onCancel={() => router.push('/')}
            isSubmitting={isSubmitting || isLoading}
            submitLabel="Create Project"
          />
        )}
      </main>
    </div>
  );
}
