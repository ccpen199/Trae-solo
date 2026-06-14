const http = require('http');

function get(path) {
  return new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:59080/api' + path, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e) { resolve({ error: e.message, raw: data }); }
      });
    }).on('error', reject);
  });
}

(async () => {
  console.log('=== 1. 区域热力图 ===');
  const region = await get('/analytics/region-heatmap');
  console.log('返回数量:', region.data?.length || 0);
  console.log('第一条:', JSON.stringify(region.data?.[0] || {}));

  console.log('\n=== 2. 工种紧缺 ===');
  const shortage = await get('/analytics/trade-shortage');
  console.log('返回数量:', shortage.data?.length || 0);
  console.log('前3条:', shortage.data?.slice(0,3).map(t => t.trade_name + ': ' + t.shortage_index) || []);

  console.log('\n=== 3. 班组信用 ===');
  const credit = await get('/analytics/team-credit');
  console.log('返回数量:', credit.data?.length || 0);
  console.log('第一条:', JSON.stringify(credit.data?.[0] || {}));

  console.log('\n=== 4. 欠薪风险 ===');
  const risk = await get('/analytics/wage-arrears-risk');
  console.log('返回数量:', risk.data?.length || 0);
  console.log('第一条:', JSON.stringify(risk.data?.[0] || {}));

  console.log('\n=== 5. 工人列表（含统计字段）===');
  const workers = await get('/workers?pageSize=1');
  const w = workers.data?.list?.[0];
  if (w) {
    console.log('字段:', Object.keys(w));
    console.log('证书数:', w.certificate_count, '培训数:', w.training_count, '评价数:', w.review_count, '健康:', w.health_status);
  }

  console.log('\n=== 6. 审核记录 ===');
  const reviews = await get('/jobs/1/reviews');
  console.log('返回数量:', reviews.data?.length || 0);
  console.log('第一条:', JSON.stringify(reviews.data?.[0] || {}));

  console.log('\n=== 7. 合同列表 ===');
  const contracts = await get('/contracts?pageSize=1');
  console.log('总数:', contracts.data?.total || 0);
  const c = contracts.data?.list?.[0];
  if (c) console.log('合同号:', c.contract_number, '状态:', c.status);

  console.log('\n=== 8. 工资支付 ===');
  const payments = await get('/wage-payments?pageSize=1');
  console.log('总数:', payments.data?.total || 0);
  const p = payments.data?.list?.[0];
  if (p) console.log('金额:', p.amount, '状态:', p.status);

  console.log('\n✅ 所有API验证完成');
})();
