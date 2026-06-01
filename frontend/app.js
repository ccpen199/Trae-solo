const frontendPort = Number(window.location.port || 43464);
const inferredBackendPort = Number.isFinite(frontendPort) ? frontendPort + 10000 : 53464;
const apiBaseUrl = window.APP_CONFIG?.apiBaseUrl || `http://127.0.0.1:${inferredBackendPort}/api`;

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const elements = {
  serviceState: $("#serviceState"),
  serviceText: $("#serviceText"),
  metrics: $("#metrics"),
  taskRows: $("#taskRows"),
  patientList: $("#patientList"),
  refreshButton: $("#refreshButton"),
  statusFilter: $("#statusFilter"),
  projectRows: $("#projectRows"),
  screenProject: $("#screenProject"),
  diagnosisFilter: $("#diagnosisFilter"),
  dateFrom: $("#dateFrom"),
  dateTo: $("#dateTo"),
  searchBtn: $("#searchBtn"),
  candidateRows: $("#candidateRows"),
  selectAll: $("#selectAll"),
  batchEnrollBtn: $("#batchEnrollBtn"),
  batchExcludeBtn: $("#batchExcludeBtn"),
  patientRows: $("#patientRows"),
  followStatusFilter: $("#followStatusFilter"),
  followupTaskRows: $("#followupTaskRows"),
  qcMetrics: $("#qcMetrics"),
  qcRows: $("#qcRows"),
  runQcBtn: $("#runQcBtn"),
  exportForm: $("#exportForm"),
  exportProject: $("#exportProject"),
  maskData: $("#maskData"),
  includeQcReport: $("#includeQcReport"),
  exportRows: $("#exportRows"),
  auditRows: $("#auditRows"),
  backToList: $("#backToList"),
  modal: $("#modal"),
  modalTitle: $("#modalTitle"),
  modalBody: $("#modalBody"),
  closeModal: $("#closeModal"),
};

const state = {
  projects: [],
  patients: [],
  tasks: [],
  candidates: [],
  qualityIssues: [],
  exportJobs: [],
  auditLogs: [],
  currentPatient: null,
  currentRole: "research_assistant",
};

const statusText = {
  pending: "待随访",
  overdue: "已逾期",
  completed: "已完成",
  cancelled: "已取消",
  lost: "失访",
  dead: "死亡",
  withdrawn: "撤回",
  missed: "补访",
  enrolled: "已入组",
  screening: "筛选中",
  candidate: "候选",
  eligible: "符合",
  excluded: "已排除",
  active: "进行中",
  followup: "随访中",
  open: "待处理",
  reviewed: "已复核",
  high: "高",
  medium: "中",
  low: "低",
};

const roleLabels = {
  research_assistant: "研究助理",
  qc_staff: "质控员",
  principal_investigator: "主要研究者",
  data_manager: "数据管理员",
};

const followupActions = [
  { status: "completed", label: "完成" },
  { status: "lost", label: "失访" },
  { status: "dead", label: "死亡" },
  { status: "withdrawn", label: "撤回" },
  { status: "missed", label: "补访" },
];

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

function maskPhone(phone) {
  const value = String(phone || "");
  return value.length >= 7 ? `${value.slice(0, 3)}****${value.slice(-4)}` : value;
}

function badge(value, label = statusText[value] || value || "-") {
  return `<span class="badge ${escapeHtml(value)}">${escapeHtml(label)}</span>`;
}

function setServiceState(online, message) {
  elements.serviceState.classList.toggle("online", online);
  elements.serviceState.classList.toggle("offline", !online);
  elements.serviceText.textContent = message;
}

async function request(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `HTTP ${response.status}`);
  }
  return response.json();
}

function renderMetrics(overview) {
  const metrics = [
    ["研究项目", overview.totals.projects],
    ["入组病例", overview.totals.patients],
    ["随访任务", overview.totals.tasks],
    ["待随访", overview.totals.pendingTasks],
    ["质控问题", overview.totals.openQualityIssues],
  ];

  elements.metrics.innerHTML = metrics
    .map(
      ([label, value]) => `
    <article class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `
    )
    .join("");
}

