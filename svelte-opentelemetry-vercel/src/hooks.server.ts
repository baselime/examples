import { BaselimeSDK, BetterHttpInstrumentation } from "@baselime/node-opentelemetry";
import { trace } from "@opentelemetry/api";

function setupTracing() {
    const sdk = new BaselimeSDK({
        serverless: true, 
        collectorUrl: "https://otel.baselime.cc/v1",
        instrumentations: [
            new BetterHttpInstrumentation()
        ]
    });
    sdk.start();
}
setupTracing();

import type { Handle } from '@sveltejs/kit';
const tracer = trace.getTracer("svelte-kit");
export const handle: Handle = async ({ event, resolve }) => {
    console.log("Server Hook: handle");
    return tracer.startActiveSpan("svelte-kit", async (span) => { 

        const data =await  resolve(event);
        span.end();
        return data
    });
};