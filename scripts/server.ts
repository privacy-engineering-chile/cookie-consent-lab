import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('.');
const port = Number(process.env.PORT ?? 4173);

const contentTypes: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8'
};

function resolvePath(urlPath: string): string | null {
  const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  const candidate = normalize(join(root, decoded));

  if (!candidate.startsWith(root)) {
    return null;
  }

  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    return join(candidate, 'index.html');
  }

  return candidate;
}

createServer((request, response) => {
  const filePath = resolvePath(request.url ?? '/');

  if (!filePath || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream'
  });
  createReadStream(filePath).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`cookie-consent-lab listening on http://127.0.0.1:${port}`);
});
