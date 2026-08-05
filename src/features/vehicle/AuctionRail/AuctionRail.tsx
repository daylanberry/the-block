import { getAuctionStatus, getMinimumBid } from '../../../domain/auction'
import {
  formatAuctionStart,
  formatCurrency,
} from '../../../domain/formatters'
import type { ReserveStatus, Vehicle } from '../../../domain/types'
import { BidDialog } from '../../bidding/BidDialog/BidDialog'
import './AuctionRail.css'

interface AuctionRailProps {
  vehicle: Vehicle
  now: Date
  onPlaceBid: (amount: number) => boolean
}

function getReserveTone(reserveStatus: ReserveStatus) {
  if (reserveStatus === 'Reserve met') {
    return 'positive'
  }

  return reserveStatus === 'Reserve not met' ? 'warning' : 'neutral'
}

export function AuctionRail({
  vehicle,
  now,
  onPlaceBid,
}: AuctionRailProps) {
  const auctionStatus = getAuctionStatus(vehicle.auctionStart, now)
  const hasCurrentBid = vehicle.bid.currentBid !== null
  const isYourBid =
    vehicle.bid.yourBid !== null &&
    vehicle.bid.yourBid === vehicle.bid.currentBid
  const displayedBid = vehicle.bid.currentBid ?? vehicle.startingBid
  const minimumBid = getMinimumBid({
    startingBid: vehicle.startingBid,
    currentBid: vehicle.bid.currentBid,
  })
  const reserveTone = getReserveTone(vehicle.bid.reserveStatus)

  return (
    <aside
      className="auction-rail"
      id="auction-panel"
      aria-labelledby="auction-title"
    >
      <header
        className={`auction-rail__header auction-rail__header--${auctionStatus.toLowerCase()}`}
      >
        <p>Auction position</p>
        <h2 id="auction-title">
          {auctionStatus === 'Open' ? 'Open for bidding' : 'Scheduled'}
        </h2>
        {auctionStatus === 'Scheduled' ? (
          <span>Bid entry unavailable</span>
        ) : isYourBid ? (
          <span>You hold the current bid</span>
        ) : null}
      </header>

      <div className="auction-rail__price">
        <span>
          {isYourBid
            ? 'Your bid'
            : hasCurrentBid
              ? 'Current bid'
              : 'Starting bid'}
        </span>
        <strong>{formatCurrency(displayedBid)}</strong>
        <small>CAD</small>
        <p>
          {hasCurrentBid
            ? `${vehicle.bid.bidCount} ${vehicle.bid.bidCount === 1 ? 'bid' : 'bids'}`
            : 'No bids yet'}
        </p>
      </div>

      <dl className="auction-rail__facts">
        <div>
          <dt>Reserve</dt>
          <dd data-tone={reserveTone}>{vehicle.bid.reserveStatus}</dd>
        </div>
        {auctionStatus === 'Open' ? (
          <div>
            <dt>Next valid bid</dt>
            <dd>
              {formatCurrency(minimumBid)} <small>CAD</small>
            </dd>
          </div>
        ) : (
          <div>
            <dt>Auction starts</dt>
            <dd>
              <time dateTime={vehicle.auctionStart.toISOString()}>
                {formatAuctionStart(vehicle.auctionStart)}
              </time>
            </dd>
          </div>
        )}
      </dl>

      {auctionStatus === 'Scheduled' ? (
        <p className="auction-rail__notice">
          This lot remains read-only until its scheduled auction opens.
        </p>
      ) : (
        <BidDialog
          key={vehicle.id}
          vehicle={vehicle}
          onPlaceBid={onPlaceBid}
        />
      )}
    </aside>
  )
}
