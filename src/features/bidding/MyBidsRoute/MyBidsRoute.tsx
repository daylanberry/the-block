import { Link } from 'wouter'

import { VehiclePhoto } from '../../../components/VehiclePhoto/VehiclePhoto'
import { getAuctionStatus } from '../../../domain/auction'
import type { UserBidEntry } from '../../../domain/bidding'
import {
  formatAuctionStart,
  formatCurrency,
} from '../../../domain/formatters'
import { getReserveTone } from '../../../domain/statusTone'
import { useReferenceTime } from '../../../hooks/useReferenceTime'
import './MyBidsRoute.css'

interface MyBidsRouteProps {
  entries: readonly UserBidEntry[]
  now?: Date
}

function SessionBidCard({
  entry,
  now,
}: {
  entry: UserBidEntry
  now: Date
}) {
  const { bid, holdsCurrentBid, vehicle } = entry
  const titleId = `current-bid-${vehicle.id}-title`
  const lotId = `current-bid-${vehicle.id}-lot`
  const positionId = `current-bid-${vehicle.id}-position`
  const auctionStatus = getAuctionStatus(vehicle.auctionStart, now)
  const reserveTone = getReserveTone(vehicle.bid.reserveStatus)
  const bidPosition = holdsCurrentBid ? 'current' : 'recorded'
  const bidPositionLabel = holdsCurrentBid
    ? 'You hold the current bid'
    : 'Bid recorded'

  return (
    <article
      className="current-bid-card"
      data-bid-position={bidPosition}
      aria-labelledby={`${titleId} ${lotId}`}
    >
      <Link
        className="current-bid-card__link"
        href={`/vehicles/${vehicle.id}`}
        aria-labelledby={`${titleId} ${lotId}`}
        aria-describedby={positionId}
      >
        <div className="current-bid-card__media">
          <VehiclePhoto vehicle={vehicle} />
          <span className="current-bid-card__lot" id={lotId}>
            Lot {vehicle.lot}
          </span>
        </div>

        <div className="current-bid-card__record">
          <p className="current-bid-card__kicker">Buyer bid record</p>
          <h2 id={titleId}>
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h2>
          <p className="current-bid-card__trim">{vehicle.trim}</p>
          <p className="current-bid-card__location">
            {vehicle.city}, {vehicle.province}
          </p>
        </div>

        <div className="current-bid-card__position">
          <p
            className="current-bid-card__bid-position"
            id={positionId}
            data-tone={holdsCurrentBid ? 'positive' : 'neutral'}
          >
            {bidPositionLabel}
          </p>

          <div className="current-bid-card__your-bid">
            <span>Your bid</span>
            <strong>
              {formatCurrency(bid.amount)} <small>CAD</small>
            </strong>
          </div>

          <dl className="current-bid-card__bid-facts">
            <div>
              <dt>Bid activity</dt>
              <dd>
                {vehicle.bid.bidCount}{' '}
                {vehicle.bid.bidCount === 1 ? 'bid' : 'bids'}
              </dd>
            </div>
            <div>
              <dt>Reserve</dt>
              <dd data-tone={reserveTone}>{vehicle.bid.reserveStatus}</dd>
            </div>
            <div>
              <dt>Auction</dt>
              <dd data-tone={auctionStatus === 'Open' ? 'positive' : 'neutral'}>
                {auctionStatus === 'Open' ? (
                  'Open for bidding'
                ) : (
                  <>
                    Auction starts{' '}
                    <time dateTime={vehicle.auctionStart.toISOString()}>
                      {formatAuctionStart(vehicle.auctionStart)}
                    </time>
                  </>
                )}
              </dd>
            </div>
          </dl>

          <strong className="current-bid-card__action">
            View vehicle{' '}
            <span aria-hidden="true">→</span>
          </strong>
        </div>
      </Link>
    </article>
  )
}

export function MyBidsRoute({
  entries,
  now: suppliedNow,
}: MyBidsRouteProps) {
  const referenceTime = useReferenceTime(suppliedNow)
  const vehicleLabel = entries.length === 1 ? 'vehicle' : 'vehicles'

  return (
    <div className="my-bids-page">
      <header className="my-bids-page__header">
        <p className="eyebrow">Buyer activity / Current session</p>
        <h1 id="my-bids-title" tabIndex={-1}>
          My bids
        </h1>
        <p>
          Review every vehicle you have bid on and return to its auction record
          from one focused list.
        </p>
      </header>

      <aside className="my-bids-summary" aria-label="Session bid summary">
        <p>
          <strong>{entries.length}</strong> {vehicleLabel} with bids
        </p>
        <p>
          <span aria-hidden="true" /> Current session
          <small>Resets on refresh</small>
        </p>
      </aside>

      {entries.length > 0 ? (
        <ul
          className="current-bids-list"
          aria-label="Vehicles with your bids"
        >
          {entries.map((entry) => (
            <li key={entry.vehicle.id}>
              <SessionBidCard entry={entry} now={referenceTime} />
            </li>
          ))}
        </ul>
      ) : (
        <section
          className="my-bids-empty"
          aria-labelledby="my-bids-empty-title"
        >
          <p className="my-bids-empty__code" aria-hidden="true">
            00
          </p>
          <div>
            <p className="eyebrow">Bid record / 00</p>
            <h2 id="my-bids-empty-title">No bids this session</h2>
            <p>
              Vehicles you bid on will appear here. Refreshing starts a new
              session.
            </p>
          </div>
          <Link className="my-bids-empty__action" href="/">
            Browse inventory <span aria-hidden="true">→</span>
          </Link>
        </section>
      )}
    </div>
  )
}
