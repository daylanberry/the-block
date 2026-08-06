import { describe, expect, it, vi } from 'vitest'

import { makeBid } from '../test/bidFactory'
import { makeVehicle } from '../test/vehicleFactory'
import {
  applyBid,
  getUserBidAction,
  getUserBidEntries,
  getUserBidForVehicle,
  isCurrentUserBid,
  type BidRequest,
  type BidSessionSnapshot,
} from './bidding'
import type { ReserveStatus } from './types'

const userId = 'user-1'
const otherUserId = 'user-2'
const placedAt = new Date(2026, 7, 4, 12)
const resolveReserveStatus = vi.fn(
  (_vehicleId: string, amount: number): ReserveStatus =>
    amount >= 30_000 ? 'Reserve met' : 'Reserve not met',
)

function bidRequest(
  vehicleId: string,
  amount: number,
  overrides: Partial<BidRequest> = {},
): BidRequest {
  return {
    id: 'accepted-bid',
    vehicleId,
    userId,
    amount,
    placedAt,
    ...overrides,
  }
}

function bidSession(
  vehicles: BidSessionSnapshot['vehicles'],
  bids: BidSessionSnapshot['bids'] = [],
): BidSessionSnapshot {
  return { vehicles, bids }
}

describe('applyBid', () => {
  it('atomically creates a user bid and updates the auction owner', () => {
    const vehicle = makeVehicle({ auctionStart: new Date(2026, 7, 4, 11) })
    const session = bidSession([vehicle])
    const request = bidRequest(vehicle.id, 30_000)
    const result = applyBid(session, request, resolveReserveStatus)

    expect(result.accepted).toBe(true)
    expect(result.vehicles).not.toBe(session.vehicles)
    expect(result.bids).not.toBe(session.bids)
    expect(result.vehicles[0].bid).toEqual({
      currentBid: { amount: 30_000, userId },
      bidCount: 9,
      reserveStatus: 'Reserve met',
    })
    expect(result.bids).toEqual([
      {
        ...request,
        placedAt: placedAt.toISOString(),
      },
    ])
    expect(session.vehicles[0]).toBe(vehicle)
    expect(session.bids).toEqual([])
    expect(resolveReserveStatus).toHaveBeenCalledWith(vehicle.id, 30_000)
  })

  it('accepts repeated same-user raises while reserve remains unmet', () => {
    const vehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
      bid: {
        currentBid: { amount: 29_500, userId },
        bidCount: 8,
        reserveStatus: 'Reserve not met',
      },
    })
    const firstBid = makeBid({
      id: 'prior-bid',
      vehicleId: vehicle.id,
      userId,
      amount: 29_500,
    })
    const otherUserBid = makeBid({
      id: 'other-user-bid',
      vehicleId: vehicle.id,
      userId: otherUserId,
      amount: 29_000,
    })
    const keepReserveUnmet = vi.fn(
      (): ReserveStatus => 'Reserve not met',
    )
    const secondPlacedAt = new Date(2026, 7, 4, 12, 1)

    const session = bidSession([vehicle], [otherUserBid, firstBid])
    const firstRaise = applyBid(
      session,
      bidRequest(vehicle.id, 30_000, { id: 'raise-1' }),
      keepReserveUnmet,
    )
    const secondRaise = applyBid(
      firstRaise,
      bidRequest(vehicle.id, 30_500, {
        id: 'raise-2',
        placedAt: secondPlacedAt,
      }),
      keepReserveUnmet,
    )

    expect(firstRaise.accepted).toBe(true)
    expect(secondRaise.accepted).toBe(true)
    expect(secondRaise.vehicles[0].bid).toEqual({
      currentBid: { amount: 30_500, userId },
      bidCount: 10,
      reserveStatus: 'Reserve not met',
    })
    expect(firstRaise.bids).toEqual([
      otherUserBid,
      expect.objectContaining({ id: 'raise-1', amount: 30_000 }),
    ])
    expect(secondRaise.bids).toEqual([
      otherUserBid,
      expect.objectContaining({
        id: 'raise-2',
        amount: 30_500,
        placedAt: secondPlacedAt.toISOString(),
      }),
    ])
    expect(secondRaise.bids[0]).toBe(otherUserBid)
    expect(firstRaise.bids).not.toBe(session.bids)
    expect(secondRaise.bids).not.toBe(firstRaise.bids)
    expect(session.bids).toEqual([otherUserBid, firstBid])
    expect(keepReserveUnmet).toHaveBeenCalledTimes(2)
  })

  it('accepts a reserve-clearing raise and locks the following self-bid', () => {
    const vehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
      bid: {
        currentBid: { amount: 29_500, userId },
        bidCount: 8,
        reserveStatus: 'Reserve not met',
      },
    })
    const firstBid = makeBid({
      id: 'prior-bid',
      vehicleId: vehicle.id,
      userId,
      amount: 29_500,
    })

    const reserveClearingRaise = applyBid(
      bidSession([vehicle], [firstBid]),
      bidRequest(vehicle.id, 30_000, { id: 'reserve-clearing-bid' }),
      resolveReserveStatus,
    )
    const lockedAttempt = applyBid(
      reserveClearingRaise,
      bidRequest(vehicle.id, 30_500, { id: 'locked-bid' }),
      resolveReserveStatus,
    )

    expect(reserveClearingRaise.accepted).toBe(true)
    expect(reserveClearingRaise.vehicles[0].bid).toMatchObject({
      bidCount: 9,
      reserveStatus: 'Reserve met',
    })
    expect(reserveClearingRaise.bids).toEqual([
      expect.objectContaining({
        id: 'reserve-clearing-bid',
        amount: 30_000,
      }),
    ])
    expect(lockedAttempt).toEqual({
      accepted: false,
      vehicles: reserveClearingRaise.vehicles,
      bids: reserveClearingRaise.bids,
    })
    expect(lockedAttempt.vehicles).toBe(reserveClearingRaise.vehicles)
    expect(lockedAttempt.bids).toBe(reserveClearingRaise.bids)
  })

  it.each(['Reserve met', 'No reserve'] satisfies ReserveStatus[])(
    'blocks a repeated same-user bid when status is %s',
    (reserveStatus) => {
      const vehicle = makeVehicle({
        auctionStart: new Date(2026, 7, 4, 11),
        bid: {
          currentBid: { amount: 30_000, userId },
          bidCount: 9,
          reserveStatus,
        },
      })
      const existingBid = makeBid({
        id: 'prior-bid',
        vehicleId: vehicle.id,
        userId,
      })
      const session = bidSession([vehicle], [existingBid])
      const result = applyBid(
        session,
        bidRequest(vehicle.id, 30_500, { id: 'repeat-bid' }),
        resolveReserveStatus,
      )

      expect(result).toEqual({ accepted: false, ...session })
      expect(result.vehicles).toBe(session.vehicles)
      expect(result.bids).toBe(session.bids)
    },
  )

  it('rejects scheduled, unknown, and below-minimum submissions without changing state', () => {
    const openVehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
    })
    const scheduledVehicle = makeVehicle({
      id: 'scheduled-vehicle',
      auctionStart: new Date(2026, 7, 4, 13),
    })
    const session = bidSession([openVehicle, scheduledVehicle])

    const results = [
      applyBid(session, bidRequest('missing', 30_000), resolveReserveStatus),
      applyBid(
        session,
        bidRequest(openVehicle.id, 29_999),
        resolveReserveStatus,
      ),
      applyBid(
        session,
        bidRequest(scheduledVehicle.id, 30_000),
        resolveReserveStatus,
      ),
    ]

    for (const result of results) {
      expect(result).toEqual({ accepted: false, ...session })
      expect(result.vehicles).toBe(session.vehicles)
      expect(result.bids).toBe(session.bids)
    }
  })

  it('keeps minimum-increment validation for an otherwise eligible raise', () => {
    const vehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
      bid: {
        currentBid: { amount: 30_000, userId },
        reserveStatus: 'Reserve not met',
      },
    })
    const existingBid = makeBid({
      id: 'prior-bid',
      vehicleId: vehicle.id,
      userId,
      amount: 30_000,
    })
    const session = bidSession([vehicle], [existingBid])
    const result = applyBid(
      session,
      bidRequest(vehicle.id, 30_499, { id: 'below-minimum-raise' }),
      resolveReserveStatus,
    )

    expect(result).toEqual({ accepted: false, ...session })
  })

  it('rejects a reused bid id even when a raise is otherwise eligible', () => {
    const vehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
      bid: {
        currentBid: { amount: 30_000, userId },
        reserveStatus: 'Reserve not met',
      },
    })
    const existingBid = makeBid({
      id: 'reused-bid-id',
      vehicleId: vehicle.id,
      userId,
      amount: 30_000,
    })
    const session = bidSession([vehicle], [existingBid])
    const result = applyBid(
      session,
      bidRequest(vehicle.id, 30_500, { id: 'reused-bid-id' }),
      resolveReserveStatus,
    )

    expect(result).toEqual({ accepted: false, ...session })
    expect(result.vehicles).toBe(session.vehicles)
    expect(result.bids).toBe(session.bids)
  })

  it("does not let another user's record trigger the repeat-bid guard", () => {
    const vehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
      bid: {
        currentBid: { amount: 30_000, userId: otherUserId },
        bidCount: 9,
        reserveStatus: 'Reserve met',
      },
    })
    const otherUserBid = makeBid({
      id: 'other-user-bid',
      vehicleId: vehicle.id,
      userId: otherUserId,
    })
    const result = applyBid(
      bidSession([vehicle], [otherUserBid]),
      bidRequest(vehicle.id, 30_500),
      resolveReserveStatus,
    )

    expect(result.accepted).toBe(true)
    expect(result.bids).toHaveLength(2)
    expect(result.vehicles[0].bid.currentBid).toEqual({
      amount: 30_500,
      userId,
    })
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
      bid: { currentBid: null, bidCount: 0 },
    })
    const result = applyBid(
      bidSession([firstVehicle, secondVehicle]),
      bidRequest(secondVehicle.id, secondVehicle.startingBid),
      resolveReserveStatus,
    )

    expect(result.accepted).toBe(true)
    expect(result.vehicles[0]).toBe(firstVehicle)
    expect(result.vehicles[1].bid).toMatchObject({
      currentBid: { amount: secondVehicle.startingBid, userId },
      bidCount: 1,
    })
    expect(result.bids[0]).toMatchObject({
      vehicleId: secondVehicle.id,
      userId,
    })
  })
})

