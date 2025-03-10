import { RenNetwork } from '@renproject/interfaces'
import {
  AllGatewayTransactions,
  ConfirmingGatewayTransaction,
  GatewaySession,
  GatewayTransaction,
  MintedGatewayTransaction,
} from '@renproject/ren-tx'
import {
  BridgeChain,
  BridgeCurrency,
  getChainConfig,
  getChainConfigByRentxName,
  getChainRentxName,
  getCurrencyConfig,
  getCurrencyConfigByRentxName,
  getCurrencyRentxName,
  getCurrencyRentxSourceChain,
  getNetworkConfigByRentxName,
  toMintedCurrency,
} from '../../utils/assetConfigs'
import {
  DepositEntryStatus,
  DepositMeta,
  DepositPhase,
  GatewayStatus,
  getAddressExplorerLink,
  getReleaseAssetDecimals,
  getChainExplorerLink,
  getTxCreationTimestamp,
  isTxExpired,
  TxEntryStatus,
  TxMeta,
  TxPhase,
} from '../transactions/transactionsUtils'

type CreateMintTransactionParams = {
  currency: BridgeCurrency;
  mintedCurrency: BridgeCurrency; // TODO: Can be probably derived from mintedCurrencyChain
  mintedCurrencyChain: BridgeChain;
  userAddress: string;
  destAddress: string;
  network: RenNetwork;
  dayIndex?: number;
  dayOffset?: number;
  nonce?: string;
}

export const getSessionDay = (dayOffset = 0) =>
  Math.floor(Date.now() / 1000 / 60 / 60 / 24) - dayOffset

// user has 72 hours from the start of a session day to complete the tx
// a gateway is only valid for 48 hours however.
//
// FIXME: once ren-tx takes the two-stage expiry into account, update this
export const getSessionExpiry = (dayOffset = 0) =>
  (getSessionDay(dayOffset) + 3) * 60 * 60 * 24 * 1000

const generateNonce = (dayOffset = 0, dayIndex = 0) => {
  const nonce = dayIndex + getSessionDay(dayOffset) * 1000
  return nonce.toString(16).padStart(64, '0')
}

// Amount of time remaining until gateway expires
// We remove 1 day from the ren-tx expiry to reflect the extra mint
// submission leeway
// FIXME: once ren-tx takes the two stages into account, fix this
export const getRemainingGatewayTime = (expiryTime: number) =>
  Math.ceil(expiryTime - 24 * 60 * 60 * 1000 - Number(new Date()))

export const getRemainingMintTime = (expiryTime: number) =>
  Math.ceil(expiryTime - Number(new Date()))

export const getGatewayStatus = (expiryTime: number) => {
  const remaining = getRemainingGatewayTime(expiryTime)
  if (remaining > 24 * 60 * 60 * 1000) {
    return GatewayStatus.CURRENT // newest gateway
  } else if (remaining > 0) {
    return GatewayStatus.PREVIOUS // depositing still possible
  } else if (remaining > -24 * 60 * 60 * 1000) {
    return GatewayStatus.EXPIRING // just mint operation permitted
  } else {
    // totally expired gateway
    return GatewayStatus.EXPIRED
  }
}

export const createMintTransaction = ({
  currency,
  mintedCurrencyChain,
  userAddress,
  destAddress,
  network,
  dayIndex = 0,
  dayOffset = 0,
  nonce = generateNonce(dayOffset, dayIndex),
}: CreateMintTransactionParams) => {
  // Providing a nonce manually prevents us from needing to instantiate the mint-machine just for that purpose

  // We use a deterministic nonce that you can re-create if you know
  // 1) the source asset
  // 2) the destination chain
  // 3) the destination address
  // 4) the day the transaction was made (in UTC)
  // 5) the number of transactions you made with the same parameters above for that day
  //
  // NOTE - this will overflow if the user makes more than 1000 transactions to the same pair in a day,
  // but we assume that no one will reach that amount, and an overflow is just confusing, not breaking
  const tx: GatewaySession<any> = {
    id: `tx-${userAddress}-${nonce}-${currency}-${mintedCurrencyChain}`,
    network,
    sourceAsset: getCurrencyRentxName(currency),
    sourceChain: getCurrencyRentxSourceChain(currency), // TODO: it can be derived for minting
    destAddress,
    destChain: getChainRentxName(mintedCurrencyChain),
    userAddress,
    nonce,
    expiryTime: getSessionExpiry(dayOffset),
    transactions: {},
    customParams: {},
    createdAt: Date.now() - dayOffset * 24 * 60 * 60 * 1000,
  }

  return tx
}

export const preValidateMintTransaction = (tx: GatewaySession<any>) => {
  return tx.destAddress && tx.userAddress
}

export const depositSorter = (
  a: GatewayTransaction<any>,
  b: GatewayTransaction<any>
) => {
  const aConf = a.detectedAt || 0
  const bConf = b.detectedAt || 0
  return Number(aConf) - Number(bConf)
}

