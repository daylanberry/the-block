# The Block — Product and Design Contract

## Purpose

The Block helps a wholesale vehicle buyer answer three questions quickly:

1. Is this the kind of vehicle I am looking for?
2. What condition or title risk am I accepting?
3. What is the next valid bid I can place?

The interface should make those answers obvious without training, onboarding, or explanatory detours.

## Product Principles

### Condition before persuasion

Promote condition grade, title status, damage, location, and reserve state alongside price. Do not hide risk behind a marketing-oriented card or require the buyer to hunt through tabs.

### One primary journey

The prototype supports one polished path:

`Find inventory → inspect a vehicle → review a bid → place the bid → see the result → review My bids`

Do not introduce competing account, checkout, seller, or payment paths.

### Honest auction language

The data contains an auction start but no auction end or timezone. Use `Open` and `Auction starts`; never invent urgency with an unsupported countdown or "ending soon" claim.

### Dense, not cluttered

Wholesale buyers benefit from useful information density. Group related facts, maintain a clear reading order, and avoid decorative badges or containers that compete with vehicle risk and bid state.

## Information Architecture

### Inventory route

The inventory page presents, in order:

1. Compact product header.
2. Clear page title and inventory count.
3. Search input and body-style chips.
4. Filtered result count and clear action when relevant.
5. Responsive vehicle grid or intentional empty state.

Each vehicle card shows:

- primary image
- year, make, model, and trim
- city and province
- odometer
- condition grade
- title status
- damage signal when one exists
- `Open` or `Auction starts` state
- current bid or starting bid
- reserve status where applicable

The card has one navigation destination: the vehicle detail route. Avoid nested or competing card actions.

### Vehicle detail route

The detail page presents, in order:

1. Back-to-inventory navigation.
2. Vehicle identity, location, lot, and auction state.
3. Photo gallery.
4. Price and bid state.
5. Condition, title, and damage summary.
6. Vehicle specifications and odometer.
7. Dealership, VIN, and lot details.

At desktop widths, use a primary content column and a sticky summary bid rail. At mobile widths, use one content column and a single sticky action that opens the shared bid dialog; do not duplicate the form.

### My bids route

The `My bids` page is a session-scoped current-bid view, not an account dashboard or transaction history. It presents:

1. A concise page heading and unique vehicle count.
2. A clear note that the current session resets on refresh.
3. One compact row per vehicle joined to the retained bid record whose `userId` matches the active prototype user, retaining stable catalog order.
4. Your bid, bid count, reserve state, exact auction state, and directly evidenced current-bid ownership.
5. One canonical link from each row back to `/vehicles/:vehicleId`.

Show `You hold the current bid` only when the current auction bid's owner `userId` matches the active `userId`. Equal monetary values never prove ownership. If the user has a bid record but the current owner is unknown or different, use the neutral `Bid recorded` state. While the reserve remains unmet, that neutral state may offer a higher-bid path without inventing an outbid event. When bidding is locked, pair `Bid recorded` with the public reserve state and `further bidding unavailable`; reserve `No action needed` for evidenced current owners. Never claim that the buyer is winning, has won, or owns a final auction result.

The frontend-only Redux session creates one anonymous `userId` and retains one latest bid record per user and vehicle. The store coordinates shared state across inventory, vehicle detail, and `My bids`, while the framework-independent domain layer remains the only source of bidding rules. Focused components select only the session values they consume, and the bid dialog dispatches the shared bid command directly instead of receiving it through the route tree. An accepted raise replaces that record immutably with its new ID, amount, and timestamp while the auction bid count still increments. A prior bidder may raise only while the vehicle's current reserve status is `Reserve not met`; `Reserve met` and `No reserve` lock repeat bidding. Internal bid and user IDs never appear in visible or accessible content. The prototype has no competing-bid feed or durable event ledger, so it does not render realtime outbid behavior or imply bid-history persistence. The empty state uses one `Browse inventory` action.

