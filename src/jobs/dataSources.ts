import { ormDataSource } from '../../config/ormDataSource';
import { loggerFactory } from '../log/Logger';

const logger = loggerFactory(import.meta.url);

const initDataSources = async (): Promise<void> => {
  try {
    await ormDataSource.initialize();
    await ormDataSource.runMigrations();
    logger.info('Datasource has been initialized!');
  } catch (err) {
    logger.error(`An error occurred while initializing datasource: ${err}`);
  }
};

export { initDataSources };