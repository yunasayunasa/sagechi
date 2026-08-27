import { mkdir, writeFile } from 'node:fs/promises';

const serverDirectory = new URL('../dist/server/', import.meta.url);
await mkdir(serverDirectory, { recursive: true });
await writeFile(
  new URL('index.js', serverDirectory),
  `export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    if (response.status !== 404 || request.method !== 'GET') return response;
    const accept = request.headers.get('accept') || '';
    if (!accept.includes('text/html')) return response;
    return env.ASSETS.fetch(new Request(new URL('/', request.url), request));
  }
};\n`,
  'utf8',
);
