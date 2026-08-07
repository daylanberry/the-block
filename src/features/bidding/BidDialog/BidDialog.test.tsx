import { act, fireEvent, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useAppSelector } from '../../../app/hooks'
import {
  createAppStore,
  type AppServices,
} from '../../../app/store'
import type { Bid, Vehicle } from '../../../domain/types'
import { makeBid } from '../../../test/bidFactory'
import { renderWithStore } from '../../../test/renderWithStore'
import { makeVehicle } from '../../../test/vehicleFactory'
import {
  placeBid,
  selectBids,
  selectVehicleById,
  selectVehicles,
} from '../bidSessionSlice'
import { BidDialog } from './BidDialog'

const userId = 'user-1'
const placedAt = new Date(2026, 7, 4, 12)

interface RenderConnectedDialogOptions {
  initialBids?: readonly Bid[]
  services?: Partial<AppServices>
  vehicle?: Vehicle
}

function ConnectedBidDialog({ vehicleId }: { vehicleId: string }) {
  const vehicle = useAppSelector((state) =>
    selectVehicleById(state, vehicleId),
  )

  return vehicle ? <BidDialog vehicle={vehicle} /> : null
}

function renderConnectedDialog({
  initialBids = [],
  services = {},
  vehicle = makeVehicle(),
}: RenderConnectedDialogOptions = {}) {
  const store = createAppStore({
    userId,
    initialBids,
    initialVehicles: [vehicle],
    services: {
      createBidId: () => 'bid-2',
      now: () => placedAt,
      resolveReserveStatus: () => 'Reserve not met',
      ...services,
    },
  })
  const view = renderWithStore(
    <ConnectedBidDialog vehicleId={vehicle.id} />,
    store,
  )

  return { ...view, store, vehicle }
}

function renderDialog(options: RenderConnectedDialogOptions = {}) {
  const view = renderConnectedDialog(options)
  const trigger = screen.getByRole('button', { name: 'Place a bid' })

  fireEvent.click(trigger)

  return {
    ...view,
    dialog: screen.getByRole('dialog', { name: 'Place a bid' }),
    trigger,
  }
}

