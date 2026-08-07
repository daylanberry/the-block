# The Block — Implementation Plan

## Objective

Build a focused React prototype that lets a wholesale buyer find a vehicle, understand its risk, and confidently place a bid. The submission should feel intentional on desktop and mobile and remain easy to explain line by line.

The email's React web requirement overrides the README's broader framework choice.

## Product Thesis

The differentiator is **condition-first bidding**. A wholesale buyer is not only shopping for a low price; they are judging risk. Inventory cards and the detail view will make condition grade, title status, damage, reserve state, and bid state easy to understand before asking the buyer to act.

Primary demo journey:

1. Search or filter the inventory.
2. Scan price and risk signals on a vehicle card.
3. Open a dedicated vehicle detail route.
4. Review photos, specs, condition, damage, title, location, and seller.
5. Enter and confirm a valid bid.
6. See the current bid, bid count, and ownership state update immediately; if the reserve remains unmet, retain one clear way to raise the bid, otherwise remove redundant self-bidding.
7. Open `My bids` to review every vehicle bid on in this session.

## Scope

### Required core

- Responsive inventory grid using all 200 supplied vehicles.
- Search across year, make, model, trim, VIN, lot, and dealership.
- Lightweight body-style filter chips only: All, SUV, Sedan, Truck, Hatchback, Coupe.
- Useful result count, clear-filter action, and an intentional empty state.
- Dedicated route for each vehicle so browser history and deep links work.
- Vehicle gallery using the supplied images, with lazy loading and a reliable fallback.
- Detail content covering every requested field:
  - specs and odometer
  - condition grade and report
  - damage notes, including an explicit "No reported damage" state
  - title status
  - dealership, city/province, VIN, and lot
- Focused bid dialog with minimum-bid guidance, inline validation, one confirmation step, and a success state.
- Bid changes reflected in both the detail view and inventory data during the session.
- Reserve-aware same-user raises while the reserve remains unmet, with repeat bidding locked for `Reserve met` and `No reserve`.
- A session-scoped `My bids` view showing every vehicle on which the current prototype user has bid and the latest accepted amount for each.
- Responsive behavior at phone and desktop widths.
- Clear local setup and decision documentation in the final README.

### Conditional stretch

- Local watchlist/favorites, only if every required item, test, and responsive check is complete.

### Deliberate exclusions

- Backend, database, authentication, accounts, and realtime networking.
- Seller, admin, checkout, payment, and transportation workflows.
- Proxy/max bidding, buyer notes, service add-ons, guarantees, and payment-method collection inside the bid flow.
- Buy Now interaction; only 39 vehicles contain a price and a dead CTA would weaken the prototype.
- Comparison tooling, pagination, virtualization, advanced filter drawers, and elaborate auction simulation.
- Revealing the exact reserve price to the buyer.

## Data Decisions

- Treat all money as CAD and document that assumption; the dataset contains Canadian locations but no currency field.
- Treat `vehicle.id` as the canonical route and state identity; lot numbers are searchable display metadata and may repeat.
- Minimum bid:
  - no current bid: `starting_bid`
  - existing current bid: `current_bid + 500`
