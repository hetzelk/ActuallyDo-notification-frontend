# API Recurrence Contract Extensions

**Feature**: 002-nagme-recurring-tasks
**Date**: 2026-03-22
**Status**: Frontend-defined (backend not yet implemented)

This documents the API contract changes required for recurring task support. These extend the existing NagMe task endpoints documented in `overview/api-integration.md`.

---

## Extended Endpoints

### 1. Create Task (extended)

```
POST /apps/nagme/tasks
Authorization: Bearer {id_token}
Content-Type: application/json
```

**Request** (recurrence fields added):
```json
{
  "title": "Pay electric bill",
  "notes": "Account #12345",
  "due_date": "2026-04-01",
  "recurrence": {
    "frequency": "monthly",
    "interval": 1,
    "end_condition": {
      "type": "never"
    }
  }
}
```

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `title` | Yes | string | Existing |
| `notes` | No | string | Existing |
| `due_date` | No | string | Existing. **MUST be present when `recurrence` is provided.** |
| `recurrence` | No | object | New. Omit for non-recurring tasks. |
| `recurrence.frequency` | Yes (if recurrence) | string | `"daily"`, `"weekly"`, `"monthly"`, or `"yearly"` |
| `recurrence.interval` | Yes (if recurrence) | integer | 1–365. `1` = every period, `2` = every other, etc. |
| `recurrence.end_condition` | Yes (if recurrence) | object | When recurrence stops |
| `recurrence.end_condition.type` | Yes | string | `"never"`, `"until_date"`, or `"after_count"` |
| `recurrence.end_condition.until_date` | Conditional | string | YYYY-MM-DD. Required when type is `"until_date"`. |
| `recurrence.end_condition.remaining_count` | Conditional | integer | ≥ 1. Required when type is `"after_count"`. |

**Success Response (201)**:
```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active"
  },
  "message": "Task created"
}
```

**Validation Errors**:
| Status | Error Code | Message | Condition |
|--------|------------|---------|-----------|
| 400 | `validation_error` | "Recurrence requires a due date" | `recurrence` provided without `due_date` |
| 400 | `validation_error` | "Invalid recurrence frequency" | Unknown frequency value |
| 400 | `validation_error` | "Recurrence interval must be between 1 and 365" | Interval out of range |

---

### 2. Get Task / List Tasks (extended response)

Task objects in GET responses now include optional recurrence fields:

```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pay electric bill",
    "notes": "Account #12345",
    "due_date": "2026-04-01",
    "notify": true,
    "status": "active",
    "snoozed_until": null,
    "created_at": "2026-03-15T10:00:00Z",
    "completed_at": null,
    "tags": [],
    "recurrence": {
      "frequency": "monthly",
      "interval": 1,
      "end_condition": {
        "type": "never"
      }
    },
    "recurrence_group_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "is_recurring": true
  }
}
```

| New Field | Type | Notes |
|-----------|------|-------|
| `recurrence` | object or null | The recurrence rule. Null or absent for non-recurring tasks. |
| `recurrence_group_id` | string (UUID) or null | Links all occurrences of the same recurring task. |
| `is_recurring` | boolean | `true` if task has active recurrence. Absent or `false` for regular tasks. |

**Backward compatibility**: These fields are optional. Non-recurring tasks omit them or return null. Frontend MUST handle both cases.

---

### 3. Update Task (extended)

```
PUT /apps/nagme/tasks/{task_id}
Authorization: Bearer {id_token}
Content-Type: application/json
```

**Request** (recurrence field added):
```json
{
  "recurrence": {
    "frequency": "weekly",
    "interval": 2,
    "end_condition": {
      "type": "after_count",
      "remaining_count": 5
    }
  }
}
```

| New Field | Type | Notes |
|-----------|------|-------|
| `recurrence` | object or null | Set to a RecurrenceRule to add/change recurrence. Set to `null` to **disable** recurrence (FR-008). |

**Disable recurrence example**:
```json
{
  "recurrence": null
}
```

This converts the task to a regular one-time task. The recurrence indicator disappears. Future occurrences will not be created on completion.