function renderDashboardTasks(target, tasks) {
  if (!tasks.length) {
    target.innerHTML = `<tr><td colspan="7" class="empty">当前筛选下暂无随访任务</td></tr>`;
    return;
  }

  target.innerHTML = tasks
    .map((task) => {
      const disabled = task.status === "completed" || task.status === "cancelled";
      return `
      <tr>
        <td>${escapeHtml(task.planned_date)}</td>
        <td>
          <strong>${escapeHtml(task.patient_name)}</strong><br>
          <span>${escapeHtml(task.patient_code)}</span>
        </td>
        <td>${escapeHtml(task.project_name)}</td>
        <td>${escapeHtml(task.visit_name)}</td>
        <td>${escapeHtml(task.window_start)} 至 ${escapeHtml(task.window_end)}</td>
        <td>${badge(task.status)}</td>
        <td>
          <button class="link-button" type="button" data-task-status="${task.id}:completed" ${disabled ? "disabled" : ""}>
            完成
          </button>
        </td>
      </tr>
    `;
    })
    .join("");
}

function renderFollowupTasks(target, tasks) {
  if (!tasks.length) {
    target.innerHTML = `<tr><td colspan="7" class="empty">当前筛选下暂无随访任务</td></tr>`;
    return;
  }

  target.innerHTML = tasks
    .map((task) => {
      const terminal = ["completed", "cancelled", "dead", "withdrawn"].includes(task.status);
      const actionButtons = followupActions
        .map((action) => {
          const isCurrent = task.status === action.status;
          return `<button class="link-button" type="button" data-task-status="${task.id}:${action.status}" ${isCurrent || terminal ? "disabled" : ""}>${action.label}</button>`;
        })
        .join(" ");
      return `
      <tr>
        <td>${escapeHtml(task.planned_date)}</td>
        <td>
          <strong>${escapeHtml(task.patient_name)}</strong><br>
          <span>${escapeHtml(task.patient_code)}</span>
        </td>
        <td>${escapeHtml(task.project_name)}</td>
        <td>${escapeHtml(task.visit_name)}</td>
        <td>${escapeHtml(task.window_start)} 至 ${escapeHtml(task.window_end)}</td>
        <td>${badge(task.status)}</td>
        <td>${actionButtons}</td>
      </tr>
    `;
    })
    .join("");
}

function renderPatientCards(patients) {
  if (!patients.length) {
    elements.patientList.innerHTML = `<div class="empty">暂无病例</div>`;
    return;
  }

  elements.patientList.innerHTML = patients
    .slice(0, 6)
    .map(
      (patient) => `
    <article class="patient">
      <strong>${escapeHtml(patient.name)} · ${escapeHtml(patient.code)}</strong>
      <span>${escapeHtml(patient.diagnosis)}</span>
      <span>${escapeHtml(patient.project_name || "未分配项目")} · ${escapeHtml(patient.task_count)} 项随访</span>
      <span>${escapeHtml(maskPhone(patient.contact_phone))}</span>
    </article>
  `
    )
    .join("");
}

function renderProjects(projects) {
  if (!projects.length) {
    elements.projectRows.innerHTML = `<tr><td colspan="9" class="empty">暂无研究项目</td></tr>`;
    return;
  }

  elements.projectRows.innerHTML = projects
    .map(
      (project) => `
    <tr>
      <td>${escapeHtml(project.code)}</td>
      <td><strong>${escapeHtml(project.name)}</strong></td>
      <td>${escapeHtml(project.principal_investigator)}</td>
      <td>${escapeHtml(project.disease_area)}</td>
      <td>${escapeHtml(project.ethics_no || "-")}</td>
      <td>${badge(project.status)}</td>
      <td>${escapeHtml(project.target_enrollment)}</td>
      <td>${escapeHtml(project.patient_count)}</td>
      <td><button class="link-button" type="button" data-project-detail="${project.id}">查看</button></td>
    </tr>
  `
    )
    .join("");
}

function renderPatientsTable(patients) {
  if (!patients.length) {
    elements.patientRows.innerHTML = `<tr><td colspan="8" class="empty">暂无病例</td></tr>`;
    return;
  }

  elements.patientRows.innerHTML = patients
    .map(
      (patient) => `
    <tr>
      <td>${escapeHtml(patient.code)}</td>
      <td><strong>${escapeHtml(patient.name)}</strong></td>
      <td>${escapeHtml(patient.gender)}</td>
      <td>${escapeHtml(patient.diagnosis)}</td>
      <td>${escapeHtml(patient.project_name || "未分配")}</td>
      <td>${badge(patient.enrollment_status)}</td>
      <td>${escapeHtml(patient.enrolled_at || "-")}</td>
      <td><button class="link-button" type="button" data-detail="${patient.id}">详情</button></td>
    </tr>
  `
    )
    .join("");
}

