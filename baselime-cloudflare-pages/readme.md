# Baselime Logger for Cloudflare Pages Functions

Easily add logs to your Cloudflare Pages Functions using Baselime Logger. Just import the package, create a logger, log messages, and don't forget to flush!

```javascript
import { BaselimeLogger } from "@baselime/edge-logger"

export function onRequest(context) {
    const logger = new BaselimeLogger({
        apiKey: context.env.BASELIME_API_KEY,
        ctx: context,
        isLocalDev: context.env.IS_LOCAL
    })

    logger.info("Hello from the serverless world!")

    context.waitUntil(logger.flush());
    return new Response(JSON.stringify({
        message: "Hello from the serverless world!"
    }))
}
```
For more details, check out the [Baselime Logger Documentation](https://github.com/baselime/edge-logger). Happy logging!
