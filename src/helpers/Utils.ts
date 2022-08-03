import Configs from "./Configs";
import ChainsConstants from "../chains/ChainsConstants";
import chainsConstants from "../chains/ChainsConstants";

class Utils {

    private static readonly guardsLen = Configs.guardsLen
    private static readonly guardId = Configs.guardId
    private static readonly TURNS_LENGTH = 3 * 60 // 3 minutes
    private static readonly UP_TIME_LENGTH = 2 * 60 // 2 minutes
    private static readonly FULL_PERIOD = this.guardsLen * this.TURNS_LENGTH

    /**
     * calculates starting time by getting current time and adding INITIAL_DELAY to it.
     * splits timestamp into guardsLen * TURNS_LENGTH groups. calculates starting group.
     * calculates guard turn starting group by multiplying each TURNS_LENGTH by guard id and adding 1 second for insurance.
     * calculates differ from current group and guard turn starting group.
     * uses reminder in FULL_PERIOD to calculates remaining time to next turn in 1 period.
     * @return seconds to the guard next turn (plus 1 second for insurance)
     */
    static secondsToNextTurn = (): number => {
        const startingTimeStamp = Date.now()
        const currentTurn = startingTimeStamp % this.FULL_PERIOD
        const guardTurn = this.guardId * this.TURNS_LENGTH + 1 // (plus 1 second for insurance)

        return (guardTurn - currentTurn + this.FULL_PERIOD) % this.FULL_PERIOD
    }

    /**
     * splits timestamp into guardsLen * TURNS_LENGTH groups. calculates current group.
     * splits group into TURNS_LENGTH places.
     *  if current place is passed by UP_TIME_LENGTH, it's in free gap.
     *  if not, splits place into guardsLen stages. stage number shows guards turn.
     * @return which guard should create in current turn (-1 if it's in gap, i.e. last minute of each guard turn)
     */
    static guardTurn = (): number => {
        const currentTimeStamp = Date.now()
        const currentTurn = currentTimeStamp % this.FULL_PERIOD

        if (currentTurn % this.TURNS_LENGTH > this.UP_TIME_LENGTH) return -1
        else return Math.floor(currentTurn / this.TURNS_LENGTH) % this.guardsLen
    }

    /**
     * converts number to 1 byte Uint8Array
     * @param num
     */
    static numberToByte = (num: number): Uint8Array => {
        const buffer = Buffer.alloc(1, 0)
        buffer.writeUint8(num)
        return buffer
    }

    static targetTokenIdByChain = (token: { [key: string]: { [key: string]: string; }}, targetChain: string): string => {
        if (targetChain == ChainsConstants.ergo) return token[chainsConstants.ergo]['tokenID']
        else if (targetChain == ChainsConstants.cardano) return token[chainsConstants.cardano]['fingerprint']
        else {
            throw new Error("target chain " + targetChain + " is not implemented yet")
        }
    }

    /**
     * converts hex string to bytearray
     */
    static hexStringToUint8Array = (str: string): Uint8Array => {
        return Buffer.from(str, "hex")
    }

    /**
     * converts bytearray to hex string
     */
    static Uint8ArrayToHexString = (bytes: Uint8Array): string => {
        return Buffer.from(bytes).toString("hex")
    }

}

export default Utils
