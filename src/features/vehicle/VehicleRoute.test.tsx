import { fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { createAppStore } from '../../app/store'
import type { Bid, TitleStatus, Vehicle } from '../../domain/types'
import { makeBid } from '../../test/bidFactory'
import { renderWithStore } from '../../test/renderWithStore'
import { makeVehicle } from '../../test/vehicleFactory'
import { VehicleRoute } from './VehicleRoute'

const referenceTime = new Date(2026, 7, 4, 12)
const userId = 'user-1'

function renderVehicle(
  vehicle: Vehicle = makeVehicle(),
  userBid?: Bid,
) {
  const { hook } = memoryLocation({ path: `/vehicles/${vehicle.id}`, static: true })
  const store = createAppStore({
    userId,
    initialVehicles: [vehicle],
    initialBids: userBid ? [userBid] : [],
  })

  return renderWithStore(
    <Router hook={hook}>
      <VehicleRoute vehicle={vehicle} now={referenceTime} />
    </Router>,
    store,
  )
}

describe('vehicle detail route', () => {
  it('shows the complete condition-first record and current auction position', () => {
    renderVehicle()

    expect(
      screen.getByRole('heading', { level: 1, name: '2025 Volkswagen Tiguan' }),
    ).toBeInTheDocument()
    expect(screen.getByText('SEL R-Line')).toBeInTheDocument()
    expect(screen.getAllByText('Toronto, Ontario')).toHaveLength(2)
    expect(screen.getAllByText('24,534 km')).toHaveLength(2)

    const conditionSection = screen.getByRole('region', {
      name: 'Condition & title',
    })
    expect(within(conditionSection).getByText('4.6')).toBeInTheDocument()
    expect(within(conditionSection).getByText('Clean')).toBeInTheDocument()
    expect(
      within(conditionSection).getAllByText('No reported damage'),
    ).toHaveLength(2)
    expect(
      within(conditionSection).getByText('Very clean vehicle.'),
    ).toBeInTheDocument()

    const specifications = screen.getByRole('region', {
      name: 'Specifications',
    })
    expect(within(specifications).getByText('2.0L Turbo I4')).toBeInTheDocument()
    expect(within(specifications).getByText('Automatic')).toBeInTheDocument()
    expect(within(specifications).getByText('AWD')).toBeInTheDocument()

    const seller = screen.getByRole('region', {
      name: 'Seller & identifiers',
    })
    expect(
      within(seller).getByText('Grand Touring Motors'),
    ).toBeInTheDocument()
    expect(within(seller).getByText('1HGCM82633A004352')).toBeInTheDocument()
    expect(within(seller).getByText('D-0037')).toBeInTheDocument()

    const auctionRail = screen.getByRole('complementary', {
      name: 'Open for bidding',
    })
    expect(within(auctionRail).getByText('D-0037')).toBeInTheDocument()
    expect(within(auctionRail).getByText('Open')).toBeInTheDocument()
    expect(within(auctionRail).getByText('Current bid')).toBeInTheDocument()
    expect(within(auctionRail).getByText('$29,500')).toBeInTheDocument()
    expect(within(auctionRail).getByText('8 bids')).toBeInTheDocument()
    expect(within(auctionRail).getByText('Reserve not met')).toBeInTheDocument()
    expect(within(auctionRail).getAllByText('$30,000').length).toBeGreaterThan(0)
    const bidTrigger = within(auctionRail).getByRole('button', {
      name: 'Place a bid',
    })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(bidTrigger)

    const bidDialog = screen.getByRole('dialog', { name: 'Place a bid' })
    expect(
      within(bidDialog).getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toBeInTheDocument()
    expect(
      within(bidDialog).getByRole('button', { name: 'Review bid' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('note', { name: 'Conflicting title data' }),
    ).not.toBeInTheDocument()
  })

  it('keeps scheduled lots read-only while showing existing risk and no-bid states', () => {
    renderVehicle(
      makeVehicle({
        titleStatus: 'Rebuilt',
        damageNotes: ['Scratch on liftgate', 'Paint chip on hood'],
        auctionStart: new Date(2026, 7, 5, 14),
        bid: {
          currentBid: null,
          bidCount: 0,
          reserveStatus: 'No reserve',
        },
      }),
    )

    expect(
      screen.getByRole('complementary', { name: 'Scheduled' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Starting bid')).toBeInTheDocument()
    expect(screen.getByText('$22,000')).toBeInTheDocument()
    expect(screen.getByText('No bids yet')).toBeInTheDocument()
    expect(screen.getByText('No reserve')).toBeInTheDocument()
    expect(screen.getByText('Wed, Aug 5, 2:00 p.m.')).toBeInTheDocument()
    expect(screen.getByText('Rebuilt')).toBeInTheDocument()
    expect(screen.getByText('Scratch on liftgate')).toBeInTheDocument()
    expect(screen.getByText('Paint chip on hood')).toBeInTheDocument()
    expect(
      screen.getByText(
        'This lot remains read-only until its scheduled auction opens.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Place a bid' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the next minimum and an active raise action while reserve is not met', () => {
    renderVehicle(
      makeVehicle({
        bid: {
          currentBid: { amount: 30_000, userId },
          bidCount: 9,
          reserveStatus: 'Reserve not met',
        },
      }),
      makeBid({ userId, amount: 30_000 }),
    )

    const auctionRail = screen.getByRole('complementary', {
      name: 'Open for bidding',
    })

    expect(within(auctionRail).getByText('Next valid bid')).toBeInTheDocument()
    expect(within(auctionRail).getByText('$30,500')).toBeInTheDocument()
    expect(within(auctionRail).getByRole('note')).toHaveTextContent(
      'You hold the current bidReserve not met — you can raise your bid',
    )

    const raiseTrigger = within(auctionRail).getByRole('button', {
      name: 'Raise your bid',
    })
    fireEvent.click(raiseTrigger)

    expect(
      screen.getByRole('dialog', { name: 'Raise your bid' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveAttribute('placeholder', '30,500')
  })

  it('shows current-bid ownership without offering another self-bid once reserve is met', () => {
    renderVehicle(
      makeVehicle({
        bid: {
          currentBid: { amount: 30_000, userId },
          bidCount: 9,
          reserveStatus: 'Reserve met',
        },
      }),
    )

    const auctionRail = screen.getByRole('complementary', {
      name: 'Open for bidding',
    })

    expect(within(auctionRail).getByText('Current bid')).toBeInTheDocument()
    expect(within(auctionRail).getByRole('note')).toHaveTextContent(
      'You hold the current bid',
    )
    expect(
      within(auctionRail).queryByText('Next valid bid'),
    ).not.toBeInTheDocument()
    expect(
      within(auctionRail).queryByRole('button', { name: 'Place a bid' }),
    ).not.toBeInTheDocument()
  })

  it('keeps a non-current recorded bid read-only', () => {
    renderVehicle(
      makeVehicle({
        bid: {
          currentBid: { amount: 30_500, userId: 'user-2' },
          bidCount: 10,
          reserveStatus: 'Reserve met',
        },
      }),
      makeBid({ userId, amount: 30_000 }),
    )

    const auctionRail = screen.getByRole('complementary', {
      name: 'Open for bidding',
    })

    expect(within(auctionRail).getByText('$30,500')).toBeVisible()
    expect(within(auctionRail).getByRole('note')).toHaveTextContent(
      'Bid recorded',
    )
    expect(
      within(auctionRail).queryByRole('button', { name: 'Place a bid' }),
    ).not.toBeInTheDocument()
  })

  it.each([
    ['Clean', 'positive'],
    ['Rebuilt', 'warning'],
    ['Salvage', 'critical'],
  ] as const)(
    'renders the %s title as an explicit %s risk state',
    (titleStatus: TitleStatus, tone) => {
      renderVehicle(makeVehicle({ titleStatus }))

      expect(screen.getByText(titleStatus).closest('[data-tone]')).toHaveAttribute(
        'data-tone',
        tone,
      )
    },
  )

  it('flags conflicting title language without hiding the supplied report', () => {
    renderVehicle(
      makeVehicle({
        titleStatus: 'Clean',
        conditionReport: 'Good condition overall. Salvage title.',
      }),
    )

    expect(
      screen.getByText('Good condition overall. Salvage title.'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('note', { name: 'Conflicting title data' }),
    ).toHaveTextContent(
      'The title record lists Clean, but the supplied report references Salvage.',
    )
  })
})
