let constants = {
    orderStatuses: {},
    statusDisplayNames: {},
    roles: {},
    exceptionTypes: {},
    exceptionSeverity: {}
};

let users = [];
let currentOrderNo = null;

document.addEventListener('DOMContentLoaded', async () => {
    await initApp();
    bindEvents();
});

async function initApp() {
    try {
        const [constantsRes, usersRes] = await Promise.all([
            api.getConstants(),
            api.getUsers()
        ]);
        
        constants = constantsRes.data;
        users = usersRes.data;
        
        populateStatusFilter();
        loadDashboard();
    } catch (error) {
        console.error('初始化失败:', error);
        showToast('初始化失败: ' + error.message, 'error');
    }
}

function bindEvents() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', () => switchPage(tab.dataset.page));
    });

    document.getElementById('roleSelector').addEventListener('change', (e) => {
        currentUser.role = e.target.value;
        updateUserSelector();
    });

    document.getElementById('userSelector').addEventListener('change', (e) => {
        const selectedUser = users.find(u => u.user_id === e.target.value);
        if (selectedUser) {
            currentUser.id = selectedUser.user_id;
            currentUser.name = selectedUser.user_name;
        }
    });

    document.getElementById('refresh-orders').addEventListener('click', loadOrders);
    document.getElementById('status-filter').addEventListener('change', loadOrders);

    document.getElementById('create-order-form').addEventListener('submit', handleCreateOrder);

    document.getElementById('back-to-orders').addEventListener('click', () => switchPage('orders'));

    document.getElementById('refresh-exceptions').addEventListener('click', loadExceptions);

    document.getElementById('refresh-messages').addEventListener('click', loadMessages);
    document.getElementById('unread-only').addEventListener('change', loadMessages);

    document.querySelectorAll('.report-type').forEach(btn => {
        btn.addEventListener('click', () => loadReport(btn.dataset.report));
    });

    document.getElementById('modal-overlay').addEventListener('click', (e) => {
        if (e.target.id === 'modal-overlay') {
            hideModal();
        }
    });
}

function updateUserSelector() {
    const selector = document.getElementById('userSelector');
    const filteredUsers = users.filter(u => u.role === currentUser.role);
    
    if (filteredUsers.length > 0) {
        selector.innerHTML = filteredUsers.map(u => 
            `<option value="${u.user_id}">${u.user_name}</option>`
        ).join('');
        selector.style.display = 'inline-block';
        currentUser.id = filteredUsers[0].user_id;
        currentUser.name = filteredUsers[0].user_name;
    } else {
        selector.style.display = 'none';
    }
}

function switchPage(pageName) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === pageName);
    });

    document.querySelectorAll('.page').forEach(page => {
        page.classList.toggle('active', page.id === `page-${pageName}`);
    });

    switch (pageName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'orders':
            loadOrders();
            break;
        case 'exceptions':
            loadExceptions();
            break;
        case 'messages':
            loadMessages();
            break;
    }
}

function populateStatusFilter() {
    const filter = document.getElementById('status-filter');
    const currentHtml = Object.entries(constants.statusDisplayNames).map(([key, value]) => 
        `<option value="${key}">${value}</option>`
    ).join('');
    filter.innerHTML = '<option value="">全部状态</option>' + currentHtml;
}

async function loadDashboard() {
    try {
        const stats = await api.getStatistics();
        const content = document.getElementById('dashboard-content');
        
        const statusCounts = {};
        stats.data.statusStats.forEach(s => {
            statusCounts[s.status] = s.count;
        });

        content.innerHTML = `
            <div class="stat-card">
                <h3>📋 订单总数</h3>
                <div class="value">${stats.data.totalOrders}</div>
            </div>
            <div class="stat-card success">
                <h3>✅ 已完成</h3>
                <div class="value">${statusCounts['ARRIVAL_CONFIRMED'] || 0}</div>
            </div>
            <div class="stat-card warning">
                <h3>⏳ 进行中</h3>
                <div class="value">${
                    (statusCounts['PENDING_LOCATION'] || 0) + 
                    (statusCounts['PENDING_ROUTE_PLANNING'] || 0) + 
                    (statusCounts['NAVIGATION_EXECUTING'] || 0) +
                    (statusCounts['PENDING_TRAJECTORY'] || 0)
                }</div>
            </div>
            <div class="stat-card danger">
                <h3>⚠️ 异常/取消</h3>
                <div class="value">${(statusCounts['EXCEPTION'] || 0) + (statusCounts['CANCELLED'] || 0)}</div>
            </div>
            <div class="stat-card danger">
                <h3>💬 未读消息</h3>
                <div class="value">${stats.data.unreadMessages}</div>
            </div>
        `;
    } catch (error) {
        console.error('加载看板失败:', error);
        showToast('加载看板失败: ' + error.message, 'error');
    }
}

