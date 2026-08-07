import { Route, Switch } from 'wouter'

import { AppShell } from '../components/AppShell'
import { MyBidsRoute } from '../features/bidding/MyBidsRoute/MyBidsRoute'
import { selectVehicleById } from '../features/bidding/bidSessionSlice'
import { InventoryRoute } from '../features/inventory/InventoryRoute'
import { VehicleRoute } from '../features/vehicle/VehicleRoute'
import { useAppSelector } from './hooks'
import { NotFoundRoute } from './NotFoundRoute'

interface VehicleRouteMatchProps {
  vehicleId: string
}

function VehicleRouteMatch({ vehicleId }: VehicleRouteMatchProps) {
  const vehicle = useAppSelector((state) =>
    selectVehicleById(state, vehicleId),
  )

  return vehicle ? (
    <VehicleRoute vehicle={vehicle} />
  ) : (
    <NotFoundRoute
      eyebrow="404 / Vehicle lookup"
      title="Vehicle was not found."
      description="Check the vehicle link or return to the full wholesale inventory."
    />
  )
}

function AppRoutes() {
  return (
    <AppShell>
      <Switch>
        <Route path="/">
          {() => <InventoryRoute />}
        </Route>
        <Route path="/bids">
          {() => <MyBidsRoute />}
        </Route>
        <Route path="/vehicles/:vehicleId">
          {(params) => <VehicleRouteMatch vehicleId={params.vehicleId} />}
        </Route>
        <Route>{() => <NotFoundRoute />}</Route>
      </Switch>
    </AppShell>
  )
}

export function App() {
  return <AppRoutes />
}
