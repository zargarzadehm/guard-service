import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1692431988132 implements MigrationInterface {
  name = 'migration1692431988132';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = ?
                AND "name" = ?
        `,
      ['VIEW', 'revenue_view']
    );
    await queryRunner.query(`
            DROP VIEW "revenue_view"
        `);
    await queryRunner.query(
      `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = ?
                AND "name" = ?
        `,
      ['VIEW', 'revenue_chart']
    );
    await queryRunner.query(`
            DROP VIEW "revenue_chart"
        `);
    await queryRunner.query(`
            CREATE TABLE "temporary_revenue_entity" (
                "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
                "tokenId" varchar NOT NULL,
                "amount" bigint NOT NULL,
                "txId" varchar,
                CONSTRAINT "FK_d0c98b57da190d9955ca1fdcf86" FOREIGN KEY ("txId") REFERENCES "transaction_entity" ("txId") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_revenue_entity"("id", "tokenId", "amount", "txId")
            SELECT "id",
                "tokenId",
                "amount",
                "txId"
            FROM "revenue_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "revenue_entity"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_revenue_entity"
                RENAME TO "revenue_entity"
        `);
    await queryRunner.query(`
            CREATE VIEW "revenue_chart" AS
            SELECT re."tokenId" AS "tokenId",
                re."amount" AS "amount",
                be."timestamp" AS "timestamp",
                be."timestamp" / 604800 AS "week_number",
                be."month" AS "month",
                be."year" AS "year"
            FROM "revenue_entity" "re"
                INNER JOIN "transaction_entity" "tx" ON tx."txId" = re."txId"
                INNER JOIN "event_trigger_entity" "ete" ON "ete"."eventId" = "tx"."eventId"
                INNER JOIN "block_entity" "be" ON "ete"."spendBlock" = "be"."hash"
        `);
    await queryRunner.query(
      `
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES (NULL, NULL, NULL, ?, ?, ?)
        `,
      [
        'VIEW',
        'revenue_chart',
        'SELECT re."tokenId" AS "tokenId", re."amount" AS "amount", be."timestamp" AS "timestamp", be."timestamp"/604800 AS "week_number", be."month" AS "month", be."year" AS "year" FROM "revenue_entity" "re" INNER JOIN "transaction_entity" "tx" ON tx."txId" = re."txId"  INNER JOIN "event_trigger_entity" "ete" ON "ete"."eventId" = "tx"."eventId"  INNER JOIN "block_entity" "be" ON "ete"."spendBlock" = "be"."hash"',
      ]
    );
    await queryRunner.query(`
          CREATE VIEW "revenue_view" AS
          SELECT tx."txId" AS "rewardTxId",
              ete."eventId" AS "eventId",
              ete."spendHeight" AS "lockHeight",
              ete."fromChain" AS "fromChain",
              ete."toChain" AS "toChain",
              ete."fromAddress" AS "fromAddress",
              ete."toAddress" AS "toAddress",
              ete."amount" AS "amount",
              ete."bridgeFee" AS "bridgeFee",
              ete."networkFee" AS "networkFee",
              ete."sourceChainTokenId" AS "lockTokenId",
              ete."sourceTxId" AS "lockTxId",
              be."height" AS "height",
              be."timestamp" AS "timestamp",
              re."tokenId" AS "revenueTokenId",
              re."amount" AS "revenueAmount"
          FROM "transaction_entity" "tx"
              LEFT JOIN "event_trigger_entity" "ete" ON tx."eventId" = ete."eventId"
              LEFT JOIN "block_entity" "be" ON ete."spendBlock" = be."hash"
              LEFT JOIN "revenue_entity" "re" ON tx."txId" = re."txId"
    `);
    await queryRunner.query(
      `
          INSERT INTO "typeorm_metadata"(
                  "database",
                  "schema",
                  "table",
                  "type",
                  "name",
                  "value"
              )
          VALUES (NULL, NULL, NULL, ?, ?, ?)
    `,
      [
        'VIEW',
        'revenue_view',
        'SELECT tx."txId" AS "rewardTxId", ete."eventId" AS "eventId", ete."spendHeight" AS "lockHeight", ete."fromChain" AS "fromChain", ete."toChain" AS "toChain", ete."fromAddress" AS "fromAddress", ete."toAddress" AS "toAddress", ete."amount" AS "amount", ete."bridgeFee" AS "bridgeFee", ete."networkFee" AS "networkFee", ete."sourceChainTokenId" AS "lockTokenId", ete."sourceTxId" AS "lockTxId", be."height" AS "height", be."timestamp" AS "timestamp", re."tokenId" AS "revenueTokenId", re."amount" AS "revenueAmount" FROM "transaction_entity" "tx" LEFT JOIN "event_trigger_entity" "ete" ON tx."eventId" = ete."eventId"  LEFT JOIN "block_entity" "be" ON ete."spendBlock" = be."hash"  LEFT JOIN "revenue_entity" "re" ON tx."txId" = re."txId"',
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `
              DELETE FROM "typeorm_metadata"
              WHERE "type" = ?
                  AND "name" = ?
          `,
      ['VIEW', 'revenue_view']
    );
    await queryRunner.query(`
              DROP VIEW "revenue_view"
          `);
    await queryRunner.query(
      `
            DELETE FROM "typeorm_metadata"
            WHERE "type" = ?
                AND "name" = ?
        `,
      ['VIEW', 'revenue_chart']
    );
    await queryRunner.query(`
            DROP VIEW "revenue_chart"
        `);
    await queryRunner.query(`
            ALTER TABLE "revenue_entity"
                RENAME TO "temporary_revenue_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "revenue_entity" (
                "id" integer PRIMARY KEY NOT NULL,
                "tokenId" varchar NOT NULL,
                "amount" bigint NOT NULL,
                "txId" varchar,
                CONSTRAINT "FK_d0c98b57da190d9955ca1fdcf86" FOREIGN KEY ("txId") REFERENCES "transaction_entity" ("txId") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "revenue_entity"("id", "tokenId", "amount", "txId")
            SELECT "id",
                "tokenId",
                "amount",
                "txId"
            FROM "temporary_revenue_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_revenue_entity"
        `);
    await queryRunner.query(`
            CREATE VIEW "revenue_chart" AS
            SELECT re."tokenId" AS "tokenId",
                re."amount" AS "amount",
                be."timestamp" AS "timestamp",
                be."timestamp" / 604800000 AS "week_number",
                be."month" AS "month",
                be."year" AS "year"
            FROM "revenue_entity" "re"
                INNER JOIN "transaction_entity" "tx" ON tx."txId" = re."txId"
                INNER JOIN "event_trigger_entity" "ete" ON "ete"."eventId" = "tx"."eventId"
                INNER JOIN "block_entity" "be" ON "ete"."spendBlock" = "be"."hash"
        `);
    await queryRunner.query(
      `
            INSERT INTO "typeorm_metadata"(
                    "database",
                    "schema",
                    "table",
                    "type",
                    "name",
                    "value"
                )
            VALUES (NULL, NULL, NULL, ?, ?, ?)
        `,
      [
        'VIEW',
        'revenue_chart',
        'SELECT re."tokenId" AS "tokenId", re."amount" AS "amount", be."timestamp" AS "timestamp", be."timestamp"/604800000 AS "week_number", be."month" AS "month", be."year" AS "year" FROM "revenue_entity" "re" INNER JOIN "transaction_entity" "tx" ON tx."txId" = re."txId"  INNER JOIN "event_trigger_entity" "ete" ON "ete"."eventId" = "tx"."eventId"  INNER JOIN "block_entity" "be" ON "ete"."spendBlock" = "be"."hash"',
      ]
    );
    await queryRunner.query(`
          CREATE VIEW "revenue_view" AS
          SELECT tx."txId" AS "rewardTxId",
              ete."eventId" AS "eventId",
              ete."spendHeight" AS "lockHeight",
              ete."fromChain" AS "fromChain",
              ete."toChain" AS "toChain",
              ete."fromAddress" AS "fromAddress",
              ete."toAddress" AS "toAddress",
              ete."amount" AS "amount",
              ete."bridgeFee" AS "bridgeFee",
              ete."networkFee" AS "networkFee",
              ete."sourceChainTokenId" AS "lockTokenId",
              ete."sourceTxId" AS "lockTxId",
              be."height" AS "height",
              be."timestamp" AS "timestamp",
              re."tokenId" AS "revenueTokenId",
              re."amount" AS "revenueAmount"
          FROM "transaction_entity" "tx"
              LEFT JOIN "event_trigger_entity" "ete" ON tx."eventId" = ete."eventId"
              LEFT JOIN "block_entity" "be" ON ete."spendBlock" = be."hash"
              LEFT JOIN "revenue_entity" "re" ON tx."txId" = re."txId"
    `);
    await queryRunner.query(
      `
          INSERT INTO "typeorm_metadata"(
                  "database",
                  "schema",
                  "table",
                  "type",
                  "name",
                  "value"
              )
          VALUES (NULL, NULL, NULL, ?, ?, ?)
    `,
      [
        'VIEW',
        'revenue_view',
        'SELECT tx."txId" AS "rewardTxId", ete."eventId" AS "eventId", ete."spendHeight" AS "lockHeight", ete."fromChain" AS "fromChain", ete."toChain" AS "toChain", ete."fromAddress" AS "fromAddress", ete."toAddress" AS "toAddress", ete."amount" AS "amount", ete."bridgeFee" AS "bridgeFee", ete."networkFee" AS "networkFee", ete."sourceChainTokenId" AS "lockTokenId", ete."sourceTxId" AS "lockTxId", be."height" AS "height", be."timestamp" AS "timestamp", re."tokenId" AS "revenueTokenId", re."amount" AS "revenueAmount" FROM "transaction_entity" "tx" LEFT JOIN "event_trigger_entity" "ete" ON tx."eventId" = ete."eventId"  LEFT JOIN "block_entity" "be" ON ete."spendBlock" = be."hash"  LEFT JOIN "revenue_entity" "re" ON tx."txId" = re."txId"',
      ]
    );
  }
}