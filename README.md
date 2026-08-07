<p align="center">
  <img src="docs/the_block_repo.png" alt="The Block coding challenge artwork" width="960" />
</p>

# The Block

A condition-first wholesale vehicle auction prototype built with React. Buyers can search the supplied 200-vehicle catalog, assess vehicle and title risk, inspect a dedicated detail record, and complete a guarded bid flow on desktop or mobile.

**Live demo:** [the-block-self.vercel.app](https://the-block-self.vercel.app)

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

## Time spent

Approximately six hours of focused implementation, followed by additional intermittent review, testing, and documentation across the challenge window.

## What I built

- A responsive inventory experience backed by all 200 supplied vehicles.
- Search across vehicle identity, VIN, lot, and dealership plus lightweight body-style filters.
- Photo-first inventory cards that promote condition, title, damage, auction, reserve, and bid signals.
- Canonical `/vehicles/:vehicleId` detail routes with gallery, specifications, condition report, damage, seller, location, VIN, and lot information.
- Null-safe, failure-safe vehicle photography with a stable loading frame and fallback state.
- One shared semantic bid dialog for the desktop rail and mobile sticky action.
- Inline bid validation, an explicit review step, and immediate session updates to current bid, bid count, reserve state, and buyer position.
- Reserve-aware self-raising while the reserve remains unmet, followed by an explicit ownership lock when the reserve is met or absent.
- A session-scoped `/bids` view with one row per vehicle the buyer has bid on, a unique-vehicle navigation count, clear current-bid ownership, and canonical links back to each auction record.
- Deliberate empty, scheduled-auction, missing-vehicle, missing-image, and title-risk states.

## Product direction

The central product decision is **condition before persuasion**. Wholesale buyers need to understand title and condition risk alongside price, so those signals remain visible in both inventory and detail views rather than being buried in secondary tabs.

The visual language joins an inspection docket with a live auction board: cool neutral surfaces, cobalt primary actions, compact lot metadata, condensed automotive headings, and status colors reserved for meaning.

The primary journey stays intentionally narrow:

`Find inventory → inspect a vehicle → place or raise a bid → see the reserve-aware result → review My bids`

## Notable decisions

### Keep bid rules outside React

Formatting, catalog normalization, auction state, reserve state, search/filtering, bid validation, and repeat-bid eligibility live in the domain layer. Bid acceptance remains a pure immutable transition. Redux Toolkit owns the shared session snapshot, and a synchronous command reads the latest state, calls that transition, and commits only accepted results. Focused components select only the session values they use, while the bid dialog dispatches that command directly instead of receiving a callback through the route tree. This keeps the auction rules testable without coupling them to React or Redux reducers.

The application creates one anonymous `userId` for the current browser session and retains one latest bid record per user and vehicle. A first bid creates that immutable record; an accepted raise replaces it with a new record containing the new ID, amount, and ISO timestamp. An incoming ID matching a retained record remains invalid, while production-grade lifetime idempotency belongs on the server. A prior bidder may submit another minimum-valid bid only while the vehicle's current public reserve status is `Reserve not met`; `Reserve met` and `No reserve` lock further self-bidding. `You hold the current bid` appears only when the current auction bid's owner ID matches the active user ID—equal amounts alone never imply ownership. Supplied catalog bids have an unknown owner.

### Route by vehicle ID, not lot number

`vehicle.id` is the canonical route and state identity. Lot numbers remain searchable display metadata because a production marketplace can contain multiple vehicles associated with one lot or reused lot labels.

### Protect reserve information

The buyer sees only `No reserve`, `Reserve not met`, or `Reserve met`. The exact reserve price remains private and is used only to derive the display state.

### Normalize synthetic auction dates honestly

The supplied seven-day schedule is shifted deterministically relative to the current day while preserving its spacing. The UI says `Open` or `Auction starts`; it does not invent an end time, timezone, countdown, or urgency claim absent from the data. The store's serializability check explicitly accepts the existing normalized `Date` values; a persistent API boundary would exchange a serialized date representation instead.

### Use one focused bid dialog

The desktop auction rail and mobile sticky action open the same native dialog and form. Entry, review, and success remain isolated from the dense vehicle record, with Escape/cancel support, background scroll locking, and focus restoration to the exact launcher.

### Derive My bids from session state

`My bids` filters the retained user-bid records by the active `userId`, then joins them to the same immutable vehicle collection used by inventory and detail routes. The result retains stable vehicle order and one row per bid vehicle without a separate mutable view store. The anonymous user ID, navigation count, records, and view reset with the rest of the prototype on refresh.

### Treat incomplete image data as normal input

Null and empty image entries are discarded during normalization. The gallery separately tracks loaded and failed primary images, recognizes already-cached images, and preserves the layout with a labeled fallback when photography is unavailable.

## Assumptions and scope

- All monetary values are CAD because the catalog contains Canadian locations but no currency field.
- The minimum bid is the starting bid when no bid exists, otherwise the current bid plus `$500`.
- The in-memory `userId` is an anonymous prototype identity, not authentication. A backend can replace its source with the authenticated user's ID without changing the bid ownership rules.
- The prototype accepts reserve-aware self-raises while the current public status is `Reserve not met`; repeat bids lock for `Reserve met` and `No reserve`. Competing-bid updates, outbid detection, and server-authoritative auction position remain future work.
- A normalized auction whose start time has passed is open for bidding; a scheduled auction cannot accept bids.
- Bid changes are session-only and reset on refresh. No persistence is implied.
- The source JSON is treated as immutable input and normalized in application code.
- This is intentionally frontend-only: there is no backend, database, authentication, payment, seller, or realtime bidding system.
- Buy Now, proxy/max bidding, transportation, services, guarantees, and payment methods remain out of scope rather than appearing as nonfunctional UI.
- Exact reserve prices are never exposed to the buyer.

## Stack and structure

- React 19, TypeScript, Vite, Wouter, Redux Toolkit, and React Redux.
- Custom CSS with a small token system and locally bundled Barlow Condensed and IBM Plex Sans fonts.
- Vitest, React Testing Library, JSDOM, and OXLint.
- Build-time JSON import with no API or database layer.

```text
src/
  app/                  routing, store configuration, and typed Redux hooks
  components/           shared application shell
  domain/               normalization and pure business rules
  features/inventory/   search, filters, and vehicle cards
  features/vehicle/     detail record, gallery, and auction rail
  features/bidding/     bid dialog, current-bid view, and Redux session slice
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

The final automated run passes 130 tests across 15 files, TypeScript, OXLint, and the production build.

The automated suite covers catalog validation and normalization, search/filter behavior, auction and reserve rules, immutable latest-bid replacement, user-ID ownership, unknown catalog owners, reserve-aware repeat eligibility, Redux commands and selectors, stable My-bids joins, routing, gallery loading/failure behavior, responsive launchers, dialog validation/review/success, focus management, refresh reset, and visible session updates.

The final manual pass exercises search, combined filters, empty results, detail navigation, gallery controls, invalid and valid bids, an eligible raise, the reserve-clearing lock, current-bid ownership, the empty and populated `My bids` views, canonical return navigation, refresh behavior, keyboard focus, and responsive layouts at 375px, 768px, and 1440px. The browser-loaded styles were also checked for the global `prefers-reduced-motion` override. A clean-directory `npm ci` and startup check confirms the documented setup.

## AI-assisted workflow

AI tools were encouraged by the challenge and used deliberately. Codex and Claude worked sequentially from shared [`AGENTS.md`](AGENTS.md), [`PLAN.md`](docs/PLAN.md), and [`DESIGN.md`](docs/DESIGN.md) contracts rather than maintaining separate interpretations of the product.

They assisted with bounded implementation phases, test creation, UX and code-review passes, and browser verification. I retained ownership by setting scope, reviewing diffs before commits, challenging architectural and interaction choices, asking for explanations of unfamiliar code, and deciding which recommendations to keep or reject.

## What I would add next

1. Replace the anonymous `userId` source with authenticated server identity, then add a server-authoritative auction API with concurrency control, idempotent bid submission, realtime updates, and trustworthy competing-bid/outbid states.
2. Durable bid history, audit events, and production reserve enforcement without exposing private seller data.
3. End-to-end and visual-regression coverage across supported browsers and mobile devices.
4. Production image delivery, telemetry, error reporting, and performance budgets.
5. Watchlists or comparison tools only after the core browse-to-bid flow remains clear at production scale.

## Walkthrough

The recommended demo uses lot `B-0004`, a 2025 Subaru Outback whose bid state moves from an eligible reserve-unmet raise to a reserve-clearing lock in two minimum-valid steps. Its rebuilt title and reported damage also demonstrate the condition-first hierarchy. See [the walkthrough notes](docs/WALKTHROUGH_NOTES.md) for the five-minute path and technical talking points.
