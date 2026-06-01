const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:56383/api';
let token = '';

async function init() {
  try {
    console.log('=== 登录获取token ===');
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    token = loginRes.data.token;
    console.log('登录成功');
    console.log('');

    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    console.log('=== 创建订单服务应用 ===');
    const app1Res = await axios.post(`${BASE_URL}/applications`, {
      name: '订单服务',
      description: '电商订单核心服务，处理用户下单、支付、发货等流程',
      environment: 'prod',
      version: '2.1.0',
      owner_id: 1,
      status: 'active'
    }, config);
    const app1Id = app1Res.data.id;
    console.log('订单服务创建成功，ID:', app1Id);
    console.log('');

    console.log('=== 创建用户中心应用 ===');
    const app2Res = await axios.post(`${BASE_URL}/applications`, {
      name: '用户中心',
      description: '用户认证与信息管理服务，包含登录、注册、用户信息维护',
      environment: 'prod',
      version: '1.5.2',
      owner_id: 5,
      status: 'active'
    }, config);
    const app2Id = app2Res.data.id;
    console.log('用户中心创建成功，ID:', app2Id);
    console.log('');

    console.log('=== 为订单服务创建脱敏规则 ===');
    const rules1 = [
      { name: '手机号脱敏', description: '订单日志中手机号脱敏', rule_type: 'phone', pattern: '1[3-9]\\d{9}', replacement: '138****0000' },
      { name: '身份证号脱敏', description: '订单收货人身份证脱敏', rule_type: 'idCard', pattern: '\\d{17}[\\dXx]', replacement: '****************' },
      { name: '银行卡号脱敏', description: '支付银行卡号脱敏', rule_type: 'bankCard', pattern: '\\d{16,19}', replacement: '**** **** **** ****' },
      { name: '邮箱地址脱敏', description: '用户邮箱脱敏', rule_type: 'email', pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}', replacement: '***@example.com' },
    ];
    for (const rule of rules1) {
      await axios.post(`${BASE_URL}/rules`, { ...rule, app_id: app1Id }, config);
      console.log(' -', rule.name);
    }
    console.log('');

    console.log('=== 为用户中心创建脱敏规则 ===');
    const rules2 = [
      { name: '用户姓名脱敏', description: '用户真实姓名脱敏', rule_type: 'name', pattern: '([\\u4e00-\\u9fa5]{2,4})', replacement: '*先生/女士' },
      { name: '手机号脱敏', description: '用户手机号脱敏', rule_type: 'phone', pattern: '1[3-9]\\d{9}', replacement: '139****8888' },
    ];
    for (const rule of rules2) {
      await axios.post(`${BASE_URL}/rules`, { ...rule, app_id: app2Id }, config);
      console.log(' -', rule.name);
    }
    console.log('');

    console.log('=== 创建示例变更单 ===');
    await axios.post(`${BASE_URL}/change-orders`, {
      app_id: app1Id,
      change_type: 'rule_add',
      title: '新增收货地址脱敏规则',
      description: '为订单服务新增收货地址字段脱敏规则',
      old_value: '无',
      new_value: '新增地址脱敏规则，隐藏详细门牌号',
      risk_level: 'low',
      rollback_plan: '删除新增规则即可回滚'
    }, config);
    console.log('变更单创建成功');
    console.log('');

    console.log('=== 示例数据初始化完成 ===');
    console.log('订单服务 ID:', app1Id);
    console.log('用户中心 ID:', app2Id);
    console.log('');
    console.log('请刷新前端页面查看数据');

  } catch (error) {
    console.error('初始化失败:', error.response?.data || error.message);
  }
}

init();
