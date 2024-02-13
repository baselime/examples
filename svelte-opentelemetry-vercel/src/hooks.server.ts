import { withOpenTelemetry } from '@baselime/sveltekit-opentelemetry-middleware'
import { BaselimeSDK, BetterHttpInstrumentation } from '@baselime/node-opentelemetry';

new BaselimeSDK({
    instrumentations: [new BetterHttpInstrumentation()],
}).start();

export const handle = withOpenTelemetry(({ event, resolve }) =>  {
    event.request.headers.forEach(header => console.log(header))
   return resolve(event)
});