- Keep reserve price private. Derive only `No reserve`, `Reserve not met`, or `Reserve met`.
- Normalize display casing without mutating source data (`sedan` → `Sedan`, while retaining `SUV`, `CVT`, and similar labels).
- Discard null image entries during normalization and show the stable image fallback when no usable photography remains.
- Normalize the stale seven-day `auction_start` schedule deterministically by mapping its final calendar day to tomorrow and preserving every day/time offset.
- Label time honestly as `Auction starts` or `Open`; the dataset has no auction end time or timezone, so do not claim an auction is "ending soon."
- Auctions whose normalized start has passed may accept bids. Sort open vehicles first so the core flow is immediately available.
- Create one anonymous `userId` in the application store factory for the current browser session. Do not persist it: refreshing deliberately creates a new prototype user, restores the original catalog, and clears `My bids`.
- Keep client-side auction state and one latest user-bid record per `(vehicleId, userId)` in one Redux Toolkit session slice. A synchronous command passes the current snapshot to the pure bid transition, and reducers commit only accepted results. Each retained record contains an `id`, `vehicleId`, `userId`, `amount`, and ISO `placedAt` timestamp.
- Treat supplied catalog bids as auction activity with an unknown owner. When the prototype user bids, update the current bid amount and owner `userId`; determine ownership only by comparing IDs, never by comparing monetary values.
- Derive `My bids` by joining the single retained record for each current-user vehicle back to vehicles in stable catalog order; do not store a second view-specific history model.
- Keep first-bid eligibility unchanged. For a user with an existing record or current-bid ownership, allow another minimum-valid bid only while the vehicle's current public reserve status is exactly `Reserve not met`. Lock repeat bidding for `Reserve met` and `No reserve`.
- Every accepted raise immutably replaces that user's retained vehicle record with the new ID, amount, and timestamp, increments the shared bid count, updates current-bid ownership, and derives the next public reserve status without exposing the reserve price. Durable bid-event history remains a production backend responsibility.
- If a prior bidder no longer has evidenced current ownership, never claim that their bid is highest. While the reserve remains unmet, use neutral `Bid recorded` language with an available higher-bid path; competing-bid simulation and realtime outbid behavior remain out of scope.
- Recommended walkthrough vehicle: lot `B-0004` (2025 Subaru Outback), whose active bid and unmet reserve demonstrate one eligible raise followed by a reserve-clearing raise in two `$500` steps. Its rebuilt title and damage notes also keep the condition-first product decision visible during the bid demo.

## Design Direction

Use an **industrial inspection-docket** aesthetic rather than a generic marketplace dashboard:

- cool neutral surfaces against cobalt navigation and deep-navy framing
- cobalt as the primary action color and identity layer
- green, amber, and red reserved for trustworthy status meaning
- condensed automotive typography for headings and tabular bid numbers, paired with a highly readable body face
- lot-number stamps, inspection-style dividers, and compact metadata that support the auction context
- generous detail-page hierarchy with a summary-only sticky bid rail, one clear bid action, and a focused bid dialog
- restrained motion: one coordinated inventory entrance and a bid-success transition, both respecting reduced-motion preferences

The memorable visual idea should be that the interface feels like an inspection report and live auction board were designed as one product.

## Technical Shape

- React + Vite + TypeScript with Redux Toolkit and React Redux for shared auction-session state.
- Wouter for lightweight inventory, `/vehicles/:vehicleId` detail, and `/bids` current-session routes.
- Custom CSS with variables and a small token system; avoid a large UI framework.
- A minimal icon package only if needed.
- Build-time JSON import; no API layer for a static 200-record dataset.
- A small domain layer for:
  - formatting and normalization
  - search/filtering
  - auction status
  - reserve status
  - minimum-bid calculation and validation
  - reserve-aware buyer bid eligibility and current user-bid lookup
- One isolated Redux Toolkit store created at application startup. A synchronous thunk coordinates the pure bid domain transition and returns the dialog's immediate accepted/rejected result; reducers only commit accepted snapshots.
- Typed hooks and focused selectors expose shared auction state at the narrowest component that uses it. Intermediate components pass domain display data, not Redux session values or action callbacks they do not consume.
- A derived `My bids` collection joined from the retained current-user bid records and vehicle catalog; do not introduce a second mutable store for the view.
- One semantic bid dialog shared by the desktop rail and mobile launcher; do not duplicate the form.
- Vitest and React Testing Library for a few high-value behavioral tests.

Suggested structure:

```text
src/
  app/
  components/
  features/inventory/
  features/vehicle/
  features/bidding/
  domain/
  styles/
  test/
```

Keep components colocated with the feature that owns them. Extract shared pieces only after the second real use.

## Scaffold Contract

These choices are locked before implementation so either assistant produces the same project shape:

- Scaffold the React application directly in the repository root. Do not create a nested `app/`, `client/`, or other second project root.
- Preserve `data/`, `docs/`, `scripts/`, `README.md`, `SUBMISSION.md`, and `WALKTHROUGH.md` while scaffolding. Do not accept a generator action that deletes or replaces them.
- Use npm and commit exactly one `package-lock.json`; do not introduce pnpm, Yarn, or Bun artifacts.
- Use Node 24 LTS through `.nvmrc`. Set the package engine range to `^22.12.0 || ^24.0.0` so current LTS and supported Node 22 reviewer environments are explicit.
- Phase 0 must establish this script contract:
  - `npm run dev` — Vite development server
  - `npm test` — Vitest once, suitable for verification and CI
  - `npm run test:watch` — Vitest watch mode
  - `npm run typecheck` — TypeScript check without output
  - `npm run lint` — OXLint
  - `npm run build` — type-check followed by a production build
  - `npm run preview` — locally serve the production build
