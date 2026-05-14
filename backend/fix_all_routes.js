const fs = require('fs');
const path = require('path');

const routesDir = path.join(__dirname, 'src/routes');

const files = [
  'answer.js',
  'article.js',
  'comment.js',
  'category.js',
  'favorite.js',
  'follow.js',
  'message.js',
  'search.js',
  'activity.js',
  'admin.js'
];

files.forEach(file => {
  const filePath = path.join(routesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 替换所有 db.prepare, db.all, db.get, db.run, db.exec 为 await 版本
  // 确保不要重复添加 await
  content = content.replace(/(\s)(db\.prepare\()/g, '$1await $2');
  content = content.replace(/(\s)(db\.(all|get|run|exec)\()/g, '$1await $2');
  
  // 替换 router 函数为 async
  content = content.replace(
    /router\.(get|post|put|delete)\((['"][^'"]+['"]),\s*([^=]*?)\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*\{/g,
    (match, method, path, middleware) => {
      if (middleware.includes('async')) return match;
      return `router.${method}(${path}, ${middleware} async (req, res) => {`;
    }
  );
  
  // 简单情况（没有 middleware）
  content = content.replace(
    /router\.(get|post|put|delete)\(\s*(['"][^'"]+['"])\s*,\s*\(\s*req\s*,\s*res\s*\)\s*=>\s*\{/g,
    'router.$1($2, async (req, res) => {'
  );
  
  // 修复可能重复的 async
  content = content.replace(/,\s*async\s*async\s*\(/g, ', async (');
  
  // 修复辅助函数
  if (file === 'answer.js' || file === 'article.js' || file === 'comment.js') {
    content = content.replace(
      /const\s+createNotification\s*=\s*\(\s*db\s*,\s*\{/g,
      'const createNotification = async (db, {'
    );
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
});

console.log('All route files fixed!');
