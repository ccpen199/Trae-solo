const http = require('http');

function call(method, path, data) {
  const postData = data ? JSON.stringify(data) : null;
  const opts = {
    hostname: '127.0.0.1', port: 59290, path, method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (postData) opts.headers['Content-Length'] = Buffer.byteLength(postData);
  return new Promise((resolve) => {
    const req = http.request(opts, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(body) }); } catch { resolve({ status: res.statusCode, body }); } });
    });
    req.on('error', e => resolve({ error: e.message }));
    if (postData) req.write(postData);
    req.end();
  });
}

(async () => {
  const today = new Date().toISOString().split('T')[0];

  console.log('=== (1) 附近网点 POST /outlets/nearby ===');
  const r1 = await call('POST', '/api/outlets/nearby', { lng: 106.5516, lat: 29.5628, radius: 5000 });
  console.log('  status=', r1.status, 'code=', r1.body?.code, '网点数=', r1.body?.data?.length || 0);
  if (r1.body?.data && r1.body.data[0]) {
    const o = r1.body.data[0];
    console.log(`  首网点: ${o.name} 距离${(o.distance/1000).toFixed(2)}km 排队${o.total_queue}人 开${o.open_windows}/${o.total_windows}窗 平均等待${o.avg_wait}分钟`);
  }

  console.log('\n=== (2) 智能匹配 POST /outlets/match-service (事项1+3) ===');
  for (const itemId of [1, 3]) {
    const r = await call('POST', '/api/outlets/match-service', { serviceItemId: itemId, date: today, timePreference: 'morning', lng: 106.5516, lat: 29.5628 });
    const recs = r.body?.data?.recommendations || [];
    console.log(`  事项${itemId}: status=${r.status} code=${r.body?.code} 推荐=${recs.length}条`);
    if (recs[0]) {
      const t = recs[0];
      console.log(`    Top: ${t.outlet_name} 时段${t.best_slot} 排队${t.total_queue} 开${t.open_windows}/${t.total_windows}窗 预测${t.predicted_count}人 评分${t.score?.toFixed(2)}`);
    }
  }

  console.log('\n=== (3) AR导航 GET /outlets/ar/navigation?outletId=1 ===');
  const r3 = await call('GET', '/api/outlets/ar/navigation?outletId=1');
  const wp = r3.body?.data?.waypoints || [];
  console.log('  status=', r3.status, 'code=', r3.body?.code, '航点数=', wp.length);
  if (wp.length > 0) {
    const last = wp[wp.length - 1];
    console.log(`  终点: ${last.name} 说明="${last.instruction?.substring(0,30)}..."`);
  }

  console.log('\n=== (4) 运营概览 GET /admin/overview ===');
  const r4 = await call('GET', '/api/admin/overview');
  const d = r4.body?.data || {};
  console.log('  status=', r4.status, 'code=', r4.body?.code);
  console.log('  today_appointments=', d.today_appointments, ' (confirmed=', d.today_confirmed, ' pending=', d.today_pending, ' completed=', d.today_completed, ')');
  console.log('  today_peak: 预测=', d.today_peak?.predicted_count, '实际=', d.today_peak?.peak_actual, '当前排队=', d.today_peak?.current_queue, '建议窗=', d.today_peak?.suggested_windows);
  console.log('  window_dispatch: 开=', d.window_dispatch_summary?.total_open, '/总=', d.window_dispatch_summary?.total_windows, ' 建议调度=', d.window_dispatch_summary?.total_suggested, ' 负载=', d.window_dispatch_summary?.overall_load_level);
  console.log('  heat_prediction_count=', d.heat_prediction_count, ' total_agent_ops=', d.total_agent_ops_count, ' active_offline=', d.active_offline_count);
  console.log('  recent_logs=', (d.recent_logs || []).length, '条 (最近3条):');
  (d.recent_logs || []).slice(0, 3).forEach(l => console.log(`    [${l.module}] ${l.operation} - ${l.created_at}`));

  console.log('\n=== (5) 身份统计 GET /admin/identity-stats/1 ===');
  const r5 = await call('GET', '/api/admin/identity-stats/1');
  const id = r5.body?.data || {};
  console.log('  status=', r5.status, 'code=', r5.body?.code);
  console.log('  total_codes=', id.total_codes, ' offline=', id.offline_count, ' risk_level=', id.current_risk?.level, '(', id.current_risk?.score, ')');
  console.log('  cert_count=', id.certificates?.length, ' (证件类型前3: ' + (id.certificates || []).slice(0, 3).map(c => c.cert_name).join('、') + '...)');
  console.log('  offline_codes_list=', (id.offline_codes_list || []).length, '条:');
  (id.offline_codes_list || []).slice(0, 2).forEach(c => console.log(`    token=${c.code_token?.substring(0,12)}... risk=${c.risk_level}(${c.risk_score}) 到期=${c.expire_at?.substring(0,16)}`));
  console.log('  recent_code_records=', (id.recent_code_records || []).length, '条:');
  (id.recent_code_records || []).slice(0, 3).forEach(r => console.log(`    ${r.is_offline ? '离线' : '动态'}码 risk=${r.risk_level}(${r.risk_score}) time=${r.created_at?.substring(0,16)}`));
  console.log('  auth_list=', (id.auth_list || []).length, '条:');
  (id.auth_list || []).forEach(a => console.log(`    代办人=${a.agent_name} 范围=${JSON.parse(a.auth_scope||'[]').join('/')} 状态=${a.status} 到期=${a.end_time?.substring(0,10)} 二次确认=${a.require_confirm ? '是' : '否'}`));

  console.log('\n✅  5个核心API接口验证完成');
})();
