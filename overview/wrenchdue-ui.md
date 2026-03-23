# WrenchDue UI Specification

**App tagline**: "Your car's maintenance schedule, on autopilot."
**Primary URL**: https://app.wrenchdue.com
**Email FROM**: reminders@wrenchdue.com

---

## API Note

WrenchDue's backend routes are not yet implemented (Phase 3). The API patterns below follow the same conventions as TuskDue (`/apps/tuskdue/*`) and should be implemented under `/apps/wrenchdue/*`. All endpoints require Cognito JWT auth via the platform's `@require_auth` middleware.

**Expected base path**: `/apps/wrenchdue`

**Expected endpoints** (to be built):
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/apps/wrenchdue/vehicles` | List user's vehicles |
| POST | `/apps/wrenchdue/vehicles` | Create vehicle |
| GET | `/apps/wrenchdue/vehicles/{id}` | Get vehicle with maintenance items |
| PUT | `/apps/wrenchdue/vehicles/{id}` | Update vehicle |
| DELETE | `/apps/wrenchdue/vehicles/{id}` | Delete vehicle |
| PUT | `/apps/wrenchdue/vehicles/{id}/mileage` | Update odometer |
| GET | `/apps/wrenchdue/vehicles/{id}/items` | List maintenance items |
| POST | `/apps/wrenchdue/vehicles/{id}/items` | Add custom maintenance item (Pro) |
| PUT | `/apps/wrenchdue/vehicles/{id}/items/{item_id}` | Update maintenance item |
| DELETE | `/apps/wrenchdue/vehicles/{id}/items/{item_id}` | Delete custom item |
| POST | `/apps/wrenchdue/vehicles/{id}/items/{item_id}/complete` | Log maintenance completion |
| GET | `/apps/wrenchdue/vehicles/{id}/log` | Get maintenance history |

**Tier check**: `GET /platform/settings` → `apps.wrenchdue.tier` ("free" or "pro")

---

## 1. Dashboard / Vehicle List

**Route**: `/` (default authenticated view)

**Layout**: Card-based list of user's vehicles. For free tier users, this is a single card. Pro users see multiple vehicles.

**API Call**: `GET /apps/wrenchdue/vehicles` (auth required)

### 1.1 Vehicle Card

```
┌─────────────────────────────────────────────┐
│  🚗  2019 Honda Civic ("Daily Driver")      │
│      ~87,400 miles · Updated 3 days ago     │
│                                             │
│  ⚠ 1 overdue · 2 coming up                 │
│                                             │
│  [Update mileage]          [View details →] │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  🚗  2022 Toyota RAV4                       │
│      ~32,100 miles · Updated today          │
│                                             │
│  ✓ All caught up                            │
│                                             │
│  [Update mileage]          [View details →] │
└─────────────────────────────────────────────┘
```

**Elements per card**:
- **Vehicle icon**: generic car icon (or user-uploaded photo in V2)
- **Vehicle name**: "{year} {make} {model}" with optional nickname in quotes
- **Mileage line**: "~{estimated_mileage} miles · Updated {relative_time}"
  - The `~` indicates estimated mileage (between manual check-ins)
  - If mileage is stale (>14 days): show warning "Mileage may be inaccurate — update your odometer"
- **Status summary** (computed client-side from maintenance items):
  - Items overdue: "⚠ {N} overdue" (amber/red)
  - Items coming up: "{N} coming up"
  - All clear: "✓ All caught up" (green)
  - Overdue/upcoming calculation uses estimated mileage: `current_mileage + (days_since_update * weekly_miles_estimate / 7)`
- **Update mileage button**: opens quick mileage check-in modal → `PUT /apps/wrenchdue/vehicles/{id}/mileage`
- **View details**: navigates to `/vehicles/{vehicle_id}` → `GET /apps/wrenchdue/vehicles/{id}`

### 1.2 Add Vehicle Button

- **"+ Add vehicle" button**: below vehicle list
- Free tier with 1 vehicle already: button shows lock icon and "Pro" badge
  - Click shows upgrade prompt: "Free accounts support 1 vehicle. Upgrade to Pro for unlimited."

### 1.3 Empty State (no vehicles)

```
┌─────────────────────────────────────────────┐
│              🚗                              │
│                                             │
│     Add your first vehicle to get           │
│     started with maintenance tracking.      │
│                                             │
│     [+ Add vehicle]                         │
└─────────────────────────────────────────────┘
```

---

## 2. Add / Edit Vehicle

### 2.1 Add Vehicle Form

**Route**: `/vehicles/new`
**Presentation**: full page on mobile, modal on desktop.

```
┌─────────────────────────────────────────────┐
│  Add a vehicle                              │
│                                             │
│  Year *                                     │
│  ┌───────────────────────────────────────┐  │
│  │ 2019                                  │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Make *                                     │
│  ┌───────────────────────────────────────┐  │
│  │ Honda                                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Model *                                    │
│  ┌───────────────────────────────────────┐  │
│  │ Civic                                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Nickname (optional)                        │
│  ┌───────────────────────────────────────┐  │
│  │ Daily Driver                          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Current odometer reading (miles) *         │
│  ┌───────────────────────────────────────┐  │
│  │ 85,200                                │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  How many miles do you drive per week? *     │
│  ┌───────────────────────────────────────┐  │
│  │ 200                                   │  │
│  └───────────────────────────────────────┘  │
│  Used to estimate your mileage between      │
│  check-ins. You can update this anytime.    │
│                                             │
│  [Cancel]                [Add vehicle]       │
└─────────────────────────────────────────────┘
```

**Fields**:
- **Year** (required): numeric, 4 digits, 1980-current+1
- **Make** (required): text input (autocomplete from common makes list in V2)
- **Model** (required): text input
- **Nickname** (optional): text, max 50 chars
- **Current odometer** (required): numeric, comma-formatted display
- **Weekly miles estimate** (required): numeric, used for mileage projection
  - Helper text explains the purpose

**API Call**: `POST /apps/wrenchdue/vehicles` (auth required)
```
Request: {
  "year": 2019,
  "make": "Honda",
  "model": "Civic",
  "nickname": "Daily Driver",
  "current_mileage": 85200,
  "weekly_miles_estimate": 200
}
Success (201): { "data": { "vehicle_id": "uuid" }, "message": "Vehicle created" }
Errors: 400 (missing required fields)
        403 (free tier: already has 1 vehicle) → show upgrade prompt