export const getDepositParams = (
  tx: GatewaySession<any>,
  transaction: AllGatewayTransactions<any> | null
) => {
  const { lockChainConfig, mintChainConfig } = getLockAndMintBasicParams(tx)
  let mintTxHash: string = ''
  let mintTxLink: string = ''
  let lockTxHash: string = ''
  let lockTxLink: string = ''
  let lockTxAmount = 0
  let lockProcessingTime = null
  let lockConfirmations = 0
  let lockTargetConfirmations = 0
  if (transaction) {
    if (
      (transaction as MintedGatewayTransaction<any>).destTxHash !== undefined
    ) {
      mintTxHash =
        (transaction as MintedGatewayTransaction<any>).destTxHash || 'unknown'
      mintTxLink =
        getChainExplorerLink(
          mintChainConfig.symbol,
          tx.network,
          mintTxHash || ''
        ) || ''
    }
    lockTxAmount =
      Number(transaction.sourceTxAmount) /
      Math.pow(
        10,
        getReleaseAssetDecimals(tx.sourceAsset, lockChainConfig.symbol)
      )
    if (transaction.rawSourceTx) {
      lockTxHash =
        transaction.rawSourceTx.transaction.txHash || transaction.sourceTxHash
      lockTxLink =
        getChainExplorerLink(lockChainConfig.symbol, tx.network, lockTxHash) ||
        ''
    }
    lockConfirmations = transaction.sourceTxConfs
    if ((transaction as ConfirmingGatewayTransaction<any>).sourceTxConfTarget) {
      lockTargetConfirmations = (transaction as ConfirmingGatewayTransaction<any>)
        .sourceTxConfTarget
      lockProcessingTime =
        Math.max(lockTargetConfirmations - lockConfirmations, 0) *
        lockChainConfig.blockTime
    }
  }

  let depositStatus = DepositEntryStatus.PENDING
  let depositPhase = DepositPhase.NONE

  if (lockTxHash) {
    // it has lockTxHash - there is deposit
    if (mintTxHash) {
      // mint tx hash present - completed
      depositStatus = DepositEntryStatus.COMPLETED
      depositPhase = DepositPhase.MINT
    } else if (
      lockTargetConfirmations &&
      lockConfirmations >= lockTargetConfirmations
    ) {
      // no mint tx hash, but confirmations fulfilled
      depositStatus = DepositEntryStatus.ACTION_REQUIRED
      depositPhase = DepositPhase.MINT
      // expired in mint phase - no submission
      if (isTxExpired(tx)) {
        depositStatus = DepositEntryStatus.EXPIRED
      }
    } else if (lockConfirmations < lockTargetConfirmations) {
      // no mint tx hash, but awaiting confirmations
      depositStatus = DepositEntryStatus.PENDING
      depositPhase = DepositPhase.LOCK
      if (isTxExpired(tx)) {
        depositStatus = DepositEntryStatus.EXPIRED
      }
    }
  } else {
    // no lockTxHash - no deposit to process
    depositStatus = DepositEntryStatus.ACTION_REQUIRED
    depositPhase = DepositPhase.LOCK
    // expired in lock phase - no deposit
    if (isTxExpired(tx)) {
      depositStatus = DepositEntryStatus.EXPIRED
    }
  }

  // FIXME: depreacate meta
  const meta: DepositMeta = {
    status: depositStatus,
    phase: depositPhase,
  }

  return {
    mintTxHash,
    mintTxLink,
    lockTxHash,
    lockTxLink,
    lockConfirmations,
    lockTargetConfirmations,
    lockProcessingTime,
    lockTxAmount,
    depositStatus,
    depositPhase,
    meta,
  }
}

export const getLockAndMintBasicParams = (tx: GatewaySession<any>) => {
  const networkConfig = getNetworkConfigByRentxName(tx.network)
  const lockCurrencyConfig = getCurrencyConfigByRentxName(tx.sourceAsset)
  const mintCurrencyConfig = getCurrencyConfig(
    toMintedCurrency(lockCurrencyConfig.symbol)
  )
  const lockChainConfig = getChainConfig(lockCurrencyConfig.sourceChain)
  const mintChainConfig = getChainConfigByRentxName(tx.destChain)
  const mintAddressLink = getAddressExplorerLink(
    mintChainConfig.symbol,
    tx.network,
    tx.userAddress
  )
  // const suggestedAmount = Number(tx.suggestedAmount) / 1e8;
  const createdTime = getTxCreationTimestamp(tx)
  const depositsCount = Object.values(tx.transactions || {}).length
  const gatewayStatus = getGatewayStatus(tx.expiryTime)

  const decimals = getReleaseAssetDecimals(
    tx.sourceAsset,
    lockChainConfig.symbol
  )

  return {
    networkConfig,
    lockCurrencyConfig,
    mintCurrencyConfig,
    mintChainConfig,
    lockChainConfig,
    mintAddressLink,
    // suggestedAmount,
    createdTime,
    depositsCount,
    gatewayStatus,
    decimals,
  }
}

