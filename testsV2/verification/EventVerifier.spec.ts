import EventVerifier from '../../src/verification/EventVerifier';
import { mockEventTrigger } from '../event/testData';
import ChainHandlerMock from '../handlers/ChainHandler.mock';
import { ConfirmationStatus } from '@rosen-chains/abstract-chain';
import GuardsErgoConfigs from '../../src/helpers/GuardsErgoConfigs';
import DatabaseActionMock from '../db/mocked/DatabaseAction.mock';
import { Fee } from '@rosen-bridge/minimum-fee';

describe('EventVerifier', () => {
  describe('isEventConfirmedEnough', () => {
    beforeEach(async () => {
      ChainHandlerMock.resetMock();
    });

    /**
     * @target EventVerifier.isEventConfirmedEnough should return true when
     * event box and source tx are both confirmed
     * @dependencies
     * - ChainHandler
     * @scenario
     * - mock ChainHandler
     *   - mock Ergo `getHeight` such that event box is confirmed
     *   - mock fromChain `getTxConfirmationStatus` such that event source tx is confirmed
     * - run test
     * - verify returned value
     * @expected
     * - returned value should be true
     */
    it('should return true when event box and source tx are both confirmed', async () => {
      const mockedEvent = mockEventTrigger();

      // mock ChainHandler
      // mock Ergo `getHeight` such that event box is confirmed
      ChainHandlerMock.mockErgoFunctionReturnValue(
        'getHeight',
        mockedEvent.height + GuardsErgoConfigs.eventConfirmation,
        true
      );
      // mock fromChain `getTxConfirmationStatus` such that event source tx is confirmed
      ChainHandlerMock.mockFromChainFunction(
        'getTxConfirmationStatus',
        ConfirmationStatus.ConfirmedEnough,
        true
      );

      // run test
      const result = await EventVerifier.isEventConfirmedEnough(mockedEvent);

      // verify returned value
      expect(result).toEqual(true);
    });

    /**
     * @target EventVerifier.isEventConfirmedEnough should return false when
     * event box is unconfirmed
     * @dependencies
     * - ChainHandler
     * @scenario
     * - mock Ergo `getHeight` such that box is unconfirmed
     * - run test
     * - verify returned value
     * @expected
     * - returned value should be false
     */
    it('should return true when event box is unconfirmed', async () => {
      const mockedEvent = mockEventTrigger();

      // mock Ergo `getHeight` such that event box is confirmed
      ChainHandlerMock.mockErgoFunctionReturnValue(
        'getHeight',
        mockedEvent.height + GuardsErgoConfigs.eventConfirmation - 1,
        true
      );

      // run test
      const result = await EventVerifier.isEventConfirmedEnough(mockedEvent);

      // verify returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EventVerifier.isEventConfirmedEnough should return true when
     * source tx is unconfirmed
     * @dependencies
     * - ChainHandler
     * @scenario
     * - mock ChainHandler
     *   - mock Ergo `getHeight` such that event box is confirmed
     *   - mock fromChain `getTxConfirmationStatus` such that event source tx is unconfirmed
     * - run test
     * - verify returned value
     * @expected
     * - returned value should be true
     */
    it('should return true when source tx is unconfirmed', async () => {
      const mockedEvent = mockEventTrigger();

      // mock ChainHandler
      // mock Ergo `getHeight` such that event box is confirmed
      ChainHandlerMock.mockErgoFunctionReturnValue(
        'getHeight',
        mockedEvent.height + GuardsErgoConfigs.eventConfirmation,
        true
      );
      // mock fromChain `getTxConfirmationStatus` such that event source tx is unconfirmed
      ChainHandlerMock.mockFromChainFunction(
        'getTxConfirmationStatus',
        ConfirmationStatus.NotConfirmedEnough,
        true
      );

      // run test
      const result = await EventVerifier.isEventConfirmedEnough(mockedEvent);

      // verify returned value
      expect(result).toEqual(false);
    });
  });

  describe('verifyEvent', () => {
    const fee: Fee = {
      bridgeFee: 0n,
      networkFee: 0n,
      rsnRatio: 0n,
      feeRatio: 0n,
    };

    beforeEach(async () => {
      await DatabaseActionMock.clearTables();
      ChainHandlerMock.resetMock();
    });

    /**
     * @target EventVerifier.verifyEvent should verify event successfully
     * @dependencies
     * - database
     * - ChainHandler
     * @scenario
     * - insert a mocked event into db
     * - mock ChainHandler `fromChain` and `getErgoChain`
     *   - mock `verifyEvent` to return true
     *   - mock `verifyEventRWT` to return true
     *   - mock `getRWTToken` of Ergo
     * - run test
     * - verify returned value
     * @expected
     * - returned value should be true
     */
    it('should verify event successfully', async () => {
      // insert a mocked event into db
      const mockedEvent = mockEventTrigger();
      const boxSerialized = 'boxSerialized';
      await DatabaseActionMock.insertEventRecord(mockedEvent, boxSerialized);

      // mock fromChain `verifyEvent`
      ChainHandlerMock.mockFromChainFunction('verifyEvent', true, true);
      // mock fromChain `verifyEventRWT`
      ChainHandlerMock.mockErgoFunctionReturnValue('verifyEventRWT', true);
      // mock fromChain `getRWTToken`
      ChainHandlerMock.mockFromChainFunction('getRWTToken', 'rwt');

      // run test
      const result = await EventVerifier.verifyEvent(mockedEvent, fee);

      // verify returned value
      expect(result).toEqual(true);
    });

    /**
     * @target EventVerifier.verifyEvent should return false
     * when event does not verify
     * @dependencies
     * - database
     * - ChainHandler
     * @scenario
     * - insert a mocked event into db
     * - mock ChainHandler `fromChain` and `getErgoChain`
     *   - mock `verifyEvent` to return false
     *   - mock `verifyEventRWT` to return true
     *   - mock `getRWTToken` of Ergo
     * - run test
     * - verify returned value
     * @expected
     * - returned value should be false
     */
    it('should return false when event does not verify', async () => {
      // insert a mocked event into db
      const mockedEvent = mockEventTrigger();
      const boxSerialized = 'boxSerialized';
      await DatabaseActionMock.insertEventRecord(mockedEvent, boxSerialized);

      // mock fromChain `verifyEvent`
      ChainHandlerMock.mockFromChainFunction('verifyEvent', false, true);
      // mock fromChain `verifyEventRWT`
      ChainHandlerMock.mockErgoFunctionReturnValue('verifyEventRWT', true);
      // mock fromChain `getRWTToken`
      ChainHandlerMock.mockFromChainFunction('getRWTToken', 'rwt');

      // run test
      const result = await EventVerifier.verifyEvent(mockedEvent, fee);

      // verify returned value
      expect(result).toEqual(false);
    });

    /**
     * @target EventVerifier.verifyEvent should return false
     * when event RWT is wrong
     * @dependencies
     * - database
     * - ChainHandler
     * @scenario
     * - insert a mocked event into db
     * - mock ChainHandler `fromChain` and `getErgoChain`
     *   - mock `verifyEvent` to return true
     *   - mock `verifyEventRWT` to return false
     *   - mock `getRWTToken` of Ergo
     * - run test
     * - verify returned value
     * @expected
     * - returned value should be false
     */
    it('should return false when event RWT is wrong', async () => {
      // insert a mocked event into db
      const mockedEvent = mockEventTrigger();
      const boxSerialized = 'boxSerialized';
      await DatabaseActionMock.insertEventRecord(mockedEvent, boxSerialized);

      // mock fromChain `verifyEvent`
      ChainHandlerMock.mockFromChainFunction('verifyEvent', true, true);
      // mock fromChain `verifyEventRWT`
      ChainHandlerMock.mockErgoFunctionReturnValue('verifyEventRWT', false);
      // mock fromChain `getRWTToken`
      ChainHandlerMock.mockFromChainFunction('getRWTToken', 'rwt');

      // run test
      const result = await EventVerifier.verifyEvent(mockedEvent, fee);

      // verify returned value
      expect(result).toEqual(false);
    });
  });
});
