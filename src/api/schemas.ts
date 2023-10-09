import { TObject, TProperties, Type } from '@sinclair/typebox';
import { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { FastifyBaseLogger, FastifyInstance } from 'fastify';
import { IncomingMessage, Server, ServerResponse } from 'http';
import {
  DefaultApiLimit,
  DefaultAssetApiLimit,
  DefaultRevenueApiCount,
  RevenuePeriod,
} from '../utils/constants';
import { SortRequest } from '../types/api';
import { HealthStatusLevel } from '@rosen-bridge/health-check';
import { ERGO_CHAIN } from '@rosen-chains/ergo';
import { CARDANO_CHAIN } from '@rosen-chains/cardano';

export type FastifySeverInstance = FastifyInstance<
  Server<any, any>,
  IncomingMessage,
  ServerResponse<IncomingMessage>,
  FastifyBaseLogger,
  TypeBoxTypeProvider
>;

export const MessageResponseSchema = Type.Object({
  message: Type.String(),
});

export const TokenDataSchema = Type.Object({
  tokenId: Type.String(),
  amount: Type.Number(),
  name: Type.Optional(Type.String()),
  decimals: Type.Number(),
  isNativeToken: Type.Boolean(),
});

export const AddressBalanceSchema = Type.Object({
  address: Type.String(),
  balance: TokenDataSchema,
});

export const LockBalanceSchema = Type.Object({
  hot: Type.Array(AddressBalanceSchema),
  cold: Type.Array(AddressBalanceSchema),
});

export const OutputItemsSchema = <T extends TProperties>(
  itemType: TObject<T>
) =>
  Type.Object({
    items: Type.Array(itemType),
    total: Type.Number(),
  });

export const InfoResponseSchema = Type.Object({
  health: Type.String(),
  balances: LockBalanceSchema,
});

export const HealthStatusTypeSchema = Type.Object({
  id: Type.String(),
  status: Type.Enum(HealthStatusLevel),
  description: Type.Optional(Type.String()),
  lastCheck: Type.Optional(Type.String()),
});

export const RevenueHistoryQuerySchema = Type.Object({
  limit: Type.Number({ default: DefaultApiLimit }),
  offset: Type.Number({ default: 0 }),
  sort: Type.Optional(Type.Enum(SortRequest)),
  fromChain: Type.Optional(Type.String()),
  toChain: Type.Optional(Type.String()),
  tokenId: Type.Optional(Type.String()),
  maxHeight: Type.Optional(Type.Number()),
  minHeight: Type.Optional(Type.Number()),
  fromBlockTime: Type.Optional(Type.Number()),
  toBlockTime: Type.Optional(Type.Number()),
});

export const SingleRevenueSchema = Type.Object({
  revenueType: Type.String(),
  data: TokenDataSchema,
});

export const RevenueHistoryResponseSchema = OutputItemsSchema(
  Type.Object({
    id: Type.Number(),
    rewardTxId: Type.String(),
    eventId: Type.String(),
    lockHeight: Type.Number(),
    fromChain: Type.String(),
    toChain: Type.String(),
    fromAddress: Type.String(),
    toAddress: Type.String(),
    amount: Type.String(),
    bridgeFee: Type.String(),
    networkFee: Type.String(),
    lockTokenId: Type.String(),
    lockTxId: Type.String(),
    height: Type.Number(),
    timestamp: Type.Number(),
    revenues: Type.Array(SingleRevenueSchema),
  } as const)
);

export const AssetsQuerySchema = Type.Object({
  limit: Type.Number({ default: DefaultAssetApiLimit }),
  offset: Type.Number({ default: 0 }),
  chain: Type.Optional(Type.Enum({ ERGO_CHAIN, CARDANO_CHAIN })),
  tokenId: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
});

export const AssetsResponseSchema = OutputItemsSchema(
  Type.Object({
    tokenId: Type.String(),
    name: Type.Optional(Type.String()),
    amount: Type.String(),
    decimals: Type.Number(),
    chain: Type.Enum({ ERGO_CHAIN, CARDANO_CHAIN }),
  })
);

export const EventsQuerySchema = Type.Object({
  limit: Type.Number({ default: DefaultApiLimit }),
  offset: Type.Number({ default: 0 }),
  sort: Type.Optional(Type.Enum(SortRequest)),
  fromChain: Type.Optional(Type.String()),
  toChain: Type.Optional(Type.String()),
  maxAmount: Type.Optional(Type.String()),
  minAmount: Type.Optional(Type.String()),
});

export const EventsResponseSchema = OutputItemsSchema(
  Type.Object({
    eventId: Type.String(),
    block: Type.String(),
    height: Type.Number(),
    fromChain: Type.String(),
    toChain: Type.String(),
    fromAddress: Type.String(),
    toAddress: Type.String(),
    amount: Type.String(),
    bridgeFee: Type.String(),
    networkFee: Type.String(),
    sourceChainTokenId: Type.String(),
    targetChainTokenId: Type.String(),
    sourceChainHeight: Type.Number(),
    sourceBlockId: Type.String(),
    sourceTxId: Type.String(),
    WIDs: Type.String(),
  } as const)
);

export const RevenueChartQuerySchema = Type.Object({
  count: Type.Number({ default: DefaultRevenueApiCount }),
  period: Type.Enum(RevenuePeriod),
});

export const RevenueChartResponseSchema = Type.Array(
  Type.Object({
    title: Type.String(),
    data: Type.Array(
      Type.Object({
        label: Type.String(),
        amount: Type.String(),
      })
    ),
  })
);
