const db = require('./src/models/database');

function initSystemData() {
  console.log('🔧 系统数据初始化检查...\n');
  
  const appCount = db.prepare('SELECT COUNT(*) as c FROM applications').get().c;
  
  if (appCount === 0) {
    console.log('📝 数据库为空，将只初始化系统基础数据（用户、角色）');
    console.log('💡 请通过前端页面创建真实的应用资源\n');
  } else {
    console.log(`📊 已有 ${appCount} 个应用资源存在于数据库\n`);
  }
  
  console.log('✅ 系统初始化完成');
  console.log('');
  console.log('📋 当前数据统计:');
  console.log('  应用总数:', db.prepare('SELECT COUNT(*) as c FROM applications').get().c);
  console.log('  用户数量:', db.prepare('SELECT COUNT(*) as c FROM users').get().c);
  console.log('  角色数量:', db.prepare('SELECT COUNT(*) as c FROM roles').get().c);
}

initSystemData();
