const API_BASE = 'http://127.0.0.1:53470/api';

const normalTests = [
  {
    name: '获取用户资料列表',
    method: 'GET',
    url: `${API_BASE}/profiles?limit=10`,
    expected: { ok: true, profiles: Array.isArray },
    verify: (res) => res.ok && Array.isArray(res.profiles)
  },
  {
    name: '获取用户资料详情',
    method: 'GET',
    url: `${API_BASE}/profiles/1`,
    expected: { ok: true, profile: Object },
    verify: (res) => res.ok && res.profile && res.profile.id === 1
  },
  {
    name: '生成匹配候选人',
    method: 'POST',
    url: `${API_BASE}/matching/generate`,
    body: { profile_id: 1, age_min: 25, age_max: 40, city: '上海' },
    expected: { ok: true, candidates: Array.isArray },
    verify: (res) => res.ok && Array.isArray(res.candidates)
  },
  {
    name: '创建匹配',
    method: 'POST',
    url: `${API_BASE}/matching`,
    body: { profile_a_id: 1, profile_b_id: 8, match_score: 85 },
    expected: { ok: true, id: Number },
    verify: (res) => res.ok && typeof res.id === 'number'
  },
  {
    name: '创建红娘推荐',
    method: 'POST',
    url: `${API_BASE}/matchmaker/recommendations`,
    body: { matchmaker_id: 1, match_id: 1, recommendation_reason: '双方价值观契合', recommendation_note: '安排见面' },
    expected: { ok: true, id: Number },
    verify: (res) => res.ok && typeof res.id === 'number'
  },
  {
    name: '更新推荐反馈',
    method: 'PUT',
    url: `${API_BASE}/matchmaker/recommendations/1`,
    body: { a_feedback: '双方感觉良好', b_feedback: '期待下次见面', status: 'dating' },
    expected: { ok: true },
    verify: (res) => res.ok
  },
  {
    name: '创建约见安排',
    method: 'POST',
    url: `${API_BASE}/matchmaker/appointments`,
    body: { matchmaker_id: 1, match_id: 1, appointment_date: '2026-06-15', appointment_time: '14:00', location: '上海外滩咖啡厅' },
    expected: { ok: true, id: Number },
    verify: (res) => res.ok && typeof res.id === 'number'
  },
  {
    name: '提交举报',
    method: 'POST',
    url: `${API_BASE}/safety/reports`,
    body: { reporter_profile_id: 1, reported_profile_id: 7, report_type: 'harassment', report_content: '对方发送骚扰信息', evidence: '聊天记录' },
    expected: { ok: true, id: Number },
    verify: (res) => res.ok && typeof res.id === 'number'
  },
  {
    name: '处理举报',
    method: 'PUT',
    url: `${API_BASE}/safety/reports/2`,
    body: { status: 'resolved', handling_result: '已核实，拉黑处理', block_profile: true, handled_by: 1 },
    expected: { ok: true },
    verify: (res) => res.ok
  },
  {
    name: '获取数据报表',
    method: 'GET',
    url: `${API_BASE}/reports/dashboard`,
    expected: { ok: true, stats: Object, matchmaker_performance: Array.isArray },
    verify: (res) => res.ok && res.stats && Array.isArray(res.matchmaker_performance)
  }
];

