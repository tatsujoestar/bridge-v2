import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '../../store/rootReducer'
import { BridgeCurrency } from '../../utils/assetConfigs'
import { $exchangeRates } from '../marketData/marketDataSlice'
import { findExchangeRate } from '../marketData/marketDataUtils'

type ReleaseState = {
  currency: BridgeCurrency;
  amount: number;
  address: string;
}

const initialState: ReleaseState = {
  currency: BridgeCurrency.WSPD,
  amount: 0, //
  address: '', // mzseycKNBVKFW1PjzisnPER226bJsGfnUh
}

const slice = createSlice({
  name: 'release',
  initialState,
  reducers: {
    setReleaseCurrency(state, action: PayloadAction<BridgeCurrency>) {
      state.currency = action.payload
    },
    setReleaseAmount(state, action: PayloadAction<number>) {
      state.amount = action.payload
    },
    setReleaseAddress(state, action: PayloadAction<string>) {
      state.address = action.payload
    },
    resetRelease(state, action: PayloadAction<ReleaseState | undefined>) {
      if (action.payload) {
        state.currency = action.payload.currency
        state.amount = action.payload.amount
        state.address = action.payload.address
      } else {
        state.amount = initialState.amount
        state.address = initialState.address
      }
    },
  },
})

export const {
  setReleaseCurrency,
  setReleaseAmount,
  setReleaseAddress,
  resetRelease,
} = slice.actions

export const releaseReducer = slice.reducer

export const $release = (state: RootState) => state.release
export const $releaseCurrency = createSelector(
  $release,
  (release) => release.currency
)
export const $releaseAmount = createSelector(
  $release,
  (release) => release.amount
)
export const $releaseCurrencyUsdRate = createSelector(
  $releaseCurrency,
  $exchangeRates,
  (currencySymbol, rates) => findExchangeRate(rates, currencySymbol, 'USD')
)
export const $releaseUsdAmount = createSelector(
  $releaseAmount,
  $releaseCurrencyUsdRate,
  (amount, rate) => amount * rate
)
