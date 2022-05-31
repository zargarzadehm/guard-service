import { BigNum, MultiAsset } from "@emurgo/cardano-serialization-lib-nodejs";

interface Asset {
    policy_id: string,
    asset_name: string,
    quantity: string
}

interface Utxo {
    tx_hash: string,
    tx_index: number,
    value: string,
    asset_list: Asset[]
}

interface UtxoBoxesAssets {
    lovelace: BigNum,
    assets: MultiAsset
}

export type { Utxo, Asset, UtxoBoxesAssets };