document.addEventListener('DOMContentLoaded', function() {
  initNavigation();
  initEventListeners();
  setFlowStep(1);
  loadStations();
});

function initNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  
  navButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      navButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      const role = this.dataset.role;
      const panels = document.querySelectorAll('.role-panel');
      
      panels.forEach(panel => {
        panel.classList.add('hidden');
      });
      
      const targetPanel = document.getElementById(`${role}-panel`);
      if (targetPanel) {
        targetPanel.classList.remove('hidden');
      }
    });
  });
}

const state = {
  currentStep: 1,
  currentStation: null,
  currentCharger: null,
  currentSessionId: null,
  userId: 'test-user-001'
};

function initOwnerFlow() {
  loadStations();
}

async function apiCall(endpoint, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options
  };
  
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }
  
  try {
    const response = await fetch(endpoint, config);
    const data = await response.json();
    return data;
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

function formatResult(data) {
  if (typeof data === 'object') {
    return JSON.stringify(data, null, 2);
  }
  return String(data);
}

function showResult(elementId, data, type = 'info') {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = formatResult(data);
    element.className = 'result-area';
    if (type === 'success') {
      element.classList.add('success');
    } else if (type === 'error') {
      element.classList.add('error');
    } else {
      element.classList.add('info');
    }
  }
}

function setFlowStep(step) {
  state.currentStep = step;
  
  document.querySelectorAll('.flow-steps .step').forEach((stepEl, index) => {
    if (index < step) {
      stepEl.classList.add('active');
    } else {
      stepEl.classList.remove('active');
    }
  });
  
  document.querySelectorAll('.flow-panel').forEach((panel) => {
    let panelStep = 0;
    if (panel.id === 'flow-stations') panelStep = 1;
    else if (panel.id === 'flow-chargers') panelStep = 2;
    else if (panel.id === 'flow-charging') panelStep = 3;
    else if (panel.id === 'flow-payment') panelStep = 4;
    
    if (panelStep === step) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });
}

async function loadStations() {
  const stationsList = document.getElementById('stations-list');
  stationsList.innerHTML = '<div class="loading">正在加载充电站列表...</div>';
  
  const result = await apiCall('/api/stations/search?latitude=39.9042&longitude=116.4074&radius=10', {
    method: 'GET'
  });
  
  if (result.success && result.data && result.data.stations) {
    renderStations(result.data.stations);
  } else {
    stationsList.innerHTML = '<div class="empty-state"><div class="icon">🏪</div><p>暂无充电站数据</p></div>';
  }
}

function renderStations(stations) {
  const stationsList = document.getElementById('stations-list');
  
  if (!stations || stations.length === 0) {
    stationsList.innerHTML = '<div class="empty-state"><div class="icon">🏪</div><p>附近暂无充电站</p></div>';
    return;
  }
  
  stationsList.innerHTML = stations.map(station => `
    <div class="station-card" data-station-id="${station.id}" onclick="selectStation('${station.id}')">
      <div class="station-name">${station.name}</div>
      <div class="station-address">📍 ${station.address}</div>
      <div class="station-operators">
        <span class="operator-badge">运营商: ${station.operator_name || '未知'}</span>
        <span class="venue-badge">场地方: ${station.venue_name || '未知'}</span>
      </div>
      <div class="station-status">
        <div class="charger-count">
          <div class="count-item">
            <div class="count idle">${station.idle_chargers || 0}</div>
            <div class="label">空闲</div>
          </div>
          <div class="count-item">
            <div class="count charging">${station.charging_chargers || 0}</div>
            <div class="label">充电中</div>
          </div>
          <div class="count-item">
            <div class="count">${station.total_chargers || 0}</div>
            <div class="label">总计</div>
          </div>
        </div>
        <div class="distance">
          ${station.distance !== undefined ? (station.distance === 0 ? '当前位置' : station.distance + ' km') : ''}
        </div>
      </div>
    </div>
  `).join('');
}

