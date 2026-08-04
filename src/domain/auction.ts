import { formatCurrency } from './formatters'
import type {
  AuctionStatus,
  BidTerms,
  BidValidationResult,
  ReserveStatus,
} from './types'

export const BID_INCREMENT_CAD = 500

export function getMinimumBid({ startingBid, currentBid }: BidTerms) {
  return currentBid === null ? startingBid : currentBid + BID_INCREMENT_CAD
}

export function getReserveStatus(
  reservePrice: number | null,
  currentBid: number | null,
): ReserveStatus {
  if (reservePrice === null) {
    return 'No reserve'
  }

  return currentBid !== null && currentBid >= reservePrice
    ? 'Reserve met'
    : 'Reserve not met'
}

export function getAuctionStatus(
  auctionStart: Date,
  now = new Date(),
): AuctionStatus {
  return auctionStart.getTime() <= now.getTime() ? 'Open' : 'Scheduled'
}

export function validateBidAmount(
  rawAmount: string | number,
  terms: BidTerms,
): BidValidationResult {
  if (typeof rawAmount === 'string' && rawAmount.trim() === '') {
    return {
      isValid: false,
      error: 'required',
      message: 'Enter a bid amount.',
    }
  }

  const amount =
    typeof rawAmount === 'number'
      ? rawAmount
      : Number(rawAmount.replaceAll(',', '').trim())

  if (!Number.isFinite(amount)) {
    return {
      isValid: false,
      error: 'not-a-number',
      message: 'Enter a valid bid amount.',
    }
  }

  if (!Number.isInteger(amount)) {
    return {
      isValid: false,
      error: 'whole-dollars-only',
      message: 'Enter a whole-dollar bid amount.',
    }
  }

  const minimumBid = getMinimumBid(terms)

  if (amount < minimumBid) {
    return {
      isValid: false,
      error: 'below-minimum',
      message: `Bid must be at least ${formatCurrency(minimumBid)} CAD.`,
    }
  }

  return { isValid: true, amount }
}
