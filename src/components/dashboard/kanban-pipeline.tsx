'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getSupabaseClient } from '@/lib/supabase/client';
import { cn, formatCurrency } from '@/lib/utils';
import type { ProjectStatus } from '@/types';
import { PROJECT_STATUS_LABELS } from '@/types';
import { ProjectCard, SortableProjectCard, type ProjectCardData } from './project-card';
import { Input } from '@/components/ui/input';
import {
  IconSearch,
  IconFilter,
  IconSortAscending,
  IconPlus,
} from '@tabler/icons-react';
import Link from 'next/link';

interface KanbanPipelineProps {
  projects: ProjectCardData[];
}

type ColumnId = 'lead' | 'analyzing' | 'under_contract' | 'in_rehab' | 'listed';

interface Column {
  id: ColumnId;
  title: string;
  statuses: ProjectStatus[];
}

const COLUMNS: Column[] = [
  { id: 'lead', title: 'Leads', statuses: ['lead'] },
  { id: 'analyzing', title: 'Analyzing', statuses: ['analyzing'] },
  { id: 'under_contract', title: 'Under Contract', statuses: ['under_contract'] },
  { id: 'in_rehab', title: 'In Rehab', statuses: ['in_rehab'] },
  { id: 'listed', title: 'Listed', statuses: ['listed'] },
];

function KanbanColumn({
  column,
  projects,
  totalValue,
}: {
  column: Column;
  projects: ProjectCardData[];
  totalValue: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col min-w-[300px] max-w-[350px]">
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{column.title}</h3>
          <span className="text-sm text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {projects.length}
          </span>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatCurrency(totalValue)}
        </span>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-lg border-2 border-dashed p-3 space-y-3 min-h-[400px] transition-colors',
          isOver ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/30'
        )}
      >
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {projects.map((project) => (
            <SortableProjectCard key={project.id} project={project} />
          ))}
        </SortableContext>

        {projects.length === 0 && (
          <div className="h-full flex items-center justify-center">
            <p className="text-sm text-muted-foreground">No projects</p>
          </div>
        )}
      </div>

      {/* Add New (for Leads column) */}
      {column.id === 'lead' && (
        <Link
          href="/projects/new"
          className="mt-3 flex items-center justify-center gap-2 p-2 rounded-lg border border-dashed text-sm text-muted-foreground hover:text-primary hover:border-primary transition-colors"
        >
          <IconPlus className="h-4 w-4" />
          Add Lead
        </Link>
      )}
    </div>
  );
}

export function KanbanPipeline({ projects }: KanbanPipelineProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter projects by search
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  // Group projects by column
  const projectsByColumn = useMemo(() => {
    const grouped: Record<ColumnId, ProjectCardData[]> = {
      lead: [],
      analyzing: [],
      under_contract: [],
      in_rehab: [],
      listed: [],
    };

    filteredProjects.forEach((project) => {
      const column = COLUMNS.find((c) => c.statuses.includes(project.status));
      if (column) {
        grouped[column.id].push(project);
      }
    });

    return grouped;
  }, [filteredProjects]);

  // Calculate column totals (ARV)
  const columnTotals = useMemo(() => {
    const totals: Record<ColumnId, number> = {
      lead: 0,
      analyzing: 0,
      under_contract: 0,
      in_rehab: 0,
      listed: 0,
    };

    Object.entries(projectsByColumn).forEach(([columnId, projects]) => {
      totals[columnId as ColumnId] = projects.reduce((sum, p) => sum + (p.arv || 0), 0);
    });

    return totals;
  }, [projectsByColumn]);

  // Update project status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ projectId, newStatus }: { projectId: string; newStatus: ProjectStatus }) => {
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project status updated');
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast.error('Failed to update project status');
    },
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const projectId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetColumn = COLUMNS.find((c) => c.id === overId);
    if (targetColumn) {
      const project = projects.find((p) => p.id === projectId);
      if (project && !targetColumn.statuses.includes(project.status)) {
        // Update status to the first status in the target column
        updateStatusMutation.mutate({
          projectId,
          newStatus: targetColumn.statuses[0],
        });
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const projectId = active.id as string;
    const overId = over.id as string;

    // Find which column the over item belongs to
    const overColumn = COLUMNS.find((c) => c.id === overId);
    if (!overColumn) {
      // Check if over is a project card and find its column
      const overProject = projects.find((p) => p.id === overId);
      if (overProject) {
        const targetColumn = COLUMNS.find((c) => c.statuses.includes(overProject.status));
        if (targetColumn) {
          const activeProject = projects.find((p) => p.id === projectId);
          if (activeProject && !targetColumn.statuses.includes(activeProject.status)) {
            // Moving to a different column - will be handled in dragEnd
          }
        }
      }
    }
  };

  const activeProject = activeId ? projects.find((p) => p.id === activeId) : null;

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-semibold">Active Pipeline</h2>

        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
        >
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                projects={projectsByColumn[column.id]}
                totalValue={columnTotals[column.id]}
              />
            ))}
          </div>

          <DragOverlay>
            {activeProject && (
              <div className="rotate-3">
                <ProjectCard project={activeProject} isDragging showDragHandle={false} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </section>
  );
}
