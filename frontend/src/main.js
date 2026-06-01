import './styles.css';

const backendPort = Number(window.location.port || 43447) + 10000;
const API_BASE = `${window.location.protocol}//${window.location.hostname}:${backendPort}/api`;

const statusText = {
  running: '运行中', scheduled: '待发车', completed: '已完成', active: '运营',
  standby: '待命', maintenance: '检修', on_duty: '值乘', available: '可排班',
  resting: '休息', leave: '请假', charging: '充电', draft: '草稿', approved: '已审批',
  pending: '待执行', in_progress: '执行中', open: '待处理', processing: '处理中',
  resolved: '已解决', closed: '已关闭', normal: '常规', insert: '插班', short_turn: '区间车',
  skip_stop: '跳站'
};
const eventTypes = {
  traffic_jam: '交通拥堵', vehicle_fault: '车辆故障', driver_leave: '司机请假',
  complaint: '乘客投诉', weather: '天气影响', accident: '事故', road_closure: '道路封闭', other: '其他'
};
const severityText = { low: '低', medium: '中', high: '高', critical: '紧急' };

const extraCSS = document.createElement('style');
extraCSS.textContent = `
  .modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);display:grid;place-items:center;z-index:100}
  .modal{background:#fff;border-radius:10px;padding:24px;width:540px;max-width:92vw;max-height:85vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.18)}
  .modal h2{margin:0 0 16px}
  .form-grid{display:grid;gap:12px}
  .form-grid label{display:grid;gap:4px;font-size:13px;color:#64748b}
  .form-grid input,.form-grid select,.form-grid textarea{padding:8px 10px;border:1px solid #d9e1e8;border-radius:6px;font-size:14px;font-family:inherit}
  .form-grid textarea{resize:vertical;min-height:56px}
  .actions{display:flex;gap:8px;margin-top:16px;justify-content:flex-end}
  .btn-sm{padding:6px 12px;font-size:13px}
  .btn-outline{background:#fff;color:#334155;border:1px solid #d9e1e8}
  .btn-outline:hover{background:#f7f9fb}
  .btn-danger{background:#ef4444}
  .btn-success{background:#10b981}
  .btn-warn{background:#f59e0b}
  .tabs{display:flex;gap:0;border-bottom:2px solid #e5ebf1;margin-bottom:16px}
  .tabs button{background:none;color:#64748b;border:0;border-bottom:2px solid transparent;margin-bottom:-2px;padding:8px 16px;font-weight:600;cursor:pointer}
  .tabs button.active{color:#1463ff;border-bottom-color:#1463ff}
  .filter-row{display:flex;gap:8px;align-items:center;margin-bottom:16px;flex-wrap:wrap}
  .filter-row select,.filter-row input{padding:6px 10px;border:1px solid #d9e1e8;border-radius:6px;font-size:13px}
  .badge.low{background:#d9f7ec;color:#06744d}
  .badge.medium{background:#e2edff;color:#1d4ed8}
  .badge.high{background:#fff0d4;color:#a15c00}
  .badge.critical{background:#fde8e8;color:#dc2626}
  .badge.draft,.badge.pending{background:#fff0d4;color:#a15c00}
  .badge.approved,.badge.resolved{background:#d9f7ec;color:#06744d}
  .badge.open{background:#fde8e8;color:#dc2626}
  .badge.processing{background:#fff0d4;color:#a15c00}
  .badge.closed,.badge.completed{background:#e8eef5;color:#334155}
  .badge.charging{background:#e2edff;color:#1d4ed8}
  .badge.leave{background:#fde8e8;color:#dc2626}
  .badge.insert,.badge.short_turn,.badge.skip_stop{background:#f0e6ff;color:#7c3aed}
  .detail-link{color:#1463ff;cursor:pointer;text-decoration:underline}
  .empty-msg{color:#94a3b8;text-align:center;padding:32px}
  .stat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;margin-bottom:16px}
`;
document.head.appendChild(extraCSS);

const app = document.querySelector('#app');
let refreshTimer = null;

function api(path, opts = {}) {
  return fetch(`${API_BASE}${path}`, { headers: { 'Content-Type': 'application/json' }, ...opts })
    .then(r => { if (!r.ok) return r.json().then(e => { throw new Error(e.error || r.status); }); return r.json(); });
}

function badge(s) { return `<span class="badge ${s}">${statusText[s] || s}</span>`; }
function sevBadge(s) { return `<span class="badge ${s}">${severityText[s] || s}</span>`; }
function metric(l, v, sub) { return `<article class="metric"><span>${l}</span><strong>${v}</strong><small>${sub}</small></article>`; }
function ws() { return document.querySelector('#workspace'); }
function today() { return new Date().toISOString().slice(0, 10); }

function showModal(title, bodyHtml, onSubmit) {
  const ov = document.createElement('div');
  ov.className = 'modal-overlay';
  ov.innerHTML = `<div class="modal"><h2>${title}</h2>${bodyHtml}<div class="actions"><button class="btn-sm btn-outline" id="m-cancel">取消</button><button class="btn-sm" id="m-ok">确认</button></div></div>`;
  document.body.appendChild(ov);
  ov.querySelector('#m-cancel').onclick = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
  if (onSubmit) ov.querySelector('#m-ok').onclick = () => onSubmit(ov);
  return ov;
}

function renderShell(view) {
  if (refreshTimer) { clearInterval(refreshTimer); refreshTimer = null; }
  const links = [['overview','运行总览'],['routes','线路档案'],['shifts','班次计划'],['dispatch','实时调度'],['events','事件处理'],['reports','报表统计']];
  app.innerHTML = `<aside class="sidebar">
    <div class="brand"><span class="brand-mark">BD</span><div><strong>公交调度运行台</strong><small>本地联调服务</small></div></div>
    <nav>${links.map(([h,t]) => `<a href="#${h}" class="${view===h?'active':''}">${t}</a>`).join('')}</nav>
    <div class="service-box"><span>API</span><code>${API_BASE}</code></div>
  </aside><main class="workspace" id="workspace"></main>`;
}

