import { SvgIconComponent } from '@material-ui/icons'
import { RenNetwork } from '@renproject/interfaces'
import {
  BinanceChainFullIcon,
  BinanceChainIcon,
  CustomSvgIconComponent,
  MetamaskFullIcon,
  MewFullIcon,
  StipdendFullIcon,
  TooltipIcon as NotSetIcon,
  WalletConnectFullIcon,
} from '../components/icons/RenIcons'
import { env } from '../constants/environmentVariables'
import * as customColors from '../theme/colors'

// TODO: replace everywhere
export enum RenChain {
  stipend = 'stipend',
  binanceSmartChain = 'binanceSmartChain',
  unknown = 'unknown',
}

export enum BridgeCurrency {
  SPD = 'SPD',
  WSPD = 'WSPD',
  UNKNOWN = 'UNKNOWN',
}

export enum BridgeChain {
  SPDC = 'SPDC',
  BSCC = 'BSCC',
  UNKNOWNC = 'UNKNOWNC',
}

export enum BridgeNetwork {
  MAINNET = 'MAINNET',
  TESTNET = 'TESTNET',
  UNKNOWN = 'UNKNOWN',
}

export enum BridgeWallet {
  METAMASKW = 'METAMASKW',
  WALLETCONNECTW = 'WALLETCONNECTW',
  MEWCONNECTW = 'MEWCONNECTW',
  BINANCESMARTW = 'BINANCESMARTW',
  UNKNOWNW = 'UNKNOWNW',
}

export type NetworkMapping = {
  testnet: RenNetwork;
  mainnet: RenNetwork;
}

export type ChainToNetworkMappings = Record<
  RenChain.binanceSmartChain | string,
  NetworkMapping
>

const unknownLabel = 'unknown'

export type LabelsConfig = {
  short: string;
  full: string;
}

export type ColorsConfig = {
  color?: string;
}
export type MainIconConfig = {
  Icon: CustomSvgIconComponent | SvgIconComponent;
  MainIcon: CustomSvgIconComponent | SvgIconComponent;
}

export type IconsConfig = MainIconConfig & {
  FullIcon: CustomSvgIconComponent | SvgIconComponent;
  GreyIcon: CustomSvgIconComponent | SvgIconComponent;
}

export type BridgeCurrencyConfig = LabelsConfig &
  ColorsConfig &
  IconsConfig & {
    symbol: BridgeCurrency;
    sourceChain: BridgeChain;
    rentxName: string;
    destinationChains?: BridgeChain[];
    bandchainSymbol?: string;
    coingeckoSymbol?: string;
    networkMappings: ChainToNetworkMappings;
  }

const networkMappingLegacy: NetworkMapping = {
  mainnet: RenNetwork.Mainnet,
  testnet: RenNetwork.Testnet,
}



const oldNetworkMappings: ChainToNetworkMappings = {
  // BinanceSmartChain only has 1 network for testnet/mainnet
  // so vDot3 is equavelent to "legacy" mappings
  [RenChain.binanceSmartChain]: networkMappingLegacy,
  [RenChain.stipend]: networkMappingLegacy,
}

const newNetworkMappings: ChainToNetworkMappings = {
  [RenChain.stipend]: networkMappingLegacy,
  // BinanceSmartChain only has 1 network for testnet/mainnet
  // so vDot3 is equavelent to "legacy" mappings
  [RenChain.binanceSmartChain]: networkMappingLegacy,
}

export const currenciesConfig: Record<BridgeCurrency, BridgeCurrencyConfig> = {
  [BridgeCurrency.SPD]: {
    symbol: BridgeCurrency.SPD,
    short: 'SPD',
    full: 'Stipend',
    color: customColors.redDark,
    FullIcon: StipdendFullIcon,
    GreyIcon: NotSetIcon,
    Icon: StipdendFullIcon,
    MainIcon: StipdendFullIcon,
    rentxName: 'spd',
    sourceChain: BridgeChain.SPDC,
    networkMappings: oldNetworkMappings,
  },
  [BridgeCurrency.WSPD]: {
    symbol: BridgeCurrency.WSPD,
    short: 'WSPD',
    full: 'Wrapped Stipend',
    FullIcon: StipdendFullIcon,
    GreyIcon: NotSetIcon,
    Icon: StipdendFullIcon,
    MainIcon: StipdendFullIcon,
    rentxName: 'wspd',
    sourceChain: BridgeChain.BSCC,
    networkMappings: newNetworkMappings,
  },
  [BridgeCurrency.UNKNOWN]: {
    symbol: BridgeCurrency.UNKNOWN,
    short: 'UNKNOWN',
    full: 'Unknown',
    FullIcon: NotSetIcon,
    GreyIcon: NotSetIcon,
    Icon: NotSetIcon,
    MainIcon: NotSetIcon,
    rentxName: 'unknown',
    sourceChain: BridgeChain.UNKNOWNC,
    networkMappings: newNetworkMappings,
  },
}

