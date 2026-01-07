# Project Notebook - Rehab Budget Pro

**Purpose:** Ongoing record of useful information, interesting findings, and things to remember.

## Key Learnings

### Three-Column Budget Model
The three-column model is the core differentiator of this application. It helps investors understand:
- **Underwriting accuracy**: How well did we estimate during deal analysis?
- **Forecast accuracy**: Did we stick to our post-walkthrough budget?
- **Execution variance**: How much did actual costs deviate from forecasts?

This is particularly valuable for investors who want to improve their estimation skills over time.

### Google Places Integration
- Uses Google Places Autocomplete API
- Auto-fills city, state, ZIP from address selection
- Custom hook: `use-places-autocomplete.ts`
- Removed redundant form fields (simplified UX)

### Category Auto-Seeding
When a new project is created, it automatically gets:
- 18 pre-defined budget categories
- Default line items for each category
- Proper sort order
- Linked to `budget_category_templates` table

This ensures consistency and saves time during project setup.

## Interesting Patterns

### Inline Editing Pattern
The budget detail tab uses a pattern where:
1. Items display in read-only mode by default
2. Clicking edit icon transforms row to edit mode
3. Optimistic updates via React Query
4. Automatic rollback on error
5. Saves only changed fields

This provides a smooth, responsive editing experience without page reloads.

### Variance Color Coding
- Red: Over budget (positive variance)
- Green: Under budget (negative variance)
- Neutral: On budget (zero variance)

This visual feedback helps users quickly identify budget concerns.

## Architecture Notes

### State Management Choice
Using Zustand + React Query combination:
- **Zustand**: Perfect for simple global state (sidebar, theme)
- **React Query**: Excellent for server state, caching, mutations

This avoids prop drilling and provides automatic caching/refetching.

### Database Views
Using PostgreSQL views for aggregated data:
- Computes sums at database level (faster)
- Single source of truth
- Type-safe with TypeScript interfaces

### File Storage Pattern
Photos stored in Supabase Storage with path structure:
```
project-photos/{project_id}/{line_item_id}/{uuid}.{ext}
```

Metadata stored in `line_item_photos` table for easy querying.

## Dependencies to Note

### Already Installed (Ready to Use)
- `@dnd-kit/*` - Drag and drop (ready for reordering)
- `@react-pdf/renderer` - PDF generation (for exports)
- `react-dropzone` - File uploads (for photos)
- `@tanstack/react-table` - Data tables
- `@tiptap/react` - Rich text editor

These are already in package.json, so no need to install when implementing those features.

## Potential Gotchas

### User ID Currently Null
All inserts currently use `user_id = null` because authentication isn't implemented yet. This will need to be updated when auth is added.

### RLS Policies
RLS is set up in the database but currently allows anonymous access. Once auth is implemented, these policies will need review and testing.

### Generated Columns
PostgreSQL computed columns (variances) are `GENERATED ALWAYS AS ... STORED`. These update automatically when underlying columns change, but can't be directly inserted/updated.

## Useful Commands

### Database
```bash
# Apply migrations
supabase db push

# Reset database (CAUTION: deletes all data)
psql $SUPABASE_CONNECTION_STRING < supabase/reset.sql

# Seed cost reference data
psql $SUPABASE_CONNECTION_STRING < supabase/seed.sql
```

### Development
```bash
# Run dev server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

## Future Considerations

### Performance
- Consider virtualizing the budget table for large projects (100+ line items)
- Use React Query's pagination for projects list
- Implement search/filtering for budget items

### Features to Research
- Real-time collaboration (multiple users editing same project)
- Budget templates that users can customize
- Integration with QuickBooks/Xero for actual spend tracking
- Mobile app (React Native or PWA)

### Analytics Opportunities
- Track estimation accuracy over time
- Identify categories with highest variance
- Vendor performance metrics
- Project profitability trends

## Questions for Future Investigation

1. Should we support multiple currencies?
2. Do we need budget versioning/history?
3. Should line items support sub-items?
4. Do we need project templates beyond category templates?
5. Should photos support geotagging for progress tracking?

