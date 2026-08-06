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
  createBidId: () => string
  onResults: (results: boolean[]) => void
}

function BidSessionProbe({
  initialVehicles,
  resolveReserveStatus,
  attempts,
  createBidId,
  onResults,
}: BidSessionProbeProps) {
  const { vehicles, bids, placeBid } = useBidSessionState({
    userId: 'user-1',
    initialVehicles,
    resolveReserveStatus,
    createBidId,
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
              `${vehicle.id}:${vehicle.bid.currentBid?.amount ?? 'none'}:${vehicle.bid.bidCount}`,
          )
          .join('|')}
        {`|records:${bids.length}:${bids[0]?.id ?? 'none'}:${bids[0]?.amount ?? 'none'}:${bids[0]?.userId ?? 'none'}`}
      </output>
    </>
  )
}

describe('bid session state', () => {
  it('rejects a same-tick raise after the first bid meets reserve', () => {
    const vehicle = makeVehicle({ auctionStart: new Date(2026, 7, 4, 11) })
    const onResults = vi.fn()
    const createBidId = vi
      .fn<() => string>()
      .mockReturnValueOnce('bid-1')
      .mockReturnValueOnce('bid-2')

    render(
      <BidSessionProbe
        initialVehicles={[vehicle]}
        resolveReserveStatus={() => 'Reserve met'}
        attempts={[
          { vehicleId: vehicle.id, amount: 30_000 },
          { vehicleId: vehicle.id, amount: 30_500 },
        ]}
        createBidId={createBidId}
        onResults={onResults}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Place test bids' }))

    expect(onResults).toHaveBeenCalledWith([true, false])
    expect(screen.getByRole('status', { name: 'Bid state' })).toHaveTextContent(
      `${vehicle.id}:30000:9|records:1:bid-1:30000:user-1`,
    )
  })

  it('accepts sequential same-tick raises while reserve remains unmet', () => {
    const vehicle = makeVehicle({ auctionStart: new Date(2026, 7, 4, 11) })
    const onResults = vi.fn()
    const createBidId = vi
      .fn<() => string>()
      .mockReturnValueOnce('bid-1')
      .mockReturnValueOnce('bid-2')

    render(
      <BidSessionProbe
        initialVehicles={[vehicle]}
        resolveReserveStatus={() => 'Reserve not met'}
        attempts={[
          { vehicleId: vehicle.id, amount: 30_000 },
          { vehicleId: vehicle.id, amount: 30_500 },
        ]}
        createBidId={createBidId}
        onResults={onResults}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Place test bids' }))

    expect(onResults).toHaveBeenCalledWith([true, true])
    expect(createBidId).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('status', { name: 'Bid state' })).toHaveTextContent(
      `${vehicle.id}:30500:10|records:1:bid-2:30500:user-1`,
    )
  })

  it('reports rejected attempts without changing session state', () => {
    const vehicle = makeVehicle({ auctionStart: new Date(2026, 7, 4, 13) })
    const onResults = vi.fn()
    const createBidId = vi
      .fn<() => string>()
      .mockReturnValueOnce('bid-1')
      .mockReturnValueOnce('bid-2')

    render(
      <BidSessionProbe
        initialVehicles={[vehicle]}
        attempts={[
          { vehicleId: 'missing-vehicle', amount: 30_000 },
          { vehicleId: vehicle.id, amount: 30_000 },
        ]}
        createBidId={createBidId}
        onResults={onResults}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Place test bids' }))

    expect(onResults).toHaveBeenCalledWith([false, false])
    expect(screen.getByRole('status', { name: 'Bid state' })).toHaveTextContent(
      `${vehicle.id}:29500:8|records:0:none:none:none`,
    )
  })
})
