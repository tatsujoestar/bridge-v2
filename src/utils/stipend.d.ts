/// <reference types="node" />
import { RenNetwork, RenNetworkDetails, RenNetworkString } from "@renproject/interfaces";
import { BtcAddress, BtcNetwork, BtcTransaction } from "@renproject/chains-bitcoin/build/main/base";
import { BitcoinClass } from "@renproject/chains-bitcoin/build/main/bitcoin";
export declare class StipendClass extends BitcoinClass {
    static chain: string;
    chain: string;
    name: string;
    legacyName: undefined;
    withDefaultAPIs: (network: BtcNetwork) => this;
    static asset: string;
    asset: string;
    static utils: {
        resolveChainNetwork: (network: RenNetworkDetails | RenNetwork | "mainnet" | "testnet" | "devnet" | "localnet" | "regtest") => BtcNetwork;
        p2shPrefix: {
            mainnet: Buffer;
            testnet: Buffer;
        };
        addressBufferToString: (buffer: number[] | Uint8Array | Buffer) => string;
        addressIsValid: (address: BtcAddress | string, network?: RenNetwork | RenNetworkString | RenNetworkDetails | BtcNetwork) => any;
        transactionIsValid: (transaction: BtcTransaction | string, _network?: RenNetwork | RenNetworkString | RenNetworkDetails | BtcNetwork) => boolean;
        addressExplorerLink: (address: BtcAddress | string, network?: RenNetwork | RenNetworkString | RenNetworkDetails | BtcNetwork) => string | undefined;
        transactionExplorerLink: (tx: BtcTransaction | string, network?: RenNetwork | RenNetworkString | RenNetworkDetails | BtcNetwork) => string | undefined;
    };
    utils: {
        resolveChainNetwork: (network: RenNetworkDetails | RenNetwork | "mainnet" | "testnet" | "devnet" | "localnet" | "regtest") => BtcNetwork;
        p2shPrefix: {
            mainnet: Buffer;
            testnet: Buffer;
        };
        addressBufferToString: (buffer: number[] | Uint8Array | Buffer) => string;
        addressIsValid: (address: BtcAddress | string, network?: RenNetwork | RenNetworkString | RenNetworkDetails | BtcNetwork) => any;
        transactionIsValid: (transaction: BtcTransaction | string, _network?: RenNetwork | RenNetworkString | RenNetworkDetails | BtcNetwork) => boolean;
        addressExplorerLink: (address: BtcAddress | string, network?: RenNetwork | RenNetworkString | RenNetworkDetails | BtcNetwork) => string | undefined;
        transactionExplorerLink: (tx: BtcTransaction | string, network?: RenNetwork | RenNetworkString | RenNetworkDetails | BtcNetwork) => string | undefined;
    } & {
        addressIsValid: (address: string, network?: "mainnet" | "testnet" | "regtest" | undefined) => boolean;
        addressExplorerLink: ((address: any, network?: "mainnet" | "testnet" | "regtest" | undefined) => string | undefined) | undefined;
        transactionExplorerLink: ((tx: any, network?: "mainnet" | "testnet" | "regtest" | undefined) => string | undefined) | undefined;
    };
}
export declare type Stipend = StipendClass;
export declare const Stipend: import("@renproject/utils").CallableConstructor<typeof StipendClass>;
