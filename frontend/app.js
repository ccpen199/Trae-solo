创建请柬 → 添加收件人 → 发送请柬（自动生成订单+设计师30%分成）
    ↓
收件人打开（记录经纬度） → 热力图 → 祝福墙（待审核）
    ↓
导出收件人 → 后台审核模板/祝福 → 分成结算 → 操作日志记录创建请柬 → 添加收件人 → 发送请柬（自动生成订单+设计师30%分成）
    ↓
收件人打开（记录经纬度） → 热力图 → 祝福墙（待审核）
    ↓
导出收件人 → 后台审核模板/祝福 → 分成结算 → 操作日志记录创建请柬 → 添加收件人 → 发送请柬（自动生成订单+设计师30%分成）
    ↓
收件人打开（记录经纬度） → 热力图 → 祝福墙（待审核）
    ↓
导出收件人 → 后台审核模板/祝福 → 分成结算 → 操作日志记录创建请柬 → 添加收件人 → 发送请柬（自动生成订单+设计师30%分成）
    ↓
收件人打开（记录经纬度） → 热力图 → 祝福墙（待审核）
    ↓
导出收件人 → 后台审核模板/祝福 → 分成结算 → 操作日志记录const state = {
  user: null,
  token: null,
  templates: [],
  categories: [],
  invitations: [],
  currentInvitation: null,
  editorTemplateId: null,
  editorElements: [],
  selectedElementId: null,
  dragState: null,
  recipients: [],
  blessings: [],
  heatmapData: [],
  stats: null,
  backendPort: Number(location.port) + 10000
};

const apiBase = `http://127.0.0.1:${state.backendPort}/api`;
const apiFallbackBase = `http://localhost:${state.backendPort}/api`;

function log(msg) {
  const box = document.getElementById('resultBox');
  if (box) box.textContent = JSON.stringify(msg, null, 2);
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  try {
    let res;
    try {
      res = await fetch(`${apiBase}${path}`, { ...options, headers });
    } catch (error) {
      res = await fetch(`${apiFallbackBase}${path}`, { ...options, headers });
    }
    const payload = await res.json();
    const data = payload && Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
    return { ok: res.ok && (!payload || payload.ok !== false), status: res.status, data, raw: payload };
  } catch (e) {
    return { ok: false, status: 0, data: { error: e.message } };
  }
}

function setUser(user, token) {
  state.user = user;
  state.token = token;
  localStorage.setItem('inv_user', JSON.stringify(user));
  localStorage.setItem('inv_token', token);
  document.getElementById('currentUser').textContent = user ? `${user.name} (${user.role})` : '-';
}

function loadStoredUser() {
  try {
    const u = localStorage.getItem('inv_user');
    const t = localStorage.getItem('inv_token');
    if (u && t) {
      state.user = JSON.parse(u);
      state.token = t;
      document.getElementById('currentUser').textContent = `${state.user.name} (${state.user.role})`;
    }
  } catch (e) {}
}

async function checkHealth() {
  document.getElementById('frontendUrl').textContent = `http://127.0.0.1:${location.port}`;
  document.getElementById('backendUrl').textContent = `http://127.0.0.1:${state.backendPort}`;
  const r = await request('/health');
  document.getElementById('healthState').textContent = r.ok ? '正常' : '异常';
  document.getElementById('healthState').style.color = r.ok ? '#11645b' : '#c0392b';
}

async function login(name, phone) {
  const r = await request('/auth/login', { method: 'POST', body: JSON.stringify({ name, phone }) });
  if (r.ok && r.data) {
    setUser(r.data.user, r.data.token);
    await loadTemplates();
    await loadCategories();
    await loadInvitations();
    if (state.user && state.user.role === 'admin') await loadAdmin();
    log({ message: '登录成功', user: r.data.user });
  } else {
    log({ error: '登录失败', detail: r.data });
  }
}

async function loadCategories() {
  const r = await request('/template-categories');
  if (r.ok && r.data) {
    state.categories = r.data;
    const sel = document.getElementById('categorySelect');
    sel.innerHTML = '<option value="">全部场景</option>' + r.data.map(c => `<option value="${c}">${c}</option>`).join('');
  }
}

function updateTemplateSelect() {
  const sel = document.getElementById('createInvTemplate');
  if (!sel) return;
  sel.innerHTML = '<option value="">不使用模板，从空白开始设计</option>' +
    state.templates.map(t => `<option value="${t.id}">${t.name} (${t.category} - ¥${t.price})</option>`).join('');
}

const sceneTags = ['中式', '西式', '简约', '浪漫', '喜庆', '温馨', '复古', '时尚'];

function getSceneTags(category) {
  const map = {
    '婚礼': ['中式', '西式', '浪漫', '喜庆'],
    '寿宴': ['喜庆', '温馨', '复古'],
    '满月': ['温馨', '可爱', '时尚'],
    '乔迁': ['简约', '喜庆', '温馨'],
    '升学': ['时尚', '简约', '喜庆']
  };
  return map[category] || ['简约', '温馨'];
}

async function loadTemplates(category = '', search = '', sceneTag = '', sortBy = 'default') {
  let url = '/templates';
  const params = new URLSearchParams();
  if (category) params.append('category', category);
  if (search) params.append('search', search);
  if (params.toString()) url += '?' + params.toString();
  const r = await request(url);
  if (r.ok && r.data) {
    let templates = r.data;

    if (sceneTag) {
      templates = templates.filter(t => {
        const tags = getSceneTags(t.category);
        return tags.includes(sceneTag);
      });
    }

    if (sortBy === 'use_count') {
      templates.sort((a, b) => (b.use_count || 0) - (a.use_count || 0));
    } else if (sortBy === 'sent_count') {
      templates.sort((a, b) => (b.sent_count || 0) - (a.sent_count || 0));
    } else if (sortBy === 'price_low') {
      templates.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_high') {
      templates.sort((a, b) => b.price - a.price);
    }

    state.templates = templates;
    renderTemplates();
    const sel = document.getElementById('editorTemplateSelect');
    sel.innerHTML = '<option value="">选择模板加载到编辑器</option>' +
      r.data.map(t => `<option value="${t.id}">${t.name} (${t.category})</option>`).join('');
    updateTemplateSelect();
    updateTemplateStats();
  }
}

function updateTemplateStats() {
  const total = state.templates.length;
  const totalUses = state.templates.reduce((sum, t) => sum + (t.use_count || 0), 0);
  const totalSents = state.templates.reduce((sum, t) => sum + (t.sent_count || 0), 0);
  const statsBox = document.getElementById('templateStatsSummary');
  if (statsBox) {
    statsBox.innerHTML = `
      <div><strong>${total}</strong>套主题模板</div>
      <div><strong>${totalUses}</strong>次使用</div>
      <div><strong>${totalSents}</strong>次发送</div>
    `;
  }
}

