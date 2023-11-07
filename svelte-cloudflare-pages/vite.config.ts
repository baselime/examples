import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		watch: {
			ignored: [".wrangler", ".svelte-kit", "node_modules"],
		},
	},
});
