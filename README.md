<p align="center">
  <img src="docs/the_block_repo.png" alt="The Block coding challenge artwork" width="960" />
</p>

# The Block

A condition-first wholesale vehicle auction prototype built with React. Buyers can search the supplied 200-vehicle catalog, assess vehicle and title risk, inspect a dedicated detail record, and complete a guarded bid flow on desktop or mobile.

The supplied requirements are preserved verbatim in [the original challenge brief](docs/CHALLENGE.md).

## Run locally

### Requirements

- Node.js 24 LTS is recommended through [`.nvmrc`](.nvmrc).
- Node.js `22.12.0` or newer within the supported Node 22 or 24 release lines also works.
- npm and a modern browser.

### Start the app

```bash
git clone https://github.com/daylanberry/the-block.git
cd the-block
nvm install
nvm use
npm ci
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

If `nvm` is not installed, select a supported Node.js version using your normal version manager, then run `npm ci` and `npm run dev`.

### Production preview

```bash
npm run build
npm run preview
```

Vite prints the local preview URL in the terminal.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm test` | Run the Vitest suite once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run typecheck` | Type-check without emitting files |
| `npm run lint` | Run OXLint |
| `npm run build` | Type-check and create the production build |
| `npm run preview` | Serve the production build locally |

## What I built

- A responsive inventory experience backed by all 200 supplied vehicles.
- Search across vehicle identity, VIN, lot, and dealership plus lightweight body-style filters.
- Photo-first inventory cards that promote condition, title, damage, auction, reserve, and bid signals.
- Canonical `/vehicles/:vehicleId` detail routes with gallery, specifications, condition report, damage, seller, location, VIN, and lot information.
- Null-safe, failure-safe vehicle photography with a stable loading frame and fallback state.
- One shared semantic bid dialog for the desktop rail and mobile sticky action.
- Inline bid validation, an explicit review step, and immediate session updates to current bid, bid count, reserve state, and `Your bid` attribution.
- Deliberate empty, scheduled-auction, missing-vehicle, missing-image, and title-risk states.

## Product direction

The central product decision is **condition before persuasion**. Wholesale buyers need to understand title and condition risk alongside price, so those signals remain visible in both inventory and detail views rather than being buried in secondary tabs.

The visual language joins an inspection docket with a live auction board: cool neutral surfaces, cobalt primary actions, compact lot metadata, condensed automotive headings, and status colors reserved for meaning.

The primary journey stays intentionally narrow:

`Find inventory → inspect a vehicle → review a bid → place the bid → see the result`

## Notable decisions

### Keep bid rules outside React

Formatting, catalog normalization, auction state, reserve state, search/filtering, and bid validation live in the domain layer. Bid acceptance is a pure immutable transition, while a small route-level hook owns session state. This keeps the behavior testable and provides a clean starting point for a reducer or server-backed store without requiring global state for this prototype.

### Route by vehicle ID, not lot number

`vehicle.id` is the canonical route and state identity. Lot numbers remain searchable display metadata because a production marketplace can contain multiple vehicles associated with one lot or reused lot labels.

### Protect reserve information

The buyer sees only `No reserve`, `Reserve not met`, or `Reserve met`. The exact reserve price remains private and is used only to derive the display state.

### Normalize synthetic auction dates honestly

The supplied seven-day schedule is shifted deterministically relative to the current day while preserving its spacing. The UI says `Open` or `Auction starts`; it does not invent an end time, timezone, countdown, or urgency claim absent from the data.

### Use one focused bid dialog

The desktop auction rail and mobile sticky action open the same native dialog and form. Entry, review, and success remain isolated from the dense vehicle record, with Escape/cancel support, background scroll locking, and focus restoration to the exact launcher.

### Treat incomplete image data as normal input

Null and empty image entries are discarded during normalization. The gallery separately tracks loaded and failed primary images, recognizes already-cached images, and preserves the layout with a labeled fallback when photography is unavailable.

## Assumptions and scope

- All monetary values are CAD because the catalog contains Canadian locations but no currency field.
- The minimum bid is the starting bid when no bid exists, otherwise the current bid plus `$500`.
- A normalized auction whose start time has passed is open for bidding; a scheduled auction cannot accept bids.
- Bid changes are session-only and reset on refresh. No persistence is implied.
- The source JSON is treated as immutable input and normalized in application code.
- This is intentionally frontend-only: there is no backend, database, authentication, payment, seller, or realtime bidding system.
- Buy Now, proxy/max bidding, transportation, services, guarantees, and payment methods remain out of scope rather than appearing as nonfunctional UI.
- Exact reserve prices are never exposed to the buyer.

## Stack and structure

- React 19, TypeScript, Vite, and Wouter.
- Custom CSS with a small token system and locally bundled Barlow Condensed and IBM Plex Sans fonts.
- Vitest, React Testing Library, JSDOM, and OXLint.
- Build-time JSON import with no API or database layer.

```text
src/
  app/                  routing and application composition
  components/           shared application shell
  domain/               normalization and pure business rules
  features/inventory/   search, filters, and vehicle cards
  features/vehicle/     detail record, gallery, and auction rail
  features/bidding/     bid dialog and session-state adapter
  styles/               global tokens and application styles
  test/                 shared test setup and factories
```

## Verification

The repository is checked with:

```bash
npm test
npm run typecheck
npm run lint
npm run build
```

The final automated run passes 93 tests across 14 files, TypeScript, OXLint, and the production build.

The automated suite covers catalog validation and normalization, search/filter behavior, auction and reserve rules, immutable bid transitions, routing, gallery loading/failure behavior, responsive launchers, dialog validation/review/success, focus management, and visible session updates.

The final manual pass exercises search, combined filters, empty results, detail navigation, gallery controls, invalid and valid bids, refresh behavior, keyboard focus, and responsive layouts at 375px, 768px, and 1440px. The browser-loaded styles were also checked for the global `prefers-reduced-motion` override. A clean-directory `npm ci` and startup check confirms the documented setup.

## AI-assisted workflow

AI tools were encouraged by the challenge and used deliberately. Codex and Claude worked sequentially from shared [`AGENTS.md`](AGENTS.md), [`PLAN.md`](PLAN.md), and [`DESIGN.md`](DESIGN.md) contracts rather than maintaining separate interpretations of the product.

They assisted with bounded implementation phases, test creation, UX and code-review passes, and browser verification. I retained ownership by setting scope, reviewing diffs before commits, challenging architectural and interaction choices, asking for explanations of unfamiliar code, and deciding which recommendations to keep or reject.

## What I would add next

1. A server-authoritative auction API with authenticated buyers, concurrency control, idempotent bid submission, and realtime updates.
2. Durable bid history, audit events, and production reserve enforcement without exposing private seller data.
3. End-to-end and visual-regression coverage across supported browsers and mobile devices.
4. Production image delivery, telemetry, error reporting, and performance budgets.
5. Watchlists or comparison tools only after the core browse-to-bid flow remains clear at production scale.

## Walkthrough

The recommended demo uses lot `D-0037`, a 2025 Volkswagen Tiguan with an active bid, clean title, strong condition grade, no reported damage, and an unmet reserve. See [the walkthrough notes](docs/WALKTHROUGH_NOTES.md) for the five-minute path and technical talking points.
