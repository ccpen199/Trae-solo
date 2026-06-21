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
  const d1 = r1.body?.data || [];
  console.log('  status=%s code=%s 网点数=%s', r1.status, r1.body?.code, d1.length);
  if (d1[0]) {
    const o = d1[0];
    console.log('  首网点: %s 距离%skm 排队%s人 开%s/%s窗 平均等待%s分钟', o.name, (o.distance/1000).toFixed(2), o.total_queue, o.open_windows, o.total_windows, o.avg_wait);
  }

  console.log('\n=== (2) 智能匹配 POST /outlets/match-service 事项1 ===');
  const r2 = await call('POST', '/api/outlets/match-service', { serviceItemId: 1, date: today, timePreference: 'morning', lng: 106.5516, lat: 29.5628 });
  const recs = r2.body?.data?.recommendations || [];
  console.log('  status=%s code=%s 推荐=%s条', r2.status, r2.body?.code, recs.length);
  recs.slice(0,2).forEach(t => {
    console.log('    - %s 时段%s 排队%s 开%s/%s窗 预测%s人 评分%s', t.outlet_name, t.best_slot, t.total_queue, t.open_windows, t.total_windows, t.predicted_count, t.score);
  });

  console.log('\n=== (3) AR导航 GET /outlets/ar/navigation?outletId=1 ===');
  const r3 = await call('GET', '/api/outlets/ar/navigation?outletId=1');
  const wp = r3.body?.data?.waypoints || [];
  console.log('  status=%s code=%s 航点数=%s', r3.status, r3.body?.code, wp.length);
  if (wp.length > 0) {
    const last = wp[wp.length - 1];
    console.log('  终点: %s 说明="%s..."', last.name, (last.instruction||'').substring(0, 32));
  }

  console.log('\n=== (4) 运营概览 GET /admin/overview ===');
  const r4 = await call('GET', '/api/admin/overview');
  const d = r4.body?.data || {};
  console.log('  status=%s code=%s', r4.status, r4.body?.code);
  console.log('  today_appointments=%s (confirmed=%s pending=%s completed=%s)', d.today_appointments, d.today_confirmed, d.today_pending, d.today_completed);
  const pk = d.today_peak || {};
  console.log('  today_peak: 预测=%s 实际=%s 排队=%s 建议窗=%s', pk.predicted_count, pk.peak_actual, pk.current_queue, pk.suggested_windows);
  const ws = d.window_dispatch_summary || {};
  console.log('  window_dispatch: 总开=%s 总窗=%s 建议调度=%s 总排队=%s 负载=%s', ws.total_open, ws.total_windows, ws.total_suggested, ws.total_queue, ws.overall_load_level);
  console.log('  heat_prediction_count=%s total_agent_ops=%s active_offline=%s', d.heat_prediction_count, d.total_agent_ops_count, d.active_offline_count);
  console.log('  recent_logs=%s条:', (d.recent_logs || []).length);
  (d.recent_logs || []).slice(0, 3).forEach(l => console.log('    [%s] %s - %s', l.module, l.operation, l.created_at));

  console.log('\n=== (5) 身份统计 GET /admin/identity-stats/1 ===');
  const r5 = await call('GET', '/api/admin/identity-stats/1');
  const id = r5.body?.data || {};
  console.log('  status=%s code=%s', r5.status, r5.body?.code);
  console.log('  total_codes=%s offline_count=%s', id.total_codes, id.offline_count);
  const cr = id.current_risk || {};
  console.log('  current_risk: level=%s score=%s', cr.level, cr.score);
  console.log('  certificates=%s (前3: %s...)', (id.certificates || []).length, (id.certificates || []).slice(0,3).map(c => c.cert_name).join('、'));
  console.log('  offline_codes_list=%s条:', (id.offline_codes_list || []).length);
  (id.offline_codes_list || []).slice(0,2).forEach(c => console.log('    token=%s... risk=%s(%s) 到期=%s', (c.code_token||'').substring(0,10), c.risk_level, c.risk_score, (c.expire_at||'').substring(0,16)));
  console.log('  recent_code_records=%s条:', (id.recent_code_records || []).length);
  (id.recent_code_records || []).slice(0,3).forEach(r => console.log('    %s码 risk=%s(%s) time=%s', r.is_offline ? '离线' : '动态', r.risk_level, r.risk_score, (r.created_at||'').substring(0,16)));
  console.log('  auth_list=%s条:', (id.auth_list || []).length);
  (id.auth_list || []).forEach(a => {
    let scope; try { scope = JSON.parse(a.auth_scope || '[]').join('/'); } catch { scope = String(a.auth_scope); }
    console.log('    代办人=%s 范围=%s 状态=%s 到期=%s 二次确认=%s', a.agent_name, scope, a.status, (a.end_time||'').substring(0,10), a.require_confirm ? '是' : '否');
  });

  console.log('\n=== 5核心API验证完成 ===');
})();
