import { apiServer, initApiServer } from '../../src/jobs/apiServer';
import { guardInfo } from './testData';
import ChainHandlerMock from '../handlers/ChainHandler.mock';
import { AssetBalance } from '@rosen-chains/abstract-chain';
import { CARDANO_CHAIN } from '@rosen-chains/cardano';

describe('generalInfo', () => {
  describe('GET /info', () => {
    beforeAll(async () => {
      await initApiServer();
    });

    beforeEach(() => {
      ChainHandlerMock.resetMock();
    });

    /**
     * @target fastifyServer[GET /info] should return general info of the guard correctly
     * @dependencies
     * @scenario
     * - mock getChain function of ChainHandler
     * - send a request to the server
     * - check the result
     * @expected
     * - it should return status code 200
     * - it should return general info of the guard correctly
     */
    it('should return general info of the guard correctly', async () => {
      // mock getChain function of ChainHandler
      const ergoLockBalance: AssetBalance = {
        nativeToken: 10n,
        tokens: [{ id: '1', value: 20n }],
      };
      const ergoColdBalance: AssetBalance = {
        nativeToken: 100n,
        tokens: [],
      };
      const cardanoLockBalance: AssetBalance = {
        nativeToken: 0n,
        tokens: [{ id: '2', value: 40n }],
      };
      ChainHandlerMock.mockChainName(CARDANO_CHAIN, true);
      ChainHandlerMock.mockErgoFunctionReturnValue(
        'getLockAddressAssets',
        ergoLockBalance
      );
      ChainHandlerMock.mockErgoFunctionReturnValue(
        'getColdAddressAssets',
        ergoColdBalance
      );
      ChainHandlerMock.mockFromChainFunction(
        'getLockAddressAssets',
        cardanoLockBalance
      );

      // send a request to the server
      const result = await apiServer.inject({
        method: 'GET',
        url: '/info',
      });

      // check the result
      expect(result.statusCode).toEqual(200);
      expect(result.json()).toEqual(guardInfo);
    });
  });
});