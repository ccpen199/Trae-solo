const statusEl = document.getElementById("connectionStatus");
const refreshBtn = document.getElementById("refreshButton");

function backendBaseUrl() {
  const url = new URL(window.location.href);
  const frontendPort = Number(url.port || 49232);
  const backendPort = frontendPort + 10000;
  return `${url.protocol}//${url.hostname}:${backendPort}`;
}

function setStatus(text, isError) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", !!isError);
}

async function api(path, method, body) {
  const opts = { method: method || "GET", cache: "no-store", headers: {} };
  if (body) {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${backendBaseUrl()}${path}`, opts);
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

function fmtDate(iso) {
  if (!iso) return "-";
  try { return new Date(iso).toLocaleString("zh-CN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }); }
  catch { return iso; }
}
function fmtDateShort(iso) {
  if (!iso) return "-";
  try { return new Date(iso).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" }); }
  catch { return iso; }
}
function timeAgo(iso) {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
}
function rankClass(n) { return n === 1 ? "" : n === 2 ? "r2" : n === 3 ? "r3" : "rn"; }
function posClass(n) { return n === 1 ? "top1" : n === 2 ? "top2" : n === 3 ? "top3" : ""; }
function emptyHtml(t) { return `<div class="empty">${t}</div>`; }
function loadingHtml() { return `<div class="loading">⏳ 数据加载中...</div>`; }

function srcChipCls(type) {
  if (!type) return "";
  if (["用户评价", "游客问卷", "家长访谈", "学员问卷"].includes(type)) return "src-user";
  if (["实地走访", "实地考察", "客户回访", "神秘顾客", "课堂观察", "现场监测"].includes(type)) return "src-field";
  if (["数据抓取", "API对接", "系统对接", "投诉分析", "成绩追踪", "线上数据", "投诉处理", "价格监测"].includes(type)) return "src-api";
  if (["官方数据", "病历核查", "资质核验", "服务档案", "专家评审", "人事档案现场核验记录"].includes(type)) return "src-official";
  return "";
}
function srcChipStyle(type) {
  const map = { "用户评价": "var(--blue-soft)", "实地走访": "var(--green-soft)", "实地考察": "var(--green-soft)", "客户回访": "var(--green-soft)", "游客问卷": "var(--blue-soft)", "家长访谈": "var(--blue-soft)", "学员问卷": "var(--blue-soft)", "数据抓取": "var(--purple-soft)", "API对接": "var(--purple-soft)", "官方数据": "var(--amber-soft)", "病历核查": "var(--amber-soft)", "神秘顾客": "var(--green-soft)", "课堂观察": "var(--green-soft)", "现场监测": "var(--green-soft)", "线上数据": "var(--purple-soft)", "投诉处理": "var(--purple-soft)", "服务档案": "var(--amber-soft)", "投诉分析": "var(--purple-soft)", "成绩追踪": "var(--purple-soft)", "专家评审": "var(--amber-soft)", "资质核验": "var(--amber-soft)", "价格监测": "var(--purple-soft)" };
  const bg = map[type];
  if (!bg) return "";
  return `background:${bg};`;
}
function srcChipColor(type) {
  const map = { "用户评价": "var(--blue)", "实地走访": "var(--green)", "实地考察": "var(--green)", "客户回访": "var(--green)", "游客问卷": "var(--blue)", "家长访谈": "var(--blue)", "学员问卷": "var(--blue)", "数据抓取": "var(--purple)", "API对接": "var(--purple)", "官方数据": "var(--amber)", "病历核查": "var(--amber)", "神秘顾客": "var(--green)", "课堂观察": "var(--green)", "现场监测": "var(--green)", "线上数据": "var(--purple)", "投诉处理": "var(--purple)", "服务档案": "var(--amber)", "投诉分析": "var(--purple)", "成绩追踪": "var(--purple)", "专家评审": "var(--amber)", "资质核验": "var(--amber)", "价格监测": "var(--purple)" };
  return map[type] || "var(--muted)";
}

function stateLabel(s) {
  const m = { pending: "待审核", reviewing: "审核中", approved: "已通过", rejected: "已驳回", resolved: "已处理", done: "已完成", ready: "就绪" };
  return m[s] || s;
}

/* ============ Tab Navigation ============ */
document.querySelectorAll("#mainTabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("#mainTabs .tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});
document.querySelectorAll(".btn-link[data-jump]").forEach(btn => {
  btn.addEventListener("click", () => {
    const t = document.querySelector(`#mainTabs .tab[data-tab="${btn.dataset.jump}"]`);
    if (t) t.click();
  });
});
function bindSubTabs(containerId, prefix) {
  document.querySelectorAll(`#${containerId} .sub-tab`).forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(`#${containerId} .sub-tab`).forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      document.querySelectorAll(`.sub-panel[id^="${prefix}-"]`).forEach(p => p.classList.remove("active"));
      const el = document.getElementById(`${prefix}-${t.dataset.sub}`);
      if (el) el.classList.add("active");
    });
  });
}
bindSubTabs("opsTabs", "sub");
bindSubTabs("trustTabs", "sub");

refreshBtn.addEventListener("click", () => loadAll());

/* ============ State ============ */
const S = { evalCat: "", evalKw: "", evalView: "units", rvStatus: "", brStatus: "", sentiment: "", apStatus: "", flStatus: "" };

