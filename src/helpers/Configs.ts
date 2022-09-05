import config from "config";
import { GuardInfo } from "../guard/agreement/Interfaces";
import tokens from '../../config/tokens.json' assert { type: "json" };
import testTokens from '../../config/tokens.test.json' assert { type: "json" };
import { RosenTokens, TokenMap } from "@rosen-bridge/tokens";

const getConfigIntKeyOrDefault = (key: string, defaultValue: number) => {
    const val: string = config.get(key)
    if (val) {
        const valNum = parseInt(val)
        if (isNaN(valNum)) {
            return defaultValue;
        }
        return valNum
    }
    return defaultValue
}

class Configs {

    static secret: Uint8Array = Uint8Array.from(Buffer.from(config.get?.('secret') as string, 'hex'))

    // express config
    static expressPort = config.get<number>('express.port')
    private static expressBodyLimitValue = config.get<number>('express.jsonBodyLimit')
    static expressBodyLimit = `${this.expressBodyLimitValue}mb`

    // config of API's route
    static MAX_LENGTH_CHANNEL_SIZE = 200

    // token configs
    static multiSigTimeout: number = getConfigIntKeyOrDefault('multiSigTimeout', 15 * 60 * 1000)
    static rsnRatioNFT = config.get<string>('tokens.RSNRatioNFT')

    // network and contract config
    static networks = config.get<Array<string>>('networks')
    static contractVersion = config.get<string>('contractVersion')

    // tss configs
    static tssUrl = config.get<string>('tss.url')
    static tssPort = config.get<string>('tss.port')
    static tssTimeout = config.get<number>('tss.timeout')
    static tssCallBackUrl = `localhost:${this.expressPort}/tssSign`

    // guards configs
    static guardId = config.get<number>('guard.guardId')
    static guardSecret = config.get<string>('guard.secret')
    static guardsLen = config.get<number>('guard.guardsLen')
    static guards = config.get<GuardInfo[]>('guard.guards')

    // agreement configs (minimum number of guards that needs to agree with tx to get approved)
    static minimumAgreement = config.get<number>('minimumAgreement') // TODO: get this from config box in blockchain

    static tokenJson = (): RosenTokens => {
        if (process.env.NODE_ENV === undefined || process.env.NODE_ENV !== "test") {
            return tokens
        } else {
            return testTokens
        }
    }
    static tokenMap = new TokenMap(Configs.tokenJson());
}

export default Configs
