const API_BASE = (window.APP_CONFIG && window.APP_CONFIG.backendUrl) || 'http://127.0.0.1:53471';
const $ = (id) => document.getElementById(id);
const currentUserId = 1;

const pageTitles = {
  overview: { title: '婚礼筹备总览', subtitle: '统一管理档期、预算、供应商和任务' },
  requirements: { title: '新人需求管理', subtitle: '记录婚期、预算、风格和服务清单' },
  suppliers: { title: '供应商档案', subtitle: '服务类型、案例、档期、价格和信用管理' },
  matchmaking: { title: '撮合管理', subtitle: '邀请报价、比价、沟通、方案确认' },
  contracts: { title: '合同与支付', subtitle: '合同签署、定金支付、归档管理' },
  fulfillment: { title: '履约任务', subtitle: '准备、物料、到场、变更、验收全流程' },
  aftersales: { title: '售后与评价', subtitle: '投诉、退款、评价及信用沉淀' },
  tasks: { title: '基础任务管理', subtitle: '日常任务跟进' },
  guests: { title: '宾客管理', subtitle: '宾客名单与RSVP' },
  admin: { title: '运营后台', subtitle: '全局数据与用户管理' }
};

const serviceTypeMap = {
  planner: '策划师', photographer: '摄影', venue: '场地', florist: '花艺',
  host: '司仪', band: '乐队', dessert: '甜品'
};

const statusColors = {
  draft: '#6b7280', published: '#2563eb', matched: '#7c3aed', fulfilled: '#059669', closed: '#64748b',
  active: '#059669', inactive: '#6b7280', suspended: '#dc2626',
  pending: '#f59e0b', accepted: '#059669', rejected: '#dc2626', expired: '#6b7280',
  submitted: '#2563eb', selected: '#059669', negotiating: '#f59e0b',
  'signed': '#059669', 'pending_signature': '#f59e0b', archived: '#6b7280',
  paid: '#059669', failed: '#dc2626', refunded: '#7c3aed',
  in_progress: '#2563eb', completed: '#059669', delayed: '#dc2626', cancelled: '#6b7280',
  open: '#dc2626', investigating: '#f59e0b', resolved: '#059669'
};

const statusLabels = {
  draft: '草稿', published: '已发布', matched: '已匹配', fulfilled: '履约中', closed: '已关闭',
  active: '活跃', inactive: '停用', suspended: '已暂停',
  pending: '待处理', accepted: '已接受', rejected: '已拒绝', expired: '已过期',
  submitted: '待比价', selected: '已选中', negotiating: '议价中', rejected: '已拒绝',
  signed: '已签署', pending_signature: '待签署', archived: '已归档',
  paid: '已支付', failed: '支付失败', refunded: '已退款',
  in_progress: '进行中', completed: '已完成', delayed: '已延迟', cancelled: '已取消',
  open: '待处理', investigating: '处理中', resolved: '已解决'
};

const requirementStatusLabels = {
  draft: '草稿', published: '已发布', matched: '已匹配', fulfilled: '履约中', closed: '已完成'
};

const invitationStatusLabels = {
  pending: '待供应商响应', accepted: '供应商已接受', rejected: '供应商已拒绝', expired: '邀请已过期'
};

const quoteStatusLabels = {
  submitted: '待比价', selected: '已选中', negotiating: '议价中', rejected: '未选中'
};

const categoryMap = {
  preparation: '婚礼前准备', materials: '物料', arrival: '到场', change: '变更', acceptance: '验收'
};

const partyMap = {
  couple: '新人', supplier: '供应商', planner: '策划师', admin: '运营'
};

const aftersaleTypeMap = {
  complaint: '投诉', delay: '延期', refund: '退款', service_mismatch: '服务不符'
};

async function api(path, options = {}) {
  const fullUrl = `${API_BASE}${path}`;
  try {
    const res = await fetch(fullUrl, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const payload = await res.json();
    if (!res.ok || payload.success === false) throw new Error(payload.message || '接口请求失败');
    return payload.data;
  } catch (err) {
    let msg = err.message;
    if (msg === 'Failed to fetch') {
      msg = `无法连接后端服务 (${API_BASE})，请检查服务是否启动或联系管理员`;
    } else if (msg.includes('NetworkError')) {
      msg = '网络连接失败，请检查网络设置';
    } else if (msg.includes('CORS')) {
      msg = '跨域访问被拒绝，请确认访问地址正确';
    }
    showToast(msg, 'error');
    console.error(`API Error [${options.method || 'GET'}] ${fullUrl}:`, err);
    throw err;
  }
}

function showToast(message, type = 'success') {
  const toast = $('toast');
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  setTimeout(() => toast.className = 'toast', 3000);
}

function showView(view) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('#nav a').forEach(a => a.classList.remove('active'));
  $(`view-${view}`).classList.add('active');
  const navLink = document.querySelector(`#nav a[data-view="${view}"]`);
  if (navLink) navLink.classList.add('active');
  if (pageTitles[view]) {
    $('pageTitle').textContent = pageTitles[view].title;
    $('pageSubtitle').textContent = pageTitles[view].subtitle;
  }
  loadViewData(view);
  if (view === 'matchmaking') switchMatchTab('invitations');
  if (view === 'contracts') switchContractTab('contracts');
  if (view === 'aftersales') switchAfterTab('aftersales');
}

function loadViewData(view) {
  switch (view) {
    case 'overview': loadOverview(); break;
    case 'requirements': loadRequirements(); break;
    case 'suppliers': loadSuppliers(); break;
    case 'invitations': loadInvitations(); break;
    case 'quotes': loadQuotes(); break;
    case 'contracts': loadContracts(); break;
    case 'payments': loadPayments(); break;
    case 'fulfillment': loadFulfillment(); break;
    case 'aftersales': loadAftersales(); break;
    case 'reviews': loadReviews(); break;
    case 'credit': loadCreditRecords(); break;
    case 'tasks': loadTasks(); break;
    case 'guests': loadGuests(); break;
    case 'admin': loadAdminStats(); break;
  }
}

function switchTab(container, tab) {
  document.querySelectorAll(`#${container} .tab`).forEach(t => t.classList.remove('active'));
  document.querySelectorAll(`#${container} .tab-content`).forEach(c => c.classList.remove('active'));
  document.querySelector(`#${container} .tab[data-tab="${tab}"]`).classList.add('active');
  $(`tab-${tab}`).classList.add('active');
  loadViewData(tab);
}

function switchMatchTab(tab) { switchTab('view-matchmaking', tab); }
function switchContractTab(tab) { switchTab('view-contracts', tab); }
function switchAfterTab(tab) { switchTab('view-aftersales', tab); }

function openModal(formId, title) {
  document.querySelectorAll('.modal-form, .modal-detail').forEach(f => f.classList.add('hidden'));
  $(formId).classList.remove('hidden');
  const titles = {
    requirementForm: '发布新人需求', supplierForm: '添加供应商', invitationForm: '发送报价邀请',
    quoteForm: '提交报价', contractForm: '创建合同', paymentForm: '记录支付',
    fulfillmentForm: '创建履约任务', aftersaleForm: '提交售后工单', reviewForm: '提交评价',
    userForm: '添加用户', requirementDetail: '需求详情', supplierDetail: '供应商详情'
  };
  $('modalTitle').textContent = title || titles[formId] || '详情';
  $('modal').classList.add('show');
  populateSelects(formId);
}

function closeModal() { $('modal').classList.remove('show'); }

async function populateSelects(formId) {
  try {
    const [reqs, sups, users, contracts, invites] = await Promise.all([
      api('/api/requirements?pageSize=100').catch(() => ({ data: [] })),
      api('/api/suppliers?pageSize=100').catch(() => ({ data: [] })),
      api('/api/users').catch(() => []),
      api('/api/contracts').catch(() => []),
      api('/api/invitations?pageSize=100').catch(() => ({ data: [] }))
    ]);

    const reqData = reqs.data || reqs;
    const supData = sups.data || sups;
    const invData = invites.data || invites;

    const fillSelect = (id, list, valKey, textKey, placeholder) => {
      const sel = $(id);
      if (!sel) return;
      sel.innerHTML = `<option value="">${placeholder || '请选择'}</option>` +
        list.map(i => `<option value="${i[valKey]}">${i[textKey] || i.title || i.name}</option>`).join('');
    };

    if (formId === 'invitationForm') {
      fillSelect('inv-req', reqData, 'id', 'couple_name');
      fillSelect('inv-sup', supData, 'id', 'company_name');
    }
    if (formId === 'quoteForm') {
      fillSelect('qt-inv', invData.filter(i => i.status !== 'rejected'), 'id',
        i => `${i.company_name} - ${i.wedding_date}`);
    }
    if (formId === 'contractForm') {
      fillSelect('ctr-req', reqData, 'id', 'couple_name');
      fillSelect('ctr-sup', supData, 'id', 'company_name');
    }
    if (formId === 'paymentForm') {
      fillSelect('pay-ctr', contracts, 'id', i => `${i.company_name || ''} - ${i.total_price || 0}元`);
    }
    if (formId === 'fulfillmentForm') {
      fillSelect('ft-req', reqData, 'id', 'couple_name');
      fillSelect('ft-ctr', contracts, 'id', i => `${i.company_name || '合同'}`);
    }
    if (formId === 'aftersaleForm') {
      fillSelect('as-req', reqData, 'id', 'couple_name');
      fillSelect('as-sup', supData, 'id', 'company_name');
      fillSelect('as-ctr', contracts, 'id', i => `${i.company_name || '合同'}`);
    }
    if (formId === 'reviewForm') {
      fillSelect('rv-sup', supData, 'id', 'company_name');
      fillSelect('rv-req', reqData, 'id', 'couple_name');
    }
  } catch (e) { /* ignore */ }
}

async function loadHealth() {
  try {
    const data = await api('/api/health');
    const isHealthy = data.status === 'healthy';
    $('serviceStatus').textContent = isHealthy ? '● 后端正常' : '● 后端可用';
    $('serviceStatus').title = `后端服务: ${API_BASE}\n状态: ${data.status}\n数据量: ${data.bookings || 0} 条`;
    $('serviceStatus').className = isHealthy ? 'status ok' : 'status warn';
  } catch (err) {
    $('serviceStatus').textContent = '● 后端异常';
    $('serviceStatus').title = `后端服务: ${API_BASE}\n无法连接，请检查服务是否启动`;
    $('serviceStatus').className = 'status bad';
  }
}

