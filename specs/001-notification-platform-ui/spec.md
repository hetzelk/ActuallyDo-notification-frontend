# Feature Specification: ActuallyDo Notification Platform UI

**Feature Branch**: `001-notification-platform-ui`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "Build the full UI frontend for the ActuallyDo notification platform including shared platform components (auth, settings, navigation), NagMe task management app, and MilesAhead vehicle maintenance app"

## Assumptions

- The backend API is deployed separately (ActuallyDo-notification-backend repo) and accessed via a configurable base URL
- Both NagMe and MilesAhead apps live in this single repository under a shared codebase with app-specific routes
- Email templates are rendered server-side — this spec covers only the web UI
- Cognito handles user management — the frontend interacts via the backend's auth endpoints, not directly with Cognito
- All apps share a single user account (one login, one settings page, app-specific dashboards)
- No email verification step is required for MVP (auto-confirmed via Cognito)
- Push notifications and PWA features are included in the full spec but are progressive enhancements — the app works without them

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign Up and First Login (Priority: P1)

A new user discovers NagMe or MilesAhead and creates an account. They enter their email and password on the signup screen, are automatically logged in, and land on the app dashboard ready to use the product.

**Why this priority**: Without authentication, no other feature is accessible. This is the gateway to the entire platform.

**Independent Test**: Can be fully tested by navigating to `/signup`, creating an account, and verifying redirect to the dashboard with an authenticated session.

**Acceptance Scenarios**:

1. **Given** a user is on the signup page, **When** they enter a valid email and password and click "Sign up", **Then** they are redirected to the dashboard with a "Account created!" toast
2. **Given** a user is on the signup page, **When** they enter an email that already exists, **Then** they see an inline error "An account with this email may already exist"
3. **Given** a user is on the signup page, **When** they leave required fields empty, **Then** the empty fields are highlighted with validation errors
4. **Given** a user is on the login page, **When** they enter valid credentials and click "Login", **Then** they are redirected to the dashboard
5. **Given** a user is on the login page, **When** they enter invalid credentials, **Then** they see "Invalid email or password" below the form
6. **Given** an authenticated user, **When** their token expires and refresh fails, **Then** they are redirected to the login page

---

### User Story 2 - Magic Link Authentication (Priority: P2)

A returning user who doesn't remember their password uses the magic link flow. They enter their email, receive a 6-digit code, enter it, and are logged in without needing a password.

**Why this priority**: Provides a passwordless alternative that reduces login friction, but email/password login (US1) is sufficient for MVP.

**Independent Test**: Navigate to `/login/magic-link`, enter email, enter code on verification screen, verify redirect to dashboard.

**Acceptance Scenarios**:

1. **Given** a user is on the magic link screen, **When** they enter their email and click "Send magic link", **Then** they see a "Check your email" screen regardless of whether the email exists
2. **Given** a user is on the code verification screen, **When** they enter a valid 6-digit code, **Then** they are authenticated and redirected to the dashboard
3. **Given** a user is on the code verification screen, **When** they enter an invalid code, **Then** they see "Invalid or expired code" and the code input is cleared
4. **Given** a user has just requested a code, **When** they try to resend, **Then** they must wait 60 seconds before resending

---

### User Story 3 - NagMe Task Management (Priority: P1)

A user manages their todo list through NagMe. They can view active tasks (grouped by overdue, due today, snoozed, upcoming), add new tasks with optional due dates, complete tasks, snooze tasks for later, and manage a backlog of undated tasks.

**Why this priority**: This is the core product experience for NagMe — the primary app with a working backend. Users interact with tasks daily.

**Independent Test**: Log in, add a task with a due date, verify it appears in the Active tab, mark it as done, verify it moves to Completed tab.

**Acceptance Scenarios**:

1. **Given** an authenticated user on the Active tab, **When** the page loads, **Then** they see their active and snoozed tasks grouped by overdue/due today/snoozed/upcoming
2. **Given** an authenticated user, **When** they click "+ Add task" and fill in a title and due date, **Then** the task is created and appears in the Active tab
3. **Given** an authenticated user, **When** they add a task without a due date, **Then** the task is created in the Backlog tab
4. **Given** an active task, **When** the user clicks the completion circle or "Done" button, **Then** the task animates out and a "Task completed" toast appears
5. **Given** an active task, **When** the user selects a snooze duration (1, 3, or 7 days), **Then** the task moves to the Snoozed group with muted styling
6. **Given** a backlog task, **When** the user clicks "Activate" and selects a due date, **Then** the task moves to the Active tab
7. **Given** the Completed tab, **When** the page loads, **Then** the user sees recently completed tasks in reverse chronological order