function navigate() {
  const hash = location.hash.slice(1) || 'overview';
  const [view, ...params] = hash.split('/');
  renderShell(view);
  const handlers = {
    overview: renderOverview,
    routes: () => params[0] ? renderRouteDetail(params[0]) : renderRouteList(),
    shifts: () => params[0] ? renderShiftDetail(params[0]) : renderShiftList(),
    dispatch: renderDispatch,
    events: () => renderEvents(params[0]),
    reports: renderReports,
  };
  (handlers[view] || renderOverview)();
}

window.addEventListener('hashchange', navigate);

// ==================== OVERVIEW ====================
async function renderOverview() {
  const w = ws();
  w.innerHTML = `<header class="topbar"><div><h1>运行总览</h1><p>实时监控线路、车辆、班次和事件</p></div><button id="ov-refresh">刷新数据</button></header>
    <section class="status-row" id="ov-metrics"></section>
    <section class="grid">
      <article class="panel wide"><div class="panel-head"><h2>即将发车</h2><span id="ov-health">检查中</span></div><div class="table-wrap"><table><thead><tr><th>班次</th><th>线路</th><th>车辆</th><th>司机</th><th>发车</th><th>客流</th><th>状态</th></tr></thead><tbody id="ov-upcoming"></tbody></table></div></article>
      <article class="panel"><div class="panel-head"><h2>线路负载</h2></div><div id="ov-loads" class="bar-list"></div></article>
      <article class="panel"><div class="panel-head"><h2>车辆状态</h2></div><div id="ov-vehicles" class="vehicle-list"></div></article>
    </section>
    <section style="margin-top:16px"><article class="panel"><div class="panel-head"><h2>待处理告警</h2></div><div class="table-wrap"><table><thead><tr><th>类型</th><th>线路</th><th>描述</th><th>严重度</th><th>时间</th><th>状态</th></tr></thead><tbody id="ov-alerts"></tbody></table></div></article></section>`;

  const load = async () => {
    try {
      const [health, dash, veh] = await Promise.all([api('/health'), api('/dashboard'), api('/vehicles')]);
      document.querySelector('#ov-health').textContent = health.status === 'ok' ? '后端在线' : '后端异常';
      const c = dash.counts;
      document.querySelector('#ov-metrics').innerHTML = [
        metric('线路', c.routes, '运营线路总数'),
        metric('车辆', c.vehicles, `${veh.data.filter(v => v.status === 'running').length} 台运行中`),
        metric('司机', c.drivers, '可调度资源'),
        metric('今日班次', c.dispatches, `${c.scheduled} 个待发车`)
      ].join('');
      document.querySelector('#ov-upcoming').innerHTML = dash.upcoming.map(d => `<tr>
        <td><strong>${d.dispatch_no}</strong></td><td>${d.route_name}</td><td>${d.plate_no}</td>
        <td>${d.driver_name}</td><td>${(d.planned_departure||'').slice(5,16)}</td>
        <td>${d.passenger_load} 人</td><td>${badge(d.status)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty-msg">暂无班次</td></tr>';
      document.querySelector('#ov-loads').innerHTML = dash.routeLoads.map(r => {
        const pct = Math.min(100, Math.round(r.average_load || 0));
        return `<div class="bar-row"><div><strong>${r.name}</strong><span>${r.dispatch_count} 个班次</span></div><div class="bar"><i style="width:${pct}%"></i></div><b>${pct}%</b></div>`;
      }).join('');
      document.querySelector('#ov-vehicles').innerHTML = veh.data.map(v => `<div class="vehicle">
        <div><strong>${v.plate_no}</strong><span>${v.model} · ${v.route_name||'未绑定'}</span></div>
        <div class="battery"><i style="width:${v.battery_percent}%"></i></div>${badge(v.status)}</div>`).join('');
      document.querySelector('#ov-alerts').innerHTML = dash.alerts.map(a => `<tr>
        <td>${eventTypes[a.event_type]||a.event_type}</td><td>${a.route_name||'-'}</td>
        <td>${a.description}</td><td>${sevBadge(a.severity)}</td>
        <td>${(a.reported_at||'').slice(5,16)}</td><td>${badge(a.status)}</td></tr>`).join('') || '<tr><td colspan="6" class="empty-msg">暂无告警</td></tr>';
    } catch (e) { document.querySelector('#ov-health').textContent = e.message; }
  };
  document.querySelector('#ov-refresh').onclick = load;
  load();
  refreshTimer = setInterval(load, 30000);
}

// ==================== ROUTES ====================
async function renderRouteList() {
  const w = ws();
  w.innerHTML = `<header class="topbar"><div><h1>线路档案</h1><p>管理线路信息、站点、时段和节假日</p></div><button id="add-route">新增线路</button></header>
    <div class="table-wrap"><table><thead><tr><th>ID</th><th>线路名称</th><th>起点</th><th>终点</th><th>里程(km)</th><th>间隔(分)</th><th>首末班</th><th>站点数</th><th>状态</th><th>操作</th></tr></thead><tbody id="rt-tb"></tbody></table></div>`;
  const { data: routes } = await api('/routes');
  document.querySelector('#rt-tb').innerHTML = routes.map(r => `<tr>
    <td>${r.id}</td><td><span class="detail-link" data-id="${r.id}">${r.name}</span></td>
    <td>${r.start_station}</td><td>${r.end_station}</td><td>${r.distance_km}</td>
    <td>${r.headway_min}</td><td>${r.first_bus_time}-${r.last_bus_time}</td>
    <td>${r.station_count}</td><td>${badge(r.status)}</td>
    <td><button class="btn-sm btn-outline edit-r" data-id="${r.id}">编辑</button> <button class="btn-sm btn-danger del-r" data-id="${r.id}">删除</button></td></tr>`).join('') || '<tr><td colspan="10" class="empty-msg">暂无线路</td></tr>';
  w.querySelectorAll('.detail-link').forEach(el => el.onclick = () => { location.hash = `routes/${el.dataset.id}`; });
  w.querySelectorAll('.edit-r').forEach(el => el.onclick = () => showRouteForm(routes.find(r => r.id == el.dataset.id), () => renderRouteList()));
  w.querySelectorAll('.del-r').forEach(el => el.onclick = async () => { if (!confirm('确认删除该线路？')) return; await api(`/routes/${el.dataset.id}`, { method: 'DELETE' }); renderRouteList(); });
  document.querySelector('#add-route').onclick = () => showRouteForm(null, () => renderRouteList());
}

function showRouteForm(route, onDone) {
  const isEdit = !!route;
  showModal(isEdit ? '编辑线路' : '新增线路', `<div class="form-grid">
    <label>线路名称 *<input id="f-name" value="${route?.name||''}"></label>
    <label>起点站 *<input id="f-start" value="${route?.start_station||''}"></label>
    <label>终点站 *<input id="f-end" value="${route?.end_station||''}"></label>
    <label>里程(km) *<input id="f-dist" type="number" step="0.1" value="${route?.distance_km||''}"></label>
    <label>发车间隔(分)<input id="f-hw" type="number" value="${route?.headway_min||12}"></label>
    <label>首班时间<input id="f-fb" type="time" value="${route?.first_bus_time||'06:00'}"></label>
    <label>末班时间<input id="f-lb" type="time" value="${route?.last_bus_time||'22:00'}"></label>
    <label>方向<select id="f-dir"><option ${route?.direction==='双向'?'selected':''}>双向</option><option ${route?.direction==='单向'?'selected':''}>单向</option></select></label>
    <label>配车数<input id="f-vc" type="number" value="${route?.vehicle_count||0}"></label>
    ${isEdit ? `<label>状态<select id="f-st"><option value="active" ${route.status==='active'?'selected':''}>运营</option><option value="standby" ${route.status==='standby'?'selected':''}>待命</option></select></label>` : ''}
  </div>`, async (ov) => {
    const body = { name: q('#f-name').value, start_station: q('#f-start').value, end_station: q('#f-end').value, distance_km: +q('#f-dist').value, headway_min: +q('#f-hw').value, first_bus_time: q('#f-fb').value, last_bus_time: q('#f-lb').value, direction: q('#f-dir').value, vehicle_count: +q('#f-vc').value, status: q('#f-st')?.value || 'active' };
    if (!body.name || !body.start_station || !body.end_station || !body.distance_km) { alert('请填写必填项'); return; }
    await api(isEdit ? `/routes/${route.id}` : '/routes', { method: isEdit ? 'PUT' : 'POST', body: JSON.stringify(body) });
    ov.remove(); onDone();
  });
}

async function renderRouteDetail(id) {
  const w = ws();
  const { data: r, stations, timePeriods, teams, holidays } = await api(`/routes/${id}`);
  w.innerHTML = `<header class="topbar"><div><h1>${r.name}</h1><p>${r.start_station} → ${r.end_station} · ${r.distance_km}km · ${badge(r.status)}</p></div>
    <button class="btn-sm btn-outline" onclick="location.hash='#routes'">返回列表</button></header>
    <div class="tabs" id="rt-tabs"><button class="active" data-tab="stations">站点</button><button data-tab="periods">时段</button><button data-tab="teams">班组</button><button data-tab="holidays">节假日</button></div>
    <div id="rt-tab-content"></div>`;
  let curTab = 'stations';
  function renderTab() {
    document.querySelectorAll('#rt-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === curTab));
    const tc = document.querySelector('#rt-tab-content');
    if (curTab === 'stations') {
      tc.innerHTML = `<div class="panel-head"><h2>站点列表</h2><button class="btn-sm" id="add-st">新增站点</button></div>
        <div class="table-wrap"><table><thead><tr><th>序号</th><th>站名</th><th>距起点(km)</th><th>停站(秒)</th><th>终点</th><th>操作</th></tr></thead><tbody>${
        stations.map(s => `<tr><td>${s.station_order}</td><td>${s.station_name}</td><td>${s.distance_from_start}</td><td>${s.avg_dwell_seconds}</td><td>${s.is_terminal?'是':'否'}</td>
          <td><button class="btn-sm btn-outline est" data-id="${s.id}">编辑</button> <button class="btn-sm btn-danger dst" data-id="${s.id}">删除</button></td></tr>`).join('')
        || '<tr><td colspan="6" class="empty-msg">暂无站点</td></tr>'}</tbody></table></div>`;
      tc.querySelector('#add-st').onclick = () => showStationForm(id, null, () => renderRouteDetail(id));
      tc.querySelectorAll('.est').forEach(b => b.onclick = () => showStationForm(id, stations.find(s => s.id == b.dataset.id), () => renderRouteDetail(id)));
      tc.querySelectorAll('.dst').forEach(b => b.onclick = async () => { if (!confirm('确认删除？')) return; await api(`/route-stations/${b.dataset.id}`, { method: 'DELETE' }); renderRouteDetail(id); });
    } else if (curTab === 'periods') {
      tc.innerHTML = `<div class="panel-head"><h2>运营时段</h2><button class="btn-sm" id="add-tp">新增时段</button></div>
        <div class="table-wrap"><table><thead><tr><th>时段名</th><th>开始</th><th>结束</th><th>间隔(分)</th><th>配车数</th><th>操作</th></tr></thead><tbody>${
        timePeriods.map(p => `<tr><td>${p.period_name}</td><td>${p.start_time}</td><td>${p.end_time}</td><td>${p.headway_min}</td><td>${p.vehicle_count}</td>
          <td><button class="btn-sm btn-outline etp" data-id="${p.id}">编辑</button> <button class="btn-sm btn-danger dtp" data-id="${p.id}">删除</button></td></tr>`).join('')
        || '<tr><td colspan="6" class="empty-msg">暂无时段</td></tr>'}</tbody></table></div>`;
      tc.querySelector('#add-tp').onclick = () => showPeriodForm(id, null, () => renderRouteDetail(id));
      tc.querySelectorAll('.etp').forEach(b => b.onclick = () => showPeriodForm(id, timePeriods.find(p => p.id == b.dataset.id), () => renderRouteDetail(id)));
      tc.querySelectorAll('.dtp').forEach(b => b.onclick = async () => { if (!confirm('确认删除？')) return; await api(`/route-time-periods/${b.dataset.id}`, { method: 'DELETE' }); renderRouteDetail(id); });
    } else if (curTab === 'teams') {
      tc.innerHTML = `<div class="panel"><div class="panel-head"><h2>司机班组</h2></div><div class="table-wrap"><table><thead><tr><th>班组名</th><th>班长</th><th>人数</th></tr></thead><tbody>${
        teams.map(t => `<tr><td>${t.team_name}</td><td>${t.leader_name||'-'}</td><td>${t.member_count}</td></tr>`).join('')
        || '<tr><td colspan="3" class="empty-msg">暂无班组</td></tr>'}</tbody></table></div></div>`;
    } else {
      tc.innerHTML = `<div class="panel-head"><h2>节假日计划</h2><button class="btn-sm" id="add-hol">新增节假日</button></div>
        <div class="table-wrap"><table><thead><tr><th>节假日</th><th>日期</th><th>首班</th><th>末班</th><th>间隔(分)</th><th>配车</th><th>操作</th></tr></thead><tbody>${
        holidays.map(h => `<tr><td>${h.holiday_name}</td><td>${h.holiday_date}</td><td>${h.first_bus_time}</td><td>${h.last_bus_time}</td><td>${h.headway_min}</td><td>${h.vehicle_count}</td>
          <td><button class="btn-sm btn-outline ehol" data-id="${h.id}">编辑</button> <button class="btn-sm btn-danger dhol" data-id="${h.id}">删除</button></td></tr>`).join('')
        || '<tr><td colspan="7" class="empty-msg">暂无节假日计划</td></tr>'}</tbody></table></div>`;
      tc.querySelector('#add-hol').onclick = () => showHolidayForm(id, null, () => renderRouteDetail(id));
      tc.querySelectorAll('.ehol').forEach(b => b.onclick = () => showHolidayForm(id, holidays.find(h => h.id == b.dataset.id), () => renderRouteDetail(id)));
      tc.querySelectorAll('.dhol').forEach(b => b.onclick = async () => { if (!confirm('确认删除？')) return; await api(`/holiday-plans/${b.dataset.id}`, { method: 'DELETE' }); renderRouteDetail(id); });
    }
  }
  document.querySelectorAll('#rt-tabs button').forEach(b => b.onclick = () => { curTab = b.dataset.tab; renderTab(); });
  renderTab();
}

function showStationForm(routeId, st, onDone) {
  showModal(st ? '编辑站点' : '新增站点', `<div class="form-grid">
    <label>站点名称 *<input id="f-sn" value="${st?.station_name||''}"></label>
    <label>序号<input id="f-so" type="number" value="${st?.station_order||0}"></label>
    <label>距起点(km)<input id="f-sd" type="number" step="0.1" value="${st?.distance_from_start||0}"></label>
    <label>停站时间(秒)<input id="f-ss" type="number" value="${st?.avg_dwell_seconds||30}"></label>
    <label><input type="checkbox" id="f-stl" ${st?.is_terminal?'checked':''}> 终点站</label>
  </div>`, async (ov) => {
    const body = { station_name: q('#f-sn').value, station_order: +q('#f-so').value, distance_from_start: +q('#f-sd').value, avg_dwell_seconds: +q('#f-ss').value, is_terminal: q('#f-stl').checked ? 1 : 0 };
    if (!body.station_name) { alert('请填写站点名称'); return; }
    if (st) await api(`/route-stations/${st.id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await api(`/routes/${routeId}/stations`, { method: 'POST', body: JSON.stringify(body) });
    ov.remove(); onDone();
  });
}

function showPeriodForm(routeId, tp, onDone) {
  showModal(tp ? '编辑时段' : '新增时段', `<div class="form-grid">
    <label>时段名称 *<input id="f-pn" value="${tp?.period_name||''}"></label>
    <label>开始时间 *<input id="f-ps" type="time" value="${tp?.start_time||''}"></label>
    <label>结束时间 *<input id="f-pe" type="time" value="${tp?.end_time||''}"></label>
    <label>发车间隔(分) *<input id="f-ph" type="number" value="${tp?.headway_min||''}"></label>
    <label>配车数<input id="f-pv" type="number" value="${tp?.vehicle_count||1}"></label>
  </div>`, async (ov) => {
    const body = { period_name: q('#f-pn').value, start_time: q('#f-ps').value, end_time: q('#f-pe').value, headway_min: +q('#f-ph').value, vehicle_count: +q('#f-pv').value };
    if (!body.period_name || !body.start_time || !body.end_time || !body.headway_min) { alert('请填写必填项'); return; }
    if (tp) await api(`/route-time-periods/${tp.id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await api(`/routes/${routeId}/time-periods`, { method: 'POST', body: JSON.stringify(body) });
    ov.remove(); onDone();
  });
}

function showHolidayForm(routeId, h, onDone) {
  showModal(h ? '编辑节假日' : '新增节假日', `<div class="form-grid">
    <label>节假日名称 *<input id="f-hn" value="${h?.holiday_name||''}"></label>
    <label>日期 *<input id="f-hd" type="date" value="${h?.holiday_date||''}"></label>
    <label>首班时间<input id="f-hb" type="time" value="${h?.first_bus_time||'06:00'}"></label>
    <label>末班时间<input id="f-he" type="time" value="${h?.last_bus_time||'22:00'}"></label>
    <label>发车间隔(分)<input id="f-hh" type="number" value="${h?.headway_min||12}"></label>
    <label>配车数<input id="f-hv" type="number" value="${h?.vehicle_count||1}"></label>
  </div>`, async (ov) => {
    const body = { holiday_name: q('#f-hn').value, holiday_date: q('#f-hd').value, first_bus_time: q('#f-hb').value, last_bus_time: q('#f-he').value, headway_min: +q('#f-hh').value, vehicle_count: +q('#f-hv').value };
    if (!body.holiday_name || !body.holiday_date) { alert('请填写必填项'); return; }
    if (h) await api(`/holiday-plans/${h.id}`, { method: 'PUT', body: JSON.stringify(body) });
    else await api(`/routes/${routeId}/holidays`, { method: 'POST', body: JSON.stringify(body) });
    ov.remove(); onDone();
  });
}

// ==================== SHIFTS ====================
async function renderShiftList() {
  const w = ws();
  const d = today();
  w.innerHTML = `<header class="topbar"><div><h1>班次计划</h1><p>管理排班计划与任务生成</p></div><button id="add-sp">新增计划</button></header>
    <div class="filter-row"><label>日期<input id="sp-date" type="date" value="${d}"></label>
    <label>状态<select id="sp-status"><option value="">全部</option><option value="draft">草稿</option><option value="approved">已审批</option></select></label>
    <button id="sp-filter">查询</button></div>
    <div class="table-wrap"><table><thead><tr><th>ID</th><th>日期</th><th>线路</th><th>时段</th><th>车辆数</th><th>司机数</th><th>状态</th><th>操作</th></tr></thead><tbody id="sp-tb"></tbody></table></div>`;
  const loadList = async () => {
    const params = new URLSearchParams();
    const dateVal = q('#sp-date').value;
    const statusVal = q('#sp-status').value;
    if (dateVal) params.set('date', dateVal);
    if (statusVal) params.set('status', statusVal);
    const { data } = await api(`/shift-plans?${params}`);
    document.querySelector('#sp-tb').innerHTML = data.map(sp => `<tr>
      <td>${sp.id}</td><td>${sp.plan_date}</td><td><span class="detail-link" data-id="${sp.id}">${sp.route_name}</span></td>
      <td>${sp.period_name}</td><td>${sp.vehicle_count}</td><td>${sp.driver_count}</td><td>${badge(sp.status)}</td>
      <td><button class="btn-sm btn-outline view-sp" data-id="${sp.id}">查看</button></td></tr>`).join('') || '<tr><td colspan="8" class="empty-msg">暂无计划</td></tr>';
    w.querySelectorAll('.detail-link,.view-sp').forEach(el => el.onclick = () => { location.hash = `shifts/${el.dataset.id}`; });
  };
  q('#sp-filter').onclick = loadList;
  document.querySelector('#add-sp').onclick = () => showShiftPlanForm(() => renderShiftList());
  loadList();
}

function showShiftPlanForm(onDone) {
  (async () => {
    const { data: routes } = await api('/routes');
    showModal('新增班次计划', `<div class="form-grid">
      <label>计划日期 *<input id="f-spd" type="date" value="${today()}"></label>
      <label>线路 *<select id="f-spr">${routes.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}</select></label>
      <label>时段名称 *<input id="f-spp" placeholder="如: 早高峰"></label>
      <label>车辆数<input id="f-spv" type="number" value="1"></label>
      <label>司机数<input id="f-spdr" type="number" value="1"></label>
    </div>`, async (ov) => {
      const body = { plan_date: q('#f-spd').value, route_id: +q('#f-spr').value, period_name: q('#f-spp').value, vehicle_count: +q('#f-spv').value, driver_count: +q('#f-spdr').value };
      if (!body.plan_date || !body.route_id || !body.period_name) { alert('请填写必填项'); return; }
      await api('/shift-plans', { method: 'POST', body: JSON.stringify(body) });
      ov.remove(); onDone();
    });
  })();
}

async function renderShiftDetail(id) {
  const w = ws();
  const { data: plan, tasks } = await api(`/shift-plans/${id}`);
  w.innerHTML = `<header class="topbar"><div><h1>班次计划 - ${plan.route_name}</h1><p>${plan.plan_date} · ${plan.period_name} · ${badge(plan.status)}</p></div>
    <div><button class="btn-sm btn-outline" onclick="location.hash='#shifts'">返回列表</button>
    ${plan.status === 'draft' ? '<button class="btn-sm btn-success" id="sp-gen">生成任务</button>' : ''}
    ${plan.status === 'draft' ? '<button class="btn-sm btn-warn" id="sp-approve">审批通过</button>' : ''}</div></header>
    <div class="panel"><div class="panel-head"><h2>任务列表</h2><span>共 ${tasks.length} 条</span></div>
    <div class="table-wrap"><table><thead><tr><th>ID</th><th>线路</th><th>车辆</th><th>司机</th><th>类型</th><th>计划开始</th><th>计划结束</th><th>状态</th></tr></thead><tbody>${
    tasks.map(t => `<tr><td>${t.id}</td><td>${t.route_name}</td><td>${t.plate_no||'未分配'}</td><td>${t.driver_name||'未分配'}</td>
      <td>${t.task_type}</td><td>${(t.planned_start||'').slice(5,16)}</td><td>${(t.planned_end||'').slice(5,16)}</td><td>${badge(t.status)}</td></tr>`).join('')
    || '<tr><td colspan="8" class="empty-msg">暂无任务，请点击生成任务</td></tr>'}</tbody></table></div></div>`;
  const genBtn = document.querySelector('#sp-gen');
  if (genBtn) genBtn.onclick = async () => { await api(`/shift-plans/${id}/generate-tasks`, { method: 'POST' }); renderShiftDetail(id); };
  const appBtn = document.querySelector('#sp-approve');
  if (appBtn) appBtn.onclick = async () => { await api(`/shift-plans/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'approved', vehicle_count: plan.vehicle_count, driver_count: plan.driver_count }) }); renderShiftDetail(id); };
}