function renderTemplates() {
  const box = document.getElementById('templateList');
  if (!state.templates.length) {
    box.innerHTML = '<p class="muted">暂无模板，请先在后台添加。</p>';
    return;
  }
  box.innerHTML = state.templates.map(t => {
    const conversionRate = t.use_count > 0 ? Math.round((t.sent_count || 0) / t.use_count * 100) : 0;
    const scenes = getSceneTags(t.category);
    return `
    <div class="card">
      <div class="card-top">
        <span>${t.category}</span>
        <strong>¥${t.price}</strong>
      </div>
      <div>
        <h3>${t.name}</h3>
        <p>${t.description || '精美模板，可自定义文字和图片'}</p>
        <div class="meta">
          <span class="stat">设计师：${t.designer_name || '平台'}</span>
          <span class="stat">📊 使用 ${t.use_count || 0} 次</span>
          <span class="stat">📤 发送 ${t.sent_count || 0} 次</span>
          <span class="stat primary">转化率 ${conversionRate}%</span>
        </div>
        <div class="scenes">
          ${scenes.map(s => `<span class="scene-tag">${s}</span>`).join('')}
          <span class="conversion-rate">${conversionRate > 50 ? '🔥 高转化' : conversionRate > 30 ? '✨ 受欢迎' : '💎 精选'}</span>
        </div>
      </div>
      <div class="card-actions">
        <button type="button" onclick="loadEditorTemplate(${t.id})">预览模板</button>
        <button type="button" class="primary" onclick="createFromTemplate(${t.id})">使用此模板创建</button>
      </div>
    </div>
  `;
  }).join('');
}

