/* ============ Utils ============ */
const statusEl = document.getElementById("connectionStatus");
const refreshBtn = document.getElementById("refreshButton");

function backendBaseUrl() {
  const url = new URL(window.location.href);
  const frontendPort = Number(url.port || 49232);
  const backendPort = frontendPort + 10000;
  return `${url.protocol}//${url.hostname}:${backendPort}`;
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

async function api(path, method = "GET", body = null) {
  const opts = { method, cache: "no-store", headers: {} };
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
  try {
    const d = new Date(iso);
    return d.toLocaleString("zh-CN", { hour12: false, month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}
function fmtDateShort(iso) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
  } catch { return iso; }
}
function timeAgo(iso) {
  if (!iso) return "-";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} 小时前`;
  const d = Math.floor(h / 24);
  return `${d} 天前`;
}
function srcStyle(type) {
  const map = {
    "用户评价": "src-user",
    "实地走访": "src-field",
    "实地考察": "src-field",
    "客户回访": "src-field",
    "游客问卷": "src-user",
    "家长访谈": "src-user",
    "学员问卷": "src-user",
    "数据抓取": "src-api",
    "API对接": "src-api",
    "系统对接": "src-api",
    "官方数据": "src-official",
    "病历核查": "src-field",
    "人事档案现场核验记录": "src-official",
    "投诉处理": "src-api",
    "神秘顾客": "src-field",
    "服务档案": "src-official",
    "投诉分析": "src-api",
    "课堂观察": "src-field",
    "成绩追踪": "src-api",
    "线上数据": "src-api",
    "现场监测": "src-field",
    "专家评审": "src-official",
    "问卷团队": "src-user",
    "第三方调研": "src-field",
    "电话回访组": "src-field",
    "医疗审核组": "src-official",
    "数据采集团队": "src-official",
    "爬虫系统A": "src-api",
    "评测员A-001": "src-field",
    "评测员E-001": "src-field",
    "CATI问卷系统#2026-E001": "src-user",
    "北京市教委年度统计公报": "src-official",
    "内部走访记录#2026-0612-001": "src-field",
    "HIS系统手术记录导出": "src-official",
    "景区投诉管理系统": "src-api",
    "CRM回访记录系统": "src-api",
    "资质核验": "src-official",
    "价格监测": "src-api",
  };
  return map[type] || "";
}

function rankClass(n) {
  if (n === 1) return "";
  if (n === 2) return "r2";
  if (n === 3) return "r3";
  return "rn";
}
function posClass(n) {
  if (n === 1) return "top1";
  if (n === 2) return "top2";
  if (n === 3) return "top3";
  return "";
}

function emptyHtml(text) { return `<div class="empty">${text}</div>`; }
function loadingHtml() { return `<div class="loading">⏳ 数据加载中...</div>`; }

/* ============ Tab Navigation ============ */
document.querySelectorAll("#mainTabs .tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("#mainTabs .tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const id = tab.dataset.tab;
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
    document.getElementById(`tab-${id}`).classList.add("active");
  });
});
document.querySelectorAll(".btn-link[data-jump]").forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.jump;
    const target = document.querySelector(`#mainTabs .tab[data-tab="${id}"]`);
    if (target) target.click();
  });
});

/* sub tabs */
function bindSubTabs(containerId, prefix) {
  document.querySelectorAll(`#${containerId} .sub-tab`).forEach(t => {
    t.addEventListener("click", () => {
      document.querySelectorAll(`#${containerId} .sub-tab`).forEach(x => x.classList.remove("active"));
      t.classList.add("active");
      const key = t.dataset.sub;
      document.querySelectorAll(`#${prefix}-${key.substring(0,1)}`); // noop
      document.querySelectorAll(`.sub-panel[id^="${prefix}-"]`).forEach(p => p.classList.remove("active"));
      const target = document.getElementById(`${prefix}-${key}`);
      if (target) target.classList.add("active");
    });
  });
}
bindSubTabs("opsTabs", "sub");
bindSubTabs("trustTabs", "sub");

