'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  IconArrowLeft,
  IconLoader2,
  IconTrash,
  IconPin,
  IconPinFilled,
  IconArchive,
  IconArchiveOff,
  IconHome,
  IconCalendar,
  IconPencil,
  IconTag,
  IconDotsVertical,
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RichTextEditor } from '@/components/editor/rich-text-editor';
import {
  useJournalPage,
  useUpdateJournalPage,
  useDeleteJournalPage,
  useToggleJournalPin,
  useToggleJournalArchive,
} from '@/hooks/use-journal';
import { getSupabaseClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import type { Project, JournalPageType } from '@/types';
import { JOURNAL_PAGE_TYPE_CONFIG, JOURNAL_PAGE_TYPES } from '@/types';

// Common emoji icons for pages
const PAGE_ICONS = ['📝', '📋', '💡', '🤝', '🔍', '📸', '⭐', '🎯', '📌', '🏠', '💰', '🔧', '📊', '✅', '❗'];

interface JournalPageDetailProps {
  params: Promise<{ id: string }>;
}

export default function JournalPageDetail({ params }: JournalPageDetailProps) {
  const { id } = use(params);
  const router = useRouter();
  
  // State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [icon, setIcon] = useState('📝');
  const [projectId, setProjectId] = useState<string | null>(null);
  const [pageType, setPageType] = useState<JournalPageType>('note');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>('');

  // Queries and mutations
  const { data: page, isLoading, error } = useJournalPage(id);
  const updatePage = useUpdateJournalPage();
  const deletePage = useDeleteJournalPage();
  const togglePin = useToggleJournalPin();
  const toggleArchive = useToggleJournalArchive();

  // Fetch projects for dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects-for-journal'],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('projects')
        .select('id, project_name, address_full')
        .order('project_name');
      if (error) throw error;
      return data as { id: string; project_name: string; address_full: string | null }[];
    },
  });

  // Initialize state from loaded page
  useEffect(() => {
    if (page) {
      setTitle(page.title || '');
      setContent(page.content || '');
      setIcon(page.icon || '📝');
      setProjectId(page.project_id);
      setPageType(page.page_type);
      lastSavedRef.current = JSON.stringify({
        title: page.title,
        content: page.content,
        icon: page.icon,
        project_id: page.project_id,
        page_type: page.page_type,
      });
    }
  }, [page]);

  // Auto-save function
  const saveChanges = useCallback(async () => {
    if (!page) return;
    
    const currentState = JSON.stringify({
      title,
      content,
      icon,
      project_id: projectId,
      page_type: pageType,
    });

    // Skip if nothing changed
    if (currentState === lastSavedRef.current) {
      setHasUnsavedChanges(false);
      return;
    }

    setIsSaving(true);
    try {
      await updatePage.mutateAsync({
        id: page.id,
        title: title || 'Untitled',
        content,
        icon,
        project_id: projectId,
        page_type: pageType,
      });
      lastSavedRef.current = currentState;
      setHasUnsavedChanges(false);
    } catch {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  }, [page, title, content, icon, projectId, pageType, updatePage]);

  // Debounced auto-save
  const debouncedSave = useCallback(() => {
    setHasUnsavedChanges(true);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveChanges();
    }, 1000);
  }, [saveChanges]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    debouncedSave();
  };

  // Handle content change
  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    debouncedSave();
  };

  // Handle icon change
  const handleIconChange = (newIcon: string) => {
    setIcon(newIcon);
    debouncedSave();
  };

  // Handle project change
  const handleProjectChange = (value: string) => {
    setProjectId(value === 'none' ? null : value);
    debouncedSave();
  };

  // Handle type change
  const handleTypeChange = (value: JournalPageType) => {
    setPageType(value);
    debouncedSave();
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deletePage.mutateAsync(id);
      router.push('/journal');
    } catch {
      // Error handled by mutation
    }
  };

  // Handle pin toggle
  const handleTogglePin = () => {
    if (page) {
      togglePin.mutate({ id: page.id, is_pinned: !page.is_pinned });
    }
  };

  // Handle archive toggle
  const handleToggleArchive = () => {
    if (page) {
      toggleArchive.mutate({ id: page.id, is_archived: !page.is_archived });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="flex items-center justify-center py-12">
          <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error or not found
  if (error || !page) {
    return (
      <div className="container max-w-4xl py-8">
        <div className="text-center py-12">
          <p className="text-destructive mb-4">Page not found</p>
          <Button asChild variant="outline">
            <Link href="/journal">
              <IconArrowLeft className="h-4 w-4 mr-2" />
              Back to Journal
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/journal">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Journal
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          {/* Save indicator */}
          {(isSaving || hasUnsavedChanges) && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {isSaving ? (
                <>
                  <IconLoader2 className="h-3 w-3 animate-spin" />
                  Saving...
                </>
              ) : (
                'Unsaved changes'
              )}
            </span>
          )}

          {/* Actions dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleTogglePin}>
                {page.is_pinned ? (
                  <>
                    <IconPinFilled className="h-4 w-4 mr-2" />
                    Unpin
                  </>
                ) : (
                  <>
                    <IconPin className="h-4 w-4 mr-2" />
                    Pin
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleToggleArchive}>
                {page.is_archived ? (
                  <>
                    <IconArchiveOff className="h-4 w-4 mr-2" />
                    Unarchive
                  </>
                ) : (
                  <>
                    <IconArchive className="h-4 w-4 mr-2" />
                    Archive
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-destructive focus:text-destructive"
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Page content */}
      <div className="space-y-6">
        {/* Icon and Title */}
        <div className="flex items-start gap-3">
          {/* Icon picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="text-4xl hover:bg-muted rounded-lg p-2 transition-colors">
                {icon}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64">
              <div className="grid grid-cols-5 gap-1 p-2">
                {PAGE_ICONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleIconChange(emoji)}
                    className={cn(
                      'text-2xl p-2 rounded-lg hover:bg-muted transition-colors',
                      icon === emoji && 'bg-muted'
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Title input */}
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="text-3xl font-bold border-none shadow-none px-0 h-auto focus-visible:ring-0 placeholder:text-muted-foreground/50"
          />
        </div>

        {/* Metadata block (Notion-style) */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          {/* Project */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              <IconHome className="h-4 w-4" />
              <span>Project</span>
            </div>
            <Select value={projectId || 'none'} onValueChange={handleProjectChange}>
              <SelectTrigger className="flex-1 h-8 bg-background">
                <SelectValue placeholder="None (General)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (General)</SelectItem>
                {projects?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              <IconTag className="h-4 w-4" />
              <span>Type</span>
            </div>
            <Select value={pageType} onValueChange={handleTypeChange}>
              <SelectTrigger className="flex-1 h-8 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JOURNAL_PAGE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <span className="flex items-center gap-2">
                      <span>{JOURNAL_PAGE_TYPE_CONFIG[type].icon}</span>
                      <span>{JOURNAL_PAGE_TYPE_CONFIG[type].label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Created */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              <IconCalendar className="h-4 w-4" />
              <span>Created</span>
            </div>
            <span className="text-sm">
              {format(new Date(page.created_at), 'MMM d, yyyy \'at\' h:mm a')}
            </span>
          </div>

          {/* Modified */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
              <IconPencil className="h-4 w-4" />
              <span>Modified</span>
            </div>
            <span className="text-sm">
              {format(new Date(page.updated_at), 'MMM d, yyyy \'at\' h:mm a')}
            </span>
          </div>
        </div>

        {/* Divider */}
        <hr className="border-border" />

        {/* Rich text editor */}
        <RichTextEditor
          content={content}
          onChange={handleContentChange}
          onBlur={saveChanges}
          placeholder="Start writing..."
          minHeight="400px"
          maxHeight="none"
          className="border-none shadow-none"
        />
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete page?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{page.title || 'Untitled'}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePage.isPending ? (
                <IconLoader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <IconTrash className="h-4 w-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
