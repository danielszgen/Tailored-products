import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

// On GitHub Pages the site is served from /Tailored-products/.
// Locally (npm run dev) we want '/' so the dev server works at the root.
const base = process.env.GITHUB_PAGES === 'true' ? '/Tailored-products/' : '/';

export default defineConfig({
	plugins: [react()],
	base,
	root: here,
	server: {
		port: 5174,
		strictPort: false,
	},
	css: {
		postcss: resolve(here, 'postcss.config.js'),
	},
});
