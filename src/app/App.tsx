import { useState } from 'react'
import { Route, Switch } from 'wouter'

import { AppShell } from '../components/AppShell'
import { getUserBidForVehicle } from '../domain/bidding'
import { findVehicleById } from '../domain/inventory'
import { MyBidsRoute } from '../features/bidding/MyBidsRoute/MyBidsRoute'
import { useBidSessionState } from '../features/bidding/useBidSessionState'
import { InventoryRoute } from '../features/inventory/InventoryRoute'
import { VehicleRoute } from '../features/vehicle/VehicleRoute'
import { NotFoundRoute } from './NotFoundRoute'

interface AppRoutesProps {
  userId: string
}

function AppRoutes({ userId }: AppRoutesProps) {
  const { vehicles, bids, userBidEntries, placeBid } = useBidSessionState({
    userId,
  })

  return (
    <AppShell userBidVehicleCount={userBidEntries.length}>
      <Switch>
        <Route path="/">
          {() => (
            <InventoryRoute
              inventory={vehicles}
              bids={bids}
              userId={userId}
            />
          )}
        </Route>
        <Route path="/bids">
          {() => <MyBidsRoute entries={userBidEntries} />}
        </Route>
        <Route path="/vehicles/:vehicleId">
          {(params) => {
            const vehicle = findVehicleById(vehicles, params.vehicleId)
            const userBid = vehicle
              ? getUserBidForVehicle(bids, vehicle.id, userId)
              : undefined

            return vehicle ? (
              <VehicleRoute
                vehicle={vehicle}
                userId={userId}
                userBid={userBid}
                onPlaceBid={(amount) => placeBid(vehicle.id, amount)}
              />
            ) : (
              <NotFoundRoute
                eyebrow="404 / Vehicle lookup"
                title="Vehicle was not found."
                description="Check the vehicle link or return to the full wholesale inventory."
              />
            )
          }}
        </Route>
        <Route>{() => <NotFoundRoute />}</Route>
      </Switch>
    </AppShell>
  )
}

interface AppProps {
  userId?: string
}

export function App({ userId: suppliedUserId }: AppProps) {
  const [userId] = useState(
    () => suppliedUserId ?? crypto.randomUUID(),
  )

  return <AppRoutes userId={userId} />
}
