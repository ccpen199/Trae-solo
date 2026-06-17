const path = require('path');
const fs = require('fs');

console.log('=== database.js 的路径 ===');
const dbDataDir = path.join('/Users/chen/Documents/trae_projects/local_projects/may-89214/backend/src/db', '..', 'data');
console.log('dataDir:', dbDataDir);
console.log('exists:', fs.existsSync(dbDataDir));
if (fs.existsSync(dbDataDir)) {
  fs.readdirSync(dbDataDir).forEach(f => {
    const stat = fs.statSync(path.join(dbDataDir, f));
    console.log('  ', f, 'size=' + stat.size, 'mtime=' + stat.mtime.toLocaleString());
  });
}

console.log('\n=== _fix.js 的路径 ===');
const fixDataDir = path.join('/Users/chen/Documents/trae_projects/local_projects/may-89214/backend', 'src', 'data');
console.log('dataDir:', fixDataDir);
console.log('same?', dbDataDir === fixDataDir);
console.log('realpath db:', fs.realpathSync(dbDataDir));
console.log('realpath fix:', fs.realpathSync(fixDataDir));

console.log('\n=== 当前 cwd ===');
console.log('cwd:', process.cwd());

console.log('\n=== 全局搜索 *.sqlite ===');
const find = (dir, depth = 0) => {
  if (depth > 4) return;
  try {
    fs.readdirSync(dir).forEach(f => {
      const full = path.join(dir, f);
      try {
        if (fs.statSync(full).isDirectory()) {
          find(full, depth + 1);
        } else if (f.endsWith('.sqlite') || f.includes('sqlite')) {
          console.log('  FOUND:', full, 'size=' + fs.statSync(full).size);
        }
      } catch (e) {}
    });
  } catch (e) {}
};
find('/Users/chen/Documents/trae_projects/local_projects/may-89214');
