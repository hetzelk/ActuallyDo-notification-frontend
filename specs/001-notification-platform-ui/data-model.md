# Data Model: ActuallyDo Notification Platform UI

**Feature**: 001-notification-platform-ui
**Date**: 2026-03-22

This documents the client-side TypeScript types representing data flowing between the frontend and backend API. These are NOT database schemas — they mirror the API response shapes from `overview/api-integration.md`.

## Auth Types

### AuthTokens

Returned by login, signup auto-login, and magic link verification.

| Field | Type | Notes |
|-------|------|-------|
| id_token | string | JWT used as Bearer token for all authenticated requests |
| access_token | string | Cognito access token (stored but not directly used by frontend) |
| refresh_token | string | Used to silently refresh expired id_token |
| expires_in | number | Seconds until id_token expires (default 3600) |

### AuthState (client-side)

| Field | Type | Notes |
|-------|------|-------|
| user | { email: string } or null | Decoded from id_token claims |
| idToken | string or null | Current valid id_token |
| accessToken | string or null | Current valid access_token |
| refreshToken | string or null | Persists across sessions |
| expiresAt | number or null | Timestamp (ms) when id_token expires |
| isAuthenticated | boolean | Derived: idToken !== null && expiresAt > Date.now() |
| isLoading | boolean | True during initial token restore from localStorage |

## Settings Types

### PlatformSettings

Returned by `GET /platform/settings`.

| Field | Type | Notes |
|-------|------|-------|
| timezone | string or null | IANA timezone (e.g., "America/New_York"). Null if never set. |
| reminder_time | string or null | HH:MM format (e.g., "09:00"). Null if never set. |
| push_subscription | PushSubscription or null | Null if not subscribed |
| email_disabled | boolean | True if email bounced — show warning banner |
| apps | Record<string, AppSettings> | Keyed by app_id (e.g., "nagme", "milesahead") |

### AppSettings

| Field | Type | Notes |
|-------|------|-------|
| enabled | boolean | Whether the app sends notifications |
| frequency | "daily" or "weekly" or "monthly" | Notification frequency |
| preferred_day | string or null | Day for weekly (Monday-Sunday) or monthly (1st, 15th) |
| app_name | string | Display name (e.g., "NagMe") |
| tier | "free" or "pro" | User's subscription tier for this app |

## NagMe Types

### Task

Returned by `GET /apps/nagme/tasks` (in array) and `GET /apps/nagme/tasks/{id}`.

| Field | Type | Notes |
|-------|------|-------|
| task_id | string (UUID) | Unique identifier |
| title | string | Task title, max 200 chars |
| notes | string or null | Optional details, max 1000 chars |
| due_date | string (YYYY-MM-DD) or null | Null for backlog tasks |
| notify | boolean | Whether notifications are enabled |
| status | "active" or "snoozed" or "backlog" or "completed" | Current task state |
| snoozed_until | string (YYYY-MM-DD) or null | Set when status is "snoozed" |
| created_at | string (ISO 8601) | Creation timestamp |
| completed_at | string (ISO 8601) or null | Null unless completed |
| tags | string[] | Empty array in V1 (Pro feature placeholder) |

### TaskListResponse

| Field | Type | Notes |
|-------|------|-------|
| data.tasks | Task[] | Array of tasks matching the status filter |
| data.count | number | Total count for the filtered status |

### CreateTaskRequest

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | string | Yes | Non-empty after trim |
| notes | string | No | Optional details |
| due_date | string (YYYY-MM-DD) | No | Omit for backlog |

### UpdateTaskRequest

All fields optional — send only what changed.

| Field | Type | Notes |
|-------|------|-------|
| title | string | Updated title |
| notes | string | Updated notes |
| due_date | string (YYYY-MM-DD) | Updated due date |
| notify | boolean | Updated notification preference |

### SnoozeRequest

