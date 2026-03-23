# Research: TuskDue Recurring Tasks

**Feature**: 002-tuskdue-recurring-tasks
**Date**: 2026-03-22

## R1: Recurrence Rule Data Model

**Decision**: Define a simple `RecurrenceRule` TypeScript interface with `frequency`, `interval`, and `end_condition` fields. Do NOT adopt full RFC 5545 (iCalendar RRULE) — the backend owns the recurrence engine and the frontend only needs to capture user intent.

**Rationale**: The frontend needs to send recurrence configuration to the backend and display it. The backend calculates next due dates. A minimal model avoids over-engineering:

```typescript
type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'
type RecurrenceEndType = 'never' | 'until_date' | 'after_count'

interface RecurrenceEndCondition {
  type: RecurrenceEndType
  until_date?: string       // YYYY-MM-DD, when type === 'until_date'
  remaining_count?: number  // when type === 'after_count'
}

interface RecurrenceRule {
  frequency: RecurrenceFrequency
  interval: number          // every N periods (1 = every, 2 = every other, etc.)
  end_condition: RecurrenceEndCondition
}
```

This maps cleanly to the spec requirements (FR-002, FR-003, FR-004) without introducing iCalendar complexity (BYDAY, BYMONTH, WKST, etc.) that the spec doesn't require.

**Alternatives considered**:
- **rrule.js**: Full RFC 5545 library. Overkill — we don't need recurrence expansion on the client. Adds ~15 KB gzipped. The backend owns date calculation.
- **String-encoded RRULE**: Storing `FREQ=WEEKLY;INTERVAL=2` as a string. Harder to validate with Zod, harder to bind to form controls. No benefit since we're not interoperating with iCalendar systems.
- **Flat fields on Task**: Adding `recurrence_frequency`, `recurrence_interval`, etc. directly to Task. Rejected because a nested object keeps the model clean and makes optional recurrence easy (`recurrence?: RecurrenceRule`).

## R2: Task Type Extension for Recurrence

**Decision**: Extend the existing `Task` interface with three optional fields: `recurrence` (the rule), `recurrence_group_id` (links occurrences), and `is_recurring` (convenience boolean). The complete response for recurring tasks will include `next_occurrence` with the next due date.

**Rationale**: The spec defines three key entities (Recurrence Rule, Recurring Task, Recurrence Group). Adding these as optional fields on the existing `Task` type maintains backward compatibility — existing non-recurring tasks continue to work unchanged.

```typescript
interface Task {
  // ... existing fields ...
  recurrence?: RecurrenceRule | null     // null = not recurring
  recurrence_group_id?: string | null    // links all occurrences
  is_recurring?: boolean                 // convenience flag for display
}
```

The complete endpoint response gains a `next_occurrence` field:
```typescript
interface CompleteTaskResponse {
  data: {
    task_id: string
    status: 'completed'
    completed_at: string
    next_occurrence?: {
      task_id: string
      due_date: string
    }
  }
  message: string
}
```

**Alternatives considered**:
- **Separate RecurringTask type**: Creates type branching everywhere. The spec says "a recurring task IS a regular task with additional recurrence metadata" — extension is the right model.
- **Omitting `is_recurring`**: Could derive from `!!recurrence`, but an explicit boolean from the API is more reliable (handles edge case where recurrence ended but the field persists for history).

## R3: Recurrence UI Pattern

**Decision**: Use an inline collapsible section within the existing AddTaskForm dialog and TaskDetail page. The section appears only when a due date is set (FR-011). Pattern: toggle switch ("Repeat") → frequency dropdown → optional custom interval → end condition selector.

**Rationale**: Surveyed common task app patterns:
- **Todoist**: Inline text parsing ("every 2 weeks") — too complex to implement, requires NLP.
- **Google Tasks**: Simple repeat picker as a dropdown — minimal but no custom intervals.
- **Apple Reminders**: Toggle + frequency dropdown + end condition — clean, supports customization.
- **Things 3**: Separate "Repeat" section in detail view — similar toggle approach.

The Apple Reminders pattern best fits our requirements: it supports all frequencies, custom intervals, and end conditions in a compact mobile-friendly UI.

**UI flow**:
1. Due date is set → "Repeat" toggle appears below
2. Toggle on → frequency dropdown shows (Daily, Weekly, Monthly, Yearly)
3. "Custom" option in dropdown → interval number input appears ("Every [N] [weeks]")
4. End condition section: radio group (Forever, Until date, After N times)

This adds at most 2 interactions beyond creating a regular task (SC-001: under 30 seconds).

**Alternatives considered**:
- **Separate modal for recurrence**: Over-engineered. The recurrence config is only 3-4 fields.
- **Natural language input**: High implementation cost, ambiguous parsing, violates Component Simplicity.
- **Calendar-style day picker (e.g., MTWTFSS checkboxes)**: Not needed per spec — we only support frequency + interval, not specific day-of-week selection.

## R4: Completion Toast and Next Occurrence Display

**Decision**: Wait for server response to show the next occurrence toast. Do NOT optimistically create the next task on the client.

**Rationale**: Per the spec, "the frontend does not create the next task itself" — the backend handles auto-creation. The completion flow:

