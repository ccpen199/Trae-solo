const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src/routes');

fs.readdirSync(routesDir).forEach(file => {
  if (!file.endsWith('.js')) return;
  
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 替换 db.prepare 调用为 await db.prepare
  content = content.replace(/db\.prepare\(([^)]+)\)\.(all|get|run)\(/g, 'await db.prepare($1).$2(');
  content = content.replace(/db\.(all|get|run|exec)\(/g, 'await db.$1(');
  
  // 替换 router 函数为 async
  content = content.replace(/router\.(get|post|put|delete)\((['"][^'"]+['"]),\s*([^=]*?)(req,\s*res)\s*=>\s*\{/g, (match, method, path, middleware, reqRes) => {
    if (middleware.includes('async')) return match;
    return `router.${method}(${path}, ${middleware}async (req, res) => {`;
  });
  
  // 简单情况：没有 middleware
  content = content.replace(/router\.(get|post|put|delete)\(\s*(['"][^'"]+['"])\s*,\s*\(req,\s*res\)\s*=>\s*\{/g, 'router.$1($2, async (req, res) => {');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
});

console.log('All route files fixed!');
