import fs from "fs"
import ErgoUtils from "../chains/ergo/helpers/ErgoUtils"
import { Contract } from "ergo-lib-wasm-nodejs"
import Configs from "./Configs"

class ContractConfig {
    readonly cleanupNFT: string
    readonly cleanupConfirm: number
    readonly permitAddress: string
    readonly permitErgoTree: string
    readonly permitContract: Contract 
    readonly eventTriggerAddress: string
    readonly eventTriggerErgoTree: string
    readonly eventTriggerContract: Contract
    readonly commitmentAddress: string
    readonly commitmentErgoTree: string
    readonly commitmentContract: Contract
    readonly lockAddress: string
    readonly RepoNFT: string
    readonly RWTId: string

    constructor(path: string) {
        if (!fs.existsSync(path)) {
            throw new Error(`networkConfig file with path ${path} doesn't exist`)
        } else {
            const configJson: string = fs.readFileSync(path, 'utf8')
            const config = JSON.parse(configJson)
            this.cleanupNFT = config.tokens.CleanupNFT
            this.cleanupConfirm = config.cleanupConfirm
            this.permitAddress = config.addresses.WatcherPermit
            this.permitErgoTree = ErgoUtils.addressStringToErgoTreeString(this.permitAddress)
            this.permitContract = ErgoUtils.addressStringToContract(this.permitAddress)
            this.eventTriggerAddress = config.addresses.WatcherTriggerEvent
            this.eventTriggerErgoTree = ErgoUtils.addressStringToErgoTreeString(this.eventTriggerAddress)
            this.eventTriggerContract = ErgoUtils.addressStringToContract(this.eventTriggerAddress)
            this.commitmentAddress = config.addresses.Commitment
            this.commitmentErgoTree = ErgoUtils.addressStringToErgoTreeString(this.commitmentAddress)
            this.commitmentContract = ErgoUtils.addressStringToContract(this.commitmentAddress)
            this.lockAddress = config.addresses.lock
            this.RepoNFT = config.tokens.RepoNFT
            this.RWTId = config.tokens.RWTId
        }
    }
}

class RosenConfig {
    readonly RSN: string
    readonly guardNFT: string
    readonly contracts: Map<string, ContractConfig>

    constructor() {
        const supportingNetworks = Configs.networks
        this.contracts = new Map<string, ContractConfig>()
        const version = Configs.contractVersion
        const rosenConfigPath = this.getAddress(supportingNetworks[0], version)
        if (!fs.existsSync(rosenConfigPath)) {
            throw new Error(`rosenConfig file with path ${rosenConfigPath} doesn't exist`)
        } else {
            const configJson: string = fs.readFileSync(rosenConfigPath, 'utf8')
            const config = JSON.parse(configJson)
            this.RSN = config.tokens.RSN
            this.guardNFT = config.tokens.GuardNFT
        }
        supportingNetworks.forEach(network => {
            const networkName = network.split("-")[0].toLowerCase()
            const contractConfig = new ContractConfig(this.getAddress(network, version))
            this.contracts.set(networkName, contractConfig)
        })
    }

    getAddress = (network: string, version: string) => {
        if (process.env.NODE_ENV === undefined || process.env.NODE_ENV !== "test") {
            return `config/addresses/contracts-${network}-${version}.json`
        } else {
            return `config/addresses/test-contracts-${network}.json`
        }
    }
}


export const rosenConfig = new RosenConfig()
export {RosenConfig}
