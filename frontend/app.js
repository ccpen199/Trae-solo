const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.backendUrl) || 'http://127.0.0.1:53457';

const state = {
  transfers: [],
  hospitals: [],
  doctorsByHospital: new Map(),
  patients: [],
  selectedTransfer: null,
  lastCreatedTransfer: null,
  reports: null,
  currentView: 'dashboard'
};

const statusText = {
  pending: '待审核',
  reviewing: '审核中',
  accepted: '审核通过',
  supplement: '需补充资料',
  rejected: '已拒绝',
  coordinating: '协调中',
  transiting: '转运中',
  completed: '已完成',
  cancelled: '已取消'
};

const urgencyText = {
  normal: '普通',
  urgent: '加急',
  emergency: '紧急'
};

const requiredFields = [
  { name: 'patient_id', label: '患者' },
  { name: 'urgency', label: '紧急程度' },
  { name: 'from_hospital_id', label: '转出医院' },
  { name: 'to_hospital_id', label: '转入医院' },
  { name: 'from_doctor_id', label: '转出医生' },
  { name: 'to_doctor_id', label: '转入医生' },
  { name: 'primary_diagnosis', label: '初步诊断', minLength: 5 },
  { name: 'transfer_reason', label: '转诊原因', minLength: 10 },
  { name: 'current_condition', label: '当前病情', minLength: 10 }
];

function $(id) {
  return document.getElementById(id);
}

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `接口请求失败: ${response.status}`);
  }
  return payload.data;
}

function formatDate(value) {
  if (!value) return '--';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

function showToast(message, type = 'success') {
  const toast = $('toast');
  toast.textContent = message;
  toast.hidden = false;
  toast.style.background = type === 'error' ? '#991b1b' : '#0f172a';
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 3000);
}

function setServiceStatus(ok, text) {
  const el = $('serviceStatus');
  el.textContent = text;
  el.classList.toggle('ok', ok);
  el.classList.toggle('bad', !ok);
}

function clearFieldErrors() {
  requiredFields.forEach(field => {
    const errorEl = $(`error-${field.name}`);
    if (errorEl) errorEl.textContent = '';
    const inputEl = document.querySelector(`[name="${field.name}"]`);
    if (inputEl) inputEl.classList.remove('input-error');
  });
}

function showFieldError(fieldName, message) {
  const errorEl = $(`error-${fieldName}`);
  if (errorEl) errorEl.textContent = message;
  const inputEl = document.querySelector(`[name="${fieldName}"]`);
  if (inputEl) inputEl.classList.add('input-error');
}

function validateForm(form) {
  let isValid = true;
  let errorCount = 0;
  const errors = [];
  clearFieldErrors();
  $('validationSummary').hidden = true;

  requiredFields.forEach(field => {
    const value = form[field.name] ? form[field.name].value.trim() : '';
    const selectEl = form[field.name];
    const placeholderText = selectEl?.options?.[0]?.text || '';

    if (!value) {
      const errorMsg = placeholderText && placeholderText !== field.label 
        ? placeholderText 
        : `请选择${field.label}`;
      showFieldError(field.name, errorMsg);
      errors.push({ field: field.label, message: errorMsg, type: 'required' });
      errorCount++;
      isValid = false;
    } else if (field.minLength && value.length < field.minLength) {
      const errorMsg = `${field.label}内容过短，请详细描述（至少${field.minLength}字）`;
      showFieldError(field.name, errorMsg);
      errors.push({ field: field.label, message: errorMsg, type: 'length' });
      errorCount++;
      isValid = false;
    }
  });

  if (form.from_hospital_id.value && form.to_hospital_id.value &&
      form.from_hospital_id.value === form.to_hospital_id.value) {
    showFieldError('to_hospital_id', '转入医院不能与转出医院相同，请选择其他医院');
    errors.push({ field: '转入医院', message: '转入医院不能与转出医院相同', type: 'business' });
    errorCount++;
    isValid = false;
  }

  if (form.from_doctor_id.value && form.to_doctor_id.value &&
      form.from_doctor_id.value === form.to_doctor_id.value) {
    showFieldError('to_doctor_id', '转入医生不能与转出医生相同，请选择其他医生');
    errors.push({ field: '转入医生', message: '转入医生不能与转出医生相同', type: 'business' });
    errorCount++;
    isValid = false;
  }

  if (!isValid) {
    showValidationSummary(errors, errorCount);
  }

  return isValid;
}

function showValidationSummary(errors, count) {
  const summary = $('validationSummary');
  const list = $('validationList');
  const countEl = $('validationCount');

  countEl.textContent = `${count} 项问题需要修正`;
  
  const typeIcons = {
    required: '📋',
    length: '📝',
    business: '⚠️'
  };

  list.innerHTML = errors.map(err => `
    <li>
      <span class="error-icon">${typeIcons[err.type] || '❌'}</span>
      <span class="error-field">${err.field}：</span>
      <span class="error-message">${err.message}</span>
    </li>
  `).join('');

  summary.hidden = false;
  summary.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function showSuccessBanner(transfer) {
  const banner = $('successBanner');
  $('successTransferNo').textContent = transfer.transfer_no || '--';
  
  const statusBadge = $('successStatus');
  statusBadge.textContent = statusText[transfer.status] || transfer.status || '待审核';
  statusBadge.className = `badge ${transfer.status || 'pending'}`;
  
  $('successHint').innerHTML = `该申请已进入待审核队列，请等待接诊医院审核。<br><strong>可点击下方按钮立即查看详情或返回转诊列表。</strong>`;
  
  banner.hidden = false;
  banner.scrollIntoView({ behavior: 'smooth', block: 'center' });

  setTimeout(() => { banner.hidden = true; }, 30000);
}

function switchView(viewName) {
  state.currentView = viewName;
  
  document.querySelectorAll('.nav a').forEach(link => {
    link.classList.toggle('active', link.dataset.view === viewName);
  });

  const panels = {
    dashboard: ['dashboard', 'transfers-panel', 'create', 'hospitals'],
    transfers: ['transfers-panel'],
    create: ['create', 'hospitals'],
    hospitals: ['hospitals'],
    reports: ['reports-panel']
  };

  document.querySelectorAll('[id$="-panel"], #create, #hospitals, #dashboard, #transfers-panel, #reports-panel').forEach(el => {
    el.hidden = true;
  });

  const toShow = panels[viewName] || ['dashboard', 'transfers-panel', 'create', 'hospitals'];
  toShow.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.hidden = false;
  });

  if (viewName === 'reports') {
    loadReports().catch(err => showToast(err.message, 'error'));
  }
}

