// instrumentation.ts

import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PrismaInstrumentation } from '@prisma/instrumentation';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { BaselimeSDK, VercelPlugin, betterHttpInstrumentation, StripePlugin } = await import('@baselime/node-opentelemetry');

    const sdk = new BaselimeSDK({
      serverless: true,
      service: "t3-app",
      instrumentations: [
        new HttpInstrumentation({
          ...betterHttpInstrumentation({ plugins: [VercelPlugin, StripePlugin] })
        }),
        new PrismaInstrumentation()
      ]
    });
    sdk.start();
  }
}