async function loadEditorTemplate(templateId) {
  const r = await request(`/templates/${templateId}`);
  if (r.ok && r.data) {
    const t = r.data;
    state.editorTemplateId = t.id;
    document.getElementById('editorTemplateSelect').value = t.id;
    document.getElementById('invTitle').value = t.name;
    document.getElementById('invCategory').value = t.category;
    try {
      state.editorElements = JSON.parse(t.content || '[]');
    } catch (e) {
      state.editorElements = [
        { id: 1, type: 'text', x: 120, y: 60, text: t.name, fontSize: 28, color: '#11645b', fontWeight: 'bold' },
        { id: 2, type: 'text', x: 120, y: 120, text: '诚邀您参加', fontSize: 16, color: '#657287' },
        { id: 3, type: 'divider', x: 120, y: 170, width: 200, color: '#11645b' },
        { id: 4, type: 'image', x: 120, y: 200, width: 200, height: 120, src: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20wedding%20invitation%20floral%20design&image_size=square' }
      ];
    }
    state.selectedElementId = null;
    renderEditor();
    renderProperties();
    log({ message: '模板已加载到编辑器', template: t.name });
  }
}

async function createFromTemplate(templateId) {
  const t = state.templates.find(x => x.id === templateId);
  if (!t) return;
  const content = t.content || JSON.stringify([
    { id: 1, type: 'text', x: 120, y: 60, text: t.name, fontSize: 28, color: '#11645b', fontWeight: 'bold' },
    { id: 2, type: 'text', x: 120, y: 110, text: '诚挚邀请您参加', fontSize: 16, color: '#666' },
    { id: 3, type: 'text', x: 120, y: 160, text: '{{event_date}} {{event_time}}', fontSize: 20, color: '#333' },
    { id: 4, type: 'text', x: 120, y: 200, text: '{{location}}', fontSize: 16, color: '#666' },
    { id: 5, type: 'image', x: 120, y: 260, width: 300, height: 200, src: '' }
  ]);
  const r = await request('/invitations', {
    method: 'POST',
    body: JSON.stringify({
      template_id: t.id,
      title: t.name,
      category: t.category,
      content: content,
      event_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      event_time: '18:00',
      location: '请填写活动地点'
    })
  });
  if (r.ok && r.data) {
    log({ message: '请柬创建成功！正在跳转到编辑器...', invitation: r.data });
    state.newInvitationId = r.data.id;
    await loadInvitations();
    editInvitation(r.data.id);
  } else {
    log({ error: '创建失败', detail: r.data });
  }
}

function renderEditor() {
  const canvas = document.getElementById('editorCanvas');
  canvas.innerHTML = '';
  state.editorElements.forEach(el => {
    const div = document.createElement('div');
    div.className = 'editor-element' + (state.selectedElementId === el.id ? ' selected' : '');
    div.style.left = el.x + 'px';
    div.style.top = el.y + 'px';
    div.dataset.id = el.id;

    if (el.type === 'text') {
      div.textContent = el.text || '文本内容';
      div.style.fontSize = (el.fontSize || 16) + 'px';
      div.style.color = el.color || '#1d2430';
      div.style.fontWeight = el.fontWeight || 'normal';
    } else if (el.type === 'image') {
      const img = document.createElement('img');
      img.src = el.src || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20invitation%20card&image_size=square';
      img.style.width = (el.width || 200) + 'px';
      img.style.height = (el.height || 120) + 'px';
      img.style.objectFit = 'cover';
      div.appendChild(img);
    } else if (el.type === 'divider') {
      div.style.width = (el.width || 200) + 'px';
      div.style.height = '2px';
      div.style.background = el.color || '#11645b';
    } else if (el.type === 'music') {
      div.innerHTML = `
        <div style="padding:8px 12px;background:#f5f5f5;border-radius:8px;display:flex;align-items:center;gap:10px;min-width:200px;">
          <span style="font-size:20px;">🎵</span>
          <div>
            <div style="font-weight:14px;font-weight:500;">${el.name || '背景音乐'}</div>
            <div style="font-size:11px;color:#888;">${el.src ? '点击播放' : '请在右侧配置音乐URL'}</div>
          </div>
        </div>
      `;
    } else if (el.type === 'video') {
      div.innerHTML = `
        <div style="position:relative;width:${el.width || 280}px;height:${el.height || 160}px;background:#000;border-radius:8px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-size:40px;">▶️</span>
          <span style="position:absolute;bottom:8px;left:8px;color:#fff;font-size:12px;">🎬 视频组件</span>
        </div>
      `;
    } else if (el.type === 'map') {
      div.innerHTML = `
        <div style="width:${el.width || 200}px;height:${el.height || 120}px;background:linear-gradient(135deg,#e8f5e9,#c8e6c9);border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;">
          <span style="font-size:24px;">📍</span>
          <div style="font-size:12px;color:#2e7d32;text-align:center;padding:0 8px;">${el.address || '位置地图'}</div>
          <div style="font-size:10px;color:#666;">${el.latitude}, ${el.longitude}</div>
        </div>
      `;
    } else if (el.type === 'animation') {
      div.innerHTML = `
        <div style="padding:8px 16px;background:linear-gradient(135deg,#fff3e0,#ffe0b2);border-radius:8px;text-align:center;">
          <div style="font-size:${el.fontSize || 16}px;color:${el.color || '#e65100'};font-weight:500;">${el.text || '动画效果'}</div>
          <div style="font-size:11px;color:#e65100;">✨ ${el.animation || 'fadeIn'}</div>
        </div>
      `;
    } else if (el.type === 'countdown') {
      const target = el.targetDate ? new Date(el.targetDate) : new Date(Date.now() + 86400000 * 7);
      const diff = Math.max(0, Math.ceil((target - Date.now()) / 1000));
      const days = Math.floor(diff / 86400);
      div.innerHTML = `
        <div style="text-align:center;">
          <div style="font-size:${el.fontSize || 24}px;color:${el.color || '#c41e3a'};font-weight:bold;letter-spacing:2px;">
            ${days}天
          </div>
          <div style="font-size:11px;color:#888;margin-top:4px;">⏰ 倒计时</div>
        </div>
      `;
    } else if (el.type === 'fireworks') {
      div.innerHTML = `
        <div style="width:100%;height:100%;background:radial-gradient(circle at 50% 50%,rgba(255,193,7,0.3),transparent);display:flex;align-items:center;justify-content:center;">
          <span style="font-size:32px;">🎆</span>
        </div>
      `;
    } else if (el.type === 'bg') {
      div.style.width = typeof el.width === 'string' ? el.width : (el.width || '100%');
      div.style.height = typeof el.height === 'string' ? el.height : (el.height || '100%');
      div.style.background = el.background || 'linear-gradient(135deg, #fff8f0 0%, #ffe4c4 100%)';
      div.style.opacity = el.opacity || 1;
      div.style.borderRadius = '8px';
    } else if (el.type === 'border') {
      div.style.width = typeof el.width === 'string' ? el.width : (el.width || '95%');
      div.style.height = typeof el.height === 'string' ? el.height : (el.height || '95%');
      div.style.border = `${el.widthSize || 4}px ${el.style || 'double'} ${el.color || '#c41e3a'}`;
      div.style.borderRadius = (el.radius || 8) + 'px';
    } else if (el.type === 'page') {
      div.innerHTML = `
        <div style="padding:20px;background:#fafafa;border:2px dashed #ccc;border-radius:8px;text-align:center;">
          <div style="font-size:24px;margin-bottom:8px;">📄</div>
          <div style="font-weight:14px;color:#333;">第 ${el.pageNumber || 1} 页</div>
          <div style="font-size:11px;color:#888;margin-top:4px;">过渡效果: ${el.transition || 'slide'}</div>
        </div>
      `;
    }

    div.addEventListener('mousedown', (e) => startDrag(e, el.id));
    div.addEventListener('click', (e) => {
      e.stopPropagation();
      state.selectedElementId = el.id;
      renderEditor();
      renderProperties();
    });

    canvas.appendChild(div);
  });
}

function startDrag(e, elementId) {
  e.preventDefault();
  const el = state.editorElements.find(x => x.id === elementId);
  if (!el) return;
  const canvasRect = document.getElementById('editorCanvas').getBoundingClientRect();
  state.dragState = {
    id: elementId,
    offsetX: e.clientX - canvasRect.left - el.x,
    offsetY: e.clientY - canvasRect.top - el.y
  };
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
}

function onDrag(e) {
  if (!state.dragState) return;
  const canvasRect = document.getElementById('editorCanvas').getBoundingClientRect();
  const el = state.editorElements.find(x => x.id === state.dragState.id);
  if (!el) return;
  el.x = Math.max(0, e.clientX - canvasRect.left - state.dragState.offsetX);
  el.y = Math.max(0, e.clientY - canvasRect.top - state.dragState.offsetY);
  renderEditor();
}

function stopDrag() {
  state.dragState = null;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

function addElement(type) {
  const id = Date.now();
  const base = { id, type, x: 50, y: 50 + state.editorElements.length * 30 };
  if (type === 'text') {
    Object.assign(base, { text: '新文本', fontSize: 16, color: '#1d2430', fontWeight: 'normal' });
  } else if (type === 'image') {
    Object.assign(base, {
      width: 200, height: 120,
      src: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20invitation%20decorative&image_size=square'
    });
  } else if (type === 'divider') {
    Object.assign(base, { width: 200, color: '#11645b' });
  } else if (type === 'music') {
    Object.assign(base, { width: 200, height: 50, src: '', name: '背景音乐', autoPlay: true, loop: true });
  } else if (type === 'video') {
    Object.assign(base, { width: 280, height: 160, src: '', poster: '', controls: true, autoPlay: false });
  } else if (type === 'map') {
    Object.assign(base, { width: 200, height: 120, latitude: 31.23, longitude: 121.47, zoom: 15, address: '请输入地址' });
  } else if (type === 'animation') {
    Object.assign(base, { width: 200, height: 60, animation: 'fadeIn', duration: 1000, delay: 0, text: '动画效果' });
  } else if (type === 'countdown') {
    Object.assign(base, { width: 200, height: 60, targetDate: '', format: 'days', color: '#c41e3a', fontSize: 24 });
  } else if (type === 'fireworks') {
    Object.assign(base, { width: '100%', height: '100%', particleCount: 50, autoStart: true });
  } else if (type === 'page') {
    Object.assign(base, { pageNumber: state.editorElements.filter(e => e.type === 'page').length + 1, background: '#ffffff', transition: 'slide' });
  } else if (type === 'bg') {
    Object.assign(base, { width: '100%', height: '100%', background: 'linear-gradient(135deg, #fff8f0 0%, #ffe4c4 100%)', opacity: 1 });
  } else if (type === 'border') {
    Object.assign(base, { width: '95%', height: '95%', style: 'double', color: '#c41e3a', widthSize: 4, radius: 8 });
  }
  state.editorElements.push(base);
  state.selectedElementId = id;
  renderEditor();
  renderProperties();
  log({ message: `已添加${getElementTypeName(type)}组件，可在右侧属性面板配置` });
}

function getElementTypeName(type) {
  const names = {
    text: '文本', image: '图片', divider: '分割线',
    music: '背景音乐', video: '视频', map: '位置地图',
    animation: '动画效果', countdown: '倒计时', fireworks: '烟花特效',
    page: '页面', bg: '背景', border: '边框装饰'
  };
  return names[type] || type;
}

function renderProperties() {
  const panel = document.getElementById('propertiesPanel');
  const el = state.editorElements.find(x => x.id === state.selectedElementId);
  if (!el) {
    panel.innerHTML = '<p class="muted">点击元素编辑属性</p>';
    return;
  }

  let html = `<p class="label">类型：${el.type}</p>`;

  if (el.type === 'text') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">文本内容</label>
        <textarea id="propText">${el.text || ''}</textarea>
        <label class="label">字号</label>
        <input type="number" id="propFontSize" value="${el.fontSize || 16}" min="12" max="72" />
        <label class="label">颜色</label>
        <input type="color" id="propColor" value="${el.color || '#1d2430'}" style="height:40px;" />
        <label class="label">粗体</label>
        <select id="propFontWeight">
          <option value="normal" ${el.fontWeight === 'normal' ? 'selected' : ''}>正常</option>
          <option value="bold" ${el.fontWeight === 'bold' ? 'selected' : ''}>粗体</option>
        </select>
      </div>
    `;
  } else if (el.type === 'image') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">图片URL</label>
        <input type="text" id="propSrc" value="${el.src || ''}" />
        <label class="label">宽度</label>
        <input type="number" id="propWidth" value="${el.width || 200}" min="50" max="400" />
        <label class="label">高度</label>
        <input type="number" id="propHeight" value="${el.height || 120}" min="30" max="300" />
      </div>
    `;
  } else if (el.type === 'divider') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">宽度</label>
        <input type="number" id="propWidth" value="${el.width || 200}" min="50" max="400" />
        <label class="label">颜色</label>
        <input type="color" id="propColor" value="${el.color || '#11645b'}" style="height:40px;" />
      </div>
    `;
  } else if (el.type === 'music') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">音乐名称</label>
        <input type="text" id="propName" value="${el.name || ''}" />
        <label class="label">音乐URL</label>
        <input type="text" id="propSrc" value="${el.src || ''}" placeholder="支持 mp3/wav 格式" />
        <label class="label">自动播放</label>
        <select id="propAutoPlay">
          <option value="true" ${el.autoPlay ? 'selected' : ''}>开启</option>
          <option value="false" ${!el.autoPlay ? 'selected' : ''}>关闭</option>
        </select>
        <label class="label">循环播放</label>
        <select id="propLoop">
          <option value="true" ${el.loop ? 'selected' : ''}>开启</option>
          <option value="false" ${!el.loop ? 'selected' : ''}>关闭</option>
        </select>
      </div>
    `;
  } else if (el.type === 'video') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">视频URL</label>
        <input type="text" id="propSrc" value="${el.src || ''}" placeholder="支持 mp4 格式" />
        <label class="label">封面图URL</label>
        <input type="text" id="propPoster" value="${el.poster || ''}" />
        <label class="label">宽度</label>
        <input type="number" id="propWidth" value="${el.width || 280}" min="100" max="400" />
        <label class="label">高度</label>
        <input type="number" id="propHeight" value="${el.height || 160}" min="60" max="300" />
      </div>
    `;
  } else if (el.type === 'map') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">地址</label>
        <input type="text" id="propAddress" value="${el.address || ''}" />
        <label class="label">纬度</label>
        <input type="number" id="propLatitude" step="any" value="${el.latitude || 31.23}" />
        <label class="label">经度</label>
        <input type="number" id="propLongitude" step="any" value="${el.longitude || 121.47}" />
        <label class="label">缩放级别</label>
        <input type="number" id="propZoom" value="${el.zoom || 15}" min="1" max="20" />
      </div>
    `;
  } else if (el.type === 'animation') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">显示文字</label>
        <input type="text" id="propText" value="${el.text || ''}" />
        <label class="label">动画类型</label>
        <select id="propAnimation">
          <option value="fadeIn" ${el.animation === 'fadeIn' ? 'selected' : ''}>淡入</option>
          <option value="slideUp" ${el.animation === 'slideUp' ? 'selected' : ''}>上滑</option>
          <option value="bounce" ${el.animation === 'bounce' ? 'selected' : ''}>弹跳</option>
          <option value="pulse" ${el.animation === 'pulse' ? 'selected' : ''}>脉冲</option>
          <option value="rotate" ${el.animation === 'rotate' ? 'selected' : ''}>旋转</option>
        </select>
        <label class="label">持续时间(ms)</label>
        <input type="number" id="propDuration" value="${el.duration || 1000}" min="100" max="5000" />
        <label class="label">延迟时间(ms)</label>
        <input type="number" id="propDelay" value="${el.delay || 0}" min="0" max="3000" />
      </div>
    `;
  } else if (el.type === 'countdown') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">目标日期</label>
        <input type="date" id="propTargetDate" value="${el.targetDate || ''}" />
        <label class="label">显示格式</label>
        <select id="propFormat">
          <option value="days" ${el.format === 'days' ? 'selected' : ''}>仅天数</option>
          <option value="full" ${el.format === 'full' ? 'selected' : ''}>天时分秒</option>
        </select>
        <label class="label">文字颜色</label>
        <input type="color" id="propColor" value="${el.color || '#c41e3a'}" style="height:40px;" />
        <label class="label">字号</label>
        <input type="number" id="propFontSize" value="${el.fontSize || 24}" min="12" max="48" />
      </div>
    `;
  } else if (el.type === 'fireworks') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">粒子数量</label>
        <input type="number" id="propParticleCount" value="${el.particleCount || 50}" min="10" max="200" />
        <label class="label">自动开始</label>
        <select id="propAutoStart">
          <option value="true" ${el.autoStart ? 'selected' : ''}>开启</option>
          <option value="false" ${!el.autoStart ? 'selected' : ''}>关闭</option>
        </select>
      </div>
    `;
  } else if (el.type === 'bg') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">背景样式</label>
        <input type="text" id="propBackground" value="${el.background || '#ffffff'}" placeholder="颜色或渐变" />
        <label class="label">透明度</label>
        <input type="number" id="propOpacity" step="0.1" value="${el.opacity || 1}" min="0" max="1" />
      </div>
    `;
  } else if (el.type === 'border') {
    html += `
      <div class="form-grid" style="grid-template-columns:1fr;">
        <label class="label">边框样式</label>
        <select id="propStyle">
          <option value="solid" ${el.style === 'solid' ? 'selected' : ''}>实线</option>
          <option value="double" ${el.style === 'double' ? 'selected' : ''}>双线</option>
          <option value="dashed" ${el.style === 'dashed' ? 'selected' : ''}>虚线</option>
          <option value="dotted" ${el.style === 'dotted' ? 'selected' : ''}>点线</option>
        </select>
        <label class="label">边框颜色</label>
        <input type="color" id="propColor" value="${el.color || '#c41e3a'}" style="height:40px;" />
        <label class="label">边框宽度</label>
        <input type="number" id="propWidthSize" value="${el.widthSize || 4}" min="1" max="20" />
        <label class="label">圆角</label>
        <input type="number" id="propRadius" value="${el.radius || 8}" min="0" max="50" />
      </div>
    `;
  }

  html += `
    <div style="margin-top:15px; display:grid; gap:8px;">
      <button type="button" onclick="applyProperties()">应用属性</button>
      <button type="button" onclick="deleteElement()" style="background:#c0392b;">删除元素</button>
    </div>
  `;

  panel.innerHTML = html;
}

