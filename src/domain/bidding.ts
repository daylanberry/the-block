import { getAuctionStatus, validateBidAmount } from './auction'
import type { ReserveStatus, Vehicle } from './types'

export type ReserveStatusResolver = (
  vehicleId: string,
  currentBid: number,
) => ReserveStatus

export interface BidRequest {
  vehicleId: string
  amount: number
  placedAt: Date
}

export interface BidApplicationResult {
  accepted: boolean
  vehicles: readonly Vehicle[]
}

export function applyBid(
  vehicles: readonly Vehicle[],
  request: BidRequest,
  resolveReserveStatus: ReserveStatusResolver,
): BidApplicationResult {
  const vehicleIndex = vehicles.findIndex(
    (vehicle) => vehicle.id === request.vehicleId,
  )

  if (vehicleIndex === -1) {
    return { accepted: false, vehicles }
  }

  const vehicle = vehicles[vehicleIndex]

  if (getAuctionStatus(vehicle.auctionStart, request.placedAt) !== 'Open') {
    return { accepted: false, vehicles }
  }

  const validation = validateBidAmount(request.amount, {
    startingBid: vehicle.startingBid,
    currentBid: vehicle.bid.currentBid,
  })

  if (!validation.isValid) {
    return { accepted: false, vehicles }
  }

  const updatedVehicle: Vehicle = {
    ...vehicle,
    bid: {
      currentBid: validation.amount,
      bidCount: vehicle.bid.bidCount + 1,
      yourBid: validation.amount,
      reserveStatus: resolveReserveStatus(vehicle.id, validation.amount),
    },
  }
  const nextVehicles = [...vehicles]
  nextVehicles[vehicleIndex] = updatedVehicle

  return { accepted: true, vehicles: nextVehicles }
}
