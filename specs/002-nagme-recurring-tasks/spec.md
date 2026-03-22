# Feature Specification: NagMe Recurring Tasks

**Feature Branch**: `002-nagme-recurring-tasks`
**Created**: 2026-03-22
**Status**: Draft
**Input**: User description: "Add recurring/repeating tasks to NagMe so users can be reminded about repeating obligations like monthly bills, weekly chores, and annual renewals."

## Assumptions

- Recurring tasks build on the existing NagMe task model — a recurring task is a regular task with additional recurrence metadata
- When a recurring task is completed, the system (backend) automatically creates the next occurrence with the correct future due date — the frontend does not create the next task itself
- Recurrence is anchored to the original schedule, not the completion date. Example: a monthly task due on the 1st that is completed late on the 10th still generates the next occurrence for the 1st of the following month
- Snoozing a recurring task only affects the current occurrence — completing it still generates the next occurrence on the original schedule
- This is a cross-repository feature: the backend (ActuallyDo-notification-backend) handles auto-creation logic and recurrence field storage; the frontend handles the recurrence configuration UI and display
- Backlog tasks cannot have recurrence — recurrence requires a due date
- A recurring task counts as one active task toward the free-tier limit; the next occurrence also counts as one active task when created
- Recurrence end conditions are supported: repeat forever, repeat until a specific date, or repeat a fixed number of times

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create a Recurring Task (Priority: P1)

A user wants to set up a task that repeats on a regular schedule. They open the add task form, enter the task details and due date, then enable recurrence and choose a frequency (e.g., "Every month"). The task is created and shows a recurrence indicator on the dashboard.

**Why this priority**: Without the ability to create recurring tasks, no other recurrence feature is possible. This is the foundation of the entire feature.

**Independent Test**: Open the add task form, fill in title and due date, enable recurrence, select "Monthly", submit. Verify the task appears in the Active tab with a recurrence indicator icon.

**Acceptance Scenarios**:

1. **Given** a user is on the add task form, **When** they set a due date and enable recurrence with "Every week", **Then** the task is created with recurrence metadata and a repeat icon is visible on the task card
2. **Given** a user is on the add task form, **When** they do not set a due date, **Then** the recurrence option is hidden or disabled (backlog tasks cannot recur)
3. **Given** a user is on the add task form, **When** they enable recurrence and select "Custom" with an interval of every 2 weeks, **Then** the task is created with a biweekly recurrence rule
4. **Given** a user is on the add task form, **When** they enable recurrence and set an end condition of "Until December 31, 2026", **Then** the recurrence metadata includes the end date
5. **Given** a free-tier user at the 15-task active limit, **When** they try to create a recurring task, **Then** they see the existing free-tier limit prompt (recurring tasks count toward the active limit)

---

### User Story 2 - Complete a Recurring Task and See Next Occurrence (Priority: P1)

A user completes their recurring "Pay rent" task. The system automatically creates the next occurrence with the correct future due date. The user sees a toast confirming completion and can see the next occurrence in their task list.

**Why this priority**: Auto-creation of the next occurrence on completion is the core value proposition of recurring tasks. Without this, recurrence is meaningless.

**Independent Test**: Complete a recurring task, verify a toast shows "Task completed — next due [date]", verify the next occurrence appears in the Active tab with the correct due date.

**Acceptance Scenarios**:

1. **Given** a recurring monthly task due on March 1, **When** the user marks it as done on March 5, **Then** the task is completed and a new task appears due April 1 with the same title, notes, and recurrence settings
2. **Given** a recurring task with "Repeat 3 times" remaining, **When** the user completes it, **Then** the next occurrence is created with "Repeat 2 times" remaining
3. **Given** a recurring task with "Repeat until June 30" and the next occurrence would fall on July 15, **When** the user completes the current occurrence, **Then** no next occurrence is created (recurrence has ended)
4. **Given** a recurring task with "Repeat 1 time" remaining, **When** the user completes it, **Then** the final occurrence is created without recurrence (it becomes a regular one-time task)
5. **Given** a recurring task is completed, **When** the next occurrence is created but would exceed the free-tier limit, **Then** the next occurrence is still created (the system should not silently drop a scheduled recurrence) and the user sees their count at or above the limit

---

### User Story 3 - Edit Recurrence on an Existing Task (Priority: P2)

A user realizes their "Pay electric bill" task should be monthly instead of weekly. They open the task detail view, change the recurrence frequency, and save. Future occurrences will follow the updated schedule.

**Why this priority**: Editing recurrence is important but secondary to creation and completion. Users can work around this by deleting and recreating the task.

**Independent Test**: Open a recurring task's detail view, change frequency from weekly to monthly, save. Complete the task and verify the next occurrence follows the new monthly schedule.

**Acceptance Scenarios**:

1. **Given** a user is viewing a recurring task's details, **When** they change the frequency from "Weekly" to "Monthly", **Then** the change is auto-saved and the recurrence indicator updates
2. **Given** a user is viewing a recurring task's details, **When** they disable recurrence entirely, **Then** the task becomes a regular one-time task and the recurrence indicator disappears
3. **Given** a user is viewing a non-recurring task's details, **When** they enable recurrence, **Then** recurrence settings appear and the task gains a recurrence indicator after saving
4. **Given** a user edits recurrence on a task, **When** they change the end condition to "Repeat 5 times", **Then** only the next 5 completions will generate new occurrences

---

### User Story 4 - Delete a Recurring Task (Priority: P2)

A user no longer needs their recurring "Gym membership payment" task because they cancelled their membership. They delete the task and choose whether to stop all future occurrences or just remove the current one.

**Why this priority**: Delete behavior is necessary for task hygiene, but users can also disable recurrence and then delete, so this is a convenience feature.

