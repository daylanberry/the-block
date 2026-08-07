import { describe, expect, it, vi } from 'vitest'

import { createAppStore, type AppServices } from '../../app/store'
import type { ReserveStatus } from '../../domain/types'
import { makeVehicle } from '../../test/vehicleFactory'
import {
  placeBid,
  selectBids,
  selectUserBidEntries,
  selectUserBidForVehicle,
  selectUserBidVehicleCount,
  selectUserId,
  selectVehicleById,
  selectVehicles,
} from './bidSessionSlice'

const userId = 'user-1'
const placedAt = new Date(2026, 7, 4, 12)

function createServices(
  overrides: Partial<AppServices> = {},
): AppServices {
  return {
    createBidId: () => 'bid-1',
    now: () => placedAt,
    resolveReserveStatus: () => 'Reserve not met',
    ...overrides,
  }
}

function createOpenVehicle(
  overrides: Parameters<typeof makeVehicle>[0] = {},
) {
  return makeVehicle({
    auctionStart: new Date(2026, 7, 4, 11),
    ...overrides,
  })
}

describe('bid session store', () => {
  it('creates isolated sessions with supplied or generated user identities', () => {
    const vehicle = createOpenVehicle()
    const firstStore = createAppStore({
      userId,
      initialVehicles: [vehicle],
      services: createServices(),
    })
    const secondStore = createAppStore({
      initialVehicles: [vehicle],
      services: createServices(),
    })

    expect(selectUserId(firstStore.getState())).toBe(userId)
    expect(selectUserId(secondStore.getState())).toEqual(expect.any(String))
    expect(selectUserId(secondStore.getState())).not.toBe('')
    expect(selectVehicles(firstStore.getState())).not.toBe(
      selectVehicles(secondStore.getState()),
    )

    expect(
      firstStore.dispatch(placeBid({ vehicleId: vehicle.id, amount: 30_000 })),
    ).toBe(true)
    expect(selectBids(firstStore.getState())).toHaveLength(1)
    expect(selectBids(secondStore.getState())).toEqual([])
    expect(selectVehicles(secondStore.getState())[0]).toBe(vehicle)
  })

  it('uses injected IDs and time and commits an accepted snapshot', () => {
    const vehicle = createOpenVehicle()
    const createBidId = vi.fn(() => 'exact-bid-id')
    const now = vi.fn(() => placedAt)
    const resolveReserveStatus = vi.fn(
      (_vehicleId: string, _amount: number): ReserveStatus => 'Reserve met',
    )
    const store = createAppStore({
      userId,
      initialVehicles: [vehicle],
      services: createServices({ createBidId, now, resolveReserveStatus }),
    })

    const accepted = store.dispatch(
      placeBid({ vehicleId: vehicle.id, amount: 30_000 }),
    )

    expect(accepted).toBe(true)
    expect(createBidId).toHaveBeenCalledOnce()
    expect(now).toHaveBeenCalledOnce()
    expect(resolveReserveStatus).toHaveBeenCalledWith(vehicle.id, 30_000)
    expect(selectBids(store.getState())).toEqual([
      {
        id: 'exact-bid-id',
        vehicleId: vehicle.id,
        userId,
        amount: 30_000,
        placedAt: placedAt.toISOString(),
      },
    ])
    expect(selectVehicles(store.getState())[0].bid).toEqual({
      currentBid: { amount: 30_000, userId },
      bidCount: 9,
      reserveStatus: 'Reserve met',
    })
  })

  it('reads the latest state for two same-tick raises and replaces the retained bid', () => {
    const vehicle = createOpenVehicle()
    const createBidId = vi
      .fn<() => string>()
      .mockReturnValueOnce('bid-1')
      .mockReturnValueOnce('bid-2')
    const store = createAppStore({
      userId,
      initialVehicles: [vehicle],
      services: createServices({ createBidId }),
    })

    const firstAccepted = store.dispatch(
      placeBid({ vehicleId: vehicle.id, amount: 30_000 }),
    )
    const firstRecord = selectBids(store.getState())[0]
    const secondAccepted = store.dispatch(
      placeBid({ vehicleId: vehicle.id, amount: 30_500 }),
    )

    expect([firstAccepted, secondAccepted]).toEqual([true, true])
    expect(createBidId).toHaveBeenCalledTimes(2)
    expect(selectVehicles(store.getState())[0].bid).toEqual({
      currentBid: { amount: 30_500, userId },
      bidCount: 10,
      reserveStatus: 'Reserve not met',
    })
    expect(selectBids(store.getState())).toEqual([
      expect.objectContaining({ id: 'bid-2', amount: 30_500 }),
    ])
    expect(selectBids(store.getState())[0]).not.toBe(firstRecord)
  })

  for (const reserveStatus of [
    'Reserve met',
    'No reserve',
  ] satisfies ReserveStatus[]) {
    it(`locks a same-tick raise after an accepted ${reserveStatus} result`, () => {
      const vehicle = createOpenVehicle()
      const createBidId = vi
        .fn<() => string>()
        .mockReturnValueOnce('bid-1')
        .mockReturnValueOnce('bid-2')
      const store = createAppStore({
        userId,
        initialVehicles: [vehicle],
        services: createServices({
          createBidId,
          resolveReserveStatus: () => reserveStatus,
        }),
      })

      expect(
        store.dispatch(placeBid({ vehicleId: vehicle.id, amount: 30_000 })),
      ).toBe(true)
      const acceptedState = store.getState()
      expect(
        store.dispatch(placeBid({ vehicleId: vehicle.id, amount: 30_500 })),
      ).toBe(false)

      expect(store.getState()).toBe(acceptedState)
      expect(selectBids(store.getState())).toEqual([
        expect.objectContaining({ id: 'bid-1', amount: 30_000 }),
      ])
      expect(selectVehicles(store.getState())[0].bid.reserveStatus).toBe(
        reserveStatus,
      )
    })
  }

  it('does not change state or notify subscribers when a bid is rejected', () => {
    const vehicle = createOpenVehicle()
    const store = createAppStore({
      userId,
      initialVehicles: [vehicle],
      services: createServices(),
    })
    const subscriber = vi.fn()
    store.subscribe(subscriber)
    const initialState = store.getState()
    const initialVehicles = selectVehicles(initialState)
    const initialBids = selectBids(initialState)

    const accepted = store.dispatch(
      placeBid({ vehicleId: vehicle.id, amount: 29_999 }),
    )

    expect(accepted).toBe(false)
    expect(subscriber).not.toHaveBeenCalled()
    expect(store.getState()).toBe(initialState)
    expect(selectVehicles(store.getState())).toBe(initialVehicles)
    expect(selectBids(store.getState())).toBe(initialBids)
  })
})