### Bid flow

Use one shared three-state bid dialog rather than an embedded form or separate multi-page flow:

1. **Entry:** show the minimum bid, currency, input, and inline validation.
2. **Review:** replace the entry controls with a concise bid summary and explicit confirm/cancel actions.
3. **Success:** acknowledge the bid and show the updated amount, count, reserve state, and current-bid ownership.

The confirmation control should state the amount, such as `Place $24,500 bid`, rather than using a vague `Confirm` label.

Keep the dialog focused on the bid itself. Do not add max/proxy bidding, notes, services, transportation, guarantees, or payment collection. After a bid that leaves the reserve unmet, retain one `Raise your bid` launcher with the next `$500` minimum. After a bid results in `Reserve met` or `No reserve`, remove the launcher and show `You hold the current bid` / `No action needed`. On close, restore focus to the exact launcher when it remains; after a reserve-clearing bid removes that launcher, move focus to the replacement ownership status.

## Content Rules

- Treat money as CAD and label it where ambiguity is possible.
- Format VIN and lot values consistently and make them easy to scan.
- Normalize display casing without modifying the source JSON.
- Use `No reported damage` when damage notes are empty.
- Use `No bids yet` alongside the starting bid when `current_bid` is null.
- Derive `You hold the current bid` only when the current bid owner `userId` matches the active `userId`; otherwise describe an existing user bid neutrally as `Bid recorded` without inventing an auction position.
- For an eligible raise, pair ownership copy with `Reserve not met — you can raise your bid`; use `Raise your bid` as the action label and keep the next minimum visible in CAD.
- For a locked prior bid without current ownership, use `[public reserve state] — further bidding unavailable`; use `No action needed` only with evidenced ownership.
- Show only `No reserve`, `Reserve not met`, or `Reserve met`; never reveal `reserve_price`.
- Do not render a Buy Now action in this prototype.
- Prefer direct auction language over promotional copy.

## Visual Direction

The product should feel like an **industrial inspection docket joined with a live auction board**, expressed through The Block's supplied cobalt identity. Treat the challenge artwork as a brand reference rather than a literal product screen: retain its broken-ring mark, confident blue, and automotive character without copying its decorative collage or glossy dashboard treatment.

### Color roles

Use these as initial implementation tokens and adjust only when contrast testing requires it:

| Role        | Token                 |     Value | Use                                      |
| ----------- | --------------------- | --------: | ---------------------------------------- |
| Canvas      | `--color-canvas`      | `#F4F7FB` | Cool neutral page background             |
| Surface     | `--color-surface`     | `#FFFFFF` | Cards and detail sections                |
| Ink         | `--color-ink`         | `#10233F` | Primary text and framing                 |
| Muted       | `--color-muted`       | `#5B6878` | Secondary information                    |
| Rule        | `--color-rule`        | `#CBD6E4` | Dividers and boundaries                  |
| Brand       | `--color-brand`       | `#0B61F3` | Navigation, identity, and primary action |
| Brand deep  | `--color-brand-deep`  | `#063478` | Dark framing and the logo segment        |
| Positive    | `--color-positive`    | `#087A57` | Confirmed and reserve-met states         |
| Warning     | `--color-warning`     | `#8A5700` | Reserve-not-met and caution states       |
| Critical    | `--color-critical`    | `#B8322A` | Salvage and validation errors            |
| Risk accent | `--color-risk-accent` | `#E05A2A` | Small high-risk emphasis only            |

Use white text on brand-blue actions. Green communicates success rather than every clickable action; orange and red are reserved for risk. Use the supplied broken-ring mark instead of inventing a second logo. Status must always include text or an icon; color alone never carries meaning.

### Typography

- Use a locally bundled condensed automotive face such as Barlow Condensed for display headings.
- Use IBM Plex Sans for controls and body copy.
- Enable tabular numerals for prices, odometer values, lot numbers, and bid counts.
- Use uppercase sparingly for short labels and inspection-style metadata, not paragraphs.

