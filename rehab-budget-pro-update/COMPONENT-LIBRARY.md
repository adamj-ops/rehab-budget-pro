# Rehab Budget Pro - Component Library

## Overview

This component library provides two key systems extracted and adapted from your property-manager codebase:

1. **Data Table System** - Airtable-style CRUD tables with inline editing
2. **Rich Text Editor** - TipTap-based notes/journal system

Both are adapted for:
- Tailwind CSS v4 (CSS-first config)
- Tabler Icons (replacing react-icons)
- shadcn/ui patterns
- TypeScript strict mode

---

## Data Table System

### Location
`src/components/data-table/`

### Components

| Component | Purpose |
|-----------|---------|
| `DataTable` | Main table with sorting, filtering, pagination |
| `DataTableColumnHeader` | Sortable column headers with hide option |
| `DataTableToolbar` | Search, filters, view toggle |
| `DataTablePagination` | Page size selector and navigation |
| `DataTableRowActions` | Dropdown menu for row operations |
| `DataTableBulkActions` | Selection bar with batch operations |
| `DataTableRowExpansion` | Side sheet for row details |
| `EditableCell` | Inline editing (text, number, currency, date, select) |
| `EditableBadgeCell` | Status badges with dropdown |
| `CurrencyCell` | Formatted currency with variance display |
| `AddRowButton` | Button to add new rows |

### Usage Example

```tsx
import {
  DataTable,
  DataTableColumnHeader,
  EditableCell,
  EditableBadgeCell,
  CurrencyCell,
} from '@/components/data-table'

const columns: ColumnDef<LineItem>[] = [
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Description' />
    ),
    cell: (props) => (
      <EditableCell
        {...props}
        type='text'
        onSave={async (row, field, value) => {
          await updateLineItem(row.id, { [field]: value })
        }}
      />
    ),
  },
  {
    accessorKey: 'forecast_amount',
    cell: (props) => (
      <CurrencyCell
        {...props}
        showVariance
        compareValue={props.row.original.underwriting_amount}
      />
    ),
  },
  {
    accessorKey: 'status',
    cell: (props) => (
      <EditableBadgeCell
        {...props}
        options={[
          { label: 'Pending', value: 'pending', variant: 'secondary' },
          { label: 'In Progress', value: 'in_progress', variant: 'default' },
          { label: 'Completed', value: 'completed', variant: 'success' },
        ]}
      />
    ),
  },
]

<DataTable
  columns={columns}
  data={lineItems}
  onDataChange={handleDataChange}
  toolbar={(table) => (
    <DataTableToolbar
      table={table}
      searchKey='description'
      actionComponent={<Button>Add Item</Button>}
    />
  )}
/>
```

### Features

- **Inline Editing**: Click any cell to edit, press Enter to save, Escape to cancel
- **Async Save**: Pass `onSave` for API calls with loading state
- **Currency Formatting**: Automatic USD formatting with variance indicators
- **Status Badges**: Dropdown selection with color-coded badges
- **Column Resize**: Drag column borders to resize
- **Row Selection**: Checkbox selection with bulk actions
- **Sorting**: Click headers to sort ascending/descending
- **Filtering**: Search and faceted filters

---

## Rich Text Editor System

### Location
`src/components/editor/`

### Components

| Component | Purpose |
|-----------|---------|
| `RichTextEditor` | TipTap WYSIWYG editor with toolbar |
| `EditorToolbar` | Formatting buttons (bold, lists, etc.) |
| `JournalNote` | Single note card with edit/delete |
| `JournalList` | Collection of notes with sorting |
| `NewNoteInput` | Input for creating new notes |

### Usage Example

```tsx
import { RichTextEditor, JournalList } from '@/components/editor'

// Simple editor
<RichTextEditor
  content={notes}
  onChange={setNotes}
  placeholder='Add project notes...'
  minHeight='200px'
  maxHeight='400px'
/>

// Full journal system
<JournalList
  entries={journalEntries}
  onAdd={(entry) => createNote(entry)}
  onUpdate={(entry) => updateNote(entry)}
  onDelete={(id) => deleteNote(id)}
  onPin={(id, isPinned) => togglePin(id, isPinned)}
/>
```

