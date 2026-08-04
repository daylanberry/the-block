import { useState } from 'react'
import { Link } from 'wouter'

import { getAuctionStatus } from '../../domain/auction'
import {
  formatAuctionStart,
  formatCurrency,
  formatOdometer,
} from '../../domain/formatters'
import type { ReserveStatus, TitleStatus, Vehicle } from '../../domain/types'

interface VehicleCardProps {
  vehicle: Vehicle
  now: Date
}

function getTitleTone(titleStatus: TitleStatus) {
  if (titleStatus === 'Clean') {
    return 'positive'
  }

  return titleStatus === 'Rebuilt' ? 'warning' : 'critical'
}

function getReserveTone(reserveStatus: ReserveStatus) {
  if (reserveStatus === 'Reserve met') {
    return 'positive'
  }

  return reserveStatus === 'Reserve not met' ? 'warning' : 'neutral'
}

function VehicleImage({ vehicle }: Pick<VehicleCardProps, 'vehicle'>) {
  const [hasError, setHasError] = useState(false)
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`

  if (hasError) {
    return (
      <div
        className="vehicle-card__image-fallback"
        role="img"
        aria-label={`Photo unavailable for ${vehicleName}`}
      >
        <span aria-hidden="true">Photo / unavailable</span>
        <strong>{vehicle.lot}</strong>
      </div>
    )
  }

  return (
    <img
      className="vehicle-card__image"
      src={vehicle.images[0]}
      alt={`${vehicleName}, lot ${vehicle.lot}`}
      loading="lazy"
      decoding="async"
      onError={() => setHasError(true)}
    />
  )
}

export function VehicleCard({ vehicle, now }: VehicleCardProps) {
  const titleId = `vehicle-${vehicle.id}-title`
  const lotId = `vehicle-${vehicle.id}-lot`
  const auctionStatus = getAuctionStatus(vehicle.auctionStart, now)
  const hasCurrentBid = vehicle.bid.currentBid !== null
  const displayedBid = vehicle.bid.currentBid ?? vehicle.startingBid
  const damageCount = vehicle.damageNotes.length
  const damageLabel =
    damageCount === 0
      ? 'No reported damage'
      : `${damageCount} reported ${damageCount === 1 ? 'issue' : 'issues'}`
  const titleTone = getTitleTone(vehicle.titleStatus)
  const reserveTone = getReserveTone(vehicle.bid.reserveStatus)

  return (
    <article className="vehicle-card">
      <Link
        className="vehicle-card__link"
        href={`/vehicles/${vehicle.lot}`}
        aria-labelledby={`${titleId} ${lotId}`}
      >
        <div className="vehicle-card__media">
          <VehicleImage vehicle={vehicle} />
          <span className="vehicle-card__lot" id={lotId}>
            Lot {vehicle.lot}
          </span>
        </div>

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
            <span>Buyer access active</span>
          )}
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
            <span>{hasCurrentBid ? 'Current bid' : 'Starting bid'}</span>
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