function renderCandidates(candidates) {
  if (!candidates.length) {
    elements.candidateRows.innerHTML = `<tr><td colspan="8" class="empty">暂无符合条件的候选病例</td></tr>`;
    return;
  }

  elements.candidateRows.innerHTML = candidates
    .map(
      (patient) => `
    <tr>
      <td><input type="checkbox" data-select-patient="${patient.id}"></td>
      <td>${escapeHtml(patient.code)}</td>
      <td><strong>${escapeHtml(patient.name)}</strong></td>
      <td>${escapeHtml(patient.diagnosis)}</td>
      <td>${escapeHtml(patient.diagnosis_date)}</td>
      <td>${escapeHtml(patient.age)}</td>
      <td>${badge(patient.screening_status)}</td>
      <td><button class="link-button" type="button" data-detail="${patient.id}">详情</button></td>
    </tr>
  `
    )
    .join("");
}

function renderQuality(issues) {
  const open = issues.filter((issue) => issue.status === "open").length;
  const high = issues.filter((issue) => issue.severity === "high").length;
  elements.qcMetrics.innerHTML = [
    ["待处理问题", open],
    ["高风险问题", high],
    ["规则覆盖", "4类"],
    ["最近检查", "实时"],
  ]
    .map(
      ([label, value]) => `
    <article class="metric">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `
    )
    .join("");

  if (!issues.length) {
    elements.qcRows.innerHTML = `<tr><td colspan="7" class="empty">暂无质控问题</td></tr>`;
    return;
  }

  elements.qcRows.innerHTML = issues
    .map(
      (issue) => `
    <tr>
      <td>${escapeHtml(issue.issue_type)}</td>
      <td>${escapeHtml(issue.description)}</td>
      <td>${escapeHtml(issue.patient_code || "-")}</td>
      <td>${escapeHtml(issue.field_name)}</td>
      <td>${badge(issue.severity)}</td>
      <td>${badge(issue.status)}</td>
      <td><button class="link-button" type="button" data-qc-detail="${issue.id}">复核</button></td>
    </tr>
  `
    )
    .join("");
}

function renderExports(jobs) {
  if (!jobs.length) {
    elements.exportRows.innerHTML = `<tr><td colspan="6" class="empty">暂无导出记录</td></tr>`;
    return;
  }

  elements.exportRows.innerHTML = jobs
    .map(
      (job) => `
    <tr>
      <td>${escapeHtml(job.created_at)}</td>
      <td>${escapeHtml(job.filename)}</td>
      <td>${escapeHtml(job.record_count)}</td>
      <td>${job.masked ? "是" : "否"}</td>
      <td>${escapeHtml(job.operator)}</td>
      <td><button class="link-button" type="button" data-export-detail="${job.id}">核对</button></td>
    </tr>
  `
    )
    .join("");
}

function renderAudit(logs) {
  if (!logs.length) {
    elements.auditRows.innerHTML = `<tr><td colspan="6" class="empty">暂无操作日志</td></tr>`;
    return;
  }

  elements.auditRows.innerHTML = logs
    .map(
      (log) => `
    <tr>
      <td>${escapeHtml(log.created_at)}</td>
      <td>${escapeHtml(log.actor)}</td>
      <td>${escapeHtml(log.module)}</td>
      <td>${escapeHtml(log.action)}</td>
      <td>${escapeHtml(log.detail)}</td>
      <td>${escapeHtml(log.ip_address)}</td>
    </tr>
  `
    )
    .join("");
}

function renderRoleBadges() {
  const container = $(".user-info");
  if (!container) return;
  const existingBadges = container.querySelectorAll(".role-badge");
  existingBadges.forEach((b) => b.remove());
  const badge = document.createElement("span");
  badge.className = "role-badge active";
  badge.dataset.role = state.currentRole;
  badge.textContent = roleLabels[state.currentRole] || state.currentRole;
  container.insertBefore(badge, container.firstChild);
}

