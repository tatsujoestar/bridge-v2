import { RenNetwork } from '@renproject/interfaces'
import { BinanceSmartChainInjectedConnector } from '@renproject/multiwallet-binancesmartchain-injected-connector'

import { MultiwalletProvider as RenMultiwalletProvider } from '@renproject/multiwallet-ui'
import React, { FunctionComponent } from 'react'
import {
  BinanceMetamaskConnectorInfo,
} from '../../components/wallet/WalletHelpers'
import { featureFlags } from '../../constants/featureFlags'
import { RenChain } from '../../utils/assetConfigs'

export const walletPickerModalConfig = (network: RenNetwork) => {
  return {
    chains: {
      [RenChain.binanceSmartChain]: [
        {
          name: 'BinanceSmartWallet',
          logo: 'https://avatars2.githubusercontent.com/u/45615063?s=60&v=4',
          connector: new BinanceSmartChainInjectedConnector({ debug: true }),
        },
        ...(featureFlags.enableBSCMetamask
          ? [
            {
              name: 'Metamask',
              logo:
                'https://avatars2.githubusercontent.com/u/45615063?s=60&v=4',
              info: BinanceMetamaskConnectorInfo,
              connector: (() => {
                const connector = new BinanceSmartChainInjectedConnector({
                  debug: true,
                })
                connector.getProvider = () => (window as any).ethereum
                return connector
              })(),
            },
          ]
          : []),
      ],
      [RenChain.binanceSmartChain]: [
        {
          name: 'BinanceSmartWallet',
          logo: 'https://avatars2.githubusercontent.com/u/45615063?s=60&v=4',
          connector: new BinanceSmartChainInjectedConnector({ debug: true }),
        },
        ...(featureFlags.enableBSCMetamask
          ? [
            {
              name: 'Metamask',
              logo:
                'https://avatars2.githubusercontent.com/u/45615063?s=60&v=4',
              info: BinanceMetamaskConnectorInfo,
              connector: (() => {
                const connector = new BinanceSmartChainInjectedConnector({
                  debug: true,
                })
                connector.getProvider = () => (window as any).ethereum
                return connector
              })(),
            },
          ]
          : []),
      ],
    },
  }
}

export const MultiwalletProvider: FunctionComponent = ({ children }) => {
  return <RenMultiwalletProvider>{children}</RenMultiwalletProvider>
}
