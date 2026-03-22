# Data Model: NagMe Recurring Tasks

**Feature**: 002-nagme-recurring-tasks
**Date**: 2026-03-22

This documents the TypeScript types added or modified for recurrence support. These mirror the expected API response shapes documented in `contracts/api-recurrence.md`.

## New Types

### RecurrenceFrequency

Supported repeat frequencies.

| Value | Description |
|-------|-------------|
| `"daily"` | Repeats every N days |
| `"weekly"` | Repeats every N weeks |
| `"monthly"` | Repeats every N months |
| `"yearly"` | Repeats every N years |

### RecurrenceEndType

How the recurrence terminates.

| Value | Description |
|-------|-------------|
| `"never"` | Repeats forever |
| `"until_date"` | Repeats until a specific date |
| `"after_count"` | Repeats a fixed number of times |

### RecurrenceEndCondition

| Field | Type | Notes |
|-------|------|-------|
| type | RecurrenceEndType | How recurrence ends |
| until_date | string (YYYY-MM-DD) or undefined | Required when type === "until_date" |
| remaining_count | number or undefined | Required when type === "after_count". Decrements with each occurrence. |

### RecurrenceRule

The complete recurrence configuration for a task.

| Field | Type | Notes |
|-------|------|-------|
| frequency | RecurrenceFrequency | The repeat interval type |
| interval | number | Every N periods. 1 = every, 2 = every other, etc. Min 1, max 365. |
| end_condition | RecurrenceEndCondition | When/how recurrence stops |

## Modified Types

### Task (extended)

Three optional fields added to the existing Task interface.

| Field | Type | Notes |
|-------|------|-------|
| recurrence | RecurrenceRule or null | Present on recurring tasks. Null or absent on regular tasks. |
| recurrence_group_id | string (UUID) or null | Links all occurrences of the same recurring task. Null for regular tasks. |
| is_recurring | boolean | Convenience flag. True if task has active recurrence. |

All existing fields remain unchanged and required. The new fields are optional for backward compatibility — existing tasks without recurrence continue to work.

### CreateTaskRequest (extended)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Yes | Existing |
| notes | string | No | Existing |
| due_date | string (YYYY-MM-DD) | No | Existing. MUST be present to include recurrence. |
| recurrence | RecurrenceRule | No | New. Only valid when due_date is also provided. |

### UpdateTaskRequest (extended)

| Field | Type | Notes |
|-------|------|-------|
| title | string | Existing |
| notes | string | Existing |
| due_date | string | Existing |
| notify | boolean | Existing |
| recurrence | RecurrenceRule or null | New. Set to null to disable recurrence (FR-008). |

### DeleteTaskRequest (new)

| Field | Type | Notes |
|-------|------|-------|
| stop_recurrence | boolean | When true, stops all future occurrences. When false or omitted, only deletes the current task — recurrence continues. |

Sent as a query parameter: `DELETE /apps/nagme/tasks/{id}?stop_recurrence=true`

## New Response Types

### CompleteTaskResponse (extended)

| Field | Type | Notes |
|-------|------|-------|
| data.task_id | string | Completed task ID |
| data.status | "completed" | Always "completed" |
| data.completed_at | string (ISO 8601) | Completion timestamp |
| data.next_occurrence | NextOccurrence or undefined | Present only for recurring tasks that generate a next occurrence |
| message | string | "Task completed" |

### NextOccurrence

| Field | Type | Notes |
|-------|------|-------|
| task_id | string (UUID) | The newly created next task's ID |
| due_date | string (YYYY-MM-DD) | The calculated next due date |

This is returned when:
- The completed task has recurrence
- The end condition has not been met (not past until_date, remaining_count > 0, or type is "never")

NOT returned when:
- The task has no recurrence
- The end condition has been met (FR-013)

## Client-Side Derived Types

### RecurrenceLabel

A utility function (not a type) that generates human-readable labels:

| Input | Output |
|-------|--------|
| `{ frequency: 'daily', interval: 1 }` | "Daily" |
| `{ frequency: 'weekly', interval: 1 }` | "Weekly" |
| `{ frequency: 'weekly', interval: 2 }` | "Every 2 weeks" |
| `{ frequency: 'monthly', interval: 1 }` | "Monthly" |
| `{ frequency: 'monthly', interval: 3 }` | "Every 3 months" |
| `{ frequency: 'yearly', interval: 1 }` | "Yearly" |

End condition suffix:
| Input | Output |
|-------|--------|
| `{ type: 'never' }` | (no suffix) |
| `{ type: 'until_date', until_date: '2026-12-31' }` | " · until Dec 31, 2026" |
| `{ type: 'after_count', remaining_count: 5 }` | " · 5 times left" |

## State Transitions (extended)

### Task Status Transitions with Recurrence

```
[created with due_date + recurrence]  → active (recurring)

active (recurring) → completed    (via POST /complete)
                                  → backend creates next occurrence as new active task
                                    (unless end condition met)

active (recurring) → snoozed      (via POST /snooze)
                                  → snooze affects only this occurrence
                                  → recurrence schedule unaffected

active (recurring) → deleted      (via DELETE)
                                  → "delete this only": recurrence continues
                                  → "stop recurrence": no future occurrences

active (recurring) → active (non-recurring)  (via PUT with recurrence: null)
                                              → task becomes regular one-time task
```

## Validation Rules

### Recurrence Configuration

| Rule | Description | Source |
|------|-------------|--------|
| Due date required | Recurrence options hidden when no due_date (FR-011) | Spec |
| Interval range | interval must be 1–365 | Sensible limit to prevent absurd values |
| Frequency required | Must be one of daily/weekly/monthly/yearly (FR-002) | Spec |
| End condition: until_date | Must be a valid future date when type === "until_date" | Spec (SC-002) |
| End condition: after_count | Must be a positive integer (1+) when type === "after_count" | Spec (FR-004) |
| Backlog exclusion | Tasks without due_date cannot have recurrence (FR-011) | Spec |

### Zod Schema

```typescript
const recurrenceEndConditionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('never') }),
  z.object({ type: z.literal('until_date'), until_date: z.string().date() }),
  z.object({ type: z.literal('after_count'), remaining_count: z.number().int().min(1) }),
])

const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().int().min(1).max(365),
  end_condition: recurrenceEndConditionSchema,
})
```