- Keep the original root `README.md` intact until Phase 6. Before replacing it, preserve it verbatim as `docs/CHALLENGE.md`.

## Execution Phases

### Phase 0 — Decisions and scaffold

- [x] Reconfirm the agreed scope and scaffold contract.
- [x] Create the React/Vite/TypeScript app at the repository root without deleting or replacing challenge source files.
- [x] Add `.nvmrc`, npm metadata, `package-lock.json`, and every command in the scaffold contract.
- [x] Add routing, test setup, design tokens, and the base application shell.
- [x] Verify the documented commands and update `AGENTS.md` if their final names differ.

Exit: the app starts and every command documented in `AGENTS.md` resolves successfully.

### Phase 1 — Domain and data layer

- [x] Define the `Vehicle` and bid-state types.
- [x] Import and validate the supplied data shape.
- [x] Implement formatting, normalized scheduling, reserve state, search, body filter, and minimum-bid helpers.
- [x] Add focused unit tests for bid calculation and search/filter behavior.

Exit: components can consume presentation-ready vehicle data without embedding business rules.

### Phase 2 — Inventory experience

- [x] Build the header, search field, body-style chips, result count, and empty state.
- [x] Build responsive vehicle cards with the first image, identity, location, odometer, condition/title risk, auction state, and current/opening bid.
- [x] Sort open vehicles first and link every card to its detail route.

Exit: a reviewer can quickly find and understand inventory at desktop and phone widths.

### Phase 3 — Vehicle detail experience

- [x] Build the photo gallery and image fallback.
- [x] Build the summary, specs, condition, damage, seller/location, VIN, and lot sections.
- [x] Build the desktop sticky auction rail and place it immediately after the gallery on mobile.
- [x] Handle null reserve, null current bid, empty damage notes, and title-risk states explicitly.

Exit: every core detail requirement is present with clear risk hierarchy.

### Phase 4 — Bid flow

- [x] Show the correct minimum in CAD.
- [x] Validate empty, nonnumeric, and below-minimum bids inline.
- [x] Add one review/confirmation step before committing the bid.
- [x] Update current bid, count, reserve state, and buyer ownership state immediately.
- [x] Add one behavioral test covering a successful bid and visible update.

Exit: the complete browse → inspect → bid journey works without a backend.

### Phase 4A — Focused bid dialog

- [x] Reduce the auction rail to current/starting bid, bid count, reserve state, next valid bid, and one `Place a bid` action.
- [x] Open one shared semantic dialog from both the desktop rail action and mobile sticky launcher; do not render duplicate bid forms.
- [x] Move the existing entry → review → success flow into the dialog without changing bid calculations or session-state behavior.
- [x] Use a bounded centered modal on desktop and a near-full-screen dialog on phones, with no horizontal overflow or obscured controls.
- [x] Implement the complete focus lifecycle: focus enters the dialog, remains contained, Escape/cancel closes safely, background scrolling is blocked, and focus returns to the launcher.
- [x] Preserve entered values when moving between entry and review, prevent rejected bids from showing success, and reflect accepted bids in the rail and inventory after closing.
- [x] Update behavioral tests and manually verify entry, validation, review, cancel, success, Escape, focus return, and 375/768/1440 layouts.

Exit: bidding is visually isolated from the dense vehicle record while retaining one obvious action and the existing guarded bid behavior.

### Phase 5 — Craft, responsiveness, and accessibility

