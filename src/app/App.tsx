import { Route, Switch } from 'wouter'

import { AppShell } from '../components/AppShell'
import { getUserBidForVehicle } from '../domain/bidding'
import { findVehicleById } from '../domain/inventory'
import { MyBidsRoute } from '../features/bidding/MyBidsRoute/MyBidsRoute'
import {
  placeBid,
  selectBids,
  selectUserBidEntries,
  selectUserBidVehicleCount,
  selectUserId,
  selectVehicles,
} from '../features/bidding/bidSessionSlice'
import { InventoryRoute } from '../features/inventory/InventoryRoute'
import { VehicleRoute } from '../features/vehicle/VehicleRoute'
import { useAppDispatch, useAppSelector } from './hooks'
import { NotFoundRoute } from './NotFoundRoute'

function AppRoutes() {
  const dispatch = useAppDispatch()
  const userId = useAppSelector(selectUserId)
  const vehicles = useAppSelector(selectVehicles)
  const bids = useAppSelector(selectBids)
  const userBidEntries = useAppSelector(selectUserBidEntries)
  const userBidVehicleCount = useAppSelector(selectUserBidVehicleCount)

  return (
    <AppShell userBidVehicleCount={userBidVehicleCount}>
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
                onPlaceBid={(amount) =>
                  dispatch(placeBid({ vehicleId: vehicle.id, amount }))
                }
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

export function App() {
  return <AppRoutes />
}
