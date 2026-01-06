'use client'

import { useState, useCallback } from 'react'
import type { ColumnDef } from '@tanstack/react-table'
import { IconTrash, IconPencil, IconPhoto, IconGripVertical } from '@tabler/icons-react'

import {
  DataTable,
  DataTableColumnHeader,
  DataTableToolbar,
  DataTableRowActions,
  EditableCell,
  EditableBadgeCell,
  CurrencyCell,
  AddRowButton,
} from '@/components/data-table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'

// Types
interface BudgetLineItem {
  id: string
  category_id: string
  description: string
  vendor_name: string | null
  underwriting_amount: number
  forecast_amount: number
  actual_amount: number
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  notes: string | null
  sort_order: number
}

// Status options for badge cell
const statusOptions = [
  { label: 'Pending', value: 'pending', variant: 'secondary' as const },
  { label: 'In Progress', value: 'in_progress', variant: 'default' as const, className: 'bg-blue-500' },
  { label: 'Completed', value: 'completed', variant: 'success' as const, className: 'bg-green-500' },
  { label: 'Cancelled', value: 'cancelled', variant: 'destructive' as const },
]

// Props
interface BudgetLineItemsTableProps {
  data: BudgetLineItem[]
  categoryId: string
  onDataChange?: (data: BudgetLineItem[]) => void
  onAddItem?: (item: Partial<BudgetLineItem>) => void
  onDeleteItem?: (id: string) => void
  onSaveItem?: (item: BudgetLineItem, field: string, value: unknown) => Promise<void>
  onViewPhotos?: (item: BudgetLineItem) => void
}

export function BudgetLineItemsTable({
  data,
  categoryId,
  onDataChange,
  onAddItem,
  onDeleteItem,
  onSaveItem,
  onViewPhotos,
}: BudgetLineItemsTableProps) {
  // Define columns
  const columns: ColumnDef<BudgetLineItem>[] = [
    // Selection column
    {
      id: 'select',
      size: 40,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Drag handle (for future dnd-kit integration)
    {
      id: 'drag',
      size: 40,
      header: () => null,
      cell: () => (
        <IconGripVertical className='h-4 w-4 text-muted-foreground cursor-grab' />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    // Description
    {
      accessorKey: 'description',
      size: 200,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Description' />
      ),
      cell: (props) => (
        <EditableCell
          {...props}
          type='text'
          onSave={async (row, columnId, value) => {
            await onSaveItem?.(row, columnId, value)
          }}
        />
      ),
    },
    // Vendor
    {
      accessorKey: 'vendor_name',
      size: 150,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Vendor' />
      ),
      cell: (props) => (
        <EditableCell
          {...props}
          type='text'
          onSave={async (row, columnId, value) => {
            await onSaveItem?.(row, columnId, value)
          }}
        />
      ),
    },
    // Underwriting Amount
    {
      accessorKey: 'underwriting_amount',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Underwriting' className='justify-end' />
      ),
      cell: (props) => (
        <CurrencyCell
          {...props}
          onSave={async (row, columnId, value) => {
            await onSaveItem?.(row, columnId, value)
          }}
        />
      ),
    },
    // Forecast Amount
    {
      accessorKey: 'forecast_amount',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Forecast' className='justify-end' />
      ),
      cell: (props) => (
        <CurrencyCell
          {...props}
          showVariance
          compareValue={props.row.original.underwriting_amount}
          onSave={async (row, columnId, value) => {
            await onSaveItem?.(row, columnId, value)
          }}
        />
      ),
    },
    // Actual Amount
    {
      accessorKey: 'actual_amount',
      size: 120,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Actual' className='justify-end' />
      ),
      cell: (props) => (
        <CurrencyCell
          {...props}
          showVariance
          compareValue={props.row.original.forecast_amount}
          onSave={async (row, columnId, value) => {
            await onSaveItem?.(row, columnId, value)
          }}
        />
      ),
    },
    // Status
    {
      accessorKey: 'status',
      size: 130,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title='Status' />
      ),
      cell: (props) => (
        <EditableBadgeCell
          {...props}
          options={statusOptions}
          onSave={async (row, columnId, value) => {
            await onSaveItem?.(row, columnId, value)
          }}
        />
      ),
      filterFn: (row, id, value) => {
        return value.includes(row.getValue(id))
      },
    },
    // Actions
    {
      id: 'actions',
      size: 50,
      cell: ({ row }) => (
        <DataTableRowActions row={row}>
          <DropdownMenuItem onClick={() => onViewPhotos?.(row.original)}>
            <IconPhoto className='mr-2 h-4 w-4' />
            Photos
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDeleteItem?.(row.original.id)}
            className='text-destructive'
          >
            <IconTrash className='mr-2 h-4 w-4' />
            Delete
          </DropdownMenuItem>
        </DataTableRowActions>
      ),
    },
  ]

  // Handle adding new item
  const handleAddItem = useCallback(() => {
    onAddItem?.({
      category_id: categoryId,
      description: '',
      vendor_name: null,
      underwriting_amount: 0,
      forecast_amount: 0,
      actual_amount: 0,
      status: 'pending',
      notes: null,
    })
  }, [categoryId, onAddItem])

  return (
    <div className='space-y-4'>
      <DataTable
        columns={columns}
        data={data}
        onDataChange={onDataChange}
        showPagination={false}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            searchKey='description'
            searchPlaceholder='Search line items...'
            actionComponent={
              <Button size='sm' onClick={handleAddItem}>
                Add Line Item
              </Button>
            }
          />
        )}
      />
      
      {/* Add row button at bottom */}
      <AddRowButton
        onClick={handleAddItem}
        label='Add line item'
      />
    </div>
  )
}