async function loadHealth() {
  try {
    const data = await api('/api/health');
    setServiceStatus(true, data.status === 'healthy' ? '后端正常' : '后端可用');
  } catch (err) {
    setServiceStatus(false, '后端异常');
    throw err;
  }
}

async function loadSummary() {
  try {
    const data = await api('/api/reports/summary');
    $('metricTotal').textContent = data.total_transfers;
    $('metricCompleted').textContent = data.completed_transfers;
    $('metricRate').textContent = `${data.success_rate}%`;
    $('metricWait').textContent = `${data.avg_wait_hours}h`;
    
    const statusDist = data.status_distribution || [];
    const pending = statusDist.find(s => s.status === 'pending')?.count || 0;
    const coordinating = statusDist.find(s => s.status === 'coordinating')?.count || 0;
    const rejected = statusDist.find(s => s.status === 'rejected')?.count || 0;
    
    $('metricPending').textContent = pending;
    $('metricCoordinating').textContent = coordinating;
    
    const rejectReasons = data.reject_reasons || [];
    const topReject = rejectReasons[0];
    $('metricRejectReason').innerHTML = `<strong>${rejected}</strong> <small>${topReject ? topReject.reason?.substring(0, 8) || '' : ''}</small>`;
    
    const deptLoad = data.department_load || [];
    const topDept = deptLoad[0];
    $('metricTopDept').innerHTML = `<strong>${topDept?.count || 0}</strong> <small>${topDept?.department?.substring(0, 8) || '--'}</small>`;
    
    renderMiniRejectReasons(rejectReasons.slice(0, 4));
    renderMiniDepartmentLoad(deptLoad.slice(0, 5));
    renderMiniCollaboration(data.hospital_collaboration?.slice(0, 4) || []);
  } catch (err) {
    console.error('Load summary error:', err);
  }
}

function renderMiniRejectReasons(reasons) {
  const container = $('rejectReasonsMini');
  if (!reasons || reasons.length === 0) {
    container.innerHTML = '<div class="empty-mini">暂无拒收记录</div>';
    return;
  }
  const maxCount = Math.max(...reasons.map(r => r.count || 0), 1);
  container.innerHTML = reasons.map(r => `
    <div class="mini-bar-item">
      <span class="mini-label">${r.reason?.substring(0, 10) || '其他'}</span>
      <div class="mini-bar">
        <div class="mini-bar-fill red" style="width: ${Math.round((r.count / maxCount) * 100)}%"></div>
      </div>
      <span class="mini-value">${r.count}</span>
    </div>
  `).join('');
}

function renderMiniDepartmentLoad(depts) {
  const container = $('departmentLoadMini');
  if (!depts || depts.length === 0) {
    container.innerHTML = '<div class="empty-mini">暂无科室数据</div>';
    return;
  }
  const maxCount = Math.max(...depts.map(d => d.count || 0), 1);
  container.innerHTML = depts.map(d => `
    <div class="mini-bar-item">
      <span class="mini-label">${d.department?.substring(0, 10) || '其他'}</span>
      <div class="mini-bar">
        <div class="mini-bar-fill blue" style="width: ${Math.round((d.count / maxCount) * 100)}%"></div>
      </div>
      <span class="mini-value">${d.count}</span>
    </div>
  `).join('');
}

function renderMiniCollaboration(collabs) {
  const container = $('collaborationMini');
  if (!collabs || collabs.length === 0) {
    container.innerHTML = '<div class="empty-mini">暂无协作数据</div>';
    return;
  }
  container.innerHTML = collabs.map(c => `
    <div class="mini-collab-item">
      <span class="mini-collab-route">${c.from?.substring(0, 6)} → ${c.to?.substring(0, 6)}</span>
      <span class="mini-collab-count">${c.count || 0}次</span>
    </div>
  `).join('');
}

async function loadTransfers() {
  const params = new URLSearchParams({ page: '1', pageSize: '50' });
  const status = $('statusFilter').value;
  const urgency = $('urgencyFilter').value;
  const keyword = $('keywordFilter').value.trim();

  if (status) params.set('status', status);
  if (urgency) params.set('urgency', urgency);
  if (keyword) params.set('keyword', keyword);

  const data = await api(`/api/transfers?${params.toString()}`);
  state.transfers = data.list || [];
  $('transferCount').textContent = `共 ${data.total} 条记录`;
  renderTransfers();
}

function getAvailableActions(transfer) {
  const actions = [{ name: 'view', label: '查看详情' }];
  
  if (transfer.status === 'pending' || transfer.status === 'supplement') {
    actions.unshift({ name: 'review', label: '资料审核' });
  }
  if (transfer.status === 'accepted') {
    actions.unshift({ name: 'coordinate', label: '协调登记' });
  }
  if (transfer.status === 'coordinating' || transfer.status === 'transiting') {
    actions.unshift({ name: 'complete', label: '接诊结果' });
  }
  
  return actions;
}

