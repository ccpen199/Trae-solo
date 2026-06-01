import './styles.css';

const app = document.querySelector('#app');

const state = {
  currentRoute: 'dashboard',
  user: null,
  token: localStorage.getItem('antifraud_token'),
  reportForm: {},
  verifyResult: null,
  currentQuiz: null,
  quizScore: 0,
  quizTotal: 0
};

function apiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL || '';
  if (!base) return path;
  const normalized = base.replace(/\/$/, '');
  if (normalized.endsWith('/api')) return `${normalized}${path.replace(/^\/api/, '')}`;
  return `${normalized}${path}`;
}

function getAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  return headers;
}

function formatMoney(value) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency', currency: 'CNY', maximumFractionDigits: 0
  }).format(value || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('zh-CN');
}

function riskClass(level) {
  if (level === '高危') return 'risk high';
  if (level === '中危') return 'risk medium';
  if (level === '安全') return 'risk low';
  return 'risk';
}

function statusClass(status) {
  const map = {
    '待受理': 'status pending',
    '核查中': 'status checking',
    '已立案': 'status filed',
    '已反馈': 'status done',
    '已归档': 'status archived',
    '待处理': 'status pending',
    '处理中': 'status checking',
    '已完成': 'status done'
  };
  return map[status] || 'status';
}

function navigate(route) {
  state.currentRoute = route;
  window.location.hash = route;
  render();
}

function getRouteFromHash() {
  const hash = window.location.hash.slice(1);
  return hash || 'dashboard';
}