const unknownCurrencyConfig = currenciesConfig[BridgeCurrency.UNKNOWN]

export const getCurrencyConfig = (symbol: BridgeCurrency) =>
  currenciesConfig[symbol] || unknownCurrencyConfig

export const getCurrencyShortLabel = (symbol: BridgeCurrency) =>
  currenciesConfig[symbol].short || unknownLabel

export const getCurrencyConfigByRentxName = (name: string) =>
  Object.values(currenciesConfig).find(
    (currency) => currency.rentxName === name
  ) || unknownCurrencyConfig

export const getCurrencyConfigByBandchainSymbol = (symbol: string) =>
  Object.values(currenciesConfig).find(
    (config) => config.bandchainSymbol === symbol || config.symbol === symbol
  ) || unknownCurrencyConfig

export const getCurrencyRentxName = (symbol: BridgeCurrency) =>
  currenciesConfig[symbol].rentxName || unknownLabel

export const getCurrencySourceChain = (symbol: BridgeCurrency) =>
  currenciesConfig[symbol].sourceChain || BridgeChain.UNKNOWNC

export const getCurrencyRentxSourceChain = (symbol: BridgeCurrency) => {
  const bridgeChain = getCurrencySourceChain(symbol)
  if (bridgeChain) {
    return getChainRentxName(bridgeChain)
  }
  return BridgeChain.UNKNOWNC
}

export type BridgeChainConfig = LabelsConfig &
  IconsConfig & {
    symbol: BridgeChain;
    rentxName: RenChain;
    blockTime: number;
    nativeCurrency: BridgeCurrency;
    targetConfirmations: number;
  }

export const chainsConfig: Record<BridgeChain, BridgeChainConfig> = {
   [BridgeChain.BSCC]: {
    symbol: BridgeChain.BSCC,
    short: 'BSC',
    full: 'Binance Smart Chain',
    FullIcon: BinanceChainFullIcon,
    Icon: BinanceChainIcon,
    MainIcon: BinanceChainFullIcon,
    GreyIcon: NotSetIcon,
    rentxName: RenChain.binanceSmartChain,
    blockTime: 3,
    targetConfirmations: 30,
    nativeCurrency: BridgeCurrency.WSPD,
  },
   [BridgeChain.SPDC]: {
    symbol: BridgeChain.SPDC,
    short: 'SPD',
    full: 'Stipend',
    FullIcon: NotSetIcon,
    Icon: NotSetIcon,
    MainIcon: NotSetIcon,
    GreyIcon: NotSetIcon,
    rentxName: RenChain.stipend,
    blockTime: 3,
    targetConfirmations: 30,
    nativeCurrency: BridgeCurrency.SPD,
  },
  [BridgeChain.UNKNOWNC]: {
    symbol: BridgeChain.UNKNOWNC,
    short: 'UNKNOWNC',
    full: 'Unknown',
    FullIcon: NotSetIcon,
    GreyIcon: NotSetIcon,
    Icon: NotSetIcon,
    MainIcon: NotSetIcon,
    rentxName: RenChain.unknown,
    blockTime: 1e6,
    targetConfirmations: 1e6,
    nativeCurrency: BridgeCurrency.UNKNOWN,
  },
}

const unknownChainConfig = chainsConfig[BridgeChain.UNKNOWNC]

export const getChainConfig = (symbol: BridgeChain) =>
  chainsConfig[symbol] || unknownChainConfig

export const getChainRentxName = (symbol: BridgeChain) =>
  chainsConfig[symbol].rentxName || unknownLabel

export const getChainConfigByRentxName = (name: string) =>
  Object.values(chainsConfig).find((chain) => chain.rentxName === name) ||
  unknownChainConfig

type NetworkConfig = LabelsConfig & {
  rentxName: string;
  symbol: BridgeNetwork;
}

export const networksConfig: Record<BridgeNetwork, NetworkConfig> = {
  [BridgeNetwork.MAINNET]: {
    symbol: BridgeNetwork.MAINNET,
    short: 'MAINNET',
    full: 'Mainnet',
    rentxName: RenNetwork.Mainnet,
  },
  [BridgeNetwork.TESTNET]: {
    symbol: BridgeNetwork.TESTNET,
    short: 'TESTNET',
    full: 'Testnet',
    rentxName: RenNetwork.Testnet,
  },
  [BridgeNetwork.UNKNOWN]: {
    symbol: BridgeNetwork.UNKNOWN,
    short: 'UNKNOWN',
    full: 'Unknown',
    rentxName: 'unknown',
  },
}

const unknownNetworkConfig = networksConfig[BridgeNetwork.UNKNOWN]

export const isTestnetNetwork = (name: string) => name.indexOf('testnet') > -1

export const isMainnetNetwork = (name: string) => name.indexOf('mainnet') > -1

