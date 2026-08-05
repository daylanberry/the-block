import { useCallback, useRef, useState } from 'react'

import { applyBid, type ReserveStatusResolver } from '../../domain/bidding'
import type { Vehicle } from '../../domain/types'
import {
  getVehicleReserveStatus,
  vehicles as catalogVehicles,
} from '../../domain/vehicles'

interface BidSessionOptions {
  initialVehicles?: readonly Vehicle[]
  resolveReserveStatus?: ReserveStatusResolver
}

export function useBidSessionState({
  initialVehicles = catalogVehicles,
  resolveReserveStatus = getVehicleReserveStatus,
}: BidSessionOptions = {}) {
  const [vehicles, setVehicles] = useState(initialVehicles)
  const vehiclesRef = useRef(vehicles)
  const placeBid = useCallback(
    (vehicleId: string, amount: number, placedAt = new Date()): boolean => {
      const currentVehicles = vehiclesRef.current
      const result = applyBid(
        currentVehicles,
        { vehicleId, amount, placedAt },
        resolveReserveStatus,
      )

      if (!result.accepted) {
        return false
      }

      vehiclesRef.current = result.vehicles
      setVehicles(result.vehicles)

      return true
    },
    [resolveReserveStatus],
  )

  return { vehicles, placeBid }
}
