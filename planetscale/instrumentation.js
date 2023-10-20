

const { BaselimeSDK } = require('@baselime/node-opentelemetry');
const { default: MySQL2Instrumentation } = require('@opentelemetry/instrumentation-mysql2');

console.log('Starting instrumentation example')
const sdk = new BaselimeSDK({
    serverless: true,
    // collectorUrl: 'https://otel.baselime.cc/v1',
    instrumentations: [
        new MySQL2Instrumentation({
            responseHook: (span, response) => {
                console.log(response)
            }
        })
    ]
})

sdk.start();