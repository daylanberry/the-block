import { Route, Switch } from 'wouter'

import { AppShell } from '../components/AppShell'
import { findVehicleById } from '../domain/inventory'
import { useBidSessionState } from '../features/bidding/useBidSessionState'
import { InventoryRoute } from '../features/inventory/InventoryRoute'
import { VehicleRoute } from '../features/vehicle/VehicleRoute'
import { NotFoundRoute } from './NotFoundRoute'

function AppRoutes() {
  const { vehicles, placeBid } = useBidSessionState()

  return (
    <AppShell>
      <Switch>
        <Route path="/">{() => <InventoryRoute inventory={vehicles} />}</Route>
        <Route path="/vehicles/:vehicleId">
          {(params) => {
            const vehicle = findVehicleById(vehicles, params.vehicleId)

            return vehicle ? (
              <VehicleRoute
                vehicle={vehicle}
                onPlaceBid={(amount, placedAt) =>
                  placeBid(vehicle.id, amount, placedAt)
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