/* ============ Overview ============ */
async function loadOverview() {
  const mGrid = document.getElementById("overviewMetrics");
  const catList = document.getElementById("evalByCategory");
  const sched = document.getElementById("todaySchedule");
  const ops = document.getElementById("opsOverview");
  const reports = document.getElementById("latestReports");
  mGrid.innerHTML = loadingHtml();
  try {
    const dash = await api("/api/dashboard");
    mGrid.innerHTML = (dash.metrics || []).map(m => `
      <article class="metric">
        <span>${m.label}</span>
        <strong>${m.value}</strong>
        <em>${m.trend}</em>
      </article>`).join("");

    const ov = await api("/api/overview");

    catList.innerHTML = (ov.evalByCategory || []).map(c => `
      <div class="card-row">
        <div class="rank-badge ${rankClass(c.count >= 5 ? 1 : 0)}">${c.category.slice(0, 1)}</div>
        <div class="card-main">
          <h3>${c.category}</h3>
          <p>机构数 ${c.count} · 平均评分 ${c.avg_score}</p>
          <div class="card-meta"><span class="tag cat-${c.category}">${c.category}</span></div>
        </div>
        <div class="card-actions">
          <div class="score-big">${c.avg_score}<span class="suf">/100</span></div>
          <button class="btn-sm btn-ghost" data-cat="${c.category}" data-goto="eval">查看评测 →</button>
        </div>
      </div>`).join("");
    catList.querySelectorAll("button[data-goto=eval]").forEach(b => {
      b.addEventListener("click", () => {
        document.querySelector('#mainTabs .tab[data-tab="eval"]').click();
        const seg = document.querySelector(`#evalCategorySeg .seg-btn[data-cat="${b.dataset.cat}"]`);
        if (seg) seg.click();
      });
    });

    const today = ov.todaySchedule || [];
    if (!today.length) {
      sched.innerHTML = emptyHtml("今日暂无排期");
    } else {
      let tP = 0, tC = 0, tD = 0;
      today.forEach(t => { tP += t.planned; tC += t.completed; tD += t.delayed; });
      const pct = tP ? Math.round(tC / tP * 100) : 0;
      sched.innerHTML = `
        <div class="card-row" style="grid-template-columns:1fr">
          <div class="card-main">
            <h3>今日总览</h3>
            <p>计划 ${tP} 项 · 已完成 ${tC} 项 · 延期 ${tD} 项 · 完成率 ${pct}%</p>
            <div class="progress" style="margin-top:10px"><div class="progress-fill ${pct < 100 ? 'partial' : ''}" style="width:${pct}%"></div></div>
          </div>
        </div>
        ${today.map(t => {
          const p = t.planned || 0, c = t.completed || 0, d = t.delayed || 0;
          const pct2 = p ? Math.round(c / p * 100) : 0;
          return `<div class="card-row">
            <div class="rank-badge rn" style="background:var(--blue);color:#fff">${t.category.slice(0, 2)}</div>
            <div class="card-main">
              <h3>${t.category}</h3>
              <p>计划 ${p} · 完成 ${c} · 延期 ${d}</p>
              <div class="progress" style="margin-top:8px"><div class="progress-fill ${pct2 < 100 ? 'partial' : ''}" style="width:${pct2}%"></div></div>
            </div>
            <div class="card-actions"><div class="score-big">${pct2}<span class="suf">%</span></div></div>
          </div>`;
        }).join("")}`;
    }

    const rs = ov.reviewerStats || {};
    const as2 = ov.appealStats || {};
    const bs = ov.brandStats || {};
    ops.innerHTML = `
      <div class="ops-card pending"><div><div class="kicker">评测员待审核</div><div>资质核验与背景调查</div></div><div class="count-big">${rs.pending || 0}</div></div>
      <div class="ops-card reviewing"><div><div class="kicker">品牌入驻审核中</div><div>资料核验与资质比对</div></div><div class="count-big">${bs.reviewing || 0}</div></div>
      <div class="ops-card pending"><div><div class="kicker">申诉待响应</div><div>品牌方争议核查通道</div></div><div class="count-big">${as2.pending || 0}</div></div>
      <div class="ops-card reviewing"><div><div class="kicker">申诉处理中</div><div>证据比对与报告复核</div></div><div class="count-big">${as2.reviewing || 0}</div></div>`;

    const rep = await api("/api/eval-reports");
    const rlist = (rep.data || []).slice(0, 5);
    if (!rlist.length) { reports.innerHTML = emptyHtml("暂无报告"); }
    else {
      reports.innerHTML = rlist.map(r => `
        <div class="card-row">
          <div class="rank-badge" style="background:linear-gradient(135deg,var(--accent),var(--blue))">📄</div>
          <div class="card-main">
            <h3>${r.title}</h3>
            <p>${r.unit_name || ""} · ${r.author} · ${timeAgo(r.collected_at)}</p>
            <div class="card-meta"><span class="tag cat-${r.unit_category}">${r.unit_category}</span><span class="tag">来源：${r.sources}</span></div>
          </div>
          <div class="card-actions">
            <div class="score-big">${r.score}<span class="suf">分</span></div>
            <button class="btn-sm" data-report-btn="${r.id}">深读报告 →</button>
          </div>
        </div>`).join("");
      reports.querySelectorAll("button[data-report-btn]").forEach(b => {
        b.addEventListener("click", () => openReport(Number(b.dataset.reportBtn)));
      });
    }
    setStatus("API Online");
  } catch (e) {
    mGrid.innerHTML = emptyHtml("数据加载失败");
    setStatus("API Error", true);
  }
}

/* ============ Eval Tab ============ */
document.querySelectorAll("#evalCategorySeg .seg-btn").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#evalCategorySeg .seg-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    S.evalCat = b.dataset.cat;
    loadEvalUnits();
    loadCityRankings();
    loadReportsView();
  });
});
const kwInput = document.getElementById("evalKeyword");
let kwTimer;
kwInput.addEventListener("input", () => {
  clearTimeout(kwTimer);
  kwTimer = setTimeout(() => { S.evalKw = kwInput.value.trim(); loadEvalUnits(); }, 220);
});
document.querySelectorAll(".eval-view-switch .view-btn").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".eval-view-switch .view-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    S.evalView = b.dataset.view;
    document.querySelectorAll(".view-pane").forEach(p => p.classList.remove("active"));
    document.getElementById(`eval${b.dataset.view.charAt(0).toUpperCase() + b.dataset.view.slice(1)}View`).classList.add("active");
  });
});

