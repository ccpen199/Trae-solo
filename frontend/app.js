const statusEl = document.querySelector("#connectionStatus");
const metricGrid = document.querySelector("#metricGrid");
const ayahList = document.querySelector("#ayahList");
const demandList = document.querySelector("#demandList");
const orderList = document.querySelector("#orderList");
const cityGrid = document.querySelector("#cityGrid");
const funnelChart = document.querySelector("#funnelChart");
const thresholdGrid = document.querySelector("#thresholdGrid");
const courseList = document.querySelector("#courseList");
const postList = document.querySelector("#postList");
const refreshButton = document.querySelector("#refreshButton");

function backendBaseUrl() {
  const url = new URL(window.location.href);
  const frontendPort = Number(url.port || 49231);
  const backendPort = frontendPort + 10000;
  return `${url.protocol}//${url.hostname}:${backendPort}`;
}

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", isError);
}

function statusLabel(s) {
  const map = {
    available: { text: "空闲可接", cls: "status-available" },
    on_duty: { text: "服务中", cls: "status-on" },
    pending: { text: "待上户", cls: "status-pending" },
    in_service: { text: "服务中", cls: "status-on" },
    completed: { text: "已完成", cls: "status-done" },
    open: { text: "招募中", cls: "status-open" },
    done: { text: "已完成", cls: "status-done" },
    in_progress: { text: "进行中", cls: "status-on" },
    paid: { text: "已发放", cls: "status-done" },
    processing: { text: "发放中", cls: "status-on" },
    mediating: { text: "调解中", cls: "status-pending" },
  };
  return map[s] || { text: s, cls: "status-pending" };
}

function roleColor(role) {
  if (role === "月嫂") return "role-yuesao";
  if (role === "保姆") return "role-baomu";
  if (role === "保洁") return "role-baojie";
  return "";
}

function renderMetrics(metrics) {
  metricGrid.innerHTML = metrics
    .map(
      (m) => `
        <article class="metric">
          <span>${m.label}</span>
          <strong>${m.value}</strong>
          <em>${m.trend}</em>
        </article>
      `,
    )
    .join("");
}

