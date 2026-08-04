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

`Find inventory → inspect a vehicle → review a bid → place the bid → see the result`

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

At desktop widths, use a primary content column and a sticky bid rail. At mobile widths, use one content column and a single sticky action that moves focus to the bid panel; do not duplicate the form.

### Bid flow

Use a three-state bid panel rather than a separate multi-page flow:

1. **Entry:** show the minimum bid, currency, input, and inline validation.
2. **Review:** replace the entry controls with a concise bid summary and explicit confirm/cancel actions.
3. **Success:** acknowledge the bid and show the updated amount, count, reserve state, and `Your bid` label.

The confirmation control should state the amount, such as `Place $24,500 bid`, rather than using a vague `Confirm` label.

## Content Rules

- Treat money as CAD and label it where ambiguity is possible.
- Format VIN and lot values consistently and make them easy to scan.
- Normalize display casing without modifying the source JSON.
- Use `No reported damage` when damage notes are empty.
- Use `No bids yet` alongside the starting bid when `current_bid` is null.
- Show only `No reserve`, `Reserve not met`, or `Reserve met`; never reveal `reserve_price`.
- Do not render a Buy Now action in this prototype.
- Prefer direct auction language over promotional copy.

## Visual Direction

The product should feel like an **industrial inspection docket joined with a live auction board**. It should not resemble a generic rounded-card SaaS dashboard.

### Color roles

Use these as initial implementation tokens and adjust only when contrast testing requires it:

| Role | Token | Value | Use |
|---|---|---:|---|
| Canvas | `--color-canvas` | `#F1EEE5` | Warm page background |
| Surface | `--color-surface` | `#FFFCF4` | Cards and detail sections |
| Graphite | `--color-ink` | `#191B18` | Primary text and framing |
| Muted | `--color-muted` | `#60645E` | Secondary information |
| Rule | `--color-rule` | `#C9C6BC` | Dividers and boundaries |
| Action | `--color-action` | `#F15A24` | Primary action and active control |
| Positive | `--color-positive` | `#26734D` | Confirmed and reserve-met states |
| Warning | `--color-warning` | `#9A6100` | Reserve-not-met and caution states |
| Critical | `--color-critical` | `#A9362C` | Salvage and validation errors |

Use graphite text on the orange action color unless contrast testing establishes a better accessible pairing. Status must always include text or an icon; color alone never carries meaning.

### Typography

- Use a locally bundled condensed automotive face such as Barlow Condensed for display headings.
- Use IBM Plex Sans for controls and body copy.
- Enable tabular numerals for prices, odometer values, lot numbers, and bid counts.
- Use uppercase sparingly for short labels and inspection-style metadata, not paragraphs.

### Shape and depth

- Prefer square or lightly rounded corners in the `2px–6px` range.
- Use thin rules and surface contrast before adding shadows.
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
- image load failure
- 375px and 1440px layouts
- reduced-motion preference

## Reference Demo Vehicle

Use lot `D-0037`, the 2025 Volkswagen Tiguan, for the primary walkthrough. It exercises an active bid, unmet reserve, clean title, no reported damage, and a strong condition grade.

## Design Review Standard

A phase is not visually complete because its happy path has styling. Review it against this document, the required states above, and the acceptance checklist in `PLAN.md`. Any deviation should be deliberate, recorded, and easier for the buyer to understand.