function refreshCurrentView() {
  const hash = location.hash.slice(1) || 'overview';
  showToast('正在刷新数据...', 'success');
  loadViewData(hash);
  loadHealth();
}

function openQuickModal(formId, targetView) {
  showView(targetView);
  setTimeout(() => {
    openModal(formId);
  }, 100);
}

function filterRequirementsByStatus(status) {
  const filter = $('req-filter-status');
  if (filter) {
    filter.value = status;
    loadRequirements();
  }
}

function filterFulfillmentByStatus(status) {
  const filter = $('ft-filter-status');
  if (filter) {
    filter.value = status;
    loadFulfillment();
  }
}

function navigateWorkflow(stageNum) {
  switch (stageNum) {
    case 1:
      showView('requirements');
      break;
    case 2:
      showView('matchmaking');
      switchMatchTab('invitations');
      break;
    case 3:
      showView('matchmaking');
      switchMatchTab('quotes');
      break;
    case 4:
      showView('contracts');
      break;
    case 5:
      showView('fulfillment');
      break;
    case 6:
      showView('aftersales');
      switchAfterTab('reviews');
      break;
  }
}

async function loadOverview() {
  try {
    const results = await Promise.allSettled([
      api('/api/overview'),
      api('/api/bookings'),
      api('/api/vendors'),
      api('/api/fulfillment-tasks'),
      api('/api/quotes'),
      api('/api/requirements'),
      api('/api/invitations'),
      api('/api/contracts'),
      api('/api/payments')
    ]);

    const ov = results[0].status === 'fulfilled' ? results[0].value : {};
    const bookings = results[1].status === 'fulfilled' ? results[1].value : [];
    const vendors = results[2].status === 'fulfilled' ? results[2].value : [];
    const ftasks = results[3].status === 'fulfilled' ? results[3].value : [];
    const quotes = results[4].status === 'fulfilled' ? results[4].value : [];
    const requirements = results[5].status === 'fulfilled' ? results[5].value : [];
    const invitations = results[6].status === 'fulfilled' ? results[6].value : [];
    const contracts = results[7].status === 'fulfilled' ? results[7].value : [];
    const payments = results[8].status === 'fulfilled' ? results[8].value : [];

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    if (successCount < results.length) {
      showToast(`部分数据加载失败 (${successCount}/${results.length})，点击刷新重试`, 'error');
    }

    $('ov-couple').textContent = ov.booking?.couple || '--';
    $('ov-vendorTotal').textContent = `¥${(ov.vendorTotal || 0).toLocaleString('zh-CN')}`;
    $('ov-openTasks').textContent = ov.openTasks ?? '--';
    $('ov-confirmedGuests').textContent = ov.confirmedGuests ?? '--';
    $('ov-requirements').textContent = ov.requirementCount ?? '--';
    $('ov-suppliers').textContent = ov.activeSuppliers ?? '--';
    $('ov-invitations').textContent = ov.pendingInvitations ?? '--';
    $('ov-fulfillment').textContent = ov.pendingFulfillment ?? '--';

    // Render workflow pipeline
    const reqByStatus = {};
    requirements.forEach(r => { reqByStatus[r.status] = (reqByStatus[r.status] || 0) + 1; });
    const invByStatus = {};
    invitations.forEach(i => { invByStatus[i.status] = (invByStatus[i.status] || 0) + 1; });
    const qtByStatus = {};
    quotes.forEach(q => { qtByStatus[q.status] = (qtByStatus[q.status] || 0) + 1; });
    const ctByStatus = {};
    contracts.forEach(c => { ctByStatus[c.status] = (ctByStatus[c.status] || 0) + 1; });
    const payByStatus = {};
    payments.forEach(p => { payByStatus[p.status] = (payByStatus[p.status] || 0) + 1; });
    const ftByStatus = {};
    ftasks.forEach(t => { ftByStatus[t.status] = (ftByStatus[t.status] || 0) + 1; });

    const workflowStages = [
      { num: 1, label: '发布需求', count: (reqByStatus.published || 0) + (reqByStatus.matched || 0), done: true, active: false, color: '#8b5cf6' },
      { num: 2, label: '邀请报价', count: invByStatus.pending || 0, done: (invByStatus.accepted || 0) > 0, active: (invByStatus.pending || 0) > 0, color: '#f59e0b' },
      { num: 3, label: '比价确认', count: qtByStatus.submitted || 0, done: (qtByStatus.selected || 0) > 0, active: (qtByStatus.submitted || 0) > 0, color: '#3b82f6' },
      { num: 4, label: '合同定金', count: ctByStatus.signed || 0, done: (ctByStatus.signed || 0) > 0, active: (ctByStatus.pending_signature || 0) > 0 || (payByStatus.pending || 0) > 0, color: '#10b981' },
      { num: 5, label: '履约验收', count: (ftByStatus.in_progress || 0) + (ftByStatus.pending || 0), done: (ftByStatus.completed || 0) > 0, active: (ftByStatus.in_progress || 0) > 0, color: '#ec4899' },
      { num: 6, label: '评价沉淀', count: ov.total_reviews || 0, done: (ov.total_reviews || 0) > 0, active: false, color: '#ef4444' }
    ];

    $('workflow-pipeline').innerHTML = workflowStages.map(s => `
      <div class="workflow-stage ${s.done ? 'done' : ''} ${s.active ? 'active' : ''}" style="cursor:pointer" onclick="navigateWorkflow(${s.num})">
        <div class="workflow-stage-num" style="${s.done || s.active ? '' : `background:#e5e7eb;color:#6b7280`}">${s.num}</div>
        <span class="workflow-stage-label">${s.label}</span>
        <span class="workflow-stage-count" style="color:${s.color}">${s.count}</span>
      </div>
    `).join('');

    if (bookings.length > 0) {
      $('ov-bookings').innerHTML = bookings.map(b => `
        <article class="booking">
          <strong>${b.couple}</strong>
          <span>${b.wedding_date}</span>
          <p>${b.venue} · ${b.planner}</p>
          <div><b style="background:#fef3c7;color:#92400e">${b.status}</b>
            <em>¥${(b.budget || 0).toLocaleString('zh-CN')}</em>
            <em>${b.guest_count || 0}人</em>
          </div>
        </article>
      `).join('');
    } else {
      $('ov-bookings').innerHTML = '<div class="empty">暂无婚礼记录，点击"发布需求"开始</div>';
    }

    if (vendors.length > 0) {
      $('ov-vendors').innerHTML = vendors.slice(0, 5).map(v => `
        <div class="row"><strong>${v.category}</strong><span>${v.name}</span><b style="background:${v.status === '已签约' ? '#dcfce7' : '#fef3c7'};color:${v.status === '已签约' ? '#166534' : '#92400e'}">${v.status}</b></div>
      `).join('');
    } else {
      $('ov-vendors').innerHTML = '<div class="empty">暂无供应商，点击"添加供应商"开始</div>';
    }

    const fulfillmentStatusLabels = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      delayed: '已延迟',
      cancelled: '已取消'
    };

    if (ftasks.length > 0) {
      $('ov-ftasks').innerHTML = ftasks.slice(0, 5).map(t => `
        <div class="row ftask-row">
          <div style="flex:1">
            <strong>${t.title}</strong>
            <div class="ftask-meta">
              <span class="tag-sm" style="background:${getCategoryColor(t.category)};color:#1f2937">${categoryMap[t.category] || t.category}</span>
              <span class="muted">责任方: ${partyMap[t.responsible_party] || t.responsible_party}</span>
              <span class="muted">截止: ${t.due_date || '未设置'}</span>
              ${t.notes ? `<span class="muted">备注: ${t.notes}</span>` : ''}
            </div>
          </div>
          <span class="badge" style="background:${statusColors[t.status] || '#f59e0b'}">${fulfillmentStatusLabels[t.status] || t.status}</span>
        </div>
      `).join('');
    } else {
      $('ov-ftasks').innerHTML = '<div class="empty">暂无任务，点击"创建履约任务"开始</div>';
    }

    const submittedQuotes = quotes.filter(q => q.status === 'submitted');
    if (submittedQuotes.length > 0) {
      $('ov-quotes').innerHTML = submittedQuotes.slice(0, 5).map(q => `
        <div class="row"><strong>${q.company_name || '供应商' + q.supplier_id}</strong><span>¥${(q.total_price || 0).toLocaleString('zh-CN')}</span>
          <button class="btn-sm" onclick="selectQuote(${q.id})">选中</button></div>
      `).join('');
    } else {
      $('ov-quotes').innerHTML = '<div class="empty">暂无待确认报价</div>';
    }
  } catch (e) {
    console.error('loadOverview error:', e);
  }
}

async function loadRequirements() {
  try {
    const status = $('req-filter-status')?.value || '';
    const url = `/api/requirements?pageSize=50${status ? `&status=${status}` : ''}`;
    const result = await api(url);
    const list = result.data || result;
    if (list.length > 0) {
      $('requirements-list').innerHTML = list.map(r => `
        <article class="card">
          <div class="card-head">
            <h3>${r.couple_name || '新人'}</h3>
            <span class="badge" style="background:${statusColors[r.status]}">${requirementStatusLabels[r.status] || r.status}</span>
          </div>
          <div class="card-body">
            <div class="info"><span>婚期</span><b>${r.wedding_date}</b></div>
            <div class="info"><span>城市</span><b>${r.city}</b></div>
            <div class="info"><span>预算</span><b>¥${(r.budget || 0).toLocaleString('zh-CN')}</b></div>
            <div class="info"><span>人数</span><b>${r.guest_count || 0}人</b></div>
            <div class="info"><span>风格</span><b>${r.style || '-'}</b></div>
            <div class="info"><span>优先级</span><b>${r.priority || '-'}</b></div>
            <div class="info full"><span>服务</span><b>${r.service_list || '-'}</b></div>
          </div>
          <div class="card-foot">
            <button class="btn-link" onclick="viewRequirement(${r.id})">查看详情</button>
            <button class="btn-sm" onclick="openModal('invitationForm');setTimeout(()=>document.querySelector('#inv-req').value=${r.id},100)">邀请报价</button>
          </div>
        </article>
      `).join('');
    } else {
      $('requirements-list').innerHTML = '<div class="empty">暂无新人需求，点击"发布需求"开始</div>';
    }
  } catch (e) {
    console.error('loadRequirements error:', e);
  }
}

let currentRequirementId = null;

async function viewRequirement(id) {
  try {
    currentRequirementId = id;
    const r = await api(`/api/requirements/${id}`);
    $('rd-title').textContent = `${r.couple_name} - ${r.wedding_date}`;
    $('rd-status').textContent = requirementStatusLabels[r.status] || r.status;
    $('rd-status').style.background = statusColors[r.status];
    $('rd-date').textContent = r.wedding_date;
    $('rd-city').textContent = r.city;
    $('rd-budget').textContent = `¥${(r.budget || 0).toLocaleString('zh-CN')}`;
    $('rd-guests').textContent = `${r.guest_count || 0}人`;
    $('rd-style').textContent = r.style || '-';
    $('rd-priority').textContent = r.priority || '-';
    $('rd-services').textContent = r.service_list || '-';
    $('rd-desc').textContent = r.description || '-';

    $('rd-edit-id').value = r.id;
    const editForm = $('rd-edit-form');
    editForm.querySelector('[name="wedding_date"]').value = r.wedding_date;
    editForm.querySelector('[name="city"]').value = r.city;
    editForm.querySelector('[name="budget"]').value = r.budget;
    editForm.querySelector('[name="guest_count"]').value = r.guest_count;
    editForm.querySelector('[name="style"]').value = r.style;
    editForm.querySelector('[name="priority"]').value = r.priority;
    editForm.querySelector('[name="service_list"]').value = r.service_list;
    editForm.querySelector('[name="description"]').value = r.description || '';

    updateMatchmakingProgress(r);
    updateNextAction(r);

    const fulfillmentStatusLabels = {
      pending: '待处理',
      in_progress: '进行中',
      completed: '已完成',
      delayed: '已延迟',
      cancelled: '已取消'
    };

    const contractStatusLabels = {
      draft: '草稿',
      pending_signature: '待签署',
      signed: '已签署',
      archived: '已归档'
    };

    $('rd-quotes').innerHTML = (r.quotes || []).map(q => `
      <div class="row"><strong>${q.company_name || '供应商' + q.supplier_id}</strong><span>¥${(q.total_price || 0).toLocaleString('zh-CN')}</span>
        <b style="background:${statusColors[q.status] || '#f59e0b'}">${quoteStatusLabels[q.status] || q.status}</b>
        ${q.status !== 'selected' && q.status !== 'rejected' ? `<button class="btn-sm" onclick="selectQuote(${q.id});viewRequirement(${id});">选中</button>` : ''}
      </div>
    `).join('') || '<p class="empty">暂无报价，点击"发送报价邀请"开始</p>';

    $('rd-contracts').innerHTML = (r.contracts || []).map(c => {
      const payments = (r.payments || []).filter(p => p.contract_id === c.id);
      const paidAmount = payments.filter(p => p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0);
      return `
        <div class="row">
          <div style="flex:1">
            <strong>${c.company_name || '合同'}</strong>
            <div style="font-size:12px;color:#6b7280;margin-top:4px">
              金额: ¥${(c.total_amount || c.total_price || 0).toLocaleString('zh-CN')}
              ${c.signed_date ? ` · 签署: ${c.signed_date.slice(0, 10)}` : ''}
              ${paidAmount > 0 ? ` · 已付: ¥${paidAmount.toLocaleString('zh-CN')}` : ''}
            </div>
          </div>
          <b style="background:${statusColors[c.status] || '#6b7280'}">${contractStatusLabels[c.status] || c.status}</b>
          ${c.status === 'signed' ? `<button class="btn-sm" onclick="archiveContract(${c.id});viewRequirement(${id});">📁 归档</button>` : ''}
          ${c.status === 'pending_signature' ? `<button class="btn-sm" onclick="signContract(${c.id}, 'couple');viewRequirement(${id});">✍️ 签署</button>` : ''}
        </div>
      `;
    }).join('') || '<p class="empty">暂无合同，选中报价后创建合同</p>';

    $('rd-tasks').innerHTML = (r.tasks || []).map(t => `
      <div class="row"><strong>${t.title}</strong><span>${categoryMap[t.category]} · ${t.due_date || '-'}</span>
        <b style="background:${statusColors[t.status] || '#f59e0b'}">${fulfillmentStatusLabels[t.status] || t.status}</b>
        ${t.status !== 'completed' && t.status !== 'delayed' && t.status !== 'cancelled' ? `<button class="btn-sm" onclick="updateFulfillmentStatus(${t.id}, 'completed');viewRequirement(${id});">✓ 完成</button>` : ''}
      </div>
    `).join('') || '<p class="empty">暂无履约任务，签署合同后自动创建</p>';

    $('rd-comms').innerHTML = (r.communications || []).map(c => `
      <div class="chat-item ${c.sender_type === 'couple' ? 'right' : 'left'}">
        <div class="chat-name">${c.sender_name || (c.sender_type === 'couple' ? '新人' : '供应商')}</div>
        <div class="chat-bubble">${c.message}</div>
      </div>
    `).join('') || '<p class="empty">暂无沟通</p>';

    $('rd-view-mode').classList.remove('hidden');
    $('rd-edit-form').classList.add('hidden');
    $('rd-edit-btn').textContent = '✎ 编辑';

    openModal('requirementDetail', '需求详情');
  } catch (e) { /* already toaster */ }
}

function updateMatchmakingProgress(r) {
  const steps = [
    { id: 'step-invite', check: () => (r.invitations || []).length > 0 },
    { id: 'step-quote', check: () => (r.quotes || []).some(q => q.status === 'selected') },
    { id: 'step-contract', check: () => (r.contracts || []).some(c => c.status === 'signed') },
    { id: 'step-fulfill', check: () => (r.tasks || []).some(t => t.status === 'completed') },
    { id: 'step-review', check: () => (r.reviews || []).length > 0 }
  ];

  document.querySelectorAll('.process-step').forEach(s => s.classList.remove('active', 'done'));
  document.querySelector('.process-step:first-child').classList.add('done');

  let activeFound = false;
  steps.forEach(step => {
    const el = $(step.id);
    if (!el) return;
    if (step.check()) {
      el.classList.add('done');
    } else if (!activeFound) {
      el.classList.add('active');
      activeFound = true;
    }
  });
}

function updateNextAction(r) {
  const nextAction = $('rd-next-action');
  const invitations = r.invitations || [];
  const quotes = r.quotes || [];
  const contracts = r.contracts || [];
  const tasks = r.tasks || [];

  let action = { title: '', desc: '', button: '', onclick: '' };

  if (invitations.length === 0) {
    action = {
      title: '下一步：邀请供应商报价',
      desc: '根据需求中的服务清单，向合适的供应商发送报价邀请',
      button: '发送报价邀请',
      onclick: `closeModal();setTimeout(()=>{showView('matchmaking');switchMatchTab('invitations');openModal('invitationForm');setTimeout(()=>document.querySelector('#inv-req').value=${r.id},100)},200)`
    };
  } else if (!quotes.some(q => q.status === 'selected')) {
    const pendingQuotes = quotes.filter(q => q.status === 'submitted');
    action = {
      title: '下一步：比价并确认供应商',
      desc: `已收到 ${pendingQuotes.length} 份报价，点击"比价列表"进行对比后选择供应商`,
      button: '查看比价',
      onclick: `closeModal();setTimeout(()=>{showView('matchmaking');switchMatchTab('quotes')},200)`
    };
  } else if (!contracts.some(c => c.status === 'signed')) {
    const selectedQuote = quotes.find(q => q.status === 'selected');
    action = {
      title: '下一步：创建合同并支付定金',
      desc: `已选中供应商${selectedQuote ? '，报价 ¥' + (selectedQuote.total_price || 0).toLocaleString('zh-CN') : ''}，请创建合同并安排定金支付`,
      button: '创建合同',
      onclick: `closeModal();setTimeout(()=>{showView('contracts');openModal('contractForm');setTimeout(()=>{document.querySelector('#contract-req').value=${r.id};${selectedQuote ? `document.querySelector('#contract-quote').value=${selectedQuote.id}` : ''}},100)},200)`
    };
  } else if (!tasks.some(t => t.status === 'completed')) {
    action = {
      title: '下一步：履约跟进',
      desc: '合同已签署，请跟进履约任务进度，确保婚礼前各项准备工作完成',
      button: '查看履约任务',
      onclick: `closeModal();setTimeout(()=>showView('fulfillment'),200)`
    };
  } else if ((r.reviews || []).length === 0) {
    action = {
      title: '下一步：评价服务',
      desc: '婚礼已完成，请对供应商服务进行评价，帮助其他新人做出选择',
      button: '提交评价',
      onclick: `closeModal();setTimeout(()=>{showView('aftersales');switchAfterTab('reviews');openModal('reviewForm')},200)`
    };
  } else {
    action = {
      title: '🎉 流程已完成',
      desc: '感谢您使用我们的平台！您的评价已沉淀到供应商信用档案中',
      button: '查看信用记录',
      onclick: `closeModal();setTimeout(()=>{showView('aftersales');switchAfterTab('credit')},200)`
    };
  }

  nextAction.innerHTML = `
    <div class="next-action-card">
      <strong>${action.title}</strong>
      <p>${action.desc}</p>
      <button class="btn-primary" onclick="${action.onclick}">${action.button} →</button>
    </div>
  `;
}

function toggleRequirementEdit() {
  const viewMode = $('rd-view-mode');
  const editForm = $('rd-edit-form');
  const editBtn = $('rd-edit-btn');

  if (viewMode.classList.contains('hidden')) {
    viewMode.classList.remove('hidden');
    editForm.classList.add('hidden');
    editBtn.textContent = '✎ 编辑';
  } else {
    viewMode.classList.add('hidden');
    editForm.classList.remove('hidden');
    editBtn.textContent = '✕ 取消编辑';
  }
}

async function saveRequirementEdit(e) {
  e.preventDefault();
  const form = e.currentTarget;
  const body = Object.fromEntries(new FormData(form).entries());
  body.budget = parseInt(body.budget, 10);
  body.guest_count = parseInt(body.guest_count, 10);

  try {
    await api(`/api/requirements/${body.id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    showToast('需求已更新');
    toggleRequirementEdit();
    viewRequirement(body.id);
    loadRequirements();
    loadOverview();
  } catch (e) { /* already toaster */ }
}

async function sendRequirementComm() {
  const input = $('rd-comm-input');
  const message = input.value.trim();
  if (!message || !currentRequirementId) return;

  try {
    await api('/api/communications', {
      method: 'POST',
      body: JSON.stringify({
        requirement_id: currentRequirementId,
        sender_id: currentUserId,
        sender_type: 'couple',
        message
      })
    });
    input.value = '';
    viewRequirement(currentRequirementId);
  } catch (e) { /* already toaster */ }
}

async function submitRequirement(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  body.budget = parseInt(body.budget, 10);
  body.guest_count = parseInt(body.guest_count, 10);
  await api('/api/requirements', { method: 'POST', body: JSON.stringify(body) });
  showToast('需求已发布');
  closeModal();
  loadRequirements();
  loadOverview();
  e.currentTarget.reset();
}

async function loadSuppliers() {
  try {
    const type = $('sup-filter-type')?.value || '';
    const status = $('sup-filter-status')?.value || '';
    let url = '/api/suppliers?pageSize=50';
    if (type) url += `&service_type=${type}`;
    if (status) url += `&status=${status}`;
    const result = await api(url);
    const list = result.data || result;
    if (list.length > 0) {
      $('suppliers-list').innerHTML = list.map(s => `
        <article class="card">
          <div class="card-head">
            <h3>${s.company_name}</h3>
            <span class="badge" style="background:${statusColors[s.status]}">${s.status}</span>
          </div>
          <div class="rating">${'★'.repeat(Math.round(s.rating || 0))}${'☆'.repeat(5 - Math.round(s.rating || 0))} ${s.rating || 0} (${s.review_count || 0}条评价)</div>
          <div class="card-body">
            <div class="info"><span>类型</span><b>${serviceTypeMap[s.service_type] || s.service_type}</b></div>
            <div class="info"><span>信用分</span><b style="color:${s.credit_score >= 90 ? '#059669' : s.credit_score >= 60 ? '#f59e0b' : '#dc2626'}">${s.credit_score}</b></div>
            <div class="info"><span>价格区间</span><b>¥${(s.price_min || 0).toLocaleString('zh-CN')} - ¥${(s.price_max || 0).toLocaleString('zh-CN')}</b></div>
            <div class="info"><span>可服务区域</span><b>${s.service_area || '-'}</b></div>
            <div class="info"><span>联系人</span><b>${s.contact_name}</b></div>
            <div class="info"><span>电话</span><b>${s.phone}</b></div>
            <div class="info full"><span>简介</span><b>${s.description || '-'}</b></div>
          </div>
          <div class="card-foot">
            <button class="btn-link" onclick="viewSupplier(${s.id})">查看详情</button>
            <button class="btn-sm" onclick="openModal('invitationForm');setTimeout(()=>document.querySelector('#inv-sup').value=${s.id},100)">邀请报价</button>
          </div>
        </article>
      `).join('');
    } else {
      $('suppliers-list').innerHTML = '<div class="empty">暂无供应商档案，点击"添加供应商"开始</div>';
    }
  } catch (e) {
    console.error('loadSuppliers error:', e);
  }
}

async function viewSupplier(id) {
  try {
    const s = await api(`/api/suppliers/${id}`);
    $('sd-name').textContent = s.company_name;
    $('sd-rating').innerHTML = `${'★'.repeat(Math.round(s.rating || 0))}${'☆'.repeat(5 - Math.round(s.rating || 0))} ${s.rating || 0} (${s.review_count || 0}条评价)`;
    $('sd-type').textContent = serviceTypeMap[s.service_type] || s.service_type;
    $('sd-credit').textContent = `${s.credit_score} 分`;
    $('sd-credit').style.color = s.credit_score >= 90 ? '#059669' : s.credit_score >= 60 ? '#f59e0b' : '#dc2626';
    $('sd-price').textContent = `¥${(s.price_min || 0).toLocaleString('zh-CN')} - ¥${(s.price_max || 0).toLocaleString('zh-CN')}`;
    $('sd-area').textContent = s.service_area || '-';
    $('sd-contact').textContent = s.contact_name;
    $('sd-phone').textContent = s.phone;
    $('sd-desc').textContent = s.description || '-';

    if (s.contract_template) {
      $('sd-desc').innerHTML += `<br><br><strong style="color:#374151">📄 合同模板:</strong><br><span style="font-size:12px;color:#6b7280">${s.contract_template.slice(0, 200)}${s.contract_template.length > 200 ? '...' : ''}</span>`;
    }

    $('sd-cases').innerHTML = (s.cases || []).map(c => `
      <div class="card-mini">
        <strong>${c.title}</strong>
        <span>${c.location || ''} · ${c.wedding_date || ''}</span>
        ${c.budget ? `<em>预算: ¥${(c.budget || 0).toLocaleString('zh-CN')}</em>` : ''}
        ${c.description ? `<p>${c.description}</p>` : ''}
      </div>
    `).join('') || '<p class="empty">暂无服务案例</p>';

    $('sd-schedules').innerHTML = (s.schedules || []).map(sc => `
      <div class="row"><strong>${sc.date}</strong><span>${sc.time_slot || '全天'}</span>
        <b style="background:${sc.status === 'available' ? '#dcfce7' : sc.status === 'booked' ? '#fee2e2' : '#f3f4f6'};color:${sc.status === 'available' ? '#166534' : sc.status === 'booked' ? '#991b1b' : '#6b7280'}">${sc.status === 'available' ? '✅ 可约' : sc.status === 'booked' ? '❌ 已订' : '停用'}</b></div>
    `).join('') || '<p class="empty">暂无档期记录</p>';

    $('sd-credit-list').innerHTML = (s.credit_records || []).map(cr => `
      <div class="row"><strong>${cr.reason}</strong><span>${cr.created_at?.slice(0, 10) || ''}</span>
        <b style="color:${cr.change > 0 ? '#059669' : '#dc2626'}">${cr.change > 0 ? '+' : ''}${cr.change}</b></div>
    `).join('') || '<p class="empty">暂无信用记录</p>';

    // Add action buttons at bottom
    const detailHeader = document.querySelector('#supplierDetail .detail-header');
    if (detailHeader && !detailHeader.querySelector('.sd-actions')) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'sd-actions';
      actionsDiv.style.cssText = 'display:flex;gap:8px;';
      actionsDiv.innerHTML = `
        <button class="btn-primary" onclick="closeModal();setTimeout(()=>{openModal('invitationForm');setTimeout(()=>{document.querySelector('#inv-sup').value=${s.id}},100)},100)">✉️ 邀请报价</button>
        <button class="btn-sm" onclick="closeModal()">关闭</button>
      `;
      detailHeader.appendChild(actionsDiv);
    }

    openModal('supplierDetail', '供应商详情');
  } catch (e) { /* already toaster */ }
}

async function submitSupplier(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  if (body.price_min) body.price_min = parseInt(body.price_min, 10);
  if (body.price_max) body.price_max = parseInt(body.price_max, 10);
  await api('/api/suppliers', { method: 'POST', body: JSON.stringify(body) });
  showToast('供应商已添加');
  closeModal();
  loadSuppliers();
  loadOverview();
  e.currentTarget.reset();
}

async function loadInvitations() {
  try {
    const result = await api('/api/invitations?pageSize=50');
    const list = result.data || result;
    $('invitations-list').innerHTML = renderTable(['ID', '新人需求', '婚期', '供应商', '服务类型', '报价参考', '业务状态', '有效期', '操作'],
      list.map(i => [
        i.id,
        i.couple_name || `需求#${i.requirement_id}`,
        i.wedding_date || '-',
        i.company_name,
        serviceTypeMap[i.service_type] || i.service_type,
        i.price_min || i.price_max ? `¥${(i.price_min || 0).toLocaleString('zh-CN')} - ¥${(i.price_max || 0).toLocaleString('zh-CN')}` : '-',
        `<span class="badge" style="background:${statusColors[i.status]}">${invitationStatusLabels[i.status] || i.status}</span>`,
        i.expires_at?.slice(0, 10) || '-',
        i.status === 'pending' ? `
          <button class="btn-sm" onclick="updateInvitation(${i.id}, 'accepted')">接受邀请</button>
          <button class="btn-sm danger" onclick="updateInvitation(${i.id}, 'rejected')">拒绝</button>
        ` : i.status === 'accepted' ? `
          <button class="btn-sm" onclick="openModal('quoteForm');setTimeout(()=>{document.querySelector('#qt-inv').value=${i.id}},100)">✍️ 提交报价</button>
        ` : `<span class="muted">${invitationStatusLabels[i.status] || i.status}</span>`
      ])
    );
  } catch (e) { /* already toaster */ }
}

async function submitInvitation(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  if (!body.requirement_id || !body.supplier_id) {
    showToast('请选择需求和供应商', 'error');
    return;
  }
  await api('/api/invitations', { method: 'POST', body: JSON.stringify(body) });
  showToast('邀请已发送');
  closeModal();
  loadInvitations();
  loadOverview();
  e.currentTarget.reset();
  resetInvitationForm();
}

function resetInvitationForm() {
  $('inv-req-info').classList.add('hidden');
  $('inv-sup-info').classList.add('hidden');
  $('inv-schedule-check').classList.add('hidden');
  $('inv-price-guide').classList.add('hidden');
  $('inv-submit-btn').disabled = true;
  document.querySelectorAll('#inv-process-guide .process-guide-step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i === 0) s.classList.add('active');
  });
}

