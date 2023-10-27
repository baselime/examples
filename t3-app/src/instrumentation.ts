// instrumentation.ts

import { PrismaInstrumentation } from '@prisma/instrumentation';
import { WinstonInstrumentation} from '@opentelemetry/instrumentation-winston';
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { BaselimeSDK, VercelPlugin, BetterHttpInstrumentation, StripePlugin } = await import('@baselime/node-opentelemetry');

    const sdk = new BaselimeSDK({
      serverless: true,
      instrumentations: [
        new BetterHttpInstrumentation({ 
          plugins: [
            new StripePlugin(),
            new VercelPlugin()
          ]
        }),
        new PrismaInstrumentation(),
        new WinstonInstrumentation(),
      ]
    });
    sdk.start();
  }
}