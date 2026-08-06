import { describe, expect, it } from 'vitest'

import rawVehicleData from '../../data/vehicles.json'
import { loadVehicleCatalog, normalizeAuctionSchedule } from './vehicles'

const demoDate = new Date(2026, 7, 4, 12)

describe('vehicle data loading', () => {
  it('validates and normalizes all supplied vehicles', () => {
    const loadedVehicles = loadVehicleCatalog(rawVehicleData, demoDate).vehicles
    const demoVehicle = loadedVehicles.find(
      (vehicle) => vehicle.lot === 'D-0037',
    )

    expect(loadedVehicles).toHaveLength(200)
    expect(demoVehicle).toMatchObject({
      bodyStyle: 'SUV',
      transmission: 'Automatic',
      fuelType: 'Gasoline',
      titleStatus: 'Clean',
      bid: {
        currentBid: { amount: 29_500, userId: null },
        reserveStatus: 'Reserve not met',
      },
    })
    expect(demoVehicle?.auctionStart.getFullYear()).toBe(2026)
    expect(demoVehicle?.auctionStart.getMonth()).toBe(7)
    expect(demoVehicle?.auctionStart.getDate()).toBe(3)
    expect(demoVehicle?.auctionStart.getHours()).toBe(16)
  })

  it('keeps reserve amounts behind the three allowed status labels', () => {
    const catalog = loadVehicleCatalog(rawVehicleData, demoDate)
    const reserveCounts = catalog.vehicles.reduce(
      (counts, vehicle) => {
        counts[vehicle.bid.reserveStatus] += 1
        return counts
      },
      {
        'No reserve': 0,
        'Reserve not met': 0,
        'Reserve met': 0,
      },
    )

    expect(reserveCounts).toEqual({
      'No reserve': 60,
      'Reserve not met': 136,
      'Reserve met': 4,
    })

    const demoVehicle = catalog.vehicles.find(
      (vehicle) => vehicle.lot === 'D-0037',
    )

    expect(demoVehicle).not.toHaveProperty('reservePrice')
    expect(
      catalog.getReserveStatus(demoVehicle?.id ?? '', 35_000),
    ).toBe('Reserve met')
  })

  it('rejects malformed source records with a useful path', () => {
    expect(() =>
      loadVehicleCatalog(
        [{ ...rawVehicleData[0], vin: 'not-a-vin' }],
        demoDate,
      ),
    ).toThrow('vehicles[0].vin')
  })

  it('rejects duplicate identifiers', () => {
    expect(() =>
      loadVehicleCatalog(
        [rawVehicleData[0], { ...rawVehicleData[1], id: rawVehicleData[0].id }],
        demoDate,
      ),
    ).toThrow('vehicles[1].id must be unique')
  })

  it('allows multiple vehicles to share a lot', () => {
    const catalog = loadVehicleCatalog(
      [
        rawVehicleData[0],
        { ...rawVehicleData[1], lot: rawVehicleData[0].lot },
      ],
      demoDate,
    )

    expect(catalog.vehicles).toHaveLength(2)
    expect(catalog.vehicles.map((vehicle) => vehicle.id)).toEqual([
      rawVehicleData[0].id,
      rawVehicleData[1].id,
    ])
  })

  it('drops null image entries while preserving usable photos', () => {
    const validImage = rawVehicleData[0].images[0]
    const catalog = loadVehicleCatalog(
      [
        {
          ...rawVehicleData[0],
          images: [null, validImage, null],
        },
      ],
      demoDate,
    )

    expect(catalog.vehicles[0].images).toEqual([validImage])
  })

  it.each([null, [null]])(
    'normalizes unusable image data %j to an empty gallery',
    (images) => {
      const catalog = loadVehicleCatalog(
        [{ ...rawVehicleData[0], images }],
        demoDate,
      )

      expect(catalog.vehicles[0].images).toEqual([])
    },
  )

  it('still rejects non-null image values that are not strings', () => {
    expect(() =>
      loadVehicleCatalog(
        [{ ...rawVehicleData[0], images: [rawVehicleData[0].images[0], 42] }],
        demoDate,
      ),
    ).toThrow('vehicles[0].images[1]')
  })

  it('accepts a first bid equal to the starting bid', () => {
    const sourceVehicle = rawVehicleData[0]
    const catalog = loadVehicleCatalog(
      [
        {
          ...sourceVehicle,
          current_bid: sourceVehicle.starting_bid,
          bid_count: 1,
        },
      ],
      demoDate,
    )

    expect(catalog.vehicles[0].bid.currentBid).toEqual({
      amount: sourceVehicle.starting_bid,
      userId: null,
    })
  })
})

describe('auction schedule normalization', () => {
  it('preserves the seven-day cadence and places the final day tomorrow', () => {
    const [firstStart, finalStart] = normalizeAuctionSchedule(
      ['2026-03-31T09:00:00', '2026-04-06T20:00:00'],
      demoDate,
    )

    expect([
      firstStart.getFullYear(),
      firstStart.getMonth(),
      firstStart.getDate(),
      firstStart.getHours(),
    ]).toEqual([2026, 6, 30, 9])
    expect([
      finalStart.getFullYear(),
      finalStart.getMonth(),
      finalStart.getDate(),
      finalStart.getHours(),
    ]).toEqual([2026, 7, 5, 20])
  })

  it('rejects invalid calendar dates rather than allowing rollover', () => {
    expect(() =>
      normalizeAuctionSchedule(['2026-02-30T12:00:00'], demoDate),
    ).toThrow('must be a real local date and time')
  })
})
