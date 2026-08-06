import { getAuctionStatus, validateBidAmount } from './auction'
import type { Bid, ReserveStatus, Vehicle } from './types'

export type ReserveStatusResolver = (
  vehicleId: string,
  currentBid: number,
) => ReserveStatus

export interface BidRequest {
  readonly id: string
  readonly vehicleId: string
  readonly userId: string
  readonly amount: number
  readonly placedAt: Date
}

export interface BidSessionSnapshot {
  vehicles: readonly Vehicle[]
  bids: readonly Bid[]
}

export interface BidApplicationResult extends BidSessionSnapshot {
  accepted: boolean
}

export interface UserBidEntry {
  vehicle: Vehicle
  bid: Bid
  holdsCurrentBid: boolean
}

export type UserBidAction = 'place' | 'raise' | 'locked'

export function getUserBidForVehicle(
  bids: readonly Bid[],
  vehicleId: string,
  userId: string,
): Bid | undefined {
  return bids.find(
    (bid) => bid.vehicleId === vehicleId && bid.userId === userId,
  )
}

export function isCurrentUserBid(vehicle: Vehicle, userId: string): boolean {
  return vehicle.bid.currentBid?.userId === userId
}

export function getUserBidAction(
  vehicle: Vehicle,
  userId: string,
  userBid?: Bid,
): UserBidAction {
  const hasRecordedBid =
    userBid?.vehicleId === vehicle.id && userBid.userId === userId

  if (!hasRecordedBid && !isCurrentUserBid(vehicle, userId)) {
    return 'place'
  }

  return vehicle.bid.reserveStatus === 'Reserve not met' ? 'raise' : 'locked'
}

export function getUserBidEntries(
  vehicles: readonly Vehicle[],
  bids: readonly Bid[],
  userId: string,
): UserBidEntry[] {
  return vehicles.flatMap((vehicle) => {
    const bid = getUserBidForVehicle(bids, vehicle.id, userId)
    return bid
      ? [
          {
            vehicle,
            bid,
            holdsCurrentBid: isCurrentUserBid(vehicle, userId),
          },
        ]
      : []
  })
}

export function applyBid(
  session: BidSessionSnapshot,
  request: BidRequest,
  resolveReserveStatus: ReserveStatusResolver,
): BidApplicationResult {
  const { bids, vehicles } = session
  const vehicleIndex = vehicles.findIndex(
    (vehicle) => vehicle.id === request.vehicleId,
  )

  if (vehicleIndex === -1) {
    return { accepted: false, vehicles, bids }
  }

  const vehicle = vehicles[vehicleIndex]

  if (getAuctionStatus(vehicle.auctionStart, request.placedAt) !== 'Open') {
    return { accepted: false, vehicles, bids }
  }

  const bidIdAlreadyExists = bids.some((bid) => bid.id === request.id)

  if (bidIdAlreadyExists) {
    return { accepted: false, vehicles, bids }
  }

  const userBid = getUserBidForVehicle(bids, vehicle.id, request.userId)

  if (getUserBidAction(vehicle, request.userId, userBid) === 'locked') {
    return { accepted: false, vehicles, bids }
  }

  const validation = validateBidAmount(request.amount, {
    startingBid: vehicle.startingBid,
    currentBid: vehicle.bid.currentBid?.amount ?? null,
  })

  if (!validation.isValid) {
    return { accepted: false, vehicles, bids }
  }

  const acceptedBid: Bid = {
    id: request.id,
    vehicleId: request.vehicleId,
    userId: request.userId,
    amount: validation.amount,
    placedAt: request.placedAt.toISOString(),
  }
  const updatedVehicle: Vehicle = {
    ...vehicle,
    bid: {
      currentBid: {
        amount: validation.amount,
        userId: request.userId,
      },
      bidCount: vehicle.bid.bidCount + 1,
      reserveStatus: resolveReserveStatus(vehicle.id, validation.amount),
    },
  }
  const nextVehicles = [...vehicles]
  nextVehicles[vehicleIndex] = updatedVehicle
  const nextBids = [...bids]

  if (userBid) {
    nextBids[bids.indexOf(userBid)] = acceptedBid
  } else {
    nextBids.push(acceptedBid)
  }

  return {
    accepted: true,
    vehicles: nextVehicles,
    bids: nextBids,
  }
}
