// A mapping of how to construct parameters for host chains,
// based on the destination network
import {
  Bitcoin,
} from '@renproject/chains-bitcoin'
import {
  BinanceSmartChain,

} from '@renproject/chains-ethereum'
import { RenNetwork } from '@renproject/interfaces'
import { BurnMachineContext, GatewayMachineContext } from '@renproject/ren-tx'
import { mapFees } from '../features/fees/feesUtils'
import { getReleaseAssetDecimals } from '../features/transactions/transactionsUtils'
import {
  BridgeCurrency,
  getChainConfig,
  getChainConfigByRentxName,
  getCurrencyConfig,
  RenChain,
  toReleasedCurrency,
} from '../utils/assetConfigs'
import { getRenJs } from './renJs'

export const lockChainMap = {
  [RenChain.stipend]: () => Bitcoin(),
}

export const getMintChainMap = (providers: any) => ({
  [RenChain.binanceSmartChain]: (context: GatewayMachineContext<any>) => {
    const { destAddress, network } = context.tx

    return new BinanceSmartChain(providers.binanceSmartChain, network).Account({
      address: destAddress,
    }) as any
  },
})

export const mintChainClassMap = {
  [RenChain.binanceSmartChain]: BinanceSmartChain,
}

const buildBurner = (
  chain: keyof typeof burnChainClassMap,
  providers: any,
  context: BurnMachineContext<any, any>
) => {
  const burnClass = burnChainClassMap[chain](
    providers[chain],
    context.tx.network
  )

  const releaseChain = getChainConfigByRentxName(context.tx.destChain).symbol

  const decimals = getReleaseAssetDecimals(context.tx.sourceAsset, releaseChain)

  const amount = String(
    Math.floor(Number(context.tx.targetAmount) * Math.pow(10, decimals))
  )
  return burnClass.Account({
    address: context.tx.userAddress, // FIXME: solana uses amount, other chains use value
    value: amount,
  }) as any
}

export const getBurnChainMap: any = (providers: any) =>
  Object.fromEntries(
    Object.keys(burnChainClassMap).map((chain: any) => {
      return [
        chain as keyof typeof burnChainClassMap,
        (context: BurnMachineContext<any, any>) => {
          return buildBurner(chain, providers, context)
        },
      ]
    })
  )

export const burnChainClassMap = {
  [RenChain.binanceSmartChain]: BinanceSmartChain,
}

export const releaseChainMap: any = {
  [RenChain.stipend]: (context: BurnMachineContext<any, any>) => {
    return Bitcoin().Address(context.tx.destAddress) as any
  },
}

export const releaseChainClassMap = {
  [RenChain.stipend]: Bitcoin,
}

export const chainsClassMap = { ...burnChainClassMap, ...releaseChainClassMap }

export const getBurnAndReleaseFees = (
  burnedCurrency: BridgeCurrency,
  provider: any,
  network: RenNetwork,
  chain: RenChain
) => {
  const releasedCurrency = toReleasedCurrency(burnedCurrency)
  const releasedCurrencyConfig = getCurrencyConfig(releasedCurrency)
  const releasedCurrencyChain = getChainConfig(
    releasedCurrencyConfig.sourceChain
  )

  const From = (burnChainClassMap as any)[chain]
  const To = (releaseChainClassMap as any)[releasedCurrencyChain.rentxName]
  return getRenJs(network)
    .getFees({
      asset: releasedCurrency,
      from: From(provider, network),
      to: To(),
    })
    .then(mapFees)
}

export const getLockAndMintFees = (
  lockedCurrency: BridgeCurrency,
  provider: any,
  network: RenNetwork,
  chain: RenChain
) => {
  const lockedCurrencyConfig = getCurrencyConfig(lockedCurrency)

  const lockedCurrencyChain = getChainConfig(lockedCurrencyConfig.sourceChain)

  const From = (lockChainMap as any)[lockedCurrencyChain.rentxName]
  const To = (mintChainClassMap as any)[chain]

  return getRenJs(network)
    .getFees({
      asset: lockedCurrency,
      from: From(),
      to: To(provider, network),
    })
    .then(mapFees)
}
