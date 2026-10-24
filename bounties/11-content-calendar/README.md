# Bounty #11 — Content Calendar

A standalone React/TypeScript editorial calendar for planning content across Blog, Email, LinkedIn, Instagram, and YouTube.

## Included

- Responsive six-week monthly calendar with previous/next navigation
- Drag-and-drop date changes plus an accessible edit form with a native date field
- Search and channel, owner, and status filters
- Typed create/edit flows and optional host callbacks for persistence
- Seven realistic sample items and five workflow states
- Loading, error, empty-data, and no-filter-results states
- Dark Agent Midas visual language with keyboard-visible controls
- No new package dependencies

## Integration

Import `ContentCalendar` into any React route. Pass `items` from the host application and persist changes with `onItemChange` and `onItemCreate`. The component updates when the `items` prop changes.

The submission is verified by TypeScript bundling, structural checks, `git diff --check`, and desktop and 390px mobile previews.
