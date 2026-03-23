# Quickstart: TuskDue Recurring Tasks

**Feature**: 002-tuskdue-recurring-tasks
**Date**: 2026-03-22

## Prerequisites

- Existing ActuallyDo-notification-frontend project set up (see `specs/001-notification-platform-ui/quickstart.md`)
- Node.js 20+, npm 10+
- No new dependencies required — all needed packages are already installed

## What This Feature Adds

- Recurrence configuration UI in the add task form and task detail view
- Recurrence indicator (repeat icon) on task cards
- Enhanced completion toast showing next occurrence due date
- Delete confirmation dialog with recurrence-aware options
- MSW mock handlers for recurrence API endpoints

## Development

```bash
# Start dev server with API mocking (recommended — backend recurrence not yet implemented)
npm run dev:mock

# Or start normally (requires backend with recurrence support)
npm run dev
```

## Files Modified

### Types and Schemas
- `src/lib/types.ts` — Added `RecurrenceRule`, `RecurrenceEndCondition`, extended `Task`, `CreateTaskRequest`, `UpdateTaskRequest`
- `src/lib/schemas.ts` — Added `recurrenceRuleSchema`, `recurrenceEndConditionSchema`

### API Layer
- `src/api/tuskdue.ts` — Updated `createTask`, `updateTask`, `deleteTask` signatures for recurrence fields

### Components
- `src/components/tasks/RecurrenceConfig.tsx` — NEW: frequency/interval/end condition form section
- `src/components/tasks/DeleteTaskDialog.tsx` — NEW: recurring task delete options dialog
- `src/components/tasks/AddTaskForm.tsx` — Extended: shows RecurrenceConfig when due date is set
- `src/components/tasks/TaskCard.tsx` — Extended: shows Repeat icon for recurring tasks
- `src/components/tasks/TaskDetail.tsx` — Extended: shows RecurrenceConfig for editing recurrence

### Hooks
- `src/hooks/use-tasks.ts` — Updated: `useCompleteTask` handles `next_occurrence` in toast, `useDeleteTask` accepts `stop_recurrence` param

### Pages
- `src/pages/tuskdue/DashboardPage.tsx` — Updated: passes recurrence data through to forms and handles delete dialog

### Utilities
- `src/lib/utils.ts` — Added `getRecurrenceLabel()` display helper

### Mocks
- `src/mocks/handlers.ts` — NEW: MSW handlers for all TuskDue task endpoints with recurrence support
- `src/mocks/browser.ts` — NEW: MSW browser setup

## Verification Checklist

After implementation, verify each of these works:

1. **Create recurring task**: Open add task form → set due date → "Repeat" toggle appears → enable it → select "Monthly" → submit → task appears with repeat icon
2. **Create with custom interval**: Enable recurrence → select frequency → change interval to 2 → verify label shows "Every 2 weeks"
3. **Create with end condition**: Enable recurrence → set end condition to "Until date" → pick a date → submit → verify task card shows repeat icon
4. **Backlog exclusion**: Open add task form → leave due date empty → verify recurrence toggle is hidden
5. **Complete recurring task**: Complete a recurring task → verify toast shows "Task completed — next due [date]" → verify new task appears in active list
6. **Complete with end condition met**: Complete a recurring task with remaining_count = 1 → verify toast shows "Task completed" (no next date) → verify the new task has no recurrence
7. **Edit recurrence**: Open task detail → change frequency → save → verify updated
8. **Disable recurrence**: Open recurring task detail → disable recurrence → save → verify repeat icon disappears
9. **Delete recurring task**: Click delete on recurring task → verify dialog shows two options → select "Delete this and stop recurrence" → verify task deleted
10. **Delete single occurrence**: Click delete on recurring task → select "Delete this task only" → verify task deleted but recurrence continues
11. `npm test` passes all tests
12. `npm run typecheck` exits with no errors
13. `npm run build` produces output without errors
