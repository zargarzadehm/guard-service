import { spy, when } from "ts-mockito";
import { guardConfig } from "../src/helpers/GuardConfig";
import { guardPks } from "./helpers/testData";
import { logger } from "../src/log/Logger";

export async function mochaGlobalSetup() {
    const spyGuardConfig = spy(guardConfig)
    when(spyGuardConfig.publicKeys).thenReturn(guardPks)
    when(spyGuardConfig.requiredSign).thenReturn(5)
    when(spyGuardConfig.guardsLen).thenReturn(7)
    when(spyGuardConfig.guardId).thenReturn(1)
    logger.log(`guard config initialization completed`);
}
