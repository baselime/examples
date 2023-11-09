import type { BaselimeLogger } from '@baselime/edge-logger';

export async function load({ logger }: { logger: BaselimeLogger }) {
   
    logger.info("Hello from page.server.ts")

    return {
        data: Math.random(),
        message: "hello"
    };
}
