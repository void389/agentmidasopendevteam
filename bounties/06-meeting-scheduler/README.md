# Bounty #6 — Meeting Scheduler

A standalone React/TypeScript scheduling module with timezone-safe display, conflict filtering, booking, rescheduling, and cancellation flows.

## Included

- Five-day availability browser with three daily slots
- IANA timezone display for dates and times
- Conflict filtering against confirmed bookings and blocked provider slots
- Typed async callbacks for create, reschedule, and cancel persistence
- Safe failure handling that preserves local state until the host succeeds
- Keyboard-accessible booking dialog with focus trap, Escape, and focus restoration
- Loading, error, no-availability, no-bookings, success, and operation-error states
- Responsive Agent Midas dark/gold styling
- No new package dependencies or embedded provider credentials

## Integration

Pass provider-normalized UTC `slots` and current `bookings`. Connect `onCreate`, `onReschedule`, and `onCancel` to the host calendar/data layer; rejected promises are surfaced without corrupting local state.

The submission is verified by TypeScript bundling, structural checks, `git diff --check`, and desktop and 390px mobile previews.
