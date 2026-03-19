# PRP-007: Shared Components Library

## Context
- PRP-002 scaffold established `src/components/shared/` and `src/components/ui/` directories.
- Existing: shadcn/ui components are already installed (Button, Dialog, Table, etc.) via the Shadcn starter.
- Several shared components are referenced throughout the platform spec but not yet built.
- Source spec: PLATFORM_PRP_1.md §3 structure, repeated references throughout all 6 app specs.

## Goal
Build the reusable shared components that every module app will use. Each component is generic and configurable. Result: a component library that module PRPs can import without re-inventing infrastructure.

## Components to build

### 1. DataTable (`src/components/shared/data-table.tsx`)
Wrapper around TanStack Table + shadcn Table:
- Props: `columns`, `data`, `isLoading`, `emptyState`, `onRowClick?`
- Built-in: column visibility toggle (shadcn DropdownMenu), search filter (input), pagination
- Skeleton rows when `isLoading=true` (using shadcn `Skeleton`)
- Empty state slot: shows passed `emptyState` JSX when data is empty
- Export to CSV button (optional, prop-driven)
- Uses TanStack Table `useReactTable` with `getCoreRowModel`, `getPaginationRowModel`, `getSortedRowModel`, `getFilteredRowModel`

### 2. FileUpload (`src/components/shared/file-upload.tsx`)
Wrapper around react-dropzone + Supabase Storage:
- Props: `bucket`, `path`, `accept`, `maxSizeMB`, `multiple`, `onUpload`
- Drag-and-drop zone with visual feedback
- Progress bar per file
- Preview thumbnails (images) or file icon (other types)
- On drop: uploads to Supabase Storage → calls `onUpload(fileUrl)` on success
- Error state: file too large, wrong type, upload failed
- Displays existing files with delete option

### 3. RichTextEditor (`src/components/shared/rich-text-editor.tsx`)
Wrapper around Tiptap:
- Props: `content`, `onChange`, `placeholder`, `readonly?`
- Toolbar: Bold, Italic, Underline, H1/H2/H3, Bullet list, Ordered list, Blockquote, Link, Image (upload via FileUpload)
- Renders safe HTML when in readonly mode
- Consistent styling via Tailwind Typography plugin (`@tailwindcss/typography`)

### 4. UserPicker (`src/components/shared/user-picker.tsx`)
Combobox (shadcn Command + Popover) for selecting one or multiple users:
- Props: `value`, `onChange`, `multiple?`, `placeholder`, `filter?` (e.g. filter by role/department)
- Searches `users` table by name/email via debounced server action
- Shows avatar + full name + role badge
- Multi-select variant: shows selected users as chips/badges

### 5. DateRangePicker (`src/components/shared/date-range-picker.tsx`)
- Wraps shadcn Calendar (react-day-picker) in a Popover
- Props: `value: { from: Date; to: Date }`, `onChange`, `disabledDates?`
- Shows formatted range in trigger button
- Mobile-friendly: full-width on small screens

### 6. StatusBadge (`src/components/shared/status-badge.tsx`)
- Maps status string → color + label
- Props: `status`, `type` (request | task | ticket | booking | opportunity | candidate)
- Consistent color mapping across all apps

### 7. ConfirmDialog (`src/components/shared/confirm-dialog.tsx`)
- Generic confirmation dialog (shadcn AlertDialog wrapper)
- Props: `open`, `onOpenChange`, `title`, `description`, `onConfirm`, `variant` ('destructive' | 'default')
- Used for all delete/deactivate confirmations platform-wide

### 8. EmptyState (`src/components/shared/empty-state.tsx`)
- Props: `icon`, `title`, `description`, `action?` (button label + onClick)
- Consistent look for all empty lists/tables

### 9. PageHeader (`src/components/shared/page-header.tsx`)
- Props: `title`, `description?`, `actions?` (right-side buttons slot)
- Consistent H1 + subtitle + action button area for all module pages

### 10. SkeletonTable / SkeletonCard (`src/components/shared/skeletons.tsx`)
- Generic loading skeletons for tables (rows of Skeleton cells) and cards
- Props: `rows`, `columns` for table variant

## Validation schemas (shared)
Create `src/lib/validations/common.ts`:
- `dateRangeSchema` — start/end date pair with start ≤ end validation
- `fileSchema` — mime type, size check
- `paginationSchema` — page, pageSize
- `uuidSchema` — UUID format

## Files to create
- `Shadcn/src/components/shared/data-table.tsx`
- `Shadcn/src/components/shared/file-upload.tsx`
- `Shadcn/src/components/shared/rich-text-editor.tsx`
- `Shadcn/src/components/shared/user-picker.tsx`
- `Shadcn/src/components/shared/date-range-picker.tsx`
- `Shadcn/src/components/shared/status-badge.tsx`
- `Shadcn/src/components/shared/confirm-dialog.tsx`
- `Shadcn/src/components/shared/empty-state.tsx`
- `Shadcn/src/components/shared/page-header.tsx`
- `Shadcn/src/components/shared/skeletons.tsx`
- `Shadcn/src/lib/validations/common.ts`

## Validation
- [ ] TypeScript: no errors on all component files
- [ ] Lint: passes
- [ ] DataTable: renders with mock data, search filters rows, pagination works
- [ ] DataTable: shows skeleton when `isLoading=true`; shows EmptyState when data=[]
- [ ] FileUpload: drag-and-drop accepts valid file types; shows error for wrong type
- [ ] RichTextEditor: typing updates `onChange`; toolbar buttons apply formatting
- [ ] UserPicker: typing searches users; selecting adds to value; chip removal works
- [ ] DateRangePicker: selecting start then end populates both; clears correctly
- [ ] All components keyboard-navigable (Tab, Enter, Escape)
- [ ] All components render correctly at 375px mobile width
