"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stipend = exports.StipendClass = void 0;
const utils_1 = require("@renproject/utils");
const bs58_1 = __importDefault(require("bs58"));
const blockchair_1 = require("@renproject/chains-bitcoin/build/main/APIs/blockchair");
const sochain_1 = require("@renproject/chains-bitcoin/build/main/APIs/sochain");
const bitcoin_1 = require("@renproject/chains-bitcoin/build/main/bitcoin");
const utils_2 = require("@renproject/chains-bitcoin/build/main/utils");
class StipendClass extends bitcoin_1.BitcoinClass {
    constructor() {
        super(...arguments);
        this.chain = StipendClass.chain;
        this.name = StipendClass.chain;
        this.legacyName = undefined;
        // APIs
        this.withDefaultAPIs = (network) => {
            switch (network) {
                case "mainnet":
                    // prettier-ignore
                    return this
                        .withAPI(blockchair_1.Blockchair(blockchair_1.BlockchairNetwork.STIPEND))
                        .withAPI(sochain_1.SoChain(sochain_1.SoChainNetwork.SPD), { priority: 15 });
                case "testnet":
                    // prettier-ignore
                    return this
                        .withAPI(sochain_1.SoChain(sochain_1.SoChainNetwork.SPDTEST), { priority: 15 });
                case "regtest":
                    throw new Error(`Regtest is currently not supported.`);
            }
        };
        this.asset = "SPD";
        this.utils = utils_1.utilsWithChainNetwork(StipendClass.utils, () => this.chainNetwork);
    }
}
exports.StipendClass = StipendClass;
StipendClass.chain = "Stipend";
StipendClass.asset = "SPD";
StipendClass.utils = {
    resolveChainNetwork: bitcoin_1.BitcoinClass.utils.resolveChainNetwork,
    p2shPrefix: {
        mainnet: Buffer.from([0x16]),
        testnet: Buffer.from([0xc4]),
    },
    addressBufferToString: bs58_1.default.encode,
    addressIsValid: (address, network = "mainnet") => utils_2.validateAddress(address, StipendClass.asset, exports.Stipend.utils.resolveChainNetwork(network)),
    transactionIsValid: (transaction, _network = "mainnet") => utils_1.isHex(typeof transaction === "string"
        ? transaction
        : transaction.txHash, { length: 32 }),
    addressExplorerLink: (address, network = "mainnet") => {
        switch (exports.Stipend.utils.resolveChainNetwork(network)) {
            case "mainnet":
                return `https://chainz.cryptoid.info/spd/${address}/`;
            case "testnet":
                return `https://chainz.cryptoid.info/spd/${address}/`;
            case "regtest":
                return undefined;
        }
    },
    transactionExplorerLink: (tx, network = "mainnet") => {
        const txHash = typeof tx === "string" ? tx : tx.txHash;
        switch (exports.Stipend.utils.resolveChainNetwork(network)) {
            case "mainnet":
                return `https://chainz.cryptoid.info/spd/${txHash}/`;
            case "testnet":
                return `https://chainz.cryptoid.info/spd/${txHash}/`;
            case "regtest":
                return undefined;
        }
    },
};
exports.Stipend = utils_1.Callable(StipendClass);
const _ = exports.Stipend;
//# sourceMappingURL=stipend.js.map