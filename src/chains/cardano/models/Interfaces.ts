import { BigNum, MultiAsset } from '@emurgo/cardano-serialization-lib-nodejs';
import { components } from '@blockfrost/openapi';

interface Asset {
  policy_id: string;
  asset_name: string;
  quantity: string;
  fingerprint: string;
}

interface AssetInfo {
  policyId: Uint8Array;
  assetName: Uint8Array;
}

interface Utxo {
  payment_addr: {
    bech32: string;
  };
  tx_hash: string;
  tx_index: number;
  value: string;
  asset_list: Array<Asset>;
}

interface InputUtxo {
  txHash: string;
  txIndex: number;
}

interface UtxoBoxesAssets {
  lovelace: BigNum;
  assets: MultiAsset;
}

interface MetaData {
  [key: string]: JSON;
}

interface RosenData {
  toChain: string;
  toAddress: string;
  bridgeFee: string;
  networkFee: string;
  fromAddress: string;
}

interface KoiosTransaction {
  tx_hash: string;
  block_hash: string;
  inputs: Array<Utxo>;
  outputs: Array<Utxo>;
  metadata?: MetaData;
}

interface AddressInfo {
  address: string;
  balance: bigint;
  utxo_set: Utxo[];
}

interface AddressAssets {
  address: string;
  asset_list: Asset[];
}

type TxUtxos = components['schemas']['tx_content_utxo'];

type AddressUtxos = components['schemas']['address_utxo_content'];

export type {
  Utxo,
  InputUtxo,
  Asset,
  AssetInfo,
  UtxoBoxesAssets,
  TxUtxos,
  AddressUtxos,
  KoiosTransaction,
  MetaData,
  RosenData,
  AddressInfo,
  AddressAssets,
};
