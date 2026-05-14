const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src/routes');

fs.readdirSync(routesDir).forEach(file => {
  if (!file.endsWith('.js')) return;
  
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove any existing async added incorrectly
  content = content.replace(/, async async \(req, res\) => {/g, ', async (req, res) => {');
  content = content.replace(/\(req, res\) => async {/g, 'async (req, res) => {');
  
  // 替换 router 函数为 async - 简单直接的方式
  content = content.replace(/(router\.(get|post|put|delete)\(\s*['"][^'"]+['"]\s*,\s*)(\(req,\s*res\)\s*=>\s*\{)/g, (match, before, method, handler) => {
    if (handler.includes('async')) return match;
    return before + 'async ' + handler;
  });
  
  // 替换有 middleware 的情况
  content = content.replace(/(router\.(get|post|put|delete)\(\s*['"][^'"]+['"]\s*,\s*)([^,()]+?)(\s*\(req,\s*res\)\s*=>\s*\{)/g, (match, before, method, middleware, handler) => {
    if (handler.includes('async')) return match;
    if (middleware.includes('async')) return match;
    return before + middleware + ' async ' + handler;
  });
  
  // Replace db.prepare and db calls with await
  // First remove any duplicate awaits
  content = content.replace(/await await /g, 'await ');
  
  // Add await to prepare calls
  content = content.replace(/([^a-zA-Z])db\.prepare/g, '$1await db.prepare');
  content = content.replace(/^db\.prepare/g, 'await db.prepare');
  
  // Add await to db.all, db.get, db.run, db.exec
  content = content.replace(/([^a-zA-Z])db\.(all|get|run|exec)\(/g, '$1await db.$2(');
  content = content.replace(/^db\.(all|get|run|exec)\(/g, 'await db.$1(');
  
  // Fix any duplicated awaits again
  content = content.replace(/await await /g, 'await ');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
});

console.log('All route files fixed!');