// ==================== DISPATCH ====================
async function renderDispatch() {
  const w = ws();
  w.innerHTML = `<header class="topbar"><div><h1>实时调度</h1><p>车辆位置、延误监控与调度操作</p></div><button id="dp-refresh">刷新</button></header>
    <div class="status-row" id="dp-metrics"></div>
    <div class="tabs" id="dp-tabs"><button class="active" data-tab="positions">车辆位置</button><button data-tab="running">运行班次</button><button data-tab="delayed">延误车辆</button><button data-tab="bunching">串车告警</button></div>
    <div id="dp-tab-content"></div>`;
  let curTab = 'positions';
  let dpData = null;

  const load = async () => {
    dpData = await api('/vehicle-positions');
    const posCount = dpData.positions.length;
    const delayedCount = dpData.delayed.length;
    const bunchCount = dpData.bunching.length;
    document.querySelector('#dp-metrics').innerHTML = [
      metric('定位车辆', posCount, '当前有位置数据'),
      metric('运行班次', dpData.running_dispatches.length, '正在执行'),
      metric('延误车辆', delayedCount, delayedCount > 0 ? '需关注' : '正常'),
      metric('串车告警', bunchCount, bunchCount > 0 ? '需处理' : '正常')
    ].join('');
    renderDpTab();
  };
  function renderDpTab() {
    document.querySelectorAll('#dp-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === curTab));
    const tc = document.querySelector('#dp-tab-content');
    if (curTab === 'positions') {
      tc.innerHTML = `<div class="table-wrap"><table><thead><tr><th>车牌</th><th>线路</th><th>速度(km/h)</th><th>当前站</th><th>下一站</th><th>预计到达(秒)</th><th>延误</th></tr></thead><tbody>${
        dpData.positions.map(p => `<tr><td>${p.plate_no}</td><td>${p.route_name||'-'}</td><td>${p.speed_kmh}</td>
          <td>${p.station_id||'-'}</td><td>${p.next_station_id||'-'}</td><td>${p.eta_seconds||'-'}</td>
          <td>${p.is_delayed ? `<span class="badge high">延误${p.delay_minutes}分</span>` : '<span class="badge low">正常</span>'}</td></tr>`).join('')
        || '<tr><td colspan="7" class="empty-msg">暂无位置数据</td></tr>'}</tbody></table></div>`;
    } else if (curTab === 'running') {
      tc.innerHTML = `<div class="table-wrap"><table><thead><tr><th>班次号</th><th>线路</th><th>车辆</th><th>发车时间</th><th>类型</th><th>操作</th></tr></thead><tbody>${
        dpData.running_dispatches.map(d => `<tr><td><strong>${d.dispatch_no}</strong></td><td>${d.route_name}</td><td>${d.plate_no}</td>
          <td>${(d.planned_departure||'').slice(5,16)}</td><td>${badge(d.dispatch_type)}</td>
          <td><button class="btn-sm btn-outline act-insert" data-id="${d.id}">插班</button>
            <button class="btn-sm btn-outline act-st" data-id="${d.id}">区间车</button>
            <button class="btn-sm btn-warn act-skip" data-id="${d.id}">跳站</button></td></tr>`).join('')
        || '<tr><td colspan="6" class="empty-msg">暂无运行班次</td></tr>'}</tbody></table></div>`;
      tc.querySelectorAll('.act-insert').forEach(b => b.onclick = () => showInsertRunForm(b.dataset.id, load));
      tc.querySelectorAll('.act-st').forEach(b => b.onclick = () => showShortTurnForm(b.dataset.id, load));
      tc.querySelectorAll('.act-skip').forEach(b => b.onclick = () => showSkipStationForm(b.dataset.id, load));
    } else if (curTab === 'delayed') {
      tc.innerHTML = `<div class="panel"><div class="panel-head"><h2>延误车辆</h2></div><div class="table-wrap"><table><thead><tr><th>车牌</th><th>线路</th><th>延误(分)</th></tr></thead><tbody>${
        dpData.delayed.map(d => `<tr><td>${d.plate_no}</td><td>${d.route_name||'-'}</td><td><span class="badge high">${d.delay_minutes} 分</span></td></tr>`).join('')
        || '<tr><td colspan="3" class="empty-msg">暂无延误</td></tr>'}</tbody></table></div></div>`;
    } else {
      tc.innerHTML = `<div class="panel"><div class="panel-head"><h2>串车告警</h2></div><div class="table-wrap"><table><thead><tr><th>车辆1</th><th>车辆2</th><th>线路</th><th>同站ID</th></tr></thead><tbody>${
        dpData.bunching.map(b => `<tr><td>${b.plate1}</td><td>${b.plate2}</td><td>${b.route_name||'-'}</td><td>${b.station_id||'-'}</td></tr>`).join('')
        || '<tr><td colspan="4" class="empty-msg">暂无串车告警</td></tr>'}</tbody></table></div></div>`;
    }
  }
  document.querySelectorAll('#dp-tabs button').forEach(b => b.onclick = () => { curTab = b.dataset.tab; renderDpTab(); });
  document.querySelector('#dp-refresh').onclick = load;
  load();
  refreshTimer = setInterval(load, 30000);
}

function showInsertRunForm(dispatchId, onDone) {
  (async () => {
    const [{ data: vehicles }, { data: drivers }] = await Promise.all([api('/vehicles'), api('/drivers')]);
    showModal('插班发车', `<div class="form-grid">
      <label>车辆 *<select id="f-iv">${vehicles.filter(v=>v.status!=='maintenance').map(v=>`<option value="${v.id}">${v.plate_no} (${v.model})</option>`).join('')}</select></label>
      <label>司机 *<select id="f-id">${drivers.filter(d=>d.status!=='leave').map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select></label>
      <label>计划发车 *<input id="f-idp" type="datetime-local"></label>
      <label>计划到达 *<input id="f-ida" type="datetime-local"></label>
      <label>备注<input id="f-inote" value="插班"></label>
    </div>`, async (ov) => {
      const body = { vehicle_id: +q('#f-iv').value, driver_id: +q('#f-id').value, planned_departure: q('#f-idp').value.replace('T',' '), planned_arrival: q('#f-ida').value.replace('T',' '), note: q('#f-inote').value };
      if (!body.planned_departure || !body.planned_arrival) { alert('请填写发车到达时间'); return; }
      await api(`/dispatches/${dispatchId}/insert-run`, { method: 'POST', body: JSON.stringify(body) });
      ov.remove(); onDone();
    });
  })();
}

function showShortTurnForm(dispatchId, onDone) {
  showModal('设置区间车', `<div class="form-grid">
    <label>区间起点站ID *<input id="f-ss" type="number"></label>
    <label>区间终点站ID *<input id="f-se" type="number"></label>
    <label>计划发车<input id="f-sdp" type="datetime-local"></label>
    <label>计划到达<input id="f-sda" type="datetime-local"></label>
    <label>备注<input id="f-snote" value="区间车"></label>
  </div>`, async (ov) => {
    const body = { short_turn_start: +q('#f-ss').value, short_turn_end: +q('#f-se').value, planned_departure: q('#f-sdp').value.replace('T',' '), planned_arrival: q('#f-sda').value.replace('T',' '), note: q('#f-snote').value };
    if (!body.short_turn_start || !body.short_turn_end) { alert('请填写区间起终点'); return; }
    await api(`/dispatches/${dispatchId}/short-turn`, { method: 'POST', body: JSON.stringify(body) });
    ov.remove(); onDone();
  });
}

function showSkipStationForm(dispatchId, onDone) {
  showModal('设置跳站', `<div class="form-grid">
    <label>跳站站点ID列表 *<input id="f-skip" placeholder="如: 3,5,7"></label>
    <label>备注<input id="f-skn" value="跳站"></label>
  </div>`, async (ov) => {
    const skip = q('#f-skip').value;
    if (!skip) { alert('请填写跳站列表'); return; }
    await api(`/dispatches/${dispatchId}/skip-station`, { method: 'POST', body: JSON.stringify({ skip_stations: skip, note: q('#f-skn').value }) });
    ov.remove(); onDone();
  });
}

// ==================== EVENTS ====================
async function renderEvents(actionId) {
  const w = ws();
  w.innerHTML = `<header class="topbar"><div><h1>事件处理</h1><p>调度事件管理、处理与指令下发</p></div><button id="add-evt">创建事件</button></header>
    <div class="filter-row">
      <label>类型<select id="ef-type"><option value="">全部</option>${Object.entries(eventTypes).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
      <label>严重度<select id="ef-sev"><option value="">全部</option>${Object.entries(severityText).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
      <label>状态<select id="ef-status"><option value="">全部</option><option value="open">待处理</option><option value="processing">处理中</option><option value="resolved">已解决</option><option value="closed">已关闭</option></select></label>
      <button id="ef-search">查询</button>
    </div>
    <div class="table-wrap"><table><thead><tr><th>ID</th><th>类型</th><th>线路</th><th>车辆</th><th>严重度</th><th>描述</th><th>状态</th><th>时间</th><th>操作</th></tr></thead><tbody id="evt-tb"></tbody></table></div>`;

  const loadEvents = async () => {
    const params = new URLSearchParams();
    const t = q('#ef-type').value, s = q('#ef-sev').value, st = q('#ef-status').value;
    if (t) params.set('event_type', t);
    if (s) params.set('severity', s);
    if (st) params.set('status', st);
    const { data } = await api(`/dispatch-events?${params}`);
    document.querySelector('#evt-tb').innerHTML = data.map(e => `<tr>
      <td>${e.id}</td><td>${eventTypes[e.event_type]||e.event_type}</td><td>${e.route_name||'-'}</td><td>${e.plate_no||'-'}</td>
      <td>${sevBadge(e.severity)}</td><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${e.description}">${e.description}</td>
      <td>${badge(e.status)}</td><td>${(e.reported_at||'').slice(5,16)}</td>
      <td>${e.status==='open'||e.status==='processing' ? `<button class="btn-sm btn-success resolve-evt" data-id="${e.id}">解决</button>` : ''}
        <button class="btn-sm btn-outline instr-evt" data-id="${e.id}">指令</button></td></tr>`).join('')
      || '<tr><td colspan="9" class="empty-msg">暂无事件</td></tr>';
    w.querySelectorAll('.resolve-evt').forEach(b => b.onclick = () => showResolveEventForm(b.dataset.id, loadEvents));
    w.querySelectorAll('.instr-evt').forEach(b => b.onclick = () => showInstructionForm(b.dataset.id, loadEvents));
  };
  q('#ef-search').onclick = loadEvents;
  document.querySelector('#add-evt').onclick = () => showCreateEventForm(loadEvents);
  loadEvents();
  if (actionId) {
    setTimeout(() => { const el = document.querySelector(`.resolve-evt[data-id="${actionId}"],.instr-evt[data-id="${actionId}"]`); if (el) el.click(); }, 500);
  }
}

function showCreateEventForm(onDone) {
  (async () => {
    const [{ data: routes }, { data: vehicles }, { data: drivers }] = await Promise.all([api('/routes'), api('/vehicles'), api('/drivers')]);
    showModal('创建事件', `<div class="form-grid">
      <label>事件类型 *<select id="f-et">${Object.entries(eventTypes).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
      <label>严重度<select id="f-es">${Object.entries(severityText).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select></label>
      <label>线路<select id="f-er"><option value="">-</option>${routes.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select></label>
      <label>车辆<select id="f-ev"><option value="">-</option>${vehicles.map(v=>`<option value="${v.id}">${v.plate_no}</option>`).join('')}</select></label>
      <label>司机<select id="f-ed"><option value="">-</option>${drivers.map(d=>`<option value="${d.id}">${d.name}</option>`).join('')}</select></label>
      <label>描述 *<textarea id="f-edesc"></textarea></label>
      <label>位置<input id="f-eloc"></label>
    </div>`, async (ov) => {
      const body = { event_type: q('#f-et').value, severity: q('#f-es').value, route_id: q('#f-er').value||null, vehicle_id: q('#f-ev').value||null, driver_id: q('#f-ed').value||null, description: q('#f-edesc').value, location: q('#f-eloc').value||null };
      if (!body.description) { alert('请填写事件描述'); return; }
      await api('/dispatch-events', { method: 'POST', body: JSON.stringify(body) });
      ov.remove(); onDone();
    });
  })();
}

function showResolveEventForm(id, onDone) {
  showModal('解决事件', `<div class="form-grid">
    <label>处理结果<select id="f-rs"><option value="resolved">已解决</option><option value="closed">已关闭</option></select></label>
    <label>解决方案<textarea id="f-rres"></textarea></label>
  </div>`, async (ov) => {
    const body = { status: q('#f-rs').value, resolution: q('#f-rres').value };
    await api(`/dispatch-events/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    ov.remove(); onDone();
  });
}

function showInstructionForm(id, onDone) {
  showModal('下发指令', `<div class="form-grid">
    <label>指令类型 *<input id="f-it" placeholder="如: dispatch_adjust, notify_driver"></label>
    <label>指令数据<textarea id="f-idata" placeholder="JSON 格式，如: {&quot;action&quot;:&quot;skip_station&quot;}"></textarea></label>
    <label>下发人<input id="f-iby" value="dispatcher"></label>
  </div>`, async (ov) => {
    const it = q('#f-it').value;
    if (!it) { alert('请填写指令类型'); return; }
    let data = {};
    try { data = JSON.parse(q('#f-idata').value || '{}'); } catch { alert('指令数据格式错误'); return; }
    await api(`/dispatch-events/${id}/instructions`, { method: 'POST', body: JSON.stringify({ instruction_type: it, instruction_data: data, issued_by: q('#f-iby').value }) });
    ov.remove(); onDone();
  });
}

// ==================== REPORTS ====================
async function renderReports() {
  const w = ws();
  w.innerHTML = `<header class="topbar"><div><h1>报表统计</h1><p>运营数据汇总与每日报表</p></div></header>
    <div class="tabs" id="rp-tabs"><button class="active" data-tab="summary">汇总报表</button><button data-tab="daily">日报表</button></div>
    <div id="rp-tab-content"></div>`;
  let curTab = 'summary';

  async function renderSummary() {
    const tc = document.querySelector('#rp-tab-content');
    tc.innerHTML = `<div class="filter-row"><label>开始日期<input id="rp-df" type="date"></label><label>结束日期<input id="rp-dt" type="date"></label><button id="rp-query">查询</button></div><div id="rp-summary-body"></div>`;
    const loadSummary = async () => {
      const params = new URLSearchParams();
      const df = q('#rp-df').value, dt = q('#rp-dt').value;
      if (df) params.set('date_from', df);
      if (dt) params.set('date_to', dt);
      const data = await api(`/reports/summary?${params}`);
      document.querySelector('#rp-summary-body').innerHTML = `
        <section class="stat-grid">${metric('准点率', data.onTimeRate + '%', `共 ${data.totalOnTime} 班准点`)}${metric('发车率', data.departRate + '%', `共 ${data.totalDispatches} 班计划`)}
          ${metric('事件原因', data.eventReasons.length + ' 种', '各类事件分布')}</section>
        <section class="grid">
          <article class="panel"><div class="panel-head"><h2>客流趋势</h2></div><div class="table-wrap"><table><thead><tr><th>日期</th><th>总客流</th><th>平均客流</th></tr></thead><tbody>${
            data.passengerFlow.map(f => `<tr><td>${f.date}</td><td>${f.total_passengers}</td><td>${Math.round(f.avg_passengers)}</td></tr>`).join('')
            || '<tr><td colspan="3" class="empty-msg">暂无数据</td></tr>'}</tbody></table></div></article>
          <article class="panel"><div class="panel-head"><h2>事件原因分布</h2></div><div class="table-wrap"><table><thead><tr><th>类型</th><th>次数</th></tr></thead><tbody>${
            data.eventReasons.map(r => `<tr><td>${eventTypes[r.event_type]||r.event_type}</td><td>${r.count}</td></tr>`).join('')
            || '<tr><td colspan="2" class="empty-msg">暂无数据</td></tr>'}</tbody></table></div></article>
        </section>
        <section style="margin-top:16px"><article class="panel"><div class="panel-head"><h2>车辆利用率</h2></div><div class="table-wrap"><table><thead><tr><th>车牌</th><th>车型</th><th>趟次</th><th>总客流</th><th>今日里程</th><th>总里程</th></tr></thead><tbody>${
          data.vehicleUtilization.map(v => `<tr><td>${v.plate_no}</td><td>${v.model}</td><td>${v.trip_count}</td><td>${v.total_load}</td><td>${v.km_today}km</td><td>${v.total_km}km</td></tr>`).join('')
          || '<tr><td colspan="6" class="empty-msg">暂无数据</td></tr>'}</tbody></table></div></article></section>
        <section style="margin-top:16px"><article class="panel"><div class="panel-head"><h2>线路绩效</h2></div><div class="table-wrap"><table><thead><tr><th>线路</th><th>总趟次</th><th>准点趟次</th><th>平均客流</th></tr></thead><tbody>${
          data.routePerformance.map(r => `<tr><td>${r.name}</td><td>${r.total_trips}</td><td>${r.on_time_trips||0}</td><td>${Math.round(r.avg_load||0)}</td></tr>`).join('')
          || '<tr><td colspan="4" class="empty-msg">暂无数据</td></tr>'}</tbody></table></div></article></section>`;
    };
    q('#rp-query').onclick = loadSummary;
    loadSummary();
  }

  async function renderDaily() {
    const tc = document.querySelector('#rp-tab-content');
    tc.innerHTML = `<div class="filter-row"><label>日期<input id="rp-dd" type="date" value="${today()}"></label><button id="rp-dq">查询</button></div><div id="rp-daily-body"></div>`;
    const loadDaily = async () => {
      const d = q('#rp-dd').value;
      const data = await api(`/reports/daily?date=${d}`);
      const s = data.stats;
      document.querySelector('#rp-daily-body').innerHTML = `
        <section class="stat-grid">${metric('总班次', s.total_dispatches, `${s.completed} 已完成 / ${s.running} 运行中 / ${s.scheduled} 待发车`)}
          ${metric('总客流', s.total_passengers, `平均 ${Math.round(s.avg_passengers)} 人/班`)}
          ${metric('车辆状态', data.vehicleStats.map(v=>`${v.count} ${statusText[v.status]||v.status}`).join(', '), '车辆分布')}
          ${metric('司机状态', data.driverStats.map(d=>`${d.count} ${statusText[d.status]||d.status}`).join(', '), '司机分布')}</section>
        <section class="grid">
          <article class="panel"><div class="panel-head"><h2>事件统计</h2></div><div class="table-wrap"><table><thead><tr><th>类型</th><th>严重度</th><th>次数</th></tr></thead><tbody>${
            data.events.map(e => `<tr><td>${eventTypes[e.event_type]||e.event_type}</td><td>${severityText[e.severity]||e.severity}</td><td>${e.count}</td></tr>`).join('')
            || '<tr><td colspan="3" class="empty-msg">暂无事件</td></tr>'}</tbody></table></div></article>
          <article class="panel"><div class="panel-head"><h2>车辆状态分布</h2></div><div class="bar-list">${
            data.vehicleStats.map(v => { const pct = Math.round(v.count / data.vehicleStats.reduce((a,x)=>a+x.count,0) * 100); return `<div class="bar-row"><div><strong>${statusText[v.status]||v.status}</strong><span>${v.count} 台</span></div><div class="bar"><i style="width:${pct}%"></i></div><b>${pct}%</b></div>`; }).join('')
          }</div></article>
        </section>`;
    };
    q('#rp-dq').onclick = loadDaily;
    loadDaily();
  }

  function renderRpTab() {
    document.querySelectorAll('#rp-tabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === curTab));
    if (curTab === 'summary') renderSummary();
    else renderDaily();
  }
  document.querySelectorAll('#rp-tabs button').forEach(b => b.onclick = () => { curTab = b.dataset.tab; renderRpTab(); });
  renderRpTab();
}

function q(sel) { return document.querySelector(sel); }

navigate();
