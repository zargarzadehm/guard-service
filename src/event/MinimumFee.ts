import { BridgeMinimumFee, Fee } from '@rosen-bridge/minimum-fee';
import ErgoConfigs from '../chains/ergo/helpers/ErgoConfigs';
import { rosenConfig } from '../helpers/RosenConfig';
import Configs from '../helpers/Configs';
import ChainsConstants from '../chains/ChainsConstants';
import { EventTrigger } from '@rosen-chains/abstract-chain';

class MinimumFee {
  static bridgeMinimumFee = new BridgeMinimumFee(
    ErgoConfigs.explorer.url + '/api',
    rosenConfig.rsnRatioNFT
  );

  /**
   * gets minimum fee config for an event on it's target chain
   * @param event the event trigger
   */
  static getEventFeeConfig = async (event: EventTrigger): Promise<Fee> => {
    const tokenId = Configs.tokenMap.getID(
      Configs.tokenMap.search(event.fromChain, {
        [Configs.tokenMap.getIdKey(event.fromChain)]: event.sourceChainTokenId,
      })[0],
      ChainsConstants.ergo
    );
    return await MinimumFee.bridgeMinimumFee.getFee(
      tokenId,
      event.fromChain,
      event.sourceChainHeight
    );
  };
}

export default MinimumFee;
