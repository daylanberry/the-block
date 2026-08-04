import { describe, expect, it } from 'vitest'

import {
  BID_INCREMENT_CAD,
  getAuctionStatus,
  getMinimumBid,
  getReserveStatus,
  validateBidAmount,
} from './auction'

describe('auction rules', () => {
  it('uses the opening bid when no bid exists', () => {
    expect(getMinimumBid({ startingBid: 20_500, currentBid: null })).toBe(
      20_500,
    )
  })

  it('adds the required increment after an existing bid', () => {
    expect(
      getMinimumBid({ startingBid: 20_500, currentBid: 24_000 }),
    ).toBe(24_000 + BID_INCREMENT_CAD)
  })

  it.each([
    [null, null, 'No reserve'],
    [29_000, null, 'Reserve not met'],
    [29_000, 28_500, 'Reserve not met'],
    [29_000, 29_000, 'Reserve met'],
  ] as const)(
    'derives reserve status without exposing the reserve amount',
    (reservePrice, currentBid, expected) => {
      expect(getReserveStatus(reservePrice, currentBid)).toBe(expected)
    },
  )

  it('distinguishes open and scheduled auctions', () => {
    const now = new Date(2026, 7, 4, 12)

    expect(getAuctionStatus(new Date(2026, 7, 4, 11), now)).toBe('Open')
    expect(getAuctionStatus(new Date(2026, 7, 4, 13), now)).toBe(
      'Scheduled',
    )
  })
})

describe('bid validation', () => {
  const terms = { startingBid: 20_500, currentBid: 24_000 }

  it.each([
    ['', 'required'],
    ['not a number', 'not-a-number'],
    ['24500.50', 'whole-dollars-only'],
    ['24,000', 'below-minimum'],
  ] as const)('rejects %j with %s', (amount, error) => {
    expect(validateBidAmount(amount, terms)).toMatchObject({
      isValid: false,
      error,
    })
  })

  it('accepts and normalizes a valid formatted amount', () => {
    expect(validateBidAmount('24,500', terms)).toEqual({
      isValid: true,
      amount: 24_500,
    })
  })
})
