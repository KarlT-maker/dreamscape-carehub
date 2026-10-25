# Validation — 2026-10-25

## Automated checks

- ESLint, strict TypeScript and production static build with `GITHUB_PAGES=true` passed.
- Date tests cover Pacific time, calendar/birthday boundaries, inclusive effective dates and cancelled future care.
- Workspace tests cover unknown profile details, reopening saved records, malformed/orphaned backup rejection, reset/undo, stale-tab rejection, storage failure, daily round/date selection and custom paddocks.
- Production export generated 54 pages, including original named profiles and the new-horse fallback route.

## Browser checks

Tested in the in-app browser against the local app with the GitHub Pages base path:

- Default board shows 43 retained horse names, original paddocks, zero medication and no sample crew.
- Leroy's profile has no invented age, owner, breed, colour or dates.
- Added a clearly labelled trial feed; it remained after refreshing and appeared on the board.
- Edited the profile and moved it to a custom test paddock; the board showed that paddock and its feed.
- Cleared data while keeping names, then undid it; the entered profile and feed returned.
- Completed a daily feed; the checkmark survived refresh and reset/undo.
- Loaded the optional examples and verified their explicit banner; undid the replacement.
- Added a horse with only name and paddock; its profile opened after refreshing.
- Downloaded a JSON backup, cleared the workspace completely, then selected and restored that backup; horse and care records returned.
- Inspected the board screenshot at the normal browser size; no console errors were recorded during this test.

Test entries are confined to the localhost origin and are not deployed. The public app starts with names and paddocks only unless that browser has already saved a workspace from this version.

## Limits

Dedicated phone/tablet breakpoint testing and actual barn-device testing remain outstanding. No shared backend, permissions, offline sync, file storage or multi-user audit trail was built or tested. Browser-local saving must not be described as cross-device synchronization.
