/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { BaselimeLogger } from './baselime'

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;

	BASELIME_API_KEY: string
}

export type AppContext = {
	request: Request
	env: Env
	ctx: ExecutionContext
	logger: BaselimeLogger
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const logger = new BaselimeLogger({
			ctx,
			baselimeApiKey: env.BASELIME_API_KEY,
			baselimeDataset: 'example-dataset',
			baselimeService: 'example-service',
			baselimeNamespace: 'example-namespace',
			requestId: crypto.randomUUID(), // optional
			flushAfterLogs: 10, // optional
			flushAfterMs: 10_000, // optional
		})

		const c: AppContext = {
			request,
			env,
			ctx,
			logger,
		}
		try {
			return handleFetch(c)
		} catch (err) {
			logger.error(err)
			return new Response('internal server error', { status: 500 })
		} finally {
			c.ctx.waitUntil(logger.flush())
		}
	},
}

async function handleFetch(c: AppContext): Promise<Response> {
	c.logger.info('Hello World!', { foo: 'bar' })
	c.logger.error(new Error('example error'))
	c.logger.info(`${c.request.method} ${c.request.url}`)

	return new Response('Hello World!')
}
