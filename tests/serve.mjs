// SPDX-FileCopyrightText: 2026 Wonmor and Shaffof contributors
// SPDX-License-Identifier: Apache-2.0

// Tiny static server for the end-to-end tests: serves site/ the way deploy/Caddyfile does (same
// security headers, directory index, /404.html with status 404). No dependencies.
//   node tests/serve.mjs            -> http://127.0.0.1:4173
//   PORT=8080 node tests/serve.mjs
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { join, normalize, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../site/', import.meta.url));
const CADDYFILE = readFileSync(fileURLToPath(new URL('../deploy/Caddyfile', import.meta.url)), 'utf8');
const PORT = Number(process.env.PORT) || 4173;
const HOST = process.env.HOST || '127.0.0.1';

// Read the response headers from the production Caddyfile so the tests run under the real CSP.
function caddyHeaders(src) {
  const out = {};
  const block = src.match(/\n\theader \{\n([\s\S]*?)\n\t\}/);
  if (!block) throw new Error('serve: no header block in deploy/Caddyfile');
  for (const line of block[1].split('\n')) {
    const m = line.trim().match(/^([A-Za-z-]+)\s+(?:"([^"]*)"|(\S+))$/);
    if (m) out[m[1]] = m[2] ?? m[3];
  }
  if (!out['Content-Security-Policy']) throw new Error('serve: no Content-Security-Policy in deploy/Caddyfile');
  return out;
}
export const HEADERS = caddyHeaders(CADDYFILE);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
};

async function resolve(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath); } catch { return null; }
  if (p.includes('\0')) return null;
  const full = normalize(join(ROOT, p));
  if (full !== ROOT.slice(0, -1) && !full.startsWith(ROOT.endsWith(sep) ? ROOT : ROOT + sep)) return null; // traversal
  try {
    const s = await stat(full);
    if (s.isDirectory()) {
      if (!urlPath.endsWith('/')) return { redirect: urlPath + '/' };
      const idx = join(full, 'index.html');
      await stat(idx);
      return { file: idx };
    }
    return s.isFile() ? { file: full } : null;
  } catch { return null; }
}

export function start(port = PORT, host = HOST) {
  const server = createServer(async (req, res) => {
    for (const [k, v] of Object.entries(HEADERS)) res.setHeader(k, v);
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
    const urlPath = new URL(req.url, 'http://x').pathname;
    const hit = await resolve(urlPath);
    if (hit && hit.redirect) { res.writeHead(301, { Location: hit.redirect }); res.end(); return; }
    const file = hit ? hit.file : join(ROOT, '404.html');
    const body = await readFile(file);
    res.writeHead(hit ? 200 : 404, { 'Content-Type': TYPES[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(req.method === 'HEAD' ? undefined : body);
  });
  return new Promise((ok) => server.listen(port, host, () => ok(server)));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  const s = await start();
  const a = s.address();
  console.log(`serving site/ on http://${a.address}:${a.port}`);
}