function renderTransfers() {
  const rows = $('transferRows');
  if (state.transfers.length === 0) {
    rows.innerHTML = '<tr><td colspan="10">暂无符合条件的转诊记录</td></tr>';
    return;
  }

  rows.innerHTML = state.transfers.map((item) => {
    const actions = getAvailableActions(item);
    const hospitals = `${item.from_hospital_name} → ${item.to_hospital_name}`;
    const reviewInfo = item.rejection_reason || (item.latest_review_comments || '--');
    return `
    <tr data-id="${item.id}">
      <td><strong>${item.transfer_no}</strong></td>
      <td>${item.patient_name}</td>
      <td><div class="truncate-text" title="${item.primary_diagnosis}">${item.primary_diagnosis || '--'}</div></td>
      <td><div class="truncate-text" title="${hospitals}">${hospitals}</div></td>
      <td>${item.from_department} → ${item.to_department}</td>
      <td><span class="badge ${item.urgency}">${urgencyText[item.urgency] || item.urgency}</span></td>
      <td><span class="badge ${item.status}">${statusText[item.status] || item.status}</span></td>
      <td><div class="truncate-text" title="${reviewInfo}">${item.status === 'rejected' ? `❌ ${item.rejection_reason || '--'}` : item.status === 'supplement' ? `📋 需补充资料` : item.status === 'accepted' || item.status === 'coordinating' || item.status === 'completed' ? '✅ 资料审核通过' : '--'}</div></td>
      <td>${formatDate(item.created_at)}</td>
      <td>
        <div class="action-buttons">
          ${actions.map(a => 
            `<button class="action-btn ${a.name}" data-action="${a.name}" data-id="${item.id}">${a.label}</button>`
          ).join('')}
        </div>
      </td>
    </tr>
  `;
  }).join('');
}

async function loadHospitals() {
  state.hospitals = await api('/api/hospitals');
  renderHospitals();
  populateHospitalSelects();
}

function renderHospitals() {
  const list = $('hospitalList');
  if (state.hospitals.length === 0) {
    list.textContent = '暂无医院数据';
    return;
  }

  list.innerHTML = state.hospitals.map((hospital) => `
    <div class="resource-item">
      <strong>${hospital.name} · ${hospital.level}</strong>
      <span>${hospital.address}</span>
      <span>${hospital.departments || '科室信息待补充'}</span>
      <span>${hospital.phone}</span>
    </div>
  `).join('');
}

async function loadPatients() {
  const data = await api('/api/patients?page=1&pageSize=50');
  state.patients = data.list || [];
  const select = $('patientSelect');
  const patientOptions = state.patients.map((patient) =>
    `<option value="${patient.id}">${patient.name} · ${patient.gender} · ${patient.age}岁 · ${patient.phone}</option>`
  ).join('');
  select.innerHTML = '<option value="">请选择患者</option>' + patientOptions;
}

function populateHospitalSelects() {
  const options = state.hospitals.map((hospital) =>
    `<option value="${hospital.id}">${hospital.name}</option>`
  ).join('');
  
  $('fromHospitalSelect').innerHTML = '<option value="">请选择转出医院</option>' + options;
  $('toHospitalSelect').innerHTML = '<option value="">请选择转入医院</option>' + options;
}

async function getDoctors(hospitalId) {
  if (!hospitalId) return [];
  if (!state.doctorsByHospital.has(String(hospitalId))) {
    const doctors = await api(`/api/hospitals/${hospitalId}/doctors`);
    state.doctorsByHospital.set(String(hospitalId), doctors);
  }
  return state.doctorsByHospital.get(String(hospitalId));
}

async function populateDoctorSelect(hospitalSelectId, doctorSelectId, defaultText = '请先选择医院') {
  const hospitalId = $(hospitalSelectId).value;
  const doctors = await getDoctors(hospitalId);
  const select = $(doctorSelectId);
  
  if (doctors.length === 0) {
    select.innerHTML = `<option value="">${defaultText}</option>`;
    return;
  }
  
  select.innerHTML = '<option value="">请选择医生</option>' + doctors.map((doctor) =>
    `<option value="${doctor.id}" data-department="${doctor.department}" data-name="${doctor.name}">${doctor.name} · ${doctor.department} · ${doctor.title}</option>`
  ).join('');
}

function selectedOption(selectId) {
  const select = $(selectId);
  return select.options[select.selectedIndex];
}

