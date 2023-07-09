import 'reflect-metadata';
import { initDataSources } from './jobs/dataSources';
import { initializeMultiSigJobs } from './jobs/multiSig';
import { initApiServer } from './jobs/apiServer';
import { runProcessors } from './jobs/runProcessors';
import Configs from './configs/Configs';
import { initScanner } from './jobs/initScanner';
import { healthCheckStart } from './jobs/healthCheck';
import ChainHandler from './handlers/ChainHandler';
import TxAgreement from './agreement/TxAgreement';
import MultiSigHandler from './guard/multisig/MultiSigHandler';
import { configUpdateJob } from './jobs/guardConfigUpdate';
import MultiSigUtils from './guard/multisig/MultiSigUtils';
import { DatabaseAction } from './db/DatabaseAction';
import { dataSource } from './db/dataSource';
import GuardPkHandler from './handlers/GuardPkHandler';
import Tss from './guard/Tss';
import { tssUpdateJob } from './jobs/tss';

const init = async () => {
  // initialize all data sources
  await initDataSources();

  // initialize DatabaseAction
  const dbAction = DatabaseAction.getInstance();
  dbAction.init(dataSource);

  // initialize express Apis
  await initApiServer();

  // initialize tss multiSig object
  await MultiSigHandler.init(Configs.guardSecret);
  initializeMultiSigJobs();

  // start tss instance
  await Tss.init();
  tssUpdateJob();

  // initialize chain objects
  const chainHandler = ChainHandler.getInstance();
  MultiSigUtils.getInstance().init(chainHandler.getErgoChain().getStateContext);

  // guard config update job
  await configUpdateJob();

  // initialize TxAgreement object
  await TxAgreement.getInstance();

  // run network scanners
  initScanner();

  // run processors
  runProcessors();

  // initialize guard health check
  await healthCheckStart();
};

init().then(() => null);
