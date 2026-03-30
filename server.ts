import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { existsSync } from 'node:fs';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');

  server.use(
    '/',
    express.static(browserDistFolder, {
      maxAge: '1y',
      index: false,
      redirect: false,
    })
  );

  server.get('*', (req, res) => {
    const urlPath = req.path.replace(/\/$/, '');
    const prerendered = join(browserDistFolder, urlPath, 'index.html');

    if (existsSync(prerendered)) {
      res.sendFile(prerendered);
    } else {
      res.sendFile(join(browserDistFolder, 'index.html'));
    }
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
