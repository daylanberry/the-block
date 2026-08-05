import { useState } from 'react'
import { Link } from 'wouter'

import { getAuctionStatus } from '../../../domain/auction'
import {
  formatAuctionStart,
  formatCurrency,
  formatOdometer,
} from '../../../domain/formatters'
import { getReserveTone, getTitleTone } from '../../../domain/statusTone'
import type { Vehicle } from '../../../domain/types'
import './VehicleCard.css'

interface VehicleCardProps {
  vehicle: Vehicle
  now: Date
}

function VehicleImage({ vehicle }: Pick<VehicleCardProps, 'vehicle'>) {
  const [hasError, setHasError] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`
  const primaryImage = vehicle.images[0]

  if (hasError || !primaryImage) {
    return (
      <div
        className="vehicle-card__image-fallback"
        role="img"
        aria-label={`Photo unavailable for ${vehicleName}`}
      >
        <span aria-hidden="true">Photo / unavailable</span>
      </div>
    )
  }

  return (
    <>
      {!isLoaded ? (
        <span className="vehicle-card__image-loading" aria-hidden="true">
          Loading photo
        </span>
      ) : null}
      <img
        className={`vehicle-card__image${isLoaded ? ' is-loaded' : ''}`}
        src={primaryImage}
        alt={`${vehicleName}, lot ${vehicle.lot}`}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
      />
    </>
  )
}

export function VehicleCard({ vehicle, now }: VehicleCardProps) {
  const titleId = `vehicle-${vehicle.id}-title`
  const lotId = `vehicle-${vehicle.id}-lot`
  const auctionStatus = getAuctionStatus(vehicle.auctionStart, now)
  const hasCurrentBid = vehicle.bid.currentBid !== null
  const isYourBid =
    vehicle.bid.yourBid !== null &&
    vehicle.bid.yourBid === vehicle.bid.currentBid
  const displayedBid = vehicle.bid.currentBid ?? vehicle.startingBid
  const damageCount = vehicle.damageNotes.length
  const damageLabel =
    damageCount === 0
      ? 'No reported damage'
      : `${damageCount} reported ${damageCount === 1 ? 'issue' : 'issues'}`
  const titleTone = getTitleTone(vehicle.titleStatus)
  const reserveTone = getReserveTone(vehicle.bid.reserveStatus)

  return (
    <article
      className={`vehicle-card${isYourBid ? ' vehicle-card--your-bid' : ''}`}
      aria-labelledby={`${titleId} ${lotId}`}
    >
      <Link
        className="vehicle-card__link"
        href={`/vehicles/${vehicle.id}`}
        aria-labelledby={`${titleId} ${lotId}`}
      >
        <div className="vehicle-card__media">
          <VehicleImage vehicle={vehicle} />
          <span className="vehicle-card__lot" id={lotId}>
            Lot {vehicle.lot}
          </span>
          <div
            className={`vehicle-card__auction vehicle-card__auction--${auctionStatus.toLowerCase()}`}
          >
            <strong>
              {auctionStatus === 'Open' ? 'Open for bidding' : 'Auction starts'}
            </strong>
            {auctionStatus === 'Scheduled' ? (
              <time dateTime={vehicle.auctionStart.toISOString()}>
                {formatAuctionStart(vehicle.auctionStart)}
              </time>
            ) : (
              <span>Bid entry available</span>
            )}
          </div>
        </div>

        <div className="vehicle-card__body">
          <header className="vehicle-card__identity">
            <h2 id={titleId}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <p>{vehicle.trim}</p>
          </header>

          <p className="vehicle-card__location">
            {vehicle.city}, {vehicle.province}
          </p>

          <dl className="vehicle-card__inspection">
            <div>
              <dt>Condition</dt>
              <dd>
                <strong>{vehicle.conditionGrade.toFixed(1)}</strong> / 5
              </dd>
            </div>
            <div>
              <dt>Odometer</dt>
              <dd>{formatOdometer(vehicle.odometerKm)}</dd>
            </div>
            <div className="vehicle-card__title">
              <dt>Title</dt>
              <dd data-tone={titleTone}>{vehicle.titleStatus}</dd>
            </div>
            <div className="vehicle-card__damage">
              <dt>Damage</dt>
              <dd data-tone={damageCount === 0 ? 'positive' : 'warning'}>
                {damageLabel}
              </dd>
            </div>
          </dl>
        </div>

        <footer className="vehicle-card__footer">
          <div className="vehicle-card__price">
            <span>
              {isYourBid
                ? 'Your bid'
                : hasCurrentBid
                  ? 'Current bid'
                  : 'Starting bid'}
            </span>
            <strong>
              {formatCurrency(displayedBid)} <small>CAD</small>
            </strong>
            <small>
              {hasCurrentBid
                ? `${vehicle.bid.bidCount} ${vehicle.bid.bidCount === 1 ? 'bid' : 'bids'}`
                : 'No bids yet'}
            </small>
          </div>
          <div className="vehicle-card__action">
            <span data-tone={reserveTone}>{vehicle.bid.reserveStatus}</span>
            <strong>
              Inspect vehicle <span aria-hidden="true">→</span>
            </strong>
          </div>
        </footer>
      </Link>
    </article>
  )
}
