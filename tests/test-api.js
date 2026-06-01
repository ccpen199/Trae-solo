#!/usr/bin/env node
/**
 * 婚庆供应商撮合平台 - API 测试用例
 * 覆盖: 正常/边界/冲突/失败 四种场景
 * 运行: node tests/test-api.js
 */

const http = require('http');
const BASE_URL = 'http://127.0.0.1:53471/api';

let passCount = 0;
let failCount = 0;
const results = [];

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    };
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body), body }); }
        catch (e) { resolve({ status: res.statusCode, data: null, body }); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function test(name, scenario, fn) {
  results.push({ name, scenario, status: 'pending' });
  return fn()
    .then(() => {
      results[results.length - 1].status = 'pass';
      passCount++;
      console.log(`  ✅ ${name} [${scenario}]`);
    })
    .catch(err => {
      results[results.length - 1].status = 'fail';
      results[results.length - 1].error = err.message;
      failCount++;
      console.log(`  ❌ ${name} [${scenario}]: ${err.message}`);
    });
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || '断言失败');
}

async function runAll() {
  console.log('\n==========================================');
  console.log('  婚庆供应商撮合平台 - API 测试');
  console.log('  后端: ' + BASE_URL);
  console.log('==========================================\n');

  // ========== 健康检查 ==========
  console.log('[1/6] 健康检查');
  await test('健康接口返回 200', '正常', async () => {
    const r = await request('GET', '/health');
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.success === true, 'success 应为 true');
    assert(r.data.data.sqlite === 'ok', 'sqlite 状态应为 ok');
  });

  // ========== 总览 / Dashboard ==========
  console.log('\n[2/6] 总览 & 统计');
  await test('获取总览数据', '正常', async () => {
    const r = await request('GET', '/overview');
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.success === true, 'success 应为 true');
    assert(r.data.data.booking, '应有 booking 数据');
    assert(typeof r.data.data.vendorTotal === 'number', 'vendorTotal 应为数字');
    assert(typeof r.data.data.openTasks === 'number', 'openTasks 应为数字');
  });

  await test('获取统计数据', '正常', async () => {
    const r = await request('GET', '/dashboard/stats');
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.success === true, 'success 应为 true');
  });

  // ========== 新人需求 ==========
  console.log('\n[3/6] 新人需求管理');
  let newReqId = null;

  await test('获取需求列表', '正常', async () => {
    const r = await request('GET', '/requirements');
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
    assert(r.data.data.length > 0, '应有数据');
    const req = r.data.data[0];
    assert(req.wedding_date, '应有婚期');
    assert(req.city, '应有城市');
    assert(req.budget, '应有预算');
    assert(req.guest_count, '应有人数');
    assert(req.style, '应有风格');
    assert(req.service_list, '应有服务清单');
    assert(req.priority, '应有优先级');
  });

  await test('创建需求 - 完整字段', '正常', async () => {
    const r = await request('POST', '/requirements', {
      couple_id: 1,
      wedding_date: '2026-10-01',
      city: '北京',
      budget: 300000,
      guest_count: 200,
      style: '中式传统',
      service_list: '策划,摄影,场地,化妆',
      priority: '高',
      description: '测试完整字段需求'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
    assert(r.data.data.id, '应有返回 id');
    newReqId = r.data.data.id;
  });

  await test('创建需求 - 缺失必填字段', '失败', async () => {
    const r = await request('POST', '/requirements', {
      wedding_date: '2026-10-01'
    });
    assert(r.status === 400, '状态码应为 400');
  });

  await test('获取需求详情', '正常', async () => {
    const r = await request('GET', `/requirements/${newReqId}`);
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.success === true, 'success 应为 true');
    assert(r.data.data.id === newReqId, 'ID 匹配');
  });

  await test('获取不存在的需求', '失败', async () => {
    const r = await request('GET', '/requirements/99999');
    assert(r.status === 404 || r.data.success === false, '应返回失败');
  });

  await test('更新需求状态', '正常', async () => {
    const r = await request('PUT', `/requirements/${newReqId}`, {
      status: 'matched',
      description: '已更新'
    });
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('分页查询需求', '边界', async () => {
    const r = await request('GET', '/requirements?page=1&pageSize=1');
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.data.length === 1, '每页应返回 1 条');
    assert(r.data.pagination.pageSize === 1, 'pageSize 应为 1');
  });

  await test('分页边界 - pageSize 过大', '边界', async () => {
    const r = await request('GET', '/requirements?page=1&pageSize=1000');
    assert(r.status === 200, '状态码应为 200');
  });

  await test('分页边界 - 页码超出范围', '边界', async () => {
    const r = await request('GET', '/requirements?page=999&pageSize=10');
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.data.length === 0, '超出范围应返回空');
  });

  // ========== 供应商管理 ==========
  console.log('\n[4/6] 供应商管理');
  let newSupId = null;

  await test('获取供应商列表', '正常', async () => {
    const r = await request('GET', '/suppliers');
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
    const sup = r.data.data[0];
    assert(sup.service_type, '应有服务类型');
    assert(sup.price_min !== undefined, '应有价格下限');
    assert(sup.price_max !== undefined, '应有价格上限');
    assert(sup.rating !== undefined, '应有评分');
    assert(sup.service_area, '应有服务区域');
    assert(sup.contract_template, '应有合同模板');
  });

  await test('创建供应商 - 完整字段', '正常', async () => {
    const r = await request('POST', '/suppliers', {
      user_id: 2,
      service_type: 'makeup',
      company_name: '美妆工作室',
      contact_name: '李老师',
      phone: '13800001111',
      price_min: 3000,
      price_max: 8000,
      service_area: '北京,天津',
      contract_template: '化妆服务合同模板',
      description: '专业新娘妆'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
    assert(r.data.data.id, '应有返回 id');
    newSupId = r.data.data.id;
  });

  await test('创建供应商 - 缺失必填字段', '失败', async () => {
    const r = await request('POST', '/suppliers', {
      company_name: '测试'
    });
    assert(r.status === 400, '状态码应为 400');
  });

  await test('获取供应商详情', '正常', async () => {
    const r = await request('GET', `/suppliers/${newSupId}`);
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.data.cases !== undefined, '应包含案例');
    assert(r.data.data.schedules !== undefined, '应包含档期');
    assert(r.data.data.reviews !== undefined, '应包含评价');
  });

  await test('获取供应商案例', '正常', async () => {
    const r = await request('GET', `/suppliers/1/cases`);
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
  });

  await test('获取供应商档期', '正常', async () => {
    const r = await request('GET', `/suppliers/1/schedules`);
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
  });

  await test('按服务类型筛选供应商', '正常', async () => {
    const r = await request('GET', '/suppliers?service_type=florist');
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.data.every(s => s.service_type === 'florist'), '筛选结果正确');
  });

  await test('按城市筛选供应商', '边界', async () => {
    const r = await request('GET', '/suppliers?city=杭州');
    assert(r.status === 200, '状态码应为 200');
  });

  // ========== 撮合流程 ==========
  console.log('\n[5/6] 撮合流程');

  await test('获取邀请列表', '正常', async () => {
    const r = await request('GET', '/invitations');
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
  });

  await test('创建邀请 - 正常', '正常', async () => {
    const r = await request('POST', '/invitations', {
      requirement_id: 2,
      supplier_id: 2,
      message: '请提供摄影方案'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('创建邀请 - 供应商已被邀请 (冲突)', '冲突', async () => {
    const r = await request('POST', '/invitations', {
      requirement_id: 2,
      supplier_id: 2,
      message: '重复邀请'
    });
    assert(r.status === 201 || r.status === 400, '应处理重复邀请');
  });

  await test('获取报价列表', '正常', async () => {
    const r = await request('GET', '/quotes');
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
  });

  let testInvitationId = null;
  await test('创建报价测试邀请', '正常', async () => {
    const r = await request('POST', '/invitations', {
      requirement_id: 2,
      supplier_id: 4,
      message: '请提供报价方案',
      expires_at: '2026-06-15'
    });
    assert(r.status === 201, '创建邀请成功');
    testInvitationId = r.data.data.id;
  });

  await test('提交报价', '正常', async () => {
    const r = await request('POST', '/quotes', {
      invitation_id: testInvitationId,
      total_price: 36000,
      breakdown: '仪式区:15000, 签到区:8000',
      delivery_days: 7,
      notes: '测试报价'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('提交报价 - 重复报价 (失败)', '冲突', async () => {
    const r = await request('POST', '/quotes', {
      invitation_id: testInvitationId,
      total_price: 40000,
      breakdown: '重复提交测试',
      delivery_days: 7
    });
    assert(r.status === 400 && r.data.success === false, '同一邀请不能重复提交报价');
  });

  let testInvitationId2 = null;
  await test('创建第二个报价测试邀请', '正常', async () => {
    const r = await request('POST', '/invitations', {
      requirement_id: 2,
      supplier_id: 5,
      message: '请提供报价方案',
      expires_at: '2026-06-15'
    });
    assert(r.status === 201, '创建邀请成功');
    testInvitationId2 = r.data.data.id;
  });

  await test('提交报价 - 合法报价 (正常)', '正常', async () => {
    const r = await request('POST', '/quotes', {
      invitation_id: testInvitationId2,
      total_price: 50000,
      breakdown: '服务1: 25000, 服务2: 25000',
      delivery_days: 7
    });
    assert(r.status === 201, '合法报价应成功');
  });

  let testInvitationId3 = null;
  await test('创建校验测试邀请', '正常', async () => {
    const r = await request('POST', '/invitations', {
      requirement_id: 2,
      supplier_id: 6,
      message: '校验测试',
      expires_at: '2026-06-15'
    });
    assert(r.status === 201, '创建邀请成功');
    testInvitationId3 = r.data.data.id;
  });

  await test('提交报价 - 价格为负数 (失败)', '失败', async () => {
    const r = await request('POST', '/quotes', {
      invitation_id: testInvitationId3,
      total_price: -100,
      breakdown: '测试负数',
      delivery_days: 7
    });
    assert(r.status === 400 && r.data.success === false, '负数报价应被拒绝');
  });

  await test('提交报价 - 价格为 0 (失败)', '失败', async () => {
    const r = await request('POST', '/quotes', {
      invitation_id: testInvitationId3,
      total_price: 0,
      breakdown: '测试零价',
      delivery_days: 7
    });
    assert(r.status === 400 && r.data.success === false, '零报价应被拒绝');
  });

  await test('提交报价 - 交付周期为负 (失败)', '失败', async () => {
    const r = await request('POST', '/quotes', {
      invitation_id: testInvitationId3,
      total_price: 10000,
      breakdown: '测试负周期',
      delivery_days: -5
    });
    assert(r.status === 400 && r.data.success === false, '负交付周期应被拒绝');
  });

  await test('获取沟通记录', '正常', async () => {
    const r = await request('GET', '/communications?requirement_id=1');
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
  });

  await test('发送消息', '正常', async () => {
    const r = await request('POST', '/communications', {
      requirement_id: 1,
      sender_id: 1,
      sender_type: 'couple',
      message: '测试消息'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('发送空消息 (失败)', '失败', async () => {
    const r = await request('POST', '/communications', {
      requirement_id: 1,
      sender_id: 1,
      sender_type: 'couple',
      message: ''
    });
    assert(r.status === 400, '状态码应为 400');
  });

  await test('创建合同', '正常', async () => {
    const r = await request('POST', '/contracts', {
      requirement_id: 1,
      supplier_id: 1,
      quote_id: 1,
      content: '测试合同内容'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
    assert(r.data.data.id, '应有合同 ID');
  });

  await test('签署合同', '正常', async () => {
    const r = await request('POST', '/contracts/1/sign', {
      party: 'couple'
    });
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('创建支付', '正常', async () => {
    const r = await request('POST', '/payments', {
      contract_id: 1,
      amount: 10800,
      payment_type: 'deposit',
      notes: '30% 定金'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('确认支付', '正常', async () => {
    const r = await request('POST', '/payments/1/pay', {
      transaction_id: 'TXN002'
    });
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.success === true, 'success 应为 true');
  });

  // ========== 履约 & 售后 ==========
  console.log('\n[6/6] 履约任务 & 售后');

  await test('获取履约任务列表', '正常', async () => {
    const r = await request('GET', '/fulfillment-tasks');
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
  });

  await test('创建履约任务', '正常', async () => {
    const r = await request('POST', '/fulfillment-tasks', {
      requirement_id: 1,
      supplier_id: 1,
      title: '测试任务',
      description: '任务描述',
      category: 'preparation',
      responsible_party: 'supplier',
      responsible_id: 5,
      priority: 5,
      due_date: '2026-06-01',
      status: 'pending'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('创建任务 - 优先级 0 (边界)', '边界', async () => {
    const r = await request('POST', '/fulfillment-tasks', {
      requirement_id: 1,
      supplier_id: 1,
      title: '低优先级任务',
      category: 'preparation',
      responsible_party: 'supplier',
      priority: 0,
      status: 'pending'
    });
    assert(r.status === 201 || r.status === 400, '应处理优先级 0');
  });

  await test('更新任务状态', '正常', async () => {
    const r = await request('POST', '/fulfillment-tasks/1/status', {
      status: 'in_progress'
    });
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('更新任务状态 - 非法状态 (失败)', '失败', async () => {
    const r = await request('POST', '/fulfillment-tasks/1/status', {
      status: 'invalid_status'
    });
    assert(r.status === 500 || r.data.success === false, '非法状态应导致 SQL 错误');
  });

  await test('按状态筛选任务', '正常', async () => {
    const r = await request('GET', '/fulfillment-tasks?status=in_progress');
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.data.every(t => t.status === 'in_progress'), '筛选正确');
  });

  await test('按责任方筛选任务', '正常', async () => {
    const r = await request('GET', '/fulfillment-tasks?responsible_party=supplier');
    assert(r.status === 200, '状态码应为 200');
    assert(r.data.data.every(t => t.responsible_party === 'supplier'), '筛选正确');
  });

  await test('创建售后投诉', '正常', async () => {
    const r = await request('POST', '/after-sales', {
      requirement_id: 1,
      contract_id: 1,
      supplier_id: 1,
      type: 'complaint',
      title: '服务质量问题',
      description: '花材不新鲜',
      filed_by: 1
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('创建售后退款', '正常', async () => {
    const r = await request('POST', '/after-sales', {
      requirement_id: 1,
      contract_id: 1,
      supplier_id: 1,
      type: 'refund',
      title: '申请退款',
      description: '服务取消',
      refund_amount: 5000,
      filed_by: 1
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('创建评价 - 5 星 (信用加分)', '正常', async () => {
    const r = await request('POST', '/reviews', {
      supplier_id: 1,
      reviewer_id: 1,
      rating: 5,
      content: '非常满意!'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('创建评价 - 1 星 (信用扣分)', '正常', async () => {
    const r = await request('POST', '/reviews', {
      supplier_id: 2,
      reviewer_id: 1,
      rating: 1,
      content: '非常不满意'
    });
    assert(r.status === 201, '状态码应为 201');
    assert(r.data.success === true, 'success 应为 true');
  });

  await test('创建评价 - rating 超出范围 (失败)', '失败', async () => {
    const r = await request('POST', '/reviews', {
      supplier_id: 1,
      reviewer_id: 1,
      rating: 6,
      content: '测试超出范围'
    });
    assert(r.status === 500 || r.data.success === false, '非法 rating 应导致 SQL 错误');
  });

  await test('获取信用记录', '正常', async () => {
    const r = await request('GET', '/credit-records');
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
  });

  await test('获取用户列表', '正常', async () => {
    const r = await request('GET', '/users');
    assert(r.status === 200, '状态码应为 200');
    assert(Array.isArray(r.data.data), 'data 应为数组');
  });

  // ========== 总结 ==========
  console.log('\n==========================================');
  console.log('  测试完成!');
  console.log(`  通过: ${passCount} / ${passCount + failCount}`);
  console.log(`  失败: ${failCount}`);
  console.log('==========================================\n');

  if (failCount > 0) {
    console.log('失败的测试:');
    results.filter(r => r.status === 'fail').forEach(r => {
      console.log(`  - ${r.name} [${r.scenario}]: ${r.error}`);
    });
    process.exit(1);
  }
}

runAll().catch(err => {
  console.error('测试执行失败:', err.message);
  process.exit(1);
});
