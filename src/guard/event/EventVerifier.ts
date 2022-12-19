import {
  EventStatus,
  EventTrigger,
  PaymentTransaction,
  TransactionTypes,
} from '../../models/Models';
import Reward from '../../chains/ergo/Reward';
import ErgoTransaction from '../../chains/ergo/models/ErgoTransaction';
import BaseChain from '../../chains/BaseChains';
import ChainsConstants from '../../chains/ChainsConstants';
import CardanoChain from '../../chains/cardano/CardanoChain';
import ErgoChain from '../../chains/ergo/ErgoChain';
import InputBoxes from '../../chains/ergo/boxes/InputBoxes';
import NodeApi from '../../chains/ergo/network/NodeApi';
import ErgoConfigs from '../../chains/ergo/helpers/ErgoConfigs';
import KoiosApi from '../../chains/cardano/network/KoiosApi';
import CardanoConfigs from '../../chains/cardano/helpers/CardanoConfigs';
import ExplorerApi from '../../chains/ergo/network/ExplorerApi';
import MinimumFee from '../MinimumFee';
import { ConfirmedEventEntity } from '../../db/entities/ConfirmedEventEntity';
import ErgoColdStorage from '../../chains/ergo/ErgoColdStorage';
import CardanoColdStorage from '../../chains/cardano/CardanoColdStorage';
import { ChainNotImplemented } from '../../helpers/errors';

class EventVerifier {
  static cardanoChain = new CardanoChain();
  static ergoChain = new ErgoChain();

  /**
   * returns chain object
   * @param chain the chain name
   */
  static getChainObject = (chain: string): BaseChain<any, any> => {
    if (chain === ChainsConstants.cardano) return this.cardanoChain;
    else if (chain === ChainsConstants.ergo) return this.ergoChain;
    else throw new ChainNotImplemented(chain);
  };

  /**
   * conforms transaction with the event trigger data
   * @param paymentTx the payment transaction
   * @param event the event trigger
   * @return true if payment transaction verified
   */
  static verifyPaymentTransactionWithEvent = async (
    paymentTx: PaymentTransaction,
    event: EventTrigger
  ): Promise<boolean> => {
    const feeConfig = await MinimumFee.getEventFeeConfig(event);
    if (paymentTx.txType === TransactionTypes.payment) {
      return await this.getChainObject(
        paymentTx.network
      ).verifyTransactionWithEvent(paymentTx, event, feeConfig);
    } else {
      return await Reward.verifyTransactionWithEvent(
        paymentTx as ErgoTransaction,
        event,
        feeConfig
      );
    }
  };

  /**
   * conforms event data with lock transaction in source chain
   * @param event the trigger event
   * @return true if event data verified
   */
  static verifyEvent = async (event: EventTrigger): Promise<boolean> => {
    const eventBox = await InputBoxes.getEventBox(event);
    const RWTId = eventBox.tokens().get(0).id().to_str();
    if (event.fromChain === ChainsConstants.cardano)
      return this.cardanoChain.verifyEventWithPayment(event, RWTId);
    else if (event.fromChain === ChainsConstants.ergo)
      return this.ergoChain.verifyEventWithPayment(event, RWTId);
    else throw new ChainNotImplemented(event.fromChain);
  };

  /**
   * checks if event status is pending to requested tx type
   * @param eventEntity the trigger event object in db
   * @param type the requested tx type
   * @return true if event data verified
   */
  static isEventPendingToType = (
    eventEntity: ConfirmedEventEntity,
    type: string
  ): boolean => {
    if (
      eventEntity.status === EventStatus.pendingPayment &&
      type === TransactionTypes.payment
    )
      return true;
    else if (
      eventEntity.status === EventStatus.pendingReward &&
      type === TransactionTypes.reward
    )
      return true;
    else return false;
  };

  /**
   * checks if event source tx confirmed enough
   * @param event the event trigger
   * @param eventBoxCreationHeight the creation height of the event box
   */
  static isEventConfirmedEnough = async (
    event: EventTrigger,
    eventBoxCreationHeight: number
  ): Promise<boolean> => {
    // check if the event box in ergo chain confirmed enough
    const ergoCurrentHeight = await NodeApi.getHeight();
    if (
      ergoCurrentHeight - eventBoxCreationHeight <
      ErgoConfigs.eventConfirmation
    )
      return false;

    // check if lock transaction in source chain confirmed enough
    if (event.fromChain === ChainsConstants.cardano) {
      const confirmation = await KoiosApi.getTxConfirmation(event.sourceTxId);
      return (
        confirmation !== null &&
        confirmation >= CardanoConfigs.observationConfirmation
      );
    } else if (event.fromChain === ChainsConstants.ergo) {
      const confirmation = await ExplorerApi.getTxConfirmation(
        event.sourceTxId
      );
      return confirmation >= ErgoConfigs.observationConfirmation;
    } else throw new ChainNotImplemented(event.fromChain);
  };

  /**
   * conforms a cold storage transaction
   * @param paymentTx the payment transaction
   * @return true if cold storage transaction verified
   */
  static verifyColdStorageTx = async (
    paymentTx: PaymentTransaction
  ): Promise<boolean> => {
    if (paymentTx.network === ChainsConstants.ergo)
      return await ErgoColdStorage.verifyTransaction(
        paymentTx as ErgoTransaction
      );
    else if (paymentTx.network === ChainsConstants.cardano)
      return await CardanoColdStorage.verifyTransaction(
        paymentTx as ErgoTransaction
      );
    else throw new ChainNotImplemented(paymentTx.network);
  };
}

export default EventVerifier;