---

### User Story 4 - NagMe Task Detail and Editing (Priority: P2)

A user clicks on a task to view and edit its details. They can change the title, notes, due date, and notification toggle. Changes auto-save with debounce. They can also delete a task from the detail view.

**Why this priority**: Editing is important but secondary to the core create/complete/snooze flow. Users can function with just the list view.

**Independent Test**: Click a task, edit its title, verify the change persists after navigating away and back.

**Acceptance Scenarios**:

1. **Given** a user clicks on a task card, **When** the detail view opens, **Then** they see the task's title, notes, due date, notification toggle, status, and creation date
2. **Given** a user edits a field, **When** they stop typing (500ms debounce), **Then** the change auto-saves and "Saved" appears briefly
3. **Given** a user clicks "Delete", **When** they confirm the deletion dialog, **Then** the task is deleted, they return to the list, and a "Task deleted" toast appears
4. **Given** a user on the detail view, **When** they click "Mark as done", **Then** the task is completed and they return to the list

---

### User Story 5 - Platform Settings (Priority: P2)

A user configures their profile settings (timezone, daily digest time), manages app preferences (enable/disable apps, set notification frequency), and views their subscription status.

**Why this priority**: Settings are needed for full functionality (email scheduling requires timezone + reminder time) but users can use the app with defaults initially.

**Independent Test**: Navigate to `/settings`, change timezone, verify "Saved" confirmation appears.

**Acceptance Scenarios**:

1. **Given** a user navigates to settings, **When** the page loads, **Then** they see their email (read-only), timezone selector, and reminder time picker
2. **Given** a user changes their timezone, **When** the debounce fires (500ms), **Then** settings auto-save and "Saved" appears
3. **Given** the settings page, **When** the user views "My Apps", **Then** they see cards for each registered app with enable/disable toggles, frequency dropdowns, and tier badges
4. **Given** a user's email has bounced, **When** they view settings, **Then** they see a warning banner about paused email notifications

---

### User Story 6 - Free Tier Limits and Upgrade Prompts (Priority: P2)

A free-tier NagMe user sees how many of their 15 active task slots are used. When they hit the limit, they see an upgrade prompt. Snooze options are restricted to 1/3/7 days with a locked "Custom" option showing a Pro badge.

**Why this priority**: Monetization is essential for the business but users can use the free tier fully before encountering limits.

**Independent Test**: Create 15 active tasks, attempt to create a 16th, verify the upgrade prompt appears.

**Acceptance Scenarios**:

1. **Given** a free-tier user on the Active tab, **When** they have 12 active tasks, **Then** the tab header shows "Active (12 of 15)"
2. **Given** a free-tier user with 15 active tasks, **When** they try to add a new active task, **Then** they see the "You've hit the free task limit" upgrade prompt
3. **Given** a free-tier user, **When** they open the snooze dropdown, **Then** they see 1/3/7 day options and a disabled "Custom... Pro" option
4. **Given** the settings subscription section, **When** a free user views it, **Then** they see pricing options ($3/month, $24/year, $49 lifetime) with upgrade buttons

---

### User Story 7 - Stripe Payment and Pro Upgrade (Priority: P3)

A user upgrades to Pro by clicking a pricing button, completing Stripe Checkout, and returning to the app with their tier updated. Pro users see a "Pro" badge and have access to unlimited tasks, custom snooze, and heads-up reminders.

**Why this priority**: Revenue-generating but not blocking core functionality. Free tier is fully usable.

**Independent Test**: Click upgrade button, complete Stripe Checkout (test mode), verify tier badge changes to "Pro" on return.

**Acceptance Scenarios**:

1. **Given** a free-tier user, **When** they click a pricing button, **Then** they are redirected to Stripe Checkout
2. **Given** a user completes Stripe Checkout, **When** they return to the app, **Then** settings re-fetch and show the updated "Pro" tier after a brief delay
3. **Given** a Pro user on settings, **When** they view subscription, **Then** they see their plan details, next billing date, and manage/cancel buttons

---

### User Story 8 - Action Result Pages (Priority: P2)

A user clicks an action link from a NagMe email (e.g., "Done" or "Snooze 3d") in their browser. The backend processes the action and redirects them to a confirmation screen showing the result (success, already used, expired, or error).

**Why this priority**: This is critical to the email-first experience — most users interact via email, not the web app. But it's a simple read-only screen.

