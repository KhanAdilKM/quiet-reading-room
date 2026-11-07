'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const port = Number(process.env.READING_ROOM_PORT || 8790);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.pdf': 'application/pdf', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.png': 'image/png' };
const server = http.createServer((request, response) => {
  response.setHeader('Cache-Control', 'no-cache');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end('Read-only server.'); return; }
  let filename;
  try {
    const route = decodeURIComponent(request.url.split('?')[0]);
    if (route.includes('\0')) throw new Error('Invalid path');
    filename = path.resolve(root, '.' + (route === '/' ? '/index.html' : route));
    if (!filename.startsWith(root + path.sep)) throw new Error('Invalid path');
  } catch (_) { response.writeHead(400); response.end('Invalid path.'); return; }
  fs.stat(filename, (error, stat) => {
    if (error || !stat.isFile()) { response.writeHead(404); response.end('Not found.'); return; }
    response.writeHead(200, { 'Content-Type': types[path.extname(filename)] || 'application/octet-stream', 'Content-Length': stat.size });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(filename).on('error', () => response.destroy()).pipe(response);
  });
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log('Above the Grey: http://127.0.0.1:' + port + '\nOptional local preview. Direct index.html also works offline.'));
