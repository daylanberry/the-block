import {
  configureStore,
  isPlain,
  type SerializableStateInvariantMiddlewareOptions,
  type ThunkAction,
  type UnknownAction,
} from '@reduxjs/toolkit'

import type { Vehicle } from '../domain/types'
import {
  getVehicleReserveStatus,
  vehicles as catalogVehicles,
} from '../domain/vehicles'
import {
  bidSessionReducer,
  createBidSessionState,
  type BidSessionServices,
} from '../features/bidding/bidSessionSlice'

export type AppServices = BidSessionServices

export interface CreateAppStoreOptions {
  userId?: string
  initialVehicles?: readonly Vehicle[]
  services?: Partial<AppServices>
}

interface AppMiddlewareOptions {
  thunk: { extraArgument: AppServices }
  serializableCheck: SerializableStateInvariantMiddlewareOptions
}

function createAnonymousUserId() {
  return crypto.randomUUID()
}

function createPrototypeBidId() {
  return crypto.randomUUID()
}

export function createAppStore(options: CreateAppStoreOptions = {}) {
  const services: AppServices = {
    createBidId: options.services?.createBidId ?? createPrototypeBidId,
    now: options.services?.now ?? (() => new Date()),
    resolveReserveStatus:
      options.services?.resolveReserveStatus ?? getVehicleReserveStatus,
  }

  return configureStore({
    reducer: {
      bidSession: bidSessionReducer,
    },
    preloadedState: {
      bidSession: createBidSessionState({
        userId: options.userId ?? createAnonymousUserId(),
        vehicles: options.initialVehicles ?? catalogVehicles,
      }),
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware<AppMiddlewareOptions>({
        thunk: { extraArgument: services },
        serializableCheck: {
          isSerializable: (value: unknown) =>
            value instanceof Date || isPlain(value),
        },
      }),
  })
}

export type AppStore = ReturnType<typeof createAppStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  AppServices,
  UnknownAction
>