const boundaryTests = [
  {
    name: '年龄范围下限边界 (18岁)',
    method: 'POST',
    url: `${API_BASE}/matching/generate`,
    body: { profile_id: 1, age_min: 18, age_max: 18 },
    expected: { ok: true },
    verify: (res) => res.ok
  },
  {
    name: '年龄范围上限边界 (65岁)',
    method: 'POST',
    url: `${API_BASE}/matching/generate`,
    body: { profile_id: 1, age_min: 65, age_max: 65 },
    expected: { ok: true },
    verify: (res) => res.ok
  },
  {
    name: '匹配分数边界 (0分)',
    method: 'POST',
    url: `${API_BASE}/matching`,
    body: { profile_a_id: 1, profile_b_id: 8, match_score: 0 },
    expected: { ok: true },
    verify: (res) => res.ok
  },
  {
    name: '匹配分数边界 (100分)',
    method: 'POST',
    url: `${API_BASE}/matching`,
    body: { profile_a_id: 1, profile_b_id: 8, match_score: 100 },
    expected: { ok: true },
    verify: (res) => res.ok
  },
  {
    name: '空筛选条件 (返回所有结果)',
    method: 'POST',
    url: `${API_BASE}/matching/generate`,
    body: { profile_id: 1 },
    expected: { ok: true, candidates: Array.isArray },
    verify: (res) => res.ok && Array.isArray(res.candidates)
  },
  {
    name: '仅实名认证筛选',
    method: 'POST',
    url: `${API_BASE}/matching/generate`,
    body: { profile_id: 1, verified_only: true },
    expected: { ok: true },
    verify: (res) => res.ok
  },
  {
    name: '大量数据分页 (limit=100)',
    method: 'GET',
    url: `${API_BASE}/profiles?limit=100&offset=0`,
    expected: { ok: true, profiles: Array.isArray },
    verify: (res) => res.ok && Array.isArray(res.profiles) && res.profiles.length <= 100
  },
  {
    name: '普通消息无敏感词',
    method: 'POST',
    url: `${API_BASE}/matching/1/conversations`,
    body: { sender_id: 1, receiver_id: 8, content: '您好，很高兴认识你' },
    expected: { ok: true },
    verify: (res) => res.ok
  }
];

const conflictTests = [
  {
    name: '重复创建相同匹配',
    method: 'POST',
    url: `${API_BASE}/matching`,
    body: { profile_a_id: 1, profile_b_id: 2, match_score: 75 },
    expected: { ok: false, error: 'match_exists' },
    verify: (res) => !res.ok
  },
  {
    name: '重复处理同一条举报',
    method: 'PUT',
    url: `${API_BASE}/safety/reports/1`,
    body: { status: 'resolved', handling_result: '重复处理', handled_by: 1 },
    expected: { ok: false, error: 'already_handled' },
    verify: (res) => !res.ok
  },
  {
    name: '用户已被拉黑后再次匹配',
    method: 'POST',
    url: `${API_BASE}/matching/generate`,
    body: { profile_id: 1, city: '北京' },
    expected: { ok: true, candidates: Array.isArray },
    verify: (res) => {
      const blockedIds = [7];
      return res.ok && res.candidates.every(c => !blockedIds.includes(c.profile.id));
    }
  },
  {
    name: '活动名额已满时报名',
    method: 'POST',
    url: `${API_BASE}/events/1/register`,
    body: { profile_id: 1 },
    expected: { ok: false, error: 'event_full' },
    verify: (res) => !res.ok
  },
  {
    name: '重复提交相同诈骗风险举报',
    method: 'POST',
    url: `${API_BASE}/safety/fraud-risks`,
    body: { profile_id: 7, risk_type: 'fake_identity', risk_evidence: '学历造假', risk_score: 80 },
    expected: { ok: false, error: 'risk_already_reported' },
    verify: (res) => !res.ok
  },
  {
    name: '并发更新同一用户资料',
    method: 'PUT',
    url: `${API_BASE}/profiles/1`,
    body: { occupation: '高级产品经理' },
    expected: { ok: true },
    verify: (res) => res.ok,
    concurrent: true
  }
];

