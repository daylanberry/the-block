import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import {
  getUserBidEntries,
  type UserBidEntry,
} from '../../../domain/bidding'
import { makeBid } from '../../../test/bidFactory'
import { makeVehicle } from '../../../test/vehicleFactory'
import { MyBidsRoute } from './MyBidsRoute'

const referenceTime = new Date(2026, 7, 4, 12)
const userId = 'user-1'

function renderMyBids(entries: readonly UserBidEntry[] = []) {
  const { hook } = memoryLocation({ path: '/bids', static: true })

  return render(
    <Router hook={hook}>
      <MyBidsRoute entries={entries} now={referenceTime} />
    </Router>,
  )
}

describe('My bids route', () => {
  it('shows an honest session-only empty state with one recovery action', () => {
    renderMyBids()

    expect(
      screen.getByRole('heading', { level: 1, name: 'My bids' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'No bids this session' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('complementary', { name: 'Current bid summary' }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('complementary', { name: 'Session bid summary' }),
    ).toHaveTextContent('0 vehicles with bids')
    expect(screen.getByText(/refreshing starts a new session/i)).toBeVisible()
    expect(
      screen.getByRole('link', { name: /browse inventory/i }),
    ).toHaveAttribute('href', '/')
    expect(
      screen.queryByRole('list', { name: 'Vehicles with your bids' }),
    ).not.toBeInTheDocument()
  })

  it('shows user bid records once in stable vehicle order with canonical links', () => {
    const firstVehicle = makeVehicle({
      id: 'bid-1',
      auctionStart: new Date(2026, 7, 4, 11),
      bid: {
        currentBid: { amount: 30_000, userId },
        bidCount: 9,
        reserveStatus: 'Reserve met',
      },
    })
    const secondVehicle = makeVehicle({
      id: 'bid-2',
      year: 2023,
      make: 'Ram',
      model: '1500',
      trim: 'Laramie',
      lot: 'A-0004',
      auctionStart: new Date(2026, 7, 5, 14),
      bid: {
        currentBid: { amount: 34_000, userId: 'user-2' },
        bidCount: 4,
        reserveStatus: 'Reserve not met',
      },
    })
    const firstBid = makeBid({
      id: 'first-bid',
      vehicleId: firstVehicle.id,
      userId,
      amount: 30_000,
    })
    const secondBid = makeBid({
      id: 'second-bid',
      vehicleId: secondVehicle.id,
      userId,
      amount: 34_000,
    })
    const entries = getUserBidEntries(
      [firstVehicle, makeVehicle({ id: 'no-user-bid' }), secondVehicle],
      [secondBid, firstBid],
      userId,
    )

    renderMyBids(entries)

    const list = screen.getByRole('list', {
      name: 'Vehicles with your bids',
    })
    const rows = within(list).getAllByRole('listitem')
    const links = within(list).getAllByRole('link')

    expect(rows).toHaveLength(2)
    expect(links[0]).toHaveAttribute('href', '/vehicles/bid-1')
    expect(links[1]).toHaveAttribute('href', '/vehicles/bid-2')
    expect(links[0]).toHaveAccessibleName(
      '2025 Volkswagen Tiguan Lot D-0037',
    )
    expect(links[0]).toHaveAccessibleDescription(
      'You hold the current bid',
    )
    expect(links[1]).toHaveAccessibleName('2023 Ram 1500 Lot A-0004')
    expect(links[1]).toHaveAccessibleDescription('Bid recorded')

    expect(within(rows[0]).getByText('$30,000', { exact: false })).toBeVisible()
    expect(
      within(rows[0])
        .getByText('You hold the current bid')
        .closest('[data-tone]'),
    ).toHaveAttribute('data-tone', 'positive')
    expect(within(rows[0]).getByText('View vehicle')).toBeVisible()
    expect(within(rows[0]).getByText('9 bids')).toBeVisible()
    expect(within(rows[0]).getByText('Reserve met')).toBeVisible()
    expect(within(rows[0]).getByText('Open for bidding')).toBeVisible()

    expect(within(rows[1]).getByText('Reserve not met')).toBeVisible()
    expect(within(rows[1]).getByText('Bid recorded')).toBeVisible()
    expect(
      within(rows[1]).getByText('Bid recorded').closest('[data-tone]'),
    ).toHaveAttribute('data-tone', 'neutral')
    expect(
      within(rows[1]).getAllByText('$34,000', { exact: false }),
    ).toHaveLength(1)
    expect(within(rows[1]).getByText('4 bids')).toBeVisible()
    expect(
      within(rows[1]).getByText('Auction starts', { exact: false }),
    ).toBeVisible()
    expect(within(rows[1]).getByText('Wed, Aug 5, 2:00 p.m.')).toBeVisible()
    expect(screen.queryByText(userId)).not.toBeInTheDocument()
    expect(screen.queryByText('first-bid')).not.toBeInTheDocument()
  })

  it('keeps the row usable when its image fails', () => {
    const vehicle = makeVehicle({
      id: 'bid-with-failed-image',
      bid: { currentBid: { amount: 30_000, userId } },
    })
    const [entry] = getUserBidEntries(
      [vehicle],
      [makeBid({ vehicleId: vehicle.id, userId })],
      userId,
    )

    renderMyBids([entry])

    fireEvent.error(
      screen.getByRole('img', {
        name: /2025 volkswagen tiguan sel r-line, lot d-0037/i,
      }),
    )

    expect(
      screen.getByRole('img', {
        name: /photo unavailable for 2025 volkswagen tiguan/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', {
        name: '2025 Volkswagen Tiguan Lot D-0037',
      }),
    ).toHaveAttribute('href', '/vehicles/bid-with-failed-image')
  })
})
