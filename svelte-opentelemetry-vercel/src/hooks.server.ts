import { withOpenTelemetry } from '@baselime/sveltekit-opentelemetry-middleware'
import { BaselimeSDK, BetterHttpInstrumentation } from '@baselime/node-opentelemetry';

new BaselimeSDK({
    instrumentations: [new BetterHttpInstrumentation()],
}).start();

export const handle = withOpenTelemetry(({ event, resolve }) =>  {
    console.log(event.request.headers.entries())
   return resolve(event)
});