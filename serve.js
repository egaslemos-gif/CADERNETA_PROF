const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/log') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      console.log('\n--- BROWSER CONSOLE ERROR ---');
      try {
        const data = JSON.parse(body);
        console.log(`Mensagem: ${data.message}`);
        console.log(`URL/Arquivo: ${data.source || data.url}`);
        console.log(`Linha/Coluna: ${data.lineno}:${data.colno}`);
        if (data.stack) {
          console.log(`Stack Trace:\n${data.stack}`);
        } else if (data.error) {
          console.log(`Erro:`, data.error);
        }
      } catch(e) {
        console.log(body);
      }
      console.log('-----------------------------\n');
      res.statusCode = 200;
      res.end('ok');
    });
    return;
  }

  // Parse URL to ignore query strings
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Normalize path and resolve to public directory
  let filePath = pathname === '/' || pathname === '/index.html'
    ? path.join(PUBLIC_DIR, 'index-local.html')
    : path.join(PUBLIC_DIR, pathname);

  // Prevent directory traversal attacks
  const relative = path.relative(PUBLIC_DIR, filePath);
  if (relative && relative.startsWith('..')) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Acesso proibido');
    return;
  }

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Página não encontrada');
      return;
    }

    // Determine content type
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Serve file
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType);
    const stream = fs.createReadStream(filePath);
    stream.on('error', (streamErr) => {
      console.error(`Erro ao ler arquivo: ${streamErr.message}`);
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Erro interno do servidor');
      }
    });
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('===================================================');
  console.log(` Servidor local iniciado com sucesso!`);
  console.log(` Endereço: ${url}`);
  console.log('===================================================');
  console.log(' Pressione Ctrl+C para encerrar o servidor.');
  
  // Auto-open browser on Windows
  exec(`start ${url}`, (err) => {
    if (err) {
      console.log(` Por favor, abra o navegador e aceda a: ${url}`);
    }
  });
});