function populateProjectSelects() {
  const options = state.projects
    .map(
      (project) =>
        `<option value="${project.id}">${escapeHtml(project.name)}</option>`
    )
    .join("");
  const currentScreenProject = elements.screenProject.value;
  const currentExportProject = elements.exportProject.value;
  elements.screenProject.innerHTML = `<option value="">选择研究项目</option>${options}`;
  elements.exportProject.innerHTML = `<option value="">全部项目</option>${options}`;
  elements.screenProject.value = currentScreenProject;
  elements.exportProject.value = currentExportProject;
}

function filterTasksForStatus(status, tasks = state.tasks) {
  return status ? tasks.filter((task) => task.status === status) : tasks;
}

function renderAll() {
  renderPatientCards(state.patients);
  renderProjects(state.projects);
  renderPatientsTable(state.patients);
  renderDashboardTasks(elements.taskRows, filterTasksForStatus(elements.statusFilter.value).slice(0, 8));
  renderFollowupTasks(elements.followupTaskRows, filterTasksForStatus(elements.followStatusFilter.value));
  renderCandidates(state.candidates);
  renderQuality(state.qualityIssues);
  renderExports(state.exportJobs);
  renderAudit(state.auditLogs);
  populateProjectSelects();
  renderRoleBadges();
}

function showPage(pageName) {
  $$(".page").forEach((page) => page.classList.toggle("active", page.id === `page-${pageName}`));
  $$(".nav-btn").forEach((button) => button.classList.toggle("active", button.dataset.page === pageName));
}

function openModal(title, body) {
  elements.modalTitle.textContent = title;
  elements.modalBody.innerHTML = body;
  elements.modal.classList.remove("hidden");
}

function closeModal() {
  elements.modal.classList.add("hidden");
}

async function loadCandidates() {
  const params = new URLSearchParams();
  if (elements.screenProject.value) params.set("project_id", elements.screenProject.value);
  if (elements.diagnosisFilter.value.trim()) params.set("diagnosis", elements.diagnosisFilter.value.trim());
  if (elements.dateFrom.value) params.set("date_from", elements.dateFrom.value);
  if (elements.dateTo.value) params.set("date_to", elements.dateTo.value);
  state.candidates = await request(`/screening/candidates?${params.toString()}`);
  renderCandidates(state.candidates);
}

async function loadData() {
  elements.refreshButton.disabled = true;
  try {
    const [health, overview, projects, patients, tasks, candidates, qualityIssues, exportJobs, auditLogs] =
      await Promise.all([
        request("/health"),
        request("/overview"),
        request("/projects"),
        request("/patients"),
        request("/tasks"),
        request("/screening/candidates"),
        request("/quality/issues"),
        request("/exports"),
        request("/audit-logs"),
      ]);

    state.projects = projects;
    state.patients = patients;
    state.tasks = tasks;
    state.candidates = candidates;
    state.qualityIssues = qualityIssues;
    state.exportJobs = exportJobs;
    state.auditLogs = auditLogs;

    setServiceState(true, `${health.service} 已连接，SQLite ${health.database}`);
    renderMetrics(overview);
    renderAll();
  } catch (error) {
    setServiceState(false, `服务不可用：${error.message}`);
    elements.metrics.innerHTML = "";
    elements.taskRows.innerHTML = `<tr><td colspan="7" class="empty">无法加载随访任务</td></tr>`;
    elements.patientList.innerHTML = `<div class="empty">无法加载病例队列</div>`;
  } finally {
    elements.refreshButton.disabled = false;
  }
}

function selectedPatientIds() {
  return $$("[data-select-patient]:checked").map((input) => Number(input.dataset.selectPatient));
}

