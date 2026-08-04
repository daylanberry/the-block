import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { VehicleGallery } from './VehicleGallery'

const defaultProps = {
  vehicleId: 'vehicle-1',
  vehicleName: '2025 Volkswagen Tiguan SE R-Line',
  lot: 'D-0037',
  images: [
    'https://example.com/photo-1.jpg',
    'https://example.com/photo-2.jpg',
    'https://example.com/photo-3.jpg',
  ],
}

describe('vehicle gallery', () => {
  it('lets the buyer select a supplied photo', () => {
    render(<VehicleGallery {...defaultProps} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'View photo 2 of 3' }),
    )

    expect(
      screen.getByRole('img', {
        name: '2025 Volkswagen Tiguan SE R-Line, photo 2 of 3',
      }),
    ).toHaveAttribute('src', 'https://example.com/photo-2.jpg')
    expect(
      screen.getByRole('button', { name: 'View photo 2 of 3' }),
    ).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps working photos available when one image fails', () => {
    render(<VehicleGallery {...defaultProps} />)

    fireEvent.error(
      screen.getByRole('img', {
        name: '2025 Volkswagen Tiguan SE R-Line, photo 1 of 3',
      }),
    )

    expect(
      screen.getByRole('img', {
        name: 'Photo unavailable for 2025 Volkswagen Tiguan SE R-Line, lot D-0037',
      }),
    ).toBeInTheDocument()

    fireEvent.click(
      screen.getByRole('button', { name: 'View photo 2 of 3' }),
    )

    expect(
      screen.getByRole('img', {
        name: '2025 Volkswagen Tiguan SE R-Line, photo 2 of 3',
      }),
    ).toBeInTheDocument()
  })

  it('resets to the first photo when the route changes vehicles', () => {
    const { rerender } = render(<VehicleGallery {...defaultProps} />)

    fireEvent.click(
      screen.getByRole('button', { name: 'View photo 3 of 3' }),
    )

    rerender(
      <VehicleGallery
        {...defaultProps}
        vehicleId="vehicle-2"
        vehicleName="2022 Honda Civic Touring"
        lot="A-0022"
        images={[
          'https://example.com/civic-1.jpg',
          'https://example.com/civic-2.jpg',
        ]}
      />,
    )

    expect(
      screen.getByRole('img', {
        name: '2022 Honda Civic Touring, photo 1 of 2',
      }),
    ).toHaveAttribute('src', 'https://example.com/civic-1.jpg')
  })

  it('renders a stable fallback when no photography is available', () => {
    render(<VehicleGallery {...defaultProps} images={[]} />)

    expect(
      screen.getByRole('img', {
        name: 'Photo unavailable for 2025 Volkswagen Tiguan SE R-Line, lot D-0037',
      }),
    ).toBeInTheDocument()
    expect(screen.getByText('No supplied photography')).toBeInTheDocument()
  })
})