- [x] Review 375px, 768px, and 1440px layouts.
- [x] Modernize the surface hierarchy with selective `4px–10px` corner radii, broad low-opacity shadows, subtle tonal gradients, and hover/focus elevation.
- [x] Soften the search/filter deck, inventory cards, statistics board, and bid dialog while keeping inspection records, status cells, and lot dockets angular.
- [x] Use OPENLANE as a reference for depth and polish without copying its marketing layout or weakening the condition-first auction hierarchy.
- [x] Compress the desktop hero by roughly 25% so the filters and meaningful inventory content appear above the fold at a 900px-tall viewport; reduce heading scale, vertical padding, and tally-board weight without weakening the page identity.
- [x] Make inventory cards more photo-first with a 16:9 or 16:10 media frame, tighter body spacing, and a target desktop height around `600px–650px` while retaining condition, title, damage, and bid context.
- [x] Replace the repeated full-width cobalt auction strip with a compact status badge or status row; reserve solid cobalt primarily for selected filters, focus, and primary actions.
- [x] Simplify card framing by choosing a light border or soft elevation instead of stacking strong borders, shadows, gradients, and dense internal rules; remove nonessential dividers from the card body and footer.
- [x] Rework the inventory controls as a softer search surface with distinct rounded filter chips rather than one heavily outlined form panel.
- [x] Limit condensed all-caps typography to major headings, vehicle names, lot numbers, and prices; use the body face and sentence case for supporting labels where it improves scanning.
- [x] Verify visible focus, keyboard Escape/focus return, semantic headings/forms, labels, and useful image alt text.
- [x] Add loading and fallback treatment.
- [ ] Verify reduced-motion behavior with OS/browser preference emulation.
- [x] Remove visual noise, broken promises, stale experiments, and duplicated code.

Exit: the experience feels deliberate, readable, and usable rather than merely complete.

### Phase 6 — Verification and submission package

- [x] Run tests, TypeScript, lint, production build, and a clean-clone-style startup check.
- [x] Manually smoke-test search, filters, detail navigation, invalid bids, valid bids, refresh behavior, and mobile layout.
- [x] Preserve the original challenge README verbatim as `docs/CHALLENGE.md`.
- [x] Replace the root README with submission-focused documentation and link back to the archived challenge brief.
- [x] Update the source-of-truth paths in `AGENTS.md` if necessary.
- [x] Document assumptions, scope, stack, decisions, tests, AI workflow, and what would come next.
- [x] Prepare the five-minute demo and walkthrough talking points.

Exit: another engineer can clone the fork, run it from the README, and reproduce the core journey.

### Phase 7 — My bids and bid ownership

- [x] Generate one session-scoped anonymous `userId` at the application root and pass it into the bid-state boundary so a future authenticated user ID can replace only that source.
- [x] Replace `vehicle.bid.yourBid` with explicit immutable bid records containing `id`, `vehicleId`, `userId`, `amount`, and an ISO `placedAt` timestamp; rejected attempts must not create records or reuse an existing bid ID.
- [x] Represent the current auction bid with its amount and nullable owner `userId`; supplied catalog bids have an unknown owner, while an accepted prototype bid records the current `userId`.
- [x] Derive one `My bids` entry per accepted record whose `userId` matches the current user, joined to vehicles in stable catalog order.
- [x] Add a clear `My bids` destination to the existing navigation without introducing an account menu or dashboard shell.
- [x] Show the vehicle photo or fallback, year/make/model/trim, lot, the user's bid, bid count, reserve state, and auction state using the latest in-memory vehicle data.
- [x] Link every entry back to its canonical `/vehicles/:vehicleId` detail route with one clear `View vehicle` action.
- [x] Preserve stable catalog order so the view stays fully derived and deterministic; do not add a separate activity ledger solely for sorting.
- [x] Add an intentional empty state explaining that bids are retained only for the current session, with one `Browse inventory` action.
- [x] Show `You hold the current bid` only when the current bid's owner `userId` equals the active `userId`; never infer ownership from equal amounts.
- [x] At Phase 7 completion, remove both desktop and mobile bid launchers after the active user has one accepted bid record or already owns the current-bid snapshot for that vehicle, and defensively reject every later attempt in the pure domain transition. Phase 8 supersedes this only for reserve-unmet raises.
- [x] At Phase 7 completion, keep all rebidding, competing-bid updates, and realtime position changes out of the frontend-only prototype. Phase 8 adds reserve-aware self-raising without adding competing bidders or realtime outbid behavior.
- [x] Confirm that an accepted bid appears immediately, the ownership status replaces the launcher without interrupting bid success, and refresh creates a new anonymous user with empty session bid state.
- [x] Add focused tests for user-ID ownership, unknown catalog owners, immutable bid creation, empty state, multiple vehicles, repeated-bid rejection, canonical detail links, and refresh reset.
- [x] Rerun tests, typecheck, lint, build, diff checks, and the documentation review; repeat browser QA if the localhost browser is available.

