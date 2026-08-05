import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Route, Router, Switch } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { findVehicleById } from '../../domain/inventory'
import { makeVehicle } from '../../test/vehicleFactory'
import { InventoryRoute } from '../inventory/InventoryRoute'
import { VehicleRoute } from '../vehicle/VehicleRoute'
import { useBidSessionState } from './useBidSessionState'

const referenceTime = new Date(2026, 7, 4, 12)
const resolveReserveStatus = () => 'Reserve met' as const

interface JourneyRoutesProps {
  initialVehicles: readonly ReturnType<typeof makeVehicle>[]
}

function JourneyRoutes({ initialVehicles }: JourneyRoutesProps) {
  const { vehicles, placeBid } = useBidSessionState({
    initialVehicles,
    resolveReserveStatus,
  })

  return (
    <Switch>
      <Route path="/">
        {() => <InventoryRoute inventory={vehicles} now={referenceTime} />}
      </Route>
      <Route path="/vehicles/:vehicleId">
        {(params) => {
          const vehicle = findVehicleById(vehicles, params.vehicleId)

          return vehicle ? (
            <VehicleRoute
              vehicle={vehicle}
              now={referenceTime}
              onPlaceBid={(amount, placedAt) =>
                placeBid(vehicle.id, amount, placedAt)
              }
            />
          ) : null
        }}
      </Route>
    </Switch>
  )
}

describe('bid journey', () => {
  it('updates detail state and the matching inventory card in one session', () => {
    const vehicle = makeVehicle({
      auctionStart: new Date(2026, 7, 4, 11),
    })
    const { hook } = memoryLocation({
      path: `/vehicles/${vehicle.id}`,
    })

    render(
      <Router hook={hook}>
        <JourneyRoutes initialVehicles={[vehicle]} />
      </Router>,
    )

    const bidTrigger = screen.getByRole('button', { name: 'Place a bid' })
    fireEvent.click(bidTrigger)
    fireEvent.change(screen.getByRole('textbox', { name: 'Your bid (CAD)' }), {
      target: { value: '30,000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Place $30,000 bid' }),
    )

    const auctionRail = screen.getByRole('complementary', {
      name: 'Open for bidding',
    })
    expect(within(auctionRail).getByText('Your bid')).toBeInTheDocument()
    expect(within(auctionRail).getAllByText('$30,000').length).toBeGreaterThan(0)
    expect(within(auctionRail).getByText('9 bids')).toBeInTheDocument()
    expect(within(auctionRail).getByText('Reserve met')).toBeInTheDocument()
    const successDialog = screen.getByRole('dialog', { name: 'Bid placed' })

    expect(
      within(successDialog).getByRole('heading', { name: 'Bid placed' }),
    ).toHaveFocus()
    expect(within(successDialog).getByText('9')).toBeInTheDocument()
    expect(within(successDialog).getByText('Reserve met')).toBeInTheDocument()

    fireEvent.click(within(successDialog).getByRole('button', { name: 'Done' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(bidTrigger).toHaveFocus()

    fireEvent.click(screen.getByRole('link', { name: 'Back to inventory' }))

    const vehicleLink = screen.getByRole('link', {
      name: '2025 Volkswagen Tiguan Lot D-0037',
    })
    expect(within(vehicleLink).getByText('Your bid')).toBeInTheDocument()
    expect(
      within(vehicleLink).getByText('$30,000', { exact: false }),
    ).toBeInTheDocument()
    expect(within(vehicleLink).getByText('9 bids')).toBeInTheDocument()
    expect(within(vehicleLink).getByText('Reserve met')).toBeInTheDocument()
  })
})
