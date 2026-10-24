# Bounty #1 — Contact Management Dashboard

A standalone React/TypeScript relationship workspace with contact CRUD, search, filters, tags, and responsive detail views.

## Included

- Six realistic contacts across lead, customer, partner, and archived states
- Search by name, title, company, or email
- Status, company, and tag filters with clear-results behavior
- Create and edit forms with validation and normalized tags
- Archive workflow and clickable email/phone actions
- Typed async host callbacks with failure-safe local state
- Keyboard-accessible modal with focus trap, Escape, and focus restoration
- Loading, error, empty-data, no-results, and operation-error states
- No new package dependencies

## Integration

Pass `contacts` from the host data layer. Connect `onCreate`, `onUpdate`, and `onArchive` to persistence; rejected promises are surfaced without applying the local mutation.

The submission is verified by TypeScript bundling, structural checks, `git diff --check`, and desktop and 390px mobile previews.
