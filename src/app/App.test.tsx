import { render, screen } from '@testing-library/react'
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
    renderRoute('/vehicles/D-0037')

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /lot d-0037/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /back to inventory/i }),
    ).toHaveAttribute('href', '/')
  })
})
