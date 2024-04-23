import { BITCOIN_CHAIN } from '@rosen-chains/bitcoin';
import { CARDANO_CHAIN } from '@rosen-chains/cardano';
import { ERGO_CHAIN } from '@rosen-chains/ergo';

class EventStatus {
  static pendingPayment = 'pending-payment';
  static pendingReward = 'pending-reward';
  static inPayment = 'in-payment';
  static inReward = 'in-reward';
  static completed = 'completed';
  static spent = 'spent'; // same as completed but no data is available about its process
  static rejected = 'rejected';
  static timeout = 'timeout';
  static paymentWaiting = 'payment-waiting';
  static rewardWaiting = 'reward-waiting';
}

class TransactionStatus {
  static approved = 'approved';
  static inSign = 'in-sign';
  static signFailed = 'sign-failed';
  static signed = 'signed';
  static sent = 'sent';
  static invalid = 'invalid';
  static completed = 'completed';
}

enum RevenuePeriod {
  year = 'year',
  month = 'month',
  week = 'week',
}
const DefaultApiLimit = 100;
const DefaultAssetApiLimit = 10;
const DefaultRevenueApiCount = 10;
const ADA_DECIMALS = 6;
const ERG_DECIMALS = 9;

const SUPPORTED_CHAINS = [ERGO_CHAIN, CARDANO_CHAIN, BITCOIN_CHAIN];

enum RevenueType {
  fraud = 'fraud',
  bridgeFee = 'bridge-fee',
  emission = 'emission',
  networkFee = 'network-fee',
}

enum TssAlgorithms {
  curve = 'ecdsa',
  edward = 'eddsa',
}

export {
  EventStatus,
  TransactionStatus,
  RevenuePeriod,
  DefaultApiLimit,
  DefaultRevenueApiCount,
  DefaultAssetApiLimit,
  ADA_DECIMALS,
  ERG_DECIMALS,
  SUPPORTED_CHAINS,
  RevenueType,
  TssAlgorithms,
};
