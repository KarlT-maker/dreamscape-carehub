# Dreamscape CareHub

An internal horse-care and stable-management application for Dreamscape Ranch, a senior horse retirement and care facility.

## Run locally

Use Node.js 22.13+ (Node 24 recommended) and npm.

```bash
npm ci
npm run dev
```

Open http://localhost:3000. No environment variables, Supabase account or credentials are required.

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

## Stack

Next.js 16.3.4, App Router, React 19, TypeScript, Tailwind CSS 4, ESLint and Lucide icons. Shared CSS tokens keep the calm green barn interface consistent. No custom backend. The prototype exports static Next.js pages for private hosting.

## Prototype functionality

- Today: a searchable feed-and-care whiteboard for a ranch of approximately 45 horses. Each row shows mash/feed quantities, preparation, AM/PM schedule, applicable medications, special instructions and future changes, with links to the profile and dated care plan. Six sample horses represent a subset, not the actual roster. Optional feed/care checklists are collapsed below the board; medication checkoffs are not required.
- Horses: six fictional residents, search by name/owner/paddock, and a session-only Add Horse form.
- Horse profile: identity, owner, location, today's care, current instructions, scheduled changes, appointments and recent history.
- Care: medications, feed/mash, supplements and special instructions, with inclusive effective dates and clearly identified scheduled changes.
- Calendar: chronological upcoming events, all nine requested event types, filters by horse/type/start date and links to profiles.
- History: chronological per-horse timeline with category filters. Medication start/end entries come from the dated care instructions; Molly demonstrates a previous dose, current dose and scheduled future dose.
- Photos and Documents: honest empty states; uploads are not implemented.
- Administration: workspace information and prototype limitations.
- Responsive sidebar/top navigation, keyboard-operable tabs, visible focus and 44px task buttons.

All names, treatment examples and care records are mock data, not veterinary guidance. App state is held in React context, shared across client-side navigation, and resets on refresh. No data is stored remotely. Added horses begin with no care plan. Demo events are dated relative to the date the app opens in the browser (Pacific time). Refresh at the beginning of a new barn day; this prototype does not automatically roll over an open session at midnight.

## Architecture

- `src/app/`: route entry points, root layout and shared styles.
- `src/components/`: reusable shell, provider, task/event lists, directory, profile, care plan and history.
- `src/types/`: Horse, Owner, CareItem, Medication, FeedInstruction, Supplement, CalendarEvent, CareTask, TaskCompletion and HistoryEntry.
- `src/lib/data/mock.ts`: fixtures separate from presentation.
- `src/lib/data/repository.ts`: adapter boundary for replacement with Supabase queries.
- `src/lib/dates.ts`: Pacific ranch dates, age and effective-date classification.
- `src/lib/supabase/`: integration notes; no client initialized.
- `scripts/dev.mjs`: forwards Next.js dev flags and translates managed-preview host/port flags.
- `tests/`: date/effective-instruction boundary checks.

Existing repository ignore rules are preserved, including environment files, dependencies and build output. No secrets or fake API keys are included. Next.js-generated AGENTS.md/CLAUDE.md are retained because development regenerates them.

## Validation

See `VALIDATION.md` for performed checks and environment limitations. The commands above reproduce lint, TypeScript, unit tests and production build checks.

## Proposed next steps

1. Review on the ranch iPad with the people doing AM/PM rounds; confirm terminology, feed quantities and task grouping.
2. Refine horse entry and care-plan editing, including overlapping-date validation and veterinary approvals.
3. Introduce Supabase migrations, authentication and ranch-scoped row-level access; replace the data adapter and add loading/error/offline handling.
4. Persist unique daily tasks and audit completions/undo across multiple devices.
5. Add photo/document storage after the care workflow is agreed.

Owner accounts, payments, accounting integrations and production authentication are outside this prototype.

## Private hosted preview

`npm run build` exports the app to `out/`; `npm start` serves that export locally. The hosted version uses this same output. All interaction stays in the browser. A generated `/horses/session` route supports session-added horses using a query parameter; sample profiles also retain their named URLs. App state still resets on refresh. `.openai/hosting.json` identifies the private preview and its static output directory.