async function onInvRequirementChange() {
  const reqId = $('inv-req').value;
  if (!reqId) {
    $('inv-req-info').classList.add('hidden');
    resetInvitationSteps(1);
    return;
  }

  try {
    const req = await api(`/api/requirements/${reqId}`);
    $('inv-req-info').innerHTML = `
      <div class="info-card-content">
        <strong>📋 ${req.couple_name} - ${req.wedding_date}</strong>
        <p>📍 ${req.city} · 💰 ¥${(req.budget || 0).toLocaleString('zh-CN')} · 👥 ${req.guest_count || 0}人</p>
        <p>🎨 ${req.style} · ⭐ ${req.priority}优先级</p>
        <p>📦 需要: ${req.service_list}</p>
      </div>
    `;
    $('inv-req-info').classList.remove('hidden');

    const weddingDate = new Date(req.wedding_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const defaultExpiry = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    $('inv-expires').value = defaultExpiry.toISOString().split('T')[0];
    $('inv-expires').min = today.toISOString().split('T')[0];
    $('inv-expires').max = weddingDate.toISOString().split('T')[0];

    const messageField = document.querySelector('#invitationForm textarea[name="message"]');
    messageField.placeholder = `请为"${req.couple_name}"的${req.wedding_date}婚礼提供${req.service_list}服务的报价方案...`;

    markInvitationStepDone(1);
    checkInvitationReady();
  } catch (e) {
    $('inv-req-info').classList.add('hidden');
  }
}

async function onInvSupplierChange() {
  const supId = $('inv-sup').value;
  const reqId = $('inv-req').value;
  if (!supId) {
    $('inv-sup-info').classList.add('hidden');
    $('inv-schedule-check').classList.add('hidden');
    $('inv-price-guide').classList.add('hidden');
    resetInvitationSteps(2);
    return;
  }

  try {
    const sup = await api(`/api/suppliers/${supId}`);
    $('inv-sup-info').innerHTML = `
      <div class="info-card-content">
        <strong>🏢 ${sup.company_name}</strong>
        <p>${'★'.repeat(Math.round(sup.rating || 0))}${'☆'.repeat(5 - Math.round(sup.rating || 0))} ${sup.rating || 0} · 信用分 ${sup.credit_score || 0}</p>
        <p>💰 ¥${(sup.price_min || 0).toLocaleString('zh-CN')} - ¥${(sup.price_max || 0).toLocaleString('zh-CN')}</p>
        <p>📍 可服务: ${sup.service_area || '-'}</p>
      </div>
    `;
    $('inv-sup-info').classList.remove('hidden');

    $('inv-price-guide').innerHTML = `
      <strong>💰 价格区间参考</strong>
      <p>该供应商报价区间为 <b>¥${(sup.price_min || 0).toLocaleString('zh-CN')} - ¥${(sup.price_max || 0).toLocaleString('zh-CN')}</b></p>
    `;
    $('inv-price-guide').classList.remove('hidden');

    if (reqId) {
      await checkSupplierSchedule(supId, reqId);
    }

    markInvitationStepDone(2);
    checkInvitationReady();
  } catch (e) {
    $('inv-sup-info').classList.add('hidden');
    $('inv-price-guide').classList.add('hidden');
  }
}

async function checkSupplierSchedule(supplierId, requirementId) {
  try {
    const [schedules, req] = await Promise.all([
      api(`/api/suppliers/${supplierId}/schedules`),
      api(`/api/requirements/${requirementId}`)
    ]);

    const weddingDate = req.wedding_date;
    const bookedDates = schedules
      .filter(s => s.status === 'booked')
      .map(s => s.date);

    const conflict = bookedDates.includes(weddingDate);
    const resultEl = $('inv-schedule-result');
    const checkEl = $('inv-schedule-check');

    if (conflict) {
      resultEl.innerHTML = `
        <div class="schedule-conflict">
          <strong>⚠️ 档期冲突</strong>
          <p>该供应商在 <b>${weddingDate}</b> 已有预约，请考虑其他日期或其他供应商</p>
          <p>已预约日期: ${bookedDates.join(', ')}</p>
        </div>
      `;
      checkEl.classList.remove('hidden');
      $('inv-submit-btn').disabled = true;
      $('inv-submit-btn').textContent = '⚠️ 档期冲突，无法发送';
    } else {
      resultEl.innerHTML = `
        <div class="schedule-available">
          <strong>✅ 档期可用</strong>
          <p>该供应商在 <b>${weddingDate}</b> 档期空闲，可以发送邀请</p>
          ${schedules.length > 0 ? `<p>已预约日期: ${bookedDates.length > 0 ? bookedDates.join(', ') : '无'}</p>` : ''}
        </div>
      `;
      checkEl.classList.remove('hidden');
      $('inv-submit-btn').disabled = false;
      $('inv-submit-btn').textContent = '✉️ 发送报价邀请';
    }

    markInvitationStepDone(3);
  } catch (e) {
    $('inv-schedule-check').classList.add('hidden');
  }
}

function markInvitationStepDone(stepIndex) {
  const steps = document.querySelectorAll('#inv-process-guide .process-guide-step');
  steps.forEach((s, i) => {
    if (i < stepIndex) s.classList.add('done');
    if (i === stepIndex) s.classList.add('active');
    if (i > stepIndex) { s.classList.remove('active', 'done'); }
  });
}

function resetInvitationSteps(fromIndex) {
  const steps = document.querySelectorAll('#inv-process-guide .process-guide-step');
  steps.forEach((s, i) => {
    if (i >= fromIndex) s.classList.remove('active', 'done');
    if (i === fromIndex) s.classList.add('active');
  });
  checkInvitationReady();
}

function checkInvitationReady() {
  const reqId = $('inv-req').value;
  const supId = $('inv-sup').value;
  const scheduleOk = !$('inv-schedule-check').classList.contains('hidden') &&
                     $('inv-schedule-result').innerHTML.includes('档期可用');

  if (reqId && supId) {
    if (scheduleOk) {
      $('inv-submit-btn').disabled = false;
      $('inv-submit-btn').textContent = '✉️ 发送报价邀请';
      markInvitationStepDone(3);
    } else if (!$('inv-schedule-check').classList.contains('hidden') &&
               $('inv-schedule-result').innerHTML.includes('档期冲突')) {
      $('inv-submit-btn').disabled = true;
      $('inv-submit-btn').textContent = '⚠️ 档期冲突，无法发送';
    } else {
      $('inv-submit-btn').disabled = true;
      $('inv-submit-btn').textContent = '请选择需求和供应商';
    }
  } else {
    $('inv-submit-btn').disabled = true;
  }
}

async function updateInvitation(id, status) {
  await api(`/api/invitations/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  showToast('邀请状态已更新');
  loadInvitations();
}

async function loadQuotes() {
  try {
    const reqId = $('quote-filter-req')?.value || '';
    const result = await api(`/api/quotes${reqId ? `?requirement_id=${reqId}` : ''}`);
    const list = result.data || result;

    const reqSel = $('quote-filter-req');
    if (reqSel && reqSel.options.length <= 1) {
      const reqs = await api('/api/requirements?pageSize=100').catch(() => ({ data: [] }));
      const reqData = reqs.data || reqs;
      reqSel.innerHTML = '<option value="">全部需求</option>' + reqData.map(r => `<option value="${r.id}">${r.couple_name} - ${r.wedding_date}</option>`).join('');
    }

    const grouped = {};
    list.forEach(q => {
      const key = q.requirement_id;
      if (!grouped[key]) grouped[key] = { requirement: q, quotes: [] };
      grouped[key].quotes.push(q);
    });

    let html = '';
    for (const [rid, group] of Object.entries(grouped)) {
      const req = group.requirement;
      const sortedQuotes = [...group.quotes].sort((a, b) => a.total_price - b.total_price);
      const minPrice = sortedQuotes[0]?.total_price || 0;
      const maxPrice = sortedQuotes[sortedQuotes.length - 1]?.total_price || 0;
      const avgPrice = sortedQuotes.length ? Math.round(sortedQuotes.reduce((s, q) => s + q.total_price, 0) / sortedQuotes.length) : 0;

      html += `<div class="quote-group">
        <div class="quote-group-head">
          <div>
            <h4>${req.wedding_date} · ${req.city || ''} · ${req.couple_name || '新人'}</h4>
            <div class="quote-stats">
              <span><b>${sortedQuotes.length}</b> 份报价</span>
              <span>区间: <b style="color:#059669">¥${minPrice.toLocaleString('zh-CN')}</b> - <b style="color:#dc2626">¥${maxPrice.toLocaleString('zh-CN')}</b></span>
              <span>均价: <b>¥${avgPrice.toLocaleString('zh-CN')}</b></span>
              <button class="btn-sm" onclick="showView('matchmaking');switchMatchTab('communications')">💬 查看沟通</button>
            </div>
          </div>
        </div>
        <div class="quote-compare">
          ${sortedQuotes.map((q, idx) => {
            const priceDiff = q.total_price - avgPrice;
            const priceDiffPct = avgPrice > 0 ? Math.round((priceDiff / avgPrice) * 100) : 0;
            return `
            <div class="quote-card ${q.status === 'selected' ? 'selected' : ''}">
              <div class="quote-head">
                <div>
                  <h5>${q.company_name}</h5>
                  <div class="quote-meta">${serviceTypeMap[q.service_type] || q.service_type}</div>
                </div>
                <span class="rank ${idx === 0 ? 'rank-best' : ''}">${idx === 0 ? '💰 最优' : `第${idx + 1}`}</span>
              </div>
              <div class="quote-price">
                ¥${q.total_price.toLocaleString('zh-CN')}
                <span class="price-diff ${priceDiff < 0 ? 'cheaper' : priceDiff > 0 ? 'expensive' : ''}">
                  ${priceDiff < 0 ? '↓' : priceDiff > 0 ? '↑' : '='} ${priceDiffPct}%
                </span>
              </div>
              <div class="quote-info"><span>评分</span><b>${'★'.repeat(Math.round(q.rating || 0))} ${q.rating || 0}</b></div>
              <div class="quote-info"><span>交付周期</span><b>${q.delivery_days || '-'} 天</b></div>
              <div class="quote-info"><span>服务类型</span><b>${serviceTypeMap[q.service_type] || q.service_type}</b></div>
              <div class="quote-info full"><span>报价明细</span><b style="white-space:pre-wrap;font-size:12px">${q.breakdown || '未提供明细'}</b></div>
              ${q.notes ? `<div class="quote-info full"><span>备注</span><b style="font-size:12px">${q.notes}</b></div>` : ''}
              <div class="quote-foot">
                <span class="badge" style="background:${statusColors[q.status]}">${quoteStatusLabels[q.status] || q.status}</span>
                ${q.status === 'submitted' || q.status === 'negotiating' ? `
                  <div style="display:flex;gap:4px">
                    <button class="btn-sm" onclick="selectQuote(${q.id})">✓ 选中方案</button>
                    <button class="btn-sm" onclick="negotiateQuote(${q.id})">💬 议价</button>
                  </div>
                ` : q.status === 'selected' ? `
                  <button class="btn-sm" onclick="goToContract(${q.requirement_id}, ${q.id})">📝 创建合同</button>
                ` : ''}
              </div>
            </div>
          `}).join('')}
        </div>
        ${sortedQuotes.some(q => q.status === 'selected') ? `
        <div class="quote-next-steps">
          <div class="next-action-card" style="margin-top:16px">
            <strong>🎉 已确认报价方案</strong>
            <p>请继续创建合同并安排定金支付，或查看详细合同条款</p>
            <button class="btn-primary" onclick="showView('contracts')">→ 进入合同支付流程</button>
          </div>
        </div>
        ` : ''}
      </div>`;
    }

    $('quotes-list').innerHTML = html || '<p class="empty">暂无报价，点击"邀请报价"发送报价邀请</p>';
  } catch (e) { /* already toaster */ }
}

async function negotiateQuote(id) {
  const note = prompt('请输入议价沟通内容：');
  if (!note || !currentRequirementId) return;
  try {
    await api('/api/communications', {
      method: 'POST',
      body: JSON.stringify({
        requirement_id: currentRequirementId,
        sender_id: currentUserId,
        sender_type: 'couple',
        message: `[议价] 针对报价 #${id}：${note}`
      })
    });
    showToast('议价消息已发送');
    loadQuotes();
  } catch (e) { /* already toaster */ }
}

