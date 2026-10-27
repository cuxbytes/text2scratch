/// <reference types="node" />
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Inside ddev the dev server sits behind the router on https://<project>.ddev.site
const ddev = process.env.IS_DDEV_PROJECT === 'true';

export default defineConfig({
	plugins: [
		sveltekit({
			adapter: adapter({ fallback: '404.html' }),
			// GitHub Pages serves the app from /<repo>/; the deploy workflow sets BASE_PATH
			paths: { base: process.argv.includes('dev') ? '' : ((process.env.BASE_PATH ?? '') as '' | `/${string}`) }
		})
	],
	server: ddev
		? {
				allowedHosts: ['.ddev.site'],
				hmr: { protocol: 'wss', clientPort: 443 }
			}
		: undefined
});
