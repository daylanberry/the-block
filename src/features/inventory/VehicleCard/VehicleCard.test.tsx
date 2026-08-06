import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { makeBid } from '../../../test/bidFactory'
import { makeVehicle } from '../../../test/vehicleFactory'
import { VehicleCard } from './VehicleCard'

const referenceTime = new Date(2026, 7, 4, 12)
const userId = 'user-1'

function renderCard(
  vehicle = makeVehicle(),
  userBid?: ReturnType<typeof makeBid>,
) {
  const { hook } = memoryLocation({ path: '/', static: true })

  return render(
    <Router hook={hook}>
      <VehicleCard
        vehicle={vehicle}
        now={referenceTime}
        userBid={userBid}
        userId={userId}
      />
    </Router>,
  )
}

describe('vehicle card', () => {
  it('shows condition-first details and the current bid state', () => {
    renderCard()

    expect(screen.getByText('Open for bidding')).toBeInTheDocument()
    expect(screen.getByText('4.6')).toBeInTheDocument()
    expect(screen.getByText('Clean')).toBeInTheDocument()
    expect(screen.getByText('No reported damage')).toBeInTheDocument()
    expect(screen.getByText('Current bid')).toBeInTheDocument()
    expect(screen.getByText('$29,500', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('8 bids')).toBeInTheDocument()
    expect(screen.getByText('Reserve not met')).toBeInTheDocument()
    const vehicleLink = screen.getByRole('link', {
      name: '2025 Volkswagen Tiguan Lot D-0037',
    })

    expect(vehicleLink).toHaveAttribute('href', '/vehicles/vehicle-1')
    expect(vehicleLink).toHaveAccessibleName(
      '2025 Volkswagen Tiguan Lot D-0037',
    )
  })

  it('shows scheduled, no-bid, and independent risk states honestly', () => {
    renderCard(
      makeVehicle({
        auctionStart: new Date(2026, 7, 5, 14),
        titleStatus: 'Rebuilt',
        damageNotes: [],
        bid: {
          currentBid: null,
          bidCount: 0,
          reserveStatus: 'No reserve',
        },
      }),
    )

    expect(screen.getByText('Auction starts')).toBeInTheDocument()
    expect(screen.getByText('Wed, Aug 5, 2:00 p.m.')).toBeInTheDocument()
    expect(screen.getByText('Rebuilt')).toBeInTheDocument()
    expect(screen.getByText('No reported damage')).toBeInTheDocument()
    expect(screen.getByText('Starting bid')).toBeInTheDocument()
    expect(screen.getByText('$22,000', { exact: false })).toBeInTheDocument()
    expect(screen.getByText('No bids yet')).toBeInTheDocument()
    expect(screen.getByText('No reserve')).toBeInTheDocument()
  })

  it('keeps damage text independent from a clean title', () => {
    renderCard(
      makeVehicle({
        titleStatus: 'Clean',
        damageNotes: ['Minor scratch on front bumper'],
      }),
    )

    expect(screen.getByText('Clean')).toBeInTheDocument()
    expect(screen.getByText('1 reported issue')).toBeInTheDocument()
  })

  it('shows when the buyer holds the current bid', () => {
    renderCard(
      makeVehicle({
        bid: {
          currentBid: { amount: 30_000, userId },
          bidCount: 9,
        },
      }),
    )

    expect(screen.getByText(/You hold the current bid · 9 bids/)).toBeVisible()
    expect(screen.getByText('Current bid is yours')).toBeVisible()
    expect(screen.getByText('Current bid')).toBeVisible()
    expect(screen.getByText('$30,000', { exact: false })).toBeVisible()
    expect(screen.getByRole('article')).toHaveClass('vehicle-card--your-bid')
    expect(
      screen.getByRole('link', {
        name: '2025 Volkswagen Tiguan Lot D-0037',
      }),
    ).toHaveAccessibleDescription(/You hold the current bid/)
  })

  it('keeps a non-current recorded bid neutral and non-actionable', () => {
    renderCard(
      makeVehicle({
        bid: {
          currentBid: { amount: 30_500, userId: 'user-2' },
          bidCount: 10,
        },
      }),
      makeBid({ userId, amount: 30_000 }),
    )

    expect(screen.getByText(/Bid recorded · 10 bids/)).toBeVisible()
    expect(screen.getAllByText('Bid recorded')).toHaveLength(1)
    expect(screen.getByText('Inspect vehicle')).toBeVisible()
    expect(screen.getByRole('article')).not.toHaveClass(
      'vehicle-card--your-bid',
    )
    expect(
      screen.getByRole('link', {
        name: '2025 Volkswagen Tiguan Lot D-0037',
      }),
    ).toHaveAccessibleDescription(/Bid recorded/)
  })

  it('replaces a failed image without removing the card link', () => {
    renderCard()

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
    ).toHaveAttribute('href', '/vehicles/vehicle-1')
  })

  it('shows a stable loading treatment until the card photo is ready', () => {
    renderCard()

    const image = screen.getByRole('img', {
      name: /2025 volkswagen tiguan sel r-line, lot d-0037/i,
    })

    expect(screen.getByText('Loading photo')).toBeInTheDocument()
    expect(image).not.toHaveClass('is-loaded')

    fireEvent.load(image)

    expect(screen.queryByText('Loading photo')).not.toBeInTheDocument()
    expect(image).toHaveClass('is-loaded')
  })

  it('uses the image fallback when no usable photo is supplied', () => {
    renderCard(makeVehicle({ images: [] }))

    expect(
      screen.getByRole('img', {
        name: /photo unavailable for 2025 volkswagen tiguan/i,
      }),
    ).toBeInTheDocument()
  })
})