async function submitTransfer(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $('formMessage');
  const button = $('submitBtn');

  if (!validateForm(form)) {
    message.textContent = '请检查并完善必填信息';
    showToast('请检查并完善必填信息', 'error');
    return;
  }

  const patient = state.patients.find((item) => String(item.id) === form.patient_id.value);
  const fromHospital = state.hospitals.find((item) => String(item.id) === form.from_hospital_id.value);
  const toHospital = state.hospitals.find((item) => String(item.id) === form.to_hospital_id.value);
  const fromDoctorOption = selectedOption('fromDoctorSelect');
  const toDoctorOption = selectedOption('toDoctorSelect');

  if (!patient || !fromHospital || !toHospital || !fromDoctorOption || !toDoctorOption) {
    message.textContent = '请选择完整的患者、医院和医生信息';
    return;
  }

  const payload = {
    patient_id: Number(patient.id),
    patient_name: patient.name,
    from_hospital_id: Number(fromHospital.id),
    from_hospital_name: fromHospital.name,
    from_department: fromDoctorOption.dataset.department,
    from_doctor_id: Number(fromDoctorOption.value),
    from_doctor_name: fromDoctorOption.dataset.name,
    to_hospital_id: Number(toHospital.id),
    to_hospital_name: toHospital.name,
    to_department: toDoctorOption.dataset.department,
    to_doctor_id: Number(toDoctorOption.value),
    to_doctor_name: toDoctorOption.dataset.name,
    urgency: form.urgency.value,
    primary_diagnosis: form.primary_diagnosis.value.trim(),
    transfer_reason: form.transfer_reason.value.trim(),
    current_condition: form.current_condition.value.trim(),
    treatment_history: form.treatment_history.value.trim(),
    examination_results: form.examination_results.value.trim()
  };

  button.disabled = true;
  message.textContent = '正在提交...';
  try {
    const result = await api('/api/transfers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    form.reset();
    clearFieldErrors();
    await populateDoctorSelect('fromHospitalSelect', 'fromDoctorSelect');
    await populateDoctorSelect('toHospitalSelect', 'toDoctorSelect');
    
    state.lastCreatedTransfer = result;
    
    await Promise.all([loadTransfers(), loadSummary()]);
    
    message.textContent = '';
    showSuccessBanner(result);
    showToast(`转诊申请已创建：${result.transfer_no}`);
    
    if (window.scrollTo) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  } catch (err) {
    message.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    button.disabled = false;
  }
}

function renderDetailInfo(transfer, reviews, coordination, result, logs) {
  const detailItems = [
    ['转诊编号', `<strong class="highlight-text">${transfer.transfer_no}</strong>`],
    ['当前状态', `<span class="badge ${transfer.status}">${statusText[transfer.status] || transfer.status}</span>`],
    ['紧急程度', `<span class="badge ${transfer.urgency}">${urgencyText[transfer.urgency] || transfer.urgency}</span>`],
    ['患者姓名', transfer.patient_name],
    ['转出医院', transfer.from_hospital_name],
    ['转入医院', transfer.to_hospital_name],
    ['转出科室', `${transfer.from_department}`],
    ['转出医生', transfer.from_doctor_name],
    ['转入科室', `${transfer.to_department}`],
    ['转入医生', transfer.to_doctor_name],
    ['初步诊断', `<div class="detail-content">${transfer.primary_diagnosis}</div>`],
    ['转诊原因', `<div class="detail-content">${transfer.transfer_reason}</div>`],
    ['当前病情', `<div class="detail-content">${transfer.current_condition}</div>`]
  ];

  if (transfer.treatment_history) {
    detailItems.push(['诊疗经过', `<div class="detail-content">${transfer.treatment_history}</div>`]);
  }
  if (transfer.examination_results) {
    detailItems.push(['检查资料摘要', `<div class="detail-content">${transfer.examination_results}</div>`]);
  }
  if (transfer.rejection_reason) {
    detailItems.push(['拒收原因', `<div class="detail-content error-text">${transfer.rejection_reason}</div>`]);
  }

  detailItems.push(
    ['申请时间', formatDate(transfer.created_at)],
    ['更新时间', formatDate(transfer.updated_at)]
  );

  $('detailBody').innerHTML = detailItems.map(([label, value]) => `
    <div class="detail-item">
      <span>${label}</span>
      <div class="detail-value">${value || '--'}</div>
    </div>
  `).join('');

  renderReviewHistory(reviews);
  renderCoordinationInfo(coordination);
  renderResultInfo(result);
  renderLogs(logs, transfer);
}

function renderReviewHistory(reviews) {
  const container = $('reviewHistory');
  if (!reviews || reviews.length === 0) {
    container.innerHTML = `
      <div class="section-title">
        <span class="title-icon">📋</span>
        <strong>资料审核记录</strong>
      </div>
      <div class="info-item empty-state">
        <span>暂无审核记录</span>
        <small>该转诊申请尚未进行资料审核</small>
      </div>
    `;
    return;
  }

  const checkText = {
    ok: '✅ 符合要求',
    limited: '⚠️ 部分受限',
    no: '❌ 不符合'
  };
  const dataText = {
    complete: '✅ 资料完整',
    partial: '⚠️ 部分缺失',
    incomplete: '❌ 严重缺失'
  };

  container.innerHTML = `
    <div class="section-title">
      <span class="title-icon">📋</span>
      <strong>资料审核记录</strong>
      <span class="badge-count">${reviews.length} 条</span>
    </div>
  ` + reviews.map((review, idx) => `
    <div class="history-item ${review.result}">
      <div class="history-head">
        <span class="history-action">
          ${review.result === 'accepted' ? '✅ 同意接收' : 
            review.result === 'supplement' ? '📋 退回补充' : '❌ 拒收'}
        </span>
        <span class="history-time">${formatDate(review.created_at)}</span>
      </div>
      <div class="history-details">
        <div class="check-grid">
          <div class="check-item">
            <span class="check-label">科室能力</span>
            <span class="check-value">${checkText[review.department_check] || review.department_check || '--'}</span>
          </div>
          <div class="check-item">
            <span class="check-label">医生资质</span>
            <span class="check-value">${checkText[review.doctor_check] || review.doctor_check || '--'}</span>
          </div>
          <div class="check-item">
            <span class="check-label">床位情况</span>
            <span class="check-value">${checkText[review.bed_check] || review.bed_check || '--'}</span>
          </div>
          <div class="check-item">
            <span class="check-label">检查能力</span>
            <span class="check-value">${checkText[review.exam_check] || review.exam_check || '--'}</span>
          </div>
          <div class="check-item wide">
            <span class="check-label">资料完整度</span>
            <span class="check-value">${dataText[review.data_check] || review.data_check || '--'}</span>
          </div>
        </div>
        ${review.supplement_requirements ? `
          <div class="supplement-box">
            <strong>📝 补充要求：</strong>
            <p>${review.supplement_requirements}</p>
          </div>
        ` : ''}
        <div class="comment-box">
          <strong>💬 审核意见：</strong>
          <p>${review.comments || '--'}</p>
        </div>
        <div class="operator-info">
          审核人：${review.reviewer_name || 'system'}
        </div>
      </div>
    </div>
  `).join('');
}

function renderCoordinationInfo(coordination) {
  const container = $('coordinationInfo');
  if (!coordination) {
    container.innerHTML = `
      <div class="section-title">
        <span class="title-icon">🚑</span>
        <strong>协调登记</strong>
      </div>
      <div class="info-item empty-state">
        <span>暂无协调记录</span>
        <small>审核通过后可进行协调登记</small>
      </div>
    `;
    return;
  }

  const transportText = {
    ambulance: '🚑 120救护车',
    hospital_vehicle: '🏥 医院转运车',
    family: '👨‍👩‍👧 家属自行接送',
    other: '📋 其他方式'
  };
  const confirmText = {
    0: '⏳ 待确认',
    1: '✅ 已确认',
    2: '👨‍👩‍👧 需家属确认',
    3: '❌ 拒绝转诊'
  };

  container.innerHTML = `
    <div class="section-title">
      <span class="title-icon">🚑</span>
      <strong>协调登记信息</strong>
    </div>
    <div class="info-grid">
      <div class="info-item">
        <span>床位状态</span>
        <strong>${coordination.bed_available ? '✅ 床位已预留' : '❌ 床位不可用'}</strong>
      </div>
      <div class="info-item">
        <span>床位号</span>
        <strong>${coordination.bed_number || '--'}</strong>
      </div>
      <div class="info-item">
        <span>预计到达时间</span>
        <strong>${coordination.estimated_arrival_time ? formatDate(coordination.estimated_arrival_time) : '--'}</strong>
      </div>
      <div class="info-item">
        <span>协调人</span>
        <strong>${coordination.coordinator_name || '--'}</strong>
      </div>
      <div class="info-item wide">
        <span>接诊准备</span>
        <div class="detail-content">${coordination.preparation_notes || '--'}</div>
      </div>
      <div class="info-item">
        <span>联系人</span>
        <strong>${coordination.contact_person || '--'}</strong>
      </div>
      <div class="info-item">
        <span>联系电话</span>
        <strong>${coordination.contact_phone || '--'}</strong>
      </div>
    </div>
    ${coordination.appointment_time || coordination.transport_arrangement || coordination.patient_confirm !== undefined ? `
      <div class="section-subtitle">转运安排</div>
      <div class="info-grid">
        ${coordination.appointment_time ? `
        <div class="info-item">
          <span>预约时间</span>
          <strong>${formatDate(coordination.appointment_time)}</strong>
        </div>` : ''}
        <div class="info-item">
          <span>交通安排</span>
          <strong>${transportText[coordination.transport_arrangement] || coordination.transport_arrangement || '--'}</strong>
        </div>
        <div class="info-item">
          <span>患者确认</span>
          <strong>${confirmText[coordination.patient_confirm] !== undefined ? confirmText[coordination.patient_confirm] : '--'}</strong>
        </div>
      </div>
    ` : ''}
    ${coordination.transport_risk ? `
      <div class="risk-box">
        <strong>⚠️ 转运风险评估：</strong>
        <p>${coordination.transport_risk}</p>
      </div>
    ` : ''}
    ${coordination.notes ? `
      <div class="notes-box">
        <strong>📝 协调备注：</strong>
        <p>${coordination.notes}</p>
      </div>
    ` : ''}
    <div class="timestamp">
      协调登记时间：${formatDate(coordination.created_at)}
    </div>
  `;
}

function renderResultInfo(result) {
  const container = $('resultInfo');
  if (!result) {
    container.innerHTML = `
      <div class="section-title">
        <span class="title-icon">🏥</span>
        <strong>接诊结果</strong>
      </div>
      <div class="info-item empty-state">
        <span>暂无接诊结果</span>
        <small>协调完成后可回填接诊结果</small>
      </div>
    `;
    return;
  }

  const admissionText = {
    admitted: '✅ 已入院',
    observed: '👀 留观',
    discharged: '🏠 出院',
    transferred_again: '🔄 再次转诊'
  };

  container.innerHTML = `
    <div class="section-title">
      <span class="title-icon">🏥</span>
      <strong>接诊结果</strong>
    </div>
    <div class="info-grid">
      <div class="info-item">
        <span>入院状态</span>
        <strong>${admissionText[result.admission_decision] || result.admission_decision || '--'}</strong>
      </div>
      <div class="info-item">
        <span>到达时间</span>
        <strong>${result.arrival_time ? formatDate(result.arrival_time) : '--'}</strong>
      </div>
      <div class="info-item">
        <span>接诊医生</span>
        <strong>${result.received_by_name || '--'}</strong>
      </div>
      <div class="info-item">
        <span>病区/床号</span>
        <strong>${result.ward || '--'} ${result.bed_number ? `· ${result.bed_number}` : ''}</strong>
      </div>
    </div>
    ${result.patient_condition ? `
      <div class="section-subtitle">患者交接情况</div>
      <div class="content-box">
        <p>${result.patient_condition}</p>
      </div>
    ` : ''}
    ${result.diagnosis ? `
      <div class="section-subtitle">最终诊断</div>
      <div class="content-box highlight">
        <p>${result.diagnosis}</p>
      </div>
    ` : ''}
    ${result.treatment_given ? `
      <div class="section-subtitle">诊疗措施</div>
      <div class="content-box">
        <p>${result.treatment_given}</p>
      </div>
    ` : ''}
    ${result.notes ? `
      <div class="section-subtitle">备注说明</div>
      <div class="content-box">
        <p>${result.notes}</p>
      </div>
    ` : ''}
    <div class="timestamp">
      接诊记录时间：${formatDate(result.created_at)}
    </div>
  `;
}

function renderLogs(logs, transfer) {
  const container = $('logsList');
  if (!logs || logs.length === 0) {
    container.innerHTML = `
      <div class="section-title">
        <span class="title-icon">📜</span>
        <strong>业务链路追溯</strong>
      </div>
      <div class="timeline-empty">
        <div class="timeline-node">
          <div class="timeline-dot"></div>
          <div class="timeline-content">
            <div class="timeline-title">暂无操作记录</div>
            <div class="timeline-desc">该转诊申请暂无操作记录</div>
          </div>
        </div>
        <div class="timeline-footer">
          <small>创建于 ${transfer ? formatDate(transfer.created_at) : '--'}</small>
        </div>
      </div>
    `;
    return;
  }

  const actionIcons = {
    created: { icon: '📝', title: '创建申请', role: '首诊医生' },
    submitted: { icon: '📤', title: '提交申请', role: '转出医院' },
    reviewed: { icon: '🔍', title: '资料审核', role: '接诊医院' },
    accepted: { icon: '✅', title: '同意接收', role: '接诊医院' },
    rejected: { icon: '❌', title: '拒收', role: '接诊医院' },
    supplement: { icon: '📋', title: '退回补充', role: '接诊医院' },
    coordinated: { icon: '🚑', title: '协调登记', role: '协调员' },
    in_transit: { icon: '🚛', title: '转运中', role: '转运人员' },
    completed: { icon: '🏥', title: '接诊完成', role: '接诊医院' },
    cancelled: { icon: '⛔', title: '取消申请', role: '系统' }
  };

  const statusFlow = [
    { status: 'created', label: '申请创建', desc: '首诊医生填写患者信息、诊断、病历', responsible: '首诊医生' },
    { status: 'pending', label: '待审核', desc: '等待接诊医院审核资料', responsible: '转出医院' },
    { status: 'supplement', label: '需补充', desc: '资料不完整，需补充资料', responsible: '转出医院' },
    { status: 'accepted', label: '审核通过', desc: '资料审核通过，可安排协调', responsible: '接诊医院' },
    { status: 'rejected', label: '已拒收', desc: '不符合接收条件，说明原因', responsible: '接诊医院' },
    { status: 'coordinating', label: '协调中', desc: '安排床位、交通、联系人', responsible: '协调员' },
    { status: 'transiting', label: '转运中', desc: '患者转运途中', responsible: '转运人员' },
    { status: 'completed', label: '已完成', desc: '接诊完成，进入诊疗', responsible: '接诊医院' }
  ];

  container.innerHTML = `
    <div class="section-title">
      <span class="title-icon">📜</span>
      <strong>业务链路追溯</strong>
      <span class="badge-count">${logs.length} 条记录</span>
    </div>
    <div class="timeline">
  ` + logs.map((log, idx) => {
    const info = actionIcons[log.action_type || log.action] || { icon: '📌', title: log.action, role: 'system' };
    return `
      <div class="timeline-node ${idx === 0 ? 'latest' : ''}">
        <div class="timeline-dot">${info.icon}</div>
        <div class="timeline-content">
          <div class="timeline-header">
            <span class="timeline-title">${info.title}</span>
            <span class="timeline-role">责任：${log.operator ? log.operator : info.role}</span>
          </div>
          <div class="timeline-desc">${log.details || '--'}</div>
          <div class="timeline-time">${formatDate(log.created_at)}</div>
        </div>
      </div>
    `;
  }).join('') + `
    </div>
    <div class="responsibility-matrix">
      <div class="matrix-title">📋 各阶段责任主体</div>
      <div class="matrix-grid">
        <div class="matrix-item">
          <span class="matrix-role">👨‍⚕️ 首诊医生</span>
          <span class="matrix-desc">负责患者信息录入、诊断、病历填写、检查资料上传</span>
        </div>
        <div class="matrix-item">
          <span class="matrix-role">🏥 接诊医院</span>
          <span class="matrix-desc">负责科室能力、医生资质、床位、检查能力、资料完整度审核</span>
        </div>
        <div class="matrix-item">
          <span class="matrix-role">📞 协调员</span>
          <span class="matrix-desc">负责床位预约、交通安排、联系人、患者确认、转运风险评估</span>
        </div>
        <div class="matrix-item">
          <span class="matrix-role">🏨 接诊科室</span>
          <span class="matrix-desc">负责患者接诊、诊疗、结果回填、随访计划制定</span>
        </div>
      </div>
    </div>
  `;
}

function switchTab(tabName) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.hidden = content.dataset.tab !== tabName;
  });

  const transfer = state.selectedTransfer;
  if (!transfer) return;

  if (tabName === 'review') {
    $('reviewForm').hidden = transfer.status !== 'pending' && transfer.status !== 'supplement';
  } else if (tabName === 'coordination') {
    $('coordinationForm').hidden = transfer.status !== 'accepted' && transfer.status !== 'pending';
  } else if (tabName === 'result') {
    $('resultForm').hidden = transfer.status !== 'coordinating' && transfer.status !== 'transiting';
  }
}