Exit: the live flow lets a reviewer place one direct bid on multiple vehicles, see ownership derived from explicit user identity, review the active user's bid records, and return to the right auction record without implying authentication, auction results, or durable persistence.

Phase 8 supersedes Phase 7's one-direct-bid lock and append-only client ledger while preserving its anonymous identity, ownership, immutable state updates, and session-reset decisions.

### Phase 8 — Reserve-aware self-raising

- [x] Update `docs/PLAN.md`, `docs/DESIGN.md`, `README.md`, and walkthrough guidance so reserve-aware repeat bidding replaces the active one-shot rule without rewriting Phase 7's historical outcome.
- [x] Add one shared domain eligibility result for `place`, `raise`, or `locked` so `applyBid` and the UI cannot disagree about repeat-bid availability.
- [x] Keep scheduled-auction, missing-vehicle, below-minimum, and retained duplicate bid-ID rejection unchanged; lifetime idempotency belongs to the future server-authoritative API.
- [x] Allow a user with a prior bid record or current-bid ownership to submit another bid only when the vehicle's current reserve status is `Reserve not met`; keep first-time bidders unaffected.
- [x] Accept a reserve-clearing raise, immutably replace the user's retained vehicle record, increment the bid count, update current-bid ownership, and block the following self-bid once the public status becomes `Reserve met`.
- [x] Block repeat bids for `Reserve met` and `No reserve` without changing either session array or exposing the exact reserve price.
- [x] Keep exactly one retained record per `(vehicleId, userId)` so `getUserBidForVehicle` can use a direct lookup while `getUserBidEntries` preserves one `My bids` row per vehicle and stable catalog order.
- [x] Confirm `App`, `InventoryRoute`, the former session-state adapter, and `MyBidsRoute` receive the replaced bid automatically; use a new generated ID and timestamp for each accepted raise.
- [x] Add a reserve-unmet ownership state to the shared bid UI: `You hold the current bid` / `Reserve not met — you can raise your bid`, with active desktop and mobile `Raise your bid` launchers and the next minimum in CAD.
- [x] For a prior record without current ownership, use neutral `Bid recorded` / `Reserve not met — you can place a higher bid` copy while the same raise action remains available; do not invent an outbid event. If the public state locks further bidding, keep the copy neutral instead of showing the current-owner treatment.
- [x] Retain `You hold the current bid` / `No action needed` with no launcher for `Reserve met` and `No reserve`.
- [x] Show `Next valid bid` in the auction rail for initial bids and eligible raises; keep the inventory card as one detail link with no nested bid action.
- [x] Keep `My bids` at one row and one navigation count per vehicle while showing the user's retained accepted amount.
- [x] Preserve focus behavior: a below-reserve success returns to the still-available raise launcher, while a reserve-clearing success moves focus to the replacement ownership note.
- [x] Add domain, hook, component, and journey tests for repeated raises, immutable record replacement, reserve transitions, no-reserve locking, responsive launchers, and both focus outcomes.
- [x] Rerun tests, typecheck, lint, build, diff checks, and 375/768/1440 browser QA without adding competing bidders, changing the `$500` increment, revealing reserve price, or expanding Buy Now/checkout scope.

Exit: a reviewer can raise their own current bid while the reserve remains unmet, see the latest amount everywhere, and encounter an explicit lock once the reserve is met or absent, with no claim of realtime competition or durable auction finality.

### Phase 9 — Redux auction session

This is a behavior-preserving architecture phase. It centralizes the auction session before more shared features are added; it does not add authentication, backend persistence, competing bidders, realtime events, checkout, or new UI.

