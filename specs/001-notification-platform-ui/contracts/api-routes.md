# Frontend Route Contracts

**Feature**: 001-notification-platform-ui
**Date**: 2026-03-22

## Route Map

This documents every frontend route, what it renders, and what API calls it makes.

### Public Routes (no auth required)

| Route | Page Component | API Calls on Load | Purpose |
|-------|---------------|-------------------|---------|
| `/login` | LoginPage | None | Email/password login form |
| `/signup` | SignupPage | None | Account creation form |
| `/login/magic-link` | MagicLinkPage | None | Magic link request + code verification |
| `/action-result` | ActionResultPage | None | Renders status from query params |

### Authenticated Routes (redirect to `/login` if no session)

| Route | Page Component | API Calls on Load | Purpose |
|-------|---------------|-------------------|---------|
| `/` | Redirect | None | Redirects to `/tuskdue` (default app) |
| `/settings` | SettingsPage | `GET /platform/settings` | Profile, app prefs, push, subscription |
| `/tuskdue` | TuskDue DashboardPage | `GET /apps/tuskdue/tasks?status=active` | Task list with tabs |
| `/tuskdue/tasks/:taskId` | TuskDue TaskDetailPage | `GET /apps/tuskdue/tasks/:taskId` | Task detail/edit view |
| `/wrenchdue` | WrenchDue DashboardPage | `GET /apps/wrenchdue/vehicles` | Vehicle list |
| `/wrenchdue/vehicles/new` | AddVehiclePage | None | Add vehicle form |
| `/wrenchdue/vehicles/:id` | VehicleDetailPage | `GET /apps/wrenchdue/vehicles/:id`, `GET .../items`, `GET .../log` | Vehicle detail + maintenance |

### Action Result Query Parameters

| Param | Values | Source |
|-------|--------|--------|
| `status` | `success`, `already-used`, `expired`, `error` | Backend redirect after action link processing |
| `message` | URL-encoded string | Optional context message from backend |

### TuskDue-Specific Result Routes (redirected from backend action handler)

| Route | Purpose |
|-------|---------|
| `/done?task={id}` | Task completion confirmation |
| `/snoozed?task={id}&days={n}` | Task snooze confirmation |

### Settings Payment Return

| Query Param | Meaning |
|-------------|---------|
| `?payment=success` | Stripe checkout completed — re-fetch settings after delay |
| `?payment=cancelled` | Stripe checkout cancelled — no action needed |

## API Endpoint Contract Summary

All endpoints use JSON. Authenticated endpoints require `Authorization: Bearer {id_token}`.

### Auth Endpoints (no auth)

| Method | Path | Request | Success | Key Errors |
|--------|------|---------|---------|------------|
| POST | `/platform/auth/signup` | `{email, password}` | 201 `{user_id, message}` | 409 email exists |
| POST | `/platform/auth/login` | `{email, password}` | 200 `{id_token, access_token, refresh_token, expires_in}` | 401 invalid credentials |
| POST | `/platform/auth/magic-link` | `{email}` | 200 always | 400 missing email |
| POST | `/platform/auth/magic-link/verify` | `{email, code, session?}` | 200 `{id_token, access_token, refresh_token}` | 401 invalid code |

### Platform Endpoints (auth required)

| Method | Path | Request | Success | Key Errors |
|--------|------|---------|---------|------------|
| GET | `/platform/settings` | — | 200 `{timezone, reminder_time, push_subscription, email_disabled, apps}` | 401, 404 |
| PUT | `/platform/settings` | `{timezone?, reminder_time?, push_subscription?, apps?}` | 200 `{message}` | 400 invalid values |

### TuskDue Endpoints (auth required)

| Method | Path | Request | Success | Key Errors |
|--------|------|---------|---------|------------|
| GET | `/apps/tuskdue/tasks?status={s}` | — | 200 `{data: {tasks[], count}}` | 401 |
| POST | `/apps/tuskdue/tasks` | `{title, notes?, due_date?}` | 201 `{data: {task_id, status}, message}` | 400, 403 limit |
| GET | `/apps/tuskdue/tasks/:id` | — | 200 `{data: {task}}` | 404 |
| PUT | `/apps/tuskdue/tasks/:id` | `{title?, notes?, due_date?, notify?}` | 200 `{data: {task}, message}` | 404 |
| DELETE | `/apps/tuskdue/tasks/:id` | — | 200 `{message}` | 404 |
| POST | `/apps/tuskdue/tasks/:id/activate` | `{due_date}` | 200 `{data, message}` | 400, 403 limit |
| POST | `/apps/tuskdue/tasks/:id/complete` | — | 200 `{data, message}` | 404 |
| POST | `/apps/tuskdue/tasks/:id/snooze` | `{days}` | 200 `{data, message}` | 400 tier restriction |

### WrenchDue Endpoints (auth required, backend not yet built)

| Method | Path | Request | Success | Key Errors |
|--------|------|---------|---------|------------|
| GET | `/apps/wrenchdue/vehicles` | — | 200 `{data: {vehicles[]}}` | 401 |
| POST | `/apps/wrenchdue/vehicles` | `{year, make, model, nickname?, current_mileage, weekly_miles_estimate}` | 201 | 403 limit |
| GET | `/apps/wrenchdue/vehicles/:id` | — | 200 `{data: {vehicle}}` | 404 |
| PUT | `/apps/wrenchdue/vehicles/:id` | partial vehicle fields | 200 | 404 |
| DELETE | `/apps/wrenchdue/vehicles/:id` | — | 200 | 404 |
| PUT | `/apps/wrenchdue/vehicles/:id/mileage` | `{current_mileage, weekly_miles_estimate?}` | 200 | 400 |
| GET | `/apps/wrenchdue/vehicles/:id/items` | — | 200 `{data: {items[]}}` | 404 |
| POST | `/apps/wrenchdue/vehicles/:id/items` | `{name, interval_miles?, interval_months?, notes?}` | 201 | 403 free tier |
| PUT | `/apps/wrenchdue/vehicles/:id/items/:itemId` | partial item fields | 200 | 404 |
| DELETE | `/apps/wrenchdue/vehicles/:id/items/:itemId` | — | 200 | 404 |
| POST | `/apps/wrenchdue/vehicles/:id/items/:itemId/complete` | `{completed_at, mileage_at_completion, cost?, shop?, notes?}` | 200 | 400 |
| GET | `/apps/wrenchdue/vehicles/:id/log` | — | 200 `{data: {entries[]}}` | 404 |

## Error Response Contract

All API errors follow this shape:

```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

Frontend error handling rules:
- 400: Show field-level validation errors or toast
- 401: Redirect to `/login` (token expired or invalid)
- 403 `limit_reached`: Show UpgradePrompt component
- 404: Show "not found" state or toast
- 409: Show inline error (signup email conflict)
- Network error: Show toast "Something went wrong. Please try again."
