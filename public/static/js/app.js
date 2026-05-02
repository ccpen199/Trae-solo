const pages = {};

async function loadDashboardData() {
  const role = auth.getRole();
  
  try {
    if (role === 'ADMIN') {
      return await api.get('/reports/dashboard');
    }
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const schedulesResult = await api.get('/schedules', {
      startDate: todayStr,
      endDate: tomorrowStr,
      pageSize: 100,
    });
    
    const schedules = schedulesResult.data || [];
    const todaySchedules = schedules.filter(s => s.date === todayStr);
    
    return {
      success: true,
      data: {
        today: {
          schedules: todaySchedules.length,
          attendances: 0,
          hoursConsumed: 0,
          revenue: 0,
        },
        overview: {
          activeEnrollments: 0,
          pendingRenewals: 0,
          activeTeachers: 0,
          activeCourses: 0,
        },
        recentSchedules: schedules.slice(0, 5),
      },
    };
  } catch (error) {
    console.error('加载仪表盘数据失败:', error);
    return {
      success: true,
      data: {
        today: { schedules: 0, attendances: 0, hoursConsumed: 0, revenue: 0 },
        overview: { activeEnrollments: 0, pendingRenewals: 0, activeTeachers: 0, activeCourses: 0 },
        recentSchedules: [],
      },
    };
  }
}

function getRoleName(role) {
  const roles = {
    ADMIN: '管理员',
    TEACHER: '教师',
    STUDENT: '学员',
    PARENT: '家长',
  };
  return roles[role] || role;
}

function getStatusBadge(status) {
  const map = {
    ACTIVE: { class: 'badge-success', text: '正常' },
    INACTIVE: { class: 'badge-secondary', text: '禁用' },
    PENDING: { class: 'badge-warning', text: '待处理' },
    COMPLETED: { class: 'badge-success', text: '已完成' },
    CANCELLED: { class: 'badge-secondary', text: '已取消' },
    DRAFT: { class: 'badge-secondary', text: '草稿' },
    CONFIRMED: { class: 'badge-info', text: '已确认' },
    IN_PROGRESS: { class: 'badge-warning', text: '进行中' },
    FINISHED: { class: 'badge-success', text: '已完成' },
    PRESENT: { class: 'badge-success', text: '出勤' },
    ABSENT: { class: 'badge-danger', text: '缺勤' },
    LATE: { class: 'badge-warning', text: '迟到' },
    LEAVE: { class: 'badge-info', text: '请假' },
    EXPIRED: { class: 'badge-danger', text: '已过期' },
  };
  return map[status] || { class: 'badge-secondary', text: status };
}

function getMenuItems() {
  return auth.getMenuItems();
}

async function renderSidebar() {
  const menuContainer = document.getElementById('sidebarMenu');
  const menuItems = getMenuItems();
  
  let html = '';
  menuItems.forEach(section => {
    if (section.section) {
      html += `<div class="menu-section">${section.section}</div>`;
    }
    section.items.forEach(item => {
      html += `
        <div class="menu-item" data-page="${item.page}" data-id="${item.id}">
          <span class="menu-icon">${item.icon}</span>
          <span class="menu-text">${item.text}</span>
        </div>
      `;
    });
  });
  
  menuContainer.innerHTML = html;
  
  menuContainer.addEventListener('click', (e) => {
    const menuItem = e.target.closest('.menu-item');
    if (menuItem) {
      const page = menuItem.dataset.page;
      navigateTo(page);
    }
  });
}

function navigateTo(page) {
  const url = new URL(window.location.href);
  url.searchParams.set('page', page);
  window.history.pushState({}, '', url.toString());
  
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
    if (item.dataset.page === page) {
      item.classList.add('active');
      const text = item.querySelector('.menu-text').textContent;
      document.getElementById('pageTitle').textContent = text;
    }
  });
  
  loadPage(page);
}

