// instrumentation.ts
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { flatten } from 'flat';
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { BaselimeSDK } = await import('@baselime/node-opentelemetry');

    const sdk = new BaselimeSDK({
      serverless: true,
      service: "t3-app",
      instrumentations: [
        new HttpInstrumentation({
          startIncomingSpanHook: (request) => {
            const vercelRequestId = request.headers['x-vercel-id'];

            if (typeof vercelRequestId === "string") {
              const requestIdParts = vercelRequestId.split("::");
              const requestId = requestIdParts[requestIdParts.length - 1];
              const user = {
                ip: request.headers['x-forwarded-for'],
                country: request.headers['x-vercel-ip-country'],
                region: request.headers['x-vercel-ip-region'],
                city: request.headers['x-vercel-ip-city'],
                latitude: request.headers['x-vercel-ip-latitude'],
                longitude: request.headers['x-vercel-ip-longitude'],
                timezone: request.headers['x-vercel-ip-timezone'],
              }
              return flatten({
                requestId: requestId,
                faas: { execution: requestId },
                user
              })
            }

            return {}





          }
        }),
        new PrismaInstrumentation()
      ]
    });
    sdk.start();
  }

}