**Independent Test**: Navigate to `/action-result?status=success&message=Task%20completed`, verify the success screen renders correctly.

**Acceptance Scenarios**:

1. **Given** a user clicks "Done" in an email, **When** the action succeeds, **Then** they see a green checkmark with "Done!" and the task-specific message
2. **Given** a user clicks an already-used action link, **When** the page loads, **Then** they see "Already processed" with an amber info icon
3. **Given** a user clicks an expired link, **When** the page loads, **Then** they see "Link expired" with a gray clock icon
4. **Given** an error occurs, **When** the page loads, **Then** they see "Something went wrong" with a red warning icon

---

### User Story 9 - MilesAhead Vehicle Dashboard (Priority: P3)

A user manages their vehicles in MilesAhead. They can view a list of vehicles with maintenance status summaries, add new vehicles with make/model/year/mileage, update odometer readings, and view vehicle details with maintenance items.

**Why this priority**: MilesAhead backend is not yet built (Phase 3). The UI can be built now but won't be functional until the backend is ready.

**Independent Test**: Navigate to the MilesAhead dashboard, add a vehicle, verify it appears in the vehicle list.

**Acceptance Scenarios**:

1. **Given** an authenticated MilesAhead user, **When** the dashboard loads, **Then** they see vehicle cards with name, estimated mileage, and maintenance status summary
2. **Given** no vehicles exist, **When** the dashboard loads, **Then** the user sees an empty state with "Add your first vehicle" CTA
3. **Given** a vehicle, **When** the user clicks "Update mileage", **Then** a modal appears with pre-filled estimated mileage for them to update
4. **Given** a vehicle detail page, **When** it loads, **Then** maintenance items are grouped by Overdue, Coming Up, and All Clear

---

### User Story 10 - MilesAhead Maintenance Logging (Priority: P3)

A user logs completed maintenance on a vehicle by entering the date, mileage at completion, and optional cost/shop details (Pro only). The maintenance item's next-due estimate resets based on the new completion data.

**Why this priority**: Dependent on MilesAhead backend (Phase 3). Core maintenance tracking flow.

**Independent Test**: Open a vehicle detail, click "Log as done" on a maintenance item, fill in the form, verify the item moves to "All Clear."

**Acceptance Scenarios**:

1. **Given** a maintenance item, **When** the user clicks "Log as done", **Then** a completion form appears with date (default today) and mileage (default estimated)
2. **Given** a free-tier user, **When** they view the completion form, **Then** cost and shop fields are visible but disabled with Pro badges
3. **Given** a completed log submission, **When** it succeeds, **Then** the item moves to "All Clear" and a confirmation toast appears

---

### User Story 11 - Push Notifications (Priority: P3)

A user enables push notifications from the settings page. The browser prompts for notification permission, a service worker subscribes to push, and the subscription is sent to the backend. Push notifications arrive even when the app is not open.

**Why this priority**: Progressive enhancement — the core experience works via email. Push adds real-time convenience.

**Independent Test**: Enable push toggle in settings, accept browser permission, verify subscription is sent to backend.

**Acceptance Scenarios**:

1. **Given** a user enables push toggle, **When** the browser prompts for permission and they accept, **Then** the subscription is saved to the backend and status shows "on"
2. **Given** a user disables push toggle, **When** they toggle off, **Then** the subscription is cleared from the backend
3. **Given** push is blocked in the browser, **When** the user views the push section, **Then** they see "Notifications are blocked in your browser"

---

### User Story 12 - PWA Installation (Priority: P3)

The app is installable as a Progressive Web App. Users can add it to their home screen. Offline mode shows cached data with an "You're offline" banner. The service worker handles push notification display.

**Why this priority**: Nice-to-have enhancement. The web app works fine in a browser tab.

**Independent Test**: Open the app in Chrome, verify the install prompt appears, install, verify it opens as a standalone app.

**Acceptance Scenarios**:

1. **Given** the app is loaded in a supported browser, **When** install criteria are met, **Then** the browser shows an install prompt
2. **Given** the user is offline, **When** they open the app, **Then** they see cached data with an "You're offline" banner
3. **Given** a push notification arrives, **When** the user clicks it, **Then** the app opens to the relevant screen

---

### Edge Cases