function applyProperties() {
  const el = state.editorElements.find(x => x.id === state.selectedElementId);
  if (!el) return;
  if (el.type === 'text') {
    el.text = document.getElementById('propText').value;
    el.fontSize = Number(document.getElementById('propFontSize').value);
    el.color = document.getElementById('propColor').value;
    el.fontWeight = document.getElementById('propFontWeight').value;
  } else if (el.type === 'image') {
    el.src = document.getElementById('propSrc').value;
    el.width = Number(document.getElementById('propWidth').value);
    el.height = Number(document.getElementById('propHeight').value);
  } else if (el.type === 'divider') {
    el.width = Number(document.getElementById('propWidth').value);
    el.color = document.getElementById('propColor').value;
  } else if (el.type === 'music') {
    el.name = document.getElementById('propName').value;
    el.src = document.getElementById('propSrc').value;
    el.autoPlay = document.getElementById('propAutoPlay').value === 'true';
    el.loop = document.getElementById('propLoop').value === 'true';
  } else if (el.type === 'video') {
    el.src = document.getElementById('propSrc').value;
    el.poster = document.getElementById('propPoster').value;
    el.width = Number(document.getElementById('propWidth').value);
    el.height = Number(document.getElementById('propHeight').value);
  } else if (el.type === 'map') {
    el.address = document.getElementById('propAddress').value;
    el.latitude = Number(document.getElementById('propLatitude').value);
    el.longitude = Number(document.getElementById('propLongitude').value);
    el.zoom = Number(document.getElementById('propZoom').value);
  } else if (el.type === 'animation') {
    el.text = document.getElementById('propText').value;
    el.animation = document.getElementById('propAnimation').value;
    el.duration = Number(document.getElementById('propDuration').value);
    el.delay = Number(document.getElementById('propDelay').value);
  } else if (el.type === 'countdown') {
    el.targetDate = document.getElementById('propTargetDate').value;
    el.format = document.getElementById('propFormat').value;
    el.color = document.getElementById('propColor').value;
    el.fontSize = Number(document.getElementById('propFontSize').value);
  } else if (el.type === 'fireworks') {
    el.particleCount = Number(document.getElementById('propParticleCount').value);
    el.autoStart = document.getElementById('propAutoStart').value === 'true';
  } else if (el.type === 'bg') {
    el.background = document.getElementById('propBackground').value;
    el.opacity = Number(document.getElementById('propOpacity').value);
  } else if (el.type === 'border') {
    el.style = document.getElementById('propStyle').value;
    el.color = document.getElementById('propColor').value;
    el.widthSize = Number(document.getElementById('propWidthSize').value);
    el.radius = Number(document.getElementById('propRadius').value);
  }
  renderEditor();
  log({ message: '属性已应用' });
}