async function goToContract(requirementId, quoteId) {
  closeModal();
  showView('contracts');
  setTimeout(() => {
    openModal('contractForm');
    setTimeout(() => {
      const reqSel = document.querySelector('#contractForm [name="requirement_id"]');
      const qtSel = document.querySelector('#contractForm [name="quote_id"]');
      const supSel = document.querySelector('#contractForm [name="supplier_id"]');
      if (reqSel) reqSel.value = requirementId;
      if (qtSel) qtSel.value = quoteId;
    }, 100);
  }, 200);
}

async function selectQuote(id) {
  if (!confirm('确定选中此报价吗？选中后其他报价将被拒绝，需求状态变更为已匹配。')) return;
  await api(`/api/quotes/${id}/select`, { method: 'POST' });
  showToast('报价已选中，需求已匹配');
  loadQuotes();
  loadOverview();
  loadRequirements();
}

async function submitQuote(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  const totalPrice = parseInt(body.total_price, 10);
  if (isNaN(totalPrice) || totalPrice <= 0) {
    showToast('报价金额必须大于0', 'error');
    return;
  }
  const deliveryDays = body.delivery_days ? parseInt(body.delivery_days, 10) : null;
  if (deliveryDays !== null && (isNaN(deliveryDays) || deliveryDays < 0)) {
    showToast('交付周期不能为负数', 'error');
    return;
  }
  body.total_price = totalPrice;
  body.delivery_days = deliveryDays;
  await api('/api/quotes', { method: 'POST', body: JSON.stringify(body) });
  showToast('报价已提交');
  closeModal();
  loadQuotes();
  e.currentTarget.reset();
}

