import { describe, expect, it, vi } from 'vitest'

import { makeVehicle } from '../test/vehicleFactory'
import { applyBid, type BidRequest } from './bidding'
import type { ReserveStatus } from './types'

const placedAt = new Date(2026, 7, 4, 12)
const resolveReserveStatus = vi.fn(
  (_vehicleId: string, amount: number): ReserveStatus =>
    amount >= 30_000 ? 'Reserve met' : 'Reserve not met',
)

function bidRequest(vehicleId: string, amount: number): BidRequest {
  return { vehicleId, amount, placedAt }
}

describe('applyBid', () => {
  it('atomically updates the current bid, count, owner, and public reserve state', () => {
    const vehicle = makeVehicle({ auctionStart: new Date(2026, 7, 4, 11) })
    const result = applyBid(
      [vehicle],
      bidRequest(vehicle.id, 30_000),
      resolveReserveStatus,
    )

    expect(result.accepted).toBe(true)
    expect(result.vehicles[0].bid).toEqual({
      currentBid: 30_000,
      bidCount: 9,
      yourBid: 30_000,
      reserveStatus: 'Reserve met',
    })
    expect(resolveReserveStatus).toHaveBeenCalledWith(vehicle.id, 30_000)
  })

  it('rejects scheduled, unknown, below-minimum, and duplicate submissions', () => {
    const openVehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
    })
    const scheduledVehicle = makeVehicle({
      id: 'scheduled-vehicle',
      auctionStart: new Date(2026, 7, 4, 13),
    })
    const vehicles = [openVehicle, scheduledVehicle]

    const missing = applyBid(
      vehicles,
      bidRequest('missing', 30_000),
      resolveReserveStatus,
    )
    const belowMinimum = applyBid(
      vehicles,
      bidRequest(openVehicle.id, 29_999),
      resolveReserveStatus,
    )
    const scheduled = applyBid(
      vehicles,
      bidRequest(scheduledVehicle.id, 30_000),
      resolveReserveStatus,
    )

    expect(missing).toEqual({ accepted: false, vehicles })
    expect(missing.vehicles).toBe(vehicles)
    expect(belowMinimum).toEqual({ accepted: false, vehicles })
    expect(scheduled).toEqual({ accepted: false, vehicles })

    const accepted = applyBid(
      vehicles,
      bidRequest(openVehicle.id, 30_000),
      resolveReserveStatus,
    )
    const duplicate = applyBid(
      accepted.vehicles,
      bidRequest(openVehicle.id, 30_000),
      resolveReserveStatus,
    )

    expect(accepted.accepted).toBe(true)
    expect(duplicate.accepted).toBe(false)
    expect(duplicate.vehicles).toBe(accepted.vehicles)
    expect(duplicate.vehicles[0].bid.bidCount).toBe(9)
  })

  it('updates by vehicle id when multiple vehicles share a lot', () => {
    const firstVehicle = makeVehicle({
      id: 'vehicle-1',
      auctionStart: new Date(2026, 7, 4, 11),
    })
    const secondVehicle = makeVehicle({
      id: 'vehicle-2',
      model: 'Atlas',
      lot: firstVehicle.lot,
      auctionStart: new Date(2026, 7, 4, 11),
      bid: { currentBid: null, bidCount: 0, yourBid: null },
    })
    const result = applyBid(
      [firstVehicle, secondVehicle],
      bidRequest(secondVehicle.id, secondVehicle.startingBid),
      resolveReserveStatus,
    )

    expect(result.accepted).toBe(true)
    expect(result.vehicles[0]).toBe(firstVehicle)
    expect(result.vehicles[1].bid).toMatchObject({
      currentBid: secondVehicle.startingBid,
      bidCount: 1,
      yourBid: secondVehicle.startingBid,
    })
  })
})