function renderAyahs(list) {
  if (!list || !list.length) {
    ayahList.innerHTML = '<p class="empty">暂无阿姨数据</p>';
    return;
  }
  ayahList.innerHTML = list
    .map((a) => {
      const st = statusLabel(a.status);
      return `
        <div class="ayah-card">
          <div class="ayah-avatar">${a.name.charAt(0)}</div>
          <div class="ayah-info">
            <div class="ayah-row">
              <h4>${a.name}</h4>
              <span class="role-tag ${roleColor(a.role)}">${a.role}</span>
              <span class="status-tag ${st.cls}">${st.text}</span>
            </div>
            <div class="ayah-meta">
              <span>📍 ${a.city}</span>
              <span>🎂 ${a.age}岁</span>
              <span>⏱️ ${a.experience}年经验</span>
              <span>⭐ ${a.rating}分</span>
              <span>📦 ${a.order_count}单</span>
            </div>
            <div class="ayah-tags">
              ${a.face_verified ? '<span class="mini-tag mini-green">✓ 人脸已核验</span>' : '<span class="mini-tag mini-gray">待人脸核验</span>'}
              ${(a.skills || "").split(",").filter(Boolean).slice(0, 3).map((s) => `<span class="mini-tag">${s}</span>`).join("")}
            </div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderDemands(list) {
  if (!list || !list.length) {
    demandList.innerHTML = '<p class="empty">暂无需求数据</p>';
    return;
  }
  demandList.innerHTML = list
    .map((d) => {
      const st = statusLabel(d.status);
      return `
        <div class="demand-card">
          <div class="demand-top">
            <span class="role-tag ${roleColor(d.role_needed)}">${d.role_needed}</span>
            <span class="status-tag ${st.cls}">${st.text}</span>
            <span class="demand-salary">¥${d.salary_from.toLocaleString()}-${d.salary_to.toLocaleString()}</span>
          </div>
          <h4>${d.title}</h4>
          <div class="demand-meta">
            <span>📍 ${d.city}</span>
            <span>⏳ ${d.duration || "面议"}</span>
            <span>👤 ${d.employer_name || "匿名雇主"}</span>
          </div>
          <div class="demand-actions">
            <button class="btn-sm btn-primary">立即抢单</button>
            <button class="btn-sm btn-ghost">查看详情</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderOrders(list) {
  if (!list || !list.length) {
    orderList.innerHTML = '<p class="empty">暂无订单数据</p>';
    return;
  }
  orderList.innerHTML = list
    .map((o) => {
      const st = statusLabel(o.status);
      return `
        <div class="order-card">
          <div class="order-top">
            <div class="order-id">
              <span class="order-no">${o.order_no}</span>
              <span class="role-tag ${roleColor(o.role)}">${o.role}</span>
              <span class="status-tag ${st.cls}">${st.text}</span>
            </div>
            <div class="order-salary">¥${o.salary.toLocaleString()}</div>
          </div>
          <div class="order-meta">
            <span>👩 ${o.ayah_name || "待匹配"}</span>
            <span>📍 ${o.city}</span>
            <span>📅 上户：${o.start_date || "--"}</span>
            <span>✅ 节点：${o.service_nodes || 0}</span>
            <span>📍 打卡：${o.checkin_count || 0}次</span>
          </div>
          <div class="order-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(100, ((o.service_nodes || 0) / 5) * 100)}%"></div>
            </div>
          </div>
          <div class="order-actions">
            <button class="btn-sm btn-primary">节点上报</button>
            <button class="btn-sm btn-ghost">上户打卡</button>
            <button class="btn-sm btn-ghost">人脸核验</button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCityStats(list) {
  if (!list || !list.length) {
    cityGrid.innerHTML = '<p class="empty">暂无城市数据</p>';
    return;
  }
  cityGrid.innerHTML = list
    .map((c) => `
      <div class="city-card">
        <div class="city-top">
          <h4>${c.city}</h4>
          <span class="city-rate">转化率 ${c.conversion_rate}%</span>
        </div>
        <div class="city-stats">
          <div><span>阿姨</span><strong>${c.ayah_count}</strong></div>
          <div><span>需求</span><strong>${c.demand_count}</strong></div>
          <div><span>订单</span><strong>${c.order_count}</strong></div>
        </div>
        <div class="city-salary">
          <span>平均薪资</span>
          <strong>¥${c.avg_salary.toLocaleString()}</strong>
        </div>
      </div>
    `)
    .join("");
}

function renderFunnel(list) {
  if (!list || !list.length) {
    funnelChart.innerHTML = '<p class="empty">暂无转化数据</p>';
    return;
  }
  const max = list[0].count;
  funnelChart.innerHTML = list
    .map((f, i) => `
      <div class="funnel-row">
        <div class="funnel-label">
          <span class="funnel-step">${i + 1}</span>
          <span class="funnel-name">${f.stage}</span>
        </div>
        <div class="funnel-bar-wrap">
          <div class="funnel-bar" style="width: ${(f.count / max) * 100}%">
            <span>${f.count}</span>
          </div>
        </div>
        <div class="funnel-rate">${f.rate}%</div>
      </div>
    `)
    .join("");
}

function renderThresholds(list) {
  if (!list || !list.length) {
    thresholdGrid.innerHTML = '<p class="empty">暂无阈值数据</p>';
    return;
  }
  thresholdGrid.innerHTML = list
    .map((t) => {
      const pct = Math.min(100, (t.actual / (t.value || 1)) * 100);
      const pass = t.actual >= t.value;
      return `
        <div class="threshold-card">
          <div class="threshold-top">
            <h4>${t.label}</h4>
            <span class="threshold-badge ${pass ? "badge-ok" : "badge-warn"}">${pass ? "✓ 达标" : "⚠ 待提升"}</span>
          </div>
          <div class="threshold-values">
            <div class="th-actual">${t.actual}<span class="th-unit">${t.unit}</span></div>
            <div class="th-divider">/</div>
            <div class="th-target">${t.value}<span class="th-unit">${t.unit} 阈值</span></div>
          </div>
          <div class="th-progress">
            <div class="th-bar ${pass ? "bar-ok" : "bar-warn"}" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCourses(list) {
  if (!list || !list.length) {
    courseList.innerHTML = '<p class="empty">暂无课程数据</p>';
    return;
  }
  courseList.innerHTML = list
    .slice(0, 4)
    .map((c) => `
      <div class="course-card">
        <div class="course-cover">
          <span class="course-cat ${roleColor(c.category)}">${c.category}</span>
          <span class="course-hours">${c.duration}课时</span>
        </div>
        <div class="course-body">
          <h4>${c.title}</h4>
          <div class="course-meta">
            <span>📝 ${c.total_quiz}道测验</span>
            <span>🎯 ${c.pass_score}分及格</span>
          </div>
          <button class="btn-sm btn-primary btn-block">开始学习</button>
        </div>
      </div>
    `)
    .join("");
}

function renderPosts(list) {
  if (!list || !list.length) {
    postList.innerHTML = '<p class="empty">暂无社区帖子</p>';
    return;
  }
  postList.innerHTML = list
    .slice(0, 4)
    .map((p) => `
      <div class="post-card">
        <div class="post-author">
          <div class="post-avatar">${p.author.charAt(0)}</div>
          <div>
            <h5>${p.author}</h5>
            <span class="post-role">${p.author_role === "admin" ? "官方" : p.author_role === "ayah" ? "阿姨" : "雇主"}</span>
          </div>
        </div>
        <h4 class="post-title">${p.title}</h4>
        <p class="post-content">${p.content || ""}</p>
        <div class="post-actions">
          <span>❤️ ${p.likes}</span>
          <span>💬 ${p.comments}</span>
        </div>
      </div>
    `)
    .join("");
}

async function loadDashboard() {
  setStatus("加载中...");
  try {
    const [dashRes, reportRes, courseRes, communityRes] = await Promise.all([
      fetch(`${backendBaseUrl()}/api/dashboard`, { cache: "no-store" }),
      fetch(`${backendBaseUrl()}/api/reports`, { cache: "no-store" }),
      fetch(`${backendBaseUrl()}/api/courses`, { cache: "no-store" }),
      fetch(`${backendBaseUrl()}/api/community`, { cache: "no-store" }),
    ]);
    if (!dashRes.ok) throw new Error(`Dashboard API ${dashRes.status}`);
    if (!reportRes.ok) throw new Error(`Reports API ${reportRes.status}`);
    const dash = await dashRes.json();
    const reports = await reportRes.json();
    const courses = courseRes.ok ? await courseRes.json() : { list: [] };
    const community = communityRes.ok ? await communityRes.json() : { list: [] };

    renderMetrics(dash.metrics || []);
    renderAyahs(dash.ayahs || []);
    renderDemands(dash.demands || []);
    renderOrders(dash.orders || []);
    renderCityStats(reports.city_stats || []);
    renderFunnel(reports.funnel || []);
    renderThresholds(reports.thresholds || []);
    renderCourses(courses.list || []);
    renderPosts(community.list || []);
    setStatus("系统运行中");
  } catch (err) {
    setStatus("加载失败", true);
    console.error(err);
  }
}

function bindNav() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      const sec = item.dataset.section;
      if (sec && sec !== "dashboard") {
        const target = document.querySelector(`[data-section="${sec}"]`);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  });
}

function bindRoleSwitch() {
  document.querySelectorAll(".role-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".role-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

function bindQuickActions() {
  document.querySelectorAll(".action-card").forEach((card) => {
    card.addEventListener("click", () => {
      const act = card.dataset.action;
      const map = {
        ayah: "ayahs",
        demand: "demands",
        dispatch: "orders",
        checkin: "orders",
        face: "ayahs",
        "report-node": "orders",
      };
      const sec = map[act];
      if (sec) {
        const target = document.querySelector(`[data-section="${sec}"]`);
        if (target) target.click();
      }
    });
  });
  document.querySelectorAll(".btn-link").forEach((btn) => {
    btn.addEventListener("click", () => {
      const sec = btn.dataset.section;
      if (sec) {
        const nav = document.querySelector(`.nav-item[data-section="${sec}"]`);
        if (nav) nav.click();
      }
    });
  });
  document.querySelectorAll(".security-item").forEach((item) => {
    item.addEventListener("click", () => {
      const nav = document.querySelector('.nav-item[data-section="security"]');
      if (nav) nav.click();
    });
  });
}

refreshButton.addEventListener("click", () => loadDashboard());

bindNav();
bindRoleSwitch();
bindQuickActions();
loadDashboard();