async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...getAuthHeaders(), ...options.headers }
    });
    if (!response.ok) {
      if (response.status === 401) {
        state.token = null;
        state.user = null;
        localStorage.removeItem('antifraud_token');
      }
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

function renderHeader() {
  const isAdmin = state.user && ['super_admin', 'admin', 'officer'].includes(state.user.role);
  return `
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <div class="logo-icon">🛡️</div>
          <div>
            <h1>国家级反诈协同治理平台</h1>
            <p class="logo-sub">National Anti-Fraud Collaborative Governance Platform</p>
          </div>
        </div>
        <nav class="nav">
          <a href="#dashboard" class="nav-item ${state.currentRoute === 'dashboard' ? 'active' : ''}">首页</a>
          <a href="#report" class="nav-item ${state.currentRoute === 'report' ? 'active' : ''}">我要举报</a>
          <a href="#verify" class="nav-item ${state.currentRoute === 'verify' ? 'active' : ''}">号码核验</a>
          <a href="#knowledge" class="nav-item ${state.currentRoute === 'knowledge' ? 'active' : ''}">反诈知识</a>
          <a href="#quiz" class="nav-item ${state.currentRoute === 'quiz' ? 'active' : ''}">情景答题</a>
          ${isAdmin ? `<a href="#admin" class="nav-item ${state.currentRoute.startsWith('admin') ? 'active' : ''}">管理后台</a>` : ''}
          <div class="nav-right">
            ${state.user ? `
              <span class="user-info">${state.user.real_name || state.user.username} (${state.user.role})</span>
              <button class="btn btn-secondary" onclick="window.logout()">退出</button>
            ` : `
              <button class="btn btn-secondary" onclick="navigate('login')">登录</button>
            `}
          </div>
        </nav>
      </div>
    </header>
  `;
}

function renderLoading() {
  return `<div class="loading">加载中...</div>`;
}

function renderError(message) {
  return `<div class="error-box">${message}</div>`;
}

async function renderDashboard() {
  try {
    const [health, overview] = await Promise.all([
      apiRequest(apiUrl('/api/health')),
      apiRequest(apiUrl('/api/overview'))
    ]);
    const { metrics, cases, agencies, tasks } = overview;
    return `
      <section class="content">
        <div class="warnings-section">
          <h3 class="section-title">🔔 反诈预警</h3>
          <div class="warnings-scroll">
            <div class="warning-item">⚠️ 近期刷单返利诈骗高发，请勿轻信"高佣金、先垫付"的刷单广告！</div>
            <div class="warning-item">⚠️ AI换脸诈骗出现，请通过多种方式核实亲友身份后再转账！</div>
            <div class="warning-item">⚠️ 公检法不会通过电话要求转账，切勿转账到所谓"安全账户"！</div>
          </div>
        </div>

        <div class="metrics">
          <article>
            <span>活跃案件</span>
            <strong>${metrics.activeCases || 0}</strong>
          </article>
          <article>
            <span>高危线索</span>
            <strong>${metrics.highRiskCases || 0}</strong>
          </article>
          <article>
            <span>累计止付</span>
            <strong>${formatMoney(metrics.blockedAmount)}</strong>
          </article>
          <article>
            <span>保护群众</span>
            <strong>${metrics.protectedPeople || 0}</strong>
          </article>
          <article>
            <span>在线单位</span>
            <strong>${metrics.onlineAgencies || 0}</strong>
          </article>
          <article>
            <span>待办任务</span>
            <strong>${metrics.pendingTasks || 0}</strong>
          </article>
        </div>

        <div class="grid">
          <article class="panel wide">
            <div class="section-title">
              <h2>实时预警线索</h2>
              <span>${health.service}</span>
            </div>
            <div class="case-list">
              ${cases.map(item => `
                <div class="case-row">
                  <div>
                    <strong>${item.type}</strong>
                    <span>${item.location} · ${formatDate(item.reported_at)}</span>
                  </div>
                  <span class="${riskClass(item.risk_level)}">${item.risk_level}</span>
                  <span class="${statusClass(item.status)}">${item.status}</span>
                  <b>${formatMoney(item.amount)}</b>
                </div>
              `).join('')}
            </div>
          </article>

          <article class="panel">
            <div class="section-title">
              <h2>联动单位</h2>
              <span>${metrics.onlineAgencies} 在线</span>
            </div>
            <div class="agency-list">
              ${agencies.map(item => `
                <div>
                  <span>${item.name}</span>
                  <div class="agency-right">
                    <span class="${item.online ? 'dot online' : 'dot offline'}"></span>
                    <strong>${item.case_count}</strong>
                  </div>
                </div>
              `).join('')}
            </div>
          </article>

          <article class="panel">
            <div class="section-title">
              <h2>处置任务</h2>
              <span>今日</span>
            </div>
            <div class="task-list">
              ${tasks.map(item => `
                <div>
                  <strong>${item.title}</strong>
                  <span>${item.owner || '未分配'} · ${item.status} · ${item.due_date || ''}</span>
                </div>
              `).join('')}
            </div>
          </article>
        </div>

        <div class="quick-actions">
          <button class="btn btn-primary btn-lg" onclick="navigate('report')">📝 立即举报</button>
          <button class="btn btn-secondary btn-lg" onclick="navigate('verify')">🔍 号码核验</button>
          <button class="btn btn-secondary btn-lg" onclick="navigate('knowledge')">📚 学习知识</button>
          <button class="btn btn-secondary btn-lg" onclick="navigate('quiz')">🎯 情景测试</button>
        </div>
      </section>
    `;
  } catch (error) {
    return renderError(`无法加载数据：${error.message}`);
  }
}

function renderReportPage() {
  if (state.reportResult) {
    const r = state.reportResult;
    return `
      <section class="content">
        <div class="page-header">
          <h2>✅ 举报提交成功</h2>
          <p class="text-muted">您的举报已被系统受理</p>
        </div>

        <div class="form-card">
          <div class="success-box" style="padding: 32px; text-align: center;">
            <div style="font-size: 64px; margin-bottom: 16px;">✅</div>
            <h3>举报受理成功</h3>
            <p class="text-muted" style="margin-bottom: 24px;">所有举报数据已端到端加密存储，请放心</p>
            
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: left;">
                <div>
                  <span class="text-muted">举报编号</span>
                  <strong style="display: block; font-size: 18px; color: #0ea5e9;">${r.report_no || '-'}</strong>
                </div>
                <div>
                  <span class="text-muted">当前状态</span>
                  <strong style="display: block; font-size: 18px; color: #f59e0b;">待受理</strong>
                </div>
                <div>
                  <span class="text-muted">诈骗类型</span>
                  <strong style="display: block;">${r.fraud_type || '-'}</strong>
                </div>
                <div>
                  <span class="text-muted">提交时间</span>
                  <strong style="display: block;">${formatDate(r.created_at)}</strong>
                </div>
              </div>
            </div>

            <div style="text-align: left; background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <h4 style="margin: 0 0 8px 0;">📋 后续流程说明</h4>
              <ol style="margin: 0; padding-left: 20px;">
                <li>系统将在24小时内完成线索初筛和风险评估</li>
                <li>根据举报内容分派至对应地市公安分局处理</li>
                <li>处理进度可通过举报编号在管理后台查询</li>
                <li>如需补充证据，请使用举报编号联系办案民警</li>
              </ol>
            </div>

            <div class="form-actions" style="justify-content: center;">
              <button class="btn btn-secondary" onclick="clearReportResult()">继续举报</button>
              <button class="btn btn-primary" onclick="navigate('dashboard')">返回首页</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="content">
      <div class="page-header">
        <h2>📝 实名举报</h2>
        <p class="text-muted">您的举报信息将严格保密，所有数据端到端加密存储</p>
      </div>

      <div id="reportError" class="error-box" style="display:none;"></div>

      <div class="form-card">
        <form id="reportForm">
          <h3 class="form-title">举报人信息（实名必填）</h3>
          <div class="form-row">
            <div class="form-group">
              <label>真实姓名 <span class="required">*</span></label>
              <input type="text" name="reporter_name" required placeholder="请输入真实姓名" class="form-control" id="report_name">
            </div>
            <div class="form-group">
              <label>联系电话 <span class="required">*</span></label>
              <input type="tel" name="reporter_phone" required placeholder="请输入手机号码" class="form-control" id="report_phone">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>身份证号 <span class="required">*</span></label>
              <input type="text" name="reporter_idcard" required placeholder="请输入身份证号" class="form-control" id="report_idcard">
            </div>
            <div class="form-group">
              <label>所在地区</label>
              <input type="text" name="location" placeholder="如：北京市朝阳区" class="form-control" id="report_location">
            </div>
          </div>

          <h3 class="form-title">诈骗信息</h3>
          <div class="form-row">
            <div class="form-group">
              <label>诈骗类型 <span class="required">*</span></label>
              <select name="fraud_type" required class="form-control" id="report_fraudtype">
                <option value="">请选择诈骗类型</option>
                <option value="刷单返利">刷单返利诈骗</option>
                <option value="冒充公检法">冒充公检法诈骗</option>
                <option value="AI换脸诈骗">AI换脸诈骗</option>
                <option value="虚假投资理财">虚假投资理财诈骗</option>
                <option value="杀猪盘">杀猪盘诈骗</option>
                <option value="冒充客服">冒充客服退款诈骗</option>
                <option value="虚假贷款">虚假贷款诈骗</option>
                <option value="冒充领导">冒充领导熟人诈骗</option>
                <option value="其他">其他类型</option>
              </select>
            </div>
            <div class="form-group">
              <label>涉诈号码/链接</label>
              <input type="text" name="fraud_number" placeholder="诈骗电话、网址、APP包名等" class="form-control" id="report_number">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>诈骗金额（元）</label>
              <input type="number" name="fraud_amount" placeholder="如被骗请填写金额" class="form-control" id="report_amount">
            </div>
            <div class="form-group">
              <label>风险等级</label>
              <select name="risk_level" class="form-control" id="report_risk">
                <option value="待评估">待评估</option>
                <option value="高危">高危</option>
                <option value="中危">中危</option>
                <option value="低危">低危</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>诈骗经过描述 <span class="required">*</span></label>
            <textarea name="description" rows="5" required placeholder="请详细描述被骗经过，包括时间、地点、对方话术、转账过程等" class="form-control" id="report_desc"></textarea>
          </div>

          <h3 class="form-title">多模态证据上传</h3>
          <div class="upload-area">
            <p class="text-muted">支持截图、录音、通话记录、短信截图等证据上传（单个文件最大 50MB）</p>
            <div class="form-row">
              <div class="form-group">
                <label>证据类型</label>
                <select name="evidence_type" class="form-control" id="evidence_type">
                  <option value="screenshot">截图</option>
                  <option value="audio">录音</option>
                  <option value="sms">短信记录</option>
                  <option value="call">通话记录</option>
                  <option value="video">视频</option>
                  <option value="document">文档</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div class="form-group">
                <label>选择文件</label>
                <input type="file" name="evidence_file" multiple class="form-control" id="evidenceFiles">
              </div>
            </div>
            <div id="fileList"></div>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="navigate('dashboard')">取消</button>
            <button type="button" class="btn btn-primary" onclick="submitReport()">提交举报</button>
          </div>
        </form>
      </div>
    </section>
  `;
}

function clearReportResult() {
  state.reportResult = null;
  render();
}

async function submitReport() {
  const errorDiv = document.getElementById('reportError');
  
  const reporter_name = document.getElementById('report_name').value.trim();
  const reporter_phone = document.getElementById('report_phone').value.trim();
  const reporter_idcard = document.getElementById('report_idcard').value.trim();
  const fraud_type = document.getElementById('report_fraudtype').value;
  const description = document.getElementById('report_desc').value.trim();
  
  if (!reporter_name) {
    errorDiv.textContent = '❌ 请输入真实姓名';
    errorDiv.style.display = 'block';
    return;
  }
  if (!reporter_phone) {
    errorDiv.textContent = '❌ 请输入联系电话';
    errorDiv.style.display = 'block';
    return;
  }
  if (!reporter_idcard) {
    errorDiv.textContent = '❌ 请输入身份证号';
    errorDiv.style.display = 'block';
    return;
  }
  if (!fraud_type) {
    errorDiv.textContent = '❌ 请选择诈骗类型';
    errorDiv.style.display = 'block';
    return;
  }
  if (!description) {
    errorDiv.textContent = '❌ 请描述诈骗经过';
    errorDiv.style.display = 'block';
    return;
  }
  
  errorDiv.style.display = 'none';

  try {
    const data = {
      reporter_name,
      reporter_phone,
      reporter_idcard,
      fraud_type,
      description,
      fraud_number: document.getElementById('report_number').value.trim(),
      fraud_amount: Number(document.getElementById('report_amount').value) || 0,
      risk_level: document.getElementById('report_risk').value,
      location: document.getElementById('report_location').value.trim()
    };

    const result = await apiRequest(apiUrl('/api/reports'), {
      method: 'POST',
      body: JSON.stringify(data)
    });

    const files = document.getElementById('evidenceFiles').files;
    if (files.length > 0 && result.id) {
      const uploadForm = new FormData();
      uploadForm.append('type', document.getElementById('evidence_type').value || 'other');
      for (let i = 0; i < files.length; i++) {
        uploadForm.append('files', files[i]);
      }
      try {
        await apiRequest(apiUrl(`/api/reports/${result.id}/evidences`), {
          method: 'POST',
          body: uploadForm,
          headers: {}
        });
      } catch (e) {
        console.warn('Evidence upload warning:', e);
      }
    }

    state.reportResult = {
      ...result,
      fraud_type
    };
    render();
    form.reset();
  } catch (error) {
    alert('提交失败：' + error.message);
  }
}

function renderVerifyPage() {
  return `
    <section class="content">
      <div class="page-header">
        <h2>🔍 号码/链接实时核验</h2>
        <p class="text-muted">快速识别涉诈电话号码、网址、域名、APP包名等风险</p>
      </div>

      <div class="form-card">
        <div class="verify-tabs">
          <button class="tab-btn active" data-type="phone">📱 电话号码</button>
          <button class="tab-btn" data-type="domain">🌐 域名/网址</button>
          <button class="tab-btn" data-type="package">📦 APP包名</button>
          <button class="tab-btn" data-type="url">🔗 URL链接</button>
        </div>

        <form id="verifyForm" onsubmit="event.preventDefault(); verifyResource();">
          <input type="hidden" name="type" id="verifyType" value="phone">
          <div class="form-group">
            <label id="verifyLabel">请输入电话号码</label>
            <div class="verify-input-group">
              <input type="text" name="value" id="verifyValue" required placeholder="如：+86-13800138000" class="form-control">
              <button type="submit" class="btn btn-primary">立即核验</button>
            </div>
          </div>

          <div class="form-group">
            <label>批量核验（每行一个，最多20个）</label>
            <textarea name="batch_values" id="batchValues" rows="4" placeholder="每行一个号码或链接，支持混合类型自动识别" class="form-control"></textarea>
            <button type="button" class="btn btn-secondary btn-sm" onclick="batchVerify()">批量核验</button>
          </div>
        </form>
      </div>

      <div id="verifyResult"></div>

      <div class="form-card">
        <h3 class="form-title">核验说明</h3>
        <ul class="info-list">
          <li>🔴 高危：已确认涉诈，请勿任何操作，建议举报</li>
          <li>🟡 中危：存在风险嫌疑，请提高警惕，谨慎操作</li>
          <li>🟢 安全：暂无风险记录，但仍需保持警惕</li>
          <li>📊 核验数据来源于公安通报、银行风控、群众举报等多渠道</li>
          <li>🔒 所有核验记录留痕，满足司法审计要求</li>
        </ul>
      </div>
    </section>
  `;
}

async function verifyResource() {
  try {
    const type = document.getElementById('verifyType').value;
    const value = document.getElementById('verifyValue').value;
    const result = await apiRequest(apiUrl(`/api/verify?type=${type}&value=${encodeURIComponent(value)}`));
    renderVerifyResult([result]);
  } catch (error) {
    document.getElementById('verifyResult').innerHTML = renderError('核验失败：' + error.message);
  }
}

async function batchVerify() {
  try {
    const text = document.getElementById('batchValues').value.trim();
    if (!text) return;
    const lines = text.split('\n').filter(l => l.trim()).slice(0, 20);
    const items = lines.map(line => {
      const value = line.trim();
      let type = 'phone';
      if (value.startsWith('http://') || value.startsWith('https://')) type = 'url';
      else if (value.includes('.') && !value.includes('@')) type = 'domain';
      else if (value.startsWith('com.') || value.startsWith('cn.')) type = 'package';
      return { type, value };
    });
    const data = await apiRequest(apiUrl('/api/verify/batch'), {
      method: 'POST',
      body: JSON.stringify({ items })
    });
    renderVerifyResult(data.results);
  } catch (error) {
    document.getElementById('verifyResult').innerHTML = renderError('批量核验失败：' + error.message);
  }
}

function getDisposalSuggestion(is_fraud, risk_level) {
  if (is_fraud) {
    if (risk_level === '高危') {
      return '立即停止所有联系，请勿转账汇款，保存相关证据并拨打110报警或通过本平台举报';
    }
    return '提高警惕，切勿轻信，请勿提供个人信息或转账，建议进一步核实';
  }
  return '当前未发现风险，但仍需保持警惕，涉及转账请多方核实';
}

function renderVerifyResult(results) {
  const div = document.getElementById('verifyResult');
  div.innerHTML = `
    <div class="form-card">
      <h3 class="form-title">核验结果</h3>
      <div class="verify-results">
        ${results.map(r => `
          <div class="verify-result-item">
            <div class="verify-result-header">
              <span class="verify-value">${r.value}</span>
              <span class="${riskClass(r.risk_level)}">${r.is_fraud ? '⚠️ 涉诈风险' : '✅ 暂无风险'}</span>
            </div>
            <div class="verify-result-detail">
              <div class="detail-grid">
                <div class="detail-item">
                  <span class="detail-label">资源类型</span>
                  <span class="detail-value">${r.type === 'phone' ? '电话号码' : r.type === 'domain' ? '域名' : r.type === 'url' ? 'URL链接' : r.type === 'package' ? 'APP包名' : r.type}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">风险等级</span>
                  <span class="detail-value ${riskClass(r.risk_level)}">${r.risk_level}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">风险评分</span>
                  <span class="detail-value">${r.risk_score}/100</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">核验时间</span>
                  <span class="detail-value">${new Date().toLocaleString('zh-CN')}</span>
                </div>
              </div>
              <div style="margin-top: 12px;">
                <p><strong>风险说明：</strong>${r.description}</p>
                ${r.source ? `<p><strong>数据来源：</strong>${r.source}</p>` : ''}
                <p><strong>处置建议：</strong><span style="color: ${r.is_fraud ? '#dc2626' : '#16a34a'};">${getDisposalSuggestion(r.is_fraud, r.risk_level)}</span></p>
              </div>
              <div class="audit-note" style="margin-top: 12px; padding: 8px; background: #f3f4f6; border-radius: 6px; font-size: 12px; color: #6b7280;">
                🔒 本次核验已记录留痕，满足司法审计要求
              </div>
            </div>
            ${r.is_fraud ? `<button class="btn btn-danger btn-sm" onclick="quickReport('${r.type}', '${r.value}')">立即举报</button>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function quickReport(type, value) {
  state.reportForm = { fraud_type: '其他', fraud_number: value };
  navigate('report');
}

async function renderKnowledgePage() {
  try {
    const [graph, warnings] = await Promise.all([
      apiRequest(apiUrl('/api/knowledge-graph')),
      apiRequest(apiUrl('/api/warnings'))
    ]);

    const categories = graph.filter(n => n.node_type === 'category');
    const subtypes = graph.filter(n => n.node_type === 'subtype');
    const preventions = graph.filter(n => n.node_type === 'prevention');

    return `
      <section class="content">
        <div class="page-header">
          <h2>📚 反诈知识图谱</h2>
          <p class="text-muted">系统学习反诈知识，动态生成个性化预警提示</p>
        </div>

        <div class="warnings-panel">
          <h3 class="section-title">🔔 个性化预警提示</h3>
          <div class="warnings-grid">
            ${warnings.map(w => `
              <div class="warning-card ${w.risk_level === '警示' ? 'high' : ''}">
                <div class="warning-icon">${w.risk_level === '警示' ? '⚠️' : '💡'}</div>
                <div class="warning-content">
                  <strong>${w.risk_level}</strong>
                  <p>${w.content}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-card">
          <h3 class="form-title">诈骗类型图谱</h3>
          <div class="knowledge-grid">
            ${categories.map(cat => `
              <div class="knowledge-card">
                <div class="knowledge-header">
                  <span class="knowledge-icon">${getCategoryIcon(cat.title)}</span>
                  <h4>${cat.title}</h4>
                  ${cat.metadata ? `<span class="risk-badge">${JSON.parse(cat.metadata).risk || ''}风险</span>` : ''}
                </div>
                <p class="knowledge-desc">${cat.content}</p>
                <div class="knowledge-subtypes">
                  <strong>常见手段：</strong>
                  <div class="tag-list">
                    ${subtypes.filter(s => s.parent_id === cat.id).map(s => `
                      <span class="tag">${s.title}</span>
                    `).join('')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-card">
          <h3 class="form-title">三防原则</h3>
          <div class="prevention-grid">
            ${preventions.map(p => `
              <div class="prevention-card">
                <div class="prevention-icon">🛡️</div>
                <h4>${p.title}</h4>
                <p>${p.content}</p>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="form-card">
          <h3 class="form-title">全国涉诈资源分布</h3>
          <div id="resourceStats">${await renderResourceStats()}</div>
        </div>
      </section>
    `;
  } catch (error) {
    return renderError('加载知识图谱失败：' + error.message);
  }
}

function getCategoryIcon(title) {
  const icons = {
    '刷单返利诈骗': '💰', '冒充公检法诈骗': '👮', 'AI换脸诈骗': '🤖',
    '虚假投资理财': '📈', '杀猪盘': '💔', '冒充客服': '📞',
    '虚假贷款': '💸', '冒充领导': '👔', '其他': '❓'
  };
  return icons[title] || '⚠️';
}

async function renderResourceStats() {
  try {
    const resources = await apiRequest(apiUrl('/api/fraud-resources?pageSize=100'));
    const typeCount = {};
    resources.forEach(r => { typeCount[r.type] = (typeCount[r.type] || 0) + 1; });
    const typeLabels = { phone: '电话号码', domain: '域名', url: 'URL链接', package: 'APP包名' };
    return `
      <div class="stats-grid">
        ${Object.entries(typeCount).map(([type, count]) => `
          <div class="stat-item">
            <span class="stat-label">${typeLabels[type] || type}</span>
            <strong class="stat-value">${count}</strong>
          </div>
        `).join('')}
      </div>
      <div class="resource-list">
        ${resources.slice(0, 10).map(r => `
          <div class="resource-item">
            <span class="resource-type">${typeLabels[r.type] || r.type}</span>
            <span class="resource-value">${r.value}</span>
            <span class="${riskClass(r.risk_level)}">${r.risk_level}</span>
          </div>
        `).join('')}
      </div>
    `;
  } catch (e) {
    return '暂无数据';
  }
}

async function renderQuizPage() {
  try {
    const quizzes = await apiRequest(apiUrl('/api/quizzes?limit=5'));
    state.currentQuiz = quizzes;
    state.quizScore = 0;
    state.quizTotal = quizzes.length;
    return renderQuizQuestion(0, null);
  } catch (error) {
    return renderError('加载题目失败：' + error.message);
  }
}

function renderQuizQuestion(index, lastResult) {
  const quizzes = state.currentQuiz;
  if (!quizzes || index >= quizzes.length) {
    return `
      <section class="content">
        <div class="page-header">
          <h2>🎯 情景模拟答题</h2>
          <p class="text-muted">通过真实案例场景，测试你的反诈识别能力</p>
        </div>
        <div class="form-card text-center">
          <div class="quiz-complete">
            <div class="quiz-score-circle">
              <span class="score-number">${state.quizScore}</span>
              <span class="score-total">/${state.quizTotal}</span>
            </div>
            <h3>答题完成！</h3>
            <p>正确率：${Math.round(state.quizScore / state.quizTotal * 100)}%</p>
            <p class="text-muted">${getQuizComment(state.quizScore, state.quizTotal)}</p>
            <div class="form-actions">
              <button class="btn btn-secondary" onclick="navigate('knowledge')">学习知识</button>
              <button class="btn btn-primary" onclick="render();">重新答题</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  const q = quizzes[index];
  return `
    <section class="content">
      <div class="page-header">
        <h2>🎯 情景模拟答题</h2>
        <p class="text-muted">通过真实案例场景，测试你的反诈识别能力</p>
      </div>

      <div class="quiz-progress">
        <div class="progress-bar" style="width: ${(index + 1) / quizzes.length * 100}%"></div>
        <span class="progress-text">第 ${index + 1} / ${quizzes.length} 题</span>
      </div>

      ${lastResult ? `
        <div class="quiz-result ${lastResult.is_correct ? 'correct' : 'wrong'}">
          <h4>${lastResult.is_correct ? '✅ 回答正确！' : '❌ 回答错误！'}</h4>
          <p><strong>正确答案：</strong>${q.options[q.correct_answer]}</p>
          <p><strong>解析：</strong>${lastResult.explanation}</p>
        </div>
      ` : ''}

      <div class="form-card">
        <div class="quiz-header">
          <span class="quiz-difficulty ${q.difficulty}">${q.difficulty === 'easy' ? '简单' : q.difficulty === 'medium' ? '中等' : '困难'}</span>
          <span class="quiz-tag">${q.tags || ''}</span>
        </div>
        <h3 class="quiz-title">${q.title}</h3>
        <div class="quiz-scenario">
          <p>📖 <strong>情景：</strong>${q.scenario}</p>
        </div>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="option-btn ${lastResult ? (i === q.correct_answer ? 'correct' : i === lastResult.user_answer ? 'wrong' : 'disabled') : ''}"
                    ${lastResult ? 'disabled' : ''}
                    onclick="submitAnswer(${index}, ${i})">
              <span class="option-letter">${String.fromCharCode(65 + i)}</span>
              <span class="option-text">${opt}</span>
            </button>
          `).join('')}
        </div>
        ${lastResult ? `
          <div class="form-actions">
            <button class="btn btn-primary" onclick="window.quizNext(${index + 1})">下一题</button>
          </div>
        ` : ''}
      </div>
    </section>
  `;
}

function getQuizComment(score, total) {
  const pct = score / total;
  if (pct >= 0.9) return '🏆 太棒了！您的反诈意识非常强，继续保持！';
  if (pct >= 0.7) return '👍 不错！您有较好的反诈意识，建议多学习巩固。';
  if (pct >= 0.5) return '⚠️ 需加强！您的反诈意识有待提高，请认真学习反诈知识。';
  return '🚨 危险！您的反诈意识严重不足，请立即学习反诈知识！';
}

async function submitAnswer(quizIndex, answer) {
  try {
    const q = state.currentQuiz[quizIndex];
    const result = await apiRequest(apiUrl(`/api/quizzes/${q.id}/answer`), {
      method: 'POST',
      body: JSON.stringify({ answer })
    });
    if (result.is_correct) state.quizScore++;
    const content = renderQuizQuestion(quizIndex, { ...result, user_answer: answer });
    app.innerHTML = renderHeader() + content;
    bindTabEvents();
  } catch (error) {
    alert('提交失败：' + error.message);
  }
}

function quizNext(nextIndex) {
  const content = renderQuizQuestion(nextIndex, null);
  app.innerHTML = renderHeader() + content;
  bindTabEvents();
}

function renderLoginPage() {
  return `
    <section class="content">
      <div class="login-container">
        <div class="login-card">
          <h2>🔐 登录管理后台</h2>
          <p class="text-muted">仅限公安干警、平台管理员登录</p>
          <div id="loginError" class="error-box" style="display:none;"></div>
          <form id="loginForm">
            <div class="form-group">
              <label>用户名 <span class="required">*</span></label>
              <input type="text" name="username" required class="form-control" placeholder="请输入用户名" id="loginUsername">
            </div>
            <div class="form-group">
              <label>密码 <span class="required">*</span></label>
              <input type="password" name="password" required class="form-control" placeholder="请输入密码" id="loginPassword">
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" onclick="navigate('dashboard')">取消</button>
              <button type="button" class="btn btn-primary" onclick="doLogin()">登录</button>
            </div>
          </form>
          <div class="login-hint">
            <p>测试账号：</p>
            <p>超级管理员：admin / admin123</p>
            <p>北京管理员：beijing_admin / 123456</p>
            <p>办案民警：police01 / 123456</p>
          </div>
        </div>
      </div>
    </section>
  `;
}

async function doLogin() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const errorDiv = document.getElementById('loginError');
  
  if (!username) {
    errorDiv.textContent = '❌ 请输入用户名';
    errorDiv.style.display = 'block';
    return;
  }
  if (!password) {
    errorDiv.textContent = '❌ 请输入密码';
    errorDiv.style.display = 'block';
    return;
  }
  
  try {
    const result = await apiRequest(apiUrl('/api/auth/login'), {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    state.token = result.token;
    state.user = result.user;
    localStorage.setItem('antifraud_token', result.token);
    errorDiv.style.display = 'none';
    navigate('admin');
  } catch (error) {
    errorDiv.textContent = '❌ 登录失败：' + (error.message || '用户名或密码错误');
    errorDiv.style.display = 'block';
  }
}

async function logout() {
  try {
    await apiRequest(apiUrl('/api/auth/logout'), { method: 'POST' });
  } catch (e) {}
  state.token = null;
  state.user = null;
  localStorage.removeItem('antifraud_token');
  navigate('dashboard');
}

async function renderAdminPage() {
  if (!state.user) {
    navigate('login');
    return;
  }

  try {
    const [reports, tasks, resources, stats] = await Promise.all([
      apiRequest(apiUrl('/api/reports?pageSize=20')),
      apiRequest(apiUrl('/api/tasks')),
      apiRequest(apiUrl('/api/fraud-resources?pageSize=10')),
      apiRequest(apiUrl('/api/stats'))
    ]);

    return `
      <section class="content">
        <div class="page-header">
          <h2>⚙️ 管理后台</h2>
          <p class="text-muted">欢迎，${state.user.real_name || state.user.username} | ${state.user.role === 'super_admin' ? '超级管理员' : state.user.role === 'admin' ? '管理员' : '办案民警'}</p>
        </div>

        <div class="admin-tabs">
          <button class="admin-tab active" data-tab="reports">📋 举报管理</button>
          <button class="admin-tab" data-tab="tasks">📌 任务分派</button>
          <button class="admin-tab" data-tab="resources">🚫 涉诈资源库</button>
          <button class="admin-tab" data-tab="cases">🔍 案件管理</button>
          <button class="admin-tab" data-tab="stats">📊 统计分析</button>
          ${state.user.role === 'super_admin' ? `
            <button class="admin-tab" data-tab="audit">📜 审计日志</button>
            <button class="admin-tab" data-tab="system">💻 系统信息</button>
          ` : ''}
        </div>

        <div class="admin-panel" id="adminPanel">
          ${renderAdminReports(reports)}
        </div>
      </section>
      ${renderReportDetailModal()}
    `;
  } catch (error) {
    return renderError('加载管理后台失败：' + error.message);
  }
}

function renderAdminReports(reports) {
  return `
    <div class="form-card">
      <div class="section-title">
        <h3>举报线索管理</h3>
        <div>
          <select class="form-control form-control-sm" onchange="filterReports(this.value)">
            <option value="">全部状态</option>
            <option value="待受理">待受理</option>
            <option value="核查中">核查中</option>
            <option value="已立案">已立案</option>
            <option value="已反馈">已反馈</option>
            <option value="已归档">已归档</option>
          </select>
        </div>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>举报编号</th>
              <th>类型</th>
              <th>举报人</th>
              <th>金额</th>
              <th>风险</th>
              <th>状态</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${reports.map(r => `
              <tr>
                <td>${r.report_no}</td>
                <td>${r.fraud_type}</td>
                <td>${r.reporter_name || '匿名'}</td>
                <td>${formatMoney(r.fraud_amount)}</td>
                <td><span class="${riskClass(r.risk_level)}">${r.risk_level}</span></td>
                <td><span class="${statusClass(r.status)}">${r.status}</span></td>
                <td>${formatDate(r.created_at)}</td>
                <td>
                  <button class="btn btn-sm btn-primary" onclick="viewReport(${r.id})">详情</button>
                  <button class="btn btn-sm btn-secondary" onclick="updateReportStatus(${r.id})">处理</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function viewReport(id) {
  try {
    const report = await apiRequest(apiUrl(`/api/reports/${id}`));
    state.viewingReport = report;
    render();
  } catch (e) {
    alert('加载详情失败');
  }
}

function closeReportDetail() {
  state.viewingReport = null;
  state.showStatusModal = null;
  render();
}

async function showStatusModal(id, currentStatus) {
  const report = state.viewingReport || { id, status: currentStatus };
  state.showStatusModal = { id, currentStatus: report.status };
  render();
}

async function submitStatusUpdate() {
  const id = state.showStatusModal.id;
  const status = document.getElementById('newStatus').value;
  const note = document.getElementById('statusNote').value;
  
  if (!status) {
    alert('请选择状态');
    return;
  }
  
  try {
    await apiRequest(apiUrl(`/api/reports/${id}/status`), {
      method: 'PUT',
      body: JSON.stringify({ status, note })
    });
    alert('状态更新成功');
    closeReportDetail();
  } catch (e) {
    alert('更新失败：' + e.message);
  }
}

async function createTaskFromReport(reportId) {
  const report = state.viewingReport;
  if (!report) return;
  
  const title = prompt('任务标题：', `处理举报 ${report.report_no}`);
  if (!title) return;
  
  const assignee_name = prompt('负责人姓名：');
  
  try {
    await apiRequest(apiUrl('/api/tasks'), {
      method: 'POST',
      body: JSON.stringify({ 
        title, 
        description: `举报类型：${report.fraud_type}\n金额：${formatMoney(report.fraud_amount)}`,
        report_id: reportId,
        assignee_name
      })
    });
    alert('任务创建成功');
    closeReportDetail();
  } catch (e) {
    alert('创建失败：' + e.message);
  }
}

async function updateReportStatus(reportId) {
  await viewReport(reportId);
  showStatusModal(reportId);
}

function renderReportDetailModal() {
  const r = state.viewingReport;
  if (!r) return '';
  
  let statusModal = '';
  if (state.showStatusModal) {
    statusModal = `
      <div class="modal-overlay" onclick="closeReportDetail()">
        <div class="modal" onclick="event.stopPropagation()">
          <h3>更新举报状态</h3>
          <div class="form-group">
            <label>当前状态：${r.status}</label>
            <select id="newStatus" class="form-control">
              <option value="">选择新状态</option>
              <option value="待受理">待受理</option>
              <option value="核查中">核查中</option>
              <option value="已立案">已立案</option>
              <option value="已反馈">已反馈</option>
              <option value="已归档">已归档</option>
            </select>
          </div>
          <div class="form-group">
            <label>处理备注</label>
            <textarea id="statusNote" class="form-control" rows="3" placeholder="请输入处理备注..."></textarea>
          </div>
          <div class="form-actions">
            <button class="btn btn-secondary" onclick="closeReportDetail()">取消</button>
            <button class="btn btn-primary" onclick="submitStatusUpdate()">确认更新</button>
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <div class="modal-overlay" onclick="closeReportDetail()">
      <div class="modal modal-large" onclick="event.stopPropagation()">
        <div class="modal-header">
          <h3>📋 举报详情</h3>
          <button class="btn btn-secondary btn-sm" onclick="closeReportDetail()">✕</button>
        </div>
        <div class="modal-body">
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">举报编号</span>
              <span class="detail-value">${r.report_no}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">诈骗类型</span>
              <span class="detail-value">${r.fraud_type}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">风险等级</span>
              <span class="detail-value"><span class="${riskClass(r.risk_level)}">${r.risk_level}</span></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">当前状态</span>
              <span class="detail-value"><span class="${statusClass(r.status)}">${r.status}</span></span>
            </div>
            <div class="detail-item">
              <span class="detail-label">诈骗金额</span>
              <span class="detail-value">${formatMoney(r.fraud_amount)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">提交时间</span>
              <span class="detail-value">${formatDate(r.created_at)}</span>
            </div>
          </div>
          
          <h4 style="margin-top:24px;">举报人信息</h4>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">姓名</span>
              <span class="detail-value">${r.reporter_name || '未填写'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">联系电话</span>
              <span class="detail-value">${r.reporter_phone || '未填写'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">身份证号</span>
              <span class="detail-value">${r.reporter_idcard || '未填写'}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">所在地区</span>
              <span class="detail-value">${r.location || '未填写'}</span>
            </div>
          </div>
          
          <h4 style="margin-top:24px;">诈骗描述</h4>
          <div style="background:#f5f5f5;padding:16px;border-radius:8px;">
            ${r.description || '无描述'}
          </div>
          
          ${r.evidences && r.evidences.length > 0 ? `
            <h4 style="margin-top:24px;">证据文件 (${r.evidences.length}个)</h4>
            <div class="evidence-list">
              ${r.evidences.map(e => `
                <div class="evidence-item">
                  <span>📄 ${e.file_name || '证据文件'}</span>
                  <span class="text-muted">${e.type}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          ${r.flow && r.flow.length > 0 ? `
            <h4 style="margin-top:24px;">处理流程</h4>
            <div class="flow-timeline">
              ${r.flow.map(f => `
                <div class="flow-item">
                  <div class="flow-time">${formatDate(f.created_at)}</div>
                  <div class="flow-action">${f.action}</div>
                  ${f.operator_name ? `<div class="flow-operator">操作人：${f.operator_name}</div>` : ''}
                  ${f.note ? `<div class="flow-note">${f.note}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="closeReportDetail()">关闭</button>
          <button class="btn btn-primary" onclick="createTaskFromReport(${r.id})">📌 创建任务</button>
          <button class="btn btn-primary" onclick="showStatusModal(${r.id}, '${r.status}')">🔄 更新状态</button>
        </div>
      </div>
    </div>
    ${statusModal}
  `;
}

async function filterReports(status) {
  try {
    const url = status ? `/api/reports?status=${encodeURIComponent(status)}` : '/api/reports';
    const reports = await apiRequest(apiUrl(url));
    document.getElementById('adminPanel').innerHTML = renderAdminReports(reports);
  } catch (e) {
    alert('筛选失败');
  }
}

async function loadAdminTab(tab) {
  const panel = document.getElementById('adminPanel');
  try {
    switch (tab) {
      case 'reports':
        const reports = await apiRequest(apiUrl('/api/reports'));
        panel.innerHTML = renderAdminReports(reports);
        break;
      case 'tasks':
        const tasks = await apiRequest(apiUrl('/api/tasks'));
        panel.innerHTML = renderAdminTasks(tasks);
        break;
      case 'resources':
        const resources = await apiRequest(apiUrl('/api/fraud-resources'));
        panel.innerHTML = renderAdminResources(resources);
        break;
      case 'cases':
        const cases = await apiRequest(apiUrl('/api/cases'));
        panel.innerHTML = renderAdminCases(cases);
        break;
      case 'stats':
        const stats = await apiRequest(apiUrl('/api/stats'));
        const byRegion = await apiRequest(apiUrl('/api/reports/by-region'));
        panel.innerHTML = renderAdminStats(stats, byRegion);
        break;
      case 'audit':
        const logs = await apiRequest(apiUrl('/api/audit-logs'));
        const opLogs = await apiRequest(apiUrl('/api/operation-logs'));
        panel.innerHTML = renderAdminAudit(logs, opLogs);
        break;
      case 'system':
        const sysInfo = await apiRequest(apiUrl('/api/system-info'));
        panel.innerHTML = renderAdminSystem(sysInfo);
        break;
    }
  } catch (e) {
    panel.innerHTML = renderError('加载失败：' + e.message);
  }
}

function renderAdminTasks(tasks) {
  return `
    <div class="form-card">
      <div class="section-title">
        <h3>任务管理</h3>
        <button class="btn btn-sm btn-primary" onclick="createTask()">+ 新建任务</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>任务编号</th>
              <th>标题</th>
              <th>负责人</th>
              <th>优先级</th>
              <th>状态</th>
              <th>截止日期</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(t => `
              <tr>
                <td>${t.task_no}</td>
                <td>${t.title}</td>
                <td>${t.assignee_name || '未分配'}</td>
                <td><span class="${t.priority === 'high' ? 'risk high' : 'risk medium'}">${t.priority === 'high' ? '高' : t.priority === 'medium' ? '中' : '低'}</span></td>
                <td><span class="${statusClass(t.status)}">${t.status}</span></td>
                <td>${t.due_date || '-'}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="updateTaskStatus(${t.id})">更新状态</button>
                  <button class="btn btn-sm btn-primary" onclick="assignTask(${t.id})">分派</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function createTask() {
  const title = prompt('任务标题：');
  if (!title) return;
  const description = prompt('任务描述：');
  try {
    await apiRequest(apiUrl('/api/tasks'), {
      method: 'POST',
      body: JSON.stringify({ title, description })
    });
    alert('任务创建成功');
    loadAdminTab('tasks');
  } catch (e) {
    alert('创建失败');
  }
}

async function updateTaskStatus(id) {
  const status = prompt('请输入新状态（待处理/处理中/已完成）：');
  if (!status) return;
  try {
    await apiRequest(apiUrl(`/api/tasks/${id}/status`), {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
    alert('状态更新成功');
    loadAdminTab('tasks');
  } catch (e) {
    alert('更新失败');
  }
}

async function assignTask(id) {
  const assignee_name = prompt('请输入负责人姓名：');
  if (!assignee_name) return;
  try {
    await apiRequest(apiUrl(`/api/tasks/${id}/assign`), {
      method: 'PUT',
      body: JSON.stringify({ assignee_name })
    });
    alert('分派成功');
    loadAdminTab('tasks');
  } catch (e) {
    alert('分派失败');
  }
}

function renderAdminResources(resources) {
  const typeLabels = { phone: '电话号码', domain: '域名', url: 'URL链接', package: 'APP包名' };
  return `
    <div class="form-card">
      <div class="section-title">
        <h3>涉诈资源库</h3>
        <button class="btn btn-sm btn-primary" onclick="addResource()">+ 添加资源</button>
      </div>
      <div class="resource-filters">
        <button class="tab-btn active" onclick="filterResources('')">全部</button>
        <button class="tab-btn" onclick="filterResources('phone')">电话</button>
        <button class="tab-btn" onclick="filterResources('domain')">域名</button>
        <button class="tab-btn" onclick="filterResources('url')">URL</button>
        <button class="tab-btn" onclick="filterResources('package')">APP包</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>类型</th>
              <th>值</th>
              <th>风险等级</th>
              <th>来源</th>
              <th>首次发现</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            ${resources.map(r => `
              <tr>
                <td>${typeLabels[r.type] || r.type}</td>
                <td>${r.value}</td>
                <td><span class="${riskClass(r.risk_level)}">${r.risk_level}</span></td>
                <td>${r.source || '-'}</td>
                <td>${formatDate(r.first_seen)}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="editResource(${r.id})">编辑</button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function filterResources(type) {
  try {
    const url = type ? `/api/fraud-resources?type=${type}` : '/api/fraud-resources';
    const resources = await apiRequest(apiUrl(url));
    document.getElementById('adminPanel').innerHTML = renderAdminResources(resources);
  } catch (e) {
    alert('筛选失败');
  }
}

async function addResource() {
  const type = prompt('类型（phone/domain/url/package）：');
  const value = prompt('值：');
  const risk_level = prompt('风险等级（高危/中危/低危）：') || '高危';
  const description = prompt('描述：');
  const source = prompt('来源：');
  try {
    await apiRequest(apiUrl('/api/fraud-resources'), {
      method: 'POST',
      body: JSON.stringify({ type, value, risk_level, description, source })
    });
    alert('添加成功');
    loadAdminTab('resources');
  } catch (e) {
    alert('添加失败：' + e.message);
  }
}

async function editResource(id) {
  const risk_level = prompt('风险等级（高危/中危/低危）：');
  const status = prompt('状态（active/inactive）：');
  if (!risk_level && !status) return;
  try {
    await apiRequest(apiUrl(`/api/fraud-resources/${id}`), {
      method: 'PUT',
      body: JSON.stringify({ risk_level, status })
    });
    alert('更新成功');
    loadAdminTab('resources');
  } catch (e) {
    alert('更新失败');
  }
}

function renderAdminCases(cases) {
  return `
    <div class="form-card">
      <div class="section-title">
        <h3>案件管理</h3>
        <button class="btn btn-sm btn-primary" onclick="createCase()">+ 新建案件</button>
      </div>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>案件编号</th>
              <th>标题</th>
              <th>类型</th>
              <th>金额</th>
              <th>风险</th>
              <th>状态</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            ${cases.map(c => `
              <tr>
                <td>${c.case_no}</td>
                <td>${c.title}</td>
                <td>${c.type}</td>
                <td>${formatMoney(c.amount)}</td>
                <td><span class="${riskClass(c.risk_level)}">${c.risk_level}</span></td>
                <td><span class="${statusClass(c.status)}">${c.status}</span></td>
                <td>${formatDate(c.created_at)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

async function createCase() {
  const title = prompt('案件标题：');
  if (!title) return;
  const type = prompt('案件类型：');
  const amount = Number(prompt('涉案金额：') || 0);
  try {
    await apiRequest(apiUrl('/api/cases'), {
      method: 'POST',
      body: JSON.stringify({ title, type, amount })
    });
    alert('案件创建成功');
    loadAdminTab('cases');
  } catch (e) {
    alert('创建失败：' + e.message);
  }
}

function renderAdminStats(stats, byRegion) {
  return `
    <div class="stats-panels">
      <div class="form-card">
        <h3 class="form-title">按诈骗类型统计</h3>
        <div class="stats-bars">
          ${stats.reports_by_type.map(s => `
            <div class="stat-bar">
              <div class="stat-bar-label">${s.fraud_type}</div>
              <div class="stat-bar-track">
                <div class="stat-bar-fill" style="width: ${s.count / Math.max(...stats.reports_by_type.map(x => x.count)) * 100}%"></div>
              </div>
              <div class="stat-bar-value">${s.count}件 / ${formatMoney(s.amount)}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="form-card">
        <h3 class="form-title">按状态统计</h3>
        <div class="stats-grid">
          ${stats.reports_by_status.map(s => `
            <div class="stat-card">
              <span class="stat-card-label">${s.status}</span>
              <strong class="stat-card-value">${s.count}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="form-card">
        <h3 class="form-title">按风险等级统计</h3>
        <div class="stats-grid">
          ${stats.reports_by_risk.map(s => `
            <div class="stat-card">
              <span class="stat-card-label">${s.risk_level}</span>
              <strong class="stat-card-value ${riskClass(s.risk_level)}">${s.count}</strong>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="form-card">
        <h3 class="form-title">跨区域线索聚合</h3>
        <div class="region-list">
          ${byRegion.slice(0, 10).map(r => `
            <div class="region-item">
              <span>${r.location}</span>
              <div class="region-stats">
                <span>${r.count}件</span>
                <strong>${formatMoney(r.total_amount)}</strong>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderAdminAudit(logs, opLogs) {
  return `
    <div class="form-card">
      <h3 class="form-title">审计日志（操作留痕，满足司法审计要求）</h3>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>用户</th>
              <th>操作</th>
              <th>资源</th>
              <th>IP</th>
              <th>详情</th>
            </tr>
          </thead>
          <tbody>
            ${logs.slice(0, 20).map(l => `
              <tr>
                <td>${formatDate(l.created_at)}</td>
                <td>${l.user_id || '匿名'}</td>
                <td>${l.action}</td>
                <td>${l.resource_type || '-'}</td>
                <td>${l.ip_address || '-'}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;">${l.details || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <h3 class="form-title" style="margin-top:24px;">数据变更记录</h3>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>用户</th>
              <th>操作</th>
              <th>表</th>
              <th>记录ID</th>
            </tr>
          </thead>
          <tbody>
            ${opLogs.slice(0, 20).map(l => `
              <tr>
                <td>${formatDate(l.created_at)}</td>
                <td>${l.user_id || '系统'}</td>
                <td>${l.operation}</td>
                <td>${l.table_name}</td>
                <td>${l.record_id || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderAdminSystem(sysInfo) {
  return `
    <div class="form-card">
      <h3 class="form-title">系统信息</h3>
      <div class="system-info">
        <div class="info-row">
          <span class="info-label">系统版本</span>
          <span class="info-value">${sysInfo.version}</span>
        </div>
        <div class="info-row">
          <span class="info-label">加密算法</span>
          <span class="info-value">${sysInfo.encryption}</span>
        </div>
        <div class="info-row">
          <span class="info-label">数据库</span>
          <span class="info-value">${sysInfo.database}</span>
        </div>
        <div class="info-row">
          <span class="info-label">安全等级</span>
          <span class="info-value">${sysInfo.security_level}</span>
        </div>
      </div>
      <h3 class="form-title" style="margin-top:24px;">预留 API 接口</h3>
      <div class="api-list">
        ${sysInfo.apis.map(api => `
          <div class="api-item">
            <div class="api-header">
              <strong>${api.name}</strong>
              <span class="api-status ${api.status}">${api.status}</span>
            </div>
            <p>${api.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function bindTabEvents() {
  document.querySelectorAll('.tab-btn[data-type]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn[data-type]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type;
      document.getElementById('verifyType').value = type;
      const labels = { phone: '请输入电话号码', domain: '请输入域名', package: '请输入APP包名', url: '请输入URL链接' };
      const placeholders = { phone: '+86-13800138000', domain: 'fake-bank.com', package: 'com.fake.alipay', url: 'http://example.com' };
      document.getElementById('verifyLabel').textContent = labels[type];
      document.getElementById('verifyValue').placeholder = placeholders[type];
    });
  });

  document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      loadAdminTab(tab.dataset.tab);
    });
  });

  document.querySelectorAll('a.nav-item').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.getAttribute('href').slice(1);
      navigate(route);
    });
  });

  const fileInput = document.getElementById('evidenceFiles');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const list = document.getElementById('fileList');
      list.innerHTML = Array.from(e.target.files).map(f => `
        <div class="file-item">📄 ${f.name} (${Math.round(f.size / 1024)} KB)</div>
      `).join('');
    });
  }
}

async function render() {
  const route = getRouteFromHash();
  state.currentRoute = route;

  let content = '';
  app.innerHTML = renderHeader() + renderLoading();

  try {
    switch (route) {
      case 'dashboard':
        content = await renderDashboard();
        break;
      case 'report':
        content = renderReportPage();
        break;
      case 'verify':
        content = renderVerifyPage();
        break;
      case 'knowledge':
        content = await renderKnowledgePage();
        break;
      case 'quiz':
        content = await renderQuizPage();
        break;
      case 'login':
        content = renderLoginPage();
        break;
      case 'admin':
        content = await renderAdminPage();
        break;
      default:
        content = await renderDashboard();
    }
  } catch (error) {
    content = renderError(error.message);
  }

  app.innerHTML = renderHeader() + content;
  bindTabEvents();
}

window.navigate = navigate;
window.submitReport = submitReport;
window.clearReportResult = clearReportResult;
window.verifyResource = verifyResource;
window.batchVerify = batchVerify;
window.quickReport = quickReport;
window.submitAnswer = submitAnswer;
window.quizNext = quizNext;
window.doLogin = doLogin;
window.logout = logout;
window.viewReport = viewReport;
window.closeReportDetail = closeReportDetail;
window.showStatusModal = showStatusModal;
window.submitStatusUpdate = submitStatusUpdate;
window.createTaskFromReport = createTaskFromReport;
window.updateReportStatus = updateReportStatus;
window.filterReports = filterReports;
window.createTask = createTask;
window.updateTaskStatus = updateTaskStatus;
window.assignTask = assignTask;
window.filterResources = filterResources;
window.addResource = addResource;
window.editResource = editResource;
window.createCase = createCase;

window.addEventListener('hashchange', render);
render();