**Validation Errors**:
| Status | Error Code | Message | Condition |
|--------|------------|---------|-----------|
| 400 | `validation_error` | "Recurrence requires a due date" | Adding recurrence to a backlog task |

---

### 4. Complete Task (extended response)

```
POST /apps/nagme/tasks/{task_id}/complete
Authorization: Bearer {id_token}
```

**No request body required.** (Unchanged)

**Success Response (200)** — recurring task with next occurrence:
```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "completed_at": "2026-04-05T14:30:00Z",
    "next_occurrence": {
      "task_id": "661f9500-f3ac-52e5-b827-557766551111",
      "due_date": "2026-05-01"
    }
  },
  "message": "Task completed"
}
```

**Success Response (200)** — recurring task, end condition met (no next):
```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "completed_at": "2026-04-05T14:30:00Z"
  },
  "message": "Task completed"
}
```

| New Field | Type | Notes |
|-----------|------|-------|
| `data.next_occurrence` | object or undefined | Present when a next occurrence was created |
| `data.next_occurrence.task_id` | string (UUID) | The new task's ID |
| `data.next_occurrence.due_date` | string (YYYY-MM-DD) | The calculated next due date |

**Frontend behavior**:
- If `next_occurrence` present: Toast shows "Task completed — next due {formatted date}"
- If `next_occurrence` absent: Toast shows "Task completed" (existing behavior)
- In both cases: `invalidateQueries(['tasks'])` to refresh the list

---

### 5. Delete Task (extended)

```
DELETE /apps/nagme/tasks/{task_id}?stop_recurrence=true
Authorization: Bearer {id_token}
```

| New Parameter | Type | Location | Notes |
|---------------|------|----------|-------|
| `stop_recurrence` | boolean | Query parameter | When `true`, stops all future recurrence. When `false` or omitted, only deletes the current task. |

**Behavior**:

| `stop_recurrence` | Result |
|--------------------|--------|
| `false` or omitted | Current task deleted. Backend-managed recurrence rule persists. Next occurrence still created at scheduled time. |
| `true` | Current task deleted. Recurrence rule removed. No future occurrences. |

**Success Response (200)**:
```json
{
  "message": "Task deleted"
}
```

**Frontend behavior**:
- For recurring tasks: Show DeleteTaskDialog with two options (FR-009)
- For non-recurring tasks: Simple confirmation dialog (existing behavior)

---

### 6. Snooze Task (no changes)

Snoozing behavior is unchanged. Per the spec (FR-010), snoozing only affects the current occurrence. The recurrence schedule is unaffected. No API changes needed — the backend already handles this correctly when the task has recurrence.

---

## MSW Mock Behavior

For development, MSW handlers should simulate:

1. **Create with recurrence**: Store `recurrence`, generate `recurrence_group_id`, set `is_recurring: true`
2. **List/Get tasks**: Return recurrence fields on tasks that have them
3. **Update recurrence**: Modify or nullify the recurrence rule
4. **Complete recurring task**: Return `next_occurrence` with a calculated next due date (simple: add interval to current due_date). Add the new mock task to the store.
5. **Delete with stop_recurrence**: Remove the task. If `stop_recurrence`, also clear recurrence from any remaining tasks in the same group.

---

## Endpoint Summary

| Method | Path | Changes | Notes |
|--------|------|---------|-------|
| POST | `/apps/nagme/tasks` | Request: optional `recurrence` field | Create recurring task |
| GET | `/apps/nagme/tasks?status={s}` | Response: tasks include recurrence fields | Display recurrence indicator |
| GET | `/apps/nagme/tasks/{id}` | Response: task includes recurrence fields | Task detail with recurrence config |
| PUT | `/apps/nagme/tasks/{id}` | Request: optional `recurrence` field (null to disable) | Edit/disable recurrence |
| DELETE | `/apps/nagme/tasks/{id}` | Query param: `stop_recurrence` | Delete with recurrence control |
| POST | `/apps/nagme/tasks/{id}/complete` | Response: optional `next_occurrence` | Completion with next task info |
| POST | `/apps/nagme/tasks/{id}/snooze` | No changes | Snooze affects current only |