- [x] Add `@reduxjs/toolkit` and `react-redux` with npm and update `package-lock.json`; do not add a second state library or RTK Query without backend scope.
- [x] Add `src/app/store.ts` with a `createAppStore` factory so application startup and every test can create an isolated store. Initialize one `bidSession` slice with an injected-or-generated `userId`, catalog vehicles, and an empty retained-bids array.
- [x] Create the production store once in `src/main.tsx` and mount the Redux `Provider` there. Move deterministic test identity from the current `<App userId>` prop to the store factory; a normal browser refresh should still create a new anonymous session.
- [x] Keep `applyBid`, reserve evaluation, minimum-bid validation, ownership, and user-bid joins in the domain layer. Redux should coordinate state, not duplicate auction rules inside reducers or components.
- [x] Add `src/features/bidding/bidSessionSlice.ts` with a synchronous `placeBid` thunk/command that reads the latest store snapshot, creates the bid request, calls `applyBid`, dispatches the accepted snapshot, and returns the existing `boolean` result expected by `BidDialog`.
- [x] Inject `createBidId`, `now`, and `resolveReserveStatus` as store services so tests remain deterministic. Never call `crypto.randomUUID()` or `new Date()` from a reducer.
- [x] Keep reducers deterministic and limited to committing accepted state. A rejected request must return `false`, dispatch no state change, and leave the existing session references untouched.
- [x] Keep the current `Vehicle.auctionStart: Date` domain model during this migration. Configure Redux Toolkit's serializability middleware to explicitly accept `Date` values rather than disabling serializability checks, and document that a persistent/backend boundary would normalize dates.
- [x] Add typed `useAppDispatch` and `useAppSelector` hooks in `src/app/hooks.ts`, plus slice selectors for the active user, vehicles, one vehicle by ID, retained bids, one user bid by vehicle, and the current user's stable `My bids` entries/count.
- [x] Subscribe at focused consumer boundaries: the shell owns the navigation count, each route owns its collection or route lookup, ownership-aware cards and rails select their user-bid context, and `BidDialog` dispatches `placeBid` directly. Do not pass Redux session values or action callbacks through components that do not use them.
- [x] Replace and remove `useBidSessionState` only after all callers use the store. Remove its hook-specific ref, tests, comments, and any stale exports instead of leaving two session-state paths.
- [x] Add focused store tests for isolated initialization, supplied/anonymous user identity, accepted and rejected commands, two same-tick raises, reserve-met and no-reserve locking, immutable retained-record replacement, deterministic IDs/timestamps, and unchanged state after rejection.
- [x] Add selector tests for stable catalog order, one `My bids` row per vehicle, current ownership, and missing vehicle/user-bid results. Keep the existing pure domain tests as the source of truth for auction rules.
- [x] Update app and journey tests with a reusable test-store setup. Confirm browse → inspect → bid → raise → `My bids`, invalid routes, focus handoff, and refresh-reset behavior remain unchanged.
- [ ] Inspect the readable `bidSession/acceptedBidApplied` action and session state in Redux DevTools; the QA browser does not have the extension installed. Automated and browser checks confirm no non-serializable-value warnings, duplicate stores, or Strict Mode initialization bugs.
- [x] Update `docs/DESIGN.md`, `README.md`, and walkthrough notes after the migration so they explain why shared auction state moved to Redux while the domain layer stayed framework-independent.
- [x] Run the full test suite, typecheck, OXLint, production build, and `git diff --check`; repeat the 375/768/1440 browser journey and verify there are no console errors or layout/interaction regressions.

Exit: Redux Toolkit owns one isolated auction session, the existing domain functions remain the only source of bid rules, every current user flow behaves the same, and the old custom session hook has been completely removed.

Treat the conditional stretch and optional motion as the first cuts if scope needs to be reduced; preserve the core bid feedback, responsive QA, and README.

## Acceptance Checklist

