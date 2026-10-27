# Shared beta on the existing WordPress hosting

Build with `node scripts/package-siteground.mjs`. Deploy only the generated
`dist/siteground/carehub` folder into the existing WordPress `public_html`.
The app uses `/carehub/`; do not replace the website root or WordPress files.
Keep a versioned ZIP of each deployment for rollback. Database contents stay
in WordPress's configured MySQL database and are not in the deployment ZIP.

The API loads the existing `wp-load.php` two directories above it. No database
passwords or administrator credentials belong in source code or frontend assets.
WordPress administrators can sign in and select **Open shared barn** once.
That explicit POST creates two dedicated InnoDB tables, seeds the 43 horse
names/paddocks, and registers the **BarnCareHub tester** and **BarnCareHub
administrator** roles. It does not assign these roles to anyone. On an existing
installation, the setup button only registers the missing roles; saved records
are preserved. Website administrators create individual accounts using WordPress
Users. Select the CareHub administrator role for barn owners and tester for staff.
Both roles lack website administration, content editing and user-management
capabilities. CareHub administrators can reset, restore and undo barn records.
Account creation currently still requires the separate website administrator
login. Email notifications and password entry are controlled by the human user.

Authentication uses existing WordPress sign-in/cookies. Every API read requires
the custom capability or administrator capability except the public session
status. Writes require the same-origin request and an authenticated nonce.
The API is never cached. Confirm that host caching does not override no-store.

Saves lock the dedicated workspace row and compare revisions before replacing
it. A conflict returns the current snapshot without writing. A lost response can
be retried with the same request ID; audit rows prevent duplicate writes. Failed
requests never show a successful save. The UI retains form input and can retry
an unconfirmed save. Polling refreshes other screens every ten seconds. Forms
compare their original record before overwriting it. Each successful write
records the previous snapshot, user ID, time, action and request ID in the
revision table. Admin resets/restores also retain a one-step undo snapshot.

Normal staff saves allow horse profiles, care, appointments, history, helper names,
weekly assignments and days off. Existing record IDs are retained; appointments,
assignments and days off can be cancelled instead of deleted. Tasks are read-only
and task check-off controls are hidden; existing completion data is preserved.
Lunch and all combinations of AM, Lunch and PM are supported. History authors
are stamped with the signed-in account by the server. Helper names in the rota
do not create accounts or send email. Several helpers can share a paddock and
round; each has a separate assignment. Removing one preserves the others.
Who's on what opens with today's read-only team by paddock and round. Calendar
offers month/week browsing and day details, including days off. Edit schedule
contains the existing weekly assignment editor; opening it from day details
selects that day's week. All three views read the same saved assignments.
Duplicate assignments for the same helper, paddock, date and round, and duplicate
days off, are rejected. Bulk replacement and undo still require administrator permission.
This beta requires internet; offline queuing, client access and photos are not
implemented. Calendar appointments and horse history are entered by the team;
they do not import data from external vet or farrier services.

The GitHub Pages build remains browser-local. It must not automatically upload
or erase existing local records. Import a downloaded browser backup explicitly
through the shared beta's Administration page after reviewing its horse and care
counts. That replaces the shared workspace for everyone and is reversible.

Checks: `npm test`, `npm run lint`, `npm run typecheck`,
`php tests/server-validation.php`, and the production packaging command.
Before releasing, verify unauthenticated denial, login, server persistence after
reload, refresh in a second screen, conflicting edits, and reversible restore.
# Farrier records

The dedicated Farrier records page records completed work for one horse at a time, with Save & add next horse retaining the visit date and farrier. It uses the existing shared horse history, with optional work type, feet and entered-in-error fields; older unclassified records remain visible. Helpers can edit a record or use Delete record with confirmation. Deleted records are hidden from active work lists and horse history and excluded from totals, but can be restored under Deleted records. The existing server audit retains previous revisions. The server stamps the signed-in account on changes.

Weekly reports use ISO Monday-Sunday weeks, including the ISO week-year around New Year, and show date ranges beside the year/week. Counts exclude entries marked entered in error, count work entries rather than individual shoes, and can be filtered by farrier. Print week produces a paper/PDF-friendly report.

## Weekly proposed work and actual work

Farrier records opens to Record work for entering completed work and reviewing billing weeks. Weekly schedule lists proposed and completed work for the selected ISO year/week, with dates beside the week number. Plan work asks for horse, year/week, and next trim or shoeing. A red Planned label identifies proposals; only completed records count in bills. Print week for Shelly prints the weekly sheet with proposed work, notes, and writing space for actual work.

Both plans and completed work can be saved with only a week. Optional farrierWeekOnly=true stores the ISO Monday as a sorting/billing anchor, not a claimed visit date; displays say day not noted. The actual day can be added later without losing the week. Existing exact-date records are preserved. Week-only plans remain visible in appointments until the week ends and do not appear as Visiting today.

Completed work remains in horse history and weekly totals. Recording a proposed visit links a history entry to its source event without overwriting the proposal. Stale plans and duplicate active completions are rejected. Delete record marks a completed entry voided and removes it from active lists and totals; Deleted records allows restoration. The proposal stays. Cancelled plans are retained and excluded from week sheets. Existing legacy work choices are retained in saved data.

Farrier browsing now groups billing weeks under month names. The Record work and Weekly schedule screens share month buttons and dated week cards, with the current week marked. Entry forms also offer Month and dated Week choices. Groups follow each week's Monday, except ISO week 1 belongs to January when it starts in the previous December. Each billing week appears exactly once; stored dates, records and billing calculations are unchanged.
