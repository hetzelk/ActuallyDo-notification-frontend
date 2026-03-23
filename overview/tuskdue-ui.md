# TuskDue UI Specification

**App tagline**: "A todo list that won't let you forget."
**Primary URL**: https://app.tuskdue.com
**Email FROM**: reminders@tuskdue.com

---

## 1. Dashboard / Task List

**Route**: `/` (default authenticated view)

**Layout**: Single-column list with tab navigation for task status. This is the primary screen users see when they open the app (though most users interact primarily via email).

### 1.1 Tab Navigation

**API Call per tab**: `GET /apps/tuskdue/tasks?status={status}` — see [api-integration.md §3.1](api-integration.md#31-list-tasks)

Three tabs at the top of the task list:

```
[ Active (12) ]  [ Backlog (6) ]  [ Completed ]
```

- **Active**: `?status=active` — returns both `active` AND `snoozed` tasks (the "nag list")
- **Backlog**: `?status=backlog` — tasks without due dates (the "I know" list)
- **Completed**: `?status=completed` — recently completed tasks (history view)
- Tab shows count badge from response `data.count` for Active and Backlog
- Active is the default selected tab
- Each tab triggers its own API call; cache results and invalidate on mutations

### 1.2 Active Tab

**Sort order**: by due_date ascending (most overdue first)

**Task card layout**:
```
┌─────────────────────────────────────────────┐
│  ○  Pay electric bill                       │
│     3 days overdue · Account #12345         │
│     [Done ✓]  [Snooze ▾]                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ○  Submit expense report                   │
│     Due today                               │
│     [Done ✓]  [Snooze ▾]                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  💤 Schedule dentist appointment            │
│     Snoozed until Mar 25                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  ○  Mom's birthday gift                     │
│     Due in 2 days                           │
│     [Done ✓]  [Snooze ▾]                   │
└─────────────────────────────────────────────┘
```

**Visual grouping** (optional headers within the list):
- **Overdue** — red/urgent styling (red dot or overdue badge)
- **Due Today** — standard styling
- **Snoozed** — muted/gray styling with snooze icon, no action buttons visible
- **Upcoming** — standard styling (Pro only: tasks within heads-up window)

**Task card elements**:
- **Completion circle**: clickable to mark done (tap/click = instant complete)
- **Title**: task title, truncated with ellipsis if long
- **Subtitle line**: due date context + optional notes preview
  - Overdue: "3 days overdue" (red text)
  - Due today: "Due today" (standard text)
  - Snoozed: "Snoozed until {date}" (gray text)
  - Upcoming: "Due in {N} days"
  - Future: "Due {formatted_date}"
- **Done button**: `POST /apps/tuskdue/tasks/{task_id}/complete` — see [api-integration.md §3.7](api-integration.md#37-complete-task)
  - No request body needed. Animate task out on 200, show toast "Task completed"
- **Snooze dropdown**: `POST /apps/tuskdue/tasks/{task_id}/snooze` with `{ "days": N }` — see [api-integration.md §3.8](api-integration.md#38-snooze-task)
  - Free: 1 day, 3 days, 7 days (server rejects other values with 400)
  - Pro: 1 day, 3 days, 7 days, Custom...
  - Custom (Pro): date picker or "N days" input
  - On 400 "Free tier allows snoozing for 1, 3, or 7 days only": show upgrade prompt

**Click behavior**: clicking the task card (not buttons) navigates to `/tasks/{task_id}` → calls `GET /apps/tuskdue/tasks/{task_id}` — see [api-integration.md §3.3](api-integration.md#33-get-single-task)

### 1.3 Backlog Tab

**Sort order**: by created_at descending (newest first)

**Task card layout**:
```
┌─────────────────────────────────────────────┐
│  Research new laptop options                │
│  Added Mar 15                               │
│  [Activate →]  [···]                        │
└─────────────────────────────────────────────┘
```

**Elements**:
- **Title**: task title
- **Subtitle**: "Added {date}"
- **Activate button**: opens date picker → `POST /apps/tuskdue/tasks/{task_id}/activate` with `{ "due_date": "YYYY-MM-DD" }` — see [api-integration.md §3.6](api-integration.md#36-activate-backlog-task)
  - On 403 `limit_reached`: show upgrade prompt
- **Overflow menu (···)**:
  - Edit → navigate to `/tasks/{task_id}`
  - Delete → confirmation dialog → `DELETE /apps/tuskdue/tasks/{task_id}` — see [api-integration.md §3.5](api-integration.md#35-delete-task)

**No completion circle** — backlog tasks can't be completed directly (must activate first, or complete from edit view).

### 1.4 Completed Tab

**Sort order**: by completed_at descending (most recently completed first)

**Task card layout**:
```
┌─────────────────────────────────────────────┐
│  ✓  Buy groceries                           │
│     Completed Mar 20                        │
└─────────────────────────────────────────────┘
```

**Elements**:
- **Checkmark icon**: filled/green
- **Title**: task title (with strikethrough or muted styling)
- **Subtitle**: "Completed {date}"
- No action buttons (completed is final in V1)

**Scope**: shows recent completions. Full searchable history is a Pro/V2 feature.

---

## 2. Add Task

### 2.1 Add Task Button

- **Floating action button (FAB)** on mobile: bottom-right, "+" icon
- **Inline button** on desktop: "+ Add task" at top of task list, below tabs
- Always visible regardless of active tab

### 2.2 Add Task Form

**Presentation**: modal/drawer on mobile, inline expansion or modal on desktop.

**Fields**:
```
┌─────────────────────────────────────────────┐
│  Add a task                                 │
│                                             │
│  Title *                                    │
│  ┌───────────────────────────────────────┐  │
│  │ What do you need to do?               │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Notes                                      │
│  ┌───────────────────────────────────────┐  │
│  │ Optional details...                   │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Due date                                   │
│  ┌───────────────────────────────────────┐  │
│  │ No date (goes to backlog)       [📅]  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Cancel]                    [Add task]      │
└─────────────────────────────────────────────┘
```

**Fields**:
- **Title** (required): single-line text, max 200 chars, auto-focus on open
- **Notes** (optional): multi-line textarea, max 1000 chars
- **Due date** (optional): date picker
  - If set: task created as `active` with `notify=true`
  - If not set: task created as `backlog` with `notify=false`
  - Only future dates or today allowed
  - Helper text: "Leave empty to add to your backlog"

**API Call**: `POST /apps/tuskdue/tasks` — see [api-integration.md §3.2](api-integration.md#32-create-task)
```
Request:  { "title": "...", "notes": "...", "due_date": "YYYY-MM-DD" }
Success (201): { "data": { "task_id": "uuid", "status": "active|backlog" }, "message": "Task created" }
Errors:   400 "Title is required" → highlight title field
          403 "Free tier limit of 15 active tasks reached..." → show upgrade prompt
```

**Behavior**:
- Submit via button or Cmd/Ctrl+Enter
- On 201: close modal, toast "Task created", refresh task list (or optimistic update)
  - If `due_date` was set → switch to Active tab
  - If no `due_date` → switch to Backlog tab
- On 403 `limit_reached`: show upgrade prompt inline (see platform-ui.md §4.2)
  - Only triggers when due_date is set (backlog tasks are unlimited)

### 2.3 Quick Add (shortcut)

On desktop, pressing "n" (with no input focused) opens the add task form with focus on the title field. This is a power-user shortcut — no onboarding tooltip needed.

---

## 3. Task Detail / Edit

**Route**: `/tasks/{task_id}`

**Presentation**: full-page on mobile, side panel or modal on desktop.

**Layout**:
```
┌─────────────────────────────────────────────┐
│  [← Back]                        [Delete 🗑] │
│                                             │
│  Title                                      │
│  ┌───────────────────────────────────────┐  │
│  │ Pay electric bill                     │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Notes                                      │
│  ┌───────────────────────────────────────┐  │
│  │ Account #12345, due by the 25th       │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Due date                                   │
│  ┌───────────────────────────────────────┐  │
│  │ March 19, 2026                  [📅]  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Notifications   [ON]                       │
│  Status: Active · 3 days overdue            │
│                                             │
│  [Mark as done ✓]    [Snooze ▾]             │
│                                             │
│  ─────────────────────────────────────────  │
│  Created: March 15, 2026                    │
└─────────────────────────────────────────────┘
```

**Fields** (all editable):
- **Title**: inline editable text
- **Notes**: inline editable textarea
- **Due date**: date picker (changing this on a backlog task activates it)
- **Notifications toggle**: on/off (only relevant when due date is set)

**API Calls**:
- **Load**: `GET /apps/tuskdue/tasks/{task_id}` — see [api-integration.md §3.3](api-integration.md#33-get-single-task)
- **Edit fields**: `PUT /apps/tuskdue/tasks/{task_id}` with changed fields only — see [api-integration.md §3.4](api-integration.md#34-update-task)
  ```
  Request: { "title"?, "notes"?, "due_date"?, "notify"? }  (send only what changed)
  Response (200): { "data": { ...full task object }, "message": "Task updated" }
  ```
- **Mark as done**: `POST /apps/tuskdue/tasks/{task_id}/complete` → navigate back to list, show toast
- **Snooze**: `POST /apps/tuskdue/tasks/{task_id}/snooze` with `{ "days": N }` → update local state, show toast
- **Delete**: confirmation dialog → `DELETE /apps/tuskdue/tasks/{task_id}` → navigate back, show toast "Task deleted"

**Auto-save**: debounce 500ms on field blur/change, send only changed fields via PUT. Show inline "Saved" that fades after 2s. On 404: show error toast, redirect to list.

**Status context line**: shows current status and relevant info
- Active + overdue: "Active · 3 days overdue" (red)
- Active + due today: "Active · Due today"
- Active + future: "Active · Due March 25"
- Snoozed: "Snoozed until March 25"
- Backlog: "In backlog · No due date set"
- Completed: "Completed March 20" (read-only view)

---

## 4. Free Tier Indicators

### 4.1 Task Counter

**How to determine tier**: `GET /platform/settings` → `apps.tuskdue.tier` ("free" or "pro")
**How to count active tasks**: from `GET /apps/tuskdue/tasks?status=active` → `data.count` (includes snoozed)

Visible on the Active tab header when on free tier:

```
Active (12 of 15)
```

Changes to warning color at 13+. At 15/15:

```
Active (15 of 15 — limit reached)
```

### 4.2 Limit Reached State

When trying to add a 16th active task or activate a backlog task at the limit:

```
┌─────────────────────────────────────────────┐
│  You've hit the free task limit             │
│                                             │
│  Free accounts can have up to 15 active     │
│  tasks. Complete or delete some tasks, or   │
│  upgrade to Pro for unlimited.              │
│                                             │
│  [Complete a task]    [Upgrade to Pro →]     │
└─────────────────────────────────────────────┘
```

### 4.3 Snooze Restriction

When a free-tier user clicks "Snooze", only 1/3/7 day options are shown. A muted "Custom snooze — Pro" option is shown but disabled:

```
┌─────────────────┐
│  Snooze 1 day   │
│  Snooze 3 days  │
│  Snooze 7 days  │
│  ─────────────  │
│  Custom… 🔒 Pro │
└─────────────────┘
```

### 4.4 Heads-Up Teaser

On the Active tab, if the user is free tier, subtly show a Pro teaser below the task list:

```
┌─────────────────────────────────────────────┐
│  🔒 Pro feature: Get reminded before tasks  │
│     are due with "Heads Up" alerts.         │
│     [Learn more →]                          │
└─────────────────────────────────────────────┘
```

---

## 5. Keyboard Shortcuts (Desktop)

| Key | Action |
|-----|--------|
| `n` | Open new task form |
| `Esc` | Close modal/drawer |
| `1` / `2` / `3` | Switch to Active / Backlog / Completed tab |
| `?` | Show keyboard shortcuts help |

---

## 6. Action Result Screens (TuskDue-specific)

These are the redirect destinations after email action links are processed.

### 6.1 Task Completed (`/done?task={id}`)

```
┌─────────────────────────────────────────────┐
│                    ✓                        │
│           "Pay electric bill"               │
│            marked complete.                 │
│                                             │
│  [Open TuskDue]         [Close tab]           │
└─────────────────────────────────────────────┘
```

### 6.2 Task Snoozed (`/snoozed?task={id}&days={n}`)

```
┌─────────────────────────────────────────────┐
│                   💤                        │
│        "Schedule dentist appointment"       │
│          snoozed for 3 days.                │
│       You'll be reminded on Mar 25.         │
│                                             │
│  [Open TuskDue]         [Close tab]           │
└─────────────────────────────────────────────┘
```

---

## 7. Screen Flow Summary

```
Login/Signup
    │
    ▼
Dashboard (Active tab)  ◄──── default landing
    │
    ├──► Add Task (modal/drawer)
    │       └──► Success → back to list
    │       └──► Free tier limit → upgrade prompt
    │
    ├──► Task Detail (click task)
    │       ├──► Edit fields (auto-save)
    │       ├──► Mark as done → back to list
    │       ├──► Snooze → back to list
    │       └──► Delete → confirmation → back to list
    │
    ├──► Backlog tab
    │       └──► Activate task → date picker → moves to Active
    │
    ├──► Completed tab
    │       └──► View-only history
    │
    └──► Settings (nav bar)
            ├──► Profile (timezone, reminder time)
            ├──► App preferences (frequency, enable/disable)
            └──► Subscription (upgrade/manage)

Email action links:
    ├──► /done?task={id}       → completion confirmation
    └──► /snoozed?task={id}    → snooze confirmation
```