export const getNetworkConfigByRentxName = (name: string) => {
  if (isTestnetNetwork(name)) {
    return networksConfig[BridgeNetwork.TESTNET]
  }
  if (isMainnetNetwork(name)) {
    return networksConfig[BridgeNetwork.MAINNET]
  }
  return (
    Object.values(networksConfig).find(
      (network) => network.rentxName === name
    ) || unknownNetworkConfig
  )
}

export const supportedLockCurrencies =
  env.ENABLED_CURRENCIES[0] === '*'
    ? [
        BridgeCurrency.SPD,
        BridgeCurrency.WSPD,
      ]
    : env.ENABLED_CURRENCIES.filter((x) => {
        const included = Object.keys(BridgeCurrency).includes(x)
        if (!included) {
          console.error('unknown currency:', x)
        }
        return included
      }).map((x) => x as BridgeCurrency)

export const supportedMintDestinationChains = [
  BridgeChain.SPDC,
]

export const supportedBurnChains = [
  BridgeChain.SPDC,
  BridgeChain.BSCC,
]

export const supportedReleaseCurrencies = supportedLockCurrencies.map(
  (x) => ('REN' + x) as BridgeCurrency
)

export const toMintedCurrency = (lockedCurrency: BridgeCurrency) => {
  switch (lockedCurrency) {
    case BridgeCurrency.SPD:
      return BridgeCurrency.WSPD
    default:
      const fallback =
        BridgeCurrency[('REN' + lockedCurrency) as BridgeCurrency]
      if (fallback) return fallback
      return BridgeCurrency.UNKNOWN
  }
}

export const toReleasedCurrency = (burnedCurrency: BridgeCurrency) => {
  switch (burnedCurrency) {
    case BridgeCurrency.WSPD:
      return BridgeCurrency.SPD
    default:
      const fallback = BridgeCurrency[getNativeCurrency(burnedCurrency)]
      if (fallback) return fallback
      return BridgeCurrency.UNKNOWN
  }
}

export type BridgeWalletConfig = LabelsConfig &
  ColorsConfig &
  MainIconConfig & {
    rentxName: string;
    symbol: BridgeWallet;
    chain: BridgeChain;
  }

export const walletsConfig: Record<BridgeWallet, BridgeWalletConfig> = {
  [BridgeWallet.METAMASKW]: {
    symbol: BridgeWallet.METAMASKW,
    short: 'MetaMask',
    full: 'MetaMask Wallet',
    Icon: NotSetIcon,
    MainIcon: MetamaskFullIcon,
    chain: BridgeChain.BSCC,
    rentxName: 'Metamask',
  },
  [BridgeWallet.WALLETCONNECTW]: {
    symbol: BridgeWallet.WALLETCONNECTW,
    short: 'MetaMask',
    full: 'MetaMask Wallet',
    Icon: NotSetIcon,
    MainIcon: WalletConnectFullIcon,
    chain: BridgeChain.BSCC,
    rentxName: 'WalletConnect',
  },
  [BridgeWallet.BINANCESMARTW]: {
    symbol: BridgeWallet.BINANCESMARTW,
    short: 'Binance Wallet',
    full: 'Binance Chain Wallet',
    Icon: NotSetIcon,
    MainIcon: BinanceChainFullIcon,
    chain: BridgeChain.BSCC,
    rentxName: 'BinanceSmartWallet',
  },
  [BridgeWallet.MEWCONNECTW]: {
    symbol: BridgeWallet.UNKNOWNW,
    short: 'MEW',
    full: 'MEW Wallet',
    Icon: NotSetIcon,
    MainIcon: MewFullIcon,
    chain: BridgeChain.SPDC,
    rentxName: 'MEW',
  },
  [BridgeWallet.UNKNOWNW]: {
    symbol: BridgeWallet.UNKNOWNW,
    short: 'Unknown',
    full: 'Unknown Wallet',
    Icon: NotSetIcon,
    MainIcon: NotSetIcon,
    chain: BridgeChain.UNKNOWNC,
    rentxName: 'unknown',
  },
}

const unknownWalletConfig = walletsConfig[BridgeWallet.UNKNOWNW]

export const getWalletConfig = (symbol: BridgeWallet) =>
  walletsConfig[symbol] || unknownWalletConfig

export const getWalletConfigByRentxName = (name: string) =>
  Object.values(walletsConfig).find((wallet) => wallet.rentxName === name) ||
  unknownWalletConfig

// FIXME: hacky, lets not have two different enums for the same things (supported networks)
// Maybe we should raise the enum into ren-js, just like we have RenNetwork
export const bridgeChainToRenChain = (bridgeChain: BridgeChain): RenChain => {
  switch (bridgeChain) {
    case BridgeChain.SPDC:
      return RenChain.stipend
    case BridgeChain.BSCC:
      return RenChain.binanceSmartChain
    default:
      return RenChain.unknown
  }
}

export const getNativeCurrency = (renAsset: string) => {
  return renAsset.split('REN').pop() as BridgeCurrency
}
