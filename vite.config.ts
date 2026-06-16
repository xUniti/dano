import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// Tauri serves a static SPA build, so we use adapter-static with an index.html
// fallback. SSR is disabled in src/routes/+layout.ts.
export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ fallback: 'index.html' })
		})
	],
	// Tauri expects a fixed dev port and clear error output.
	clearScreen: false,
	server: { port: 1420, strictPort: true }
});