refreshBtn.addEventListener("click", () => loadAll());

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
      </article>
    `).join("");
    const ov = await api("/api/overview");
    catList.innerHTML = (ov.evalByCategory || []).map(c => `
      <div class="card-row">
        <div class="rank-badge ${rankClass(c.count >= 5 ? 1 : 0)}" title="${c.category}">${c.category.slice(0,1)}</div>
        <div class="card-main">
          <h3>${c.category}</h3>
          <p>机构数 ${c.count} · 平均评分 ${c.avg_score}</p>
          <div class="card-meta"><span class="tag cat-${c.category}">${c.category}</span></div>
        </div>
        <div class="card-actions">
          <div class="score-big">${c.avg_score}<span class="suf">/100</span></div>
          <button class="btn-sm btn-ghost" data-cat="${c.category}" data-goto="eval">查看评测 →</button>
        </div>
      </div>
    `).join("");
    catList.querySelectorAll("button[data-goto=eval]").forEach(b => {
      b.addEventListener("click", () => {
        document.querySelector('#mainTabs .tab[data-tab="eval"]').click();
        const cat = b.dataset.cat;
        const segBtn = document.querySelector(`#evalCategorySeg .seg-btn[data-cat="${cat}"]`);
        if (segBtn) segBtn.click();
      });
    });

    const today = ov.todaySchedule || [];
    if (today.length === 0) sched.innerHTML = emptyHtml("今日暂无排期");
    else {
      let totalP = 0, totalC = 0, totalD = 0;
      today.forEach(t => { totalP += t.planned; totalC += t.completed; totalD += t.delayed; });
      const pct = totalP ? Math.round(totalC / totalP * 100) : 0;
      sched.innerHTML = `
        <div class="card-row" style="grid-template-columns: 1fr;">
          <div class="card-main">
            <h3>今日总览</h3>
            <p>计划 ${totalP} 项 · 已完成 ${totalC} 项 · 延期 ${totalD} 项 · 完成率 ${pct}%</p>
            <div class="progress" style="margin-top: 10px;"><div class="progress-fill ${pct<100?'partial':''}" style="width:${pct}%"></div></div>
          </div>
        </div>
        ${today.map(t => {
          const p = t.planned || 0, c = t.completed || 0, d = t.delayed || 0;
          const pct = p ? Math.round(c/p*100) : 0;
          return `
            <div class="card-row">
              <div class="rank-badge rn" style="background:var(--blue); color:#fff">${t.category.slice(0,2)}</div>
              <div class="card-main">
                <h3>${t.category}</h3>
                <p>计划 ${p} · 完成 ${c} · 延期 ${d}</p>
                <div class="progress" style="margin-top: 8px;"><div class="progress-fill ${pct<100?'partial':''}" style="width:${pct}%"></div></div>
              </div>
              <div class="card-actions"><div class="score-big">${pct}<span class="suf">%</span></div></div>
            </div>
          `;
        }).join("")}
      `;
    }

    const rs = ov.reviewerStats || {};
    const as = ov.appealStats || {};
    const bs = ov.brandStats || {};
    ops.innerHTML = `
      <div class="ops-card pending">
        <div><div class="kicker">评测员待审核</div><div>资质核验与背景调查</div></div>
        <div class="count-big">${rs.pending || 0}</div>
      </div>
      <div class="ops-card reviewing">
        <div><div class="kicker">品牌入驻审核中</div><div>资料核验与资质比对</div></div>
        <div class="count-big">${bs.reviewing || 0}</div>
      </div>
      <div class="ops-card pending">
        <div><div class="kicker">申诉待响应</div><div>品牌方争议核查通道</div></div>
        <div class="count-big">${as.pending || 0}</div>
      </div>
      <div class="ops-card reviewing">
        <div><div class="kicker">申诉处理中</div><div>证据比对与报告复核</div></div>
        <div class="count-big">${as.reviewing || 0}</div>
      </div>
    `;

    const rep = await api("/api/eval-reports");
    const list = (rep.data || []).slice(0, 5);
    if (list.length === 0) reports.innerHTML = emptyHtml("暂无报告");
    else reports.innerHTML = list.map(r => `
      <div class="card-row" data-report-id="${r.id}">
        <div class="rank-badge ${rankClass(1)}">📄</div>
        <div class="card-main">
          <h3>${r.title}</h3>
          <p>${r.unit_name || ""} · ${r.author} · ${timeAgo(r.collected_at)}</p>
          <div class="card-meta">
            <span class="tag cat-${r.unit_category}">${r.unit_category}</span>
            <span class="tag">来源构成：${r.sources}</span>
          </div>
        </div>
        <div class="card-actions">
          <div class="score-big">${r.score}<span class="suf">分</span></div>
          <button class="btn-sm" data-report-btn="${r.id}">深读报告 →</button>
        </div>
      </div>
    `).join("");
    reports.querySelectorAll("button[data-report-btn]").forEach(b => {
      b.addEventListener("click", () => openReport(Number(b.dataset.reportBtn)));
    });

    setStatus("API Online");
  } catch (e) {
    mGrid.innerHTML = emptyHtml("数据加载失败");
    setStatus("API Error", true);
  }
}