async function selectStation(stationId) {
  const result = await apiCall(`/api/stations/${stationId}`, {
    method: 'GET'
  });
  
  if (result.success && result.data) {
    state.currentStation = result.data;
    showStationDetail(result.data);
    renderChargers(result.data.chargers);
    setFlowStep(2);
  }
}

function showStationDetail(station) {
  const detailCard = document.getElementById('selected-station-info');
  detailCard.innerHTML = `
    <div class="station-name">${station.name}</div>
    <div class="station-address">📍 ${station.address}</div>
    <div class="station-operators">
      <span class="operator-badge">运营商: ${station.operator_name || '未知'}</span>
      <span class="venue-badge">场地方: ${station.venue_name || '未知'}</span>
    </div>
    <div class="station-status" style="margin-top: 0.75rem;">
      <div class="charger-count">
        <div class="count-item">
          <div class="count idle">${station.chargers?.filter(c => c.status === 'idle').length || 0}</div>
          <div class="label">空闲</div>
        </div>
        <div class="count-item">
          <div class="count charging">${station.chargers?.filter(c => c.status === 'charging').length || 0}</div>
          <div class="label">充电中</div>
        </div>
      </div>
    </div>
  `;
}

function renderChargers(chargers) {
  const chargersList = document.getElementById('chargers-list');
  
  if (!chargers || chargers.length === 0) {
    chargersList.innerHTML = '<div class="empty-state"><div class="icon">🔌</div><p>该充电站暂无充电桩</p></div>';
    return;
  }
  
  chargersList.innerHTML = chargers.map(charger => {
    const isIdle = charger.status === 'idle';
    const isCharging = charger.status === 'charging';
    const isMaintenance = charger.status === 'maintenance';
    
    return `
      <div class="charger-card ${charger.status} ${!isIdle ? 'disabled' : ''}" 
           data-charger-id="${charger.id}"
           ${isIdle ? `onclick="selectCharger('${charger.id}')"` : ''}>
        <div class="charger-header">
          <div class="charger-code">🔌 ${charger.charger_code}</div>
          <span class="charger-status-badge ${charger.status}">
            ${isIdle ? '空闲' : isCharging ? '充电中' : isMaintenance ? '维护中' : charger.status}
          </span>
        </div>
        <div class="charger-info">
          <div class="charger-info-item">
            ⚡ 功率: <span class="value">${charger.power} kW</span>
          </div>
          <div class="charger-info-item">
            🔌 接口: <span class="value">${charger.connector_type}</span>
          </div>
          <div class="charger-info-item">
            📱 扫码: <span class="value">${charger.qr_code}</span>
          </div>
        </div>
        ${isIdle ? `
          <div class="charger-actions">
            <button class="btn btn-success" onclick="event.stopPropagation(); startCharging('${charger.id}')">
              🚀 开始充电
            </button>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

function selectCharger(chargerId) {
  if (!state.currentStation) return;
  
  const charger = state.currentStation.chargers?.find(c => c.id === chargerId);
  if (charger) {
    state.currentCharger = charger;
  }
}

async function startCharging(chargerId) {
  const result = await apiCall('/api/charging/start', {
    method: 'POST',
    body: {
      chargerId: chargerId,
      userId: state.userId
    }
  });
  
  if (result.success && result.data) {
    state.currentSessionId = result.data.sessionId;
    state.currentCharger = { id: chargerId };
    setFlowStep(3);
    await loadChargingStatus();
    
    state.chargingInterval = setInterval(async () => {
      await loadChargingStatus();
    }, 5000);
  } else {
    alert('启动充电失败: ' + (result.message || '未知错误'));
  }
}

async function loadChargingStatus() {
  if (!state.currentSessionId) return;
  
  const result = await apiCall(`/api/charging/${state.currentSessionId}/status`, {
    method: 'GET'
  });
  
  if (result.success && result.data) {
    renderChargingStatus(result.data);
  }
}

function renderChargingStatus(session) {
  const infoContainer = document.getElementById('charging-info');
  
  const startTime = session.startTime ? new Date(session.startTime) : new Date();
  const now = new Date();
  const durationMs = now - startTime;
  const durationMinutes = Math.floor(durationMs / 60000);
  const durationSeconds = Math.floor((durationMs % 60000) / 1000);
  
  const energy = session.energyDelivered || 0;
  const estimatedCost = session.estimatedCost || 0;
  
  infoContainer.innerHTML = `
    <div class="charging-metric">
      <div class="metric-label">已充电量</div>
      <div class="metric-value energy">${energy.toFixed(2)} <span style="font-size: 1rem;">kWh</span></div>
    </div>
    <div class="charging-metric">
      <div class="metric-label">预估费用</div>
      <div class="metric-value cost">¥${estimatedCost.toFixed(2)}</div>
    </div>
    <div class="charging-metric">
      <div class="metric-label">充电时长</div>
      <div class="metric-value time">${durationMinutes}:${String(durationSeconds).padStart(2, '0')}</div>
    </div>
    <div class="charging-metric">
      <div class="metric-label">当前功率</div>
      <div class="metric-value">${session.chargerPower || 120} <span style="font-size: 1rem;">kW</span></div>
    </div>
  `;
}

async function stopCharging() {
  if (!state.currentSessionId) return;
  
  if (state.chargingInterval) {
    clearInterval(state.chargingInterval);
    state.chargingInterval = null;
  }
  
  const result = await apiCall(`/api/charging/${state.currentSessionId}/stop`, {
    method: 'POST',
    body: { reason: 'USER_REQUEST' }
  });
  
  if (result.success && result.data) {
    setFlowStep(4);
    renderPaymentPanel(result.data);
  } else {
    alert('结束充电失败: ' + (result.message || '未知错误'));
  }
}

function renderPaymentPanel(sessionData) {
  const paymentCard = document.getElementById('payment-details');
  
  const totalAmount = sessionData.totalAmount || sessionData.estimatedCost || 0;
  const energy = sessionData.energyDelivered || 0;
  
  const electricityCost = energy * 1.2;
  const serviceFee = totalAmount - electricityCost;
  
  paymentCard.innerHTML = `
    <div class="payment-header">
      <div class="payment-status">✅ 充电已完成</div>
      <div class="payment-amount">
        <span class="currency">¥</span>${totalAmount.toFixed(2)}
      </div>
    </div>
    
    <div class="payment-details">
      <div class="payment-detail-item">
        <span class="label">充电电量</span>
        <span class="value">${energy.toFixed(2)} kWh</span>
      </div>
      <div class="payment-detail-item">
        <span class="label">电费</span>
        <span class="value">¥${electricityCost.toFixed(2)}</span>
      </div>
      <div class="payment-detail-item">
        <span class="label">服务费</span>
        <span class="value">¥${Math.max(0, serviceFee).toFixed(2)}</span>
      </div>
      <div class="payment-detail-item">
        <span class="label">合计</span>
        <span class="value" style="color: #667eea; font-weight: bold;">¥${totalAmount.toFixed(2)}</span>
      </div>
    </div>
    
    <div class="payment-actions">
      <button class="btn btn-success" onclick="processPayment()">
        💳 立即支付
      </button>
      <button class="btn btn-secondary" onclick="goToStep(1)">
        🔄 返回充电
      </button>
    </div>
    
    <div class="review-section">
      <h3>⭐ 评价服务</h3>
      <div class="star-rating" id="star-rating">
        <span class="star" data-rating="1">★</span>
        <span class="star" data-rating="2">★</span>
        <span class="star" data-rating="3">★</span>
        <span class="star" data-rating="4">★</span>
        <span class="star" data-rating="5">★</span>
      </div>
      <div class="form-group">
        <label>评价内容:</label>
        <textarea id="review-comment" rows="3" placeholder="请输入您的评价..."></textarea>
      </div>
      <button class="btn btn-primary" onclick="submitReview()">提交评价</button>
    </div>
    
    <div id="payment-result"></div>
  `;
  
  initStarRating();
}

function initStarRating() {
  const stars = document.querySelectorAll('.star-rating .star');
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const rating = parseInt(this.dataset.rating);
      state.selectedRating = rating;
      
      stars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
    
    star.addEventListener('mouseenter', function() {
      const rating = parseInt(this.dataset.rating);
      stars.forEach((s, index) => {
        if (index < rating) {
          s.classList.add('active');
        }
      });
    });
  });
  
  const ratingContainer = document.querySelector('.star-rating');
  if (ratingContainer) {
    ratingContainer.addEventListener('mouseleave', function() {
      stars.forEach((s, index) => {
        if (index < (state.selectedRating || 0)) {
          s.classList.add('active');
        } else {
          s.classList.remove('active');
        }
      });
    });
  }
}

async function processPayment() {
  if (!state.currentSessionId) return;
  
  const result = await apiCall('/api/payments/create', {
    method: 'POST',
    body: {
      sessionId: state.currentSessionId,
      userId: state.userId,
      amount: 0,
      paymentMethod: 'wechat'
    }
  });
  
  if (!result.success) {
    document.getElementById('payment-result').innerHTML = 
      '<div class="result-area error">创建支付失败: ' + (result.message || '未知错误') + '</div>';
    return;
  }
  
  const paymentId = result.data.paymentId;
  
  const processResult = await apiCall(`/api/payments/${paymentId}/process`, {
    method: 'POST'
  });
  
  const type = processResult.success ? 'success' : 'error';
  document.getElementById('payment-result').innerHTML = 
    '<div class="result-area ' + type + '">' + 
    (processResult.success ? '✅ 支付成功！' : '❌ 支付失败: ' + (processResult.message || '未知错误')) + 
    '</div>';
}

async function submitReview() {
  if (!state.currentSessionId) return;
  
  const rating = state.selectedRating || 5;
  const comment = document.getElementById('review-comment')?.value || '';
  
  const result = await apiCall('/api/reviews/create', {
    method: 'POST',
    body: {
      sessionId: state.currentSessionId,
      userId: state.userId,
      rating: rating,
      comment: comment,
      images: null
    }
  });
  
  const type = result.success ? 'success' : 'error';
  const message = result.success 
    ? '✅ 评价提交成功！' + (rating <= 3 ? ' 差评已自动触发巡检工单。' : '')
    : '❌ 评价失败: ' + (result.message || '未知错误');
  
  document.getElementById('payment-result').innerHTML = 
    '<div class="result-area ' + type + '">' + message + '</div>';
}

function goToStep(step) {
  if (step === 1) {
    state.currentStation = null;
    state.currentCharger = null;
    state.currentSessionId = null;
    if (state.chargingInterval) {
      clearInterval(state.chargingInterval);
      state.chargingInterval = null;
    }
    loadStations();
  }
  setFlowStep(step);
}

function initEventListeners() {
  document.getElementById('btn-refresh-stations')?.addEventListener('click', function() {
    loadStations();
  });
  
  document.getElementById('btn-back-to-stations')?.addEventListener('click', function() {
    goToStep(1);
  });
  
  document.getElementById('btn-stop-charging')?.addEventListener('click', function() {
    stopCharging();
  });
  
  document.getElementById('btn-view-history')?.addEventListener('click', async function() {
    const result = await apiCall('/api/audit/charging-logs', {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('history-result', result, type);
  });

  initOtherPanels();
}

function initOtherPanels() {
  document.getElementById('btn-search')?.addEventListener('click', async function() {
    const lat = document.getElementById('search-lat')?.value;
    const lng = document.getElementById('search-lng')?.value;
    const radius = document.getElementById('search-radius')?.value;
    
    const params = new URLSearchParams();
    if (lat) params.append('latitude', lat);
    if (lng) params.append('longitude', lng);
    if (radius) params.append('radius', radius);
    
    const result = await apiCall(`/api/stations/search?${params}`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('search-result', result, type);
  });

  document.getElementById('btn-station-detail')?.addEventListener('click', async function() {
    const stationId = document.getElementById('station-detail-id')?.value;
    
    if (!stationId) {
      showResult('station-detail-result', { message: '请输入充电站ID' }, 'error');
      return;
    }
    
    const result = await apiCall(`/api/stations/${stationId}`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('station-detail-result', result, type);
  });

  document.getElementById('btn-start-charging')?.addEventListener('click', async function() {
    const chargerId = document.getElementById('start-charger-id')?.value;
    const userId = document.getElementById('start-user-id')?.value;
    
    if (!chargerId || !userId) {
      showResult('start-result', { message: '请输入充电桩ID和用户ID' }, 'error');
      return;
    }
    
    const result = await apiCall('/api/charging/start', {
      method: 'POST',
      body: { chargerId, userId }
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('start-result', result, type);
  });

  document.getElementById('btn-session-status')?.addEventListener('click', async function() {
    const sessionId = document.getElementById('session-status-id')?.value;
    
    if (!sessionId) {
      showResult('session-status-result', { message: '请输入会话ID' }, 'error');
      return;
    }
    
    const result = await apiCall(`/api/charging/${sessionId}/status`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('session-status-result', result, type);
  });

  document.getElementById('btn-pricing-rules')?.addEventListener('click', async function() {
    const result = await apiCall('/api/charging/pricing/rules', {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('pricing-result', result, type);
  });

  document.getElementById('btn-estimate')?.addEventListener('click', async function() {
    const energy = document.getElementById('estimate-energy')?.value;
    
    if (!energy) {
      showResult('estimate-result', { message: '请输入预估电量' }, 'error');
      return;
    }
    
    const result = await apiCall('/api/charging/pricing/estimate', {
      method: 'POST',
      body: { energy: parseFloat(energy) }
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('estimate-result', result, type);
  });

  document.getElementById('btn-settlement-report')?.addEventListener('click', async function() {
    const startDate = document.getElementById('settlement-start')?.value;
    const endDate = document.getElementById('settlement-end')?.value;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const result = await apiCall(`/api/payments/settlement/report?${params}`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('settlement-result', result, type);
  });

  document.getElementById('btn-exec-settlement')?.addEventListener('click', async function() {
    const sessionId = document.getElementById('exec-settlement-id')?.value;
    
    if (!sessionId) {
      showResult('exec-settlement-result', { message: '请输入会话ID' }, 'error');
      return;
    }
    
    const result = await apiCall(`/api/payments/settlement/${sessionId}/execute`, {
      method: 'POST'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('exec-settlement-result', result, type);
  });

  document.getElementById('btn-venue-report')?.addEventListener('click', async function() {
    const startDate = document.getElementById('venue-start')?.value;
    const endDate = document.getElementById('venue-end')?.value;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const result = await apiCall(`/api/payments/settlement/report?${params}`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('venue-result', result, type);
  });

  document.getElementById('btn-list-orders')?.addEventListener('click', async function() {
    const status = document.getElementById('maintenance-status-filter')?.value;
    
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    
    const result = await apiCall(`/api/maintenance?${params}`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('orders-list-result', result, type);
  });

  document.getElementById('btn-order-detail')?.addEventListener('click', async function() {
    const orderId = document.getElementById('maintenance-order-id')?.value;
    
    if (!orderId) {
      showResult('order-detail-result', { message: '请输入工单ID' }, 'error');
      return;
    }
    
    const result = await apiCall(`/api/maintenance/${orderId}`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('order-detail-result', result, type);
  });

  document.getElementById('btn-assign-order')?.addEventListener('click', async function() {
    const orderId = document.getElementById('maintenance-order-id')?.value;
    const maintainerId = document.getElementById('maintainer-id')?.value;
    
    if (!orderId || !maintainerId) {
      showResult('order-detail-result', { message: '请输入工单ID和运维工程师ID' }, 'error');
      return;
    }
    
    const result = await apiCall(`/api/maintenance/${orderId}/assign`, {
      method: 'POST',
      body: { maintainerId }
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('order-detail-result', result, type);
  });

  document.getElementById('btn-start-order')?.addEventListener('click', async function() {
    const orderId = document.getElementById('maintenance-order-id')?.value;
    const maintainerId = document.getElementById('maintainer-id')?.value;
    
    if (!orderId || !maintainerId) {
      showResult('order-detail-result', { message: '请输入工单ID和运维工程师ID' }, 'error');
      return;
    }
    
    const result = await apiCall(`/api/maintenance/${orderId}/start`, {
      method: 'POST',
      body: { maintainerId }
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('order-detail-result', result, type);
  });

  document.getElementById('btn-complete-order')?.addEventListener('click', async function() {
    const orderId = document.getElementById('maintenance-order-id')?.value;
    const maintainerId = document.getElementById('maintainer-id')?.value;
    
    if (!orderId || !maintainerId) {
      showResult('order-detail-result', { message: '请输入工单ID和运维工程师ID' }, 'error');
      return;
    }
    
    const result = await apiCall(`/api/maintenance/${orderId}/complete`, {
      method: 'POST',
      body: { maintainerId }
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('order-detail-result', result, type);
  });

  document.getElementById('btn-create-order')?.addEventListener('click', async function() {
    const chargerId = document.getElementById('create-order-charger')?.value;
    const description = document.getElementById('create-order-desc')?.value;
    const priority = document.getElementById('create-order-priority')?.value;
    
    if (!chargerId) {
      showResult('create-order-result', { message: '请输入充电桩ID' }, 'error');
      return;
    }
    
    const result = await apiCall('/api/maintenance/create', {
      method: 'POST',
      body: { 
        chargerId, 
        description: description || '手动创建工单',
        priority,
        userId: 'test-user-001'
      }
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('create-order-result', result, type);
  });

  document.getElementById('btn-verify-chain')?.addEventListener('click', async function() {
    const result = await apiCall('/api/audit/hash-chain/verify', {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('verify-result', result, type);
  });

  document.getElementById('btn-hash-records')?.addEventListener('click', async function() {
    const recordType = document.getElementById('hash-record-type')?.value;
    
    const params = new URLSearchParams();
    if (recordType) params.append('recordType', recordType);
    
    const result = await apiCall(`/api/audit/hash-chain/records?${params}`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('hash-records-result', result, type);
  });

  document.getElementById('btn-payment-audit')?.addEventListener('click', async function() {
    const userId = document.getElementById('audit-user-id')?.value;
    const sessionId = document.getElementById('audit-session-id')?.value;
    
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (sessionId) params.append('sessionId', sessionId);
    
    const result = await apiCall(`/api/audit/payment-audit?${params}`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('payment-audit-result', result, type);
  });

  document.getElementById('btn-settlement-audit')?.addEventListener('click', async function() {
    const result = await apiCall('/api/audit/settlement-audit', {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('settlement-audit-result', result, type);
  });

  document.getElementById('btn-charging-logs')?.addEventListener('click', async function() {
    const sessionId = document.getElementById('log-session-id')?.value;
    
    const params = new URLSearchParams();
    if (sessionId) params.append('sessionId', sessionId);
    
    const result = await apiCall(`/api/audit/charging-logs?${params}`, {
      method: 'GET'
    });
    
    const type = result.success ? 'success' : 'error';
    showResult('charging-logs-result', result, type);
  });
}

window.selectStation = selectStation;
window.selectCharger = selectCharger;
window.startCharging = startCharging;
window.stopCharging = stopCharging;
window.processPayment = processPayment;
window.submitReview = submitReview;
window.goToStep = goToStep;
window.loadStations = loadStations;