function deleteElement() {
  state.editorElements = state.editorElements.filter(x => x.id !== state.selectedElementId);
  state.selectedElementId = null;
  renderEditor();
  renderProperties();
}

async function saveEditor() {
  const title = document.getElementById('invTitle').value;
  if (!title) {
    log({ error: '请填写请柬标题' });
    return;
  }
  const body = {
    title,
    category: document.getElementById('invCategory').value,
    content: JSON.stringify(state.editorElements),
    event_date: document.getElementById('invDate').value,
    event_time: document.getElementById('invTime').value,
    location: document.getElementById('invLocation').value,
    latitude: document.getElementById('invLat').value || null,
    longitude: document.getElementById('invLng').value || null
  };
  if (state.editorTemplateId) body.template_id = state.editorTemplateId;

  const r = await request('/invitations', { method: 'POST', body: JSON.stringify(body) });
  if (r.ok) {
    log({ message: '请柬保存成功', invitation: r.data });
    await loadInvitations();
  } else {
    log(r.data);
  }
}

function createNewInvitation() {
  openCreateModal();
}

function openCreateModal() {
  const modal = document.getElementById('createModal');
  if (!modal) return;
  const nextWeek = new Date(Date.now() + 86400000 * 7);
  document.getElementById('createInvTitle').value = '';
  document.getElementById('createInvCategory').value = '婚礼';
  document.getElementById('createInvDate').value = nextWeek.toISOString().split('T')[0];
  document.getElementById('createInvTime').value = '18:00';
  document.getElementById('createInvLocation').value = '';
  document.getElementById('createInvTemplate').value = '';
  updateTemplateSelect();
  modal.style.display = 'flex';
  document.getElementById('createInvTitle').focus();
}

function closeCreateModal() {
  const modal = document.getElementById('createModal');
  if (modal) modal.style.display = 'none';
}

async function submitCreateInvitation() {
  const title = document.getElementById('createInvTitle').value.trim();
  const category = document.getElementById('createInvCategory').value;
  const event_date = document.getElementById('createInvDate').value;
  const event_time = document.getElementById('createInvTime').value;
  const location = document.getElementById('createInvLocation').value.trim();
  const templateId = document.getElementById('createInvTemplate').value;

  if (!title) {
    log({ error: '请填写请柬名称' });
    return;
  }
  if (!event_date) {
    log({ error: '请选择活动日期' });
    return;
  }
  if (!location) {
    log({ error: '请填写活动地点' });
    return;
  }

  let content = '[]';
  let template_id = null;

  if (templateId) {
    const t = state.templates.find(x => x.id === Number(templateId));
    if (t) {
      template_id = t.id;
      content = t.content || JSON.stringify([
        { id: 1, type: 'text', x: 120, y: 60, text: title, fontSize: 28, color: '#11645b', fontWeight: 'bold' },
        { id: 2, type: 'text', x: 120, y: 110, text: `诚挚邀请您参加${category}`, fontSize: 16, color: '#666' },
        { id: 3, type: 'text', x: 120, y: 160, text: `${event_date} ${event_time}`, fontSize: 20, color: '#333' },
        { id: 4, type: 'text', x: 120, y: 200, text: location, fontSize: 16, color: '#666' }
      ]);
    }
  }

  const body = {
    template_id,
    title,
    category,
    event_date,
    event_time,
    location,
    content
  };

  const r = await request('/invitations', { method: 'POST', body: JSON.stringify(body) });
  if (r.ok && r.data) {
    log({ message: '请柬创建成功！正在跳转到编辑器...', invitation: r.data });
    closeCreateModal();
    state.newInvitationId = r.data.id;
    await loadInvitations();
    editInvitation(r.data.id);
  } else {
    log({ error: '创建失败', detail: r.data });
  }
}

async function loadInvitations() {
  const r = await request('/invitations');
  if (r.ok && r.data) {
    state.invitations = r.data;
    renderInvitations();
    if (state.currentInvitation) {
      const updated = r.data.find(x => x.id === state.currentInvitation.id);
      if (updated) state.currentInvitation = updated;
    }
  }
}

function renderInvitations() {
  const box = document.getElementById('invitationsList');
  if (!state.invitations.length) {
    box.innerHTML = '<p class="muted">暂无请柬，请先从模板库创建或使用编辑器设计。</p>';
    return;
  }
  box.innerHTML = state.invitations.map(inv => {
    const rate = inv.recipient_count > 0 ? Math.round((inv.opened_count / inv.recipient_count) * 100) : 0;
    const statusText = { draft: '草稿', sent: '已发送', closed: '已结束' }[inv.status] || inv.status;
    const statusColor = inv.status === 'sent' ? '#11645b' : inv.status === 'closed' ? '#657287' : '#e67e22';
    const isNew = state.newInvitationId === inv.id;
    const unreadCount = inv.recipient_count - inv.opened_count;

    let lifecycleTip = '';
    if (inv.status === 'draft') {
      lifecycleTip = `<div class="lifecycle-tip" style="background:#fff7e6;color:#e67e22;padding:8px 12px;border-radius:6px;margin-top:12px;font-size:13px;">
        <strong>📝 下一步：</strong>
        ${inv.recipient_count === 0 ? '添加收件人 → ' : ''}发送请柬 → 追踪打开率 → 管理祝福墙
      </div>`;
    } else if (inv.status === 'sent') {
      lifecycleTip = `<div class="lifecycle-tip" style="background:#e8f5f2;color:#11645b;padding:8px 12px;border-radius:6px;margin-top:12px;font-size:13px;">
        <strong>📊 实时追踪：</strong>
        ${unreadCount > 0 ? `<span style="color:#c0392b;">${unreadCount} 位未读，可发送提醒 → </span>` : ''}
        查看热力图 → 导出收件人 → 复查祝福墙
      </div>`;
    }

    return `
      <div class="inv-card ${isNew ? 'new' : ''}">
        <div class="inv-card-head">
          <div>
            <h3>${inv.title} ${isNew ? '<span style="background:#11645b;color:#fff;font-size:11px;padding:2px 6px;border-radius:3px;">NEW</span>' : ''}</h3>
            <div class="meta">
              <span>${inv.category}</span>
              <span>${inv.event_date || '未设置日期'} ${inv.event_time || ''}</span>
              <span>📍 ${inv.location || '未设置地点'}</span>
            </div>
          </div>
          <span class="status-badge" style="background:${statusColor};">${statusText}</span>
        </div>
        <div class="inv-stats">
          <div><span class="label">👥 发送</span><strong>${inv.recipient_count}</strong></div>
          <div><span class="label">✅ 已读</span><strong style="color:#11645b;">${inv.opened_count}</strong></div>
          <div><span class="label">⏰ 未读</span><strong style="color:${unreadCount > 0 ? '#c0392b' : '#999'};">${unreadCount}</strong></div>
          <div><span class="label">📈 打开率</span><strong>${rate}%</strong></div>
          <div><span class="label">💝 祝福</span><strong>${inv.blessing_count || 0}</strong></div>
        </div>
        ${lifecycleTip}
        <div class="inv-actions">
          <button type="button" onclick="openInvitationDetail(${inv.id})">📊 数据详情</button>
          <button type="button" onclick="editInvitation(${inv.id})">✏️ 编辑内容</button>
          ${inv.status === 'draft' ? `<button type="button" onclick="sendInvitationDirect(${inv.id})" class="primary">📤 发送请柬</button>` : ''}
          ${inv.status === 'sent' && unreadCount > 0 ? `<button type="button" onclick="remindUnreadDirect(${inv.id})" style="background:#e67e22;">🔔 提醒未读</button>` : ''}
          <button type="button" onclick="deleteInvitation(${inv.id})" style="background:#c0392b;">🗑️ 删除</button>
        </div>
      </div>
    `;
  }).join('');
}

