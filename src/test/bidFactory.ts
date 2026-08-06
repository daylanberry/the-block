import type { Bid } from '../domain/types'

export function makeBid(overrides: Partial<Bid> = {}): Bid {
  return {
    id: 'bid-1',
    vehicleId: 'vehicle-1',
    userId: 'user-1',
    amount: 30_000,
    placedAt: new Date(2026, 7, 4, 12).toISOString(),
    ...overrides,
  }
}
