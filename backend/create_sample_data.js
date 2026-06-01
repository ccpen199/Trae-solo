const http = require('http');

const API_BASE = 'http://127.0.0.1:53395';
const AUTH_HEADER = { 'X-User-Id': '1', 'Content-Type': 'application/json' };

function request(method, path, data = null, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + '/api' + path);
    const options = {
      method,
      headers: AUTH_HEADER,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      timeout
    };
    if (data) {
      options.headers['Content-Length'] = Buffer.from(JSON.stringify(data)).length;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(body || '{}'));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

const sampleApps = [
  {
    name: '电商平台',
    type: 'web',
    status: 'production',
    owner_id: 4,
    description: '面向消费者的在线购物平台，支持商品浏览、下单、支付等完整交易流程',
    callback_urls: ['https://shop.example.com/callback', 'https://shop.example.com/sso/callback'],
    environments: [
      { name: '开发环境', type: 'development', base_url: 'http://dev.shop.example.com' },
      { name: '测试环境', type: 'testing', base_url: 'http://test.shop.example.com' },
      { name: '生产环境', type: 'production', base_url: 'https://shop.example.com' }
    ]
  },
  {
    name: '企业OA系统',
    type: 'web',
    status: 'production',
    owner_id: 4,
    description: '企业内部办公自动化系统，包含审批、考勤、公告等模块',
    callback_urls: ['https://oa.example.com/login/callback'],
    environments: [
      { name: '开发环境', type: 'development', base_url: 'http://dev.oa.example.com' },
      { name: '生产环境', type: 'production', base_url: 'https://oa.example.com' }
    ]
  },
  {
    name: '数据中台API',
    type: 'api',
    status: 'testing',
    owner_id: 4,
    description: '企业级数据中台，提供统一的数据访问接口和分析能力',
    callback_urls: [],
    environments: [
      { name: '开发环境', type: 'development', base_url: 'http://dev.data.example.com' },
      { name: '测试环境', type: 'testing', base_url: 'http://test.data.example.com' }
    ]
  },
  {
    name: '移动CRM',
    type: 'mobile',
    status: 'development',
    owner_id: 4,
    description: '移动端客户关系管理系统，支持销售线索跟进、客户拜访等功能',
    callback_urls: ['crmapp://sso/callback'],
    environments: [
      { name: '开发环境', type: 'development', base_url: 'http://dev.crm.example.com' }
    ]
  },
  {
    name: '运维监控平台',
    type: 'web',
    status: 'production',
    owner_id: 4,
    description: '统一运维监控平台，提供服务器、应用、数据库的监控告警能力',
    callback_urls: ['https://monitor.example.com/auth/callback'],
    environments: [
      { name: '开发环境', type: 'development', base_url: 'http://dev.monitor.example.com' },
      { name: '测试环境', type: 'testing', base_url: 'http://test.monitor.example.com' },
      { name: '生产环境', type: 'production', base_url: 'https://monitor.example.com' }
    ]
  }
];