async function loadEvalUnits() {
  const box = document.getElementById("evalUnitsView");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/eval-units?";
    if (S.evalCat) url += `category=${encodeURIComponent(S.evalCat)}&`;
    if (S.evalKw) url += `keyword=${encodeURIComponent(S.evalKw)}&`;
    const data = await api(url);
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("未找到匹配的评测单元，请调整筛选条件"); return; }
    box.innerHTML = list.map(u => `
      <div class="card-row">
        <div class="rank-badge ${rankClass(u.rank)}">No.${u.rank}</div>
        <div class="card-main">
          <h3>${u.name}</h3>
          <p>${u.city} · 累计评价 ${u.reviews} 条 · 更新于 ${fmtDateShort(u.updated_at)}</p>
          <div class="card-meta">
            <span class="tag cat-${u.category}">${u.category}</span>
            ${(u.tags || "").split(",").filter(Boolean).map(t => `<span class="tag">${t}</span>`).join("")}
          </div>
        </div>
        <div class="card-actions">
          <div class="score-big">${u.score}<span class="suf">分</span></div>
          <div class="row-actions">
            <button class="btn-sm btn-ghost" data-unit-reports="${u.id}">相关报告</button>
            <button class="btn-sm" data-unit-id="${u.id}" data-name="${u.name}">进入评测</button>
          </div>
        </div>
      </div>`).join("");
    box.querySelectorAll("button[data-unit-reports]").forEach(b => {
      b.addEventListener("click", async () => {
        document.querySelector('.eval-view-switch .view-btn[data-view="reports"]').click();
        const rep = await api(`/api/eval-reports?unit_id=${b.dataset.unitReports}`);
        renderReportList(rep.data || []);
      });
    });
    box.querySelectorAll("button[data-unit-id]").forEach(b => {
      b.addEventListener("click", async () => {
        const rep = await api(`/api/eval-reports?unit_id=${b.dataset.unitId}`);
        if (rep.data && rep.data.length > 0) openReport(rep.data[0].id);
        else alert(`${b.dataset.name} 暂无深度评测报告`);
      });
    });
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

async function loadCityRankings() {
  const box = document.getElementById("evalRankingView");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/city-rankings";
    if (S.evalCat) url += `?category=${encodeURIComponent(S.evalCat)}`;
    const data = await api(url);
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("暂无城市榜单数据"); return; }
    const grouped = {};
    list.forEach(r => { if (!grouped[r.category]) grouped[r.category] = []; grouped[r.category].push(r); });
    box.innerHTML = Object.entries(grouped).map(([cat, items]) => `
      <div style="margin-bottom:18px">
        <div class="panel-head" style="margin-bottom:10px;padding:0">
          <div><p class="eyebrow">城市榜单</p><h2><span class="tag cat-${cat}" style="font-size:13px;padding:4px 12px">${cat}</span></h2></div>
        </div>
        ${items.slice(0, 5).map((r, i) => `
          <div class="rank-row">
            <div class="rank-pos ${posClass(i + 1)}">${i + 1}</div>
            <div><strong>${r.city}</strong><div style="font-size:12px;color:var(--muted);margin-top:2px">评测机构 ${r.unit_count} 家</div></div>
            <div class="score-big" style="font-size:22px">${r.avg_score}</div>
            <div class="extra" style="font-size:12px;color:var(--muted);text-align:right">机构密度<br/>${r.unit_count} 家/市</div>
            <div class="extra"><button class="btn-sm btn-ghost" data-rank-city="${r.city}" data-rank-cat="${cat}">查看详情 →</button></div>
          </div>`).join("")}
      </div>`).join("");
    box.querySelectorAll("button[data-rank-city]").forEach(b => {
      b.addEventListener("click", () => {
        document.querySelector('.eval-view-switch .view-btn[data-view="units"]').click();
        kwInput.value = b.dataset.rankCity;
        kwInput.dispatchEvent(new Event("input"));
      });
    });
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

function renderReportList(list) {
  const box = document.getElementById("evalReportsView");
  if (!list.length) { box.innerHTML = emptyHtml("暂无深度评测报告"); return; }
  box.innerHTML = list.map(r => `
    <div class="card-row">
      <div class="rank-badge" style="background:linear-gradient(135deg,var(--purple),var(--blue))">📖</div>
      <div class="card-main">
        <h3>${r.title}</h3>
        <p>${r.unit_name || ""} · 作者：${r.author} · 数据采集时间：${fmtDate(r.collected_at)}</p>
        <div class="card-meta"><span class="tag cat-${r.unit_category}">${r.unit_category}</span><span class="tag">📊 ${r.sources}</span></div>
      </div>
      <div class="card-actions">
        <div class="score-big">${r.score}<span class="suf">分</span></div>
        <button class="btn-sm" data-r-id="${r.id}">报告深读 →</button>
      </div>
    </div>`).join("");
  box.querySelectorAll("button[data-r-id]").forEach(b => {
    b.addEventListener("click", () => openReport(Number(b.dataset.rId)));
  });
}

