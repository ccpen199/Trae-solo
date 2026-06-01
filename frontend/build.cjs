const fs = require('fs');
const path = require('path');
const babel = require('@babel/standalone');

const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

const scriptMatch = htmlContent.match(/<script type="text\/babel"[^>]*>([\s\S]*?)<\/script>/);
if (!scriptMatch) {
  console.error('未找到 Babel 脚本');
  process.exit(1);
}

const jsxCode = scriptMatch[1];

console.log('正在编译 JSX...');
try {
  const result = babel.transform(jsxCode, {
    presets: ['react'],
    filename: 'app.jsx'
  });
  
  const compiledCode = result.code;
  
  const newHtmlContent = htmlContent.replace(
    /<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/babel-standalone[^"]*"><\/script>/,
    ''
  ).replace(
    /<script type="text\/babel"[^>]*>[\s\S]*?<\/script>/,
    '<script src="./app.js"></script>'
  ).replace(
    /<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/react\/[^"]*"><\/script>/,
    '<script src="./react.min.js"></script>'
  ).replace(
    /<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/react-dom\/[^"]*"><\/script>/,
    '<script src="./react-dom.min.js"></script>'
  );
  
  fs.writeFileSync(path.join(__dirname, 'app.js'), compiledCode, 'utf-8');
  fs.writeFileSync(path.join(__dirname, 'index.html'), newHtmlContent, 'utf-8');
  
  console.log('编译完成！已生成 app.js 和更新 index.html');
  console.log(`编译后代码大小: ${compiledCode.length} 字节`);
} catch (err) {
  console.error('编译失败:', err.message);
  process.exit(1);
}
