const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 48880;

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, '127.0.0.1', () => {
  const logContent = `
================================================
知识产权全生命周期服务平台前端服务启动成功
监听地址: http://127.0.0.1:${PORT}
静态文件目录: ${path.join(__dirname, 'dist')}
启动时间: ${new Date().toLocaleString('zh-CN')}
================================================
  `;
  console.log(logContent);
  fs.writeFileSync(path.join(__dirname, '../frontend.log'), logContent);
});