async function loadPage(page) {
  const contentArea = document.getElementById('contentArea');
  
  if (typeof pages[page] === 'function') {
    try {
      await pages[page](contentArea);
    } catch (error) {
      console.error(`加载页面 ${page} 失败:`, error);
      contentArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">❌</div>
          <div class="empty-state-title">页面加载失败</div>
          <div class="empty-state-message">${error.message || '未知错误'}</div>
          <button class="btn btn-primary" onclick="loadPage('${page}')">重新加载</button>
        </div>
      `;
    }
  } else {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🚧</div>
        <div class="empty-state-title">功能开发中</div>
        <div class="empty-state-message">该功能正在开发中，敬请期待</div>
      </div>
    `;
  }
}

pages.dashboard = async function(container) {
  container.innerHTML = `
    <div class="loading-overlay" id="dashboardLoading">
      <div class="loading-spinner"></div>
    </div>
    <div id="dashboardContent" style="display: none;">
      <div class="stats-grid" id="statsGrid"></div>
      <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-top: 24px;">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">📅 最近课表</h3>
          </div>
          <div class="card-body" id="recentSchedules"></div>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">🔔 快捷操作</h3>
          </div>
          <div class="card-body" id="quickActions"></div>
        </div>
      </div>
    </div>
  `;
  
  try {
    const dashboardResult = await loadDashboardData();
    const data = dashboardResult.data;
    
    const statsGrid = document.getElementById('statsGrid');
    const stats = [
      { icon: '📚', class: 'primary', value: data.overview?.activeEnrollments || 0, label: '活跃报名' },
      { icon: '📅', class: 'info', value: data.today?.schedules || 0, label: '今日课表' },
      { icon: '✅', class: 'success', value: data.today?.attendances || 0, label: '今日签到' },
      { icon: '⚠️', class: 'warning', value: data.overview?.pendingRenewals || 0, label: '待续费' },
    ];
    
    statsGrid.innerHTML = stats.map(stat => `
      <div class="stat-card">
        <div class="stat-icon ${stat.class}">${stat.icon}</div>
        <div class="stat-info">
          <div class="stat-value">${stat.value}</div>
          <div class="stat-label">${stat.label}</div>
        </div>
      </div>
    `).join('');
    
    const quickActions = document.getElementById('quickActions');
    quickActions.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button class="btn btn-primary" onclick="navigateTo('enrollments')">
          <span>📝</span>
          <span>报名管理</span>
        </button>
        <button class="btn btn-primary" onclick="navigateTo('schedules')">
          <span>📅</span>
          <span>课表管理</span>
        </button>
        <button class="btn btn-primary" onclick="navigateTo('attendances')">
          <span>✅</span>
          <span>考勤管理</span>
        </button>
        <button class="btn btn-primary" onclick="navigateTo('reports')">
          <span>📈</span>
          <span>经营报表</span>
        </button>
      </div>
    `;
    
    try {
      let schedules = data.recentSchedules;
      if (!schedules || schedules.length === 0) {
        const schedulesResult = await api.get('/schedules', { page: 1, pageSize: 5 });
        schedules = schedulesResult.data || [];
      }
      
      const recentSchedules = document.getElementById('recentSchedules');
      
      if (schedules && schedules.length > 0) {
        recentSchedules.innerHTML = `
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>课程</th>
                  <th>日期</th>
                  <th>时间</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                ${schedules.map(schedule => {
                  const status = getStatusBadge(schedule.status);
                  return `
                    <tr>
                      <td>${schedule.course?.name || '-'}</td>
                      <td>${schedule.date ? utils.formatDate(schedule.date) : '-'}</td>
                      <td>${schedule.startTime || '-'} - ${schedule.endTime || '-'}</td>
                      <td><span class="badge ${status.class}">${status.text}</span></td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        `;
      } else {
        recentSchedules.innerHTML = `
          <div class="empty-state" style="padding: 30px;">
            <div class="empty-state-icon" style="font-size: 32px;">📅</div>
            <div class="empty-state-title">暂无课表</div>
            <div class="empty-state-message">点击课表管理开始排课</div>
          </div>
        `;
      }
    } catch (e) {
      console.error('加载课表失败:', e);
    }
    
    document.getElementById('dashboardLoading').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    
  } catch (error) {
    console.error('加载仪表盘失败:', error);
    document.getElementById('dashboardLoading').style.display = 'none';
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-title">数据加载失败</div>
        <div class="empty-state-message">${error.message || '请检查网络连接'}</div>
        <button class="btn btn-primary" onclick="loadPage('dashboard')">重新加载</button>
      </div>
    `;
  }
};

pages.enrollments = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-header-title">报名管理</h2>
        <p class="page-header-subtitle">管理学员的课程报名和课时信息</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="addEnrollmentBtn">
          <span>➕</span>
          <span>新增报名</span>
        </button>
      </div>
    </div>
    
    <div class="filter-bar">
      <div class="filter-item">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="enrollmentSearch" placeholder="搜索学员姓名...">
        </div>
      </div>
      <div class="filter-item">
        <select id="enrollmentStatus">
          <option value="">全部状态</option>
          <option value="ACTIVE">正常</option>
          <option value="EXPIRED">已过期</option>
          <option value="COMPLETED">已完成</option>
        </select>
      </div>
      <div class="filter-item">
        <button class="btn btn-secondary btn-sm" id="resetEnrollmentFilter">重置</button>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body" style="padding: 0;">
        <div id="enrollmentTable">
          <div class="table-empty">
            <div class="table-empty-icon">⏳</div>
            <div>加载中...</div>
          </div>
        </div>
      </div>
    </div>
    
    <div id="enrollmentPagination"></div>
  `;
  
  let currentPage = 1;
  const pageSize = 10;
  
  async function loadEnrollments() {
    const search = document.getElementById('enrollmentSearch').value;
    const status = document.getElementById('enrollmentStatus').value;
    const tableEl = document.getElementById('enrollmentTable');
    
    try {
      const params = { page: currentPage, pageSize };
      if (search) params.search = search;
      if (status) params.status = status;
      
      const result = await api.get('/enrollments', params);
      
      if (!result.data || result.data.length === 0) {
        tableEl.innerHTML = `
          <div class="table-empty">
            <div class="table-empty-icon">📝</div>
            <div>暂无报名记录</div>
          </div>
        `;
        return;
      }
      
      tableEl.innerHTML = `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>学员</th>
                <th>课程</th>
                <th>总课时</th>
                <th>已用课时</th>
                <th>剩余课时</th>
                <th>有效期</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${result.data.map(item => {
                const status = getStatusBadge(item.status);
                const remainingPercent = Math.round((item.remainingHours / item.totalHours) * 100);
                const isLow = remainingPercent < 20;
                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 32px; height: 32px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">
                          ${(item.student?.realName || '-').charAt(0)}
                        </div>
                        <div>
                          <div style="font-weight: 500;">${item.student?.realName || '-'}</div>
                          <div style="font-size: 12px; color: var(--text-muted);">${item.student?.phone || '-'}</div>
                        </div>
                      </div>
                    </td>
                    <td>${item.course?.name || '-'}</td>
                    <td>${item.totalHours} 课时</td>
                    <td>${item.usedHours || 0} 课时</td>
                    <td>
                      <span class="badge ${isLow ? 'badge-danger' : 'badge-success'}">
                        ${item.remainingHours} 课时
                      </span>
                    </td>
                    <td>
                      ${item.startDate ? utils.formatDate(item.startDate) : '-'}
                      <br>
                      <span style="color: var(--text-muted);">至</span>
                      <br>
                      ${item.endDate ? utils.formatDate(item.endDate) : '-'}
                    </td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>
                      <div style="display: flex; gap: 8px;">
                        <button class="btn btn-sm btn-outline" onclick="viewEnrollment('${item.id}')">详情</button>
                        ${item.status === 'ACTIVE' ? `<button class="btn btn-sm btn-outline" onclick="renewEnrollment('${item.id}')">续费</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
      
    } catch (error) {
      console.error('加载报名列表失败:', error);
      tableEl.innerHTML = `
        <div class="table-empty">
          <div class="table-empty-icon">❌</div>
          <div>加载失败: ${error.message}</div>
        </div>
      `;
    }
  }
  
  document.getElementById('addEnrollmentBtn').addEventListener('click', showAddEnrollmentModal);
  document.getElementById('enrollmentSearch').addEventListener('input', utils.debounce(function() {
    currentPage = 1;
    loadEnrollments();
  }, 300));
  document.getElementById('enrollmentStatus').addEventListener('change', function() {
    currentPage = 1;
    loadEnrollments();
  });
  document.getElementById('resetEnrollmentFilter').addEventListener('click', function() {
    document.getElementById('enrollmentSearch').value = '';
    document.getElementById('enrollmentStatus').value = '';
    currentPage = 1;
    loadEnrollments();
  });
  
  loadEnrollments();
};

pages.schedules = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-header-title">课表管理</h2>
        <p class="page-header-subtitle">管理课程安排，支持智能冲突检测</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="addScheduleBtn">
          <span>➕</span>
          <span>新增课表</span>
        </button>
      </div>
    </div>
    
    <div class="filter-bar">
      <div class="filter-item">
        <label>日期从</label>
        <input type="date" id="scheduleStartDate">
      </div>
      <div class="filter-item">
        <label>至</label>
        <input type="date" id="scheduleEndDate">
      </div>
      <div class="filter-item">
        <select id="scheduleStatus">
          <option value="">全部状态</option>
          <option value="DRAFT">草稿</option>
          <option value="CONFIRMED">已确认</option>
          <option value="IN_PROGRESS">进行中</option>
          <option value="FINISHED">已完成</option>
          <option value="CANCELLED">已取消</option>
        </select>
      </div>
      <div class="filter-item">
        <button class="btn btn-secondary btn-sm" id="resetScheduleFilter">重置</button>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body" style="padding: 0;">
        <div id="scheduleTable">
          <div class="table-empty">
            <div class="table-empty-icon">⏳</div>
            <div>加载中...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  async function loadSchedules() {
    const startDate = document.getElementById('scheduleStartDate').value;
    const endDate = document.getElementById('scheduleEndDate').value;
    const status = document.getElementById('scheduleStatus').value;
    const tableEl = document.getElementById('scheduleTable');
    
    try {
      const params = { page: 1, pageSize: 20 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status) params.status = status;
      
      const result = await api.get('/schedules', params);
      
      if (!result.data || result.data.length === 0) {
        tableEl.innerHTML = `
          <div class="table-empty">
            <div class="table-empty-icon">📅</div>
            <div>暂无课表安排</div>
          </div>
        `;
        return;
      }
      
      tableEl.innerHTML = `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>课程</th>
                <th>教师</th>
                <th>教室</th>
                <th>日期</th>
                <th>时间</th>
                <th>时长</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              ${result.data.map(item => {
                const status = getStatusBadge(item.status);
                return `
                  <tr>
                    <td>
                      <div style="font-weight: 500;">${item.course?.name || '-'}</div>
                      <div style="font-size: 12px; color: var(--text-muted);">${item.notes || '-'}</div>
                    </td>
                    <td>${item.teacher?.realName || '-'}</td>
                    <td>${item.classroom?.name || '-'}</td>
                    <td>${item.date ? utils.formatDate(item.date) : '-'}</td>
                    <td>${item.startTime || '-'} - ${item.endTime || '-'}</td>
                    <td>${item.duration || 0} 分钟</td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>
                      <div style="display: flex; gap: 8px;">
                        <button class="btn btn-sm btn-outline" onclick="viewSchedule('${item.id}')">详情</button>
                        ${item.status === 'DRAFT' ? `<button class="btn btn-sm btn-success" onclick="confirmSchedule('${item.id}')">确认</button>` : ''}
                        ${item.status !== 'CANCELLED' && item.status !== 'FINISHED' ? `<button class="btn btn-sm btn-danger" onclick="cancelSchedule('${item.id}')">取消</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
      
    } catch (error) {
      console.error('加载课表失败:', error);
      tableEl.innerHTML = `
        <div class="table-empty">
          <div class="table-empty-icon">❌</div>
          <div>加载失败: ${error.message}</div>
        </div>
      `;
    }
  }
  
  document.getElementById('addScheduleBtn').addEventListener('click', showAddScheduleModal);
  document.getElementById('scheduleStartDate').addEventListener('change', loadSchedules);
  document.getElementById('scheduleEndDate').addEventListener('change', loadSchedules);
  document.getElementById('scheduleStatus').addEventListener('change', loadSchedules);
  document.getElementById('resetScheduleFilter').addEventListener('click', function() {
    document.getElementById('scheduleStartDate').value = '';
    document.getElementById('scheduleEndDate').value = '';
    document.getElementById('scheduleStatus').value = '';
    loadSchedules();
  });
  
  loadSchedules();
};

pages.attendances = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-header-title">考勤管理</h2>
        <p class="page-header-subtitle">管理学员上课考勤记录</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" id="addAttendanceBtn">
          <span>➕</span>
          <span>记录考勤</span>
        </button>
      </div>
    </div>
    
    <div class="filter-bar">
      <div class="filter-item">
        <label>日期从</label>
        <input type="date" id="attendanceStartDate">
      </div>
      <div class="filter-item">
        <label>至</label>
        <input type="date" id="attendanceEndDate">
      </div>
      <div class="filter-item">
        <select id="attendanceStatus">
          <option value="">全部状态</option>
          <option value="PRESENT">出勤</option>
          <option value="ABSENT">缺勤</option>
          <option value="LATE">迟到</option>
          <option value="LEAVE">请假</option>
        </select>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body" style="padding: 0;">
        <div id="attendanceTable">
          <div class="table-empty">
            <div class="table-empty-icon">⏳</div>
            <div>加载中...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  async function loadAttendances() {
    const startDate = document.getElementById('attendanceStartDate').value;
    const endDate = document.getElementById('attendanceEndDate').value;
    const status = document.getElementById('attendanceStatus').value;
    const tableEl = document.getElementById('attendanceTable');
    
    try {
      const params = { page: 1, pageSize: 20 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (status) params.status = status;
      
      const result = await api.get('/attendances', params);
      
      if (!result.data || result.data.length === 0) {
        tableEl.innerHTML = `
          <div class="table-empty">
            <div class="table-empty-icon">✅</div>
            <div>暂无考勤记录</div>
          </div>
        `;
        return;
      }
      
      tableEl.innerHTML = `
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>课表</th>
                <th>学员</th>
                <th>日期</th>
                <th>签到时间</th>
                <th>状态</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              ${result.data.map(item => {
                const status = getStatusBadge(item.status);
                return `
                  <tr>
                    <td>${item.schedule?.course?.name || '-'}</td>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 11px; font-weight: bold;">
                          ${(item.student?.realName || '-').charAt(0)}
                        </div>
                        <div>${item.student?.realName || '-'}</div>
                      </div>
                    </td>
                    <td>${item.checkInTime ? utils.formatDate(item.checkInTime) : '-'}</td>
                    <td>${item.checkInTime ? utils.formatDate(item.checkInTime, 'HH:mm') : '-'}</td>
                    <td><span class="badge ${status.class}">${status.text}</span></td>
                    <td>${item.notes || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
      
    } catch (error) {
      console.error('加载考勤失败:', error);
      tableEl.innerHTML = `
        <div class="table-empty">
          <div class="table-empty-icon">❌</div>
          <div>加载失败: ${error.message}</div>
        </div>
      `;
    }
  }
  
  document.getElementById('attendanceStartDate').addEventListener('change', loadAttendances);
  document.getElementById('attendanceEndDate').addEventListener('change', loadAttendances);
  document.getElementById('attendanceStatus').addEventListener('change', loadAttendances);
  
  loadAttendances();
};

pages.reports = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-header-title">经营报表</h2>
        <p class="page-header-subtitle">查看课消、出勤率、续费等统计数据</p>
      </div>
    </div>
    
    <div id="reportsContent">
      <div class="loading-overlay">
        <div class="loading-spinner"></div>
      </div>
    </div>
  `;
  
  try {
    const result = await loadDashboardData();
    const data = result.data;
    
    const content = document.getElementById('reportsContent');
    content.innerHTML = `
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-icon primary">💰</div>
          <div class="stat-info">
            <div class="stat-value">${utils.formatCurrency(data.today?.revenue || 0)}</div>
            <div class="stat-label">今日课消金额</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon success">✅</div>
          <div class="stat-info">
            <div class="stat-value">${data.today?.attendances || 0}</div>
            <div class="stat-label">今日签到人次</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon warning">📚</div>
          <div class="stat-info">
            <div class="stat-value">${data.today?.hoursConsumed || 0}</div>
            <div class="stat-label">今日消耗课时</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon info">👨‍🎓</div>
          <div class="stat-info">
            <div class="stat-value">${data.overview?.activeEnrollments || 0}</div>
            <div class="stat-label">活跃报名</div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📊 统计概览</h3>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4 style="margin-bottom: 12px; color: var(--text-secondary);">今日数据</h4>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <span>今日课表</span>
                  <span style="font-weight: 600;">${data.today?.schedules || 0} 节</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <span>今日签到</span>
                  <span style="font-weight: 600;">${data.today?.attendances || 0} 人次</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <span>今日课消</span>
                  <span style="font-weight: 600;">${data.today?.hoursConsumed || 0} 课时</span>
                </div>
              </div>
            </div>
            <div>
              <h4 style="margin-bottom: 12px; color: var(--text-secondary);">全局概览</h4>
              <div style="display: flex; flex-direction: column; gap: 12px;">
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <span>活跃报名</span>
                  <span style="font-weight: 600;">${data.overview?.activeEnrollments || 0} 个</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <span>待续费</span>
                  <span style="font-weight: 600; color: var(--warning-color);">${data.overview?.pendingRenewals || 0} 个</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <span>活跃教师</span>
                  <span style="font-weight: 600;">${data.overview?.activeTeachers || 0} 位</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <span>活跃课程</span>
                  <span style="font-weight: 600;">${data.overview?.activeCourses || 0} 门</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
  } catch (error) {
    console.error('加载报表失败:', error);
    document.getElementById('reportsContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">❌</div>
        <div class="empty-state-title">数据加载失败</div>
        <div class="empty-state-message">${error.message}</div>
        <button class="btn btn-primary" onclick="loadPage('reports')">重新加载</button>
      </div>
    `;
  }
};

pages.notifications = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-header-title">消息通知</h2>
        <p class="page-header-subtitle">查看系统消息和通知</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="empty-state">
          <div class="empty-state-icon">🔔</div>
          <div class="empty-state-title">暂无消息</div>
          <div class="empty-state-message">您目前没有新的通知消息</div>
        </div>
      </div>
    </div>
  `;
};

pages.consumptions = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-header-title">课消记录</h2>
        <p class="page-header-subtitle">查看课时消耗记录</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="table-empty">
          <div class="table-empty-icon">💰</div>
          <div>暂无课消记录</div>
        </div>
      </div>
    </div>
  `;
};

pages.students = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-header-title">学员列表</h2>
        <p class="page-header-subtitle">管理学员信息</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="empty-state">
          <div class="empty-state-icon">👨‍🎓</div>
          <div class="empty-state-title">功能开发中</div>
          <div class="empty-state-message">该功能正在开发中，敬请期待</div>
        </div>
      </div>
    </div>
  `;
};

pages.classrooms = async function(container) {
  container.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h2 class="page-header-title">教室管理</h2>
        <p class="page-header-subtitle">管理教室信息</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-body">
        <div class="empty-state">
          <div class="empty-state-icon">🏫</div>
          <div class="empty-state-title">功能开发中</div>
          <div class="empty-state-message">该功能正在开发中，敬请期待</div>
        </div>
      </div>
    </div>
  `;
};

function showAddEnrollmentModal() {
  const modalHtml = `
    <div class="modal-overlay active" id="enrollmentModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">新增报名</h3>
          <button type="button" class="modal-close" onclick="closeModal('enrollmentModal')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>学员 <span style="color: var(--danger-color);">*</span></label>
            <select id="modalStudent">
              <option value="">请选择学员</option>
              <option value="user-student-001">陈小明</option>
              <option value="user-student-002">张小华</option>
            </select>
          </div>
          <div class="form-group">
            <label>课程 <span style="color: var(--danger-color);">*</span></label>
            <select id="modalCourse">
              <option value="">请选择课程</option>
              <option value="course-001">高中数学精品班</option>
              <option value="course-002">雅思听力冲刺班</option>
            </select>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>总课时 <span style="color: var(--danger-color);">*</span></label>
              <input type="number" id="modalHours" value="40" min="1">
            </div>
            <div class="form-group">
              <label>有效期(月) <span style="color: var(--danger-color);">*</span></label>
              <input type="number" id="modalValidMonths" value="12" min="1">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>实付金额</label>
              <input type="number" id="modalAmount" value="7200" min="0">
            </div>
            <div class="form-group">
              <label>支付方式</label>
              <select id="modalPaymentMethod">
                <option value="现金">现金</option>
                <option value="微信">微信</option>
                <option value="支付宝">支付宝</option>
                <option value="银行卡">银行卡</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea id="modalNotes" placeholder="请输入备注信息"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('enrollmentModal')">取消</button>
          <button type="button" class="btn btn-primary" id="submitEnrollment">提交</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  document.getElementById('submitEnrollment').addEventListener('click', async () => {
    const studentId = document.getElementById('modalStudent').value;
    const courseId = document.getElementById('modalCourse').value;
    const totalHours = parseInt(document.getElementById('modalHours').value);
    const validMonths = parseInt(document.getElementById('modalValidMonths').value);
    const paymentAmount = parseFloat(document.getElementById('modalAmount').value) || 0;
    const paymentMethod = document.getElementById('modalPaymentMethod').value;
    const notes = document.getElementById('modalNotes').value;
    
    if (!studentId || !courseId || !totalHours || !validMonths) {
      toast.error('请填写必填项');
      return;
    }
    
    try {
      const now = new Date();
      const validStart = now.toISOString().split('T')[0];
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + validMonths);
      const validEnd = endDate.toISOString().split('T')[0];
      
      await api.post('/enrollments', {
        studentId,
        courseId,
        totalHours,
        validMonths,
        validStart,
        validEnd,
        paymentAmount,
        paymentMethod,
        notes,
      });
      
      toast.success('报名成功');
      closeModal('enrollmentModal');
      loadPage('enrollments');
    } catch (error) {
      toast.error(error.message || '创建失败');
    }
  });
}

function showAddScheduleModal() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  
  const modalHtml = `
    <div class="modal-overlay active" id="scheduleModal">
      <div class="modal modal-lg">
        <div class="modal-header">
          <h3 class="modal-title">新增课表</h3>
          <button type="button" class="modal-close" onclick="closeModal('scheduleModal')">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>课程 <span style="color: var(--danger-color);">*</span></label>
              <select id="modalScheduleCourse">
                <option value="">请选择课程</option>
                <option value="course-001">高中数学精品班</option>
                <option value="course-002">雅思听力冲刺班</option>
              </select>
            </div>
            <div class="form-group">
              <label>教师 <span style="color: var(--danger-color);">*</span></label>
              <select id="modalScheduleTeacher">
                <option value="">请选择教师</option>
                <option value="user-teacher-001">李老师</option>
                <option value="user-teacher-002">王老师</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>教室</label>
              <select id="modalScheduleClassroom">
                <option value="">请选择教室</option>
                <option value="classroom-001">多媒体教室A</option>
                <option value="classroom-002">一对一辅导室B</option>
              </select>
            </div>
            <div class="form-group">
              <label>日期 <span style="color: var(--danger-color);">*</span></label>
              <input type="date" id="modalScheduleDate" value="${tomorrowStr}">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>开始时间 <span style="color: var(--danger-color);">*</span></label>
              <input type="time" id="modalScheduleStartTime" value="09:00">
            </div>
            <div class="form-group">
              <label>结束时间 <span style="color: var(--danger-color);">*</span></label>
              <input type="time" id="modalScheduleEndTime" value="10:30">
            </div>
            <div class="form-group">
              <label>时长(分钟)</label>
              <input type="number" id="modalScheduleDuration" value="90" min="1">
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>最大人数</label>
              <input type="number" id="modalScheduleMaxStudents" value="15" min="1">
            </div>
            <div class="form-group">
              <label>冲突检测</label>
              <button type="button" class="btn btn-outline" id="checkConflictBtn" style="width: 100%; margin-top: 8px;">检测冲突</button>
            </div>
          </div>
          <div class="form-group">
            <label>备注</label>
            <textarea id="modalScheduleNotes" placeholder="请输入备注信息"></textarea>
          </div>
          <div id="conflictResult" style="display: none;"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" onclick="closeModal('scheduleModal')">取消</button>
          <button type="button" class="btn btn-primary" id="submitSchedule">创建</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
  
  document.getElementById('checkConflictBtn').addEventListener('click', async () => {
    const teacherId = document.getElementById('modalScheduleTeacher').value;
    const classroomId = document.getElementById('modalScheduleClassroom').value;
    const date = document.getElementById('modalScheduleDate').value;
    const startTime = document.getElementById('modalScheduleStartTime').value;
    const endTime = document.getElementById('modalScheduleEndTime').value;
    
    if (!teacherId || !date || !startTime || !endTime) {
      toast.error('请选择教师、日期和时间');
      return;
    }
    
    try {
      const result = await api.post('/schedules/detect-conflict', {
        teacherId,
        classroomId: classroomId || undefined,
        date,
        startTime,
        endTime,
      });
      
      const conflictResult = document.getElementById('conflictResult');
      conflictResult.style.display = 'block';
      
      if (result.data.hasConflict) {
        conflictResult.innerHTML = `
          <div class="alert alert-danger">
            <span class="alert-icon">⚠️</span>
            <div>
              <strong>检测到冲突！</strong>
              <div style="margin-top: 8px;">${JSON.stringify(result.data.conflicts)}</div>
            </div>
          </div>
        `;
      } else {
        conflictResult.innerHTML = `
          <div class="alert alert-success">
            <span class="alert-icon">✅</span>
            <div>
              <strong>无冲突</strong>
              <div style="margin-top: 8px;">该时间段教师和教室可用</div>
            </div>
          </div>
        `;
      }
    } catch (error) {
      toast.error(error.message || '检测失败');
    }
  });
  
  document.getElementById('submitSchedule').addEventListener('click', async () => {
    const courseId = document.getElementById('modalScheduleCourse').value;
    const teacherId = document.getElementById('modalScheduleTeacher').value;
    const classroomId = document.getElementById('modalScheduleClassroom').value;
    const date = document.getElementById('modalScheduleDate').value;
    const startTime = document.getElementById('modalScheduleStartTime').value;
    const endTime = document.getElementById('modalScheduleEndTime').value;
    const duration = parseInt(document.getElementById('modalScheduleDuration').value) || 90;
    const maxStudents = parseInt(document.getElementById('modalScheduleMaxStudents').value) || 15;
    const notes = document.getElementById('modalScheduleNotes').value;
    
    if (!courseId || !teacherId || !date || !startTime || !endTime) {
      toast.error('请填写必填项');
      return;
    }
    
    try {
      await api.post('/schedules', {
        courseId,
        teacherId,
        classroomId: classroomId || undefined,
        date,
        startTime,
        endTime,
        duration,
        maxStudents,
        notes,
      });
      
      toast.success('课表创建成功');
      closeModal('scheduleModal');
      loadPage('schedules');
    } catch (error) {
      toast.error(error.message || '创建失败');
    }
  });
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

function viewEnrollment(id) {
  toast.info('查看报名详情功能开发中');
}

function renewEnrollment(id) {
  toast.info('续费功能开发中');
}

function viewSchedule(id) {
  toast.info('查看课表详情功能开发中');
}

async function confirmSchedule(id) {
  try {
    await api.post(`/schedules/${id}/confirm`);
    toast.success('课表已确认');
    loadPage('schedules');
  } catch (error) {
    toast.error(error.message || '操作失败');
  }
}

async function cancelSchedule(id) {
  if (!confirm('确定要取消这个课表吗？')) return;
  
  try {
    await api.put(`/schedules/${id}`, { status: 'CANCELLED' });
    toast.success('课表已取消');
    loadPage('schedules');
  } catch (error) {
    toast.error(error.message || '操作失败');
  }
}

async function initApp() {
  if (!auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  
  const userData = auth.getUser();
  if (userData) {
    document.getElementById('userName').textContent = userData.realName || userData.username;
    document.getElementById('userRole').textContent = getRoleName(userData.role);
    
    const avatar = document.getElementById('userAvatar');
    avatar.textContent = (userData.realName || userData.username).charAt(0);
  }
  
  await renderSidebar();
  
  const urlParams = new URLSearchParams(window.location.search);
  const page = urlParams.get('page') || 'dashboard';
  
  document.querySelectorAll('.menu-item').forEach(item => {
    if (item.dataset.page === page) {
      item.classList.add('active');
      const text = item.querySelector('.menu-text').textContent;
      document.getElementById('pageTitle').textContent = text;
    }
  });
  
  await loadPage(page);
  
  window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'dashboard';
    navigateTo(page);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    if (confirm('确定要退出登录吗？')) {
      auth.removeToken();
      auth.removeUser();
      window.location.href = '/login.html';
    }
  });
  
  document.getElementById('refreshBtn').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 'dashboard';
    loadPage(page);
  });
  
  initApp();
});