```

**Post-creation behavior**:
- Server auto-populates default maintenance schedule (10 items)
- Redirect to vehicle detail showing "We've set up a default maintenance schedule. Review and adjust as needed."

### 2.2 Edit Vehicle

**API Call**: `PUT /apps/wrenchdue/vehicles/{vehicle_id}` — same fields as create, all optional.
**Delete**: `DELETE /apps/wrenchdue/vehicles/{vehicle_id}` — confirmation dialog required.

Same form as add, pre-filled. Additional "Delete vehicle" option at bottom with confirmation dialog.

---

## 3. Vehicle Detail

**Route**: `/vehicles/{vehicle_id}`

**Layout**: Vehicle header + maintenance items list + action buttons.

**API Calls**:
- Load vehicle: `GET /apps/wrenchdue/vehicles/{vehicle_id}`
- Load items: `GET /apps/wrenchdue/vehicles/{vehicle_id}/items`
- Load history: `GET /apps/wrenchdue/vehicles/{vehicle_id}/log`

### 3.1 Vehicle Header

```
┌─────────────────────────────────────────────┐
│  [← Vehicles]                     [Edit ✏️]  │
│                                             │
│  2019 Honda Civic                           │
│  "Daily Driver"                             │
│                                             │
│  ~87,400 miles                              │
│  Last updated: March 19, 2026 (3 days ago)  │
│  Weekly estimate: ~200 mi/week              │
│                                             │
│  [Update mileage]                           │
└─────────────────────────────────────────────┘
```

### 3.2 Maintenance Items List

**Tab navigation**:
```
[ Active (8) ]  [ Completed history ]
```

**Active tab — Maintenance items sorted by urgency**:

Visual groups within the list:

**Overdue items** (red/amber section):
```
┌─────────────────────────────────────────────┐
│  ⚠ OVERDUE                                 │
├─────────────────────────────────────────────┤
│  Oil + filter change                        │
│  Last: 82,100 mi (5,300 mi ago) · 6 mo ago │
│  Due every 5,000 mi or 6 months             │
│  [Log as done]                    [···]     │
├─────────────────────────────────────────────┤
│  Air filter (engine)                        │
│  Last: 72,000 mi (15,400 mi ago) · 14mo ago│
│  Due every 15,000 mi or 12 months           │
│  [Log as done]                    [···]     │
└─────────────────────────────────────────────┘
```

**Coming up** (standard section):
```
┌─────────────────────────────────────────────┐
│  COMING UP                                  │
├─────────────────────────────────────────────┤
│  Tire rotation                              │
│  Last: 81,000 mi (6,400 mi ago)             │
│  Due around 87,000-89,000 mi                │
│  [Log as done]                    [···]     │
└─────────────────────────────────────────────┘
```

**All clear** (green section):
```
┌─────────────────────────────────────────────┐
│  ✓ ALL CLEAR (5 items)                      │
├─────────────────────────────────────────────┤
│  Brake pads · Next ~107,000 mi              │
│  Transmission fluid · Next ~112,000 mi      │
│  Coolant flush · Next ~112,000 mi           │
│  Spark plugs · Next ~130,000 mi             │
│  Serpentine belt · Next ~145,000 mi         │
└─────────────────────────────────────────────┘
```

**Maintenance item card elements**:
- **Item name**: e.g., "Oil + filter change"
- **Last completed line**: "Last: {mileage} ({miles_ago} mi ago) · {time_ago}"
  - If never done: "Never completed"
- **Interval line**: "Due every {miles} mi or {months} months"
- **Next due estimate**: "Due around {mileage_range}" (based on estimation)
- **Log as done button**: opens completion form → `POST /apps/wrenchdue/vehicles/{vehicle_id}/items/{item_id}/complete`
- **Overflow menu (···)**:
  - Edit intervals → `PUT /apps/wrenchdue/vehicles/{vehicle_id}/items/{item_id}`
  - Disable notifications → same PUT with `{ "notify": false }`
  - Delete (Pro: custom items only) → `DELETE /apps/wrenchdue/vehicles/{vehicle_id}/items/{item_id}`

### 3.3 Completed History Tab

**Sort**: by completed_at descending.

```
┌─────────────────────────────────────────────┐
│  March 15, 2026                             │
│  Oil + filter change at 82,100 mi           │
│  $45.00 · Quick Lube on Main St             │
├─────────────────────────────────────────────┤
│  January 8, 2026                            │
│  Tire rotation at 81,000 mi                 │
│  $0.00 · Did it myself                      │
├─────────────────────────────────────────────┤
│  November 20, 2025                          │
│  Oil + filter change at 77,200 mi           │
│  $42.00 · Quick Lube on Main St             │
└─────────────────────────────────────────────┘
```

**API Call**: `GET /apps/wrenchdue/vehicles/{vehicle_id}/log`

**Elements per entry**:
- **Date**: `completed_at`
- **Item name + mileage**: "`{item_name}` at `{mileage_at_completion}` mi"
- **Cost + shop** (Pro): "$`{cost}` · `{shop}`"
- Free tier: shows basic history (date, item, mileage). Pro: adds cost + shop + notes + search.

### 3.4 Add Custom Maintenance Item (Pro)

**Button**: "+ Add maintenance item" below the items list. Free tier: locked with Pro badge.

```
┌─────────────────────────────────────────────┐
│  Add maintenance item                       │
│                                             │
│  Name *                                     │
│  ┌───────────────────────────────────────┐  │
│  │ Windshield wipers                     │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Mileage interval                           │
│  ┌───────────────────────────────────────┐  │
│  │ (leave blank for time-only)           │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Time interval (months)                     │
│  ┌───────────────────────────────────────┐  │
│  │ 12                                    │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Notes                                      │
│  ┌───────────────────────────────────────┐  │
│  │ Replace when streaking               │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Cancel]              [Add item]           │
└─────────────────────────────────────────────┘
```

At least one interval (mileage or time) is required.

**API Call**: `POST /apps/wrenchdue/vehicles/{vehicle_id}/items` (Pro only)
```
Request: {
  "name": "Windshield wipers",
  "interval_miles": null,
  "interval_months": 12,
  "notes": "Replace when streaking"
}
Success (201): { "data": { "item_id": "uuid" }, "message": "Maintenance item added" }
Errors: 400 (missing name or both intervals)
        403 (free tier) → show upgrade prompt