// Usage example with mock data
export function BudgetLineItemsTableExample() {
  const [data, setData] = useState<BudgetLineItem[]>([
    {
      id: '1',
      category_id: 'kitchen',
      description: 'Cabinet installation',
      vendor_name: 'ABC Cabinets',
      underwriting_amount: 8000,
      forecast_amount: 8500,
      actual_amount: 8200,
      status: 'completed',
      notes: null,
      sort_order: 1,
    },
    {
      id: '2',
      category_id: 'kitchen',
      description: 'Countertop - Quartz',
      vendor_name: 'Stone World',
      underwriting_amount: 4500,
      forecast_amount: 5000,
      actual_amount: 0,
      status: 'in_progress',
      notes: null,
      sort_order: 2,
    },
    {
      id: '3',
      category_id: 'kitchen',
      description: 'Appliance package',
      vendor_name: null,
      underwriting_amount: 3500,
      forecast_amount: 3500,
      actual_amount: 0,
      status: 'pending',
      notes: null,
      sort_order: 3,
    },
  ])

  const handleDataChange = (newData: BudgetLineItem[]) => {
    setData(newData)
    console.log('Data changed:', newData)
  }

  const handleSaveItem = async (item: BudgetLineItem, field: string, value: unknown) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('Saved:', item.id, field, value)
  }

  const handleAddItem = (item: Partial<BudgetLineItem>) => {
    const newItem: BudgetLineItem = {
      id: crypto.randomUUID(),
      category_id: item.category_id || 'kitchen',
      description: item.description || 'New item',
      vendor_name: item.vendor_name || null,
      underwriting_amount: item.underwriting_amount || 0,
      forecast_amount: item.forecast_amount || 0,
      actual_amount: item.actual_amount || 0,
      status: item.status || 'pending',
      notes: item.notes || null,
      sort_order: data.length + 1,
    }
    setData([...data, newItem])
  }

  const handleDeleteItem = (id: string) => {
    setData(data.filter((item) => item.id !== id))
  }

  return (
    <BudgetLineItemsTable
      data={data}
      categoryId='kitchen'
      onDataChange={handleDataChange}
      onSaveItem={handleSaveItem}
      onAddItem={handleAddItem}
      onDeleteItem={handleDeleteItem}
      onViewPhotos={(item) => console.log('View photos:', item)}
    />
  )
}