async function loadCommunications() {
  try {
    const reqSel = $('comm-filter-req');
    if (reqSel && reqSel.options.length <= 1) {
      const reqs = await api('/api/requirements?pageSize=100').catch(() => ({ data: [] }));
      const reqData = reqs.data || reqs;
      reqSel.innerHTML = '<option value="">选择需求</option>' + reqData.map(r => `<option value="${r.id}">${r.couple_name} - ${r.wedding_date}</option>`).join('');
      if (reqData[0]) { reqSel.value = reqData[0].id; }
    }

    const rid = reqSel?.value;
    if (!rid) { $('communications-list').innerHTML = '<p class="empty">请选择需求</p>'; return; }

    const list = await api(`/api/communications?requirement_id=${rid}`);
    $('communications-list').innerHTML = list.map(c => `
      <div class="chat-item ${c.sender_type === 'couple' ? 'right' : 'left'}">
        <div class="chat-name">${c.sender_name} · ${c.created_at?.slice(5, 16) || ''}</div>
        <div class="chat-bubble">${c.message}</div>
      </div>
    `).join('') || '<p class="empty">暂无沟通记录</p>';
    $('communications-list').scrollTop = $('communications-list').scrollHeight;
    $('commForm').dataset.requirementId = rid;
  } catch (e) { /* already toaster */ }
}

