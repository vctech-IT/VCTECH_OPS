import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		host: '192.168.2.5',
		port: 4173
	},
	plugins: [sveltekit()]
});
