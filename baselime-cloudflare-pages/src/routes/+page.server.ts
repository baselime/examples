import { BaselimeLogger } from '@baselime/edge-logger'

export async function load({ platform }: { platform: App.Platform }) {

    const logger = new BaselimeLogger({
        service: 'sverdle',
        namespace: 'page.server',
        apiKey: platform.env.BASELIME_API_KEY,
        ctx: platform.context
    });
   
    logger.info("Hello from page.server.ts")

    platform.context.waitUntil(logger.flush())
    return {
        data: Math.random()
    };
}