async function openInvitationDetail(id) {
  const inv = state.invitations.find(x => x.id === id);
  if (!inv) return;
  state.currentInvitation = inv;
  document.getElementById('invDetail').style.display = 'block';
  document.getElementById('invDetailTitle').textContent = inv.title;

  const [rRecip, rStats, rHeat, rBless] = await Promise.all([
    request(`/invitations/${id}/recipients`),
    request(`/invitations/${id}/stats`),
    request(`/invitations/${id}/heatmap`),
    request(`/invitations/${id}/blessings`)
  ]);

  if (rRecip.ok) state.recipients = rRecip.data || [];
  if (rStats.ok) state.stats = rStats.data;
  if (rHeat.ok) state.heatmapData = rHeat.data || [];
  if (rBless.ok) state.blessings = rBless.data || [];

  renderInvDetail();
  drawHeatmap(id);
}

function renderInvDetail() {
  const s = state.stats || {};
  document.getElementById('statSend').textContent = s.sent || 0;
  document.getElementById('statOpened').textContent = s.opened || 0;
  document.getElementById('statPending').textContent = s.pending || 0;
  document.getElementById('statRate').textContent = (s.open_rate || 0) + '%';
  document.getElementById('statBlessing').textContent = s.blessings || 0;

  const rBox = document.getElementById('recipientsList');
  if (!state.recipients.length) {
    rBox.innerHTML = '<p class="muted">暂无收件人，请添加后发送。</p>';
  } else {
    rBox.innerHTML = state.recipients.map(r => `
      <div class="row">
        <div>
          <strong>${r.name}</strong>
          <div class="meta">
            ${r.phone ? `<span>${r.phone}</span>` : ''}
            ${r.email ? `<span>${r.email}</span>` : ''}
          </div>
        </div>
        <div>
          <span class="status-badge" style="background:${r.opened_at ? '#11645b' : '#e67e22'};">
            ${r.opened_at ? '已读 ' + r.opened_at.slice(0, 16) : '未读'}
          </span>
          ${r.latitude && r.longitude ? `<span class="meta" style="margin-left:8px;">📍 ${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}</span>` : ''}
        </div>
      </div>
    `).join('');
  }

  const bBox = document.getElementById('blessingsList');
  if (!state.blessings.length) {
    bBox.innerHTML = '<p class="muted">暂无祝福。</p>';
  } else {
    bBox.innerHTML = state.blessings.map(b => `
      <div class="blessing-item">
        <div class="blessing-head">
          <strong>${b.guest_name || '匿名宾客'}</strong>
          <span class="meta">${b.created_at.slice(0, 16)}</span>
        </div>
        <p>${b.content}</p>
        ${b.reply ? `<p class="muted" style="margin-top:5px;"><strong>主人回复：</strong>${b.reply}</p>` : ''}
        ${b.status === 'pending' ? '<span class="status-badge" style="background:#e67e22; margin-top:5px;">待审核</span>' : ''}
      </div>
    `).join('');
  }
}

async function editInvitation(id) {
  const r = await request(`/invitations/${id}`);
  if (r.ok && r.data) {
    const inv = r.data;
    state.editorTemplateId = inv.template_id || null;
    document.getElementById('invTitle').value = inv.title || '';
    document.getElementById('invCategory').value = inv.category || '婚礼';
    document.getElementById('invDate').value = inv.event_date || '';
    document.getElementById('invTime').value = inv.event_time || '';
    document.getElementById('invLocation').value = inv.location || '';
    document.getElementById('invLat').value = inv.latitude || '';
    document.getElementById('invLng').value = inv.longitude || '';
    try {
      state.editorElements = JSON.parse(inv.content || inv.content_json || inv.template_content || '[]');
    } catch (e) {
      state.editorElements = [];
    }
    state.selectedElementId = null;
    renderEditor();
    renderProperties();
    location.hash = '#editor';
    log({ message: '请柬已加载到编辑器，修改后请重新保存' });
  }
}

async function sendInvitationDirect(id) {
  const r = await request(`/invitations/${id}/send`, { method: 'POST' });
  if (r.ok) {
    log({ message: '发送成功', result: r.data });
    await loadInvitations();
    if (state.currentInvitation && state.currentInvitation.id === id) {
      await openInvitationDetail(id);
    }
  } else {
    log(r.data);
  }
}

async function sendCurrentInvitation() {
  if (!state.currentInvitation) return;
  await sendInvitationDirect(state.currentInvitation.id);
}

async function remindUnread() {
  if (!state.currentInvitation) return;
  await remindUnreadDirect(state.currentInvitation.id);
}

async function remindUnreadDirect(id) {
  const r = await request(`/invitations/${id}/remind`, { method: 'POST' });
  if (r.ok) {
    log({ message: '提醒已发送', result: r.data });
    await loadInvitations();
    if (state.currentInvitation && state.currentInvitation.id === id) {
      await openInvitationDetail(id);
    }
  } else {
    log(r.data);
  }
}

async function addRecipient(e) {
  e.preventDefault();
  if (!state.currentInvitation) return;
  const form = new FormData(e.target);
  const r = await request(`/invitations/${state.currentInvitation.id}/recipients`, {
    method: 'POST',
    body: JSON.stringify({
      name: form.get('name'),
      phone: form.get('phone') || '',
      email: form.get('email') || ''
    })
  });
  if (r.ok) {
    log({ message: '收件人已添加', recipient: r.data });
    e.target.reset();
    await openInvitationDetail(state.currentInvitation.id);
    await loadInvitations();
  } else {
    log(r.data);
  }
}

async function deleteInvitation(id) {
  if (!confirm('确定删除此请柬？')) return;
  const r = await request(`/invitations/${id}`, { method: 'DELETE' });
  if (r.ok) {
    log({ message: '删除成功' });
    await loadInvitations();
    if (state.currentInvitation && state.currentInvitation.id === id) {
      document.getElementById('invDetail').style.display = 'none';
      state.currentInvitation = null;
    }
  } else {
    log(r.data);
  }
}