**Independent Test**: Delete a recurring task, choose "Delete this and stop recurrence", verify no future occurrences are created.

**Acceptance Scenarios**:

1. **Given** a user clicks delete on a recurring task, **When** the confirmation dialog appears, **Then** it offers two options: "Delete this task only" and "Delete this and stop recurrence"
2. **Given** a user selects "Delete this task only", **When** confirmed, **Then** the current task is deleted but recurrence is preserved — the next occurrence will still be created at the scheduled time (via a backend-managed recurrence rule that persists independently)
3. **Given** a user selects "Delete this and stop recurrence", **When** confirmed, **Then** the task is deleted and no future occurrences will be generated
4. **Given** a user deletes the only remaining occurrence of a recurring task that has ended (repeat count exhausted or end date passed), **When** confirmed, **Then** a simple delete happens with no recurrence options shown

---

### User Story 5 - Snooze a Recurring Task (Priority: P3)

A user snoozes their recurring "Water plants" task because they're on vacation. Snoozing only delays the current occurrence — the recurrence schedule is unaffected.

**Why this priority**: Snooze already works for regular tasks. This story clarifies the interaction between snooze and recurrence, which is mostly a backend concern with minor UI implications.

**Independent Test**: Snooze a recurring task for 3 days, verify it shows as snoozed, complete it after snooze expires, verify the next occurrence follows the original schedule (not offset by snooze).

**Acceptance Scenarios**:

1. **Given** a recurring weekly task due Monday that is snoozed for 3 days, **When** the snooze expires on Thursday and the user completes it, **Then** the next occurrence is due the following Monday (original schedule preserved)
2. **Given** a snoozed recurring task, **When** viewing it in the Active tab, **Then** it shows both the snooze indicator and the recurrence indicator
3. **Given** a recurring task is snoozed, **When** the user views the task detail, **Then** the recurrence settings are still visible and editable

---

### Edge Cases

- What happens if a user changes the due date of a recurring task? The recurrence schedule re-anchors to the new due date for future occurrences.
- What happens if a recurring task's next due date falls on a weekend or holiday? No special handling — the task is created for the exact calculated date. Users can snooze or adjust as needed.
- What if the backend is unavailable when a recurring task is completed? The completion should be retried; the next occurrence creation is a backend responsibility and should be atomic with completion.
- What happens to recurring tasks when a user downgrades from Pro to Free? Existing recurrence settings are preserved, but if the active task count exceeds the free limit, the user cannot create new tasks until below the limit. Recurring auto-creation still fires to avoid silently dropping obligations.
- Can a completed recurring task be "un-completed"? No — completed is a terminal state in V1. The next occurrence has already been created.
- What if a user creates a recurring daily task and doesn't complete it for a week? Only one active occurrence exists at a time. The task becomes overdue. Completing it creates the next occurrence based on the original schedule (the next day after the original due date, not today).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to enable recurrence when creating a task that has a due date
- **FR-002**: System MUST support the following recurrence frequencies: daily, weekly, monthly, and yearly
- **FR-003**: System MUST support custom intervals (e.g., every 2 weeks, every 3 months)
- **FR-004**: System MUST support three end conditions for recurrence: repeat forever, repeat until a specific date, or repeat a fixed number of times
- **FR-005**: System MUST automatically create the next task occurrence when a recurring task is completed, with the due date calculated from the original schedule
- **FR-006**: System MUST display a visual recurrence indicator on task cards for recurring tasks
- **FR-007**: System MUST allow users to edit recurrence settings on existing tasks via the task detail view
- **FR-008**: System MUST allow users to disable recurrence on a task, converting it to a one-time task
- **FR-009**: System MUST present a choice when deleting a recurring task: delete only the current occurrence or delete and stop all future recurrence
- **FR-010**: Snoozing a recurring task MUST only affect the current occurrence — future occurrences follow the original schedule
- **FR-011**: Recurrence options MUST be hidden or disabled for tasks without a due date (backlog tasks)
- **FR-012**: The completion toast for a recurring task MUST indicate when the next occurrence is due (e.g., "Task completed — next due April 1")
- **FR-013**: System MUST stop generating new occurrences when the recurrence end condition is met (end date passed or repeat count exhausted)
- **FR-014**: Recurring tasks MUST count toward the free-tier active task limit individually (each occurrence is one task). The recurrence feature itself is available to all users regardless of tier — the existing 15-task active limit naturally constrains free-tier usage.

### Key Entities

- **Recurrence Rule**: Defines the repeat pattern for a task — includes frequency (daily/weekly/monthly/yearly), interval (every N periods), optional day anchoring (day of week for weekly, day of month for monthly), and end condition (forever, until date, or count)
- **Recurring Task**: A standard NagMe task extended with a recurrence rule. Each occurrence is a separate task linked by a shared recurrence group identifier
- **Recurrence Group**: A logical grouping connecting all occurrences of the same recurring task, enabling "delete all future" and recurrence history

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a recurring task in under 30 seconds (no more than 2 additional interactions beyond creating a regular task)
- **SC-002**: 100% of recurring task completions produce the correct next occurrence with the right due date within 5 seconds
- **SC-003**: Users can identify recurring tasks at a glance on the dashboard via a visible recurrence indicator
- **SC-004**: Users can modify or disable recurrence on any task without needing to delete and recreate it
- **SC-005**: The recurrence feature handles all standard scheduling patterns users expect: daily, weekly, biweekly, monthly, quarterly, and yearly
- **SC-006**: Deleting a recurring task provides a clear choice, and fewer than 5% of users accidentally delete all occurrences when they intended to delete only one (measured by undo/support requests)
