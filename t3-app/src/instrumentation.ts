// instrumentation.ts
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { PrismaInstrumentation } from '@prisma/instrumentation';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
      console.log("Hello from baselime")
      const { BaselimeSDK } = await import('@baselime/node-opentelemetry');
  
      const sdk = new BaselimeSDK({
        serverless: true,
        collectorUrl: "https://otel.baselime.cc/v1",
        instrumentations: [
          new HttpInstrumentation(),
          new PrismaInstrumentation()
        ]
      });
      sdk.start();
    }
   
  }