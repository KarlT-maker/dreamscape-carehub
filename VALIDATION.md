# Prototype validation

## Passed

- Dependency installation from npm; package-lock.json included.
- ESLint with no source warnings or errors after cleanup.
- TypeScript strict checking.
- Next.js production build, all five application routes plus not-found.
- Four date tests: Pacific timezone, month/year/leap-day offsets, birthday boundaries, inclusive effective dates and scheduled-to-current transitions.
- Production server HTTP smoke checks: /, /horses, /horses/molly, /calendar and /administration each returned 200 and expected page content.
- Source review: links map to implemented routes, shared context supplies completions and session additions across navigation, responsive breakpoints cover desktop/tablet/mobile.
- Repository file review: dependencies, output and environment files ignored; no credentials or fake API keys added.

## Browser limitation

The managed preview initially rejected Next.js CLI flags. A small launcher now translates those flags and preview startup reported healthy, but the supervised process subsequently stopped before the browser connected. The test browser received connection refused. The bounded preview recovery was exhausted.

As a result, click-through behavior and visual layouts at desktop/tablet widths were **not browser-verified** in this environment. Source review and HTTP route checks are not substitutes for this verification.

## Manual acceptance checklist

At 1440px desktop, 1024px and 768px tablet, and 390px mobile:

1. Navigate Today → Horses → Molly → Calendar → Administration; check for clipping and horizontal page overflow.
2. Complete a feed task; confirm progress, name and timestamp. Visit the horse profile and confirm the same completion. Undo it.
3. Filter the care board by horse/paddock and AM/PM. Expand optional checklists, select each AM/PM feed progress card and use Pending only.
4. Search by horse, owner and paddock; test a no-result search.
5. Add a horse and open its profile. Refresh to confirm documented session reset.
6. Inspect Molly's Care tab: current dose and scheduled future dose must be visually distinct.
7. Filter Calendar and follow a horse link. Filter History by each category.
8. Use keyboard focus, profile arrow-key tabs and 200% zoom.

No production database, authentication, file upload, account permissions or shared persistence was built or tested.

## Whiteboard priority update

Following ranch feedback, Today prioritizes a searchable feed/mash/care whiteboard with AM/PM filtering and profile links for the approximately 45-horse ranch. The six mock horses represent a subset. Feed/care checklists are collapsed as optional. Medication tasks/checkoffs were removed from the mock task generator. A previous Molly instruction and plan-derived medication history demonstrate the timeline. Browser acceptance remains outstanding due to the environment limitation above.
