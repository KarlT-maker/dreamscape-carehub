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
