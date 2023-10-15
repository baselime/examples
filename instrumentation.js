import { BaselimeSDK} from '@baselime/node-opentelemetry'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {


    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'next-app',
      }),
      // spanProcessor: new SimpleSpanProcessor(new ConsoleSpanExporter()),
      spanProcessor: new SimpleSpanProcessor(new OTLPTraceExporter({
        url: "https://otel.baselime.cc/v1",
        headers: {
            'x-api-key': "xxxxxxxxx"
        }
      })),
    })
    sdk.start()
  }
}