function drawHeatmap(invId) {
  const canvas = document.getElementById('heatmapCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f6f7f9';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#e4e7ec';
  ctx.lineWidth = 1;
  for (let i = 0; i < canvas.width; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += 30) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }

  if (!state.heatmapData.length) {
    ctx.fillStyle = '#98a2b3';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无地理位置数据', canvas.width / 2, canvas.height / 2);
    return;
  }

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  state.heatmapData.forEach(p => {
    if (p.latitude != null && p.longitude != null) {
      minLat = Math.min(minLat, p.latitude);
      maxLat = Math.max(maxLat, p.latitude);
      minLng = Math.min(minLng, p.longitude);
      maxLng = Math.max(maxLng, p.longitude);
    }
  });

  if (minLat === Infinity) {
    ctx.fillStyle = '#98a2b3';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('暂无地理位置数据', canvas.width / 2, canvas.height / 2);
    return;
  }

  const latRange = maxLat - minLat || 1;
  const lngRange = maxLng - minLng || 1;
  const padding = 30;

  state.heatmapData.forEach(p => {
    if (p.latitude == null || p.longitude == null) return;
    const x = padding + ((p.longitude - minLng) / lngRange) * (canvas.width - padding * 2);
    const y = canvas.height - padding - ((p.latitude - minLat) / latRange) * (canvas.height - padding * 2);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, 40);
    gradient.addColorStop(0, 'rgba(231, 76, 60, 0.8)');
    gradient.addColorStop(0.4, 'rgba(241, 196, 15, 0.5)');
    gradient.addColorStop(1, 'rgba(46, 204, 113, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, 40, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    if (p.count > 1) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(p.count, x, y);
    }
  });

  ctx.fillStyle = '#475467';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`${minLng.toFixed(2)}°E`, padding, canvas.height - 8);
  ctx.textAlign = 'right';
  ctx.fillText(`${maxLng.toFixed(2)}°E`, canvas.width - padding, canvas.height - 8);
  ctx.textAlign = 'left';
  ctx.fillText(`${maxLat.toFixed(2)}°N`, 4, padding + 5);
  ctx.fillText(`${minLat.toFixed(2)}°N`, 4, canvas.height - padding);
}

async function exportRecipients() {
  if (!state.currentInvitation) return;
  const r = await request('/export', {
    method: 'POST',
    body: JSON.stringify({ type: 'recipients', invitation_id: state.currentInvitation.id })
  });
  log(r.ok ? { message: '导出成功', record: r.data } : r.data);
}

async function exportBlessings() {
  if (!state.currentInvitation) return;
  const r = await request('/export', {
    method: 'POST',
    body: JSON.stringify({ type: 'blessings', invitation_id: state.currentInvitation.id })
  });
  log(r.ok ? { message: '导出成功', record: r.data } : r.data);
}

async function loadProfile() {
  const [rOrders, rInvs, rExports] = await Promise.all([
    request('/orders'),
    request('/invitations'),
    request('/export/records')
  ]);

  const pBox = document.getElementById('profileBox');
  if (state.user) {
    pBox.innerHTML = `
      <div><span class="label">姓名</span><strong>${state.user.name}</strong></div>
      <div><span class="label">手机号</span><strong>${state.user.phone}</strong></div>
      <div><span class="label">角色</span><strong>${state.user.role}</strong></div>
      <div><span class="label">注册时间</span><strong>${(state.user.created_at || '').slice(0, 10)}</strong></div>
    `;
  }

  const oBox = document.getElementById('ordersBox');
  if (rOrders.ok && rOrders.data && rOrders.data.length) {
    oBox.innerHTML = rOrders.data.slice(0, 10).map(o => `
      <div class="row">
        <div>
          <strong>订单 #${o.id}</strong>
          <div class="meta"><span>${o.type || '请柬发送'}</span><span>${(o.created_at || '').slice(0, 16)}</span></div>
        </div>
        <div>
          <strong style="color:#11645b;">¥${o.amount || 0}</strong>
          <span class="status-badge" style="margin-left:8px; background:${o.status === 'paid' ? '#11645b' : '#e67e22'};">
            ${o.status === 'paid' ? '已支付' : o.status}
          </span>
        </div>
      </div>
    `).join('');
  } else {
    oBox.innerHTML = '<p class="muted">暂无订单</p>';
  }

  const iBox = document.getElementById('profileInvitations');
  if (rInvs.ok && rInvs.data && rInvs.data.length) {
    iBox.innerHTML = rInvs.data.slice(0, 10).map(inv => `
      <div class="row">
        <div>
          <strong>${inv.title}</strong>
          <div class="meta"><span>${inv.category}</span><span>${inv.event_date || ''}</span></div>
        </div>
        <div>
          <span class="meta">发送 ${inv.recipient_count} | 已读 ${inv.opened_count}</span>
          <span class="status-badge" style="margin-left:8px;">${inv.status}</span>
        </div>
      </div>
    `).join('');
  } else {
    iBox.innerHTML = '<p class="muted">暂无请柬</p>';
  }

  const eBox = document.getElementById('exportRecords');
  if (rExports.ok && rExports.data && rExports.data.length) {
    eBox.innerHTML = rExports.data.slice(0, 10).map(e => `
      <div class="row">
        <div>
          <strong>${e.type === 'recipients' ? '收件人列表' : e.type === 'blessings' ? '祝福墙' : e.type}</strong>
          <div class="meta"><span>${(e.created_at || '').slice(0, 16)}</span></div>
        </div>
        <div>
          <span class="meta">${e.record_count || 0} 条记录</span>
        </div>
      </div>
    `).join('');
  } else {
    eBox.innerHTML = '<p class="muted">暂无导出记录</p>';
  }
}

