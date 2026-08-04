import { Link } from 'wouter'

interface VehicleRouteProps {
  vehicleId: string
}

export function VehicleRoute({ vehicleId }: VehicleRouteProps) {
  const lot = vehicleId.trim() || 'Unknown'

  return (
    <section className="route-message" aria-labelledby="vehicle-route-title">
      <Link className="text-link" href="/">
        <span aria-hidden="true">←</span> Back to inventory
      </Link>
      <p className="eyebrow">Vehicle detail route</p>
      <h1 id="vehicle-route-title">
        Lot <span>{lot}</span>
      </h1>
      <p>
        This route is ready for the vehicle gallery, condition report, and bid
        rail.
      </p>
      <div className="route-message__stamp">
        <span>Route status</span>
        <strong>Ready</strong>
      </div>
    </section>
  )
}
