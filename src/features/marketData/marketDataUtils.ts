import { env } from '../../constants/environmentVariables'
import { getBandchain } from '../../services/bandchain'
import { uniqueArray } from '../../utils/arrays'
import {
  BridgeChain,
  BridgeCurrency,
  currenciesConfig,
  getCurrencyConfigByBandchainSymbol,
} from '../../utils/assetConfigs'

// move to assetConfig
const mapToBandchainCurrencySymbol = (symbol: BridgeCurrency) => {
  const config = currenciesConfig[symbol]
  return config.bandchainSymbol || symbol
}

const mapBandchainToCurrencySymbol = (symbol: string) => {
  const config = getCurrencyConfigByBandchainSymbol(symbol)
  return config.symbol
}

export const USD_SYMBOL = 'USD'

const getPair = (base: string, quote: string) => `${base}/${quote}`

const bandchainReferencePairs = uniqueArray(
  Object.values(BridgeCurrency)
    .filter(
      (symbol) =>
        symbol !== BridgeCurrency.UNKNOWN && symbol !== BridgeCurrency.SPD
    )
    .map(mapToBandchainCurrencySymbol)
).map((symbol: string) => getPair(symbol, USD_SYMBOL))

const coingeckoSymbols = Object.values(currenciesConfig)
  .filter((entry) => Boolean(entry.coingeckoSymbol))
  .map((entry) => entry.coingeckoSymbol)

type BandchainExchangeRateEntry = {
  pair: string;
  rate: number;
  updated: {
    base: number;
    quote: number;
  };
}

type CoingeckoExchangeRateEntry = {
  symbol: string;
  current_price: number;
}

const mapBandchainToExchangeData = (
  referenceData: BandchainExchangeRateEntry[]
) => {
  return referenceData.map((entry: any) => {
    const [base, quote] = entry.pair.split('/')
    const data: ExchangeRate = {
      pair: getPair(mapBandchainToCurrencySymbol(base), quote),
      rate: entry.rate,
    }
    return data
  })
}

const mapCoingeckoToExchangeData = (
  entries: CoingeckoExchangeRateEntry[]
) => {
  return entries.map((entry: any) => ({
    pair: getPair(entry.symbol, 'USD'),
    rate: entry.current_price,
  }))
}

export type ExchangeRate = {
  pair: string;
  rate: number;
}

export type GasPrice = {
  chain: string;
  standard: number;
}

export const fetchMarketDataRates = async () => {
  const bandchain = await getBandchain()
    .getReferenceData(bandchainReferencePairs)
    .then(mapBandchainToExchangeData)
    .catch((error: any) => {
      console.error(error)
      return []
    })

  const coingecko = await fetch(
    'https://api.coingecko.com/api/v3' +
      `/coins/markets?vs_currency=usd&ids=${coingeckoSymbols.join(',')}`
  )
    .then((response) => response.json())
    .then(mapCoingeckoToExchangeData)
    .catch((error: any) => {
      console.error(error)
      return []
    })

  return [...bandchain, ...coingecko]
}

export const findExchangeRate = (
  exchangeRates: ExchangeRate[],
  base: BridgeCurrency,
  quote = USD_SYMBOL
) => {
  const baseBandchainSymbol = mapToBandchainCurrencySymbol(base)
  const rateEntry = exchangeRates.find(
    (entry) => entry.pair === getPair(baseBandchainSymbol, quote)
  )
  return rateEntry?.rate || 0
}

export type AnyBlockGasPrices = {
  health: boolean;
  blockNumber: number;
  blockTime: number;
  slow: number;
  standard: number;
  fast: number;
  instant: number;
}

export const fetchMarketDataGasPrices = async () => {
  await fetch(env.GAS_FEE_ENDPOINT)
    .then((response) => response.json())
    .catch((error) => {
      console.error(error)
      return {
        fast: 50, // fallback
      }
    })
  const bscPrice = {
    chain: BridgeChain.BSCC,
    standard: 20, // unable to find reliable source, but binance gas price is stable
  }
  const spdPrice = {
    chain: BridgeChain.SPDC,
    standard: 75, // avg gas price
  }
  return [
    spdPrice,
    bscPrice,
  ] as GasPrice[]
}

export const findGasPrice = (gasPrices: GasPrice[], chain: string) => {
  const gasEntry = gasPrices.find((entry) => entry.chain === chain)
  return gasEntry?.standard || 0
}
