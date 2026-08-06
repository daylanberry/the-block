import { getAuctionStatus, getMinimumBid } from '../../../domain/auction'
import {
  formatAuctionStart,
  formatCurrency,
} from '../../../domain/formatters'
import { getUserBidAction } from '../../../domain/bidding'
import { getReserveTone } from '../../../domain/statusTone'
import type { Bid, Vehicle } from '../../../domain/types'
import { BidDialog } from '../../bidding/BidDialog/BidDialog'
import './AuctionRail.css'

interface AuctionRailProps {
  vehicle: Vehicle
  now: Date
  userBid?: Bid
  userId: string
  onPlaceBid: (amount: number) => boolean
}

export function AuctionRail({
  vehicle,
  now,
  userBid,
  userId,
  onPlaceBid,
}: AuctionRailProps) {
  const auctionStatus = getAuctionStatus(vehicle.auctionStart, now)
  const hasCurrentBid = vehicle.bid.currentBid !== null
  const userBidAction = getUserBidAction(vehicle, userId, userBid)
  const displayedBid =
    vehicle.bid.currentBid?.amount ?? vehicle.startingBid
  const minimumBid = getMinimumBid({
    startingBid: vehicle.startingBid,
    currentBid: vehicle.bid.currentBid?.amount ?? null,
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
        <div className="auction-rail__meta">
          <div className="auction-rail__lot">
            <span>Lot</span>
            <strong>{vehicle.lot}</strong>
          </div>
          <span
            className="auction-rail__status-badge"
            data-status={auctionStatus.toLowerCase()}
            aria-hidden="true"
          >
            {auctionStatus}
          </span>
        </div>
        <h2 id="auction-title" aria-live="polite">
          {auctionStatus === 'Open' ? 'Open for bidding' : 'Scheduled'}
        </h2>
      </header>

      <div className="auction-rail__price">
        <span>
          {hasCurrentBid ? 'Current bid' : 'Starting bid'}
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
        {auctionStatus === 'Open' && userBidAction !== 'locked' ? (
          <div>
            <dt>Next valid bid</dt>
            <dd>
              {formatCurrency(minimumBid)} <small>CAD</small>
            </dd>
          </div>
        ) : auctionStatus === 'Scheduled' ? (
          <div>
            <dt>Auction starts</dt>
            <dd>
              <time dateTime={vehicle.auctionStart.toISOString()}>
                {formatAuctionStart(vehicle.auctionStart)}
              </time>
            </dd>
          </div>
        ) : null}
      </dl>

      {auctionStatus === 'Scheduled' ? (
        <p className="auction-rail__notice">
          This lot remains read-only until its scheduled auction opens.
        </p>
      ) : (
        <BidDialog
          key={vehicle.id}
          vehicle={vehicle}
          userBid={userBid}
          userId={userId}
          onPlaceBid={onPlaceBid}
        />
      )}
    </aside>
  )
}