async function openDetail(id, initialTab = 'info') {
  const data = await api(`/api/transfers/${id}`);
  state.selectedTransfer = data.transfer;
  
  $('detailTitle').textContent = `${data.transfer.patient_name} · ${data.transfer.transfer_no}`;
  $('detailSubtitle').textContent = `${data.transfer.from_hospital_name} 转入 ${data.transfer.to_hospital_name}`;
  $('detailMessage').textContent = '';

  renderDetailInfo(data.transfer, data.reviews, data.coordination, data.result, data.logs);
  
  switchTab(initialTab);
  $('detailDialog').showModal();
}

async function submitReview(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $('reviewMessage');
  const button = form.querySelector('button[type="submit"]');
  const transfer = state.selectedTransfer;

  if (!transfer) return;

  if (!form.result.value) {
    message.textContent = '请选择审核结果';
    return;
  }
  if (!form.comments.value.trim()) {
    message.textContent = '请填写审核意见';
    return;
  }

  button.disabled = true;
  message.textContent = '正在提交...';

  try {
    await api(`/api/transfers/${transfer.id}/review`, {
      method: 'POST',
      body: JSON.stringify({
        result: form.result.value,
        department_check: form.department_check.value || null,
        doctor_check: form.doctor_check.value || null,
        bed_check: form.bed_check.value || null,
        exam_check: form.exam_check.value || null,
        data_check: form.data_check.value || null,
        comments: form.comments.value.trim()
      })
    });

    await Promise.all([loadTransfers(), loadSummary()]);
    await openDetail(transfer.id, 'review');
    message.textContent = '';
    form.reset();
    showToast('审核结果已提交');
  } catch (err) {
    message.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function submitCoordination(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $('coordinationMessage');
  const button = form.querySelector('button[type="submit"]');
  const transfer = state.selectedTransfer;

  if (!transfer) return;

  if (!form.contact_person.value.trim()) {
    message.textContent = '请填写联系人';
    return;
  }
  if (!form.contact_phone.value.trim()) {
    message.textContent = '请填写联系电话';
    return;
  }

  button.disabled = true;
  message.textContent = '正在保存...';

  try {
    await api(`/api/transfers/${transfer.id}/coordinate`, {
      method: 'POST',
      body: JSON.stringify({
        appointment_time: form.appointment_time.value || null,
        transport_arrangement: form.transport_arrangement.value || null,
        contact_person: form.contact_person.value.trim(),
        contact_phone: form.contact_phone.value.trim(),
        patient_confirm: Number(form.patient_confirm.value) || 0,
        transport_risk: form.transport_risk.value.trim() || null,
        notes: form.notes.value.trim() || null
      })
    });

    await Promise.all([loadTransfers(), loadSummary()]);
    await openDetail(transfer.id, 'coordination');
    message.textContent = '';
    form.reset();
    showToast('协调信息已保存');
  } catch (err) {
    message.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function submitResult(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = $('resultMessage');
  const button = form.querySelector('button[type="submit"]');
  const transfer = state.selectedTransfer;

  if (!transfer) return;

  if (!form.admission_status.value) {
    message.textContent = '请选择入院状态';
    return;
  }

  button.disabled = true;
  message.textContent = '正在保存...';

  try {
    await api(`/api/transfers/${transfer.id}/result`, {
      method: 'POST',
      body: JSON.stringify({
        admission_status: form.admission_status.value,
        admission_time: form.admission_time.value || new Date().toISOString().slice(0, 16),
        ward: form.ward.value.trim() || null,
        bed_no: form.bed_no.value.trim() || null,
        diagnosis_conclusion: form.diagnosis_conclusion.value.trim() || null,
        treatment_plan: form.treatment_plan.value.trim() || null,
        transfer_back_suggestion: form.transfer_back_suggestion.value.trim() || null,
        follow_up_plan: form.follow_up_plan.value.trim() || null
      })
    });

    await Promise.all([loadTransfers(), loadSummary()]);
    await openDetail(transfer.id, 'result');
    message.textContent = '';
    form.reset();
    showToast('接诊结果已保存，转诊完成');
  } catch (err) {
    message.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    button.disabled = false;
  }
}

async function loadReports() {
  const period = $('reportPeriod').value;
  const data = await api(`/api/reports?days=${period}`);
  state.reports = data;

  $('reportSummary').textContent = `近${period}天运营数据分析与区域协作效果`;

  renderSuccessRateChart(data.successRate || []);
  renderWaitTimeChart(data.waitTime || []);
  renderRejectReasonsChart(data.rejectReasons || []);
  renderDepartmentLoadChart(data.departmentLoad || []);
  renderCollaborationChart(data.hospitalCollaboration || []);
  renderUrgencyChart(data.urgencyDistribution || []);
}

function renderBarChart(containerId, data, colorClass = '') {
  const container = $(containerId);
  if (!data || data.length === 0) {
    container.innerHTML = '<div style="color: var(--muted); padding: 20px; text-align: center;">暂无数据</div>';
    return;
  }

  const maxValue = Math.max(...data.map(d => d.value || d.count || 0), 1);

  container.innerHTML = data.map((item, idx) => {
    const value = item.value || item.count || 0;
    const label = item.month || item.label || item.department || item.reason || item.name || `项目${idx + 1}`;
    const percent = Math.round((value / maxValue) * 100);
    const displayValue = value + (item.percent ? ` (${item.percent}%)` : '');

    return `
      <div class="chart-bar">
        <div class="chart-bar-label">${label}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill ${colorClass}" style="width: ${percent}%">${value}</div>
        </div>
        <div class="chart-bar-value">${displayValue}</div>
      </div>
    `;
  }).join('');
}

function renderSuccessRateChart(data) {
  const container = $('successRateChart');
  if (!data || data.length === 0) {
    container.innerHTML = '<div style="color: var(--muted); padding: 20px; text-align: center;">暂无数据</div>';
    return;
  }

  const maxValue = 100;
  container.innerHTML = data.map((item) => `
    <div class="chart-bar">
      <div class="chart-bar-label">${item.month}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill green" style="width: ${item.rate}%">${item.rate}%</div>
      </div>
      <div class="chart-bar-value">${item.count}次</div>
    </div>
  `).join('');
}

function renderWaitTimeChart(data) {
  renderBarChart('waitTimeChart', data.map(d => ({
    month: d.month,
    value: d.hours,
    count: d.hours
  })), 'amber');
}

function renderRejectReasonsChart(data) {
  const container = $('rejectReasonsChart');
  if (!data || data.length === 0) {
    container.innerHTML = '<div style="color: var(--muted); padding: 20px; text-align: center;">暂无数据</div>';
    return;
  }

  const total = data.reduce((sum, d) => sum + (d.count || 0), 0) || 1;
  
  container.innerHTML = '<div class="chart-pie">' + data.map((item) => `
    <div class="chart-pie-item">
      <div class="count">${item.count}</div>
      <div class="label">${item.reason}</div>
      <div class="percent">${Math.round((item.count / total) * 100)}%</div>
    </div>
  `).join('') + '</div>';
}

function renderDepartmentLoadChart(data) {
  renderBarChart('departmentLoadChart', data.map(d => ({
    department: d.department,
    value: d.count,
    count: d.count
  })), 'teal');
}

function renderCollaborationChart(data) {
  const container = $('collaborationChart');
  if (!data || data.length === 0) {
    container.innerHTML = '<div style="color: var(--muted); padding: 20px; text-align: center;">暂无数据</div>';
    return;
  }

  const maxValue = Math.max(...data.map(d => d.count || 0), 1);

  container.innerHTML = data.map((item) => `
    <div class="chart-bar">
      <div class="chart-bar-label" style="width: 200px;">${item.from} → ${item.to}</div>
      <div class="chart-bar-track">
        <div class="chart-bar-fill" style="width: ${Math.round((item.count / maxValue) * 100)}%">${item.count}</div>
      </div>
      <div class="chart-bar-value">${item.count}次</div>
    </div>
  `).join('');
}

function renderUrgencyChart(data) {
  const container = $('urgencyChart');
  if (!data || data.length === 0) {
    container.innerHTML = '<div style="color: var(--muted); padding: 20px; text-align: center;">暂无数据</div>';
    return;
  }

  const total = data.reduce((sum, d) => sum + (d.count || 0), 0) || 1;
  
  container.innerHTML = '<div class="chart-pie">' + data.map((item) => `
    <div class="chart-pie-item">
      <div class="count">${item.count}</div>
      <div class="label">${urgencyText[item.urgency] || item.urgency}</div>
      <div class="percent">${Math.round((item.count / total) * 100)}%</div>
    </div>
  `).join('') + '</div>';
}

async function exportReport() {
  try {
    const csv = await api('/api/reports/export');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `转诊报表_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    showToast('报表已导出');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function bindEvents() {
  document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchView(link.dataset.view);
    });
  });

  $('refreshBtn').addEventListener('click', () => {
    loadTransfers().catch((err) => showToast(err.message, 'error'));
  });

  $('refreshHospitals').addEventListener('click', () => {
    state.doctorsByHospital.clear();
    loadHospitals().catch((err) => showToast(err.message, 'error'));
  });

  $('statusFilter').addEventListener('change', () => loadTransfers().catch((err) => showToast(err.message, 'error')));
  $('urgencyFilter').addEventListener('change', () => loadTransfers().catch((err) => showToast(err.message, 'error')));
  $('keywordFilter').addEventListener('input', () => {
    window.clearTimeout(bindEvents.keywordTimer);
    bindEvents.keywordTimer = window.setTimeout(() => {
      loadTransfers().catch((err) => showToast(err.message, 'error'));
    }, 300);
  });

  $('transferRows').addEventListener('click', (event) => {
    const actionBtn = event.target.closest('button[data-action]');
    const row = event.target.closest('tr[data-id]');
    
    if (actionBtn) {
      const id = actionBtn.dataset.id;
      const action = actionBtn.dataset.action;
      const tabMap = { review: 'review', coordinate: 'coordination', complete: 'result', view: 'info' };
      openDetail(id, tabMap[action] || 'info').catch((err) => showToast(err.message, 'error'));
    } else if (row) {
      openDetail(row.dataset.id).catch((err) => showToast(err.message, 'error'));
    }
  });

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  $('fromHospitalSelect').addEventListener('change', () => {
    populateDoctorSelect('fromHospitalSelect', 'fromDoctorSelect').catch((err) => showToast(err.message, 'error'));
  });
  $('toHospitalSelect').addEventListener('change', () => {
    populateDoctorSelect('toHospitalSelect', 'toDoctorSelect').catch((err) => showToast(err.message, 'error'));
  });

  $('createForm').addEventListener('submit', submitTransfer);
  
  $('createForm').addEventListener('input', (e) => {
    if (e.target.name && $(`error-${e.target.name}`)) {
      $(`error-${e.target.name}`).textContent = '';
      e.target.classList.remove('input-error');
      $('formMessage').textContent = '';
    }
  });

  $('closeDetail').addEventListener('click', () => $('detailDialog').close());
  $('reviewForm').addEventListener('submit', submitReview);
  $('coordinationForm').addEventListener('submit', submitCoordination);
  $('resultForm').addEventListener('submit', submitResult);

  $('reportPeriod').addEventListener('change', () => loadReports().catch(err => showToast(err.message, 'error')));
  $('refreshReportBtn').addEventListener('click', () => loadReports().catch(err => showToast(err.message, 'error')));
  $('exportReportBtn').addEventListener('click', exportReport);

  $('viewDetailBtn').addEventListener('click', () => {
    if (state.lastCreatedTransfer) {
      openDetail(state.lastCreatedTransfer.id).catch(err => showToast(err.message, 'error'));
    }
  });
  $('goToListBtn').addEventListener('click', () => {
    switchView('transfers');
    $('successBanner').hidden = true;
  });
  $('continueCreateBtn').addEventListener('click', () => {
    $('successBanner').hidden = true;
    $('createForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

async function boot() {
  bindEvents();
  try {
    await loadHealth();
    await Promise.all([
      loadSummary(),
      loadTransfers(),
      loadHospitals(),
      loadPatients()
    ]);
    await Promise.all([
      populateDoctorSelect('fromHospitalSelect', 'fromDoctorSelect'),
      populateDoctorSelect('toHospitalSelect', 'toDoctorSelect')
    ]);
  } catch (err) {
    showToast(err.message, 'error');
    $('transferRows').innerHTML = `<tr><td colspan="9">${err.message}</td></tr>`;
  }
}

boot();
