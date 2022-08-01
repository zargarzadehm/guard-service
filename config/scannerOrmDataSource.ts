import path from 'path';
import { DataSource } from "typeorm";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const scannerOrmDataSource = new DataSource({
    type: "sqlite",
    database: __dirname + "/../sqlite/scanner.sqlite",
    entities: ['src/db/entities/scanner/*.ts'],
    migrations: ['src/db/migrations/scanner/*.ts'],
    synchronize: false,
    logging: false
});