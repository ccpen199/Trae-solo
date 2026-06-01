const http = require('http');

const API_BASE = 'http://127.0.0.1:53395';
const AUTH_HEADER = { 'X-User-Id': '1', 'Content-Type': 'application/json' };

function request(method, path, data = null, timeout = 30000) {
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
          resolve(body ? JSON.parse(body) : {});
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

const apps = [
  {
    name: '电商平台',
    type: 'web',
    status: 'production',
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
const changeTitles = {
  config: '配置更新',
  secret_rotation: '密钥轮换',
  feature: '功能发布',
  bugfix: 'Bug修复'
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function createCompleteBusinessData() {
  console.log('🚀 创建完整业务链路数据...\n');
  
  let stats = { apps: 0, envs: 0, secrets: 0, changes: 0, tasks: 0, alerts: 0 };
  const createdApps = [];
  
  for (const appData of apps) {
    try {
      console.log(`📱 创建应用: ${appData.name}`);
      const app = await request('POST', '/applications', {
        name: appData.name,
        type: appData.type,
        status: appData.status,
        description: appData.description,
        callback_urls: appData.callback_urls,
        owner_id: 4
      });
      console.log(`   ✅ ${app.app_id}`);
      stats.apps++;
      createdApps.push({ id: app.id, name: appData.name, app_id: app.app_id });
      await sleep(50);
      
      const envs = [];
      for (const envData of appData.environments) {
        try {
          console.log(`   🌍 环境: ${envData.name}`);
          const env = await request('POST', '/environments', {
            app_id: app.id,
            name: envData.name,
            type: envData.type,
            base_url: envData.base_url,
            description: `${appData.name}-${envData.name}`
          });
          envs.push({ id: env.id, name: envData.name, type: envData.type });
          stats.envs++;
          await sleep(50);
          
          const numSecrets = envData.type === 'production' ? 3 : 2;
          for (let i = 0; i < numSecrets; i++) {
            try {
              const secretType = secretTypes[Math.floor(Math.random() * secretTypes.length)];
              const levels = ['normal', 'sensitive', 'critical'];
              const level = envData.type === 'production' ? levels[Math.floor(Math.random() * 3)] : levels[Math.floor(Math.random() * 2)];
              
              await request('POST', '/secrets', {
                app_id: app.id,
                env_id: env.id,
                name: `${envData.name}-${secretType}-${i + 1}`,
                secret_type: secretType,
                secret_key: `sk_${Math.random().toString(36).substring(2, 18)}_${Date.now()}`,
                level,
                expires_at: new Date(Date.now() + (30 - i * 5) * 24 * 60 * 60 * 1000).toISOString(),
                description: `用于${envData.name}的${secretType}密钥`
              });
              stats.secrets++;
              await sleep(50);
            } catch (e) {}
          }
        } catch (e) {
          console.log(`   ⚠️ 环境创建失败: ${e.message}`);
        }
      }
      
      const numChanges = 2 + Math.floor(Math.random() * 2);
      for (let c = 0; c < numChanges && envs.length > 0; c++) {
        try {
          const changeType = changeTypes[Math.floor(Math.random() * changeTypes.length)];
          const env = envs[Math.floor(Math.random() * envs.length)];
          
          console.log(`   📝 变更单: ${changeTitles[changeType]}`);
          const change = await request('POST', '/change-orders', {
            app_id: app.id,
            env_id: env.id,
            title: `${changeTitles[changeType]}-${appData.name}`,
            type: changeType,
            description: `对${appData.name}的${env.name}进行${changeTitles[changeType]}`,
            reason: ['业务需求迭代', '安全合规要求', '性能优化', 'Bug修复'][Math.floor(Math.random() * 4)],
            impact: `${appData.name}的${env.name}服务`,
            recovery_path: '通过审计日志回滚到上一版本',
            change_content: JSON.stringify({ action: changeType, timestamp: Date.now() })
          });
          stats.changes++;
          await sleep(50);
          
          if (c === 0 || Math.random() > 0.3) {
            try {
              await request('POST', `/change-orders/${change.id}/approve`, {
                comment: '审核通过，按计划执行'
              });
              await sleep(50);
              
              await request('POST', `/change-orders/${change.id}/execute`);
              await sleep(100);
              
              try {
                const tasks = await request('GET', `/change-orders/${change.id}`);
                if (tasks.tasks && tasks.tasks.length > 0) {
                  for (const task of tasks.tasks) {
                    stats.tasks++;
                  }
                }
              } catch (e) {}
            } catch (e) {}
          }
        } catch (e) {}
      }
    } catch (e) {
      console.log(`   ❌ 应用创建失败: ${e.message}`);
    }
  }
  
  console.log('\n📊 已创建:');
  console.log(`   应用: ${stats.apps}`);
  console.log(`   环境: ${stats.envs}`);
  console.log(`   密钥: ${stats.secrets}`);
  console.log(`   变更单: ${stats.changes}`);
  console.log(`   任务: ${stats.tasks}`);
  
  try {
    const result = await request('GET', '/dashboard/stats');
    console.log('\n📊 数据库统计:');
    console.log(`   应用: ${result.data.applications}`);
    console.log(`   环境: ${result.data.environments}`);
    console.log(`   密钥: ${result.data.active_secrets}`);
    console.log(`   告警: ${result.data.open_alerts}`);
    console.log(`   待审批: ${result.data.pending_changes}`);
    console.log(`   运行中: ${result.data.running_tasks}`);
  } catch (e) {}
  
  console.log('\n✅ 数据创建完成！');
}

createCompleteBusinessData().catch(err => {
  console.error('❌ 失败:', err.message);
  process.exit(1);
});
