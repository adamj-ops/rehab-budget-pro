'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { ProjectStatus } from '@/types'
import { PROJECT_STATUS_LABELS } from '@/types'
import { DataTable, DataTableColumnHeader, DataTableToolbar } from '@/components/data-table'
import { Badge } from '@/components/ui/badge'
import type { ProjectSummary } from '@/types'

interface ProjectsTableProps {
  projects: ProjectSummary[]
}

const getStatusVariant = (status: ProjectStatus) => {
  switch (status) {
    case 'in_rehab': return 'active'
    case 'under_contract': return 'pending'
    case 'sold': return 'success'
    case 'listed': return 'complete'
    default: return 'secondary'
  }
}

export function ProjectsTable({ projects }: ProjectsTableProps) {
  const router = useRouter()

  const columns: ColumnDef<ProjectSummary>[] = [
    {
      accessorKey: 'name',
      size: 250,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Project" />
      ),
      cell: ({ row }) => {
        const project = row.original
        return (
          <div className="flex flex-col gap-0.5">
            <Link
              href={`/projects/${project.id}`}
              className="font-medium hover:text-primary transition-colors"
            >
              {project.name}
            </Link>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {project.address || 'No address'}
              {project.city && `, ${project.city}`}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const status = row.getValue('status') as ProjectStatus
        return (
          <Badge variant={getStatusVariant(status)}>
            {PROJECT_STATUS_LABELS[status]}
          </Badge>
        )
      },
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    {
      accessorKey: 'arv',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ARV" className="justify-end" />
      ),
      cell: ({ row }) => {
        const value = row.getValue('arv') as number
        return (
          <div className="text-right font-medium tabular-nums">
            {formatCurrency(value)}
          </div>
        )
      },
    },
    {
      accessorKey: 'purchase_price',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Purchase" className="justify-end" />
      ),
      cell: ({ row }) => {
        const value = row.getValue('purchase_price') as number
        return (
          <div className="text-right font-medium tabular-nums">
            {formatCurrency(value)}
          </div>
        )
      },
    },
    {
      accessorKey: 'rehab_budget',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Budget" className="justify-end" />
      ),
      cell: ({ row }) => {
        const value = row.getValue('rehab_budget') as number
        return (
          <div className="text-right font-medium tabular-nums">
            {formatCurrency(value)}
          </div>
        )
      },
    },
    {
      id: 'roi',
      size: 100,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="ROI" className="justify-end" />
      ),
      cell: ({ row }) => {
        const project = row.original
        const roi =
          project.total_investment > 0
            ? ((project.gross_profit / project.total_investment) * 100).toFixed(1)
            : '—'
        return (
          <div className="text-right font-medium tabular-nums">
            {roi !== '—' ? `${roi}%` : roi}
          </div>
        )
      },
    },
    {
      accessorKey: 'updated_at',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Updated" />
      ),
      cell: ({ row }) => {
        const value = row.getValue('updated_at') as string
        return (
          <div className="text-sm text-muted-foreground">
            {formatDate(value)}
          </div>
        )
      },
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={projects}
      onRowClick={(row) => {
        router.push(`/projects/${row.original.id}`)
      }}
      toolbar={(table) => (
        <DataTableToolbar
          table={table}
          searchKey="name"
          searchPlaceholder="Search projects..."
        />
      )}
      emptyMessage="No projects found"
    />
  )
}