### Shape and depth

- Use a deliberate shape hierarchy: keep inspection records, status cells, and lot dockets angular in the `2px–4px` range; allow interactive and elevated surfaces in the `4px–10px` range.
- Use broad, low-opacity shadows and subtle tonal gradients to separate raised controls, cards, statistics, and dialogs from the canvas. Reserve stronger elevation for active or modal layers.
- Soften the search/filter deck, inventory cards, statistics board, and bid dialog without rounding every container.
- Pair shadows with thin rules and surface contrast so information boundaries remain clear.
- Avoid excessive pills. Reserve them for compact filters and true statuses.
- Use lot-number stamps and inspection dividers only where they improve hierarchy.

### Spacing

Use a consistent spacing scale:

`4, 8, 12, 16, 24, 32, 48, 64px`

Dense metadata may use the lower half of the scale. Page sections and major reading transitions use the upper half.

## Responsive Contract

### Phone: 375px reference

- One-column inventory and detail layouts.
- Search and filters remain usable without horizontal page overflow.
- Filter chips may scroll horizontally with an obvious clipped continuation.
- Tap targets are at least 44px where practical.
- The sticky bid action must not obscure content or browser controls.

### Tablet: 768px reference

- Use two inventory columns when card content remains readable.
- Keep the detail page in a single column unless there is enough room for a stable bid rail.

### Desktop: 1440px reference

- Use a bounded content width and a three- or four-column inventory grid based on readable card width.
- Use a two-column detail layout with the bid rail remaining visible during condition review.
- Do not stretch text, cards, or photography across the full viewport.

## Interaction and Motion

- Search and filters update results immediately.
- Preserve visible focus for every interactive element.
- Use one coordinated inventory entrance and a short bid-success transition only after the static hierarchy works.
- Motion must respect `prefers-reduced-motion` and must not delay input or navigation.
- Image loading failures show a stable neutral fallback without changing the card layout.

## Accessibility Contract

- Use semantic headings, landmarks, buttons, links, labels, and form errors.
- Associate validation messages with the bid input and move focus appropriately when state changes.
- Keep modal focus contained, support Escape and visible cancellation, prevent background scrolling, and return focus to the invoking bid action.
- Give vehicle images useful alt text; decorative thumbnails may use empty alt text when the same vehicle is already named nearby.
- Ensure all text and controls meet WCAG AA contrast.
- Make the gallery, filters, navigation, and complete bid flow keyboard-operable.
- Do not communicate title, reserve, auction, or validation status using color alone.

## Required States to Design and Test

- inventory with no search or filter
- combined search and body filter
- zero results
- open vehicle with no bids
- open vehicle with an existing bid
- scheduled vehicle that cannot be bid on yet
- no reserve, reserve not met, and reserve met
- clean, rebuilt, and salvage title
- damage notes and no reported damage
- invalid bid, bid review, and successful bid
- empty and populated current-session `My bids` views
- current-bid ownership with a reserve-unmet raise action
- current-bid ownership locked for reserve met and no reserve
- equal bid amounts with different user IDs that do not imply ownership
- supplied catalog bids with an unknown owner
- repeated accepted raises replacing the retained user bid without adding another `My bids` row
- image load failure
- 375px and 1440px layouts
- reduced-motion preference

## Reference Demo Vehicle

Use lot `B-0004`, the 2025 Subaru Outback, for the primary walkthrough. Its active bid reaches `Reserve met` after two minimum-valid `$500` bids, so the live demo can show both the eligible-raise and locked-ownership states without revealing the private reserve price. Its rebuilt title and reported damage keep the condition-first product decision visible during the same journey.

## Design Review Standard

A phase is not visually complete because its happy path has styling. Review it against this document, the required states above, and the acceptance checklist in `docs/PLAN.md`. Any deviation should be deliberate, recorded, and easier for the buyer to understand.
