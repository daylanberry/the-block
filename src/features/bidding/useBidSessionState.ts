import { useCallback, useMemo, useRef, useState } from 'react'

import {
  applyBid,
  getUserBidEntries,
  type BidSessionSnapshot,
  type ReserveStatusResolver,
} from '../../domain/bidding'
import type { Vehicle } from '../../domain/types'
import {
  getVehicleReserveStatus,
  vehicles as catalogVehicles,
} from '../../domain/vehicles'

interface BidSessionOptions {
  userId: string
  initialVehicles?: readonly Vehicle[]
  resolveReserveStatus?: ReserveStatusResolver
  createBidId?: () => string
}

function createPrototypeBidId() {
  return crypto.randomUUID()
}

export function useBidSessionState({
  userId,
  initialVehicles = catalogVehicles,
  resolveReserveStatus = getVehicleReserveStatus,
  createBidId = createPrototypeBidId,
}: BidSessionOptions) {
  const [session, setSession] = useState<BidSessionSnapshot>(() => ({
    vehicles: initialVehicles,
    bids: [],
  }))
  const sessionRef = useRef(session)
  const userBidEntries = useMemo(
    () => getUserBidEntries(session.vehicles, session.bids, userId),
    [session.bids, session.vehicles, userId],
  )
  const placeBid = useCallback(
    (vehicleId: string, amount: number, placedAt = new Date()): boolean => {
      const result = applyBid(
        sessionRef.current,
        {
          id: createBidId(),
          vehicleId,
          userId,
          amount,
          placedAt,
        },
        resolveReserveStatus,
      )

      if (!result.accepted) {
        return false
      }

      const nextSession: BidSessionSnapshot = {
        vehicles: result.vehicles,
        bids: result.bids,
      }
      sessionRef.current = nextSession
      setSession(nextSession)

      return true
    },
    [createBidId, resolveReserveStatus, userId],
  )

  return {
    vehicles: session.vehicles,
    bids: session.bids,
    userBidEntries,
    placeBid,
  }
}
