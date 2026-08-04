import { describe, expect, it } from 'vitest'

import {
  formatAuctionStart,
  formatCurrency,
  formatOdometer,
} from './formatters'

describe('vehicle formatting', () => {
  it('formats whole-dollar CAD values', () => {
    expect(formatCurrency(24_500)).toBe('$24,500')
  })

  it('formats odometer readings in kilometres', () => {
    expect(formatOdometer(24_534)).toBe('24,534 km')
  })

  it('formats normalized auction starts without inventing a timezone', () => {
    expect(formatAuctionStart(new Date(2026, 7, 3, 16))).toBe(
      'Mon, Aug 3, 4:00 p.m.',
    )
  })
})
