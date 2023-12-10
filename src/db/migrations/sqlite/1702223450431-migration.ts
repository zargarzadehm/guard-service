import { MigrationInterface, QueryRunner } from 'typeorm';

export class migration1702223450431 implements MigrationInterface {
  name = 'migration1702223450431';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "temporary_transaction_entity" (
                "txId" varchar PRIMARY KEY NOT NULL,
                "txJson" varchar NOT NULL,
                "type" varchar NOT NULL,
                "chain" varchar NOT NULL,
                "status" varchar NOT NULL,
                "lastCheck" integer NOT NULL,
                "lastStatusUpdate" varchar,
                "failedInSign" boolean NOT NULL,
                "signFailedCount" integer NOT NULL,
                "eventId" varchar,
                "requiredSign" integer NOT NULL,
                CONSTRAINT "FK_392573e185afb94149a20cf87df" FOREIGN KEY ("eventId") REFERENCES "confirmed_event_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "temporary_transaction_entity"(
                    "txId",
                    "txJson",
                    "type",
                    "chain",
                    "status",
                    "lastCheck",
                    "lastStatusUpdate",
                    "failedInSign",
                    "signFailedCount",
                    "eventId"
                )
            SELECT "txId",
                "txJson",
                "type",
                "chain",
                "status",
                "lastCheck",
                "lastStatusUpdate",
                "failedInSign",
                "signFailedCount",
                "eventId"
            FROM "transaction_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "transaction_entity"
        `);
    await queryRunner.query(`
            ALTER TABLE "temporary_transaction_entity"
                RENAME TO "transaction_entity"
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "transaction_entity"
                RENAME TO "temporary_transaction_entity"
        `);
    await queryRunner.query(`
            CREATE TABLE "transaction_entity" (
                "txId" varchar PRIMARY KEY NOT NULL,
                "txJson" varchar NOT NULL,
                "type" varchar NOT NULL,
                "chain" varchar NOT NULL,
                "status" varchar NOT NULL,
                "lastCheck" integer NOT NULL,
                "lastStatusUpdate" varchar,
                "failedInSign" boolean NOT NULL,
                "signFailedCount" integer NOT NULL,
                "eventId" varchar,
                CONSTRAINT "FK_392573e185afb94149a20cf87df" FOREIGN KEY ("eventId") REFERENCES "confirmed_event_entity" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
            )
        `);
    await queryRunner.query(`
            INSERT INTO "transaction_entity"(
                    "txId",
                    "txJson",
                    "type",
                    "chain",
                    "status",
                    "lastCheck",
                    "lastStatusUpdate",
                    "failedInSign",
                    "signFailedCount",
                    "eventId"
                )
            SELECT "txId",
                "txJson",
                "type",
                "chain",
                "status",
                "lastCheck",
                "lastStatusUpdate",
                "failedInSign",
                "signFailedCount",
                "eventId"
            FROM "temporary_transaction_entity"
        `);
    await queryRunner.query(`
            DROP TABLE "temporary_transaction_entity"
        `);
  }
}