describe('bid session selectors', () => {
  it('keeps catalog order, one retained row per vehicle, and ownership', () => {
    const firstVehicle = createOpenVehicle({ id: 'vehicle-1' })
    const skippedVehicle = createOpenVehicle({ id: 'vehicle-2' })
    const thirdVehicle = createOpenVehicle({ id: 'vehicle-3' })
    const createBidId = vi
      .fn<() => string>()
      .mockReturnValueOnce('third-bid')
      .mockReturnValueOnce('first-bid')
      .mockReturnValueOnce('first-bid-raised')
    const store = createAppStore({
      userId,
      initialVehicles: [firstVehicle, skippedVehicle, thirdVehicle],
      services: createServices({ createBidId }),
    })

    store.dispatch(placeBid({ vehicleId: thirdVehicle.id, amount: 30_000 }))
    store.dispatch(placeBid({ vehicleId: firstVehicle.id, amount: 30_000 }))
    store.dispatch(placeBid({ vehicleId: firstVehicle.id, amount: 30_500 }))

    const state = store.getState()
    const entries = selectUserBidEntries(state)

    expect(entries.map(({ vehicle }) => vehicle.id)).toEqual([
      firstVehicle.id,
      thirdVehicle.id,
    ])
    expect(entries.map(({ bid }) => bid.id)).toEqual([
      'first-bid-raised',
      'third-bid',
    ])
    expect(entries.map(({ holdsCurrentBid }) => holdsCurrentBid)).toEqual([
      true,
      true,
    ])
    expect(selectUserBidVehicleCount(state)).toBe(2)
    expect(selectVehicleById(state, firstVehicle.id)).toBe(
      selectVehicles(state)[0],
    )
    expect(selectVehicleById(state, 'missing-vehicle')).toBeUndefined()
    expect(selectUserBidForVehicle(state, firstVehicle.id)).toBe(entries[0].bid)
    expect(selectUserBidForVehicle(state, skippedVehicle.id)).toBeUndefined()
    expect(selectUserBidForVehicle(state, 'missing-vehicle')).toBeUndefined()
  })

  it('returns stable selector results until an accepted bid changes inputs', () => {
    const vehicle = createOpenVehicle()
    const store = createAppStore({
      userId,
      initialVehicles: [vehicle],
      services: createServices(),
    })
    const initialState = store.getState()
    const initialEntries = selectUserBidEntries(initialState)

    expect(selectUserBidEntries(initialState)).toBe(initialEntries)
    expect(selectUserBidVehicleCount(initialState)).toBe(0)

    store.dispatch(placeBid({ vehicleId: vehicle.id, amount: 29_999 }))
    expect(selectUserBidEntries(store.getState())).toBe(initialEntries)

    store.dispatch(placeBid({ vehicleId: vehicle.id, amount: 30_000 }))
    const acceptedEntries = selectUserBidEntries(store.getState())
    expect(acceptedEntries).not.toBe(initialEntries)
    expect(selectUserBidEntries(store.getState())).toBe(acceptedEntries)
    expect(selectUserBidVehicleCount(store.getState())).toBe(1)
  })
})