### Features

- **Rich Formatting**: Bold, italic, strikethrough, code
- **Headings**: H1, H2, H3 support
- **Lists**: Bullet, numbered, and task lists
- **Links**: Insert and edit hyperlinks
- **Highlight**: Text highlighting
- **Typography**: Smart quotes, ellipsis, etc.
- **Journal Features**: Pin notes, tags, timestamps

---

## Required Dependencies

Add these to your `package.json`:

```json
{
  "dependencies": {
    "@tanstack/react-table": "^8.20.6",
    "@tanstack/react-virtual": "^3.11.3",
    "@radix-ui/react-checkbox": "^1.1.4",
    "@radix-ui/react-toggle": "^1.1.2",
    "@radix-ui/react-popover": "^1.1.4",
    "@radix-ui/react-separator": "^1.1.2",
    "@tiptap/react": "^2.11.5",
    "@tiptap/starter-kit": "^2.11.5",
    "@tiptap/extension-placeholder": "^2.11.5",
    "@tiptap/extension-link": "^2.11.5",
    "@tiptap/extension-task-list": "^2.11.5",
    "@tiptap/extension-task-item": "^2.11.5",
    "@tiptap/extension-highlight": "^2.11.5",
    "@tiptap/extension-typography": "^2.11.5",
    "date-fns": "^4.1.0"
  }
}
```

---

## Required UI Components

These shadcn/ui-style components are included:

- `toggle.tsx` - Toggle button for toolbar
- `sheet.tsx` - Side panel for row expansion
- `label.tsx` - Form labels
- `separator.tsx` - Visual separator
- `popover.tsx` - Link popover
- `table.tsx` - HTML table primitives

---

## File Structure

```
src/components/
├── data-table/
│   ├── index.ts                      # Barrel export
│   ├── data-table.tsx                # Main table component
│   ├── data-table-add-row.tsx        # Add row functionality
│   ├── data-table-bulk-actions.tsx   # Selection bar
│   ├── data-table-column-header.tsx  # Sortable headers
│   ├── data-table-editable-cell.tsx  # Inline editing
│   ├── data-table-pagination.tsx     # Pagination controls
│   ├── data-table-row-actions.tsx    # Row dropdown menu
│   ├── data-table-row-expansion.tsx  # Side panel
│   └── data-table-toolbar.tsx        # Search & filters
├── editor/
│   ├── index.ts                      # Barrel export
│   ├── rich-text-editor.tsx          # TipTap editor
│   ├── editor-toolbar.tsx            # Formatting toolbar
│   └── journal.tsx                   # Notes system
├── ui/
│   ├── toggle.tsx
│   ├── sheet.tsx
│   ├── label.tsx
│   ├── separator.tsx
│   ├── popover.tsx
│   └── table.tsx
└── examples/
    └── budget-line-items-table.tsx   # Full example
```

---

## Integration with Budget Tracking

For the three-column budget model (Underwriting | Forecast | Actual):

```tsx
// Column definitions for budget line items
const budgetColumns = [
  // ... description, vendor columns ...
  {
    accessorKey: 'underwriting_amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Underwriting' />
    ),
    cell: (props) => <CurrencyCell {...props} />,
  },
  {
    accessorKey: 'forecast_amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Forecast' />
    ),
    cell: (props) => (
      <CurrencyCell
        {...props}
        showVariance
        compareValue={props.row.original.underwriting_amount}
      />
    ),
  },
  {
    accessorKey: 'actual_amount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Actual' />
    ),
    cell: (props) => (
      <CurrencyCell
        {...props}
        showVariance
        compareValue={props.row.original.forecast_amount}
      />
    ),
  },
]
```

Variance is displayed as a colored percentage:
- 🟢 Under budget (green/negative variance)
- 🔴 Over budget (red/positive variance)