- [x] A fresh clone can be installed and started by following the README exactly.
- [x] All 200 vehicles are available to browse.
- [x] Search and body-style filtering work together and can be cleared.
- [x] Every vehicle has a navigable detail view containing all required information.
- [x] A first bid and every eligible raise enforce the same `$500` increment from the current bid.
- [x] The same user can raise a bid while the current reserve status is `Reserve not met`; repeat bidding is rejected for `Reserve met` and `No reserve`.
- [x] Every successful initial or repeat bid creates a new immutable record object, replaces the prior retained user-vehicle record when present, and updates the current amount, bid count, owner, and public reserve status atomically.
- [x] `My bids` shows each vehicle with a current session bid exactly once, uses the retained user-bid record, and links back to its detail route.
- [x] Refresh clears `My bids` and restores the original catalog with an honest session-only empty state.
- [x] No UI exposes an exact reserve amount or offers a nonfunctional Buy Now action.
- [x] Null and empty data render as deliberate states, not blank space or `null`.
- [x] The reserve-aware journey works at 375px and 1440px without horizontal overflow.
- [x] The desktop and mobile launchers open the same dialog; closing returns focus to the raise launcher while the reserve remains unmet, or to the ownership status when a reserve-clearing bid removes it.
- [x] Focus lifecycle, labels, semantic structure, image alt text, and key color contrast have been checked.
- [ ] Native Tab traversal and OS/browser reduced-motion preference emulation have been checked.
- [x] Phase 8 tests, type-checking, linting, and production build pass.
- [x] Redux owns the active auction session without changing bid eligibility, visible copy, focus behavior, refresh reset, or responsive UI.
- [x] Redux commands and selectors cover the current-user journey, no stale `useBidSessionState` path remains, and no session-only prop chain relays the bid action or user context.
- [x] Phase 9 tests, type-checking, linting, production build, diff checks, and browser parity checks pass.
- [x] The repository contains no secrets, generated junk, or abandoned UI attempts.
- [x] Phase 6 changes are committed and the working tree is clean; intentionally left for owner diff review.

## Codex + Claude Working Protocol

Use the tools sequentially, not as competing implementers.

1. Work from one shared implementation branch.
2. Only one tool owns a phase and overlapping files at a time.
3. Start each handoff by reading this plan, `git status`, and the latest commits.
4. End each phase with tests/build as appropriate, a focused commit, and checked plan items.
5. Use Claude for a bounded product/UX/copy or code-review pass after a coherent feature exists.
6. Use Codex for repository integration, domain behavior, testing, browser QA, and final verification.
7. The human owner makes scope and product decisions; AI suggestions do not silently expand the build.
8. Record meaningful AI usage and the decisions retained or rejected so the workflow can be explained honestly in the walkthrough.
9. Never allow one tool to overwrite uncommitted work from the other.

## Implementation Log

Update this table at each phase boundary; record actual results rather than intended work.

