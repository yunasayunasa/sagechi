import { mkdir, rm, writeFile } from 'node:fs/promises';

const serverDirectory = new URL('../dist/server/', import.meta.url);
await rm(serverDirectory, { recursive: true, force: true });
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
await writeFile(
  new URL('wrangler.json', serverDirectory),
  `${JSON.stringify({
    topLevelName: 'sites-project',
    name: 'sites-project',
    compatibility_date: '2026-05-15',
    compatibility_flags: ['nodejs_compat'],
    main: 'index.js',
    no_bundle: true,
    rules: [{ type: 'ESModule', globs: ['**/*.js', '**/*.mjs'] }],
    assets: { directory: '../client' },
    observability: { enabled: true },
  })}\n`,
  'utf8',
);
