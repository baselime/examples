export type BaselimeLog = {
	message: string
	error?: string
	requestId: string
	data: any
}

export class BaselimeLogger {
	private readonly ctx: ExecutionContext
	private readonly baselimeApiKey
	private readonly baselimeDataset
	private readonly baselimeService
	private readonly baselimeNamespace
	private readonly logs: BaselimeLog[] = []
	private readonly requestId

	// flushTimeout is a timeout set by setTimeout() to flush the logs after a certain amount of time
	private flushTimeout: any | null = null
	private flushPromise: Promise<any> | null = null
	private flushAfterMs
	private flushAfterLogs

	constructor({
		ctx,
		baselimeApiKey,
		baselimeDataset,
		baselimeService,
		baselimeNamespace,
		flushAfterMs,
		flushAfterLogs,
		requestId,
	}: {
		ctx: ExecutionContext
		baselimeApiKey: string
		baselimeDataset: string
		baselimeService: string
		baselimeNamespace: string
		flushAfterMs?: number
		flushAfterLogs?: number
		requestId?: string
	}) {
		this.ctx = ctx
		this.baselimeApiKey = baselimeApiKey
		this.baselimeDataset = baselimeDataset
		this.baselimeService = baselimeService
		this.baselimeNamespace = baselimeNamespace
		this.flushAfterMs = flushAfterMs ?? 10000
		this.flushAfterLogs = flushAfterLogs ?? 100
		if (requestId) {
			this.requestId = requestId
		} else {
			this.requestId = crypto.randomUUID()
		}
	}

	private _log(message: string, level: string, data?: any) {
		if (data && data.level) {
			level = data.level
			delete data.level
		}

		const log: BaselimeLog = {
			message,
			level,
			...data,
		}

		if (this.requestId) {
			log.requestId = this.requestId
		}

		this.logs.push(log)

		if (this.logs.length >= this.flushAfterLogs) {
			// Reset scheduled if there is one
			if (this.flushTimeout) {
				this.scheduleFlush(this.flushAfterMs, true)
			}
			this.ctx.waitUntil(this.flush({ skipIfInProgress: true }))
		} else {
			// Always schedule a flush (if there isn't one already)
			this.scheduleFlush(this.flushAfterMs)
		}
	}

	/** Flush after X ms if there's not already
	 * a flush scheduled
	 * @param reset If true, cancel the current flush timeout
	 */
	scheduleFlush(timeout: number, reset = false) {
		if (reset && this.flushTimeout) {
			clearTimeout(this.flushTimeout)
			this.flushTimeout = null
		}

		if (!this.flushTimeout && !this.flushPromise) {
			this.flushTimeout = setTimeout(() => {
				const doFlush = async () => {
					this.flush({ skipIfInProgress: true })
					this.flushTimeout = null
				}
				this.ctx.waitUntil(doFlush())
			}, timeout)
		}
	}

	async flush({ skipIfInProgress = false }: { skipIfInProgress?: boolean } = {}) {
		if (skipIfInProgress && this.flushPromise) return

		const doFlush = async () => {
			if (this.logs.length === 0) return // Nothing to do

			// Make sure the last one is done before starting a flush
			await this.flushPromise

			const logsCount = this.logs.length
			const logsBody = JSON.stringify(this.logs)

			try {
				const res = await fetch(
					`https://events.baselime.io/v1/${this.baselimeDataset}/${this.baselimeService}/${this.baselimeNamespace}`,
					{
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'x-api-key': this.baselimeApiKey,
						},
						body: logsBody,
					}
				)
				if (res.ok) {
					// Remove the logs we sent
					this.logs.splice(0, logsCount)
					await res.arrayBuffer() // Read the body to completion
				} else {
					console.log(`Baselime failed to ingest logs: ${res.status} ${res.statusText} ${await res.text()}`)
				}
			} catch (err) {
				console.error(`Baselime failed to ingest logs: ${err}`)
			}
		}

		this.flushPromise = doFlush()
		await this.flushPromise
		this.flushPromise = null
	}

	log(msg: string, data?: any) {
		this._log(msg, 'info', data)
	}

	info(msg: string, data?: any) {
		this._log(msg, 'info', data)
	}

	warn(msg: string, data?: any) {
		this._log(msg, 'warning', data)
	}

	error(msg: string | Error | unknown, data?: any) {
		const m: string =
			msg instanceof Error
				? msg.message + (msg.stack ? `: ${msg.stack}` : '')
				: typeof msg === 'string'
				? msg
				: JSON.stringify(msg)
		this._log(m, 'error', data)
	}

	debug(msg: string, data?: any) {
		this._log(msg, 'debug', data)
	}
}
