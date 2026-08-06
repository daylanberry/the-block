import {
  createSelector,
  createSlice,
  type PayloadAction,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit'

import {
  applyBid,
  getUserBidEntries,
  getUserBidForVehicle,
  type BidSessionSnapshot,
  type ReserveStatusResolver,
} from '../../domain/bidding'
import type { Bid, Vehicle } from '../../domain/types'

export interface BidSessionState {
  readonly userId: string
  readonly vehicles: readonly Vehicle[]
  readonly bids: readonly Bid[]
}

export interface BidSessionServices {
  createBidId: () => string
  now: () => Date
  resolveReserveStatus: ReserveStatusResolver
}

export interface BidSessionRootState {
  readonly bidSession: BidSessionState
}

interface CreateBidSessionStateOptions {
  userId: string
  vehicles: readonly Vehicle[]
}

export interface PlaceBidInput {
  vehicleId: string
  amount: number
}

export function createBidSessionState({
  userId,
  vehicles,
}: CreateBidSessionStateOptions): BidSessionState {
  return {
    userId,
    vehicles: [...vehicles],
    bids: [],
  }
}

const bidSessionSlice = createSlice({
  name: 'bidSession',
  initialState: createBidSessionState({ userId: '', vehicles: [] }),
  reducers: {
    acceptedBidApplied(
      state,
      action: PayloadAction<BidSessionSnapshot>,
    ) {
      return {
        userId: state.userId,
        vehicles: action.payload.vehicles,
        bids: action.payload.bids,
      }
    },
  },
})

const { acceptedBidApplied } = bidSessionSlice.actions

export const bidSessionReducer = bidSessionSlice.reducer

export function placeBid({
  vehicleId,
  amount,
}: PlaceBidInput): ThunkAction<
  boolean,
  BidSessionRootState,
  BidSessionServices,
  UnknownAction
> {
  return (dispatch, getState, services) => {
    const { bids, userId, vehicles } = getState().bidSession
    const result = applyBid(
      { vehicles, bids },
      {
        id: services.createBidId(),
        vehicleId,
        userId,
        amount,
        placedAt: services.now(),
      },
      services.resolveReserveStatus,
    )

    if (!result.accepted) {
      return false
    }

    dispatch(
      acceptedBidApplied({
        vehicles: result.vehicles,
        bids: result.bids,
      }),
    )

    return true
  }
}

export const selectBidSession = (state: BidSessionRootState) =>
  state.bidSession
export const selectUserId = (state: BidSessionRootState) =>
  selectBidSession(state).userId
export const selectVehicles = (state: BidSessionRootState) =>
  selectBidSession(state).vehicles
export const selectBids = (state: BidSessionRootState) =>
  selectBidSession(state).bids

export function selectUserBidForVehicle(
  state: BidSessionRootState,
  vehicleId: string,
) {
  const { bids, userId } = selectBidSession(state)
  return getUserBidForVehicle(bids, vehicleId, userId)
}

export const selectUserBidEntries = createSelector(
  [selectVehicles, selectBids, selectUserId],
  (vehicles, bids, userId) => getUserBidEntries(vehicles, bids, userId),
)

export const selectUserBidVehicleCount = createSelector(
  [selectUserBidEntries],
  (entries) => entries.length,
)
