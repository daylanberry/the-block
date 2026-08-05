import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { makeVehicle } from '../../../test/vehicleFactory'
import { BidDialog } from './BidDialog'

function renderDialog(
  onPlaceBid = vi.fn(() => true),
  vehicle = makeVehicle(),
) {
  const view = render(
    <BidDialog vehicle={vehicle} onPlaceBid={onPlaceBid} />,
  )
  const trigger = screen.getByRole('button', { name: 'Place a bid' })

  fireEvent.click(trigger)

  return {
    ...view,
    dialog: screen.getByRole('dialog', { name: 'Place a bid' }),
    onPlaceBid,
    trigger,
    vehicle,
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
    render(<BidDialog vehicle={makeVehicle()} onPlaceBid={vi.fn()} />)

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
    const { onPlaceBid } = renderDialog()
    const input = screen.getByRole('textbox', { name: 'Your bid (CAD)' })

    fireEvent.change(input, { target: { value: '30,000' } })
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))

    expect(
      screen.getByRole('heading', { name: 'Review your bid' }),
    ).toHaveFocus()
    expect(screen.getByText('$30,000')).toBeInTheDocument()
    expect(onPlaceBid).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Edit bid' }))

    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveValue('30,000')
    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveFocus()
  })

  it('cancels without bidding, unlocks scrolling, and restores trigger focus', () => {
    const { onPlaceBid, trigger } = renderDialog()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onPlaceBid).not.toHaveBeenCalled()
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
    const { dialog, onPlaceBid, trigger } = renderDialog()

    fireEvent.click(within(dialog).getByRole('heading', { name: 'Place a bid' }))

    expect(dialog).toBeInTheDocument()

    fireEvent.click(dialog)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(onPlaceBid).not.toHaveBeenCalled()
    expect(document.documentElement.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
  })

  it('commits the reviewed amount and keeps success open until Done', () => {
    const { onPlaceBid, trigger } = renderDialog()

    fireEvent.change(screen.getByRole('textbox', { name: 'Your bid (CAD)' }), {
      target: { value: '30,000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Place $30,000 bid' }),
    )

    expect(onPlaceBid).toHaveBeenCalledOnce()
    expect(onPlaceBid).toHaveBeenCalledWith(30_000)
    expect(screen.getByRole('heading', { name: 'Bid placed' })).toHaveFocus()
    expect(
      screen.getByText('You hold the current bid at', { exact: false }),
    ).toHaveTextContent('You hold the current bid at $30,000 CAD.')

    fireEvent.click(screen.getByRole('button', { name: 'Done' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
    expect(document.documentElement.style.overflow).toBe('')
  })

  it('returns to entry when the reviewed amount becomes stale', () => {
    const onPlaceBid = vi.fn(() => true)
    const vehicle = makeVehicle()
    const { rerender } = renderDialog(onPlaceBid, vehicle)

    fireEvent.change(screen.getByRole('textbox', { name: 'Your bid (CAD)' }), {
      target: { value: '30,000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))

    rerender(
      <BidDialog
        vehicle={makeVehicle({
          bid: { currentBid: 30_000, bidCount: 9 },
        })}
        onPlaceBid={onPlaceBid}
      />,
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Place $30,000 bid' }),
    )

    expect(onPlaceBid).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Bid must be at least $30,500 CAD.',
    )
    expect(
      screen.getByRole('textbox', { name: 'Your bid (CAD)' }),
    ).toHaveFocus()
  })

  it('returns to entry when the shared auction state rejects the bid', () => {
    const onPlaceBid = vi.fn(() => false)

    renderDialog(onPlaceBid)

    fireEvent.change(screen.getByRole('textbox', { name: 'Your bid (CAD)' }), {
      target: { value: '30,000' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Review bid' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Place $30,000 bid' }),
    )

    expect(onPlaceBid).toHaveBeenCalledWith(30_000)
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
