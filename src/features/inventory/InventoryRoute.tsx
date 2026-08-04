import { useEffect, useMemo, useRef, useState } from 'react'

import { getAuctionStatus } from '../../domain/auction'
import {
  BODY_STYLE_FILTERS,
  filterVehicles,
  sortOpenVehiclesFirst,
} from '../../domain/inventory'
import type { BodyStyleFilter, Vehicle } from '../../domain/types'
import { vehicles } from '../../domain/vehicles'
import { VehicleCard } from './VehicleCard/VehicleCard'
import './inventory.css'

interface InventoryRouteProps {
  inventory?: readonly Vehicle[]
  now?: Date
}

export function InventoryRoute({
  inventory = vehicles,
  now: suppliedNow,
}: InventoryRouteProps) {
  const [query, setQuery] = useState('')
  const [bodyStyle, setBodyStyle] = useState<BodyStyleFilter>('All')
  const [liveTime, setLiveTime] = useState(() => new Date())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const referenceTime = suppliedNow ?? liveTime

  useEffect(() => {
    if (suppliedNow) {
      return
    }

    const timer = window.setInterval(() => setLiveTime(new Date()), 60_000)

    return () => window.clearInterval(timer)
  }, [suppliedNow])

  const orderedInventory = useMemo(
    () => sortOpenVehiclesFirst(inventory, referenceTime),
    [inventory, referenceTime],
  )
  const filteredInventory = useMemo(
    () => filterVehicles(orderedInventory, { query, bodyStyle }),
    [bodyStyle, orderedInventory, query],
  )
  const openCount = useMemo(
    () =>
      inventory.filter(
        (vehicle) =>
          getAuctionStatus(vehicle.auctionStart, referenceTime) === 'Open',
      ).length,
    [inventory, referenceTime],
  )
  const hasActiveFilters = query.trim() !== '' || bodyStyle !== 'All'

  function clearFilters() {
    setQuery('')
    setBodyStyle('All')
    searchInputRef.current?.focus()
  }

  return (
    <div className="inventory-page">
      <header className="inventory-page__header">
        <div className="inventory-page__title-block">
          <p className="eyebrow">Buyer inventory / Canada</p>
          <h1 id="inventory-title">Wholesale inventory</h1>
          <p>
            Compare condition, title risk, and bid position across{' '}
            {inventory.length} vehicles.
          </p>
        </div>

        <aside className="inventory-tally" aria-label="Inventory summary">
          <div className="inventory-tally__total">
            <strong>{inventory.length}</strong>
            <span>Total lots</span>
          </div>
          <dl>
            <div>
              <dt>Open</dt>
              <dd>{openCount}</dd>
            </div>
            <div>
              <dt>Scheduled</dt>
              <dd>{inventory.length - openCount}</dd>
            </div>
          </dl>
        </aside>
      </header>

      <section className="inventory-console" aria-label="Inventory filters">
        <div className="inventory-search">
          <label htmlFor="inventory-search">Search inventory</label>
          <div className="inventory-search__field">
            <span aria-hidden="true">⌕</span>
            <input
              ref={searchInputRef}
              id="inventory-search"
              type="search"
              value={query}
              placeholder="Search year, make, model, trim, VIN, lot, or dealership"
              autoComplete="off"
              aria-controls="vehicle-results"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>

        <fieldset className="body-filter">
          <legend>Body style</legend>
          <div className="body-filter__options">
            {BODY_STYLE_FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={bodyStyle === option}
                onClick={() => setBodyStyle(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </fieldset>
      </section>

      <div className="inventory-results-bar">
        <p aria-live="polite" aria-atomic="true">
          <strong>{filteredInventory.length}</strong>{' '}
          {hasActiveFilters ? `of ${inventory.length} ` : ''}
          {filteredInventory.length === 1 ? 'vehicle' : 'vehicles'}
        </p>
        {hasActiveFilters && filteredInventory.length > 0 ? (
          <button type="button" onClick={clearFilters}>
            Clear search and filters
          </button>
        ) : null}
      </div>

      {filteredInventory.length > 0 ? (
        <ul
          className="inventory-grid"
          id="vehicle-results"
          aria-label="Vehicle inventory"
        >
          {filteredInventory.map((vehicle) => (
            <li key={vehicle.id}>
              <VehicleCard vehicle={vehicle} now={referenceTime} />
            </li>
          ))}
        </ul>
      ) : (
        <section
          className="inventory-empty"
          id="vehicle-results"
          aria-labelledby="inventory-empty-title"
        >
          <p className="inventory-empty__code" aria-hidden="true">
            00
          </p>
          <div>
            <p className="eyebrow">Inventory result</p>
            <h2 id="inventory-empty-title">No matching lots</h2>
            <p>
              Try a broader vehicle search or return to the full body-style
              list.
            </p>
          </div>
          <button type="button" onClick={clearFilters}>
            Clear search and filters
          </button>
        </section>
      )}
    </div>
  )
}