| Field | Type | Notes |
|-------|------|-------|
| days | number (positive integer) | Free: 1, 3, or 7. Pro: any positive integer. |

### ActivateRequest

| Field | Type | Notes |
|-------|------|-------|
| due_date | string (YYYY-MM-DD) | Required to activate a backlog task |

## MilesAhead Types

### Vehicle

| Field | Type | Notes |
|-------|------|-------|
| vehicle_id | string (UUID) | Unique identifier |
| year | number | 4-digit year (1980 to current+1) |
| make | string | Manufacturer |
| model | string | Model name |
| nickname | string or null | Optional friendly name |
| current_mileage | number | Last known odometer reading |
| weekly_miles_estimate | number | Used for mileage projection |
| mileage_updated_at | string (ISO 8601) | When mileage was last updated |
| created_at | string (ISO 8601) | Creation timestamp |

### MaintenanceItem

| Field | Type | Notes |
|-------|------|-------|
| item_id | string (UUID) | Unique identifier |
| name | string | Item name (e.g., "Oil + filter change") |
| interval_miles | number or null | Mileage-based interval |
| interval_months | number or null | Time-based interval |
| last_completed_mileage | number or null | Mileage at last completion |
| last_completed_date | string (ISO 8601) or null | Date of last completion |
| notify | boolean | Whether notifications are enabled |
| is_custom | boolean | True if user-created (Pro only) |
| notes | string or null | Optional notes |

### MaintenanceLogEntry

| Field | Type | Notes |
|-------|------|-------|
| log_id | string (UUID) | Unique identifier |
| item_name | string | Denormalized item name |
| completed_at | string (YYYY-MM-DD) | When maintenance was done |
| mileage_at_completion | number | Odometer at completion |
| cost | number or null | Pro only |
| shop | string or null | Pro only |
| notes | string or null | Optional notes |

### CreateVehicleRequest

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| year | number | Yes | 4-digit year |
| make | string | Yes | Manufacturer |
| model | string | Yes | Model name |
| nickname | string | No | Optional friendly name |
| current_mileage | number | Yes | Current odometer reading |
| weekly_miles_estimate | number | Yes | Weekly driving estimate |

### LogCompletionRequest

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| completed_at | string (YYYY-MM-DD) | Yes | Date of maintenance |
| mileage_at_completion | number | Yes | Odometer at time of maintenance |
| cost | number | No | Pro only |
| shop | string | No | Pro only |
| notes | string | No | Optional details |

### UpdateMileageRequest

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| current_mileage | number | Yes | Must be >= current known mileage |
| weekly_miles_estimate | number | No | Updated weekly estimate |

## Client-Side Derived Types

### TaskGroup

Used to group tasks in the Active tab UI.

| Value | Condition | Styling |
|-------|-----------|---------|
| "overdue" | due_date < today | Red text, overdue badge |
| "due-today" | due_date === today | Standard |
| "snoozed" | status === "snoozed" | Muted/gray, snooze icon |
| "upcoming" | due_date > today | Standard (Pro: heads-up window) |

### MaintenanceUrgency

Used to group maintenance items in vehicle detail.

| Value | Condition | Styling |
|-------|-----------|---------|
| "overdue" | Past interval by miles or months | Red/amber section |
| "coming-up" | Within threshold of interval | Standard section |
| "all-clear" | Not near interval | Green section |

### EstimatedMileage

Client-side calculation for vehicle mileage projection.

```
estimated_mileage = current_mileage + (days_since_update * weekly_miles_estimate / 7)
```

## State Transitions

### Task Status Transitions

```
[created with due_date]  → active
[created without due_date] → backlog

active → completed    (via POST /complete)
active → snoozed      (via POST /snooze)
snoozed → active      (automatic when snoozed_until passes)
backlog → active      (via POST /activate with due_date)
```

### Subscription Tier Transitions

```
free → pro    (Stripe checkout.session.completed webhook)
pro → free    (Stripe customer.subscription.deleted webhook)
```