1. User taps "Done" on a recurring task
2. Optimistic update: remove task from active list (existing behavior)
3. Server responds with `next_occurrence: { task_id, due_date }`
4. Toast: "Task completed — next due April 1" (FR-012)
5. `invalidateQueries(['tasks'])` refetches, showing the new occurrence

For non-recurring tasks, the toast remains "Task completed" (existing behavior). The conditional is: if `response.data.next_occurrence`, show the enhanced toast.

**Alternatives considered**:
- **Optimistic next occurrence**: The client would need to duplicate the backend's date calculation logic (anchor-based, not completion-based). Error-prone, and the task_id must come from the server. Not worth the complexity.
- **Polling for next occurrence**: Unnecessary — the complete endpoint returns it directly.

## R5: Delete Confirmation UX for Recurring Tasks

**Decision**: Show a custom Dialog with two options when deleting a recurring task: "Delete this task only" and "Delete this and stop recurrence." Regular (non-recurring) tasks keep the existing simple delete behavior.

**Rationale**: Calendar apps (Google Calendar, Outlook) show 3 options for recurring events: "this event", "this and following", "all events." For a task app, only 2 options make sense per the spec (FR-009):
- "Delete this task only" → `DELETE /tasks/{id}` (recurrence continues via backend-managed rule)
- "Delete this and stop recurrence" → `DELETE /tasks/{id}?stop_recurrence=true` (or equivalent body param)

The dialog uses a RadioGroup within a Dialog for clear, accessible selection.

**Alternatives considered**:
- **Three options (this / future / all)**: The spec only defines two options. "All" would require deleting historical completed tasks, which adds complexity with no user value.
- **Inline button variants**: Two separate buttons instead of a dialog. Less clear — users might click the wrong one. A dialog forces deliberate choice (SC-006: fewer than 5% accidental deletions).
- **Swipe-to-delete with undo**: Mobile-friendly but doesn't allow choosing between the two delete modes.

## R6: API Contract for Recurrence (Frontend-Defined)

**Decision**: The frontend defines the expected API contract for recurrence. The backend does not yet implement these endpoints. MSW mocks will simulate the behavior during development. The contract will be documented in `contracts/api-recurrence.md`.

**Rationale**: Per Constitution Principle I (API-Contract First), we document the expected shapes before implementation. Since this is a cross-repo feature and the backend hasn't implemented recurrence yet, the frontend defines what it needs:

1. **Create task with recurrence**: `POST /apps/tuskdue/tasks` adds optional `recurrence` field to request body
2. **Update task recurrence**: `PUT /apps/tuskdue/tasks/{id}` adds optional `recurrence` field (set to null to disable)
3. **Complete recurring task**: Response includes `next_occurrence` object
4. **Delete with stop_recurrence**: `DELETE /apps/tuskdue/tasks/{id}` adds optional `stop_recurrence` query parameter
5. **Task response**: All GET endpoints include the recurrence fields when present

MSW handlers will mock these behaviors for development and testing.

**Alternatives considered**:
- **Wait for backend to define the contract**: Blocks frontend development. API-Contract First means either side can define the contract first, and the other conforms.
- **New dedicated recurrence endpoints**: `/tasks/{id}/recurrence` for CRUD on recurrence rule. Over-engineered — recurrence is a property of the task, not a separate resource.

## R7: date-fns for Recurrence Display Labels

**Decision**: Use date-fns `format` and `formatDistanceToNow` for displaying recurrence-related dates in the UI. No date calculation library needed — the backend computes next due dates.

**Rationale**: The frontend only needs to:
- Format the `next_occurrence.due_date` in the completion toast: `format(parseISO(date), 'MMMM d')` → "April 1"
- Display the recurrence rule as a human-readable label: `getRecurrenceLabel(rule)` → "Every 2 weeks" (pure string formatting, no date math)
- Format `end_condition.until_date` in the config UI: `format(parseISO(date), 'MMM d, yyyy')` → "Dec 31, 2026"

All of these are already supported by the existing date-fns dependency.

**Alternatives considered**:
- **Intl.DateTimeFormat**: Native but less convenient than date-fns for relative formatting. date-fns is already in the project.
- **Adding a recurrence formatting library**: Unnecessary — the label logic is a simple function, not a library.

## R8: MSW Mock Handler Strategy

**Decision**: Create MSW handlers in `src/mocks/handlers.ts` and a browser setup in `src/mocks/browser.ts`. Handlers will simulate recurrence behavior for all task endpoints. The existing `mockServiceWorker.js` is already in `public/`.

**Rationale**: MSW is already installed and the service worker is registered. We need handlers that:
- Store mock tasks in memory with recurrence fields
- Return `next_occurrence` on complete for recurring tasks
- Handle `stop_recurrence` on delete
- Support the recurrence fields in create/update

This aligns with Constitution Principle I (API-Contract First) and enables development without the backend.

**Alternatives considered**:
- **JSON fixture files**: Static, can't simulate state changes (completing a recurring task creating the next one).
- **Backend-first**: Would block frontend development. MSW is the documented approach in the constitution.
