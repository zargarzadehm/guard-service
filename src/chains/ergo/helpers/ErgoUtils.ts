import { Buffer } from "buffer";
import {
    Address,
    BoxValue,
    Contract,
    ErgoBox,
    ErgoBoxCandidate,
    I64,
    TokenAmount,
    Constant
} from "ergo-lib-wasm-nodejs";
import { AssetMap, BoxesAssets, ExplorerOutputBox } from "../models/Interfaces";

class ErgoUtils {
    /**
     * converts ergo address object to string representation of it's ergoTree
     */
    static addressToErgoTreeString = (address: Address): string => {
        return address.to_ergo_tree().to_base16_bytes()
    }

    /**
     * converts base58 string of address to string representation of it's ergoTree
     */
    static addressStringToErgoTreeString = (address: string): string => {
        return Address.from_base58(address).to_ergo_tree().to_base16_bytes()
    }

    /**
     * converts base58 string of address to Ergo Contract
     */
    static addressToContract = (address: Address): Contract => {
        return Contract.new(address.to_ergo_tree())
    }

    /**
     * converts base58 string of address to Ergo Contract
     */
    static addressStringToContract = (address: string): Contract => {
        return this.addressToContract(Address.from_base58(address))
    }

    /**
     * converts Ergo Contract to string representation of it's ergoTree
     */
    static contractStringToErgoTreeString = (contract: Contract): string => {
        return contract.ergo_tree().to_base16_bytes()
    }

    /**
     * converts string representation of number to BoxValue
     */
    static boxValueFromString = (amount: string): BoxValue => {
        return BoxValue.from_i64(I64.from_str(amount))
    }

    /**
     * converts bigint to BoxValue
     */
    static boxValueFromBigint = (amount: bigint): BoxValue => {
        return this.boxValueFromString(amount.toString())
    }

    /**
     * converts BoxValue to bigint
     */
    static bigintFromBoxValue = (amount: BoxValue): bigint => {
        return BigInt(amount.as_i64().to_str())
    }

    /**
     * converts I64 object of number to bigint
     */
    static bigintFromI64 = (amount: I64): bigint => {
        return BigInt(amount.to_str())
    }

    /**
     * converts bigint to I64 object
     */
    static i64FromBigint = (amount: bigint): I64 => {
        return I64.from_str(amount.toString())
    }

    /**
     * converts bigint to TokenAmount object
     */
    static tokenAmountFromBigint = (amount: bigint): TokenAmount => {
        return TokenAmount.from_i64(this.i64FromBigint(amount))
    }

    /**
     * converts TokenAmount to bigint object
     */
    static bigintFromTokenAmount = (amount: TokenAmount): bigint => {
        return this.bigintFromI64(amount.as_i64())
    }

    /**
     * decodes register coll[coll[Byte]] value from str
     * @param str
     */
    static decodeCollColl = (str: string): Uint8Array[] => {
        return Constant.decode_from_base16(str).to_coll_coll_byte()
    }

    /**
     * checks if two arrays have same values
     * @param source first array
     * @param target second array
     */
    static doArraysHaveSameStrings = (source: string[], target: string[]): boolean => {
        if (source.length !== target.length) return false

        return !source.some(value => !target.includes(value))
    }

    /**
     * checks if two AssetMaps have same tokens with same amounts
     * @param source
     * @param target
     */
    static areAssetsEqual = (source: AssetMap, target: AssetMap): boolean => {
        if (source.length !== target.length) return false

        // checks if every token in source exists in target
        for (const tokenId in source) {
            const amount = source[tokenId]
            if (
                !Object.prototype.hasOwnProperty.call(target, tokenId) ||
                amount !== target[tokenId]
            ) return false
        }

        // checks if every token in target exists in source
        for (const tokenId in target) {
            const amount = target[tokenId]
            if (
                !Object.prototype.hasOwnProperty.call(source, tokenId) ||
                amount !== source[tokenId]
            ) return false
        }

        return true
    }

    /**
     * returns true if the box format is like rosen bridge observations
     * @param box
     */
    static isRosenData = (box: ExplorerOutputBox): boolean => {
        const r4 = this.decodeCollColl(box.additionalRegisters['R4'].serializedValue)
        return box.assets.length > 0 && r4.length >= 4
    }

    /**
     * return undefined if the box format is like rosen bridge observation else
     * @param box
     */
    static getRosenData = (box: ExplorerOutputBox) => {
        try {
            const R4 = ErgoUtils.decodeCollColl(box.additionalRegisters['R4'].serializedValue);
            if (box.assets.length > 0 && R4.length >= 4) {
                const toChain: string = Buffer.from(R4[0]).toString();
                const toAddress: string = Buffer.from(R4[1]).toString();
                const networkFee: string = Buffer.from(R4[2]).toString();
                const bridgeFee: string = Buffer.from(R4[3]).toString();
                const amount: string = box.assets[0].amount.toString();
                const tokenId: string = box.assets[0].tokenId;
                const blockId: string = box.blockId;
                return {
                    toChain: toChain,
                    toAddress: toAddress,
                    networkFee: networkFee,
                    bridgeFee: bridgeFee,
                    amount: amount,
                    tokenId: tokenId,
                    blockId: blockId
                };
            } else {
                return undefined;
            }
        } catch (e) {
            return undefined;
        }
    }


    /**
     * calculates amount of Erg and tokens in boxes
     * @param boxes
     */
    static calculateBoxesAssets = (boxes: ErgoBoxCandidate[] | ErgoBox[]): BoxesAssets => {
        let ergs: bigint = 0n
        const tokens: AssetMap = {}

        boxes.forEach(box => {
            ergs += ErgoUtils.bigintFromI64(box.value().as_i64())
            const tokenSize = box.tokens().len()
            for (let i = 0; i < tokenSize; i++) {
                const token = box.tokens().get(i)
                if (Object.prototype.hasOwnProperty.call(tokens, token.id().to_str()))
                    tokens[token.id().to_str()] += ErgoUtils.bigintFromI64(token.amount().as_i64())
                else
                    tokens[token.id().to_str()] = ErgoUtils.bigintFromI64(token.amount().as_i64())
            }
        })

        return {
            ergs: ergs,
            tokens: tokens
        }
    }

    /**
     * reduces used assets of a BoxesAssets from another one
     * @param inAssetsOrg
     * @param usedAssets
     */
    static reduceUsedAssets = (inAssetsOrg: BoxesAssets, usedAssets: BoxesAssets): BoxesAssets => {
        const inAssets = {...inAssetsOrg, tokens: {...inAssetsOrg.tokens}}
        const ergs = inAssets.ergs - usedAssets.ergs
        if (ergs < 0n)
            throw Error(`not enough Erg in input assets [Current: ${inAssets.ergs}] [Require: ${usedAssets.ergs}]`)
        const tokens: AssetMap = inAssets.tokens

        Object.keys(usedAssets.tokens).forEach(id => {
            if (Object.prototype.hasOwnProperty.call(tokens, id)) {
                tokens[id] -= usedAssets.tokens[id]
                if (tokens[id] < 0n)
                    throw Error(`not enough token [${id}] in input assets [Current: ${inAssets.tokens[id]}] [Require: ${usedAssets.tokens[id]}]`)
            } else
                throw Error(`not enough token [${id}] in input assets [Current: 0] [Require: ${usedAssets.tokens[id]}]`)
        })

        return {
            ergs: ergs,
            tokens: tokens
        }
    }
}

export default ErgoUtils
