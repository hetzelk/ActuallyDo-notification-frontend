# Platform UI Specification

Shared screens and components used across all apps on the notification platform.

---

## 1. Authentication Screens

### 1.1 Login Screen

**Route**: `/login`

**Layout**: Centered card on a minimal background. Platform-branded (not app-branded — login is shared).

**Elements**:
- Logo/brand mark: "ActuallyDo" or neutral platform identity
- **Email field**: text input, placeholder "you@example.com", email validation
- **Password field**: password input with show/hide toggle
- **Login button**: primary action, full-width within card
- **"Forgot password?" link**: below password field, right-aligned
- **"Sign in with magic link" link**: below login button — switches to Magic Link flow
- **"Don't have an account? Sign up" link**: bottom of card

**States**:
- Default: empty form
- Loading: button shows spinner, inputs disabled
- Error: inline error message below form ("Invalid email or password")
- Network error: toast notification ("Something went wrong. Please try again.")

**API Call**: `POST /platform/auth/login` — see [api-integration.md §1.2](api-integration.md#12-log-in)
```
Request:  { "email": "...", "password": "..." }
Success (200): { "id_token", "access_token", "refresh_token", "expires_in" }
Errors:   400 (missing fields) → highlight empty fields
          401 (invalid credentials) → inline error "Invalid email or password"
```

**Behavior**:
- On success: store all three tokens + expiry timestamp, redirect to dashboard
- Token refresh happens silently via refresh_token before expiry
- If refresh fails, redirect to login

---

### 1.2 Signup Screen

**Route**: `/signup`

**Layout**: Same centered card as login.

**Elements**:
- **Email field**: text input with email validation
- **Password field**: password input with requirements hint below
  - Hint text: "At least 8 characters"
- **Confirm password field**: must match password
- **Sign up button**: primary action, full-width
- **"Already have an account? Log in" link**: bottom of card

**States**:
- Validation: real-time validation on blur (email format, password strength, match)
- Error 409: "An account with this email already exists" (generic for security)
- Success: redirect to app dashboard with success toast "Account created!"

**API Call**: `POST /platform/auth/signup` — see [api-integration.md §1.1](api-integration.md#11-sign-up)
```
Request:  { "email": "...", "password": "..." }
Success (201): { "user_id", "message": "Account created" }
Errors:   400 (missing fields) → highlight empty fields
          409 (email exists) → inline error "An account with this email may already exist"
```

**Post-signup behavior**:
- Server: user profile created with defaults, default-enabled apps auto-registered
- Client: immediately call `POST /platform/auth/login` with same credentials to get tokens
- Redirect to dashboard with toast "Account created!"
- No email verification step required in MVP (auto-confirmed via Cognito)

---

### 1.3 Magic Link Flow

**Route**: `/login/magic-link`

**Screen 1 — Request**:
- **Email field**: text input
- **"Send magic link" button**: primary action
- **API Call**: `POST /platform/auth/magic-link` — `{ "email": "..." }` → always 200
- On submit: always shows success message regardless of whether email exists (prevents enumeration)

**Screen 2 — Check Email**:
- Illustration or icon (email/inbox)
- "Check your email" heading
- "We sent a sign-in code to {email}. Enter it below."
- **6-digit code input**: auto-focus, large font, numeric-only
- **"Resend code" link**: with cooldown timer (60 seconds)
- **"Back to login" link**

**API Call**: `POST /platform/auth/magic-link/verify` — `{ "email", "code", "session?" }` → tokens on success

**States**:
- Code input: auto-submit when 6 digits entered
- Invalid code (401): "Invalid or expired code. Please try again." — clear code input, allow retry
- Success (200): store tokens (id_token, access_token, refresh_token), redirect to dashboard

---

## 2. Settings Screen

**Route**: `/settings`

**Layout**: Full-page layout with sections. Scrollable on mobile.

### 2.1 Profile Section

**Heading**: "Profile"

**Fields**:
- **Email**: read-only display (not editable in V1)
- **Timezone**: searchable dropdown/select
  - Default from browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`
  - Shows current selection with offset, e.g. "America/New_York (UTC-5)"
- **Reminder time**: time picker (HH:MM format)
  - Default: "09:00"
  - Label: "Send my daily digest at"
  - Helper text: "Emails arrive within a few minutes of this time"

**API Calls**:
- Load: `GET /platform/settings` — see [api-integration.md §2.1](api-integration.md#21-get-settings)
- Save: `PUT /platform/settings` — see [api-integration.md §2.2](api-integration.md#22-update-settings)
```
GET  Response: { timezone, reminder_time, push_subscription, email_disabled, apps: {...} }
PUT  Request:  { timezone?, reminder_time?, push_subscription?, apps?: {...} }
PUT  Response: { "message": "Settings updated" }
Errors: 400 "Invalid timezone" | "Invalid reminder_time, expected HH:MM"
```

**Save behavior**: auto-save on change with debounce (500ms). Send only changed fields via PUT. Show inline confirmation "Saved" that fades after 2 seconds.

**Side effects displayed**: If timezone or reminder_time changes, server creates/updates EventBridge schedule. Show subtle note: "Your email schedule has been updated."

**Important**: If `email_disabled` is true in GET response, show warning banner: "Email notifications are paused because a previous email bounced. Contact support to re-enable."

---

### 2.2 App Preferences Section

**Heading**: "My Apps"

For each registered app, show a card:

```
┌─────────────────────────────────────────────┐
│  [App Icon]  NagMe                    [ON]  │
│  Todo reminders that nag until done         │
│                                             │
│  Frequency:  [Daily ▾]                      │
│  Tier:       Free  [Upgrade to Pro →]       │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  [App Icon]  MilesAhead               [ON]  │
│  Car maintenance reminders                  │
│                                             │
│  Frequency:  [Weekly ▾]                     │
│  Preferred day: [Monday ▾]                  │
│  Tier:       Pro ✓                          │
└─────────────────────────────────────────────┘
```

**Elements per app card** (populated from `GET /platform/settings` → `apps.{app_id}`):
- **App name + description**: from `app_name` field (static text)
- **Enable/disable toggle**: maps to `apps.{app_id}.enabled` — saves via `PUT /platform/settings { apps: { nagme: { enabled: true/false } } }`
- **Frequency dropdown**: maps to `apps.{app_id}.frequency` — valid values: "daily", "weekly", "monthly"
  - When "weekly" selected: show "Preferred day" dropdown → `preferred_day` (Monday-Sunday)
  - When "monthly" selected: show "Preferred day" dropdown → `preferred_day` (1st, 15th)
- **Tier badge**: from `apps.{app_id}.tier` — "Free" or "Pro"
  - If Free: show "Upgrade to Pro" link/button → triggers Stripe Checkout
  - If Pro: show green checkmark and "Pro" badge

---

### 2.3 Push Notifications Section

**Heading**: "Push Notifications"

**API**: Push subscription is stored/cleared via `PUT /platform/settings { push_subscription: {...} | null }` — see [api-integration.md §6](api-integration.md#6-push-notifications-client-side-setup)

**Elements**:
- **Enable push toggle**: triggers browser notification permission prompt
  - On enable: get subscription from service worker → send to backend via PUT
  - On disable: unsubscribe from browser push → send `{ push_subscription: null }` via PUT
- **Status indicator** (derive from `GET /platform/settings` → `push_subscription`):
  - `push_subscription === null`: "Push notifications are off"
  - `push_subscription !== null`: "Push notifications are on" with green indicator
  - Browser permission denied: "Notifications are blocked in your browser. Update your browser settings to enable."

---

### 2.4 Subscription / Billing Section

**Heading**: "Subscription"

**Free state**:
```
┌─────────────────────────────────────────────┐
│  You're on the Free plan                    │
│                                             │
│  Upgrade to Pro for $3/month to unlock:     │
│  • Unlimited tasks & vehicles               │
│  • Pre-due "heads up" reminders             │
│  • Custom snooze durations                  │
│  • Push notifications                       │
│  • And more across all apps                 │
│                                             │
│  [$3/month]  [$24/year — save 33%]          │
│              [$49 lifetime]                 │
└─────────────────────────────────────────────┘
```

**Pro state**:
```
┌─────────────────────────────────────────────┐
│  Pro Plan ✓                                 │
│  Billed monthly — $3/month                  │
│  Next billing date: April 21, 2026          │
│                                             │
│  [Manage subscription]  [Cancel]            │
└─────────────────────────────────────────────┘
```

**Payment flow** (see [api-integration.md §5](api-integration.md#5-payments)):
1. User clicks pricing button → client-side Stripe.js `redirectToCheckout()` with `metadata: { user_id, app_id }`
2. Stripe hosts the checkout page (no backend call needed from frontend)
3. On success: Stripe redirects to `?payment=success`, webhook updates tier server-side
4. Frontend: re-fetch `GET /platform/settings` after redirect to reflect updated tier (add 2-3s delay for webhook processing)

---

## 3. Action Result Pages

These pages are shown after a user clicks an action link from an email. They are simple, single-purpose confirmation screens.

**Route**: `/action-result?status={status}&message={message}`

**How users arrive here**: User clicks action button in email → browser hits `GET /platform/actions/{token}` → server validates token, calls app's action handler, returns 302 redirect to this route. See [api-integration.md §4](api-integration.md#4-action-links-email--browser).

**Query params to handle**: `status` (success|already-used|expired|error), `message` (URL-encoded, optional)

### 3.1 Success

- Green checkmark icon (large)
- Heading: "Done!"
- Message: dynamic from URL param (e.g., "'Pay electric bill' marked complete.")
- **"Open NagMe" button** (or relevant app)
- Auto-close hint: "You can close this tab."

### 3.2 Already Used

- Orange/amber info icon
- Heading: "Already processed"
- Message: "This action was already completed. Each link can only be used once."
- **"Open {App Name}" button**

### 3.3 Expired

- Gray clock icon
- Heading: "Link expired"
- Message: "This action link has expired. Please use a more recent email or complete the action in the app."
- **"Open {App Name}" button**

### 3.4 Error

- Red warning icon
- Heading: "Something went wrong"
- Message: "We couldn't process this action. Please try again from the app."
- **"Open {App Name}" button**

---

## 4. Shared Components

### 4.1 Navigation

**Top bar** (persistent across all authenticated pages):
- Left: App logo/name (links to dashboard)
- Right: Settings gear icon + user email/avatar dropdown
- Dropdown menu: Settings, Switch App (if multiple enabled), Sign Out

**App switcher** (if user has multiple apps enabled):
- Accessible from nav dropdown or a tab/pill selector
- Shows enabled apps with icons
- Current app highlighted

### 4.2 Upgrade Prompts

Shown inline when a user hits a free-tier limitation:

```
┌─────────────────────────────────────────────┐
│  ⬆ You've reached the free tier limit       │
│  Upgrade to Pro for unlimited {feature}.    │
│  [Upgrade — $3/month]                       │
└─────────────────────────────────────────────┘
```

Context-specific examples:
- NagMe: "You've reached 15 active tasks. Upgrade to Pro for unlimited tasks."
- MilesAhead: "Free accounts support 1 vehicle. Upgrade to Pro for unlimited vehicles."
- Snooze: "Custom snooze durations are a Pro feature. Upgrade to set any number of days."

### 4.3 Toast Notifications

- Position: top-right or bottom-center
- Types: success (green), error (red), info (blue), warning (amber)
- Auto-dismiss after 4 seconds (errors persist until dismissed)
- Examples: "Settings saved", "Task created", "Something went wrong"

### 4.4 Empty States

Every list view has a designed empty state:
- Relevant illustration or icon
- Descriptive heading
- Actionable CTA button
- Example: "No tasks yet. Add your first task to get started." [+ Add task]

### 4.5 Loading States

- Initial page load: skeleton screens (not spinners)
- Action loading: button spinner with disabled state
- List loading: skeleton rows matching expected content shape

### 4.6 Responsive Design

- **Desktop**: max-width container (800-1000px), centered
- **Tablet**: full-width with padding
- **Mobile**: full-width, stacked layouts, bottom-sheet modals instead of dropdowns
- Breakpoints: 640px (mobile), 768px (tablet), 1024px (desktop)
- Touch targets: minimum 44x44px on mobile

---

## 5. PWA Requirements

- **Installable**: manifest.json with app name, icons, theme color per app
- **Offline**: show cached data with "You're offline" banner
- **Service worker**: handles push notification display and click-to-open
- **Home screen**: each app installable separately (separate manifests per frontend)
