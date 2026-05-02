const express = require('express');
const { createServer: createViteServer } = require('vite');
const path = require('path');

async function createServer() {
  const app = express();
  const vite = await createViteServer({
    server: { middlewareMode: 'ssr' },
    appType: 'react',
  });

  app.use(vite.middlewares);

  app.use('*', async (req, res) => {
    const template = await vite.transformIndexHtml(req.originalUrl, `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WMS 仓储管理系统</title>
      </head>
      <body>
        <div id="root"></div>
        <script type="module" src="/src/index.jsx"></script>
      </body>
      </html>
    `);
    res.send(template);
  });

  app.listen(9999, () => {
    console.log('Server running on http://localhost:9999');
  });
}

createServer();