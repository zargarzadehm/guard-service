import GuardsErgoConfigs from '../../src/helpers/GuardsErgoConfigs';

export const guardInfo = {
  health: 'OK',
  hot: {
    address: GuardsErgoConfigs.ergoContractConfig.lockAddress,
    balance: '10',
  },
  cold: {
    address: GuardsErgoConfigs.coldAddress,
    balance: '100',
  },
  tokens: {
    ergo: [{ id: '1', value: '20' }],
    cardano: [{ id: '2', value: '40' }],
  },
};