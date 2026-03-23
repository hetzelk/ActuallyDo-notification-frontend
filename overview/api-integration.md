# API Integration Reference

Complete mapping of every UI action to its backend API call. This is the single source of truth for the frontend build — every request/response shape, error code, and auth requirement is documented here.

---

## Base Configuration

```typescript
const API_BASE = "https://{api-id}.execute-api.{region}.amazonaws.com";

// All requests use JSON
const headers = {
  "Content-Type": "application/json",
};

// Authenticated requests add the Cognito JWT
const authHeaders = {
  "Content-Type": "application/json",
  "Authorization": `Bearer ${idToken}`,
};
```

---

## Token Management

### Storage
- Store `id_token`, `access_token`, `refresh_token` after login/signup
- Use `id_token` as the Bearer token for all authenticated requests
- `expires_in` is in seconds (default 3600 = 1 hour)

### Refresh Flow
- Before each authenticated request, check if `id_token` is near expiry
- Use `refresh_token` to get new tokens (Cognito `InitiateAuth` with `REFRESH_TOKEN_AUTH` flow)
- If refresh fails, redirect user to login

### Logout
- Clear all stored tokens
- Redirect to `/login`

---

## Error Response Format

All error responses follow this shape:

```json
{
  "error": "error_code",
  "message": "Human-readable error message"
}
```

Common error codes:
| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `bad_request` | 400 | Invalid input (missing fields, bad format) |
| `unauthorized` | 401 | Missing or invalid auth token |
| `limit_reached` | 403 | Free tier limit exceeded |
| `not_found` | 404 | Resource doesn't exist |
| `conflict` | 409 | Resource already exists (signup) |
| `validation_error` | 400 | Input failed validation |
| `invalid_token` | 400 | Action token signature/format invalid |
| `invalid_signature` | 400 | Stripe webhook signature invalid |

---

## 1. Authentication

### 1.1 Sign Up

**UI Action**: User submits signup form
**Screen**: `/signup`

