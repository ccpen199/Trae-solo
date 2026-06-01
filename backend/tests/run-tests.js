require('dotenv').config({ path: '../../.env' });

console.log('='.repeat(60));
console.log('企业密码保险库 - 测试套件');
console.log('='.repeat(60));
console.log();

console.log('📋 测试分类:');
console.log('  1. 正常用例 - 预期成功的场景');
console.log('  2. 边界用例 - 极限值和边缘情况');
console.log('  3. 冲突用例 - 重复操作和状态冲突');
console.log('  4. 失败用例 - 预期失败的场景');
console.log();

require('./test-cases.js');

console.log();
console.log('📁 测试路径:');
console.log('  加密工具: backend/src/utils/encryption.js');
console.log('  数据库: backend/src/database/schema.js');
console.log('  API路由: backend/src/routes/*.js');
console.log('  前端页面: frontend/src/pages/*.jsx');
