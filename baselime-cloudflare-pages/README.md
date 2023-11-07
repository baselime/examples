# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

## Logging

Add the `@baselime/edge-logger` to page.server.ts

```
import { BaselimeLogger } from '@baselime/edge-logger'

export async function load({ platform }: { platform: App.Platform }) {

    const logger = new BaselimeLogger({
        service: 'sverdle',
        namespace: 'page.server',
        apiKey: platform.env.BASELIME_API_KEY,
        ctx: platform.context
    });
   
    logger.info("Hello from page.server.ts")

    platform.context.waitUntil(logger.flush())
    return {
        data: Math.random()
    };
}

```
## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
