/**
 * Server xem thử trên máy:  node tools/server-local.js   →  http://localhost:5517/
 * - Phục vụ các file trong thư mục dự án (hỗ trợ tua nhạc mp3)
 * - POST /__save?name=<mã>  : lưu ảnh PNG vào og/<mã>.png (dùng cho tools/og-maker.html)
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PORT = 5517;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.mp3': 'audio/mpeg', '.css': 'text/css'
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  if (req.method === 'POST' && url.pathname === '/__save') {
    const name = url.searchParams.get('name') || '';
    if (!/^[a-z0-9-]+$/.test(name)) { res.writeHead(400); return res.end('bad name'); }
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      fs.mkdirSync(path.join(ROOT, 'og'), { recursive: true });
      fs.writeFileSync(path.join(ROOT, 'og', name + '.png'), Buffer.concat(chunks));
      res.writeHead(200); res.end('ok');
    });
    return;
  }

  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404); return res.end('not found');
  }
  const size = fs.statSync(file).size;
  const type = TYPES[path.extname(file)] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const [s, e] = range.replace('bytes=', '').split('-');
    const start = +s, end = e ? +e : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1 });
    return fs.createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Xem thử: http://localhost:${PORT}/`));