async function loadAdmin() {
  const [rSummary, rTemplates, rCommissions, rBlessings, rLogs] = await Promise.all([
    request('/admin/summary'),
    request('/templates?status=pending'),
    request('/commissions'),
    request('/admin/blessings?status=pending'),
    request('/admin/logs')
  ]);

  const sBox = document.getElementById('adminStats');
  if (rSummary.ok && rSummary.data) {
    const s = rSummary.data;
    sBox.innerHTML = `
      <div><span class="label">用户数</span><strong>${s.total_users || 0}</strong></div>
      <div><span class="label">模板数</span><strong>${s.total_templates || 0}</strong></div>
      <div><span class="label">请柬数</span><strong>${s.total_invitations || 0}</strong></div>
      <div><span class="label">总收入</span><strong>¥${s.total_revenue || 0}</strong></div>
      <div><span class="label">待审核模板</span><strong>${s.pending_templates || 0}</strong></div>
      <div><span class="label">待审核祝福</span><strong>${s.pending_blessings || 0}</strong></div>
      <div><span class="label">待结算分成</span><strong>¥${s.pending_commissions || 0}</strong></div>
      <div><span class="label">总发送数</span><strong>${s.total_recipients || 0}</strong></div>
    `;
  }

  const tBox = document.getElementById('templateReviews');
  if (rTemplates.ok && rTemplates.data && rTemplates.data.length) {
    tBox.innerHTML = rTemplates.data.map(t => `
      <div class="row">
        <div>
          <strong>${t.name}</strong>
          <div class="meta"><span>${t.category}</span><span>设计师 ${t.designer_name || '未知'}</span></div>
        </div>
        <div>
          <button type="button" onclick="reviewTemplate(${t.id}, 'approved')" style="background:#11645b;">通过</button>
          <button type="button" onclick="reviewTemplate(${t.id}, 'rejected')" style="background:#c0392b; margin-left:5px;">拒绝</button>
        </div>
      </div>
    `).join('');
  } else {
    tBox.innerHTML = '<p class="muted">暂无待审核模板</p>';
  }

  const cBox = document.getElementById('commissionsList');
  if (rCommissions.ok && rCommissions.data && rCommissions.data.length) {
    cBox.innerHTML = rCommissions.data.map(c => `
      <div class="row">
        <div>
          <strong>${c.designer_name || '设计师'} #${c.id}</strong>
          <div class="meta">
            <span>订单 #${c.order_id}</span>
            <span>模板 ${c.template_name || ''}</span>
          </div>
        </div>
        <div>
          <strong style="color:#11645b;">¥${c.amount || 0}</strong>
          ${c.status === 'pending' ? `
            <button type="button" onclick="settleCommission(${c.id})" style="margin-left:8px;">结算</button>
          ` : `<span class="status-badge" style="margin-left:8px; background:#11645b;">已结算</span>`}
        </div>
      </div>
    `).join('');
  } else {
    cBox.innerHTML = '<p class="muted">暂无分成记录</p>';
  }

  const tsBox = document.getElementById('templateStats');
  const rAllTemplates = await request('/templates');
  if (rAllTemplates.ok && rAllTemplates.data && rAllTemplates.data.length) {
    tsBox.innerHTML = rAllTemplates.data.slice(0, 10).map(t => {
      const conv = t.use_count > 0 ? Math.round(((t.sent_count || 0) / t.use_count) * 100) : 0;
      return `
        <div class="row">
          <div>
            <strong>${t.name}</strong>
            <div class="meta"><span>${t.category}</span><span>设计师 ${t.designer_name || ''}</span></div>
          </div>
          <div>
            <span class="meta">使用 ${t.use_count || 0} 次 | 发送 ${t.sent_count || 0} | 转化率 ${conv}%</span>
          </div>
        </div>
      `;
    }).join('');
  } else {
    tsBox.innerHTML = '<p class="muted">暂无模板数据</p>';
  }

  const bBox = document.getElementById('adminBlessings');
  if (rBlessings.ok && rBlessings.data && rBlessings.data.length) {
    bBox.innerHTML = rBlessings.data.map(b => `
      <div class="row" style="align-items:start;">
        <div style="flex:1;">
          <strong>${b.guest_name || '匿名'} - 请柬 #${b.invitation_id}</strong>
          <p style="margin:5px 0; color:#5f6c7d;">${b.content}</p>
        </div>
        <div>
          <button type="button" onclick="reviewBlessing(${b.id}, 'approved')" style="background:#11645b;">通过</button>
          <button type="button" onclick="reviewBlessing(${b.id}, 'rejected')" style="background:#c0392b; margin-left:5px;">拒绝</button>
        </div>
      </div>
    `).join('');
  } else {
    bBox.innerHTML = '<p class="muted">暂无待审核祝福</p>';
  }

  const lBox = document.getElementById('adminLogs');
  if (rLogs.ok && rLogs.data && rLogs.data.length) {
    lBox.innerHTML = rLogs.data.slice(0, 10).map(l => `
      <div class="row">
        <div>
          <strong>${l.action}</strong>
          <div class="meta"><span>用户 ${l.user_name || l.user_id}</span><span>${(l.created_at || '').slice(0, 16)}</span></div>
        </div>
        <div><span class="muted">${l.details || ''}</span></div>
      </div>
    `).join('');
  } else {
    lBox.innerHTML = '<p class="muted">暂无操作日志</p>';
  }
}

async function reviewTemplate(id, status) {
  const r = await request(`/templates/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ status, note: status === 'approved' ? '审核通过' : '模板不符合规范' })
  });
  log(r.ok ? { message: `模板审核${status === 'approved' ? '通过' : '拒绝'}`, result: r.data } : r.data);
  await loadAdmin();
}

async function reviewBlessing(id, status) {
  const r = await request(`/blessings/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ status, note: '' })
  });
  log(r.ok ? { message: `祝福审核${status === 'approved' ? '通过' : '拒绝'}`, result: r.data } : r.data);
  await loadAdmin();
}

async function settleCommission(id) {
  const r = await request(`/commissions/${id}/settle`, { method: 'POST' });
  log(r.ok ? { message: '分成已结算', result: r.data } : r.data);
  await loadAdmin();
}

document.addEventListener('DOMContentLoaded', () => {
  loadStoredUser();
  checkHealth();

  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    login(form.get('name'), form.get('phone'));
  });

  let activeSceneTag = '';

  function applyFilters() {
    loadTemplates(
      document.getElementById('categorySelect').value,
      document.getElementById('templateSearch').value,
      activeSceneTag,
      document.getElementById('sortSelect').value
    );
  }

  document.getElementById('templateSearch').addEventListener('input', applyFilters);
  document.getElementById('categorySelect').addEventListener('change', applyFilters);
  document.getElementById('sortSelect').addEventListener('change', applyFilters);

  document.querySelectorAll('#sceneChips .scene-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const tag = chip.dataset.tag;
      if (activeSceneTag === tag) {
        activeSceneTag = '';
        chip.classList.remove('active');
      } else {
        document.querySelectorAll('#sceneChips .scene-chip').forEach(c => c.classList.remove('active'));
        activeSceneTag = tag;
        chip.classList.add('active');
      }
      applyFilters();
    });
  });

  document.getElementById('resetFilters').addEventListener('click', () => {
    document.getElementById('templateSearch').value = '';
    document.getElementById('categorySelect').value = '';
    document.getElementById('sortSelect').value = 'default';
    activeSceneTag = '';
    document.querySelectorAll('#sceneChips .scene-chip').forEach(c => c.classList.remove('active'));
    loadTemplates();
  });

  document.getElementById('editorTemplateSelect').addEventListener('change', (e) => {
    if (e.target.value) loadEditorTemplate(Number(e.target.value));
  });

  document.querySelectorAll('.tool').forEach(btn => {
    btn.addEventListener('click', () => addElement(btn.dataset.element));
  });

  document.getElementById('saveEditor').addEventListener('click', saveEditor);
  document.getElementById('createInvitation').addEventListener('click', createNewInvitation);

  document.getElementById('refreshInvitations').addEventListener('click', loadInvitations);
  document.getElementById('backToList').addEventListener('click', () => {
    document.getElementById('invDetail').style.display = 'none';
    state.currentInvitation = null;
  });
  document.getElementById('sendInvitation').addEventListener('click', sendCurrentInvitation);
  document.getElementById('remindUnread').addEventListener('click', remindUnread);
  document.getElementById('exportRecipients').addEventListener('click', exportRecipients);
  document.getElementById('exportBlessings').addEventListener('click', exportBlessings);
  document.getElementById('addRecipientForm').addEventListener('submit', addRecipient);

  document.getElementById('refreshProfile').addEventListener('click', loadProfile);
  document.getElementById('refreshAdmin').addEventListener('click', loadAdmin);

  document.getElementById('editorCanvas').addEventListener('click', () => {
    state.selectedElementId = null;
    renderEditor();
    renderProperties();
  });

  if (state.token) {
    loadCategories();
    loadTemplates();
    loadInvitations();
    if (state.user && state.user.role === 'admin') loadAdmin();
  }
});