describe('user bid selectors and actions', () => {
  it('finds the user bid for a vehicle', () => {
    const userBid = makeBid({ id: 'user-bid', userId, amount: 30_000 })
    const otherUserBid = makeBid({
      id: 'other-user-bid',
      userId: otherUserId,
      amount: 30_500,
    })
    const bids = [otherUserBid, userBid]

    expect(getUserBidForVehicle(bids, 'vehicle-1', userId)).toBe(userBid)
    expect(getUserBidForVehicle(bids, 'vehicle-2', userId)).toBeUndefined()
  })

  it('derives ownership from user ID rather than matching amounts', () => {
    const catalogBid = makeVehicle({
      bid: { currentBid: { amount: 30_000, userId: null } },
    })
    const otherUserBid = makeVehicle({
      bid: { currentBid: { amount: 30_000, userId: otherUserId } },
    })
    const currentUserBid = makeVehicle({
      bid: { currentBid: { amount: 30_000, userId } },
    })

    expect(isCurrentUserBid(catalogBid, userId)).toBe(false)
    expect(isCurrentUserBid(otherUserBid, userId)).toBe(false)
    expect(isCurrentUserBid(currentUserBid, userId)).toBe(true)
  })

  it('returns place, raise, or locked from identity and reserve status', () => {
    const noPosition = makeVehicle({
      bid: {
        currentBid: { amount: 30_000, userId: otherUserId },
        reserveStatus: 'Reserve met',
      },
    })
    const ownedReserveUnmet = makeVehicle({
      bid: {
        currentBid: { amount: 30_000, userId },
        reserveStatus: 'Reserve not met',
      },
    })
    const recordedReserveUnmet = makeVehicle({
      bid: {
        currentBid: { amount: 30_000, userId: otherUserId },
        reserveStatus: 'Reserve not met',
      },
    })
    const recordedBid = makeBid({
      vehicleId: recordedReserveUnmet.id,
      userId,
    })
    const ownedNoReserve = makeVehicle({
      bid: {
        currentBid: { amount: 30_000, userId },
        reserveStatus: 'No reserve',
      },
    })

    expect(getUserBidAction(noPosition, userId)).toBe('place')
    expect(getUserBidAction(ownedReserveUnmet, userId)).toBe('raise')
    expect(
      getUserBidAction(recordedReserveUnmet, userId, recordedBid),
    ).toBe('raise')
    expect(getUserBidAction(ownedNoReserve, userId)).toBe('locked')
  })

  it('joins user bids to vehicles in stable catalog order', () => {
    const firstVehicle = makeVehicle({
      id: 'vehicle-1',
      bid: { currentBid: { amount: 31_000, userId } },
    })
    const untouched = makeVehicle({ id: 'untouched' })
    const secondVehicle = makeVehicle({ id: 'vehicle-2' })
    const secondBid = makeBid({
      id: 'second-bid',
      vehicleId: secondVehicle.id,
      userId,
    })
    const firstBid = makeBid({
      id: 'first-bid',
      vehicleId: firstVehicle.id,
      userId,
      amount: 31_000,
    })
    const otherUserBid = makeBid({
      id: 'other-user-bid',
      vehicleId: untouched.id,
      userId: otherUserId,
    })
    const orphanBid = makeBid({
      id: 'orphan-bid',
      vehicleId: 'missing-vehicle',
      userId,
    })
    expect(
      getUserBidEntries(
        [firstVehicle, untouched, secondVehicle],
        [secondBid, firstBid, otherUserBid, orphanBid],
        userId,
      ),
    ).toEqual([
      {
        vehicle: firstVehicle,
        bid: firstBid,
        holdsCurrentBid: true,
      },
      { vehicle: secondVehicle, bid: secondBid, holdsCurrentBid: false },
    ])
  })
})
