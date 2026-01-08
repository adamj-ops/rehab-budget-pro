import type { ProjectSummary } from '@/types';
import type { TimelineEvent } from '@/types/dashboard';

/**
 * Transform a project into timeline events
 * Each project can have up to 3 phases: acquisition, rehab, sale
 */
export function projectToTimelineEvents(project: ProjectSummary): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  // Calculate progress percentage
  const progress =
    project.total_items > 0
      ? Math.round((project.completed_items / project.total_items) * 100)
      : 0;

  // Calculate ROI
  const roi =
    project.total_investment > 0
      ? (project.gross_profit / project.total_investment) * 100
      : 0;

  const financials = {
    arv: project.arv || 0,
    budget: project.rehab_budget || 0,
    actual: project.rehab_actual || 0,
    roi,
  };

  // Acquisition phase (contract to close)
  if (project.contract_date || project.close_date) {
    events.push({
      id: `${project.id}-acquisition`,
      projectId: project.id,
      title: project.name,
      address: project.address,
      type: 'acquisition',
      startDate: project.contract_date ? new Date(project.contract_date) : null,
      endDate: project.close_date ? new Date(project.close_date) : null,
      isCompleted: !!project.close_date && new Date(project.close_date) <= new Date(),
      progress: project.close_date ? 100 : 50,
      status: project.status,
      dependencies: [],
      financials,
    });
  }

  // Rehab phase (close to target complete)
  if (
    project.close_date &&
    (project.status === 'in_rehab' ||
      project.status === 'listed' ||
      project.status === 'sold')
  ) {
    const rehabStart = project.rehab_start_date || project.close_date;
    events.push({
      id: `${project.id}-rehab`,
      projectId: project.id,
      title: project.name,
      address: project.address,
      type: 'rehab',
      startDate: rehabStart ? new Date(rehabStart) : null,
      endDate: project.target_complete_date
        ? new Date(project.target_complete_date)
        : null,
      isCompleted: project.status === 'listed' || project.status === 'sold',
      progress,
      status: project.status,
      dependencies: [`${project.id}-acquisition`],
      financials,
    });
  }

  // Sale phase (list to sale)
  if (project.list_date) {
    events.push({
      id: `${project.id}-sale`,
      projectId: project.id,
      title: project.name,
      address: project.address,
      type: 'sale',
      startDate: new Date(project.list_date),
      endDate: project.sale_date ? new Date(project.sale_date) : null,
      isCompleted: project.status === 'sold',
      progress: project.status === 'sold' ? 100 : 50,
      status: project.status,
      dependencies: [`${project.id}-rehab`],
      financials,
    });
  }

  return events;
}

/**
 * Get date range for timeline display
 * Returns min and max dates with some padding
 */
export function getTimelineRange(events: TimelineEvent[]): {
  minDate: Date;
  maxDate: Date;
} {
  const now = new Date();
  let minDate = now;
  let maxDate = now;

  events.forEach((event) => {
    if (event.startDate && event.startDate < minDate) {
      minDate = event.startDate;
    }
    if (event.endDate && event.endDate > maxDate) {
      maxDate = event.endDate;
    }
  });

  // Add padding (1 month before and after)
  const paddedMin = new Date(minDate);
  paddedMin.setMonth(paddedMin.getMonth() - 1);

  const paddedMax = new Date(maxDate);
  paddedMax.setMonth(paddedMax.getMonth() + 2);

  return { minDate: paddedMin, maxDate: paddedMax };
}

/**
 * Generate month labels for timeline header
 */
export function getMonthLabels(
  minDate: Date,
  maxDate: Date
): { date: Date; label: string }[] {
  const labels: { date: Date; label: string }[] = [];
  const current = new Date(minDate.getFullYear(), minDate.getMonth(), 1);

  while (current <= maxDate) {
    labels.push({
      date: new Date(current),
      label: current.toLocaleDateString('en-US', {
        month: 'short',
        year: current.getMonth() === 0 ? 'numeric' : undefined,
      }),
    });
    current.setMonth(current.getMonth() + 1);
  }

  return labels;
}

/**
 * Calculate position and width for a timeline bar
 */
export function calculateBarPosition(
  startDate: Date | null,
  endDate: Date | null,
  minDate: Date,
  maxDate: Date,
  totalWidth: number
): { left: number; width: number } {
  if (!startDate) {
    return { left: 0, width: 0 };
  }

  const totalMs = maxDate.getTime() - minDate.getTime();
  const startMs = startDate.getTime() - minDate.getTime();
  const endMs = (endDate || new Date()).getTime() - minDate.getTime();

  const left = (startMs / totalMs) * totalWidth;
  const width = Math.max(20, ((endMs - startMs) / totalMs) * totalWidth);

  return { left: Math.max(0, left), width };
}

/**
 * Get color for timeline event type
 */
export function getEventColor(type: TimelineEvent['type'], isCompleted: boolean): string {
  if (isCompleted) {
    return 'bg-green-600';
  }

  switch (type) {
    case 'acquisition':
      return 'bg-blue-500';
    case 'rehab':
      return 'bg-amber-500';
    case 'sale':
      return 'bg-purple-500';
    default:
      return 'bg-gray-500';
  }
}
