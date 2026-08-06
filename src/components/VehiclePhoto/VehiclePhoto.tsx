import { useState } from 'react'

import type { Vehicle } from '../../domain/types'
import './VehiclePhoto.css'

interface VehiclePhotoProps {
  vehicle: Pick<
    Vehicle,
    'year' | 'make' | 'model' | 'trim' | 'lot' | 'images'
  >
}

export function VehiclePhoto({ vehicle }: VehiclePhotoProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`
  const primaryImage = vehicle.images[0]

  if (hasError || !primaryImage) {
    return (
      <div
        className="vehicle-photo vehicle-photo--fallback"
        role="img"
        aria-label={`Photo unavailable for ${vehicleName}`}
      >
        <span aria-hidden="true">Photo / unavailable</span>
      </div>
    )
  }

  return (
    <div className="vehicle-photo">
      {!isLoaded ? (
        <span className="vehicle-photo__loading" aria-hidden="true">
          Loading photo
        </span>
      ) : null}
      <img
        className={`vehicle-photo__image${isLoaded ? ' is-loaded' : ''}`}
        src={primaryImage}
        alt={`${vehicleName}, lot ${vehicle.lot}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
