import { memo } from 'react'
import { Link } from 'wouter'

import { useAppSelector } from '../../../app/hooks'
import { VehiclePhoto } from '../../../components/VehiclePhoto/VehiclePhoto'
import { getAuctionStatus } from '../../../domain/auction'
import {
  getUserBidAction,
  isCurrentUserBid,
} from '../../../domain/bidding'
import {
  formatAuctionStart,
  formatCurrency,
  formatOdometer,
} from '../../../domain/formatters'
import { getReserveTone, getTitleTone } from '../../../domain/statusTone'
import type { Vehicle } from '../../../domain/types'
import {
  selectUserBidForVehicle,
  selectUserId,
} from '../../bidding/bidSessionSlice'
import './VehicleCard.css'

interface VehicleCardProps {
  vehicle: Vehicle
  now: Date
}

export const VehicleCard = memo(function VehicleCard({
  vehicle,
  now,
}: VehicleCardProps) {
  const userId = useAppSelector(selectUserId)
  const userBid = useAppSelector((state) =>
    selectUserBidForVehicle(state, vehicle.id),
  )
  const titleId = `vehicle-${vehicle.id}-title`
  const lotId = `vehicle-${vehicle.id}-lot`
  const bidPositionId = `vehicle-${vehicle.id}-bid-position`
  const auctionStatus = getAuctionStatus(vehicle.auctionStart, now)
  const hasCurrentBid = vehicle.bid.currentBid !== null
  const isYourBid = isCurrentUserBid(vehicle, userId)
  const buyerHasBid = userBid !== undefined || isYourBid
  const canRaiseBid =
    auctionStatus === 'Open' &&
    getUserBidAction(vehicle, userId, userBid) === 'raise'
  const displayedBid =
    vehicle.bid.currentBid?.amount ?? vehicle.startingBid
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
        aria-describedby={buyerHasBid ? bidPositionId : undefined}
      >
        <div className="vehicle-card__media">
          <VehiclePhoto vehicle={vehicle} />
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
              <span>
                {isYourBid
                  ? canRaiseBid
                    ? 'Current bid is yours · raise available'
                    : 'Current bid is yours'
                  : buyerHasBid
                    ? canRaiseBid
                      ? 'Higher bid available'
                      : 'Bid recorded'
                    : 'Bid entry available'}
              </span>
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
              {hasCurrentBid ? 'Current bid' : 'Starting bid'}
            </span>
            <strong>
              {formatCurrency(displayedBid)} <small>CAD</small>
            </strong>
            <small id={buyerHasBid ? bidPositionId : undefined}>
              {isYourBid
                ? `You hold the current bid · ${vehicle.bid.bidCount} ${vehicle.bid.bidCount === 1 ? 'bid' : 'bids'}`
                : buyerHasBid
                  ? `Bid recorded · ${vehicle.bid.bidCount} ${vehicle.bid.bidCount === 1 ? 'bid' : 'bids'}`
                  : hasCurrentBid
                    ? `${vehicle.bid.bidCount} ${vehicle.bid.bidCount === 1 ? 'bid' : 'bids'}`
                    : 'No bids yet'}
            </small>
          </div>
          <div className="vehicle-card__action">
            <span data-tone={reserveTone}>{vehicle.bid.reserveStatus}</span>
            <strong>
              {canRaiseBid ? 'Review and raise bid' : 'Inspect vehicle'}{' '}
              <span aria-hidden="true">→</span>
            </strong>
          </div>
        </footer>
      </Link>
    </article>
  )
})
