import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ReserveStatusResolver } from '../../domain/bidding'
import type { Vehicle } from '../../domain/types'
import { makeVehicle } from '../../test/vehicleFactory'
import { useBidSessionState } from './useBidSessionState'

const placedAt = new Date(2026, 7, 4, 12)

interface BidSessionProbeProps {
  initialVehicles: readonly Vehicle[]
  resolveReserveStatus?: ReserveStatusResolver
  attempts: ReadonlyArray<{ vehicleId: string; amount: number }>
  onResults: (results: boolean[]) => void
}

function BidSessionProbe({
  initialVehicles,
  resolveReserveStatus,
  attempts,
  onResults,
}: BidSessionProbeProps) {
  const { vehicles, placeBid } = useBidSessionState({
    initialVehicles,
    resolveReserveStatus,
  })

  return (
    <>
      <button
        type="button"
        onClick={() =>
          onResults(
            attempts.map(({ vehicleId, amount }) =>
              placeBid(vehicleId, amount, placedAt),
            ),
          )
        }
      >
        Place test bids
      </button>
      <output aria-label="Bid state">
        {vehicles
          .map(
            (vehicle) =>
              `${vehicle.id}:${vehicle.bid.currentBid ?? 'none'}:${vehicle.bid.bidCount}`,
          )
          .join('|')}
      </output>
    </>
  )
}

describe('bid session state', () => {
  it('accepts only the first of two identical same-tick bids', () => {
    const vehicle = makeVehicle({ auctionStart: new Date(2026, 7, 4, 11) })
    const onResults = vi.fn()

    render(
      <BidSessionProbe
        initialVehicles={[vehicle]}
        resolveReserveStatus={() => 'Reserve met'}
        attempts={[
          { vehicleId: vehicle.id, amount: 30_000 },
          { vehicleId: vehicle.id, amount: 30_000 },
        ]}
        onResults={onResults}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Place test bids' }))

    expect(onResults).toHaveBeenCalledWith([true, false])
    expect(screen.getByRole('status', { name: 'Bid state' })).toHaveTextContent(
      `${vehicle.id}:30000:9`,
    )
  })

  it('reports rejected attempts without changing session state', () => {
    const vehicle = makeVehicle({ auctionStart: new Date(2026, 7, 4, 13) })
    const onResults = vi.fn()

    render(
      <BidSessionProbe
        initialVehicles={[vehicle]}
        attempts={[
          { vehicleId: 'missing-vehicle', amount: 30_000 },
          { vehicleId: vehicle.id, amount: 30_000 },
        ]}
        onResults={onResults}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Place test bids' }))

    expect(onResults).toHaveBeenCalledWith([false, false])
    expect(screen.getByRole('status', { name: 'Bid state' })).toHaveTextContent(
      `${vehicle.id}:29500:8`,
    )
  })
})