async function sendMessage(e) {
  e.preventDefault();
  const rid = e.currentTarget.dataset.requirementId;
  if (!rid) { showToast('请先选择需求', 'error'); return; }
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  await api('/api/communications', {
    method: 'POST',
    body: JSON.stringify({ requirement_id: rid, sender_id: currentUserId, sender_type: 'couple', message: body.message })
  });
  e.currentTarget.reset();
  loadCommunications();
}

async function loadContracts() {
  try {
    const list = await api('/api/contracts');
    $('contracts-list').innerHTML = renderTable(
      ['ID', '新人需求', '供应商', '报价金额', '状态', '签署时间', '归档时间', '操作'],
      list.map(c => [
        c.id,
        c.wedding_date || '-',
        c.company_name || '-',
        `¥${(c.total_price || 0).toLocaleString('zh-CN')}`,
        `<span class="badge" style="background:${statusColors[c.status]}">${c.status}</span>`,
        c.signed_by_couple_at?.slice(0, 10) || '-',
        c.archived_at?.slice(0, 10) || '-',
        `
          ${c.status === 'pending_signature' ? `
            <button class="btn-sm" onclick="signContract(${c.id}, 'couple')">新人签署</button>
            <button class="btn-sm" onclick="signContract(${c.id}, 'supplier')">供应商签署</button>
          ` : ''}
          ${c.status === 'signed' ? `
            <button class="btn-sm" onclick="archiveContract(${c.id})">归档</button>
            <button class="btn-sm" onclick="openModal('paymentForm');setTimeout(()=>document.querySelector('#pay-ctr').value=${c.id},100)">登记支付</button>
          ` : ''}
          ${c.status !== 'archived' && c.status !== 'cancelled' ? `
            <button class="btn-link" onclick="openModal('fulfillmentForm');setTimeout(()=>{document.querySelector('#ft-req').value=${c.requirement_id};document.querySelector('#ft-ctr').value=${c.id};},100)">创建履约</button>
          ` : ''}
        `
      ])
    );
  } catch (e) { /* already toaster */ }
}

async function submitContract(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  if (body.quote_id) body.quote_id = parseInt(body.quote_id, 10);
  await api('/api/contracts', { method: 'POST', body: JSON.stringify(body) });
  showToast('合同已创建');
  closeModal();
  loadContracts();
  e.currentTarget.reset();
}

async function signContract(id, signer) {
  await api(`/api/contracts/${id}/sign`, { method: 'POST', body: JSON.stringify({ signer }) });
  showToast('签署成功');
  loadContracts();
}

async function archiveContract(id) {
  if (!confirm('确定归档此合同吗？')) return;
  await api(`/api/contracts/${id}/archive`, { method: 'POST' });
  showToast('合同已归档');
  loadContracts();
}

async function loadPayments() {
  try {
    const list = await api('/api/payments');
    $('payments-list').innerHTML = renderTable(
      ['ID', '合同/供应商', '类型', '金额', '状态', '交易号', '支付时间', '操作'],
      list.map(p => [
        p.id,
        p.company_name || `合同#${p.contract_id}`,
        p.payment_type === 'deposit' ? '定金' : p.payment_type === 'installment' ? '分期' : p.payment_type === 'final' ? '尾款' : '退款',
        `<b style="color:${p.payment_type === 'refund' ? '#dc2626' : '#059669'}">¥${p.amount.toLocaleString('zh-CN')}</b>`,
        `<span class="badge" style="background:${statusColors[p.status]}">${p.status === 'pending' ? '待支付' : p.status}</span>`,
        p.transaction_id || '-',
        p.paid_at?.slice(0, 16) || '-',
        p.status === 'pending' ? `<button class="btn-sm" onclick="markPaid(${p.id})">标记已付</button>` : ''
      ])
    );
  } catch (e) { /* already toaster */ }
}

async function submitPayment(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  body.amount = parseInt(body.amount, 10);
  body.contract_id = parseInt(body.contract_id, 10);
  if (body.refund_amount) body.refund_amount = parseInt(body.refund_amount, 10);
  await api('/api/payments', { method: 'POST', body: JSON.stringify(body) });
  showToast('支付已记录');
  closeModal();
  loadPayments();
  loadOverview();
  e.currentTarget.reset();
}

async function markPaid(id) {
  await api(`/api/payments/${id}/pay`, { method: 'POST', body: JSON.stringify({ transaction_id: 'MANUAL_' + Date.now() }) });
  showToast('已标记为支付');
  loadPayments();
}