```

---

## 4. Mileage Check-In

### 4.1 Quick Check-In Modal

Triggered from vehicle card "Update mileage" button or from email prompt.

```
┌─────────────────────────────────────────────┐
│  Update your odometer                       │
│                                             │
│  2019 Honda Civic                           │
│  Current estimate: ~87,400 mi               │
│                                             │
│  Odometer reading *                         │
│  ┌───────────────────────────────────────┐  │
│  │ 87,650                                │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Update weekly estimate?                    │
│  Currently: 200 mi/week                     │
│  ┌───────────────────────────────────────┐  │
│  │ 200                                   │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Cancel]                    [Update]        │
└─────────────────────────────────────────────┘
```

**Fields**:
- **Odometer reading** (required): numeric input, pre-filled with current estimate
  - Validation: must be >= current known mileage (can't go backwards)
  - If significantly different from estimate: "That's {N} miles {more/less} than our estimate. We'll adjust your weekly estimate."
- **Weekly miles estimate** (optional): can update here for better future estimates

**API Call**: `PUT /apps/wrenchdue/vehicles/{vehicle_id}/mileage`
```
Request: {
  "current_mileage": 87650,
  "weekly_miles_estimate": 200
}
Success (200): { "message": "Mileage updated" }
Errors: 400 (mileage less than current known mileage)
```

**On submit**: server updates `current_mileage`, `mileage_updated_at`, optionally `weekly_miles_estimate`. Client recalculates all maintenance item due estimates using new mileage.

### 4.2 Stale Mileage Warning

If `mileage_updated_at` is >14 days ago, show a persistent banner on the vehicle detail page:

```
┌─────────────────────────────────────────────┐
│  ⚠ Your mileage hasn't been updated in     │
│  {N} days. Maintenance estimates may be     │
│  inaccurate.  [Update now]                  │
└─────────────────────────────────────────────┘
```

Also included as a prompt in the weekly email digest.

---

## 5. Log Maintenance Completion

### 5.1 Completion Form

Triggered from "Log as done" button on a maintenance item.

```
┌─────────────────────────────────────────────┐
│  Log maintenance                            │
│                                             │
│  Oil + filter change                        │
│  2019 Honda Civic                           │
│                                             │
│  Date completed *                           │
│  ┌───────────────────────────────────────┐  │
│  │ March 22, 2026              [📅]      │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Mileage at completion *                    │
│  ┌───────────────────────────────────────┐  │
│  │ 87,650                                │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Cost ($)                      🔒 Pro       │
│  ┌───────────────────────────────────────┐  │
│  │ 45.00                                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Shop / Location               🔒 Pro       │
│  ┌───────────────────────────────────────┐  │
│  │ Quick Lube on Main St                 │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  Notes                                      │
│  ┌───────────────────────────────────────┐  │
│  │ Used synthetic oil this time          │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [Cancel]              [Log completion]      │
└─────────────────────────────────────────────┘
```

**Fields**:
- **Date completed** (required): date picker, defaults to today
- **Mileage at completion** (required): numeric, defaults to current estimated mileage
  - Also updates the vehicle's `current_mileage` and `mileage_updated_at`
- **Cost** (Pro only): currency input. Free tier: field visible but disabled with Pro badge
- **Shop/Location** (Pro only): text input. Same treatment.
- **Notes** (optional): text

**API Call**: `POST /apps/wrenchdue/vehicles/{vehicle_id}/items/{item_id}/complete`
```
Request: {
  "completed_at": "2026-03-22",
  "mileage_at_completion": 87650,
  "cost": 45.00,
  "shop": "Quick Lube on Main St",
  "notes": "Used synthetic oil this time"
}
Success (200): {
  "data": { "log_id": "uuid" },
  "message": "Oil + filter change logged at 87,650 mi"
}
Errors: 400 (missing date or mileage)
```

**On submit**:
- Server creates a maintenance log entry
- Server updates the item's `last_completed_mileage` and `last_completed_date`
- Server updates vehicle mileage if entered mileage is newer than current
- Client: item moves from overdue/upcoming to "all clear", toast shown
- Cost/shop fields: server ignores for free tier (or returns 403 if enforced server-side)

---

## 6. Free Tier Indicators

### 6.1 Vehicle Limit

Dashboard shows vehicle count for free users:

```
Vehicles (1 of 1)  [+ Add vehicle 🔒]
```

### 6.2 Custom Items Lock

"+ Add maintenance item" button shows lock:

```
[+ Add maintenance item 🔒 Pro]
```

### 6.3 Cost Tracking Teaser

On the completion form, cost/shop fields are visible but disabled:

```
Cost ($)  🔒 Pro — track your maintenance spending
```

### 6.4 History Limit

Completed history tab shows last 10 entries for free users with a teaser:

```
┌─────────────────────────────────────────────┐
│  🔒 Upgrade to Pro for full maintenance     │
│  history with search and cost totals.       │
│  [Upgrade →]                                │
└─────────────────────────────────────────────┘
```

---

## 7. Action Result Screens (WrenchDue-specific)

### 7.1 Maintenance Logged (`/done?item={id}&vehicle={id}`)

```
┌─────────────────────────────────────────────┐
│                    ✓                        │
│      Oil + filter change logged             │
│      2019 Honda Civic at ~87,400 mi         │
│                                             │
│  [Open WrenchDue]      [Close tab]         │
└─────────────────────────────────────────────┘
```

### 7.2 Mileage Updated (`/checkin?vehicle={id}`)

```
┌─────────────────────────────────────────────┐
│                    ✓                        │
│      Mileage updated to 87,650 mi           │
│      2019 Honda Civic                       │
│                                             │
│  [Open WrenchDue]      [Close tab]         │
└─────────────────────────────────────────────┘
```

---

## 8. Screen Flow Summary

```
Login/Signup (shared platform)
    │
    ▼
Dashboard (Vehicle list)  ◄──── default landing
    │
    ├──► Add Vehicle (form)
    │       └──► Success → Vehicle Detail with default schedule
    │       └──► Free tier limit → upgrade prompt
    │
    ├──► Vehicle Detail (click vehicle card)
    │       │
    │       ├──► Active tab (maintenance items by urgency)
    │       │       ├──► Log as done → completion form → resets interval
    │       │       ├──► Edit item intervals (overflow menu)
    │       │       └──► Add custom item (Pro)
    │       │
    │       ├──► Completed history tab
    │       │       └──► View past completions (limited for free)
    │       │
    │       ├──► Update mileage (modal)
    │       │       └──► Recalculates all due estimates
    │       │
    │       └──► Edit vehicle (header action)
    │               └──► Edit details / Delete vehicle
    │
    └──► Settings (nav bar, shared platform)

Email action links:
    ├──► /done?item={id}        → maintenance logged confirmation
    └──► /checkin?vehicle={id}  → mileage update confirmation
```
