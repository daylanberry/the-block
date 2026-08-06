import { describe, expect, it, vi } from 'vitest'

import { makeVehicle } from '../test/vehicleFactory'
import {
  applyBid,
  getVehiclesWithUserBids,
  hasUserBid,
  isCurrentUserBid,
  type BidRequest,
} from './bidding'
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

  it.each([
    { currentBid: 30_000, yourBid: 30_000 },
    { currentBid: 30_500, yourBid: 30_000 },
    { currentBid: null, yourBid: 30_000 },
    { currentBid: 29_500, yourBid: 30_000 },
  ])('rejects another bid once a session bid is recorded: %o', (bid) => {
    const vehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
      bid: { ...bid, bidCount: 9 },
    })
    const vehicles = [vehicle]

    const result = applyBid(
      vehicles,
      bidRequest(vehicle.id, 31_000),
      resolveReserveStatus,
    )

    expect(result).toEqual({ accepted: false, vehicles })
    expect(result.vehicles).toBe(vehicles)
    expect(result.vehicles[0].bid).toBe(vehicle.bid)
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

describe('session bid ownership', () => {
  it.each([
    [{ currentBid: 30_000, yourBid: null }, false],
    [{ currentBid: 30_000, yourBid: 30_000 }, true],
    [{ currentBid: 30_500, yourBid: 30_000 }, true],
  ] as const)('detects whether a user bid is recorded for %o', (bid, expected) => {
    expect(hasUserBid(makeVehicle({ bid }))).toBe(expected)
  })

  it.each([
    [{ currentBid: 30_000, yourBid: null }, false],
    [{ currentBid: 30_000, yourBid: 30_000 }, true],
    [{ currentBid: 30_500, yourBid: 30_000 }, false],
    [{ currentBid: null, yourBid: 30_000 }, false],
  ] as const)('derives current-bid ownership for %o', (bid, expected) => {
    expect(isCurrentUserBid(makeVehicle({ bid }))).toBe(expected)
  })
})

describe('getVehiclesWithUserBids', () => {
  it('selects bid vehicles once in stable catalog order', () => {
    const firstBid = makeVehicle({
      id: 'bid-1',
      bid: { currentBid: 30_000, yourBid: 30_000 },
    })
    const untouched = makeVehicle({ id: 'untouched' })
    const secondBid = makeVehicle({
      id: 'bid-2',
      bid: { currentBid: 31_000, yourBid: 31_000 },
    })

    expect(
      getVehiclesWithUserBids([firstBid, untouched, secondBid]),
    ).toEqual([firstBid, secondBid])
  })
})
