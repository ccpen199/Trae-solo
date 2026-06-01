const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'data/app.sqlite');
const db = new sqlite3.Database(dbPath);

const appId1 = 'APP-' + uuidv4().slice(0, 8).toUpperCase();
const appId2 = 'APP-' + uuidv4().slice(0, 8).toUpperCase();
const apiKey1 = 'API-' + uuidv4().replace(/-/g, '');
const apiKey2 = 'API-' + uuidv4().replace(/-/g, '');

db.serialize(() => {
  db.run(`PRAGMA foreign_keys = OFF`);

  // 插入示例应用
  db.run(`
    INSERT INTO applications (app_id, name, description, environment, version, owner_id, status, api_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [appId1, '订单服务', '电商订单核心服务，处理用户下单、支付、发货等流程', 'prod', '2.1.0', 1, 'active', apiKey1]);

  db.run(`
    INSERT INTO applications (app_id, name, description, environment, version, owner_id, status, api_key)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [appId2, '用户中心', '用户认证与信息管理服务，包含登录、注册、用户信息维护', 'prod', '1.5.2', 5, 'active', apiKey2]);

  db.get(`SELECT id FROM applications WHERE app_id = ?`, [appId1], (err, row1) => {
    if (row1) {
      const app1Id = row1.id;
      
      // 为订单服务创建脱敏规则
      const rules1 = [
        { name: '手机号脱敏', rule_type: 'phone', pattern: '1[3-9]\\d{9}', replacement: '138****0000' },
        { name: '身份证号脱敏', rule_type: 'idCard', pattern: '\\d{17}[\\dXx]', replacement: '****************' },
        { name: '银行卡号脱敏', rule_type: 'bankCard', pattern: '\\d{16,19}', replacement: '**** **** **** ****' },
        { name: '邮箱地址脱敏', rule_type: 'email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', replacement: '***@example.com' },
      ];

      rules1.forEach((rule, idx) => {
        db.run(`
          INSERT INTO mask_rules (app_id, name, description, rule_type, pattern, replacement, version, is_active, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
        `, [app1Id, rule.name, `${rule.name}规则配置`, rule.rule_type, rule.pattern, rule.replacement, idx + 1]);
      });
    }
  });

  db.get(`SELECT id FROM applications WHERE app_id = ?`, [appId2], (err, row2) => {
    if (row2) {
      const app2Id = row2.id;
      
      // 为用户中心创建脱敏规则
      const rules2 = [
        { name: '用户姓名脱敏', rule_type: 'name', pattern: '([\\u4e00-\\u9fa5]{2,4})', replacement: '*先生/女士' },
        { name: '手机号脱敏', rule_type: 'phone', pattern: '1[3-9]\\d{9}', replacement: '139****8888' },
        { name: '登录密码掩码', rule_type: 'custom', pattern: '"password":"[^"]+"', replacement: '"password":"********"' },
      ];

      rules2.forEach((rule, idx) => {
        db.run(`
          INSERT INTO mask_rules (app_id, name, description, rule_type, pattern, replacement, version, is_active, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1)
        `, [app2Id, rule.name, `${rule.name}规则配置`, rule.rule_type, rule.pattern, rule.replacement, idx + 1]);
      });
    }
  });

  console.log('示例数据初始化完成！');
  console.log(`- 订单服务 (${appId1})`);
  console.log(`- 用户中心 (${appId2})`);
  console.log('');
  console.log('每个应用都已配置了对应的脱敏规则');

  db.close();
});