const secretTypes = ['client_secret', 'api_key', 'certificate', 'private_key'];
const changeTypes = ['config', 'secret_rotation', 'feature', 'bugfix'];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createSampleData() {
  console.log('🚀 开始通过 API 创建示例业务数据...\n');
  
  let createdApps = 0, createdEnvs = 0, createdSecrets = 0, createdChanges = 0, createdTasks = 0;
  
  for (const appData of sampleApps) {
    try {
      console.log(`📱 创建应用: ${appData.name}`);
      const app = await request('POST', '/applications', appData);
      console.log(`   ✅ 应用ID: ${app.app_id}`);
      createdApps++;
      await sleep(100);
      
      for (const envData of appData.environments) {
        try {
          console.log(`   🌍 创建环境: ${envData.name}`);
          const env = await request('POST', '/environments', {
            app_id: app.id,
            name: envData.name,
            type: envData.type,
            base_url: envData.base_url,
            description: `${appData.name}的${envData.name}`
          });
          console.log(`      ✅ 环境ID: ${env.id}`);
          createdEnvs++;
          await sleep(100);
          
          const numSecrets = envData.type === 'production' ? 3 : 2;
          for (let i = 0; i < numSecrets; i++) {
            try {
              const secretType = secretTypes[Math.floor(Math.random() * secretTypes.length)];
              const levels = ['normal', 'sensitive', 'critical'];
              const level = envData.type === 'production' 
                ? levels[Math.floor(Math.random() * 3)] 
                : levels[Math.floor(Math.random() * 2)];
              
              console.log(`      🔑 创建密钥: ${secretType}`);
              await request('POST', '/secrets', {
                app_id: app.id,
                env_id: env.id,
                name: `${envData.name}-${secretType}-${i + 1}`,
                secret_type: secretType,
                secret_key: `sk_${Math.random().toString(36).substring(2, 18)}_${Date.now()}`,
                level,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                description: `用于${envData.name}的${secretType}密钥`
              });
              createdSecrets++;
              await sleep(100);
            } catch (e) {
              console.log(`      ⚠️  密钥创建失败: ${e.message}`);
            }
          }
        } catch (e) {
          console.log(`      ⚠️  环境创建失败: ${e.message}`);
        }
      }
      
      if (Math.random() > 0.3) {
        try {
          console.log(`   📝 创建变更单`);
          const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
          const changeTitle = `${changeType === 'config' ? '更新' : changeType === 'secret_rotation' ? '轮换' : changeType === 'feature' ? '发布' : '修复'}${appData.name}配置`;
          const changeDesc = `对${appData.name}进行${changeType === 'config' ? '配置更新' : changeType === 'secret_rotation' ? '密钥轮换' : changeType === 'feature' ? '功能发布' : 'Bug修复'}操作`;
          
          const change = await request('POST', '/change-orders', {
            app_id: app.id,
            title: changeTitle,
            type: changeType,
            description: changeDesc,
            reason: '业务需求迭代',
            impact: `${appData.name}的相关服务`,
            recovery_path: '通过审计日志回滚到上一版本',
            change_content: JSON.stringify({ action: changeType, timestamp: Date.now() })
          });
          console.log(`      ✅ 变更单号: ${change.change_no}`);
          createdChanges++;
          await sleep(100);
          
          if (Math.random() > 0.5) {
            try {
              console.log(`      ✅ 审批通过变更单`);
              await request('POST', `/change-orders/${change.id}/approve`, {
                comment: '审核通过，按计划执行'
              });
              await sleep(100);
              
              console.log(`      ⚡ 执行变更单`);
              await request('POST', `/change-orders/${change.id}/execute`);
              createdTasks++;
              await sleep(100);
            } catch (e) {
              console.log(`      ⚠️  变更执行失败: ${e.message}`);
            }
          }
        } catch (e) {
          console.log(`      ⚠️  变更单创建失败: ${e.message}`);
        }
      }
    } catch (e) {
      console.log(`   ❌ 应用创建失败: ${e.message}`);
    }
    console.log('');
  }
  
  console.log('📊 创建统计:');
  console.log(`  应用: ${createdApps}`);
  console.log(`  环境: ${createdEnvs}`);
  console.log(`  密钥: ${createdSecrets}`);
  console.log(`  变更单: ${createdChanges}`);
  console.log(`  执行任务: ${createdTasks}`);
  console.log('');
  
  try {
    console.log('📊 数据库统计:');
    const stats = await request('GET', '/dashboard/stats');
    console.log(`  应用总数: ${stats.data.applications}`);
    console.log(`  环境数量: ${stats.data.environments}`);
    console.log(`  活跃密钥: ${stats.data.active_secrets}`);
    console.log(`  开放告警: ${stats.data.open_alerts}`);
    console.log(`  待审批变更: ${stats.data.pending_changes}`);
    console.log(`  运行中任务: ${stats.data.running_tasks}`);
  } catch (e) {
    console.log('  ⚠️  获取统计失败');
  }
  
  console.log('');
  console.log('✅ 示例数据创建完成！');
  console.log('');
  console.log('🌐 访问 http://127.0.0.1:44395 查看效果');
}

createSampleData().catch(err => {
  console.error('❌ 创建失败:', err.message);
  process.exit(1);
});
