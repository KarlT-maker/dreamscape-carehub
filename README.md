# BarnCareHub

Horse care and feed-room boards for Dreamscape Ranch.

## Use the app

The current app is https://karlt-maker.github.io/dreamscape-carehub/boards/full/.
It opens with the 43 existing horse names and paddocks. Other profile details, care plans, appointments, history, crew and checkmarks start empty.

1. Open **Horses**, select a horse and use **Edit profile** for its details. Unknown details may stay blank.
2. In **Care**, add feed/mash, supplements or medication instructions with a start date and AM/PM schedule.
3. Read the **Full board**, **Mash & feed** or **Medications** boards. Select a name to change its care plan.
4. **Today** offers optional feed and special-care checkmarks. Medication checkoffs are not implemented.

Records are saved in localStorage in this browser on this device, including after refresh. They are not shared with another device, browser or site address. Clearing browser data can remove the saved workspace. Download a backup in **Administration** after useful edits; JSON backups can be restored on another browser manually.

**Administration** also offers a confirmed reset that keeps names and paddocks while clearing all other information, a completely blank reset, example data, and undo of the last reset or restore. Examples retain the original real horse names and paddocks but contain invented care, profile and crew details. They are never loaded by default.

The previous version used session-only examples; there was no persistent browser data to migrate. Existing named horse URLs remain valid. New horses use the static `/horses/session/?horseId=...` route.

## Development

Use Node.js 22.13+ (Node 24 recommended).

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

Next.js 16, React 19, TypeScript and static export. For the GitHub Pages build set `GITHUB_PAGES=true`; it uses `/dreamscape-carehub` as the base path. Pushes to `main` run `.github/workflows/deploy.yml`. The separate historical ChatGPT Sites preview is not the active app.

- `src/lib/data/roster.ts`: original names/paddocks and optional example fixtures.
- `src/lib/data/repository.ts`: default roster with unknown details left blank; optional examples.
- `src/lib/data/workspace.ts`: versioned backup validation, saving, undo and daily task generation.
- `src/components/provider.tsx`: persistent browser state and storage-error handling.
- `src/components/horse-form.tsx`: shared add/edit profile form.
- `src/lib/horse-path.ts`: routing for original and newly added horses.

Normal saves reject a stale revision, and storage events refresh other tabs on the same origin. This is browser-local protection, not a transactional multi-user database. Daily tasks use the Pacific ranch date, updated every 30 seconds; a changed instruction gets a new checkmark identity.

## Current limits

This is a practice app. Shared records, login and administrator roles, audit guarantees, reliable offline launch/upload, appointment entry, crew scheduling, photos/documents and client access are not implemented. Profile and care edits stay on this device; they are not sent to GitHub. See `VALIDATION.md` for checks.
