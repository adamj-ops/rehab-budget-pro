'use client';

import { useRouter } from 'next/navigation';
import { IconPlus, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { useCreateJournalPage } from '@/hooks/use-journal';
import { cn } from '@/lib/utils';

interface NewPageButtonProps {
  projectId?: string | null;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function NewPageButton({
  projectId,
  className,
  variant = 'default',
  size = 'default',
}: NewPageButtonProps) {
  const router = useRouter();
  const createPage = useCreateJournalPage();

  const handleClick = async () => {
    try {
      const newPage = await createPage.mutateAsync({
        title: 'Untitled',
        project_id: projectId,
        icon: '📝',
        page_type: 'note',
      });
      
      // Navigate to the new page for editing
      router.push(`/journal/${newPage.id}`);
    } catch {
      // Error is handled by the mutation
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={createPage.isPending}
      variant={variant}
      size={size}
      className={cn(className)}
    >
      {createPage.isPending ? (
        <IconLoader2 className="h-4 w-4 animate-spin" />
      ) : (
        <IconPlus className="h-4 w-4" />
      )}
      {size !== 'icon' && <span className="ml-2">New Page</span>}
    </Button>
  );
}