async function patchTaskStatus(taskId, newStatus) {
  const notesMap = {
    completed: "浏览器端确认完成",
    lost: "浏览器端标记失访",
    dead: "浏览器端标记死亡",
    withdrawn: "浏览器端标记撤回",
    missed: "浏览器端标记补访",
  };
  await request(`/tasks/${taskId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: newStatus, notes: notesMap[newStatus] || `状态变更为${statusText[newStatus] || newStatus}` }),
  });
  await loadData();
  openModal("随访任务", `<p>任务状态已更新为「${escapeHtml(statusText[newStatus] || newStatus)}」。</p>`);
}

async function showPatientDetail(patientId) {
  const patient = await request(`/patients/${patientId}`);
  state.currentPatient = patient;
  $("#detailPatientName").textContent = patient.name;
  $("#detailPatientCode").textContent = patient.code;
  $("#detailPatientGender").textContent = patient.gender;
  $("#detailPatientBirth").textContent = patient.birth_date;
  $("#detailPatientDiagnosis").textContent = patient.diagnosis;
  $("#detailPatientPhone").textContent = maskPhone(patient.contact_phone);

  const detail = patient.detail || {};
  $("#tab-baseline").innerHTML = detail.baseline ? `<p>${escapeHtml(detail.baseline)}</p>` : `<p>暂无基线数据</p>`;
  $("#tab-lab").innerHTML = detail.lab ? `<p>${escapeHtml(detail.lab)}</p>` : `<p>暂无检验数据</p>`;
  $("#tab-treatment").innerHTML = detail.treatment ? `<p>${escapeHtml(detail.treatment)}</p>` : `<p>暂无治疗数据</p>`;
  $("#tab-surgery").innerHTML = detail.surgery ? `<p>${escapeHtml(detail.surgery)}</p>` : `<p>暂无手术数据</p>`;
  $("#tab-outcome").innerHTML = detail.outcome ? `<p>${escapeHtml(detail.outcome)}</p>` : `<p>暂无结局数据</p>`;
  $("#tab-attachment").innerHTML = detail.attachment ? `<p>${escapeHtml(detail.attachment)}</p>` : `<p>暂无附件</p>`;
  $("#tab-followup").innerHTML =
    patient.tasks && patient.tasks.length
      ? `<ul>${patient.tasks
          .map(
            (task) =>
              `<li>${escapeHtml(task.visit_name)}：${escapeHtml(task.planned_date)}，${escapeHtml(statusText[task.status] || task.status)}</li>`
          )
          .join("")}</ul>`
      : `<p>暂无随访记录</p>`;

  $$(".tab-btn").forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === "baseline"));
  $$(".tab-pane").forEach((pane) => pane.classList.toggle("active", pane.id === "tab-baseline"));

  showPage("patientDetail");
}

function showProjectDetail(projectId) {
  const project = state.projects.find((item) => Number(item.id) === Number(projectId));
  if (!project) return;
  openModal("研究项目详情", `
    <p><strong>${escapeHtml(project.name)}</strong></p>
    <p>编号：${escapeHtml(project.code)}</p>
    <p>主要研究者：${escapeHtml(project.principal_investigator)}</p>
    <p>疾病领域：${escapeHtml(project.disease_area)}</p>
    <p>伦理批件号：${escapeHtml(project.ethics_no || "-")}</p>
    <p>目标入组：${escapeHtml(project.target_enrollment)}</p>
    <p>已入组：${escapeHtml(project.patient_count)}</p>
    <h4>入组标准</h4>
    <p>${escapeHtml(project.inclusion_criteria || "暂无")}</p>
    <h4>排除标准</h4>
    <p>${escapeHtml(project.exclusion_criteria || "暂无")}</p>
    <h4>随访计划</h4>
    <p>${escapeHtml(project.followup_plan || "暂无")}</p>
  `);
}

function openNewProjectForm() {
  openModal("新建研究项目", `
    <form id="newProjectForm" class="export-form">
      <div class="form-group">
        <label>项目名称 *</label>
        <input type="text" name="name" required class="filter-input" placeholder="请输入项目名称">
      </div>
      <div class="form-group">
        <label>项目编号 *</label>
        <input type="text" name="code" required class="filter-input" placeholder="请输入项目编号">
      </div>
      <div class="form-group">
        <label>主要研究者 *</label>
        <input type="text" name="principal_investigator" required class="filter-input" placeholder="请输入主要研究者">
      </div>
      <div class="form-group">
        <label>疾病领域</label>
        <input type="text" name="disease_area" class="filter-input" placeholder="请输入疾病领域">
      </div>
      <div class="form-group">
        <label>目标入组数</label>
        <input type="number" name="target_enrollment" class="filter-input" placeholder="0" min="0">
      </div>
      <div class="form-group">
        <label>伦理批件号</label>
        <input type="text" name="ethics_no" class="filter-input" placeholder="请输入伦理批件号">
      </div>
      <div class="form-group">
        <label>入组标准</label>
        <textarea name="inclusion_criteria" class="filter-input" rows="3" placeholder="请输入入组标准"></textarea>
      </div>
      <div class="form-group">
        <label>排除标准</label>
        <textarea name="exclusion_criteria" class="filter-input" rows="3" placeholder="请输入排除标准"></textarea>
      </div>
      <div class="form-group">
        <label>随访计划</label>
        <textarea name="followup_plan" class="filter-input" rows="3" placeholder="请输入随访计划"></textarea>
      </div>
      <button type="submit" class="primary-btn">创建项目</button>
    </form>
  `);

  const form = $("#newProjectForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(form);
      const payload = {};
      for (const [key, value] of formData.entries()) {
        payload[key] = key === "target_enrollment" ? Number(value) || 0 : value;
      }
      try {
        await request("/projects", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        await loadData();
        closeModal();
        openModal("新建项目", `<p>研究项目「${escapeHtml(payload.name)}」已成功创建。</p>`);
      } catch (error) {
        openModal("新建项目", `<p>创建失败：${escapeHtml(error.message)}</p>`);
      }
    });
  }
}

function showQualityDetail(issueId) {
  const issue = state.qualityIssues.find((item) => Number(item.id) === Number(issueId));
  if (!issue) return;
  openModal("质控问题复核", `
    <p>问题类型：${escapeHtml(issue.issue_type)}</p>
    <p>相关病例：${escapeHtml(issue.patient_code || "-")} ${escapeHtml(issue.patient_name || "")}</p>
    <p>字段：${escapeHtml(issue.field_name)}</p>
    <p>严重程度：${escapeHtml(statusText[issue.severity] || issue.severity)}</p>
    <p>状态：${badge(issue.status)}</p>
    <p>${escapeHtml(issue.description)}</p>
    ${issue.status === "open" ? `<button class="primary-btn" type="button" data-qc-review="${issue.id}">标记已复核</button>` : ""}
  `);
}

function showExportDetail(jobId) {
  const job = state.exportJobs.find((item) => Number(item.id) === Number(jobId));
  if (!job) return;
  openModal("导出核对", `
    <p>文件名：${escapeHtml(job.filename)}</p>
    <p>项目：${escapeHtml(job.project_name || "全部项目")}</p>
    <p>记录数：${escapeHtml(job.record_count)}</p>
    <p>脱敏：${job.masked ? "是" : "否"}</p>
    <p>内容：${escapeHtml(job.content)}</p>
  `);
}

function debounce(fn, wait) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}

elements.refreshButton.addEventListener("click", loadData);
elements.statusFilter.addEventListener("change", () => renderDashboardTasks(elements.taskRows, filterTasksForStatus(elements.statusFilter.value).slice(0, 8)));
elements.followStatusFilter.addEventListener("change", () => renderFollowupTasks(elements.followupTaskRows, filterTasksForStatus(elements.followStatusFilter.value)));
elements.searchBtn.addEventListener("click", () => loadCandidates().catch((error) => setServiceState(false, `筛选失败：${error.message}`)));
elements.diagnosisFilter.addEventListener("input", debounce(() => loadCandidates().catch(() => {}), 300));
elements.screenProject.addEventListener("change", () => loadCandidates().catch((error) => setServiceState(false, `筛选失败：${error.message}`)));
elements.dateFrom.addEventListener("change", () => loadCandidates().catch((error) => setServiceState(false, `筛选失败：${error.message}`)));
elements.dateTo.addEventListener("change", () => loadCandidates().catch((error) => setServiceState(false, `筛选失败：${error.message}`)));

$$(".nav-btn").forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

elements.selectAll.addEventListener("change", () => {
  $$("[data-select-patient]").forEach((input) => {
    input.checked = elements.selectAll.checked;
  });
});

elements.batchEnrollBtn.addEventListener("click", async () => {
  const ids = selectedPatientIds();
  const projectId = Number(elements.screenProject.value || state.projects[0]?.id);
  if (!ids.length || !projectId) {
    openModal("批量入组", "<p>请选择候选病例和研究项目。</p>");
    return;
  }
  try {
    await request("/screening/enroll", {
      method: "POST",
      body: JSON.stringify({ patientIds: ids, projectId }),
    });
    await loadData();
    openModal("批量入组", `<p>已入组 ${ids.length} 例候选病例。</p>`);
  } catch (error) {
    openModal("批量入组", `<p>入组失败：${escapeHtml(error.message)}</p>`);
  }
});

elements.batchExcludeBtn.addEventListener("click", async () => {
  const ids = selectedPatientIds();
  if (!ids.length) {
    openModal("批量排除", "<p>请选择需要排除的候选病例。</p>");
    return;
  }
  try {
    await request("/screening/exclude", {
      method: "POST",
      body: JSON.stringify({ patientIds: ids }),
    });
    await loadData();
    openModal("批量排除", `<p>已排除 ${ids.length} 例候选病例。</p>`);
  } catch (error) {
    openModal("批量排除", `<p>排除失败：${escapeHtml(error.message)}</p>`);
  }
});

elements.runQcBtn.addEventListener("click", async () => {
  try {
    const result = await request("/quality/run", { method: "POST", body: "{}" });
    await loadData();
    openModal("质控检查", `<p>检查完成，待处理 ${escapeHtml(result.summary.open)} 项，已复核 ${escapeHtml(result.summary.reviewed)} 项。</p>`);
  } catch (error) {
    openModal("质控检查", `<p>检查失败：${escapeHtml(error.message)}</p>`);
  }
});

elements.exportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const content = $$("input[name='content']:checked").map((input) => input.value);
  try {
    const job = await request("/exports", {
      method: "POST",
      body: JSON.stringify({
        projectId: elements.exportProject.value || null,
        content,
        masked: elements.maskData.checked,
        includeQcReport: elements.includeQcReport.checked,
      }),
    });
    await loadData();
    openModal("生成导出文件", `<p>${escapeHtml(job.filename)} 已生成，记录数 ${escapeHtml(job.record_count)}。</p>`);
  } catch (error) {
    openModal("生成导出文件", `<p>导出失败：${escapeHtml(error.message)}</p>`);
  }
});

elements.backToList.addEventListener("click", () => showPage("patients"));
elements.closeModal.addEventListener("click", closeModal);
elements.modal.addEventListener("click", (event) => {
  if (event.target === elements.modal) {
    closeModal();
  }
});

document.body.addEventListener("click", async (event) => {
  const taskStatusBtn = event.target.closest("[data-task-status]");
  const detailButton = event.target.closest("[data-detail]");
  const projectButton = event.target.closest("[data-project-detail]");
  const qualityButton = event.target.closest("[data-qc-detail]");
  const qcReviewButton = event.target.closest("[data-qc-review]");
  const exportButton = event.target.closest("[data-export-detail]");
  const addProjectButton = event.target.closest("#addProjectBtn");
  const roleBadge = event.target.closest(".role-badge[data-role]");
  const tabButton = event.target.closest(".tab-btn");

  try {
    if (taskStatusBtn) {
      taskStatusBtn.disabled = true;
      const [taskId, newStatus] = taskStatusBtn.dataset.taskStatus.split(":");
      await patchTaskStatus(taskId, newStatus);
    } else if (detailButton) {
      await showPatientDetail(detailButton.dataset.detail);
    } else if (projectButton) {
      showProjectDetail(projectButton.dataset.projectDetail);
    } else if (qualityButton) {
      showQualityDetail(qualityButton.dataset.qcDetail);
    } else if (qcReviewButton) {
      const issueId = qcReviewButton.dataset.qcReview;
      await request(`/quality/issues/${issueId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "reviewed" }),
      });
      await loadData();
      closeModal();
      openModal("质控复核", `<p>质控问题已标记为已复核。</p>`);
    } else if (exportButton) {
      showExportDetail(exportButton.dataset.exportDetail);
    } else if (addProjectButton) {
      openNewProjectForm();
    } else if (roleBadge) {
      state.currentRole = roleBadge.dataset.role;
      renderRoleBadges();
    } else if (tabButton) {
      $$(".tab-btn").forEach((button) => button.classList.toggle("active", button === tabButton));
      $$(".tab-pane").forEach((pane) => pane.classList.toggle("active", pane.id === `tab-${tabButton.dataset.tab}`));
    }
  } catch (error) {
    setServiceState(false, `操作失败：${error.message}`);
    if (taskStatusBtn) taskStatusBtn.disabled = false;
  }
});

loadData();