export const getLockAndMintDepositsParams = (tx: GatewaySession<any>) => {
  const sortedTransactions = Object.values(tx.transactions).sort(depositSorter)
  const depositsParams = []
  for (const transaction of sortedTransactions) {
    const params = getDepositParams(tx, transaction)
    depositsParams.push(params)
  }
  return { depositsParams }
}

// TODO: replace with getLockAndMintBasicParams, getLockAndMintDepositsParams
export const getLockAndMintParams = (
  tx: GatewaySession<any>,
  depositSourceHash = ''
) => {
  const {
    networkConfig,
    mintCurrencyConfig,
    lockCurrencyConfig,
    mintChainConfig,
    lockChainConfig,
    mintAddressLink,
  } = getLockAndMintBasicParams(tx)

  const sortedDeposits = Object.values(tx.transactions).sort(depositSorter)
  let transaction = null
  if (sortedDeposits.length) {
    if (depositSourceHash) {
      transaction = tx.transactions[depositSourceHash]
    } else {
      transaction = sortedDeposits[0]
    }
  }
  let mintTxHash: string = ''
  let mintTxLink: string = ''
  let lockTxHash: string = ''
  let lockTxLink: string = ''
  let lockTxNativeAmount = ''
  let lockTxAmount = 0
  let lockProcessingTime = null
  let lockConfirmations = 0
  let lockTargetConfirmations = 0
  const decimals = getReleaseAssetDecimals(
    tx.sourceAsset,
    lockChainConfig.symbol
  )
  if (transaction) {
    if (
      (transaction as MintedGatewayTransaction<any>).destTxHash !== undefined
    ) {
      mintTxHash =
        (transaction as MintedGatewayTransaction<any>).destTxHash || 'unknown'
      mintTxLink =
        getChainExplorerLink(
          mintChainConfig.symbol,
          tx.network,
          mintTxHash || ''
        ) || ''
    }
    lockTxNativeAmount = transaction.sourceTxAmount
    lockTxAmount = Number(transaction.sourceTxAmount) / Math.pow(10, decimals)
    if (transaction.rawSourceTx) {
      lockTxHash =
        transaction.rawSourceTx.transaction.txHash || transaction.sourceTxHash
      lockTxLink =
        getChainExplorerLink(lockChainConfig.symbol, tx.network, lockTxHash) ||
        ''
    }
    lockConfirmations = transaction.sourceTxConfs
    if ((transaction as ConfirmingGatewayTransaction<any>).sourceTxConfTarget) {
      lockTargetConfirmations = (transaction as ConfirmingGatewayTransaction<any>)
        .sourceTxConfTarget
      lockProcessingTime =
        Math.max(lockTargetConfirmations - lockConfirmations, 0) *
        lockChainConfig.blockTime
    }
  }
  const meta: TxMeta = {
    status: TxEntryStatus.PENDING,
    phase: TxPhase.NONE,
    createdTimestamp: getTxCreationTimestamp(tx), // TODO: deprecated
    transactionsCount: sortedDeposits.length,
  }

  if (lockTxHash) {
    // it has lockTxHash - there is deposit
    if (mintTxHash) {
      // mint tx hash present - completed
      meta.status = TxEntryStatus.COMPLETED
    } else if (lockConfirmations >= lockTargetConfirmations) {
      // no mint tx hash, but confirmations fulfilled
      meta.status = TxEntryStatus.ACTION_REQUIRED
      meta.phase = TxPhase.MINT
      // expired in mint phase - no submission
      if (isTxExpired(tx)) {
        meta.status = TxEntryStatus.EXPIRED
      }
    } else if (lockConfirmations < lockTargetConfirmations) {
      // no mint tx hash, but awaiting confirmations
      meta.status = TxEntryStatus.PENDING
      meta.phase = TxPhase.LOCK
      if (isTxExpired(tx)) {
        meta.status = TxEntryStatus.EXPIRED
      }
    }
  } else {
    // no deposit
    meta.status = TxEntryStatus.ACTION_REQUIRED
    meta.phase = TxPhase.LOCK
    // expired in lock phase - no deposit
    if (isTxExpired(tx)) {
      meta.status = TxEntryStatus.EXPIRED
    }
  }

  return {
    networkConfig,
    mintCurrencyConfig,
    lockCurrencyConfig,
    mintChainConfig,
    lockChainConfig,
    mintAddressLink,
    mintTxHash,
    mintTxLink,
    lockTxHash,
    lockTxLink,
    lockConfirmations,
    lockTargetConfirmations,
    lockProcessingTime,
    lockTxAmount,
    lockTxNativeAmount,
    decimals,
    meta,
  }
}

export const areAllDepositsCompleted = (tx: GatewaySession<any>) => {
  const { depositsParams } = getLockAndMintDepositsParams(tx)
  if (depositsParams.length === 0) {
    return false
  }
  for (const deposit of depositsParams) {
    // if any of the deposits is in not in completed state
    if (deposit.meta.status !== DepositEntryStatus.COMPLETED) {
      return false
    }
  }
  return true
}
