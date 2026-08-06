import type { BidState, Vehicle } from '../domain/types'

type VehicleOverrides = Omit<Partial<Vehicle>, 'bid'> & {
  bid?: Partial<BidState>
}

export function makeVehicle(overrides: VehicleOverrides = {}): Vehicle {
  const { bid, ...vehicleOverrides } = overrides

  return {
    id: 'vehicle-1',
    vin: '1HGCM82633A004352',
    year: 2025,
    make: 'Volkswagen',
    model: 'Tiguan',
    trim: 'SEL R-Line',
    bodyStyle: 'SUV',
    exteriorColor: 'Blue',
    interiorColor: 'Black',
    engine: '2.0L Turbo I4',
    transmission: 'Automatic',
    drivetrain: 'AWD',
    odometerKm: 24_534,
    fuelType: 'Gasoline',
    conditionGrade: 4.6,
    conditionReport: 'Very clean vehicle.',
    damageNotes: [],
    titleStatus: 'Clean',
    province: 'Ontario',
    city: 'Toronto',
    auctionStart: new Date(2026, 7, 3, 16),
    startingBid: 22_000,
    images: ['https://placehold.co/800x600'],
    sellingDealership: 'Grand Touring Motors',
    lot: 'D-0037',
    ...vehicleOverrides,
    bid: {
      currentBid: { amount: 29_500, userId: null },
      bidCount: 8,
      reserveStatus: 'Reserve not met',
      ...bid,
    },
  }
}
