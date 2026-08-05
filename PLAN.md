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
6. See the current bid, bid count, and a visible "Your bid" state update immediately.

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
- Bid panel with minimum-bid guidance, inline validation, one confirmation step, and a success state.
- Bid changes reflected in both the detail view and inventory data during the session.
- Responsive behavior at phone and desktop widths.
- Clear local setup and decision documentation in the final README.

### Conditional stretch

- Local watchlist/favorites, only if every required item, test, and responsive check is complete.

### Deliberate exclusions

- Backend, database, authentication, accounts, and realtime networking.
- Seller, admin, checkout, payment, and transportation workflows.
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
- Keep client-side bid state in a small reducer and persist it locally only if that remains simple. Clearly label persistence as prototype-only.
- Recommended walkthrough vehicle: lot `D-0037` (2025 Volkswagen Tiguan), which has an active bid, clean title, no reported damage, a strong grade, and an unmet reserve.

## Design Direction

Use an **industrial inspection-docket** aesthetic rather than a generic marketplace dashboard:

- cool neutral surfaces against cobalt navigation and deep-navy framing
- cobalt as the primary action color and identity layer
- green, amber, and red reserved for trustworthy status meaning
- condensed automotive typography for headings and tabular bid numbers, paired with a highly readable body face
- lot-number stamps, inspection-style dividers, and compact metadata that support the auction context
- generous detail-page hierarchy with a sticky bid rail on desktop and a clear mobile bid action
- restrained motion: one coordinated inventory entrance and a bid-success transition, both respecting reduced-motion preferences

The memorable visual idea should be that the interface feels like an inspection report and live auction board were designed as one product.

## Technical Shape

- React + Vite + TypeScript.
- Wouter for lightweight inventory and `/vehicles/:vehicleId` detail routes.
- Custom CSS with variables and a small token system; avoid a large UI framework.
- A minimal icon package only if needed.
- Build-time JSON import; no API layer for a static 200-record dataset.
- A small domain layer for:
  - formatting and normalization
  - search/filtering
  - auction status
  - reserve status
  - minimum-bid calculation and validation
- A reducer/context for prototype bid state; avoid global-state libraries.
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

- [ ] Show the correct minimum in CAD.
- [ ] Validate empty, nonnumeric, and below-minimum bids inline.
- [ ] Add one review/confirmation step before committing the bid.
- [ ] Update current bid, count, reserve state, and `Your bid` state immediately.
- [ ] Add one behavioral test covering a successful bid and visible update.

Exit: the complete browse → inspect → bid journey works without a backend.

### Phase 5 — Craft, responsiveness, and accessibility

- [ ] Review 375px, 768px, and 1440px layouts.
- [ ] Verify keyboard navigation, visible focus, semantic headings/forms, labels, and useful image alt text.
- [ ] Add loading/fallback treatment and reduced-motion behavior.
- [ ] Remove visual noise, broken promises, stale experiments, and duplicated code.

Exit: the experience feels deliberate, readable, and usable rather than merely complete.

### Phase 6 — Verification and submission package

- [ ] Run tests, TypeScript, lint, production build, and a clean-clone-style startup check.
- [ ] Manually smoke-test search, filters, detail navigation, invalid bids, valid bids, refresh behavior, and mobile layout.
- [ ] Preserve the original challenge README verbatim as `docs/CHALLENGE.md`.
- [ ] Replace the root README with submission-focused documentation and link back to the archived challenge brief.
- [ ] Update the source-of-truth paths in `AGENTS.md` if necessary.
- [ ] Document assumptions, scope, stack, decisions, tests, AI workflow, and what would come next.
- [ ] Prepare the five-minute demo and walkthrough talking points.

Exit: another engineer can clone the fork, run it from the README, and reproduce the core journey.

Treat the conditional stretch and optional motion as the first cuts if scope needs to be reduced; preserve the core bid feedback, responsive QA, and README.

## Acceptance Checklist

- [ ] A fresh clone can be installed and started by following the README exactly.
- [x] All 200 vehicles are available to browse.
- [x] Search and body-style filtering work together and can be cleared.
- [x] Every vehicle has a navigable detail view containing all required information.
- [ ] First bids and subsequent bids enforce the correct $500 increment rule.
- [ ] A successful bid updates amount and count and remains visibly attributable to the current prototype user.
- [x] No UI exposes an exact reserve amount or offers a nonfunctional Buy Now action.
- [x] Null and empty data render as deliberate states, not blank space or `null`.
- [ ] The core journey works at 375px and 1440px without horizontal overflow.
- [ ] Keyboard focus, labels, contrast, and reduced-motion behavior have been checked.
- [ ] Tests, type-checking, linting, and production build pass.
- [ ] The repository is clean and contains no secrets, generated junk, or abandoned UI attempts.

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

| Phase | Owner | Status | Outcome | Verification | Commit |
|---|---|---|---|---|---|
| 0 — Decisions and scaffold | Codex | Complete | Root scaffold, Wouter routes, test foundation, and inspection-docket shell | 2 tests, typecheck, OXLint, build, preview, clean audit, and 375/1440 browser QA | `feat: scaffold React buyer experience` |
| 1 — Domain and data layer | Codex | Complete | Runtime-validated 200-vehicle catalog, display normalization, rolling seven-day schedule, auction/reserve/bid rules, and inventory query helpers | 32 tests, typecheck, OXLint, build, clean audit, and localhost smoke test | `5c64fa4` |
| 2 — Inventory experience | Codex | Complete | Searchable 200-lot inventory, live open-first ordering, risk-forward vehicle cards, detail links, and deliberate empty/image-fallback states | 39 tests, typecheck, OXLint, build, clean audit, interaction smoke test, and 375/768/1440 browser QA | `00e2b2a`, `e0db903` |
| 3 — Vehicle detail experience | Codex | Complete | Vehicle-ID detail routes, null-safe gallery and cards, read-only auction rail, complete specs and seller data, plus explicit risk, conflicting-data, null, and missing-vehicle states | 58 tests, typecheck, OXLint, build, clean audit, gallery interaction smoke test, and 375/768/1440 browser QA | Uncommitted for owner review |
| 4 — Bid flow | — | Not started | — | — | — |
| 5 — Craft, responsiveness, accessibility | — | Not started | — | — | — |
| 6 — Verification and submission package | — | Not started | — | — | — |

## Walkthrough Story

The implementation should support this concise narrative:

- **Product decision:** condition and title risk are promoted because wholesale buyers need confidence before price action.
- **Scope decision:** one excellent buyer journey was prioritized over accounts, backend simulation, or broad marketplace features.
- **Technical decision:** domain helpers and a small reducer keep business behavior testable without production infrastructure.
- **Data decision:** stale start dates and missing auction ends were handled transparently instead of inventing false countdowns.
- **Workflow decision:** AI accelerated implementation and review, while scope, tradeoffs, verification, and final ownership remained explicit.

## Stop Condition

Do not submit merely because the UI looks polished. The work is ready only when the minimum journey, responsive states, bid validation/update, tests, clean-clone instructions, and walkthrough explanation are all complete.
