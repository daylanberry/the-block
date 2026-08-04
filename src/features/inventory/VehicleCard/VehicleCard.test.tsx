import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { makeVehicle } from '../../../test/vehicleFactory'
import { VehicleCard } from './VehicleCard'

const referenceTime = new Date(2026, 7, 4, 12)

function renderCard(vehicle = makeVehicle()) {
  const { hook } = memoryLocation({ path: '/', static: true })

  return render(
    <Router hook={hook}>
      <VehicleCard vehicle={vehicle} now={referenceTime} />
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

    expect(vehicleLink).toHaveAttribute('href', '/vehicles/D-0037')
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
    ).toHaveAttribute('href', '/vehicles/D-0037')
  })
})
