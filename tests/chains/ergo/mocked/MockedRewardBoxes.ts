import { reset, spy, when } from "ts-mockito";
import RewardBoxes from "../../../../src/chains/ergo/helpers/RewardBoxes";
import { EventTrigger } from "../../../../src/models/Models";
import { ErgoBox } from "ergo-lib-wasm-nodejs";

let mockedRewardBoxes = spy(RewardBoxes)

/**
 * mocks RewardBoxes getEventBox method to return returnBox when called for an event
 * @param event
 * @param returnBox
 */
const mockGetEventBox = (event: EventTrigger, returnBox: ErgoBox): void => {
    when(mockedRewardBoxes.getEventBox(event)).thenReturn(returnBox)
}

/**
 * mocks RewardBoxes getEventValidCommitments method to return returnBoxes when called for an event
 * @param event
 * @param returnBoxes
 */
const mockGetEventValidCommitments = (event: EventTrigger, returnBoxes: ErgoBox[]): void => {
    when(mockedRewardBoxes.getEventValidCommitments(event)).thenReturn(returnBoxes)
}

/**
 * mocks RewardBoxes getRSNRatioCoef method to return coefs when called for a tokenId
 * @param tokenId
 * @param coefs
 */
const mockGetRSNRatioCoef = (tokenId: string, coefs: [bigint, bigint]): void => {
    when(mockedRewardBoxes.getRSNRatioCoef(tokenId)).thenResolve(coefs)
}

/**
 * resets mocked methods of RewardBoxes
 */
const resetMockedRewardBoxes = (): void => {
    reset(mockedRewardBoxes)
    mockedRewardBoxes = spy(RewardBoxes)
}

export {
    mockGetEventBox,
    mockGetEventValidCommitments,
    mockGetRSNRatioCoef,
    resetMockedRewardBoxes
}
