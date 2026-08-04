import { Route, Switch } from 'wouter'

import { AppShell } from '../components/AppShell'
import { findVehicleById } from '../domain/inventory'
import { vehicles } from '../domain/vehicles'
import { InventoryRoute } from '../features/inventory/InventoryRoute'
import { VehicleRoute } from '../features/vehicle/VehicleRoute'
import { NotFoundRoute } from './NotFoundRoute'

export function App() {
  return (
    <AppShell>
      <Switch>
        <Route path="/">{() => <InventoryRoute />}</Route>
        <Route path="/vehicles/:vehicleId">
          {(params) => {
            const vehicle = findVehicleById(vehicles, params.vehicleId)

            return vehicle ? (
              <VehicleRoute vehicle={vehicle} />
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
