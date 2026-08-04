export const BODY_STYLES = [
  'SUV',
  'Sedan',
  'Truck',
  'Hatchback',
  'Coupe',
] as const

export type BodyStyle = (typeof BODY_STYLES)[number]
export type BodyStyleFilter = 'All' | BodyStyle

export type Transmission = 'Automatic' | 'Manual' | 'CVT' | 'Single-speed'
export type Drivetrain = '4WD' | 'AWD' | 'FWD' | 'RWD'
export type FuelType = 'Diesel' | 'Electric' | 'Gasoline' | 'Hybrid'
export type TitleStatus = 'Clean' | 'Rebuilt' | 'Salvage'
export type ReserveStatus = 'No reserve' | 'Reserve not met' | 'Reserve met'
export type AuctionStatus = 'Open' | 'Scheduled'

export interface BidState {
  currentBid: number | null
  bidCount: number
  yourBid: number | null
  reserveStatus: ReserveStatus
}

export interface Vehicle {
  id: string
  vin: string
  year: number
  make: string
  model: string
  trim: string
  bodyStyle: BodyStyle
  exteriorColor: string
  interiorColor: string
  engine: string
  transmission: Transmission
  drivetrain: Drivetrain
  odometerKm: number
  fuelType: FuelType
  conditionGrade: number
  conditionReport: string
  damageNotes: readonly string[]
  titleStatus: TitleStatus
  province: string
  city: string
  auctionStart: Date
  startingBid: number
  images: readonly string[]
  sellingDealership: string
  lot: string
  bid: BidState
}

export interface VehicleCatalog {
  vehicles: readonly Vehicle[]
  getReserveStatus: (
    vehicleId: string,
    currentBid: number | null,
  ) => ReserveStatus
}

export interface BidTerms {
  startingBid: number
  currentBid: number | null
}

export type BidValidationError =
  | 'required'
  | 'not-a-number'
  | 'whole-dollars-only'
  | 'below-minimum'

export type BidValidationResult =
  | { isValid: true; amount: number }
  | { isValid: false; error: BidValidationError; message: string }