```
POST /platform/auth/signup
Content-Type: application/json
(no auth required)
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (201)**:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Account created"
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 400 | `bad_request` | "Email and password are required" | Highlight empty fields |
| 409 | `conflict` | "An account with this email may already exist" | Show inline error below email field |
| 400 | `bad_request` | "Could not create account" | Show generic error toast |

**Post-Success Flow**:
1. Show toast: "Account created!"
2. Auto-login: immediately call `POST /platform/auth/login` with same credentials
3. Store tokens, redirect to dashboard

**Side Effects (server)**:
- User profile created with defaults (no timezone/reminder_time set)
- Default-enabled apps auto-registered (TuskDue, WrenchDue)
- No EventBridge schedule created (user must set reminder_time first)

---

### 1.2 Log In

**UI Action**: User submits login form
**Screen**: `/login`

```
POST /platform/auth/login
Content-Type: application/json
(no auth required)
```

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200)**:
```json
{
  "id_token": "eyJhbGciOi...",
  "access_token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi...",
  "expires_in": 3600
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 400 | `bad_request` | "Email and password are required" | Highlight empty fields |
| 401 | `unauthorized` | "Invalid email or password" | Show inline error below form |
| 401 | `unauthorized` | "Authentication failed" | Show generic error below form |

**Post-Success Flow**:
1. Store all three tokens + timestamp for expiry tracking
2. Redirect to dashboard (or the page user was trying to access)

---

### 1.3 Request Magic Link

**UI Action**: User submits email on magic link screen
**Screen**: `/login/magic-link`

```
POST /platform/auth/magic-link
Content-Type: application/json
(no auth required)
```

**Request**:
```json
{
  "email": "user@example.com"
}
```

**Success Response (200)** (always — prevents email enumeration):
```json
{
  "message": "If an account exists, a sign-in link has been sent"
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 400 | `bad_request` | "Email is required" | Highlight email field |

**Post-Success Flow**:
1. Transition to "Check your email" screen
2. Store email in local state for verification step
3. Start resend cooldown timer (60 seconds)

---

### 1.4 Verify Magic Link Code

**UI Action**: User enters 6-digit code from email
**Screen**: `/login/magic-link` (step 2)

```
POST /platform/auth/magic-link/verify
Content-Type: application/json
(no auth required)
```

**Request**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "session": "optional-session-id"
}
```

**Success Response (200)**:
```json
{
  "id_token": "eyJhbGciOi...",
  "access_token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi..."
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 400 | `bad_request` | "Email and code are required" | Highlight code field |
| 401 | `unauthorized` | "Invalid or expired code" | Show error, clear code input, allow retry |

**Post-Success Flow**: same as login (store tokens, redirect to dashboard).

---

## 2. Settings

### 2.1 Get Settings

**UI Action**: Load settings page
**Screen**: `/settings`

```
GET /platform/settings
Authorization: Bearer {id_token}
```

**Success Response (200)**:
```json
{
  "timezone": "America/New_York",
  "reminder_time": "09:00",
  "push_subscription": null,
  "email_disabled": false,
  "apps": {
    "tuskdue": {
      "enabled": true,
      "frequency": "daily",
      "preferred_day": null,
      "app_name": "TuskDue"
    },
    "wrenchdue": {
      "enabled": true,
      "frequency": "weekly",
      "preferred_day": "monday",
      "app_name": "WrenchDue"
    }
  }
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 401 | `unauthorized` | "Authentication required" | Redirect to login |
| 404 | `not_found` | "User profile not found" | Show error state, suggest re-signup |

**Field Notes**:
- `timezone`: null if never set (prompt user to set it)
- `reminder_time`: null if never set (prompt user to set it)
- `push_subscription`: null if not subscribed, object if subscribed
- `email_disabled`: true if email bounced/complained — show warning banner
- `apps`: keyed by app_id, contains all registered apps

---

### 2.2 Update Settings

**UI Action**: User changes any setting (auto-save or explicit save)
**Screen**: `/settings`

```
PUT /platform/settings
Authorization: Bearer {id_token}
Content-Type: application/json
```

**Request** (all fields optional — send only what changed):
```json
{
  "timezone": "America/Chicago",
  "reminder_time": "08:00",
  "push_subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": {
      "p256dh": "...",
      "auth": "..."
    }
  },
  "apps": {
    "tuskdue": {
      "enabled": true,
      "frequency": "daily"
    },
    "wrenchdue": {
      "enabled": true,
      "frequency": "weekly",
      "preferred_day": "monday"
    }
  }
}
```

**Success Response (200)**:
```json
{
  "message": "Settings updated"
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 401 | `unauthorized` | "Authentication required" | Redirect to login |
| 400 | `bad_request` | "Invalid timezone" | Highlight timezone field with error |
| 400 | `bad_request` | "Invalid reminder_time, expected HH:MM" | Highlight time field |
| 400 | `bad_request` | "Unknown app: {app_id}" | Should never happen in normal UI flow |
| 400 | `bad_request` | "Invalid frequency '{freq}', must be one of: daily, monthly, weekly" | Highlight frequency dropdown |

**Validation Rules**:
- `timezone`: must be valid IANA timezone (e.g., "America/New_York")
- `reminder_time`: must match `HH:MM` format, hours 00-23, minutes 00-59
- `frequency`: must be "daily", "weekly", or "monthly"
- `preferred_day`: relevant only for weekly/monthly frequency

**Side Effects**:
- If both `timezone` and `reminder_time` are set (now or previously): creates/updates EventBridge schedule
- Show inline confirmation: "Settings saved" (if schedule was created: "Settings saved. Your email schedule is active.")

---

## 3. TuskDue — Task Management

### 3.1 List Tasks

**UI Action**: Load task list, switch tabs
**Screen**: `/` (Active/Backlog/Completed tabs)

```
GET /apps/tuskdue/tasks?status={status}
Authorization: Bearer {id_token}
```

**Query Parameters**:
| Param | Required | Values | Default |
|-------|----------|--------|---------|
| `status` | No | `active`, `backlog`, `completed` | `active` |

**Note**: The `active` status filter returns both `active` AND `snoozed` tasks.

**Success Response (200)**:
```json
{
  "data": {
    "tasks": [
      {
        "task_id": "550e8400-e29b-41d4-a716-446655440000",
        "title": "Pay electric bill",
        "notes": "Account #12345",
        "due_date": "2026-03-19",
        "notify": true,
        "status": "active",
        "snoozed_until": null,
        "created_at": "2026-03-15T10:00:00Z",
        "completed_at": null,
        "tags": []
      }
    ],
    "count": 12
  }
}
```

**Sorting** (applied server-side):
- Active/snoozed: by `due_date` ascending (earliest due first, overdue at top)
- Backlog: by `created_at` descending (newest first)
- Completed: by `completed_at` descending (most recently completed first)

**UI Mapping**:
- Active tab: call with `status=active`
- Backlog tab: call with `status=backlog`
- Completed tab: call with `status=completed`

**Client-Side Processing** (Active tab):
- Group tasks by visual category using `due_date` compared to today:
  - `due_date < today` → Overdue (show "N days overdue" in red)
  - `due_date === today` → Due Today
  - `status === "snoozed"` → Snoozed (show "Snoozed until {snoozed_until}")
  - `due_date > today` → Upcoming (for Pro: within heads-up window)

---

### 3.2 Create Task

**UI Action**: Submit add task form
**Screen**: Add task modal/drawer

```
POST /apps/tuskdue/tasks
Authorization: Bearer {id_token}
Content-Type: application/json
```

**Request**:
```json
{
  "title": "Pay electric bill",
  "notes": "Account #12345",
  "due_date": "2026-03-25"
}
```

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `title` | Yes | string | Non-empty after trim |
| `notes` | No | string | Optional details |
| `due_date` | No | string | ISO date (YYYY-MM-DD). Omit for backlog. |

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

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 400 | `validation_error` | "Title is required" | Highlight title field |
| 403 | `limit_reached` | "Free tier limit of 15 active tasks reached. Upgrade to Pro for unlimited tasks." | Show upgrade prompt (see platform-ui.md §4.2) |

**Post-Success Flow**:
1. Close modal
2. Show toast: "Task created"
3. Refresh task list (or optimistically add to local state)
4. If created with due_date → switch to Active tab if not already there
5. If created without due_date → switch to Backlog tab

**Note**: The 403 only triggers when `due_date` is provided (creating an active task). Backlog tasks are unlimited.

---

### 3.3 Get Single Task

**UI Action**: Open task detail view
**Screen**: `/tasks/{task_id}`

```
GET /apps/tuskdue/tasks/{task_id}
Authorization: Bearer {id_token}
```

**Success Response (200)**:
```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Pay electric bill",
    "notes": "Account #12345",
    "due_date": "2026-03-19",
    "notify": true,
    "status": "active",
    "snoozed_until": null,
    "created_at": "2026-03-15T10:00:00Z",
    "completed_at": null,
    "tags": []
  }
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 404 | `not_found` | "Task not found" | Show "Task not found" page with back link |

---

### 3.4 Update Task

**UI Action**: Edit task fields (title, notes, due_date, notify toggle)
**Screen**: `/tasks/{task_id}` (task detail view)

```
PUT /apps/tuskdue/tasks/{task_id}
Authorization: Bearer {id_token}
Content-Type: application/json
```

**Request** (all fields optional — send only what changed):
```json
{
  "title": "Updated title",
  "notes": "Updated notes",
  "due_date": "2026-04-01",
  "notify": true
}
```

**Success Response (200)**:
```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Updated title",
    "notes": "Updated notes",
    "due_date": "2026-04-01",
    "notify": true,
    "status": "active",
    "snoozed_until": null,
    "created_at": "2026-03-15T10:00:00Z",
    "completed_at": null,
    "tags": []
  },
  "message": "Task updated"
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 404 | `not_found` | "Task not found" | Show error toast, redirect to list |

**Auto-Save Pattern**: debounce 500ms, send only changed fields. Show inline "Saved" indicator that fades after 2 seconds. On error, show persistent error with retry.

---

### 3.5 Delete Task

**UI Action**: Confirm delete in dialog
**Screen**: `/tasks/{task_id}` (task detail view)

```
DELETE /apps/tuskdue/tasks/{task_id}
Authorization: Bearer {id_token}
```

**Success Response (200)**:
```json
{
  "message": "Task deleted"
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 404 | `not_found` | "Task not found" | Show error toast |

**Post-Success Flow**:
1. Navigate back to task list
2. Show toast: "Task deleted"
3. Remove from local state

---

### 3.6 Activate Backlog Task

**UI Action**: Click "Activate" button on backlog task, select due date
**Screen**: Backlog tab → date picker

```
POST /apps/tuskdue/tasks/{task_id}/activate
Authorization: Bearer {id_token}
Content-Type: application/json
```

**Request**:
```json
{
  "due_date": "2026-04-01"
}
```

**Success Response (200)**:
```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "active",
    "due_date": "2026-04-01"
  },
  "message": "Task activated"
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 400 | `validation_error` | "due_date is required to activate a task" | Highlight date picker |
| 403 | `limit_reached` | "Free tier limit of 15 active tasks reached. Upgrade to Pro for unlimited tasks." | Show upgrade prompt |
| 404 | `not_found` | "Task not found" | Show error toast |

**Post-Success Flow**:
1. Show toast: "Task activated"
2. Move task from Backlog to Active tab in local state
3. Switch to Active tab

---

### 3.7 Complete Task

**UI Action**: Click completion circle on task card, or "Mark as done" button
**Screen**: Active tab or task detail

```
POST /apps/tuskdue/tasks/{task_id}/complete
Authorization: Bearer {id_token}
```

**No request body required.**

**Success Response (200)**:
```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "completed_at": "2026-03-22T14:30:00Z"
  },
  "message": "Task completed"
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 404 | `not_found` | "Task not found" | Show error toast |

**Post-Success Flow**:
1. Animate task out of Active list (fade/slide)
2. Show toast: "Task completed" (with optional undo — re-activate via PUT)
3. Update active task count badge
4. If free tier, update "X of 15" counter

**Note**: Completing an already-completed task is idempotent — no error, task stays completed.

---

### 3.8 Snooze Task

**UI Action**: Select snooze duration from dropdown
**Screen**: Active tab or task detail

```
POST /apps/tuskdue/tasks/{task_id}/snooze
Authorization: Bearer {id_token}
Content-Type: application/json
```

**Request**:
```json
{
  "days": 3
}
```

| Field | Required | Type | Notes |
|-------|----------|------|-------|
| `days` | Yes | integer | Positive integer. Free: must be 1, 3, or 7. Pro: any positive integer. |

**Success Response (200)**:
```json
{
  "data": {
    "task_id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "snoozed",
    "snoozed_until": "2026-03-25"
  },
  "message": "Task snoozed for 3 days"
}
```

**Error Responses**:
| Status | Error Code | Message | UI Handling |
|--------|------------|---------|-------------|
| 400 | `validation_error` | "days must be a positive integer" | Show error toast |
| 400 | `validation_error` | "Free tier allows snoozing for 1, 3, or 7 days only" | Show upgrade prompt with snooze context |
| 404 | `not_found` | "Task not found" | Show error toast |

**Post-Success Flow**:
1. Update task in local state (status=snoozed, snoozed_until=date)
2. Show toast: "Task snoozed for 3 days"
3. Task visually moves to "Snoozed" group in Active tab (muted styling)

---

## 4. Action Links (Email → Browser)

### 4.1 Process Action Link

**UI Action**: User clicks action button in email (opens in browser)
**This is NOT called by the frontend app directly** — the browser navigates to this URL from the email.

```
GET /platform/actions/{token}
(no auth — the token IS the auth)
```

**Response Flows** (all are 302 redirects except invalid signature):

| Scenario | Redirect Location | UI Screen |
|----------|-------------------|-----------|
| Success | `{app_url}/action-result?status=success&message={url_encoded}` | Success confirmation |
| Already used | `{app_url}/action-result?status=already-used` | "Already processed" page |
| Expired | `{app_url}/action-result?status=expired` | "Link expired" page |
| App error | `{app_url}/action-result?status=error&message={url_encoded}` | Error page |
| Invalid signature | Returns 400 JSON (no redirect) | N/A (malformed URL) |

**Frontend Implementation**:
The frontend app must handle the `/action-result` route and render the appropriate confirmation screen based on the `status` query parameter. The `message` parameter (URL-decoded) provides context like "'Pay electric bill' marked complete."

**TuskDue-Specific Redirects** (from action handler):
- Complete → `https://app.tuskdue.com/done?task={task_id}`
- Snooze → `https://app.tuskdue.com/snoozed?task={task_id}&days={days}`

---

## 5. Payments

### 5.1 Initiate Checkout (Client-Side)

**UI Action**: User clicks pricing button ("$3/month", "$24/year", "$49 lifetime")
**Screen**: Settings → Subscription section

**This is NOT a backend API call.** Use Stripe.js on the client:
1. Create a Stripe Checkout session (via Stripe.js `redirectToCheckout`)
2. Include `metadata: { user_id, app_id }` so the webhook can identify the user
3. Set success/cancel URLs back to the frontend settings page

**Stripe Checkout Configuration**:
```javascript
const stripe = Stripe('pk_live_...');

stripe.redirectToCheckout({
  lineItems: [{ price: 'price_monthly_3', quantity: 1 }],
  mode: 'subscription',
  successUrl: 'https://app.tuskdue.com/settings?payment=success',
  cancelUrl: 'https://app.tuskdue.com/settings?payment=cancelled',
  clientReferenceId: userId,
  metadata: {
    user_id: userId,
    app_id: 'tuskdue'
  }
});
```

### 5.2 Payment Webhook (Server-Side Only)

**Not called by frontend.** The backend receives Stripe webhook events at:

```
POST /platform/payments/webhook
(no auth — Stripe signature verification)
```

**Events handled**:
| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set user's app tier to "pro" |
| `customer.subscription.deleted` | Revert to "free" |
| `customer.subscription.updated` | Update tier based on status (active=pro, else=free) |
| `invoice.payment_failed` | Log warning (no tier change) |

**Frontend Impact**: After successful payment, the settings page should re-fetch `GET /platform/settings` to reflect the updated tier. Poll or use a short delay (2-3 seconds) since the webhook may take a moment to process.

---

## 6. Push Notifications (Client-Side Setup)

### 6.1 Subscribe to Push

**UI Action**: User enables push notifications toggle
**Screen**: Settings → Push Notifications

**Client-Side Flow**:
1. Request browser notification permission
2. Get push subscription from service worker:
   ```javascript
   const registration = await navigator.serviceWorker.ready;
   const subscription = await registration.pushManager.subscribe({
     userVisibleOnly: true,
     applicationServerKey: VAPID_PUBLIC_KEY
   });
   ```
3. Send subscription to backend via settings update:
   ```
   PUT /platform/settings
   { "push_subscription": subscription.toJSON() }
   ```

### 6.2 Unsubscribe from Push

**UI Action**: User disables push notifications toggle

1. Unsubscribe from browser push
2. Clear subscription on backend:
   ```
   PUT /platform/settings
   { "push_subscription": null }
   ```

---

## 7. Tier Checking (Client-Side Logic)

The frontend needs to know the user's tier for each app to gate features. Tier info comes from the settings endpoint.

### How to Determine Tier

```javascript
// From GET /platform/settings response
const tuskdueTier = settings.apps.tuskdue?.tier || "free";  // Note: tier not in current response
const isFree = tuskdueTier === "free";
```

**Important**: The current `GET /platform/settings` response includes `enabled`, `frequency`, `preferred_day`, and `app_name` per app but the `tier` field needs to be confirmed in the actual response. The backend stores tier in the AppRegistration record.

### Features Gated by Tier

**TuskDue Free Tier Restrictions** (enforce in UI):
| Feature | Free | Pro |
|---------|------|-----|
| Active tasks | Max 15 | Unlimited |
| Snooze durations | 1, 3, 7 days only | Any positive integer |
| Heads-up reminders | Hidden | Visible |
| Custom snooze | Disabled | Enabled |
| Tags | Hidden | Enabled |

**Check active task count**: count tasks from `GET /apps/tuskdue/tasks?status=active` where `status` is "active" or "snoozed". Show "{count} of 15" indicator.

---

## 8. Request/Response Quick Reference

### All Endpoints Summary

| Method | Path | Auth | Request Body | Success Code |
|--------|------|------|-------------|--------------|
| POST | `/platform/auth/signup` | No | `{email, password}` | 201 |
| POST | `/platform/auth/login` | No | `{email, password}` | 200 |
| POST | `/platform/auth/magic-link` | No | `{email}` | 200 |
| POST | `/platform/auth/magic-link/verify` | No | `{email, code, session?}` | 200 |
| GET | `/platform/settings` | Yes | — | 200 |
| PUT | `/platform/settings` | Yes | `{timezone?, reminder_time?, push_subscription?, apps?}` | 200 |
| GET | `/platform/actions/{token}` | No | — | 302 |
| POST | `/platform/payments/webhook` | No* | Stripe event | 200 |
| GET | `/apps/tuskdue/tasks?status={s}` | Yes | — | 200 |
| POST | `/apps/tuskdue/tasks` | Yes | `{title, notes?, due_date?}` | 201 |
| GET | `/apps/tuskdue/tasks/{id}` | Yes | — | 200 |
| PUT | `/apps/tuskdue/tasks/{id}` | Yes | `{title?, notes?, due_date?, notify?}` | 200 |
| DELETE | `/apps/tuskdue/tasks/{id}` | Yes | — | 200 |
| POST | `/apps/tuskdue/tasks/{id}/activate` | Yes | `{due_date}` | 200 |
| POST | `/apps/tuskdue/tasks/{id}/complete` | Yes | — | 200 |
| POST | `/apps/tuskdue/tasks/{id}/snooze` | Yes | `{days}` | 200 |

*Auth = Cognito JWT Bearer token. Webhook uses Stripe signature verification.

### Common HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | Success | Most successful operations |
| 201 | Created | Signup, task creation |
| 302 | Redirect | Action link processing |
| 400 | Bad Request | Validation errors, missing fields |
| 401 | Unauthorized | Missing/invalid/expired token |
| 403 | Forbidden | Free tier limit exceeded |
| 404 | Not Found | Task/user not found |
| 405 | Method Not Allowed | Wrong HTTP method for route |
| 409 | Conflict | Email already exists (signup) |
