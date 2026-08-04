import { Route, Switch } from 'wouter'

import { AppShell } from '../components/AppShell'
import { InventoryRoute } from '../features/inventory/InventoryRoute'
import { VehicleRoute } from '../features/vehicle/VehicleRoute'
import { NotFoundRoute } from './NotFoundRoute'

export function App() {
  return (
    <AppShell>
      <Switch>
        <Route path="/">{() => <InventoryRoute />}</Route>
        <Route path="/vehicles/:vehicleId">
          {(params) => <VehicleRoute vehicleId={params.vehicleId} />}
        </Route>
        <Route component={NotFoundRoute} />
      </Switch>
    </AppShell>
  )
}
