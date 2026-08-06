import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { makeVehicle } from '../../test/vehicleFactory'
import { InventoryRoute } from './InventoryRoute'

const referenceTime = new Date(2026, 7, 4, 12)
const userId = 'user-1'

afterEach(() => {
  vi.useRealTimers()
})

function renderInventory(inventory?: Parameters<typeof InventoryRoute>[0]['inventory']) {
  const { hook } = memoryLocation({ path: '/', static: true })

  return render(
    <Router hook={hook}>
      <InventoryRoute
        bids={[]}
        inventory={inventory}
        now={referenceTime}
        userId={userId}
      />
    </Router>,
  )
}

describe('inventory route', () => {
  it('renders all supplied inventory with lazy-loaded card images', () => {
    renderInventory()

    const inventoryList = screen.getByRole('list', {
      name: 'Vehicle inventory',
    })

    expect(within(inventoryList).getAllByRole('listitem')).toHaveLength(200)
    expect(within(inventoryList).getAllByRole('link')).toHaveLength(200)
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(
      screen.queryByRole('button', { name: 'Clear search and filters' }),
    ).not.toBeInTheDocument()
    expect(within(inventoryList).getAllByRole('img')[0]).toHaveAttribute(
      'loading',
      'lazy',
    )
  })

  it('combines lot search and body filtering, then clears both', () => {
    const tiguan = makeVehicle()
    const civic = makeVehicle({
      id: 'vehicle-2',
      vin: '2HGFC2F59MH000001',
      year: 2022,
      make: 'Honda',
      model: 'Civic',
      trim: 'Touring',
      bodyStyle: 'Sedan',
      lot: 'A-0022',
    })

    renderInventory([tiguan, civic])

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search inventory' }), {
      target: { value: 'D0037' },
    })

    expect(
      screen.getByRole('heading', { name: '2025 Volkswagen Tiguan' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '2022 Honda Civic' }),
    ).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sedan' }))

    expect(
      screen.getByRole('heading', { name: 'No matching lots' }),
    ).toBeInTheDocument()
    expect(
      screen.getAllByRole('button', { name: 'Clear search and filters' }),
    ).toHaveLength(1)

    fireEvent.click(
      screen.getByRole('button', { name: 'Clear search and filters' }),
    )

    expect(screen.getByRole('list', { name: 'Vehicle inventory' })).toBeVisible()
    expect(
      screen.getByRole('heading', { name: '2025 Volkswagen Tiguan' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '2022 Honda Civic' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('refreshes auction states while the inventory page remains open', () => {
    vi.useFakeTimers()
    vi.setSystemTime(referenceTime)
    const { hook } = memoryLocation({ path: '/', static: true })
    const vehicle = makeVehicle({
      auctionStart: new Date(referenceTime.getTime() + 30_000),
    })

    render(
      <Router hook={hook}>
        <InventoryRoute bids={[]} inventory={[vehicle]} userId={userId} />
      </Router>,
    )

    expect(screen.getByText('Auction starts')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(screen.getByText('Open for bidding')).toBeInTheDocument()
  })
})