async function loadReportsView() {
  const box = document.getElementById("evalReportsView");
  box.innerHTML = loadingHtml();
  try {
    const data = await api("/api/eval-reports");
    let list = data.data || [];
    if (S.evalCat) list = list.filter(r => r.unit_category === S.evalCat);
    renderReportList(list);
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Report Modal ============ */
const modal = document.getElementById("reportModal");
document.getElementById("closeModal").addEventListener("click", () => modal.classList.remove("active"));
modal.addEventListener("click", e => { if (e.target === modal) modal.classList.remove("active"); });

async function openReport(id) {
  modal.classList.add("active");
  document.getElementById("modalBreadcrumb").textContent = "加载中...";
  document.getElementById("modalTitle").textContent = "报告详情";
  document.getElementById("modalBody").innerHTML = loadingHtml();
  try {
    const data = await api(`/api/eval-reports/${id}`);
    const r = data.report || {};
    const q = data.quality || [];
    const fl = data.flows || [];
    const tr = data.traces || [];
    document.getElementById("modalBreadcrumb").textContent = `${r.unit_category || ""} › ${r.unit_city || ""} › ${r.unit_name || ""}`;
    document.getElementById("modalTitle").textContent = r.title || "报告详情";

    const scoreStats = q.length ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-top:12px">
        <div style="padding:10px;background:var(--surface-2);border-radius:7px;text-align:center">
          <div style="font-size:11px;color:var(--muted);font-weight:700">质检综合分</div>
          <div style="font-size:22px;font-weight:900;color:var(--accent-strong);margin-top:4px">${q[0].quality_score.toFixed(1)}</div>
        </div>
        <div style="padding:10px;background:var(--surface-2);border-radius:7px;text-align:center">
          <div style="font-size:11px;color:var(--muted);font-weight:700">数据准确性</div>
          <div style="font-size:22px;font-weight:900;color:var(--blue);margin-top:4px">${q[0].accuracy.toFixed(1)}</div>
        </div>
        <div style="padding:10px;background:var(--surface-2);border-radius:7px;text-align:center">
          <div style="font-size:11px;color:var(--muted);font-weight:700">分析深度</div>
          <div style="font-size:22px;font-weight:900;color:var(--purple);margin-top:4px">${q[0].depth.toFixed(1)}</div>
        </div>
        <div style="padding:10px;background:var(--surface-2);border-radius:7px;text-align:center">
          <div style="font-size:11px;color:var(--muted);font-weight:700">时效性</div>
          <div style="font-size:22px;font-weight:900;color:var(--amber);margin-top:4px">${q[0].timeliness.toFixed(1)}</div>
        </div>
      </div>` : "";

    const tracesHtml = tr.length ? `
      <div class="report-section">
        <h3>🛡️ 数据来源溯源 · 采集时间与可信度</h3>
        ${tr.map(t => `
          <div class="trace-row">
            <div>
              <div style="font-weight:700;font-size:13px">${t.data_point}</div>
              <div style="font-size:11px;color:var(--muted);margin-top:2px">采集：${fmtDate(t.collected_at)}</div>
            </div>
            <div><span class="src-chip" style="background:var(--surface);border:1px solid var(--line)">采集方：${t.collector}</span></div>
            <div style="font-size:12px;color:var(--ink-soft);word-break:break-all">🔗 ${t.source_url}</div>
            <div><span class="src-chip" style="${srcChipStyle(t.source_type)}color:${srcChipColor(t.source_type)}">${t.source_type}</span></div>
            <div>
              <div style="font-size:11px;color:var(--muted);text-align:center">置信度</div>
              <div style="font-weight:900;font-size:16px;color:var(--accent-strong);text-align:center">${Math.round(t.confidence * 100)}%</div>
            </div>
          </div>`).join("")}
      </div>` : "";

    const flowsHtml = fl.length ? `
      <div class="report-section">
        <h3>📋 审核复查流</h3>
        <div class="timeline">
          ${fl.map(f => `
            <div class="tl-item ${f.status === 'pending' ? 'pending' : ''}">
              <div class="tl-head">
                <h4>${f.stage}</h4>
                <span class="state ${f.status || 'approved'}">${f.status === 'approved' ? '已完成' : f.status === 'pending' ? '进行中' : f.status === 'resolved' ? '已解决' : stateLabel(f.status)}</span>
              </div>
              <div class="tl-meta">
                <span>👤 ${f.handler}</span>
                <span>🏷️ ${f.action}</span>
                <span>🕒 ${fmtDate(f.created_at)}</span>
              </div>
              ${f.comment ? `<div class="tl-comment">💬 ${f.comment}</div>` : ""}
            </div>`).join("")}
        </div>
      </div>` : "";

    const qualityHtml = q.length ? `
      <div class="report-section">
        <h3>⭐ 质量评分详情</h3>
        ${q.map(qq => `
          <div class="card-row" style="grid-template-columns:1fr">
            <div class="card-main">
              <h3>${qq.reviewer} 评分 · ${qq.quality_score.toFixed(1)} 分</h3>
              <p>准确性 ${qq.accuracy} · 深度 ${qq.depth} · 时效性 ${qq.timeliness} · ${fmtDate(qq.scored_at)}</p>
              <div style="margin-top:8px;padding:10px;background:var(--surface);border-radius:7px;color:var(--ink-soft);font-size:13px">📝 ${qq.comment}</div>
            </div>
          </div>`).join("")}
      </div>` : "";

    document.getElementById("modalBody").innerHTML = `
      <div class="report-section">
        <div class="report-summary-card">
          <div class="big-score">${r.score || 0} 分</div>
          <div style="display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--ink-soft)">
            <span>👤 ${r.author}</span>
            <span>📅 采集时间：${fmtDate(r.collected_at)}</span>
            <span>📊 来源构成：${r.sources}</span>
          </div>
          <p>${r.summary || ""}</p>
        </div>
        ${scoreStats}
      </div>
      ${tracesHtml}
      ${qualityHtml}
      ${flowsHtml}`;
  } catch (e) {
    document.getElementById("modalBody").innerHTML = emptyHtml("报告加载失败，请重试");
  }
}

/* ============ Ops: Reviewers ============ */
document.querySelectorAll("[data-rv-status]").forEach(b => {
  b.addEventListener("click", () => {
    b.closest(".seg").querySelectorAll(".seg-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    S.rvStatus = b.dataset.rvStatus;
    loadReviewers();
  });
});

async function loadReviewers() {
  const box = document.getElementById("reviewersList");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/reviewers";
    if (S.rvStatus) url += `?status=${encodeURIComponent(S.rvStatus)}`;
    const data = await api(url);
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("暂无评测员记录"); return; }
    box.innerHTML = list.map(rv => `
      <div class="card-row">
        <div class="rank-badge ${rv.status === 'approved' ? '' : 'rn'}" style="${rv.status === 'approved' ? '' : rv.status === 'pending' ? 'background:var(--amber);color:#fff' : rv.status === 'reviewing' ? 'background:var(--blue);color:#fff' : 'background:var(--red);color:#fff'}">👤</div>
        <div class="card-main">
          <h3>${rv.name} · ${rv.title}</h3>
          <p>证书编号：${rv.license} · 提交时间：${fmtDate(rv.submitted_at)}</p>
          <div style="margin-top:6px;font-size:13px;color:var(--ink-soft)">经验：${rv.experience}</div>
          <div class="card-meta" style="margin-top:4px"><span class="state ${rv.status}">${stateLabel(rv.status)}</span></div>
        </div>
        <div class="card-actions">
          <div class="row-actions">
            ${rv.status === 'pending' || rv.status === 'reviewing' ? `<button class="btn-sm" data-approve-rv="${rv.id}">通过</button><button class="btn-sm btn-danger" data-reject-rv="${rv.id}">驳回</button>` : ''}
          </div>
        </div>
      </div>`).join("");
    box.querySelectorAll("[data-approve-rv]").forEach(b => {
      b.addEventListener("click", async () => {
        await api("/api/reviewers/approve", "POST", { id: Number(b.dataset.approveRv) });
        loadReviewers();
      });
    });
    box.querySelectorAll("[data-reject-rv]").forEach(b => {
      b.addEventListener("click", async () => {
        await api("/api/reviewers/reject", "POST", { id: Number(b.dataset.rejectRv) });
        loadReviewers();
      });
    });
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Ops: Quality ============ */
async function loadQuality() {
  const box = document.getElementById("qualityList");
  box.innerHTML = loadingHtml();
  try {
    const data = await api("/api/report-quality");
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("暂无质量评分记录"); return; }
    box.innerHTML = list.map(q => `
      <div class="card-row">
        <div class="rank-badge" style="background:linear-gradient(135deg,var(--accent),var(--blue))">⭐</div>
        <div class="card-main">
          <h3>${q.report_title || "报告#" + q.report_id}</h3>
          <p>评分人：${q.reviewer} · 评分时间：${fmtDate(q.scored_at)}</p>
          <div style="display:flex;gap:12px;margin-top:6px;flex-wrap:wrap">
            <span class="tag" style="background:var(--accent-soft);color:var(--accent-strong)">综合 ${q.quality_score.toFixed(1)}</span>
            <span class="tag" style="background:var(--blue-soft);color:var(--blue)">准确性 ${q.accuracy.toFixed(1)}</span>
            <span class="tag" style="background:var(--purple-soft);color:var(--purple)">深度 ${q.depth.toFixed(1)}</span>
            <span class="tag" style="background:var(--amber-soft);color:var(--amber)">时效 ${q.timeliness.toFixed(1)}</span>
          </div>
          <div style="margin-top:8px;padding:8px 10px;background:var(--surface);border-radius:6px;font-size:13px;color:var(--ink-soft)">📝 ${q.comment}</div>
        </div>
        <div class="card-actions">
          <div class="score-big">${q.quality_score.toFixed(1)}<span class="suf">分</span></div>
          <button class="btn-sm btn-ghost" data-q-report="${q.report_id}">查看报告 →</button>
        </div>
      </div>`).join("");
    box.querySelectorAll("[data-q-report]").forEach(b => {
      b.addEventListener("click", () => openReport(Number(b.dataset.qReport)));
    });
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Ops: Brands ============ */
document.querySelectorAll("[data-br-status]").forEach(b => {
  b.addEventListener("click", () => {
    b.closest(".seg").querySelectorAll(".seg-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    S.brStatus = b.dataset.brStatus;
    loadBrands();
  });
});

async function loadBrands() {
  const box = document.getElementById("brandsList");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/brand-applications";
    if (S.brStatus) url += `?status=${encodeURIComponent(S.brStatus)}`;
    const data = await api(url);
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("暂无品牌入驻申请"); return; }
    box.innerHTML = list.map(b2 => `
      <div class="card-row">
        <div class="rank-badge" style="${b2.status === 'approved' ? 'background:var(--green)' : b2.status === 'pending' ? 'background:var(--amber)' : b2.status === 'reviewing' ? 'background:var(--blue)' : 'background:var(--red)'};color:#fff">🏢</div>
        <div class="card-main">
          <h3>${b2.brand_name}</h3>
          <p>${b2.category} · 联系人：${b2.contact_person} ${b2.contact_phone} · 许可证：${b2.license_no}</p>
          <p style="margin-top:2px">提交时间：${fmtDate(b2.submitted_at)}</p>
          <div class="card-meta" style="margin-top:4px"><span class="state ${b2.status}">${stateLabel(b2.status)}</span><span class="tag cat-${b2.category}">${b2.category}</span></div>
        </div>
        <div class="card-actions">
          <div class="row-actions">
            ${b2.status === 'pending' || b2.status === 'reviewing' ? `<button class="btn-sm" data-approve-br="${b2.id}">批准入驻</button><button class="btn-sm btn-danger" data-reject-br="${b2.id}">驳回</button>` : ''}
          </div>
        </div>
      </div>`).join("");
    box.querySelectorAll("[data-approve-br]").forEach(b => {
      b.addEventListener("click", async () => {
        await api("/api/brands/approve", "POST", { id: Number(b.dataset.approveBr) });
        loadBrands();
      });
    });
    box.querySelectorAll("[data-reject-br]").forEach(b => {
      b.addEventListener("click", async () => {
        await api("/api/brands/reject", "POST", { id: Number(b.dataset.rejectBr) });
        loadBrands();
      });
    });
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Ops: Public Opinion ============ */
document.querySelectorAll("[data-sentiment]").forEach(b => {
  b.addEventListener("click", () => {
    b.closest(".seg").querySelectorAll(".seg-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    S.sentiment = b.dataset.sentiment;
    loadOpinion();
  });
});

async function loadOpinion() {
  const box = document.getElementById("opinionList");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/public-opinion";
    if (S.sentiment) url += `?sentiment=${encodeURIComponent(S.sentiment)}`;
    const data = await api(url);
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("暂无舆情数据"); return; }
    box.innerHTML = list.map(o => {
      const sentCls = o.sentiment === 'positive' ? 'pos' : o.sentiment === 'negative' ? 'neg' : 'neu';
      const sentText = o.sentiment === 'positive' ? '正面' : o.sentiment === 'negative' ? '负面' : '中性';
      const trendCls = o.trend === 'rising' ? 'up' : o.trend === 'declining' ? 'down' : 'stable';
      const trendText = o.trend === 'rising' ? '↑ 上升' : o.trend === 'declining' ? '↓ 下降' : '→ 稳定';
      return `
        <div class="op-row">
          <div><span class="sent-tag ${sentCls}">${sentText}</span></div>
          <div class="op-head">
            <h4>${o.title}</h4>
            <div class="src">来源：${o.source} · ${o.related_brand} · ${timeAgo(o.published_at)}</div>
          </div>
          <div class="vol-badge">${o.volume}</div>
          <div class="trend-arrow ${trendCls}">${trendText}</div>
          <div><button class="btn-sm btn-ghost" data-op-brand="${o.related_brand}">关联品牌 →</button></div>
        </div>`;
    }).join("");
    box.querySelectorAll("[data-op-brand]").forEach(b => {
      b.addEventListener("click", () => {
        document.querySelector('#mainTabs .tab[data-tab="eval"]').click();
        kwInput.value = b.dataset.opBrand;
        kwInput.dispatchEvent(new Event("input"));
      });
    });
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Ops: Appeals ============ */
document.querySelectorAll("[data-ap-status]").forEach(b => {
  b.addEventListener("click", () => {
    b.closest(".seg").querySelectorAll(".seg-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    S.apStatus = b.dataset.apStatus;
    loadAppeals();
  });
});

async function loadAppeals() {
  const box = document.getElementById("appealsList");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/appeals";
    if (S.apStatus) url += `?status=${encodeURIComponent(S.apStatus)}`;
    const data = await api(url);
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("暂无申诉记录"); return; }
    box.innerHTML = list.map(a => `
      <div class="card-row">
        <div class="rank-badge" style="${a.status === 'resolved' ? 'background:var(--green)' : a.status === 'pending' ? 'background:var(--amber)' : 'background:var(--blue)'};color:#fff">⚖️</div>
        <div class="card-main">
          <h3>${a.appellant} 申诉</h3>
          <p>关联报告：${a.report_title || "报告#" + a.report_id}</p>
          <div style="margin-top:6px;font-size:13px;color:var(--ink-soft)"><strong>申诉理由：</strong>${a.reason}</div>
          <div style="margin-top:4px;font-size:13px;color:var(--muted)"><strong>证据：</strong>${a.evidence}</div>
          <div class="card-meta" style="margin-top:6px">
            <span class="state ${a.status}">${stateLabel(a.status)}</span>
            <span class="tag">处理人：${a.handler}</span>
            <span class="tag">提交：${fmtDate(a.submitted_at)}</span>
          </div>
        </div>
        <div class="card-actions">
          <div class="row-actions">
            ${a.status === 'pending' || a.status === 'reviewing' ? `<button class="btn-sm" data-resolve-ap="${a.id}" data-ap-report="${a.report_id}">标记已处理</button>` : ''}
            <button class="btn-sm btn-ghost" data-ap-report-view="${a.report_id}">查看报告 →</button>
          </div>
        </div>
      </div>`).join("");
    box.querySelectorAll("[data-resolve-ap]").forEach(b => {
      b.addEventListener("click", async () => {
        const comment = prompt("请输入处理备注：");
        if (comment === null) return;
        await api("/api/appeals/resolve", "POST", { id: Number(b.dataset.resolveAp), report_id: Number(b.dataset.apReport), comment });
        loadAppeals();
      });
    });
    box.querySelectorAll("[data-ap-report-view]").forEach(b => {
      b.addEventListener("click", () => openReport(Number(b.dataset.apReportView)));
    });
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Trust: Traceability ============ */
let allReports = [];
async function loadTraceReports() {
  try {
    const data = await api("/api/eval-reports");
    allReports = data.data || [];
    const sel = document.getElementById("traceReportSelect");
    sel.innerHTML = `<option value="">-- 请选择报告 --</option>` + allReports.map(r => `<option value="${r.id}">${r.title}</option>`).join("");
  } catch (e) {}
}

document.getElementById("traceReportSelect").addEventListener("change", async function () {
  const id = this.value;
  const info = document.getElementById("traceInfo");
  const list = document.getElementById("traceList");
  if (!id) { info.innerHTML = ""; list.innerHTML = emptyHtml("请选择一份报告查看溯源数据"); return; }
  list.innerHTML = loadingHtml();
  try {
    const data = await api(`/api/eval-reports/${id}`);
    const r = data.report || {};
    const tr = data.traces || [];
    info.innerHTML = `
      <div><label>报告标题</label><strong>${r.title}</strong></div>
      <div><label>评测对象</label><strong>${r.unit_name || "-"}</strong></div>
      <div><label>类目/城市</label><strong>${r.unit_category || "-"} / ${r.unit_city || "-"}</strong></div>
      <div><label>综合评分</label><strong>${r.score}</strong></div>
      <div><label>数据采集时间</label><strong>${fmtDate(r.collected_at)}</strong></div>
      <div><label>来源构成</label><strong>${r.sources}</strong></div>
      <div><label>溯源数据点</label><strong>${tr.length} 条</strong></div>
      <div><label>平均置信度</label><strong>${tr.length ? (tr.reduce((s, t) => s + t.confidence, 0) / tr.length * 100).toFixed(1) + '%' : '-'}</strong></div>`;
    if (!tr.length) { list.innerHTML = emptyHtml("该报告暂无溯源数据"); return; }
    list.innerHTML = tr.map(t => `
      <div class="trace-row">
        <div>
          <div style="font-weight:700;font-size:13px">${t.data_point}</div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">采集时间：${fmtDate(t.collected_at)}</div>
        </div>
        <div><span class="src-chip" style="background:var(--surface);border:1px solid var(--line)">采集方：${t.collector}</span></div>
        <div style="font-size:12px;color:var(--ink-soft);word-break:break-all">🔗 ${t.source_url}</div>
        <div><span class="src-chip" style="${srcChipStyle(t.source_type)}color:${srcChipColor(t.source_type)}">${t.source_type}</span></div>
        <div>
          <div style="font-size:11px;color:var(--muted);text-align:center">置信度</div>
          <div style="font-weight:900;font-size:16px;color:var(--accent-strong);text-align:center">${Math.round(t.confidence * 100)}%</div>
        </div>
      </div>`).join("");
  } catch (e) { list.innerHTML = emptyHtml("加载失败"); }
});

/* ============ Trust: Weights ============ */
document.getElementById("weightCategory").addEventListener("change", loadWeights);
async function loadWeights() {
  const box = document.getElementById("weightsList");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/dynamic-weights";
    const cat = document.getElementById("weightCategory").value;
    if (cat) url += `?category=${encodeURIComponent(cat)}`;
    const data = await api(url);
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("暂无动态权重数据"); return; }
    const grouped = {};
    list.forEach(w => { if (!grouped[w.category]) grouped[w.category] = []; grouped[w.category].push(w); });
    box.innerHTML = Object.entries(grouped).map(([cat2, items]) => `
      <div style="margin-bottom:18px">
        <div class="panel-head" style="margin-bottom:10px;padding:0">
          <div><p class="eyebrow">评分权重</p><h2><span class="tag cat-${cat2}" style="font-size:13px;padding:4px 12px">${cat2}</span></h2></div>
        </div>
        ${items.map(w => {
          const delta = w.current_weight - w.prev_weight;
          const deltaCls = delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : 'delta-flat';
          const deltaText = delta > 0 ? `↑+${(delta * 100).toFixed(0)}%` : delta < 0 ? `↓${(delta * 100).toFixed(0)}%` : '→ 不变';
          return `
            <div class="weight-row">
              <div class="weight-head">
                <div class="labels">
                  <strong style="font-size:14px">${w.dimension}</strong>
                  <span class="tag cat-${cat2}">${cat2}</span>
                </div>
                <div style="font-weight:900;font-size:18px;color:var(--accent-strong)">${(w.current_weight * 100).toFixed(0)}%</div>
              </div>
              <div class="weight-bar"><div class="weight-fill" style="width:${w.current_weight * 100}%"></div></div>
              <div class="weight-meta">
                <span>上期：<strong>${(w.prev_weight * 100).toFixed(0)}%</strong></span>
                <span>变动：<strong class="${deltaCls}">${deltaText}</strong></span>
                <span>原因：${w.reason}</span>
                <span>更新：${fmtDateShort(w.updated_at)}</span>
              </div>
            </div>`;
        }).join("")}
      </div>`).join("");
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Trust: Competitor Matrix ============ */
document.getElementById("matrixCategory").addEventListener("change", loadMatrix);
async function loadMatrix() {
  const box = document.getElementById("matrixList");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/competitor-matrix";
    const cat = document.getElementById("matrixCategory").value;
    if (cat) url += `?category=${encodeURIComponent(cat)}`;
    const data = await api(url);
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("暂无竞品对比数据"); return; }
    box.innerHTML = list.map(m => {
      const aWin = m.score_a >= m.score_b;
      return `
        <div class="matrix-row">
          <div style="margin-bottom:8px"><span class="tag cat-${m.category}">${m.category}</span></div>
          <div class="matrix-compare">
            <div class="brand-side ${aWin ? 'winner' : ''}">
              <div class="name">${m.brand_a}</div>
              <div class="score">${m.score_a}</div>
            </div>
            <div class="vs-col"><span class="vs-badge">VS</span><br/><span class="diff-tag">差值 ${m.diff_score.toFixed(1)}</span></div>
            <div class="brand-side ${!aWin ? 'winner' : ''}">
              <div class="name">${m.brand_b}</div>
              <div class="score">${m.score_b}</div>
            </div>
          </div>
          <div class="matrix-ana">💡 ${m.analysis}</div>
          <div style="margin-top:8px;font-size:12px;color:var(--muted)">更新时间：${fmtDateShort(m.updated_at)}</div>
        </div>`;
    }).join("");
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Trust: Review Flows ============ */
document.querySelectorAll("[data-fl-status]").forEach(b => {
  b.addEventListener("click", () => {
    b.closest(".seg").querySelectorAll(".seg-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    S.flStatus = b.dataset.flStatus;
    loadFlows();
  });
});

async function loadFlows() {
  const box = document.getElementById("flowsList");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/review-flows";
    if (S.flStatus) url += `?status=${encodeURIComponent(S.flStatus)}`;
    const data = await api(url);
    const list = data.data || [];
    if (!list.length) { box.innerHTML = emptyHtml("暂无审核流记录"); return; }
    const grouped = {};
    list.forEach(f => {
      const key = `报告#${f.report_id} ${f.report_title || ""}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(f);
    });
    box.innerHTML = Object.entries(grouped).map(([title, flows]) => `
      <div style="margin-bottom:20px">
        <div class="panel-head" style="margin-bottom:10px;padding:0">
          <div><p class="eyebrow">审核复查流</p><h3>${title}</h3></div>
        </div>
        <div class="timeline">
          ${flows.map(f => `
            <div class="tl-item ${f.status === 'pending' ? 'pending' : ''}">
              <div class="tl-head">
                <h4>${f.stage}</h4>
                <span class="state ${f.status || 'approved'}">${f.status === 'approved' ? '已完成' : f.status === 'pending' ? '进行中' : f.status === 'resolved' ? '已解决' : stateLabel(f.status)}</span>
              </div>
              <div class="tl-meta">
                <span>👤 ${f.handler}</span>
                <span>🏷️ ${f.action}</span>
                <span>🕒 ${fmtDate(f.created_at)}</span>
              </div>
              ${f.comment ? `<div class="tl-comment">💬 ${f.comment}</div>` : ""}
            </div>`).join("")}
        </div>
      </div>`).join("");
  } catch (e) { box.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Trust: Schedule ============ */
document.getElementById("scheduleCategory").addEventListener("change", loadSchedule);
async function loadSchedule() {
  const summary = document.getElementById("scheduleSummary");
  const list = document.getElementById("scheduleList");
  list.innerHTML = loadingHtml();
  try {
    let url = "/api/schedule-stats";
    const cat = document.getElementById("scheduleCategory").value;
    if (cat) url += `?category=${encodeURIComponent(cat)}`;
    const data = await api(url);
    const items = data.data || [];
    if (!items.length) { summary.innerHTML = ""; list.innerHTML = emptyHtml("暂无排期统计数据"); return; }
    let tP = 0, tC = 0, tD = 0, tR = 0;
    items.forEach(s => { tP += s.planned; tC += s.completed; tD += s.delayed; tR += s.reviewers_count; });
    const pct = tP ? Math.round(tC / tP * 100) : 0;
    summary.innerHTML = `
      <div class="sch-stat"><label>计划总数</label><strong>${tP}</strong></div>
      <div class="sch-stat done"><label>已完成</label><strong>${tC}</strong></div>
      <div class="sch-stat delay"><label>延期</label><strong>${tD}</strong></div>
      <div class="sch-stat"><label>完成率</label><strong style="color:var(--accent-strong)">${pct}%</strong></div>
      <div class="sch-stat"><label>评测员投入</label><strong>${tR}</strong></div>`;

    const byDate = {};
    items.forEach(s => { if (!byDate[s.date]) byDate[s.date] = []; byDate[s.date].push(s); });
    const dates = Object.keys(byDate).sort().reverse().slice(0, 14);
    list.innerHTML = dates.map(d => {
      const dayItems = byDate[d];
      const dP = dayItems.reduce((s, x) => s + x.planned, 0);
      const dC = dayItems.reduce((s, x) => s + x.completed, 0);
      const dD = dayItems.reduce((s, x) => s + x.delayed, 0);
      const dPct = dP ? Math.round(dC / dP * 100) : 0;
      return `
        <div style="margin-bottom:14px">
          <div style="font-weight:700;font-size:13px;margin-bottom:8px;color:var(--ink)">${d}</div>
          ${dayItems.map(s => {
            const sPct = s.planned ? Math.round(s.completed / s.planned * 100) : 0;
            return `
              <div class="sch-row">
                <div><span class="tag cat-${s.category}">${s.category}</span></div>
                <div style="font-size:13px">计划 ${s.planned} · 完成 ${s.completed} · 延期 ${s.delayed}</div>
                <div class="progress"><div class="progress-fill ${sPct < 100 ? 'partial' : ''}" style="width:${sPct}%"></div></div>
                <div style="font-weight:800;font-size:14px;color:${sPct >= 100 ? 'var(--green)' : 'var(--amber)'}">${sPct}%</div>
                <div style="font-size:12px;color:var(--muted)">👤${s.reviewers_count}</div>
              </div>`;
          }).join("")}
        </div>`;
    }).join("");
  } catch (e) { list.innerHTML = emptyHtml("加载失败"); }
}

/* ============ Load All ============ */
async function loadAll() {
  setStatus("加载中...");
  await loadOverview();
  loadEvalUnits();
  loadCityRankings();
  loadReportsView();
  loadReviewers();
  loadQuality();
  loadBrands();
  loadOpinion();
  loadAppeals();
  loadTraceReports();
  loadWeights();
  loadMatrix();
  loadFlows();
  loadSchedule();
}

loadAll();