async function loadFulfillment() {
  try {
    const category = $('ft-filter-category')?.value || '';
    const status = $('ft-filter-status')?.value || '';
    const party = $('ft-filter-party')?.value || '';
    let url = '/api/fulfillment-tasks';
    const params = [];
    if (category) params.push(`category=${category}`);
    if (status) params.push(`status=${status}`);
    if (party) params.push(`responsible_party=${party}`);
    if (params.length) url += '?' + params.join('&');

    const list = await api(url);

    const cols = { pending: [], in_progress: [], completed: [], delayed: [] };
    list.forEach(t => { if (cols[t.status]) cols[t.status].push(t); });

    $('cnt-pending').textContent = cols.pending.length;
    $('cnt-in_progress').textContent = cols['in_progress'].length;
    $('cnt-completed').textContent = cols.completed.length;
    $('cnt-delayed').textContent = cols.delayed.length;

    const renderKanban = (items) => items.map(t => `
      <div class="kanban-card" draggable="true" data-id="${t.id}" data-status="${t.status}">
        <div class="kanban-head">
          <span class="tag" style="background:${getCategoryColor(t.category)}">${categoryMap[t.category]}</span>
          <span class="tag" style="background:#f3e8ff;color:#7c3aed">${partyMap[t.responsible_party]}</span>
        </div>
        <h5>${t.title}</h5>
        ${t.description ? `<p>${t.description}</p>` : ''}
        <div class="kanban-foot">
          <span>${t.due_date || '无截止'}</span>
          <div class="kanban-actions">
            ${t.status !== 'completed' ? `<button class="btn-sm" onclick="updateFulfillmentStatus(${t.id}, 'completed')">完成</button>` : ''}
            ${t.status === 'pending' ? `<button class="btn-sm" onclick="updateFulfillmentStatus(${t.id}, 'in_progress')">开始</button>` : ''}
            ${t.status !== 'completed' && t.status !== 'delayed' ? `<button class="btn-sm danger" onclick="updateFulfillmentStatus(${t.id}, 'delayed')">延迟</button>` : ''}
          </div>
        </div>
      </div>
    `).join('') || '<p class="empty">暂无任务</p>';

    $('col-pending').innerHTML = renderKanban(cols.pending);
    $('col-in_progress').innerHTML = renderKanban(cols['in_progress']);
    $('col-completed').innerHTML = renderKanban(cols.completed);
    $('col-delayed').innerHTML = renderKanban(cols.delayed);
  } catch (e) { /* already toaster */ }
}

function getCategoryColor(cat) {
  const colors = { preparation: '#dbeafe', materials: '#fce7f3', arrival: '#dcfce7', change: '#fef3c7', acceptance: '#ede9fe' };
  return colors[cat] || '#f3f4f6';
}

async function submitFulfillment(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  if (body.requirement_id) body.requirement_id = parseInt(body.requirement_id, 10);
  if (body.contract_id) body.contract_id = parseInt(body.contract_id, 10);
  if (body.responsible_id) body.responsible_id = parseInt(body.responsible_id, 10);
  if (body.parent_task_id) body.parent_task_id = parseInt(body.parent_task_id, 10);
  await api('/api/fulfillment-tasks', { method: 'POST', body: JSON.stringify(body) });
  showToast('履约任务已创建');
  closeModal();
  loadFulfillment();
  loadOverview();
  e.currentTarget.reset();
}

async function updateFulfillmentStatus(id, status) {
  await api(`/api/fulfillment-tasks/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
  showToast('任务状态已更新');
  loadFulfillment();
  loadOverview();
}

let currentAftersalesStatusFilter = '';
let currentAftersalesTypeFilter = '';

async function loadAftersalesStats() {
  try {
    const [aftersales, reviews, credits] = await Promise.all([
      api('/api/after-sales'),
      api('/api/reviews'),
      api('/api/credit-records')
    ]);

    const byStatus = {};
    let totalRefunds = 0;
    aftersales.forEach(a => {
      byStatus[a.status] = (byStatus[a.status] || 0) + 1;
      if (a.refund_amount) totalRefunds += a.refund_amount;
    });

    const supResult = await api('/api/suppliers?pageSize=100').catch(() => ({ data: [] }));
    const sups = supResult.data || supResult;
    const avgCredit = sups.length > 0
      ? Math.round(sups.reduce((s, sp) => s + (sp.credit_score || 0), 0) / sups.length)
      : 0;

    $('as-open').textContent = byStatus.open || 0;
    $('as-investigating').textContent = byStatus.investigating || 0;
    $('as-resolved').textContent = byStatus.resolved || 0;
    $('as-reviews').textContent = reviews.length || 0;
    $('as-refunds').textContent = `¥${totalRefunds.toLocaleString('zh-CN')}`;
    $('as-avg-credit').textContent = `${avgCredit} 分`;
  } catch (e) { /* ignore */ }
}

async function loadAftersales() {
  try {
    await loadAftersalesStats();
    let list = await api('/api/after-sales');
    if (currentAftersalesStatusFilter) list = list.filter(a => a.status === currentAftersalesStatusFilter);
    if (currentAftersalesTypeFilter) list = list.filter(a => a.type === currentAftersalesTypeFilter);

    const aftersaleStatusLabels = {
      open: '待处理',
      investigating: '处理中',
      resolved: '已解决',
      closed: '已关闭'
    };

    $('aftersales-list').innerHTML = renderTable(
      ['ID', '需求', '供应商', '类型', '标题', '状态', '退款', '提交人', '创建时间', '操作'],
      list.map(a => [
        a.id,
        a.wedding_date || '-',
        a.company_name || '-',
        `<span class="badge" style="background:#fee2e2;color:#991b1b">${aftersaleTypeMap[a.type]}</span>`,
        a.title,
        `<span class="badge" style="background:${statusColors[a.status] || '#6b7280'}">${aftersaleStatusLabels[a.status] || a.status}</span>`,
        a.refund_amount > 0 ? `¥${a.refund_amount.toLocaleString('zh-CN')}` : '-',
        a.filed_by_name || '-',
        a.created_at?.slice(0, 16) || '-',
        `
          ${a.status === 'open' ? `<button class="btn-sm" onclick="updateAftersale(${a.id}, 'investigating');loadAftersales()">开始处理</button>` : ''}
          ${a.status === 'investigating' ? `<button class="btn-sm" onclick="updateAftersale(${a.id}, 'resolved');loadAftersales()">已解决</button>` : ''}
          ${a.status !== 'closed' ? `<button class="btn-sm danger" onclick="updateAftersale(${a.id}, 'closed');loadAftersales()">关闭</button>` : ''}
        `
      ])
    ) || '<p class="empty">暂无售后工单</p>';
  } catch (e) { /* already toaster */ }
}

function filterAftersalesByStatus(status) {
  currentAftersalesStatusFilter = status;
  const sel = $('as-status-filter');
  if (sel && sel.value !== status) sel.value = status;
  loadAftersales();
}

function filterAftersalesByType(type) {
  currentAftersalesTypeFilter = type;
  const sel = $('as-type-filter');
  if (sel && sel.value !== type) sel.value = type;
  loadAftersales();
}

async function submitAftersale(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  body.requirement_id = parseInt(body.requirement_id, 10);
  body.supplier_id = parseInt(body.supplier_id, 10);
  if (body.contract_id) body.contract_id = parseInt(body.contract_id, 10);
  body.refund_amount = parseInt(body.refund_amount || 0, 10);
  body.filed_by = parseInt(body.filed_by, 10);
  await api('/api/after-sales', { method: 'POST', body: JSON.stringify(body) });
  showToast('售后工单已提交');
  closeModal();
  loadAftersales();
  loadSuppliers();
  e.currentTarget.reset();
}

async function updateAftersale(id, status) {
  await api(`/api/after-sales/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  showToast('工单状态已更新');
  loadAftersales();
  loadSuppliers();
  loadCreditRecords();
}

async function loadReviews() {
  try {
    const list = await api('/api/reviews');
    $('reviews-list').innerHTML = list.map(r => `
      <article class="card">
        <div class="card-head">
          <h3>${r.company_name}</h3>
          <div class="rating">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        </div>
        <div class="card-body">
          <div class="info"><span>评价人</span><b>${r.reviewer_name || '-'}</b></div>
          <div class="info"><span>时间</span><b>${r.created_at?.slice(0, 16) || '-'}</b></div>
          ${r.content ? `<div class="info full"><span>评价内容</span><b>${r.content}</b></div>` : ''}
        </div>
      </article>
    `).join('') || '<p class="empty">暂无评价</p>';
  } catch (e) { /* already toaster */ }
}

async function submitReview(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  body.supplier_id = parseInt(body.supplier_id, 10);
  body.reviewer_id = parseInt(body.reviewer_id, 10);
  body.rating = parseInt(body.rating, 10);
  if (body.requirement_id) body.requirement_id = parseInt(body.requirement_id, 10);
  await api('/api/reviews', { method: 'POST', body: JSON.stringify(body) });
  showToast('评价已提交，信用已更新');
  closeModal();
  loadReviews();
  loadSuppliers();
  loadCreditRecords();
  e.currentTarget.reset();
}

async function loadCreditRecords() {
  try {
    const list = await api('/api/credit-records');
    $('credit-list').innerHTML = renderTable(
      ['ID', '供应商', '变动', '原因', '关联类型', '时间'],
      list.map(cr => [
        cr.id,
        cr.company_name,
        `<b style="color:${cr.change > 0 ? '#059669' : '#dc2626'}">${cr.change > 0 ? '+' : ''}${cr.change}</b>`,
        cr.reason,
        cr.reference_type || '-',
        cr.created_at?.slice(0, 16) || '-'
      ])
    );
  } catch (e) { /* already toaster */ }
}

async function loadTasks() {
  try {
    const list = await api('/api/tasks');
    $('tasks-list').innerHTML = list.map(t => `
      <div class="row"><strong>${t.title}</strong><span>${t.owner} · ${t.due_date}</span>
        <select onchange="updateTaskStatus(${t.id}, this.value)">
          <option value="待处理" ${t.status === '待处理' ? 'selected' : ''}>待处理</option>
          <option value="进行中" ${t.status === '进行中' ? 'selected' : ''}>进行中</option>
          <option value="已完成" ${t.status === '已完成' ? 'selected' : ''}>已完成</option>
        </select>
        <b style="background:${t.priority === '高' ? '#fee2e2' : t.priority === '中' ? '#fef3c7' : '#dbeafe'};color:${t.priority === '高' ? '#991b1b' : t.priority === '中' ? '#92400e' : '#1e40af'}">${t.priority}</b></div>
    `).join('');
  } catch (e) { /* already toaster */ }
}

async function submitTask(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  try {
    const task = await api('/api/tasks', { method: 'POST', body: JSON.stringify(body) });
    $('taskMsg').textContent = `✅ 任务已创建: ${task.title}`;
    $('taskMsg').style.color = '#059669';
    await Promise.all([loadOverview(), loadTasks()]);
    setTimeout(() => $('taskMsg').textContent = '', 3000);
  } catch (err) {
    $('taskMsg').textContent = '❌ ' + err.message;
    $('taskMsg').style.color = '#dc2626';
  }
  e.currentTarget.reset();
}

async function updateTaskStatus(id, status) {
  await api(`/api/tasks/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  showToast('任务状态已更新');
  loadTasks();
  loadOverview();
}

async function loadGuests() {
  try {
    const list = await api('/api/guests');
    $('guests-list').innerHTML = renderTable(
      ['ID', '姓名', '归属', 'RSVP', '桌号'],
      list.map(g => [
        g.id, g.name, g.side,
        `<span class="badge" style="background:${g.rsvp === 'confirmed' ? '#dcfce7' : g.rsvp === 'pending' ? '#fef3c7' : '#fee2e2'};color:${g.rsvp === 'confirmed' ? '#166534' : g.rsvp === 'pending' ? '#92400e' : '#991b1b'}">${g.rsvp === 'confirmed' ? '已确认' : g.rsvp === 'pending' ? '待回复' : '婉拒'}</span>`,
        g.table_no || '-'
      ])
    );
  } catch (e) { /* already toaster */ }
}

async function loadAdminStats() {
  try {
    const [stats, users] = await Promise.all([api('/api/dashboard/stats'), api('/api/users')]);
    $('ad-req').textContent = stats.requirements || 0;
    $('ad-sup').textContent = stats.suppliers || 0;
    $('ad-ctr').textContent = stats.contracts || 0;
    $('ad-rev').textContent = `¥${(stats.revenue || 0).toLocaleString('zh-CN')}`;
    $('ad-ctr-pending').textContent = stats.contracts_pending || 0;
    $('ad-pay-pending').textContent = stats.payments_pending || 0;

    const adminStats = [
      { label: '已归档合同', value: stats.contracts_archived || 0, icon: '📁', color: '#10b981' },
      { label: '累计退款金额', value: `¥${(stats.total_refunds || 0).toLocaleString('zh-CN')}`, icon: '💸', color: '#ef4444' },
      { label: '处理中售后', value: stats.after_sales_open || 0, icon: '🔧', color: '#f59e0b' },
      { label: '已解决售后', value: stats.after_sales_resolved || 0, icon: '✅', color: '#10b981' },
      { label: '平均评分', value: `${(stats.avg_rating || 0).toFixed(1)} ★`, icon: '⭐', color: '#f59e0b' },
      { label: '评价总数', value: stats.total_reviews || 0, icon: '💬', color: '#8b5cf6' },
      { label: '平均信用分', value: `${Math.round(stats.avg_credit || 0)} 分`, icon: '💯', color: '#3b82f6' },
      { label: '支付失败', value: stats.payments_failed || 0, icon: '❌', color: '#ef4444' }
    ];

    $('admin-business-overview').innerHTML = adminStats.map(s => `
      <div class="admin-stat-card" style="border-left: 4px solid ${s.color}">
        <span class="admin-stat-icon">${s.icon}</span>
        <div>
          <span class="admin-stat-label">${s.label}</span>
          <strong class="admin-stat-value">${s.value}</strong>
        </div>
      </div>
    `).join('');

    $('users-list').innerHTML = renderTable(
      ['ID', '角色', '姓名', '手机', '邮箱', '创建时间'],
      users.map(u => [
        u.id,
        { couple: '新人', planner: '策划师', photographer: '摄影', venue: '场地', florist: '花艺', admin: '运营' }[u.role] || u.role,
        u.name, u.phone || '-', u.email || '-', u.created_at?.slice(0, 10) || '-'
      ])
    );

    await Promise.all([
      loadAdminContractAudit(),
      loadAdminPaymentAudit(),
      loadAdminAftersaleAudit(),
      loadAdminCreditAudit()
    ]);
  } catch (e) { /* already toaster */ }
}

async function loadAdminContractAudit() {
  try {
    const filter = $('ad-contract-filter')?.value || '';
    const contracts = await api(`/api/contracts${filter ? `?status=${filter}` : ''}`);
    const list = contracts.data || contracts;
    const statusLabels = { draft: '草稿', pending_signature: '待签署', signed: '已签署', archived: '已归档' };
    $('admin-contract-audit').innerHTML = renderTable(
      ['ID', '新人需求', '供应商', '合同金额', '状态', '签署日期', '归档日期', '操作'],
      list.map(c => [
        c.id,
        `${c.wedding_date || ''} ${c.couple_name || '需求#' + c.requirement_id}`,
        c.company_name || `供应商#${c.supplier_id}`,
        `¥${(c.total_amount || 0).toLocaleString('zh-CN')}`,
        `<span class="badge" style="background:${statusColors[c.status] || '#6b7280'}">${statusLabels[c.status] || c.status}</span>`,
        c.signed_date?.slice(0, 10) || '-',
        c.archived_at?.slice(0, 10) || '-',
        `<div style="display:flex;gap:4px">
          ${c.status === 'signed' ? `<button class="btn-sm" onclick="archiveContract(${c.id})">📁 归档</button>` : ''}
          <button class="btn-sm" onclick="viewContractDetail(${c.id})">查看</button>
        </div>`
      ])
    );
  } catch (e) { /* already toaster */ }
}

