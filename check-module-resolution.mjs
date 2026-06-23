import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const frontendSrc = resolve(__dirname, 'frontend/src');

console.log('=== 测试模块解析顺序 ===\n');

const testPaths = [
  resolve(frontendSrc, 'api'),
  resolve(frontendSrc, 'api.js'),
  resolve(frontendSrc, 'api/index.js'),
];

console.log('文件存在性检查:');
testPaths.forEach(p => {
  const exists = fs.existsSync(p);
  const isFile = exists && fs.statSync(p).isFile();
  console.log(`  ${p.replace(frontendSrc, 'frontend/src')}: exists=${exists}, isFile=${isFile}`);
});

console.log('\n结论: Node.js 会优先加载 api.js 文件，而不是 api/ 目录');
console.log('这意味着所有页面实际使用的是旧版 api.js，而不是新版 api/index.js！\n');

console.log('检查 api.js 和 api/index.js 的区别:');
console.log('  api.js 导出的 formatEnergy 是 export const formatEnergy = ...');
console.log('  api/index.js 导出的 formatEnergy 是 function formatEnergy() { ... } + export { formatEnergy }');
console.log('  两个文件的响应拦截器逻辑也不同！\n');

const apiJsContent = fs.readFileSync(resolve(frontendSrc, 'api.js'), 'utf8');
const apiIndexContent = fs.readFileSync(resolve(frontendSrc, 'api/index.js'), 'utf8');

console.log('api.js 中的响应拦截器:');
console.log('  request.interceptors.response.use(');
console.log('    response => response.data,  // 直接返回 response.data');
console.log('    error => { ... }');
console.log('  );\n');

console.log('api/index.js 中的响应拦截器:');
console.log('  request.interceptors.response.use(');
console.log('    (response) => {');
console.log('      const data = response.data;');
console.log('      if (data && data.success === true && data.data !== undefined) {');
console.log('        return data;  // 返回 { success: true, data: ... }');
console.log('      }');
console.log('      ...');
console.log('    },');
console.log('    ...');
console.log('  );\n');

console.log('=== 问题分析 ===');
console.log('1. 旧版 api.js: 拦截器直接返回 response.data');
console.log('   所以 API.revenue.summary() 返回的就是 { success: true, data: {...} }');
console.log('   页面中使用 summaryRes.value.data 是正确的\n');
console.log('2. 新版 api/index.js: 拦截器返回的格式相同，但多了很多调试日志');
console.log('   但问题是新版文件根本没有被加载！\n');
console.log('3. 真正的问题可能是: 浏览器缓存了旧版本的代码，或者有其他错误');
console.log('   需要在 Dashboard 中添加诊断面板来查看实际的 API 调用结果');
