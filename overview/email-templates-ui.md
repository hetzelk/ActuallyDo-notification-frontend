# Email Template UI Specification

Design specs for the digest emails sent by each app. The email IS the primary product interface — most users act from the email, not the web app.

---

## Design Principles

1. **Scannable from preview**: subject line shows the count, first line shows the most urgent item
2. **No empty emails**: if nothing is actionable, don't send
3. **One email per app**: TuskDue and WrenchDue send separately with different branding
4. **Action links just work**: one click, no login, instant feedback
5. **Mobile-first**: most emails read on phones — single column, large tap targets
6. **Consolidated, not spammy**: all items grouped in one email, never per-item

---

## Shared Email Structure

All app emails follow the same structural template (rendered by the platform's Jinja2 `digest.html`):

```
┌─────────────────────────────────────────────┐
│                                             │
│  [App Logo/Name]                            │
│                                             │
│  ═══════════════════════════════════════     │
│                                             │
│  Section Heading (count)                    │
│  ─────────────────────────────────────      │
│  Item title                                 │
│  Subtitle / context line                    │
│  [Action 1]  [Action 2]  [Action 3]         │
│                                             │
│  Item title                                 │
│  Subtitle / context line                    │
│  [Action 1]  [Action 2]                     │
│                                             │
│  ═══════════════════════════════════════     │
│                                             │
│  Section Heading                            │
│  ─────────────────────────────────────      │
│  Item title                                 │
│  Subtitle / context line                    │
│                                             │
│  ═══════════════════════════════════════     │
│                                             │
│  [Footer links]                             │
│  Manage preferences · Unsubscribe           │
│                                             │
└─────────────────────────────────────────────┘
```

### Shared Template Rules

- **Max width**: 600px (email standard)
- **Font**: system font stack (Arial, Helvetica, sans-serif)
- **Background**: white (#FFFFFF) content area, light gray (#F5F5F5) outer
- **Section headings**: bold, uppercase or semi-bold, with count when applicable
- **Action buttons**: inline-block, blue (#2563EB) background, white text, rounded corners, minimum 44px height for tap targets
- **Footer**: smaller text, muted gray (#6B7280), includes "Manage preferences" link (signed URL to settings page)

---

## TuskDue Email Template

### Subject Line

Format depends on content:
- Items due: **"You have {N} things to deal with"**
- All overdue: **"{N} overdue tasks need attention"**
- Only due today: **"{N} tasks due today"**
- Single item: **"Reminder: {task_title}"**

### Preview Text (preheader)

First overdue item title, or first due-today item if nothing overdue.

### Email Body

```
┌─────────────────────────────────────────────┐
│                                             │
│  TuskDue                                      │
│  Your daily reminder                        │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  OVERDUE (2)                                │
│                                             │
│  Pay electric bill                          │
│  3 days overdue · Account #12345            │
│  [Done ✓]  [Snooze 1d]  [Snooze 3d]        │
│            [Snooze 7d]                      │
│                                             │
│  Schedule dentist appointment               │
│  1 day overdue                              │
│  [Done ✓]  [Snooze 1d]  [Snooze 3d]        │
│            [Snooze 7d]                      │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  DUE TODAY (1)                              │
│                                             │
│  Submit expense report                      │
│  Due today                                  │
│  [Done ✓]  [Snooze 1d]                     │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  HEADS UP (1)                    🔒 Pro     │
│                                             │
│  Mom's birthday gift                        │
│  Due in 2 days                              │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  [+ Add a task]  [View backlog (6 items)]   │
│                                             │
│  ─────────────────────────────────────────  │
│  Manage preferences · Sent by TuskDue        │
│  You're receiving this because you signed   │
│  up at tuskdue.com                            │
│                                             │
└─────────────────────────────────────────────┘
```

### Section Details

**Overdue section**:
- Heading: "OVERDUE ({count})" — bold, red (#DC2626) or dark red text
- Items sorted by due_date ascending (most overdue first)
- Subtitle: "{N} day(s) overdue" + optional notes preview (truncated at 60 chars)
- Actions: Done, Snooze 1d, Snooze 3d, Snooze 7d
  - Each is a signed action link (GET request, no login needed)
  - Button styling: "Done" = green/primary, Snooze = secondary/outline

**Due Today section**:
- Heading: "DUE TODAY ({count})" — bold, standard color
- Items sorted by title alphabetically
- Subtitle: "Due today"
- Actions: Done, Snooze 1d (only 1-day snooze since it's not overdue yet)

**Heads Up section** (Pro only):
- Heading: "HEADS UP" — bold, muted/gray
- Items within the heads-up window (1-3 days before due, configurable)
- Subtitle: "Due in {N} days"
- No action buttons — awareness only
- Not shown for free tier users

**Footer links**:
- "+ Add a task" → deep link to `https://app.tuskdue.com/tasks/new`
- "View backlog ({N} items)" → deep link to `https://app.tuskdue.com/?tab=backlog`
- "Manage preferences" → signed link to settings page (no login required)

### Action Button Layout

Buttons wrap naturally on mobile. Each button has:
- Minimum width: 80px
- Padding: 10px 16px
- Margin between buttons: 8px
- Font size: 14px

```
Desktop layout:     [Done ✓]  [Snooze 1d]  [Snooze 3d]  [Snooze 7d]

Mobile layout:      [Done ✓]  [Snooze 1d]
                    [Snooze 3d]  [Snooze 7d]
```

---

## WrenchDue Email Template

### Subject Line

Format depends on content:
- Items due: **"Your {vehicle_name} has {N} maintenance items to deal with"**
- Multiple vehicles: **"You have {N} maintenance items across {V} vehicles"**
- Single item: **"{item_name} is due on your {vehicle_name}"**
- Mileage prompt: **"Quick check-in: what's your odometer at?"**

### Preview Text (preheader)

Most urgent overdue item and vehicle name.

### Email Body

```
┌─────────────────────────────────────────────┐
│                                             │
│  WrenchDue                                 │
│  Your weekly maintenance check              │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  2019 HONDA CIVIC (~87,400 miles)           │
│                                             │
│  OVERDUE                                    │
│                                             │
│  Oil + filter change                        │
│  Last: 82,100 mi (5,300 mi ago) · 6 mo ago │
│  [Log as done]  [Snooze 2 weeks]            │
│                                             │
│  COMING UP                                  │
│                                             │
│  Tire rotation                              │
│  Last: 81,000 mi (6,400 mi ago)             │
│  Due around 87,000-89,000 mi                │
│  [Log as done]  [Snooze 2 weeks]            │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  2022 TOYOTA RAV4 (~32,100 miles)           │
│                                             │
│  ✓ All caught up — no maintenance due       │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  📍 UPDATE YOUR ODOMETER                    │
│  Your mileage was last updated 7 days ago.  │
│  [Quick check-in →]                         │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  💡 Tip: Keeping your oil fresh is the      │
│  single most impactful thing you can do     │
│  to reach 300,000 miles.                    │
│                                             │
│  ─────────────────────────────────────────  │
│  Manage preferences · Sent by WrenchDue    │
│                                             │
└─────────────────────────────────────────────┘
```

### Section Details

**Per-vehicle sections**:
- Heading: "{YEAR} {MAKE} {MODEL} (~{estimated_miles} miles)" — bold, uppercase
- Sub-grouped by urgency: Overdue, Coming Up, All Clear

**Overdue items**:
- Red/amber indicator
- "Last: {mileage} ({miles_ago} mi ago) · {time_ago}"
- Actions: "Log as done" (opens completion form in app), "Snooze 2 weeks"

**Coming up items**:
- Standard color
- "Last: {mileage} ({miles_ago} mi ago)"
- "Due around {mileage_range}" (e.g., "87,000-89,000 mi")
- Actions: "Log as done", "Snooze 2 weeks"

**All clear** (vehicle with nothing due):
- Green checkmark: "✓ All caught up — no maintenance due"
- No action buttons

**Odometer check-in prompt**:
- Shown if mileage hasn't been updated in >7 days
- "Quick check-in" links to mileage update page (signed link, no login)
- Only shown once per email, after all vehicles

**Maintenance tips**:
- Optional rotating tips (1 per email, curated content)
- Light gray background, italic text
- Adds personality and value beyond just reminders

### Action Button Layout

Simpler than TuskDue — fewer actions per item:

```
[Log as done]  [Snooze 2 weeks]
```

- "Log as done" = primary button (blue)
- "Snooze 2 weeks" = secondary button (outline/gray)

---

## Email Rendering Rules

### Platform-level (applies to all apps)

1. **No images required**: emails must render fully without images (many clients block by default)
2. **Inline CSS only**: no external stylesheets (email clients strip `<link>` and `<style>` in `<head>`)
3. **Table-based layout**: for consistent rendering across Outlook, Gmail, Apple Mail
4. **Dark mode support**: include `@media (prefers-color-scheme: dark)` with inverted colors where supported
5. **Plain text fallback**: auto-generated text version for clients that don't render HTML
6. **Unsubscribe header**: `List-Unsubscribe` header pointing to settings page (required by Gmail/Yahoo 2024+ sender requirements)
7. **Maximum email size**: keep under 102KB (Gmail clips larger emails with "View entire message")

### Action Link Behavior

Each action button is an `<a>` tag pointing to:
```
https://{api-base}/platform/actions/{signed_jwt_token}
```

The token encodes:
- `user_id`: who the action is for
- `app_id`: which app handles it
- `action`: what to do (e.g., "complete", "snooze")
- `payload`: action-specific data (e.g., `{"task_id": "...", "days": 3}`)
- `exp`: 7-day expiry
- `jti`: unique token ID for single-use enforcement

On click:
1. Browser sends GET to the action URL
2. Platform validates token, calls app's action handler
3. Redirects to app's result page (success/already-used/expired)
4. User sees confirmation screen in browser

### Footer Link: Manage Preferences

Links to `https://app.{appname}.com/settings` with a signed auth token in the URL. This allows users to manage notification frequency, disable apps, or unsubscribe — all without logging in.

---

## Email Frequency Summary

| App | Default Frequency | Options | Empty Email |
|-----|-------------------|---------|-------------|
| TuskDue | Daily | Daily only (V1) | Not sent |
| WrenchDue | Weekly | Weekly, Monthly | Not sent |

"Not sent" means: if the digest builder returns `empty=True` (no actionable items), the orchestrator skips email delivery for that app. The user never receives a "nothing to report" email.
