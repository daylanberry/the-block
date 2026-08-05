import { act, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { App } from './App'

function renderRoute(path: string) {
  const { hook } = memoryLocation({ path, static: true })

  return render(
    <Router hook={hook}>
      <App />
    </Router>,
  )
}

describe('application routing', () => {
  it('renders the buyer inventory shell', () => {
    renderRoute('/')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /wholesale inventory/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: /primary/i }),
    ).toBeInTheDocument()
  })

  it('supports a direct vehicle detail route', () => {
    renderRoute('/vehicles/25090c56-ea41-4067-904d-d0da6854f69e')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: '2025 Volkswagen Tiguan',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /back to inventory/i }),
    ).toHaveAttribute('href', '/')
  })

  it('moves focus to the route heading after client-side navigation', () => {
    const { hook, navigate } = memoryLocation({ path: '/' })

    render(
      <Router hook={hook}>
        <App />
      </Router>,
    )

    const main = screen.getByRole('main')
    expect(main).toHaveAttribute('tabindex', '-1')

    act(() => {
      navigate('/vehicles/25090c56-ea41-4067-904d-d0da6854f69e')
    })

    const routeHeading = screen.getByRole('heading', {
      level: 1,
      name: '2025 Volkswagen Tiguan',
    })

    expect(routeHeading).toHaveAttribute('tabindex', '-1')
    expect(routeHeading).toHaveFocus()
  })

  it('renders a vehicle-specific recovery state for an unknown id', () => {
    renderRoute('/vehicles/missing-vehicle')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Vehicle was not found.',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /return to inventory/i }),
    ).toHaveAttribute('href', '/')
  })
})
