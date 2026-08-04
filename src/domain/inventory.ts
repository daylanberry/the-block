import { getAuctionStatus } from './auction'
import { BODY_STYLES } from './types'
import type { BodyStyleFilter, Vehicle } from './types'

export const BODY_STYLE_FILTERS = [
  'All',
  ...BODY_STYLES,
] as const satisfies readonly BodyStyleFilter[]

export interface InventoryFilters {
  query: string
  bodyStyle: BodyStyleFilter
}

function normalizeSearchText(value: string | number) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en-CA')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function getSearchHaystack(vehicle: Vehicle) {
  return normalizeSearchText(
    [
      vehicle.year,
      vehicle.make,
      vehicle.model,
      vehicle.trim,
      vehicle.vin,
      vehicle.lot,
      vehicle.sellingDealership,
    ].join(' '),
  )
}

export function matchesVehicleSearch(vehicle: Vehicle, query: string) {
  const normalizedQuery = normalizeSearchText(query)

  if (normalizedQuery === '') {
    return true
  }

  const haystack = getSearchHaystack(vehicle)
  const compactHaystack = haystack.replaceAll(' ', '')

  return normalizedQuery.split(' ').every((term) => {
    return haystack.includes(term) || compactHaystack.includes(term)
  })
}

export function filterVehicles(
  vehicles: readonly Vehicle[],
  { query, bodyStyle }: InventoryFilters,
) {
  return vehicles.filter((vehicle) => {
    const matchesBodyStyle =
      bodyStyle === 'All' || vehicle.bodyStyle === bodyStyle

    return matchesBodyStyle && matchesVehicleSearch(vehicle, query)
  })
}

export function sortOpenVehiclesFirst(
  vehicles: readonly Vehicle[],
  now = new Date(),
) {
  return [...vehicles].sort((left, right) => {
    const leftIsOpen = getAuctionStatus(left.auctionStart, now) === 'Open'
    const rightIsOpen = getAuctionStatus(right.auctionStart, now) === 'Open'

    return Number(rightIsOpen) - Number(leftIsOpen)
  })
}