/* ============ Eval Units Tab ============ */
const state = {
  evalCat: "",
  evalKeyword: "",
  evalView: "units",
  rvStatus: "",
  brStatus: "",
  sentiment: "",
  apStatus: "",
  flStatus: "",
};

document.querySelectorAll("#evalCategorySeg .seg-btn").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll("#evalCategorySeg .seg-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    state.evalCat = b.dataset.cat;
    loadEvalUnits(); loadCityRankings(); loadReportsView();
  });
});
const kwInput = document.getElementById("evalKeyword");
let kwTimer;
kwInput.addEventListener("input", () => {
  clearTimeout(kwTimer);
  kwTimer = setTimeout(() => {
    state.evalKeyword = kwInput.value.trim();
    loadEvalUnits();
  }, 220);
});

document.querySelectorAll(".eval-view-switch .view-btn").forEach(b => {
  b.addEventListener("click", () => {
    document.querySelectorAll(".eval-view-switch .view-btn").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    state.evalView = b.dataset.view;
    document.querySelectorAll(".view-pane").forEach(p => p.classList.remove("active"));
    document.getElementById(`eval${b.dataset.view.charAt(0).toUpperCase()+b.dataset.view.slice(1)}View`).classList.add("active");
  });
});

async function loadEvalUnits() {
  const box = document.getElementById("evalUnitsView");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/eval-units?";
    if (state.evalCat) url += `category=${encodeURIComponent(state.evalCat)}&`;
    if (state.evalKeyword) url += `keyword=${encodeURIComponent(state.evalKeyword)}&`;
    const data = await api(url);
    const list = data.data || [];
    if (list.length === 0) { box.innerHTML = emptyHtml("未找到匹配的评测单元，请调整筛选条件"); return; }
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
      </div>
    `).join("");
    box.querySelectorAll("button[data-unit-reports]").forEach(b => {
      b.addEventListener("click", async () => {
        document.querySelector('.eval-view-switch .view-btn[data-view="reports"]').click();
        const uid = Number(b.dataset.unitReports);
        const rep = await api(`/api/eval-reports?unit_id=${uid}`);
        renderReportList(rep.data || []);
      });
    });
    box.querySelectorAll("button[data-unit-id]").forEach(b => {
      b.addEventListener("click", async () => {
        const uid = Number(b.dataset.unitId);
        const rep = await api(`/api/eval-reports?unit_id=${uid}`);
        if (rep.data && rep.data.length > 0) openReport(rep.data[0].id);
        else alert(`${b.dataset.name} 暂无深度评测报告`);
      });
    });
  } catch (e) {
    box.innerHTML = emptyHtml("加载失败");
  }
}

async function loadCityRankings() {
  const box = document.getElementById("evalRankingView");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/city-rankings";
    if (state.evalCat) url += `?category=${encodeURIComponent(state.evalCat)}`;
    const data = await api(url);
    const list = data.data || [];
    if (list.length === 0) { box.innerHTML = emptyHtml("暂无城市榜单数据"); return; }
    const grouped = {};
    list.forEach(r => {
      if (!grouped[r.category]) grouped[r.category] = [];
      grouped[r.category].push(r);
    });
    box.innerHTML = Object.entries(grouped).map(([cat, items]) => `
      <div style="margin-bottom: 18px;">
        <div class="panel-head" style="margin-bottom: 10px; padding: 0;">
          <div>
            <p class="eyebrow">城市榜单</p>
            <h2><span class="tag cat-${cat}" style="font-size: 13px; padding: 4px 12px;">${cat}</span></h2>
          </div>
        </div>
        ${items.slice(0, 5).map((r, i) => `
          <div class="rank-row">
            <div class="rank-pos ${posClass(i+1)}">${i+1}</div>
            <div>
              <strong>${r.city}</strong>
              <div style="font-size: 12px; color: var(--muted); margin-top: 2px;">评测机构 ${r.unit_count} 家</div>
            </div>
            <div class="score-big" style="font-size: 22px;">${r.avg_score}</div>
            <div class="extra" style="font-size: 12px; color: var(--muted); text-align: right;">
              机构密度<br/>${r.unit_count} 家/市
            </div>
            <div class="extra">
              <button class="btn-sm btn-ghost" data-rank-city="${r.city}" data-rank-cat="${cat}">查看详情 →</button>
            </div>
          </div>
        `).join("")}
      </div>
    `).join("");
    box.querySelectorAll("button[data-rank-city]").forEach(b => {
      b.addEventListener("click", () => {
        document.querySelector('.eval-view-switch .view-btn[data-view="units"]').click();
        kwInput.value = b.dataset.rankCity;
        kwInput.dispatchEvent(new Event("input"));
      });
    });
  } catch (e) {
    box.innerHTML = emptyHtml("加载失败");
  }
}

function renderReportList(list) {
  const box = document.getElementById("evalReportsView");
  if (list.length === 0) { box.innerHTML = emptyHtml("暂无深度评测报告"); return; }
  box.innerHTML = list.map(r => `
    <div class="card-row">
      <div class="rank-badge" style="background: linear-gradient(135deg, var(--purple), var(--blue));">📖</div>
      <div class="card-main">
        <h3>${r.title}</h3>
        <p>${r.unit_name || ""} · 作者：${r.author} · 数据采集时间：${fmtDate(r.collected_at)}</p>
        <div class="card-meta">
          <span class="tag cat-${r.unit_category}">${r.unit_category}</span>
          <span class="tag">📊 ${r.sources}</span>
        </div>
      </div>
      <div class="card-actions">
        <div class="score-big">${r.score}<span class="suf">分</span></div>
        <button class="btn-sm" data-r-id="${r.id}">报告深读 →</button>
      </div>
    </div>
  `).join("");
  box.querySelectorAll("button[data-r-id]").forEach(b => {
    b.addEventListener("click", () => openReport(Number(b.dataset.rId)));
  });
}

async function loadReportsView() {
  const box = document.getElementById("evalReportsView");
  box.innerHTML = loadingHtml();
  try {
    let url = "/api/eval-reports";
    const data = await api(url);
    let list = data.data || [];
    if (state.evalCat) list = list.filter(r => r.unit_category === state.evalCat);
    renderReportList(list);
  } catch (e) {
    box.innerHTML = emptyHtml("加载失败");
  }
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
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(120px,1fr)); gap: 10px; margin-top: 12px;">
        <div style="padding: 10px; background: var(--surface-2); border-radius: 7px; text-align: center;">
          <div style="font-size: 11px; color: var(--muted); font-weight: 700;">质检综合分</div>
          <div style="font-size: 22px; font-weight: 900; color: var(--accent-strong); margin-top: 4px;">${(q[0].quality_score || 0).toFixed(1)}</div>
        </div>
        <div style="padding: 10px; background: var(--surface-2); border-radius: 7px; text-align: center;">
          <div style="font-size: 11px; color: var(--muted); font-weight: 700;">数据准确性</div>
          <div style="font-size: 22px; font-weight: 900; color: var(--blue); margin-top: 4px;">${(q[0].accuracy || 0).toFixed(1)}</div>
        </div>
        <div style="padding: 10px; background: var(--surface-2); border-radius: 7px; text-align: center;">
          <div style="font-size: 11px; color: var(--muted); font-weight: 700;">分析深度</div>
          <div style="font-size: 22px; font-weight: 900; color: var(--purple); margin-top: 4px;">${(q[0].depth || 0).toFixed(1)}</div>
        </div>
        <div style="padding: 10px; background: var(--surface-2); border-radius: 7px; text-align: center;">
          <div style="font-size: 11px; color: var(--muted); font-weight: 700;">时效性</div>
          <div style="font-size: 22px; font-weight: 900; color: var(--amber); margin-top: 4px;">${(q[0].timeliness || 0).toFixed(1)}</div>
        </div>
      </div>
    ` : "";

    const tracesHtml = tr.length ? `
      <div class="report-section">
        <h3>🛡️ 数据来源溯源 · 采集时间与可信度</h3>
        ${tr.map(t => `
          <div class="trace-row">
            <div>
              <div style="font-weight: 700; font-size: 13px;">${t.data_point}</div>
              <div style="font-size: 11px; color: var(--muted); margin-top: 2px;">采集：${fmtDate(t.collected_at)}</div>
            </div>
            <div>
              <span class="src-chip ${srcStyle(t.collector)}" style="background: var(--surface); border: 1px solid var(--line);">采集方：${t.collector}</span>
            </div>
            <div style="font-size: 12px; color: var(--ink-soft); word-break: break-all;">🔗 ${t.source_url}</div>
            <div><span class="src-chip ${srcStyle(t.source_type)}" style="${t.source_type === '官方数据' ? 'background:var(--amber-soft);color:var(--amber)' : t.source_type === '实地走访' || t.source_type === '实地考察' ? 'background:var(--green-soft);color:var(--green)' : t.source_type === '数据抓取' || t.source_type === 'API对接' ? 'background:var(--purple-soft);color:var(--purple)' : 'background:var(--blue-soft);color:var(--blue)'}">${t.source_type}</span></div>
            <div>
              <div style="font-size: 11px; color: var(--muted); text-align: center;">置信度</div>
              <div style="font-weight: 900; font-size: 16px; color: var(--accent-strong); text-align: center;">${Math.round(t.confidence * 100)}%</div>
            </div>
          </div>
        `).join("")}
      </div>
    ` : "";

    const flowsHtml = fl.length ? `
      <div class="report-section">
        <h3>📋 审核复查流</h3>
        <div class="timeline">
          ${fl.map(f => `
            <div class="tl-item ${f.status === 'pending' ? 'pending' : ''}">
              <div class="tl-head">
                <h4>${f.stage}</h4>
                <span class="state ${f.status || 'approved'}">${f.status === 'approved' ? '已完成' : f.status === 'pending' ? '进行中' : f.status}</span>
              </div>
              <div class="tl-meta">
                <span>👤 ${f.handler}</span>
                <span>🏷️ ${f.action}</span>
                <span>🕒 ${fmtDate(f.created_at)}</span>
              </div>
              ${f.comment ? `<div class="tl-comment">💬 ${f.comment}</div>` : ""}
            </div>
          `).join("")}
        </div>
      </div>
    ` : "";

    const qualityHtml = q.length ? `
      <div class="report-section">
        <h3>⭐ 质量评分详情</h3>
        ${q.map(qq => `
          <div class="card-row" style="grid-template-columns: 1fr;">
            <div class="card-main">
              <h3>${qq.reviewer} 评分 · ${qq.quality_score.toFixed(1)} 分</h3>
              <p>准确性 ${qq.accuracy} · 深度 ${qq.depth} · 时效性 ${qq.timeliness} · ${fmtDate(qq.scored_at)}</p>
              <div style="margin-top: 8px; padding: 10px; background: var(--surface); border-radius: 7px; color: var(--ink-soft); font-size: 13px;">📝 ${qq.comment}</div>
            </div>
          </div>
        `).join("")}
      </div>
    ` : "";

    document.getElementById("modalBody").innerHTML = `
      <div class="report-section">
        <div class="report-summary-card">
          <div class="big-score">${r.score || 0} 分</div>
          <div style="display:flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--ink-soft);">