| Phase                                    | Owner | Status           | Outcome                                                                                                                                                                                                                                                                                                                    | Verification                                                                                                                                                                                                                                                                                  | Commit                                                    |
| ---------------------------------------- | ----- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| 0 — Decisions and scaffold               | Codex | Complete         | Root scaffold, Wouter routes, test foundation, and inspection-docket shell                                                                                                                                                                                                                                                 | 2 tests, typecheck, OXLint, build, preview, clean audit, and 375/1440 browser QA                                                                                                                                                                                                              | `feat: scaffold React buyer experience`                   |
| 1 — Domain and data layer                | Codex | Complete         | Runtime-validated 200-vehicle catalog, display normalization, rolling seven-day schedule, auction/reserve/bid rules, and inventory query helpers                                                                                                                                                                           | 32 tests, typecheck, OXLint, build, clean audit, and localhost smoke test                                                                                                                                                                                                                     | `5c64fa4`                                                 |
| 2 — Inventory experience                 | Codex | Complete         | Searchable 200-lot inventory, live open-first ordering, risk-forward vehicle cards, detail links, and deliberate empty/image-fallback states                                                                                                                                                                               | 39 tests, typecheck, OXLint, build, clean audit, interaction smoke test, and 375/768/1440 browser QA                                                                                                                                                                                          | `00e2b2a`, `e0db903`                                      |
| 3 — Vehicle detail experience            | Codex | Complete         | Vehicle-ID detail routes, null-safe gallery and cards, read-only auction rail, complete specs and seller data, plus explicit risk, conflicting-data, null, and missing-vehicle states                                                                                                                                      | 58 tests, typecheck, OXLint, build, clean audit, gallery interaction smoke test, and 375/768/1440 browser QA                                                                                                                                                                                  | `27eafd8`, `af51dc4`                                      |
| 4 — Bid flow                             | Codex | Complete         | Vehicle-ID session state, private reserve derivation, inline entry/review/success flow, guarded bid acceptance, and synchronized session bid state across detail and inventory                                                                                                                                             | 72 tests, typecheck, OXLint, build, clean audit, invalid/review/success/navigation smoke tests, and 375/768/1440 browser QA                                                                                                                                                                   | `6fa55c8`                                                 |
| 4A — Focused bid dialog                  | Codex | Complete         | Summary-only auction rail, one native entry/review/success dialog, responsive desktop/mobile launchers, guarded acceptance, and complete modal focus/scroll cleanup                                                                                                                                                        | 77 tests, typecheck, OXLint, build, clean audit, invalid/review/cancel/Escape/success/focus smoke tests, scheduled-lot check, and 375/768/1440 browser QA                                                                                                                                     | `6fa55c8`                                                 |
| 5 — Craft, responsiveness, accessibility | Codex | Manual follow-up | Softened surface hierarchy, cached-gallery loading, route-heading focus, stronger contrast, explicit content groups, corrected mobile launcher clearance, centralized status rules, compressed inventory hero, photo-first cards, compact auction overlays, independent filter chips, and a scroll-aware mobile bid action | 91 tests, typecheck, OXLint, build, diff check, and 375/641/768/1440 Browser QA; visible focus, semantics, labels, alt text, contrast, dialog behavior, fallback states, image loading, controls, and overflow checked; native Tab traversal and OS reduced-motion emulation remain manual    | `62081a9`                                                 |
| 6 — Verification and submission package  | Codex | Complete         | Archived the original brief verbatim, replaced the root README with reviewer setup and decisions, added walkthrough notes, updated source paths, and strengthened transient mobile-action contrast                                                                                                                         | Clean archive: `npm ci` with 0 vulnerabilities; 93 tests in 14 files, typecheck, OXLint, and build pass; dev and preview root/deep-route startup plus 375/768/1440 Browser journey, scheduled state, refresh reset, console, semantics, contrast, documentation-link, secret, and junk audits | Uncommitted for owner review                              |
| 7 — My bids and bid ownership            | Codex | Complete         | Session-scoped anonymous `userId`, immutable bid records, owner-bearing current-bid snapshots, a stable vehicle join for `/bids`, identity-based ownership, one direct bid per user/vehicle, shared image fallback behavior, and an honest refresh reset                                                                   | 111 tests in 15 files, typecheck, OXLint, build, diff check, and user-ID/unknown-owner/immutable-record/repeated-bid/ownership/refresh coverage; prior browser journeys verified focus handoff and 375/768/1440 layouts without horizontal overflow                                           | Uncommitted for owner review                              |
| 8 — Reserve-aware self-raising           | Codex | Complete         | Shared `place`/`raise`/`locked` domain eligibility, one immutably replaced user-bid record per vehicle, responsive raise launchers, honest owner/neutral lock states, and one current `My bids` row per vehicle                                                                                                            | 125 tests in 15 files, typecheck, OXLint, build, and diff check; live two-bid reserve transition, exact focus handoffs, console, and no-overflow QA passed at 375/768/1440                                                                                                                    | `2a8dc61`                                                 |
| 9 — Redux auction session                | Codex | Manual follow-up | One isolated Redux Toolkit store, deterministic synchronous bid command, focused consumer subscriptions, direct dialog dispatch, and removal of both the custom session hook and Redux-only prop chains                                                                                                                    | 130 tests in 15 files, typecheck, OXLint, build, diff check, prior 375/768/1440 parity, and a live detail → bid → `My bids` smoke test with synchronized state and no console warnings; Redux DevTools visual inspection remains manual because the QA browser has no extension               | `9d02cdb`; consumer refactor uncommitted for owner review |

## Walkthrough Story

The implementation should support this concise narrative:

- **Product decision:** condition and title risk are promoted because wholesale buyers need confidence before price action.
- **Scope decision:** one excellent buyer journey was prioritized over accounts, backend simulation, or broad marketplace features.
- **Technical decision:** Redux Toolkit makes shared auction-session ownership explicit, while a synchronous command delegates every bid rule to the pure domain transition and reducers only commit accepted results.
- **Data decision:** stale start dates and missing auction ends were handled transparently instead of inventing false countdowns.
- **Workflow decision:** AI accelerated implementation and review, while scope, tradeoffs, verification, and final ownership remained explicit.

## Stop Condition

Do not submit merely because the UI looks polished. The work is ready only when the minimum journey, reserve-aware raise/lock states, responsive behavior, bid validation/update, current-user `My bids` view, tests, clean-clone instructions, and walkthrough explanation are all complete.
