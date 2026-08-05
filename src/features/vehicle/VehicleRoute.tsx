import { Link } from 'wouter'

import { formatOdometer } from '../../domain/formatters'
import {
  getConflictingTitleMention,
  getTitleTone,
} from '../../domain/statusTone'
import type { Vehicle } from '../../domain/types'
import { useReferenceTime } from '../../hooks/useReferenceTime'
import { AuctionRail } from './AuctionRail/AuctionRail'
import { VehicleGallery } from './VehicleGallery/VehicleGallery'
import './vehicle.css'

interface VehicleRouteProps {
  vehicle: Vehicle
  now?: Date
  onPlaceBid: (amount: number, placedAt: Date) => boolean
}

export function VehicleRoute({
  vehicle,
  now: suppliedNow,
  onPlaceBid,
}: VehicleRouteProps) {
  const referenceTime = useReferenceTime(suppliedNow)
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const damageCount = vehicle.damageNotes.length
  const titleTone = getTitleTone(vehicle.titleStatus)
  // Flag when the structured title status conflicts with the free-text report.
  const conflictingTitleMention = getConflictingTitleMention(
    vehicle.titleStatus,
    vehicle.conditionReport,
  )

  return (
    <article className="vehicle-detail" aria-labelledby="vehicle-title">
      <Link className="vehicle-detail__back" href="/">
        <span aria-hidden="true">←</span> Back to inventory
      </Link>

      <header className="vehicle-detail__hero">
        <div className="vehicle-detail__identity">
          <p className="eyebrow">Buyer inspection / {vehicle.bodyStyle}</p>
          <h1 id="vehicle-title" tabIndex={-1}>
            {vehicleName}
          </h1>
          <p className="vehicle-detail__trim">{vehicle.trim}</p>
          <div
            className="vehicle-detail__meta"
            role="group"
            aria-label="Vehicle summary"
          >
            <span>
              {vehicle.city}, {vehicle.province}
            </span>
            <span>{formatOdometer(vehicle.odometerKm)}</span>
          </div>
        </div>
      </header>

      <div className="vehicle-detail__layout">
        <div className="vehicle-detail__gallery">
          <VehicleGallery
            vehicleId={vehicle.id}
            vehicleName={`${vehicleName} ${vehicle.trim}`}
            lot={vehicle.lot}
            images={vehicle.images}
          />
        </div>

        <AuctionRail
          vehicle={vehicle}
          now={referenceTime}
          onPlaceBid={(amount) => onPlaceBid(amount, referenceTime)}
        />

        <div className="vehicle-detail__sections">
          <section
            className="detail-section detail-section--condition"
            aria-labelledby="condition-title"
          >
            <header className="detail-section__heading">
              <p>Inspection summary</p>
              <h2 id="condition-title">Condition &amp; title</h2>
            </header>

            <div className="risk-summary">
              <div className="risk-summary__grade">
                <span>Condition grade</span>
                <p>
                  <strong>{vehicle.conditionGrade.toFixed(1)}</strong>
                  <small>/ 5</small>
                </p>
              </div>
              <div className="risk-summary__status" data-tone={titleTone}>
                <span>Title status</span>
                <strong>{vehicle.titleStatus}</strong>
              </div>
              <div
                className="risk-summary__status"
                data-tone={damageCount === 0 ? 'positive' : 'warning'}
              >
                <span>Damage record</span>
                <strong>
                  {damageCount === 0
                    ? 'No reported damage'
                    : `${damageCount} reported ${damageCount === 1 ? 'item' : 'items'}`}
                </strong>
              </div>
            </div>

            <div className="inspection-report">
              <h3>Inspector report</h3>
              <div className="inspection-report__content">
                <p>{vehicle.conditionReport}</p>
                {conflictingTitleMention ? (
                  <div
                    className="inspection-report__title-conflict"
                    role="note"
                    aria-label="Conflicting title data"
                  >
                    <strong>Verify title documentation</strong>
                    <p>
                      The title record lists {vehicle.titleStatus}, but the
                      supplied report references {conflictingTitleMention}.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="damage-record">
              <h3>Reported damage</h3>
              {damageCount === 0 ? (
                <p className="damage-record__clear">
                  <span aria-hidden="true">✓</span> No reported damage
                </p>
              ) : (
                <ul>
                  {vehicle.damageNotes.map((note, index) => (
                    <li key={`${note}-${index}`}>
                      <span aria-hidden="true">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {note}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="detail-section" aria-labelledby="specifications-title">
            <header className="detail-section__heading">
              <p>Vehicle record</p>
              <h2 id="specifications-title">Specifications</h2>
            </header>

            <dl className="specification-grid">
              <div>
                <dt>Body style</dt>
                <dd>{vehicle.bodyStyle}</dd>
              </div>
              <div>
                <dt>Engine</dt>
                <dd>{vehicle.engine}</dd>
              </div>
              <div>
                <dt>Transmission</dt>
                <dd>{vehicle.transmission}</dd>
              </div>
              <div>
                <dt>Drivetrain</dt>
                <dd>{vehicle.drivetrain}</dd>
              </div>
              <div>
                <dt>Fuel</dt>
                <dd>{vehicle.fuelType}</dd>
              </div>
              <div>
                <dt>Odometer</dt>
                <dd>{formatOdometer(vehicle.odometerKm)}</dd>
              </div>
              <div>
                <dt>Exterior</dt>
                <dd>{vehicle.exteriorColor}</dd>
              </div>
              <div>
                <dt>Interior</dt>
                <dd>{vehicle.interiorColor}</dd>
              </div>
            </dl>
          </section>

          <section
            className="detail-section detail-section--seller"
            aria-labelledby="seller-title"
          >
            <header className="detail-section__heading">
              <p>Lot provenance</p>
              <h2 id="seller-title">Seller &amp; identifiers</h2>
            </header>

            <div className="seller-record">
              <div className="seller-record__identity">
                <span>Selling dealership</span>
                <h3>{vehicle.sellingDealership}</h3>
                <p>
                  {vehicle.city}, {vehicle.province}
                </p>
              </div>
              <dl>
                <div>
                  <dt>VIN</dt>
                  <dd>{vehicle.vin}</dd>
                </div>
                <div>
                  <dt>Lot</dt>
                  <dd>{vehicle.lot}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      </div>
    </article>
  )
}