describe('bid dialog', () => {
  it('uses one in-flow and one portaled launcher for one modal', () => {
    const { container, dialog, trigger, vehicle } = renderDialog()
    const dialogId = `bid-dialog-${vehicle.id}`
    const mobileLauncher = document.querySelector(
      '.bid-dialog__mobile-launcher',
    )

    expect(document.querySelectorAll('dialog')).toHaveLength(1)
    expect(document.querySelectorAll(`[aria-controls="${dialogId}"]`)).toHaveLength(
      2,
    )
    expect(within(dialog).getAllByRole('textbox')).toHaveLength(1)
    expect(mobileLauncher).toBeInTheDocument()
    expect(container.contains(mobileLauncher)).toBe(false)
    expect(mobileLauncher?.parentElement).toBe(document.body)
    expect(container.contains(dialog)).toBe(false)
    expect(
      within(dialog).getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(document.documentElement.style.overflow).toBe('hidden')
  })

  it('softens the mobile launcher only while the buyer is scrolling', () => {
    vi.useFakeTimers()
    renderConnectedDialog()

    const mobileLauncher = document.querySelector(
      '.bid-dialog__mobile-launcher',
    )

    expect(mobileLauncher).not.toHaveClass(
      'bid-dialog__mobile-launcher--scrolling',
    )

    fireEvent.scroll(window)

    expect(mobileLauncher).toHaveClass(
      'bid-dialog__mobile-launcher--scrolling',
    )

    act(() => vi.advanceTimersByTime(150))
    fireEvent.scroll(window)

    act(() => vi.advanceTimersByTime(150))
    expect(mobileLauncher).toHaveClass(
      'bid-dialog__mobile-launcher--scrolling',
    )

    act(() => vi.advanceTimersByTime(30))
    expect(mobileLauncher).not.toHaveClass(
      'bid-dialog__mobile-launcher--scrolling',
    )

    vi.useRealTimers()
  })

  it('keeps both launchers active when the current user can raise an unmet-reserve bid', () => {
    const vehicle = makeVehicle({
      bid: {
        currentBid: { amount: 30_000, userId },
        bidCount: 9,
        reserveStatus: 'Reserve not met',
      },
    })
    const { container } = renderConnectedDialog({
      initialBids: [makeBid({ amount: 30_000 })],
      vehicle,
    })

    expect(screen.getByRole('note')).toHaveTextContent(
      'You hold the current bidReserve not met — you can raise your bid',
    )
    expect(
      screen.getByRole('button', { name: 'Raise your bid' }),
    ).toBeInTheDocument()
    expect(
      document.querySelector('.bid-dialog__mobile-launcher'),
    ).toHaveAttribute('aria-label', 'Raise your bid')
    expect(screen.getAllByText('Minimum $30,500 CAD')).toHaveLength(2)

    const trigger = container.querySelector(
      '.bid-dialog__rail-launcher',
    ) as HTMLButtonElement
    fireEvent.click(trigger)

    expect(
      screen.getByRole('dialog', { name: 'Raise your bid' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveAttribute('placeholder', '30,500')
  })

  it('keeps a neutral prior bid raiseable while reserve remains unmet', () => {
    renderConnectedDialog({
      initialBids: [makeBid({ userId, amount: 30_000 })],
      vehicle: makeVehicle({
        bid: {
          currentBid: { amount: 30_500, userId: 'user-2' },
          bidCount: 10,
          reserveStatus: 'Reserve not met',
        },
      }),
    })

    expect(screen.getByRole('note')).toHaveTextContent('Bid recorded')
    expect(screen.getByRole('note')).toHaveTextContent(
      'Reserve not met — you can place a higher bid',
    )
    expect(
      screen.getByRole('button', { name: 'Raise your bid' }),
    ).toBeInTheDocument()
    expect(
      document.querySelector('.bid-dialog__mobile-launcher'),
    ).toHaveAttribute('aria-label', 'Raise your bid')
    expect(screen.getAllByText('Minimum $31,000 CAD')).toHaveLength(2)
  })

  it.each(['Reserve met', 'No reserve'] as const)(
    'locks both launchers once the buyer holds a %s bid',
    (reserveStatus) => {
      renderConnectedDialog({
        initialBids: [makeBid({ amount: 30_000 })],
        vehicle: makeVehicle({
          bid: {
            currentBid: { amount: 30_000, userId },
            bidCount: 9,
            reserveStatus,
          },
        }),
      })

      expect(screen.getByRole('note')).toHaveTextContent(
        'You hold the current bidNo action needed',
      )
      expect(
        screen.queryByRole('button', { name: 'Raise your bid' }),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByRole('button', { name: 'Place a bid' }),
      ).not.toBeInTheDocument()
      expect(
        document.querySelector('.bid-dialog__mobile-launcher'),
      ).not.toBeInTheDocument()
    },
  )

  it.each(['Reserve met', 'No reserve'] as const)(
    'keeps a locked prior bid neutral when the current owner is different: %s',
    (reserveStatus) => {
      renderConnectedDialog({
        initialBids: [makeBid({ userId, amount: 30_000 })],
        vehicle: makeVehicle({
          bid: {
            currentBid: { amount: 30_500, userId: 'user-2' },
            bidCount: 10,
            reserveStatus,
          },
        }),
      })

      expect(screen.getByRole('note')).toHaveTextContent(
        `Bid recorded${reserveStatus} — further bidding unavailable`,
      )
      expect(screen.getByRole('note')).not.toHaveTextContent(
        'No action needed',
      )
      expect(
        screen.queryByRole('button', { name: 'Raise your bid' }),
      ).not.toBeInTheDocument()
    },
  )

  it.each([
    ['', 'Enter a bid amount.'],
    ['not a number', 'Enter a valid bid amount.'],
    ['30000.50', 'Enter a whole-dollar bid amount.'],
    ['29,999', 'Bid must be at least $30,000 CAD.'],
  ])('keeps %j in entry with an associated error', (amount, message) => {
    const { dialog } = renderDialog()
    const input = within(dialog).getByRole('textbox', {
      name: 'Your bid (CAD)',
    })

    if (amount !== '') {
      fireEvent.change(input, { target: { value: amount } })
    }
    fireEvent.click(within(dialog).getByRole('button', { name: 'Review bid' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent(message)
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveFocus()
  })

  it('reviews without mutating and lets the buyer edit the same amount', () => {
    const { store } = renderDialog()
    const initialState = store.getState()
    const input = screen.getByRole('textbox', { name: 'Your bid (CAD)' })

    fireEvent.change(input, { target: { value: '30,000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))

    expect(
      screen.getByRole('heading', { name: 'Review your bid' }),
    ).toHaveFocus()
    expect(screen.getByText('$30,000')).toBeInTheDocument()
    expect(store.getState()).toBe(initialState)
    expect(selectBids(store.getState())).toEqual([])

    fireEvent.click(screen.getByRole('button', { name: 'Edit bid' }))

    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveValue('30,000')
    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveFocus()
  })

  it('cancels without bidding, unlocks scrolling, and restores trigger focus', () => {
    const { store, trigger } = renderDialog()
    const initialState = store.getState()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(store.getState()).toBe(initialState)
    expect(selectBids(store.getState())).toEqual([])
    expect(document.documentElement.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('handles the Escape cancellation path', () => {
    const { dialog, trigger } = renderDialog()

    fireEvent.keyDown(dialog, { key: 'Escape' })

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.documentElement.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
  })

  it('handles the native dialog cancellation event', () => {
    const { dialog, trigger } = renderDialog()

    fireEvent(dialog, new Event('cancel', { cancelable: true }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.documentElement.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
  })

  it('dismisses from the backdrop without treating dialog content as a dismissal', () => {
    const { dialog, store, trigger } = renderDialog()
    const initialState = store.getState()

    fireEvent.click(within(dialog).getByRole('heading', { name: 'Place a bid' }))

    expect(dialog).toBeInTheDocument()

    fireEvent.click(dialog)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(store.getState()).toBe(initialState)
    expect(selectBids(store.getState())).toEqual([])
    expect(document.documentElement.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
  })

  it('commits the reviewed amount and keeps success open until Done', () => {
    const { store, trigger } = renderDialog()

    fireEvent.change(screen.getByRole('textbox', { name: 'Your bid (CAD)' }), {
      target: { value: '30,000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Place $30,000 bid' }),
    )

    expect(selectBids(store.getState())).toEqual([
      expect.objectContaining({
        id: 'bid-2',
        vehicleId: 'vehicle-1',
        userId,
        amount: 30_000,
        placedAt: placedAt.toISOString(),
      }),
    ])
    expect(selectVehicles(store.getState())[0].bid).toEqual({
      currentBid: { amount: 30_000, userId },
      bidCount: 9,
      reserveStatus: 'Reserve not met',
    })
    expect(screen.getByRole('heading', { name: 'Bid placed' })).toHaveFocus()
    expect(
      screen.getByText('You hold the current bid at', { exact: false }),
    ).toHaveTextContent('You hold the current bid at $30,000 CAD.')

    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it.each([
    ['Reserve not met', 'launcher'],
    ['Reserve met', 'ownership'],
  ] as const)(
    'restores focus to the %s destination after a successful raise',
    (reserveStatus, focusDestination) => {
      const initialVehicle = makeVehicle({
        bid: {
          currentBid: { amount: 30_000, userId },
          bidCount: 9,
          reserveStatus: 'Reserve not met',
        },
      })
      const initialUserBid = makeBid({ amount: 30_000 })
      const { container, store } = renderConnectedDialog({
        initialBids: [initialUserBid],
        services: { resolveReserveStatus: () => reserveStatus },
        vehicle: initialVehicle,
      })
      const trigger = container.querySelector(
        '.bid-dialog__rail-launcher',
      ) as HTMLButtonElement

      fireEvent.click(trigger)
      fireEvent.change(
        screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
        { target: { value: '30,500' } },
      )
      fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))
      fireEvent.click(
        screen.getByRole('button', { name: 'Place $30,500 bid' }),
      )

      expect(selectBids(store.getState())).toEqual([
        expect.objectContaining({ id: 'bid-2', amount: 30_500 }),
      ])
      expect(selectVehicles(store.getState())[0].bid).toEqual({
        currentBid: { amount: 30_500, userId },
        bidCount: 10,
        reserveStatus,
      })
      fireEvent.click(screen.getByRole('button', { name: 'Done' }))

      if (focusDestination === 'launcher') {
        expect(trigger).toHaveFocus()
        expect(
          screen.getByRole('button', { name: 'Raise your bid' }),
        ).toBeInTheDocument()
        expect(
          document.querySelector('.bid-dialog__mobile-launcher'),
        ).toHaveAttribute('aria-label', 'Raise your bid')
      } else {
        expect(screen.getByRole('note')).toHaveFocus()
        expect(
          screen.queryByRole('button', { name: 'Raise your bid' }),
        ).not.toBeInTheDocument()
      }
    },
  )

  it('returns focus to the mobile raise launcher when it survives success', () => {
    const initialVehicle = makeVehicle({
      bid: {
        currentBid: { amount: 30_000, userId },
        bidCount: 9,
        reserveStatus: 'Reserve not met',
      },
    })
    const { store } = renderConnectedDialog({
      initialBids: [makeBid({ amount: 30_000 })],
      vehicle: initialVehicle,
    })
    const mobileTrigger = document.querySelector(
      '.bid-dialog__mobile-launcher',
    ) as HTMLButtonElement

    fireEvent.click(mobileTrigger)
    fireEvent.change(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
      { target: { value: '30,500' } },
    )
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Place $30,500 bid' }),
    )

    expect(selectBids(store.getState())).toEqual([
      expect.objectContaining({ id: 'bid-2', amount: 30_500 }),
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(mobileTrigger).toHaveFocus()
    expect(mobileTrigger).toHaveAttribute('aria-label', 'Raise your bid')
  })

  it('returns to entry when the reviewed amount becomes stale', () => {
    const vehicle = makeVehicle()
    const { store } = renderDialog({ vehicle })

    fireEvent.change(screen.getByRole('textbox', { name: 'Your bid (CAD)' }), {
      target: { value: '30,000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))

    act(() => {
      expect(
        store.dispatch(
          placeBid({ vehicleId: vehicle.id, amount: 30_000 }),
        ),
      ).toBe(true)
    })
    const updatedState = store.getState()
    fireEvent.click(
      screen.getByRole('button', { name: 'Place $30,000 bid' }),
    )

    expect(store.getState()).toBe(updatedState)
    expect(selectBids(store.getState())).toEqual([
      expect.objectContaining({ amount: 30_000 }),
    ])
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Bid must be at least $30,500 CAD.',
    )
    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveFocus()
  })

  it('returns to entry when the shared auction state rejects the bid', () => {
    const duplicateBid = makeBid({
      id: 'duplicate-bid',
      userId: 'user-2',
      vehicleId: 'vehicle-2',
    })
    const { store } = renderDialog({
      initialBids: [duplicateBid],
      services: { createBidId: () => duplicateBid.id },
    })
    const initialState = store.getState()

    fireEvent.change(screen.getByRole('textbox', { name: 'Your bid (CAD)' }), {
      target: { value: '30,000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Place $30,000 bid' }),
    )

    expect(store.getState()).toBe(initialState)
    expect(selectBids(store.getState())).toEqual([duplicateBid])
    expect(
      screen.queryByRole('heading', { name: 'Bid placed' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Bid could not be placed. Review the latest auction details and try again.',
    )
    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveValue('30000')
    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveFocus()
  })

  it('restores root scrolling when removed while open', () => {
    const { unmount } = renderDialog()

    unmount()

    expect(document.documentElement.style.overflow).toBe('')
  })
})
