import { defineConfig } from 'vite';
import { sites } from '@openai/sites-vite-plugin';
export default defineConfig({ base: './', plugins: [sites()], build: { target: 'es2022', sourcemap: true }, server: { port: 4173 } });