const failureTests = [
  {
    name: '获取不存在的用户资料',
    method: 'GET',
    url: `${API_BASE}/profiles/99999`,
    expected: { ok: false, error: 'not_found' },
    verify: (res) => !res.ok
  },
  {
    name: '创建匹配时缺少必填参数',
    method: 'POST',
    url: `${API_BASE}/matching`,
    body: { profile_a_id: 1 },
    expected: { ok: false, error: 'missing_params' },
    verify: (res) => !res.ok
  },
  {
    name: '创建匹配时 profile_id 格式错误',
    method: 'POST',
    url: `${API_BASE}/matching`,
    body: { profile_a_id: 'abc', profile_b_id: 'xyz', match_score: 80 },
    expected: { ok: false, error: 'invalid_params' },
    verify: (res) => !res.ok
  },
  {
    name: '匹配分数超出范围 (-1)',
    method: 'POST',
    url: `${API_BASE}/matching`,
    body: { profile_a_id: 1, profile_b_id: 8, match_score: -1 },
    expected: { ok: false, error: 'invalid_score' },
    verify: (res) => !res.ok
  },
  {
    name: '匹配分数超出范围 (101)',
    method: 'POST',
    url: `${API_BASE}/matching`,
    body: { profile_a_id: 1, profile_b_id: 8, match_score: 101 },
    expected: { ok: false, error: 'invalid_score' },
    verify: (res) => !res.ok
  },
  {
    name: '处理不存在的举报',
    method: 'PUT',
    url: `${API_BASE}/safety/reports/99999`,
    body: { status: 'resolved', handling_result: '测试', handled_by: 1 },
    expected: { ok: false, error: 'not_found' },
    verify: (res) => !res.ok
  },
  {
    name: '消息包含敏感词',
    method: 'POST',
    url: `${API_BASE}/matching/1/conversations`,
    body: { sender_id: 1, receiver_id: 8, content: '刷单返利，日赚500元' },
    expected: { ok: true, contains_sensitive_words: true, blocked: true },
    verify: (res) => res.ok && res.contains_sensitive_words === true
  },
  {
    name: '年龄范围无效 (min > max)',
    method: 'POST',
    url: `${API_BASE}/matching/generate`,
    body: { profile_id: 1, age_min: 40, age_max: 25 },
    expected: { ok: false, error: 'invalid_age_range' },
    verify: (res) => !res.ok
  }
];

async function runTest(test, category) {
  console.log(`\n=== 测试: ${test.name} ===`);
  console.log(`类型: ${category}`);
  
  try {
    const options = {
      method: test.method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (test.body) {
      options.body = JSON.stringify(test.body);
    }
    
    const response = await fetch(test.url, options);
    const result = await response.json();
    
    const passed = test.verify(result);
    
    console.log(`请求: ${test.method} ${test.url}`);
    if (test.body) console.log(`参数:`, JSON.stringify(test.body));
    console.log(`响应:`, JSON.stringify(result).substring(0, 200));
    console.log(`结果: ${passed ? '✅ 通过' : '❌ 失败'}`);
    
    return { name: test.name, category, passed, result };
  } catch (error) {
    console.log(`异常: ${error.message}`);
    console.log(`结果: ❌ 失败`);
    return { name: test.name, category, passed: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('征婚交友平台 - 四类测试用例执行');
  console.log('='.repeat(60));
  
  const allTests = [
    ...normalTests.map(t => ({ ...t, category: '正常场景' })),
    ...boundaryTests.map(t => ({ ...t, category: '边界场景' })),
    ...conflictTests.map(t => ({ ...t, category: '冲突场景' })),
    ...failureTests.map(t => ({ ...t, category: '失败场景' }))
  ];
  
  const results = [];
  for (const test of allTests) {
    results.push(await runTest(test, test.category));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('测试汇总');
  console.log('='.repeat(60));
  
  const categories = ['正常场景', '边界场景', '冲突场景', '失败场景'];
  categories.forEach(cat => {
    const catResults = results.filter(r => r.category === cat);
    const passed = catResults.filter(r => r.passed).length;
    console.log(`${cat}: ${passed}/${catResults.length} 通过`);
  });
  
  const totalPassed = results.filter(r => r.passed).length;
  console.log(`\n总计: ${totalPassed}/${results.length} 通过`);
  console.log('='.repeat(60));
  
  return results;
}

if (require.main === module) {
  runAllTests().then(() => process.exit(0));
}

module.exports = {
  normalTests,
  boundaryTests,
  conflictTests,
  failureTests,
  runTest,
  runAllTests
};