- What happens when the user's session expires mid-action (e.g., completing a task)? Token refresh should fire silently; if refresh fails, queue the action and redirect to login
- What happens when a user has both NagMe and MilesAhead enabled? The nav should show an app switcher to toggle between dashboards
- What happens when a free-tier user with 15 active tasks tries to activate a backlog task? The same upgrade prompt as adding a 16th active task
- What happens when settings auto-save fails? Show a persistent error toast with retry, revert the field to its previous value
- What happens when a user clicks an action link but the backend is down? The action-result page shows the error state
- What happens when the browser doesn't support push notifications? The push toggle should be hidden or show an unsupported message
- What happens when odometer reading is less than current known mileage? Show validation error — mileage can't go backwards

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create accounts with email and password
- **FR-002**: System MUST authenticate users via email/password login and return JWT tokens
- **FR-003**: System MUST support passwordless login via 6-digit magic link code
- **FR-004**: System MUST silently refresh auth tokens before expiry and redirect to login on refresh failure
- **FR-005**: System MUST display NagMe tasks in three tabs: Active (including snoozed), Backlog, and Completed
- **FR-006**: System MUST allow users to create tasks with a title (required), notes (optional), and due date (optional)
- **FR-007**: System MUST allow users to complete tasks with a single click and animate the task out of the list
- **FR-008**: System MUST allow users to snooze tasks for 1, 3, or 7 days (free tier) or custom durations (Pro tier)
- **FR-009**: System MUST allow users to activate backlog tasks by assigning a due date
- **FR-010**: System MUST allow users to edit task details (title, notes, due date, notify) with auto-save on 500ms debounce
- **FR-011**: System MUST allow users to delete tasks with a confirmation dialog
- **FR-012**: System MUST display user settings including timezone, reminder time, app preferences, and subscription status
- **FR-013**: System MUST auto-save settings changes with debounce and show inline "Saved" confirmation
- **FR-014**: System MUST enforce free-tier limits (15 active tasks for NagMe, 1 vehicle for MilesAhead) with upgrade prompts
- **FR-015**: System MUST redirect users to Stripe Checkout for Pro upgrades and reflect updated tier on return
- **FR-016**: System MUST render action result pages (success, already-used, expired, error) for email action link redirects
- **FR-017**: System MUST display MilesAhead vehicle dashboard with vehicle cards, mileage estimates, and maintenance status
- **FR-018**: System MUST allow users to add vehicles with year, make, model, nickname, odometer, and weekly miles estimate
- **FR-019**: System MUST allow users to update odometer readings via a quick check-in modal
- **FR-020**: System MUST display maintenance items grouped by urgency (overdue, coming up, all clear)
- **FR-021**: System MUST allow users to log maintenance completion with date, mileage, and optional cost/shop (Pro)
- **FR-022**: System MUST support push notification subscription/unsubscription via settings
- **FR-023**: System MUST be installable as a Progressive Web App with offline support and push notification handling
- **FR-024**: System MUST show a persistent navigation bar with app logo, settings access, user menu, and app switcher

### Key Entities

- **User**: Has an email, auth tokens, timezone, reminder time, push subscription, and one or more app registrations
- **App Registration**: Links a user to an app (NagMe, MilesAhead) with enabled status, notification frequency, preferred day, and tier (free/pro)
- **Task (NagMe)**: Has a title, notes, due date, status (active/snoozed/backlog/completed), notification toggle, snooze-until date, and timestamps
- **Vehicle (MilesAhead)**: Has year, make, model, nickname, current mileage, weekly miles estimate, mileage update timestamp, and associated maintenance items
- **Maintenance Item (MilesAhead)**: Has a name, mileage interval, time interval, last completed mileage/date, notification toggle, and completion log entries
- **Maintenance Log Entry (MilesAhead)**: Records a completion with date, mileage, cost (Pro), shop (Pro), and notes

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create an account and reach the dashboard in under 60 seconds
- **SC-002**: Users can add a task and see it in their list in under 10 seconds
- **SC-003**: Users can complete or snooze a task with a single click/tap
- **SC-004**: The app loads and displays task list within 1.5 seconds on first visit (LCP target)
- **SC-005**: The initial JavaScript bundle is under 150 KB gzipped
- **SC-006**: All interactive elements are accessible via keyboard navigation with visible focus indicators
- **SC-007**: All touch targets meet the 44x44px minimum on mobile devices
- **SC-008**: Settings changes persist immediately with visible confirmation (no manual save button)
- **SC-009**: Free-tier users see clear, non-intrusive upgrade prompts at limit boundaries
- **SC-010**: Action result pages render correctly for all four states (success, already-used, expired, error) from email links
- **SC-011**: The app is fully functional on mobile, tablet, and desktop viewports without horizontal scrolling
- **SC-012**: 90% of users can complete the primary task flow (add task → complete task) on their first attempt without assistance
