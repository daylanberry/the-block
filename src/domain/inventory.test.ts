import { describe, expect, it } from 'vitest'

import type { Vehicle } from './types'
import {
  findVehicleById,
  filterVehicles,
  matchesVehicleSearch,
  sortOpenVehiclesFirst,
} from './inventory'

function makeVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
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
    bid: {
      currentBid: 29_500,
      bidCount: 8,
      yourBid: null,
      reserveStatus: 'Reserve not met',
    },
    ...overrides,
  }
}

describe('inventory search and filtering', () => {
  const tiguan = makeVehicle()
  const sedan = makeVehicle({
    id: 'vehicle-2',
    vin: '2HGFC2F59MH000001',
    year: 2022,
    make: 'Honda',
    model: 'Civic',
    trim: 'Touring',
    bodyStyle: 'Sedan',
    sellingDealership: 'Capital City Auto',
    lot: 'A-0022',
  })

  it.each([
    '2025 Volkswagen Tiguan',
    'SEL R-Line',
    '1HGCM82633A004352',
    'D0037',
    'Grand Touring Motors',
  ])('matches the required searchable fields for %j', (query) => {
    expect(matchesVehicleSearch(tiguan, query)).toBe(true)
  })

  it('combines search and body-style filtering', () => {
    expect(
      filterVehicles([tiguan, sedan], {
        query: 'Civic',
        bodyStyle: 'Sedan',
      }),
    ).toEqual([sedan])

    expect(
      filterVehicles([tiguan, sedan], {
        query: 'Civic',
        bodyStyle: 'SUV',
      }),
    ).toEqual([])
  })

  it('treats an empty search and All filter as unfiltered inventory', () => {
    expect(
      filterVehicles([tiguan, sedan], { query: '  ', bodyStyle: 'All' }),
    ).toEqual([tiguan, sedan])
  })

  it('resolves route vehicles by id even when multiple vehicles share a lot', () => {
    const secondVehicleInLot = makeVehicle({
      id: 'vehicle-3',
      model: 'Atlas',
      lot: tiguan.lot,
    })

    expect(findVehicleById([tiguan, secondVehicleInLot], 'vehicle-3')).toBe(
      secondVehicleInLot,
    )
    expect(findVehicleById([tiguan, sedan], 'missing')).toBeUndefined()
  })
})

describe('inventory ordering', () => {
  it('moves open auctions first without mutating the source array', () => {
    const now = new Date(2026, 7, 4, 12)
    const scheduled = makeVehicle({
      id: 'scheduled',
      auctionStart: new Date(2026, 7, 5, 9),
    })
    const open = makeVehicle({
      id: 'open',
      auctionStart: new Date(2026, 7, 3, 9),
    })
    const source = [scheduled, open]

    expect(sortOpenVehiclesFirst(source, now).map((vehicle) => vehicle.id)).toEqual(
      ['open', 'scheduled'],
    )
    expect(source.map((vehicle) => vehicle.id)).toEqual(['scheduled', 'open'])
  })
})