async function loadAdminPaymentAudit() {
  try {
    const payments = await api('/api/payments');
    const list = payments.data || payments;
    const statusLabels = { pending: '待支付', paid: '已支付', failed: '支付失败', refunded: '已退款' };
    $('admin-payment-audit').innerHTML = renderTable(
      ['ID', '合同ID', '金额', '类型', '状态', '交易号', '支付时间', '备注'],
      list.map(p => [
        p.id,
        p.contract_id,
        `¥${(p.amount || 0).toLocaleString('zh-CN')}`,
        p.payment_type === 'deposit' ? '定金' : p.payment_type === 'balance' ? '尾款' : p.payment_type,
        `<span class="badge" style="background:${statusColors[p.status] || '#6b7280'}">${statusLabels[p.status] || p.status}</span>`,
        p.transaction_id || '-',
        p.paid_at?.slice(0, 16) || '-',
        p.notes || '-'
      ])
    );
  } catch (e) { /* already toaster */ }
}

async function loadAdminAftersaleAudit() {
  try {
    const aftersales = await api('/api/after-sales');
    const list = aftersales.data || aftersales;
    const statusLabels = { open: '待处理', investigating: '处理中', resolved: '已解决', closed: '已关闭' };
    const typeLabels = { complaint: '投诉', delay: '延期', refund: '退款', service_mismatch: '服务不符' };
    $('admin-aftersale-audit').innerHTML = renderTable(
      ['ID', '类型', '标题', '供应商', '状态', '退款金额', '提交时间', '处理结果'],
      list.map(a => [
        a.id,
        `<span class="badge" style="background:#f59e0b">${typeLabels[a.type] || a.type}</span>`,
        a.title,
        a.company_name || `供应商#${a.supplier_id}`,
        `<span class="badge" style="background:${statusColors[a.status] || '#6b7280'}">${statusLabels[a.status] || a.status}</span>`,
        a.refund_amount ? `¥${a.refund_amount.toLocaleString('zh-CN')}` : '-',
        a.created_at?.slice(0, 16) || '-',
        a.resolution || '处理中...'
      ])
    );
  } catch (e) { /* already toaster */ }
}

async function loadAdminCreditAudit() {
  try {
    const credits = await api('/api/credit-records');
    const list = credits.data || credits;
    $('admin-credit-audit').innerHTML = renderTable(
      ['ID', '供应商', '信用变更', '原因', '关联类型', '关联ID', '时间'],
      list.map(cr => [
        cr.id,
        cr.company_name || `供应商#${cr.supplier_id}`,
        `<b style="color:${cr.change > 0 ? '#059669' : '#dc2626'}">${cr.change > 0 ? '+' : ''}${cr.change} 分</b>`,
        cr.reason,
        cr.reference_type,
        cr.reference_id || '-',
        cr.created_at?.slice(0, 16) || '-'
      ])
    );
  } catch (e) { /* already toaster */ }
}

async function archiveContract(id) {
  if (!confirm('确认归档此合同？归档后不可修改。')) return;
  try {
    await api(`/api/contracts/${id}/archive`, { method: 'POST' });
    showToast('合同已归档');
    loadAdminContractAudit();
    loadAdminStats();
  } catch (e) { /* already toaster */ }
}

async function signContract(id, signer) {
  try {
    await api(`/api/contracts/${id}/sign`, {
      method: 'POST',
      body: JSON.stringify({ signer })
    });
    showToast(`合同已由${signer === 'couple' ? '新人' : '供应商'}签署`);
  } catch (e) { /* already toaster */ }
}

async function viewContractDetail(id) {
  try {
    const contract = await api(`/api/contracts/${id}`);
    showToast(`合同#${id} 详情: ${contract.status}`);
  } catch (e) { /* already toaster */ }
}

async function submitUser(e) {
  e.preventDefault();
  const body = Object.fromEntries(new FormData(e.currentTarget).entries());
  await api('/api/users', { method: 'POST', body: JSON.stringify(body) });
  showToast('用户已添加');
  closeModal();
  loadAdminStats();
  e.currentTarget.reset();
}

function renderTable(headers, rows) {
  if (!rows || rows.length === 0) {
    return '<div class="empty">暂无数据</div>';
  }
  return `
    <table class="data-table">
      <thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;
}

function initRouter() {
  const hash = location.hash.slice(1) || 'overview';
  showView(hash);
  window.addEventListener('hashchange', () => {
    const h = location.hash.slice(1) || 'overview';
    showView(h);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  loadHealth();
  setInterval(loadHealth, 30000);
});
