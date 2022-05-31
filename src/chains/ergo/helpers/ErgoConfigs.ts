import config from "config";

class ErgoConfigs {

    // service configs
    static bankAddress: string = config.get?.('ergo.bankAddress')
    static minimumErg = BigInt(config.get?.('ergo.minimumErg'))
    static txFee = BigInt(config.get?.('ergo.txFee'))

}

export default ErgoConfigs