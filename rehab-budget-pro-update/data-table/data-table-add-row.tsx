'use client'

import { useState } from 'react'
import { IconPlus } from '@tabler/icons-react'
import type { ColumnDef } from '@tanstack/react-table'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableCell, TableRow } from '@/components/ui/table'

interface DataTableAddRowProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  onAdd: (data: Partial<TData>) => void
  placeholder?: string
  defaultValues?: Partial<TData>
  editableColumns?: string[]
}

export function DataTableAddRow<TData>({
  columns,
  onAdd,
  placeholder = 'Add new row...',
  defaultValues = {},
  editableColumns,
}: DataTableAddRowProps<TData>) {
  const [isAdding, setIsAdding] = useState(false)
  const [newRowData, setNewRowData] = useState<Partial<TData>>(defaultValues)

  const handleAdd = () => {
    if (Object.keys(newRowData).length > 0) {
      onAdd(newRowData)
      setNewRowData(defaultValues)
      setIsAdding(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
    if (e.key === 'Escape') {
      setIsAdding(false)
      setNewRowData(defaultValues)
    }
  }

  if (!isAdding) {
    return (
      <TableRow className='hover:bg-muted/30'>
        <TableCell colSpan={columns.length}>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setIsAdding(true)}
            className='w-full justify-start text-muted-foreground hover:text-foreground'
          >
            <IconPlus className='mr-2 size-4' />
            {placeholder}
          </Button>
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow className='bg-muted/30'>
      {columns.map((column, index) => {
        const columnId = 'accessorKey' in column ? (column.accessorKey as string) : column.id
        const isEditable = editableColumns ? editableColumns.includes(columnId || '') : true

        // Skip non-editable columns (like select and actions)
        if (column.id === 'select' || column.id === 'actions') {
          return <TableCell key={index} />
        }

        if (!isEditable) {
          return <TableCell key={index}>—</TableCell>
        }

        return (
          <TableCell key={index}>
            <Input
              autoFocus={index === 0}
              placeholder={columnId || ''}
              value={(newRowData as Record<string, string>)[columnId || ''] || ''}
              onChange={(e) =>
                setNewRowData((prev) => ({
                  ...prev,
                  [columnId || '']: e.target.value,
                }))
              }
              onKeyDown={handleKeyDown}
              className='h-8'
            />
          </TableCell>
        )
      })}
    </TableRow>
  )
}

// Simpler version - just a button that triggers a callback
interface AddRowButtonProps {
  onClick: () => void
  label?: string
  className?: string
}

export function AddRowButton({ onClick, label = 'Add new row', className }: AddRowButtonProps) {
  return (
    <Button
      variant='outline'
      size='sm'
      onClick={onClick}
      className={cn('w-full justify-start border-dashed', className)}
    >
      <IconPlus className='mr-2 size-4' />
      {label}
    </Button>
  )
}