async function loadOrders() {
    try {
        const statusFilter = document.getElementById('status-filter').value;
        const params = {};
        if (statusFilter) params.status = statusFilter;
        
        const result = await api.getOrders(params);
        renderOrdersTable(result.data);
    } catch (error) {
        console.error('加载订单失败:', error);
        showToast('加载订单失败: ' + error.message, 'error');
    }
}

function renderOrdersTable(orders) {
    const container = document.getElementById('orders-table');
    
    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>暂无订单数据</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>订单号</th>
                    <th>状态</th>
                    <th>起点</th>
                    <th>终点</th>
                    <th>距离</th>
                    <th>预计时长</th>
                    <th>创建时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${orders.map(order => `
                    <tr>
                        <td><strong>${order.order_no}</strong></td>
                        <td><span class="status-badge ${getStatusClass(order.status)}">${order.statusName || order.status}</span></td>
                        <td>${order.origin_address || `${order.origin_lat}, ${order.origin_lng}` || '-'}</td>
                        <td>${order.dest_address || `${order.dest_lat}, ${order.dest_lng}` || '-'}</td>
                        <td>${formatDistance(order.distance_meters)}</td>
                        <td>${formatDuration(order.eta_seconds)}</td>
                        <td>${formatDate(order.created_at)}</td>
                        <td>
                            <button class="btn btn-primary btn-small" onclick="viewOrderDetail('${order.order_no}')">详情</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function viewOrderDetail(orderNo) {
    currentOrderNo = orderNo;
    switchPage('order-detail');
    
    try {
        const order = await api.getOrder(orderNo);
        renderOrderDetail(order.data);
    } catch (error) {
        console.error('加载订单详情失败:', error);
        showToast('加载订单详情失败: ' + error.message, 'error');
    }
}

function renderOrderDetail(order) {
    document.getElementById('detail-order-no').textContent = `订单详情 - ${order.order_no}`;
    
    const content = document.getElementById('order-detail-content');
    
    const actions = getAvailableActions(order.status);
    
    content.innerHTML = `
        <div class="action-bar">
            ${actions.map(action => `
                <button class="btn ${action.class}" onclick="executeAction('${order.order_no}', '${action.key}')">
                    ${action.label}
                </button>
            `).join('')}
        </div>
        
        <div class="order-detail-grid">
            <div>
                <div class="detail-card">
                    <h3>📋 订单信息</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="label">订单号</div>
                            <div class="value">${order.order_no}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">当前状态</div>
                            <div class="value">
                                <span class="status-badge ${getStatusClass(order.status)}">${order.statusName}</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div class="label">创建时间</div>
                            <div class="value">${formatDate(order.created_at)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">更新时间</div>
                            <div class="value">${formatDate(order.updated_at)}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-card">
                    <h3>📍 位置信息</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="label">起点纬度</div>
                            <div class="value">${order.origin_lat || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">起点经度</div>
                            <div class="value">${order.origin_lng || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">起点地址</div>
                            <div class="value">${order.origin_address || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">终点纬度</div>
                            <div class="value">${order.dest_lat || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">终点经度</div>
                            <div class="value">${order.dest_lng || '-'}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">终点地址</div>
                            <div class="value">${order.dest_address || '-'}</div>
                        </div>
                    </div>
                </div>

                <div class="detail-card">
                    <h3>📏 路线信息</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <div class="label">距离</div>
                            <div class="value">${formatDistance(order.distance_meters)}</div>
                        </div>
                        <div class="detail-item">
                            <div class="label">预计时长</div>
                            <div class="value">${formatDuration(order.eta_seconds)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <div class="detail-card">
                    <h3>📜 时间轴</h3>
                    <div class="timeline">
                        ${(order.timeline || []).length > 0 ? order.timeline.map(event => `
                            <div class="timeline-item">
                                <div class="time">${formatDate(event.created_at)}</div>
                                <div class="title">${event.title}</div>
                                <div class="content">${event.content || ''}</div>
                            </div>
                        `).join('') : '<p style="color: var(--text-secondary)">暂无时间轴记录</p>'}
                    </div>
                </div>

                <div class="detail-card">
                    <h3>📝 操作日志</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${(order.logs || []).length > 0 ? order.logs.map(log => `
                            <div style="padding: 8px 0; border-bottom: 1px solid var(--border-color);">
                                <div style="font-size: 12px; color: var(--text-secondary);">${formatDate(log.created_at)}</div>
                                <div style="font-weight: 500;">${log.action}</div>
                                <div style="font-size: 13px; color: var(--text-secondary);">${log.comment || '-'}</div>
                            </div>
                        `).join('') : '<p style="color: var(--text-secondary)">暂无操作日志</p>'}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getAvailableActions(status) {
    const actions = [];
    
    switch (status) {
        case 'PENDING_LOCATION':
            actions.push({ key: 'submit_location', label: '📍 提交位置', class: 'btn-primary' });
            actions.push({ key: 'cancel', label: '❌ 取消订单', class: 'btn-danger' });
            break;
        case 'PENDING_ROUTE_PLANNING':
            actions.push({ key: 'plan_route', label: '🗺️ 规划路线', class: 'btn-primary' });
            actions.push({ key: 'view_routes', label: '📋 查看路线', class: 'btn-secondary' });
            actions.push({ key: 'reject_route', label: '❌ 驳回', class: 'btn-danger' });
            actions.push({ key: 'cancel', label: '❌ 取消订单', class: 'btn-danger' });
            break;
        case 'NAVIGATION_EXECUTING':
            actions.push({ key: 'update_location', label: '📍 更新位置', class: 'btn-primary' });
            actions.push({ key: 'complete_navigation', label: '✅ 完成导航', class: 'btn-success' });
            actions.push({ key: 'view_trajectories', label: '📊 查看轨迹', class: 'btn-secondary' });
            actions.push({ key: 'cancel', label: '❌ 取消订单', class: 'btn-danger' });
            break;
        case 'PENDING_TRAJECTORY':
            actions.push({ key: 'view_trajectories', label: '📊 查看轨迹', class: 'btn-secondary' });
            actions.push({ key: 'confirm_arrival', label: '✅ 确认到达', class: 'btn-success' });
            actions.push({ key: 'cancel', label: '❌ 取消订单', class: 'btn-danger' });
            break;
    }
    
    return actions;
}

async function executeAction(orderNo, action) {
    switch (action) {
        case 'submit_location':
            showSubmitLocationModal(orderNo);
            break;
        case 'plan_route':
            await planRoute(orderNo);
            break;
        case 'view_routes':
            await showRoutesModal(orderNo);
            break;
        case 'reject_route':
            showRejectRouteModal(orderNo);
            break;
        case 'update_location':
            showUpdateLocationModal(orderNo);
            break;
        case 'complete_navigation':
            showCompleteNavigationModal(orderNo);
            break;
        case 'view_trajectories':
            await showTrajectoriesModal(orderNo);
            break;
        case 'confirm_arrival':
            await confirmArrival(orderNo);
            break;
        case 'cancel':
            showCancelOrderModal(orderNo);
            break;
    }
}

function showSubmitLocationModal(orderNo) {
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>📍 提交位置信息</h3>
            <button class="modal-close" onclick="hideModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>起点纬度 *</label>
                <input type="number" step="any" id="modal-origin_lat" value="39.8947" required>
            </div>
            <div class="form-group">
                <label>起点经度 *</label>
                <input type="number" step="any" id="modal-origin_lng" value="116.3225" required>
            </div>
            <div class="form-group">
                <label>起点地址</label>
                <input type="text" id="modal-origin_address" placeholder="如：北京西站">
            </div>
            <div class="form-group">
                <label>终点纬度 *</label>
                <input type="number" step="any" id="modal-dest_lat" value="39.9055" required>
            </div>
            <div class="form-group">
                <label>终点经度 *</label>
                <input type="number" step="any" id="modal-dest_lng" value="116.3976" required>
            </div>
            <div class="form-group">
                <label>终点地址</label>
                <input type="text" id="modal-dest_address" placeholder="如：天安门广场">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideModal()">取消</button>
            <button class="btn btn-primary" onclick="submitLocation('${orderNo}')">提交</button>
        </div>
    `;
    showModal();
}

async function submitLocation(orderNo) {
    try {
        const data = {
            origin_lat: parseFloat(document.getElementById('modal-origin_lat').value),
            origin_lng: parseFloat(document.getElementById('modal-origin_lng').value),
            origin_address: document.getElementById('modal-origin_address').value,
            dest_lat: parseFloat(document.getElementById('modal-dest_lat').value),
            dest_lng: parseFloat(document.getElementById('modal-dest_lng').value),
            dest_address: document.getElementById('modal-dest_address').value
        };
        
        await api.submitLocation(orderNo, data);
        hideModal();
        showToast('位置信息提交成功', 'success');
        viewOrderDetail(orderNo);
    } catch (error) {
        showToast('提交失败: ' + error.message, 'error');
    }
}

async function planRoute(orderNo) {
    try {
        const result = await api.planRoute(orderNo);
        showToast(`已生成 ${result.data.routes.length} 条路线', 'success');
        viewOrderDetail(orderNo);
    } catch (error) {
        showToast('规划路线失败: ' + error.message, 'error');
    }
}

async function showRoutesModal(orderNo) {
    try {
        const routes = await api.getRoutes(orderNo);
        
        if (routes.data.length === 0) {
            showToast('暂无路线数据，请先规划路线', 'warning');
            return;
        }
        
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>🗺️ 路线选择</h3>
                <button class="modal-close" onclick="hideModal()">×</button>
            </div>
            <div class="modal-body">
                ${routes.data.map((route, index) => `
                    <div style="padding: 16px; border: 2px solid ${route.is_selected ? 'var(--primary-color)' : 'var(--border-color)'} ; border-radius: var(--radius); margin-bottom: 12px; background: ${route.is_selected ? '#e6f7ff' : 'white'}">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <strong style="font-size: 16px;">${route.route_type === 'fastest' ? '🚀 最快路线' : route.route_type === 'shortest' ? '📏 最短路线' : route.route_type === 'no_toll' ? '💰 无收费' : '🛣️ 不走高速'}</strong>
                            ${route.is_selected ? '<span class="status-badge status-success">已选择</span>' : ''}
                        </div>
                        <p style="color: var(--text-secondary); margin-bottom: 8px;">${route.route_summary}</p>
                        <div style="display: flex; gap: 16px; font-size: 14px;">
                            <span>📏 ${formatDistance(route.distance_meters)}</span>
                            <span>⏱️ ${formatDuration(route.duration_seconds)}</span>
                            <span>🚦 路况: ${route.traffic_level === 'light' ? '畅通' : route.traffic_level === 'moderate' ? '缓行' : route.traffic_level === 'heavy' ? '拥堵' : '严重拥堵'}</span>
                        </div>
                        ${!route.is_selected ? `
                            <div style="margin-top: 12px;">
                                <button class="btn btn-primary btn-small" onclick="approveRoute('${orderNo}', '${route.route_id}')">选择此路线</button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="hideModal()">关闭</button>
            </div>
        `;
        showModal();
    } catch (error) {
        showToast('加载路线失败: ' + error.message, 'error');
    }
}

async function approveRoute(orderNo, routeId) {
    try {
        const drivers = users.filter(u => u.role === 'DRIVER');
        if (drivers.length === 0) {
            showToast('没有可用的司机', 'error');
            return;
        }
        
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>👤 选择司机</h3>
                <button class="modal-close" onclick="hideModal()">×</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>选择司机 *</label>
                    <select id="select-driver">
                        ${drivers.map(d => `<option value="${d.user_id}">${d.user_name}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="hideModal()">取消</button>
                <button class="btn btn-primary" onclick="doApproveRoute('${orderNo}', '${routeId}')">确认</button>
            </div>
        `;
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
}

async function doApproveRoute(orderNo, routeId) {
    try {
        const driverId = document.getElementById('select-driver').value;
        await api.approveRoute(orderNo, { route_id: routeId, driver_id: driverId });
        hideModal();
        showToast('路线已确认', 'success');
        viewOrderDetail(orderNo);
    } catch (error) {
        showToast('确认失败: ' + error.message, 'error');
    }
}

function showRejectRouteModal(orderNo) {
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>❌ 驳回路线</h3>
            <button class="modal-close" onclick="hideModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>驳回原因 *</label>
                <textarea id="reject-reason" rows="3" placeholder="请输入驳回原因..."></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideModal()">取消</button>
            <button class="btn btn-danger" onclick="doRejectRoute('${orderNo}')">确认驳回</button>
        </div>
    `;
    showModal();
}

async function doRejectRoute(orderNo) {
    try {
        const reason = document.getElementById('reject-reason').value;
        if (!reason.trim()) {
            showToast('请输入驳回原因', 'warning');
            return;
        }
        
        await api.rejectRoute(orderNo, { reject_reason: reason });
        hideModal();
        showToast('路线已驳回', 'success');
        viewOrderDetail(orderNo);
    } catch (error) {
        showToast('驳回失败: ' + error.message, 'error');
    }
}

function showUpdateLocationModal(orderNo) {
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>📍 更新位置</h3>
            <button class="modal-close" onclick="hideModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>纬度 *</label>
                <input type="number" step="any" id="update-lat" value="39.8947" required>
            </div>
            <div class="form-group">
                <label>经度 *</label>
                <input type="number" step="any" id="update-lng" value="116.3225" required>
            </div>
            <div class="form-group">
                <label>速度 (km/h)</label>
                <input type="number" step="any" id="update-speed" value="45">
            </div>
            <div class="form-group">
                <label>精度 (米)</label>
                <input type="number" step="any" id="update-accuracy" value="10">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideModal()">取消</button>
            <button class="btn btn-primary" onclick="doUpdateLocation('${orderNo}')">提交</button>
        </div>
    `;
    showModal();
}

async function doUpdateLocation(orderNo) {
    try {
        const data = {
            lat: parseFloat(document.getElementById('update-lat').value),
            lng: parseFloat(document.getElementById('update-lng').value),
            speed_kmh: parseFloat(document.getElementById('update-speed').value) || 0,
            accuracy_meters: parseFloat(document.getElementById('update-accuracy').value) || 10,
            timestamp: new Date().toISOString()
        };
        
        const result = await api.updateLocation(orderNo, data);
        
        if (result.data.isAbnormal) {
            showToast(`位置已更新（检测到异常：${result.data.abnormalType}）`, 'warning');
        } else {
            showToast('位置已更新', 'success');
        }
        
        hideModal();
        viewOrderDetail(orderNo);
    } catch (error) {
        showToast('更新失败: ' + error.message, 'error');
    }
}

function showCompleteNavigationModal(orderNo) {
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>✅ 完成导航</h3>
            <button class="modal-close" onclick="hideModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>到达纬度 *</label>
                <input type="number" step="any" id="complete-lat" value="39.9055" required>
            </div>
            <div class="form-group">
                <label>到达经度 *</label>
                <input type="number" step="any" id="complete-lng" value="116.3976" required>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideModal()">取消</button>
            <button class="btn btn-success" onclick="doCompleteNavigation('${orderNo}')">确认完成</button>
        </div>
    `;
    showModal();
}

async function doCompleteNavigation(orderNo) {
    try {
        const data = {
            arrival_lat: parseFloat(document.getElementById('complete-lat').value),
            arrival_lng: parseFloat(document.getElementById('complete-lng').value),
            arrival_time: new Date().toISOString()
        };
        
        await api.completeNavigation(orderNo, data);
        hideModal();
        showToast('导航已完成', 'success');
        viewOrderDetail(orderNo);
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
}

async function showTrajectoriesModal(orderNo) {
    try {
        const report = await api.getTrajectoryReviewReport(orderNo);
        const data = report.data;
        
        const modalContent = document.getElementById('modal-content');
        modalContent.innerHTML = `
            <div class="modal-header">
                <h3>📊 轨迹回放</h3>
                <button class="modal-close" onclick="hideModal()">×</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 16px;">
                    <strong>总轨迹点:</strong> ${data.totalPoints} | 
                    <strong>异常点:</strong> ${data.abnormalPoints}
                    ${data.timeRange ? `| <strong>时间范围:</strong> ${formatDate(data.timeRange.start)} - ${formatDate(data.timeRange.end)}` : ''}
                </div>
                ${data.trajectories && data.trajectories.length > 0 ? `
                    <div class="trajectory-map">
                        🗺️ 地图展示区域（可接入地图SDK）
                    </div>
                    <div class="trajectory-points">
                        ${data.trajectories.map(traj => `
                            <div class="trajectory-point ${traj.is_abnormal ? 'abnormal' : ''}">
                                <span>📍 (${traj.lat?.toFixed(4)}, ${traj.lng?.toFixed(4)})</span>
                                <span>🚗 ${traj.speed_kmh || 0} km/h</span>
                                <span>⏰ ${formatDate(traj.timestamp)}</span>
                                ${traj.is_abnormal ? `<span style="color: var(--danger-color);">⚠️ ${traj.abnormal_type}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                ` : '<div class="empty-state"><div class="icon">📭</div><p>暂无轨迹数据</p></div>'}
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="hideModal()">关闭</button>
            </div>
        `;
        showModal();
    } catch (error) {
        showToast('加载轨迹失败: ' + error.message, 'error');
    }
}

async function confirmArrival(orderNo) {
    try {
        const result = await api.confirmArrival(orderNo, {
            confirm_time: new Date().toISOString()
        });
        showToast('到达已确认', 'success');
        viewOrderDetail(orderNo);
    } catch (error) {
        showToast('确认失败: ' + error.message, 'error');
    }
}

function showCancelOrderModal(orderNo) {
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>❌ 取消订单</h3>
            <button class="modal-close" onclick="hideModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>取消原因 *</label>
                <textarea id="cancel-reason" rows="3" placeholder="请输入取消原因..."></textarea>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideModal()">取消</button>
            <button class="btn btn-danger" onclick="doCancelOrder('${orderNo}')">确认取消</button>
        </div>
    `;
    showModal();
}

async function doCancelOrder(orderNo) {
    try {
        const reason = document.getElementById('cancel-reason').value;
        if (!reason.trim()) {
            showToast('请输入取消原因', 'warning');
            return;
        }
        
        await api.cancelOrder(orderNo, { cancel_reason: reason });
        hideModal();
        showToast('订单已取消', 'success');
        viewOrderDetail(orderNo);
    } catch (error) {
        showToast('取消失败: ' + error.message, 'error');
    }
}

async function loadExceptions() {
    try {
        const result = await api.getExceptions();
        renderExceptionsTable(result.data);
    } catch (error) {
        console.error('加载异常失败:', error);
        showToast('加载异常失败: ' + error.message, 'error');
    }
}

function renderExceptionsTable(exceptions) {
    const container = document.getElementById('exceptions-table');
    
    if (!exceptions || exceptions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">✅</div>
                <p>暂无异常数据</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>异常ID</th>
                    <th>订单号</th>
                    <th>异常类型</th>
                    <th>严重程度</th>
                    <th>状态</th>
                    <th>重试次数</th>
                    <th>创建时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${exceptions.map(ex => `
                    <tr>
                        <td><strong>${ex.exception_id}</strong></td>
                        <td><a href="#" onclick="viewOrderDetail('${ex.order_no}')">${ex.order_no}</a></td>
                        <td>${ex.exception_type}</td>
                        <td><span class="status-badge ${ex.severity === 'CRITICAL' || ex.severity === 'HIGH' ? 'status-danger' : 'status-warning'}">${ex.severity}</span></td>
                        <td><span class="status-badge ${ex.status === 'RESOLVED' ? 'status-success' : 'status-processing'}">${ex.status}</span></td>
                        <td>${ex.retry_count}/${ex.max_retries}</td>
                        <td>${formatDate(ex.created_at)}</td>
                        <td>
                            ${ex.status !== 'RESOLVED' ? `
                                <button class="btn btn-primary btn-small" onclick="showResolveExceptionModal('${ex.exception_id}')">处理</button>
                                <button class="btn btn-secondary btn-small" onclick="doRetryException('${ex.exception_id}')">重试</button>
                            ` : '<span style="color: var(--text-secondary)">已处理</span>'}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showResolveExceptionModal(exceptionId) {
    const modalContent = document.getElementById('modal-content');
    modalContent.innerHTML = `
        <div class="modal-header">
            <h3>✅ 处理异常</h3>
            <button class="modal-close" onclick="hideModal()">×</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>处理方案 *</label>
                <textarea id="resolve-resolution" rows="3" placeholder="请输入处理方案..."></textarea>
            </div>
            <div class="form-group">
                <label>目标状态 *</label>
                <select id="resolve-target-status">
                    <option value="NAVIGATION_EXECUTING">导航执行中</option>
                    <option value="PENDING_TRAJECTORY">待轨迹记录</option>
                    <option value="ARRIVAL_CONFIRMED">已到达确认</option>
                    <option value="CANCELLED">已取消</option>
                </select>
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn btn-secondary" onclick="hideModal()">取消</button>
            <button class="btn btn-primary" onclick="doResolveException('${exceptionId}')">确认处理</button>
        </div>
    `;
    showModal();
}

async function doResolveException(exceptionId) {
    try {
        const resolution = document.getElementById('resolve-resolution').value;
        const targetStatus = document.getElementById('resolve-target-status').value;
        
        if (!resolution.trim()) {
            showToast('请输入处理方案', 'warning');
            return;
        }
        
        await api.resolveException(exceptionId, {
            resolution,
            target_status: targetStatus
        });
        
        hideModal();
        showToast('异常已处理', 'success');
        loadExceptions();
    } catch (error) {
        showToast('处理失败: ' + error.message, 'error');
    }
}

async function doRetryException(exceptionId) {
    try {
        await api.retryException(exceptionId);
        showToast('已重试', 'success');
        loadExceptions();
    } catch (error) {
        showToast('重试失败: ' + error.message, 'error');
    }
}

async function loadMessages() {
    try {
        const unreadOnly = document.getElementById('unread-only').checked;
        const result = await api.getMessages({
            unread_only: unreadOnly,
            role: currentUser.role
        });
        renderMessagesList(result.data);
    } catch (error) {
        console.error('加载消息失败:', error);
        showToast('加载消息失败: ' + error.message, 'error');
    }
}

function renderMessagesList(messages) {
    const container = document.getElementById('messages-list');
    
    if (!messages || messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📭</div>
                <p>暂无消息</p>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => `
        <div class="message-item ${msg.is_read === 0 ? 'unread' : ''}">
            <div class="message-header">
                <div class="message-title">${msg.title}</div>
                <div class="message-time">${formatDate(msg.created_at)}</div>
            </div>
            <div class="message-content">${msg.content}</div>
            <div class="message-meta">
                <span>订单: ${msg.order_no}</span>
                <span>类型: ${msg.message_type}</span>
                ${msg.action_required ? `<span>操作: ${msg.action_required}</span>` : ''}
            </div>
            <div style="margin-top: 12px;">
                ${msg.is_read === 0 ? `
                    <button class="btn btn-secondary btn-small" onclick="doMarkMessageRead('${msg.message_id}')">标记已读</button>
                ` : ''}
                <button class="btn btn-primary btn-small" onclick="viewOrderDetail('${msg.order_no}')">查看订单</button>
            </div>
        </div>
    `).join('');
}

async function doMarkMessageRead(messageId) {
    try {
        await api.markMessageRead(messageId);
        showToast('已标记为已读', 'success');
        loadMessages();
    } catch (error) {
        showToast('操作失败: ' + error.message, 'error');
    }
}

async function handleCreateOrder(e) {
    e.preventDefault();
    
    try {
        const data = {
            user_id: currentUser.id,
            user_role: currentUser.role,
            origin_lat: parseFloat(document.getElementById('origin_lat').value),
            origin_lng: parseFloat(document.getElementById('origin_lng').value),
            origin_address: document.getElementById('origin_address').value,
            dest_lat: parseFloat(document.getElementById('dest_lat').value),
            dest_lng: parseFloat(document.getElementById('dest_lng').value),
            dest_address: document.getElementById('dest_address').value,
            expected_arrival_time: document.getElementById('expected_arrival_time').value || null
        };
        
        const result = await api.createOrder(data);
        showToast(`订单创建成功: ${result.data.orderNo}', 'success');
        document.getElementById('create-order-form').reset();
        
        document.getElementById('origin_lat').value = '39.8947';
        document.getElementById('origin_lng').value = '116.3225';
        document.getElementById('origin_address').value = '北京西站';
        document.getElementById('dest_lat').value = '39.9055';
        document.getElementById('dest_lng').value = '116.3976';
        document.getElementById('dest_address').value = '天安门广场';
        
    } catch (error) {
        showToast('创建订单失败: ' + error.message, 'error');
    }
}

async function loadReport(reportType) {
    try {
        let result;
        
        switch (reportType) {
            case 'order-summary':
                result = await api.getOrderSummaryReport();
                renderOrderSummaryReport(result.data);
                break;
            case 'exception-analysis':
                result = await api.getExceptionAnalysisReport();
                renderExceptionAnalysisReport(result.data);
                break;
        }
    } catch (error) {
        console.error('加载报表失败:', error);
        showToast('加载报表失败: ' + error.message, 'error');
    }
}

function renderOrderSummaryReport(data) {
    const container = document.getElementById('report-content');
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📊</div>
                <p>暂无报表数据</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>订单号</th>
                    <th>状态</th>
                    <th>起点</th>
                    <th>终点</th>
                    <th>距离</th>
                    <th>轨迹点</th>
                    <th>异常数</th>
                    <th>创建时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(item => `
                    <tr>
                        <td><strong>${item.order_no}</strong></td>
                        <td><span class="status-badge ${getStatusClass(item.status)}">${item.statusName || item.status}</span></td>
                        <td>${item.origin_address || '-'}</td>
                        <td>${item.dest_address || '-'}</td>
                        <td>${formatDistance(item.distance_meters)}</td>
                        <td>${item.trajectory_count || 0}</td>
                        <td>${item.exception_count || 0}</td>
                        <td>${formatDate(item.created_at)}</td>
                        <td>
                            <button class="btn btn-primary btn-small" onclick="viewOrderDetail('${item.order_no}')">详情</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderExceptionAnalysisReport(data) {
    const container = document.getElementById('report-content');
    
    if (!data || data.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="icon">📊</div>
                <p>暂无异常报表数据</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>异常ID</th>
                    <th>订单号</th>
                    <th>异常类型</th>
                    <th>严重程度</th>
                    <th>状态</th>
                    <th>订单状态</th>
                    <th>创建时间</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(item => `
                    <tr>
                        <td><strong>${item.exception_id}</strong></td>
                        <td>${item.order_no}</td>
                        <td>${item.exception_type}</td>
                        <td><span class="status-badge ${item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'status-danger' : 'status-warning'}">${item.severity}</span></td>
                        <td><span class="status-badge ${item.status === 'RESOLVED' ? 'status-success' : 'status-processing'}">${item.status}</span></td>
                        <td><span class="status-badge ${getStatusClass(item.order_status)}">${item.order_status}</span></td>
                        <td>${formatDate(item.created_at)}</td>
                        <td>
                            <button class="btn btn-primary btn-small" onclick="viewOrderDetail('${item.order_no}')">查看订单</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function showModal() {
    document.getElementById('modal-overlay').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('modal-overlay').classList.add('hidden');
}
