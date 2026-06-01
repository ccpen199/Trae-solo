import { request } from './api.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderProjects } from './pages/projects.js';
import { renderParticipants } from './pages/participants.js';
import { renderExecution } from './pages/execution.js';
import { renderAnalysis } from './pages/analysis.js';
import { renderReports } from './pages/reports.js';

const app = document.querySelector('#app');

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  const bgColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6';
  toast.style.cssText = `position:fixed;top:20px;right:20px;padding:12px 24px;background:${bgColor};color:white;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:9999;font-size:14px;font-weight:500;transform:translateX(120%);transition:transform 0.3s ease;`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    setTimeout(() => { toast.remove(); }, 300);
  }, 2500);
}

const state = {
  health: null,
  summary: null,
  projects: [],
  selectedProjectId: null,
  activeSessionId: null,
  loading: true,
  error: ''
};

function getRoute() {
  const hash = window.location.hash.slice(1) || 'dashboard';
  const [page, id] = hash.split('/');
  return { page, id: id ? Number(id) : null };
}

function navigate(page, id) {
  if (id !== undefined && id !== null) {
    window.location.hash = `${page}/${id}`;
  } else {
    window.location.hash = page;
  }
}

async function refreshProjects() {
  state.projects = await request('/api/projects');
  state.summary = await request('/api/summary');
}

async function loadApp() {
  state.loading = true;
  state.error = '';
  render();

  try {
    const [health, summary, projects] = await Promise.all([
      request('/api/health'),
      request('/api/summary'),
      request('/api/projects')
    ]);
    state.health = health;
    state.summary = summary;
    state.projects = projects;

    const { id } = getRoute();
    state.selectedProjectId = id || projects[0]?.id || null;
  } catch (error) {
    state.error = error.message;
  } finally {
    state.loading = false;
    render();
  }
}

async function render() {
  if (state.loading) {
    app.innerHTML = '<main class="loading">正在连接可用性测试服务...</main>';
    return;
  }

  const { page } = getRoute();

  let pageContent = '';
  try {
    switch (page) {
      case 'projects': pageContent = await renderProjects(state); break;
      case 'participants': pageContent = await renderParticipants(state); break;
      case 'execution': pageContent = await renderExecution(state); break;
      case 'analysis': pageContent = await renderAnalysis(state); break;
      case 'reports': pageContent = await renderReports(state); break;
      default: pageContent = await renderDashboard(state); break;
    }
  } catch (err) {
    pageContent = `<div class="alert">加载失败: ${err.message}</div>`;
  }

  const navItems = [
    { key: 'dashboard', label: '总览' },
    { key: 'projects', label: '项目管理' },
    { key: 'participants', label: '受测者招募' },
    { key: 'execution', label: '测试执行' },
    { key: 'analysis', label: '问题分析' },
    { key: 'reports', label: '报告输出' }
  ];

  app.innerHTML = `
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">Usability Research</p>
          <h1>远程可用性测试平台</h1>
        </div>
        <div class="topbar-right">
          <nav class="main-nav">
            ${navItems.map(item => `
              <a class="nav-link ${page === item.key || (page === 'dashboard' && item.key === 'dashboard') ? 'active' : ''}" href="#${item.key}">${item.label}</a>
            `).join('')}
          </nav>
          <div class="service-state ${state.health?.ok ? 'online' : 'offline'}">
            <span></span>
            ${state.health?.ok ? '服务在线' : '服务异常'}
          </div>
        </div>
      </header>
      ${pageContent}
    </main>
  `;

  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('[data-nav]').forEach(el => {
    el.addEventListener('click', () => {
      const nav = el.dataset.nav;
      const id = el.dataset.id;
      state.selectedProjectId = Number(id) || state.selectedProjectId;
      navigate(nav, state.selectedProjectId);
    });
  });

  const projectForm = document.querySelector('#projectForm');
  if (projectForm) {
    projectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '创建中...';
      submitBtn.disabled = true;
      try {
        const project = await request('/api/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: form.get('name'),
            research_goal: form.get('research_goal') || '请明确本次测试想要验证的核心假设和研究问题',
            target_user: form.get('target_user') || '请描述目标用户的特征、使用经验和设备情况',
            task_script: '示例任务脚本（可修改）：\n1. 打开产品首页，观察信息接收\n2. 找到并点击核心功能入口\n3. 完成关键操作路径\n4. 填写表单或完成设置\n5. 返回首页验证状态变更',
            prototype_link: 'https://',
            schedule_start: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' '),
            schedule_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16).replace('T', ' '),
            compensation: '¥100-200 礼品卡或现金红包',
            status: 'active'
          })
        });
        e.currentTarget.reset();
        state.selectedProjectId = project.id;
        await refreshProjects();
        showToast('项目创建成功', 'success');
        const { page } = getRoute();
        navigate(page, project.id);
      } catch (err) {
        showToast('创建失败: ' + err.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  const editProjectForm = document.querySelector('#editProjectForm');
  if (editProjectForm) {
    editProjectForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const id = state.selectedProjectId;
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '保存中...';
      submitBtn.disabled = true;
      try {
        await request(`/api/projects/${id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: form.get('name'),
            research_goal: form.get('research_goal'),
            target_user: form.get('target_user'),
            task_script: form.get('task_script'),
            prototype_link: form.get('prototype_link'),
            compensation: form.get('compensation'),
            schedule_start: form.get('schedule_start')?.replace('T', ' ') || '',
            schedule_end: form.get('schedule_end')?.replace('T', ' ') || '',
            status: form.get('status')
          })
        });
        await refreshProjects();
        showToast('项目保存成功', 'success');
        submitBtn.textContent = '✓ 已保存';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 1500);
        render();
      } catch (err) {
        showToast('保存失败: ' + err.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  const addParticipantForm = document.querySelector('#addParticipantForm');
  if (addParticipantForm) {
    addParticipantForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '添加中...';
      submitBtn.disabled = true;
      try {
        await request('/api/participants', {
          method: 'POST',
          body: JSON.stringify({
            project_id: state.selectedProjectId,
            name: form.get('name'),
            email: form.get('email'),
            phone: form.get('phone'),
            screening_answers: form.get('screening_answers')?.split('\n').filter(s => s.trim()) || [],
            appointment_status: form.get('appointment_status'),
            consent_given: form.get('consent_given') === '1'
          })
        });
        e.currentTarget.reset();
        await refreshProjects();
        showToast('受测者添加成功', 'success');
        submitBtn.textContent = '✓ 已添加';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 1000);
        render();
      } catch (err) {
        showToast('添加失败: ' + err.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  const createSessionForm = document.querySelector('#createSessionForm');
  if (createSessionForm) {
    createSessionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '创建中...';
      submitBtn.disabled = true;
      try {
        const session = await request('/api/sessions', {
          method: 'POST',
          body: JSON.stringify({
            project_id: state.selectedProjectId,
            participant_id: Number(form.get('participant_id')),
            scheduled_at: form.get('scheduled_at')?.replace('T', ' ') || '',
            status: 'scheduled',
            recording_status: 'off'
          })
        });
        state.activeSessionId = session.id;
        await refreshProjects();
        showToast('测试场次创建成功', 'success');
        submitBtn.textContent = '✓ 已创建';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 1000);
        render();
      } catch (err) {
        showToast('创建失败: ' + err.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  const addTaskForm = document.querySelector('#addTaskForm');
  if (addTaskForm) {
    addTaskForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const sessionEl = e.currentTarget.querySelector('[data-action="add-task"]');
      const projectId = sessionEl?.dataset.project || state.selectedProjectId;
      const sessionId = sessionEl?.dataset.session || state.activeSessionId;
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '添加中...';
      submitBtn.disabled = true;
      try {
        await request('/api/task-steps', {
          method: 'POST',
          body: JSON.stringify({
            project_id: Number(projectId),
            session_id: Number(sessionId),
            step_order: Number(form.get('step_order')),
            title: form.get('title'),
            description: form.get('description'),
            expected_action: form.get('expected_action')
          })
        });
        e.currentTarget.reset();
        await refreshProjects();
        showToast('任务步骤添加成功', 'success');
        submitBtn.textContent = '✓ 已添加';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 1000);
        render();
      } catch (err) {
        showToast('添加失败: ' + err.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  const addObservationForm = document.querySelector('#addObservationForm');
  if (addObservationForm) {
    addObservationForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '添加中...';
      submitBtn.disabled = true;
      try {
        await request('/api/observations', {
          method: 'POST',
          body: JSON.stringify({
            session_id: state.activeSessionId,
            project_id: state.selectedProjectId,
            timestamp_seconds: Number(form.get('timestamp_seconds')),
            note_type: form.get('note_type'),
            content: form.get('content'),
            is_stuck_point: !!form.get('is_stuck_point')
          })
        });
        e.currentTarget.reset();
        await refreshProjects();
        showToast('观察笔记添加成功', 'success');
        submitBtn.textContent = '✓ 已添加';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 1000);
        render();
      } catch (err) {
        showToast('添加失败: ' + err.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  const addIssueForm = document.querySelector('#addIssueForm');
  if (addIssueForm) {
    addIssueForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '添加中...';
      submitBtn.disabled = true;
      try {
        await request('/api/issues', {
          method: 'POST',
          body: JSON.stringify({
            project_id: state.selectedProjectId,
            category: form.get('category'),
            severity: form.get('severity'),
            description: form.get('description'),
            video_timestamp: Number(form.get('video_timestamp')) || 0,
            video_clip_url: form.get('video_clip_url') || '',
            resolution: form.get('resolution') || '',
            status: 'open'
          })
        });
        e.currentTarget.reset();
        await refreshProjects();
        showToast('问题添加成功', 'success');
        submitBtn.textContent = '✓ 已添加';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 1000);
        render();
      } catch (err) {
        showToast('添加失败: ' + err.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  const editReportForm = document.querySelector('#editReportForm');
  if (editReportForm) {
    editReportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = new FormData(e.currentTarget);
      const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = '保存中...';
      submitBtn.disabled = true;
      const latestReport = await request(`/api/reports/project/${state.selectedProjectId}`).then(r => r[0]);
      if (!latestReport) {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        return;
      }
      try {
        await request(`/api/reports/${latestReport.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.get('title'),
            top_issues: form.get('top_issues')?.split('\n').filter(s => s.trim()) || [],
            improvement_suggestions: form.get('improvement_suggestions')?.split('\n').filter(s => s.trim()) || [],
            follow_up_plan: form.get('follow_up_plan')
          })
        });
        await refreshProjects();
        showToast('报告保存成功', 'success');
        submitBtn.textContent = '✓ 已保存';
        setTimeout(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
        }, 1500);
        render();
      } catch (err) {
        showToast('保存失败: ' + err.message, 'error');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  document.querySelectorAll('[data-action]').forEach(el => {
    const action = el.dataset.action;
    el.addEventListener('click', async () => {
      const originalText = el.textContent;
      try {
        switch (action) {
          case 'delete-project': {
            if (!confirm('确定删除该项目及其所有数据？')) return;
            el.textContent = '删除中...';
            el.disabled = true;
            await request(`/api/projects/${el.dataset.id}`, { method: 'DELETE' });
            state.selectedProjectId = null;
            showToast('项目删除成功', 'success');
            loadApp();
            break;
          }
          case 'delete-participant': {
            if (!confirm('确定删除该受测者？')) return;
            el.textContent = '删除中...';
            el.disabled = true;
            await request(`/api/participants/${el.dataset.id}`, { method: 'DELETE' });
            await refreshProjects();
            showToast('受测者删除成功', 'success');
            render();
            break;
          }
          case 'delete-session': {
            if (!confirm('确定删除该测试场次？')) return;
            el.textContent = '删除中...';
            el.disabled = true;
            await request(`/api/sessions/${el.dataset.id}`, { method: 'DELETE' });
            state.activeSessionId = null;
            await refreshProjects();
            showToast('场次删除成功', 'success');
            render();
            break;
          }
          case 'toggle-recording': {
            el.textContent = '切换中...';
            el.disabled = true;
            const session = await request(`/api/sessions/${el.dataset.id}`);
            const newStatus = session.recording_status === 'on' ? 'off' : 'on';
            await request(`/api/sessions/${el.dataset.id}`, {
              method: 'PUT',
              body: JSON.stringify({ recording_status: newStatus })
            });
            await refreshProjects();
            showToast(`录制已${newStatus === 'on' ? '开启' : '关闭'}`, 'success');
            render();
            break;
          }
          case 'start-session': {
            el.textContent = '开始中...';
            el.disabled = true;
            await request(`/api/sessions/${el.dataset.id}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'in_progress', started_at: new Date().toISOString().slice(0, 19).replace('T', ' ') })
            });
            await refreshProjects();
            showToast('测试已开始', 'success');
            render();
            break;
          }
          case 'complete-session': {
            el.textContent = '完成中...';
            el.disabled = true;
            await request(`/api/sessions/${el.dataset.id}`, {
              method: 'PUT',
              body: JSON.stringify({ status: 'completed', ended_at: new Date().toISOString().slice(0, 19).replace('T', ' ') })
            });
            await refreshProjects();
            showToast('测试已完成', 'success');
            render();
            break;
          }
          case 'toggle-task': {
            el.textContent = '更新中...';
            el.disabled = true;
            const completed = el.dataset.completed === '1' ? 0 : 1;
            await request(`/api/task-steps/${el.dataset.id}`, {
              method: 'PUT',
              body: JSON.stringify({ completed })
            });
            await refreshProjects();
            showToast(`任务已${completed ? '完成' : '重新打开'}`, 'success');
            render();
            break;
          }
          case 'select-session': {
            state.activeSessionId = Number(el.dataset.sessionId);
            render();
            break;
          }
          case 'nav-participants': {
            state.selectedProjectId = Number(el.dataset.id);
            navigate('participants', state.selectedProjectId);
            break;
          }
          case 'nav-execution': {
            state.selectedProjectId = Number(el.dataset.id);
            navigate('execution', state.selectedProjectId);
            break;
          }
          case 'generate-report': {
            el.textContent = '生成中...';
            el.disabled = true;
            await request(`/api/reports/project/${el.dataset.id}/generate`, { method: 'POST' });
            await refreshProjects();
            showToast('报告生成成功', 'success');
            render();
            break;
          }
        }
      } catch (err) {
        showToast('操作失败: ' + err.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="update-status"]').forEach(el => {
    el.addEventListener('change', async () => {
      try {
        await request(`/api/participants/${el.dataset.id}`, {
          method: 'PUT',
          body: JSON.stringify({ appointment_status: el.value })
        });
        await refreshProjects();
        showToast('状态已更新', 'success');
        render();
      } catch (err) {
        showToast('更新失败: ' + err.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="toggle-consent"]').forEach(el => {
    el.addEventListener('change', async () => {
      try {
        await request(`/api/participants/${el.dataset.id}`, {
          method: 'PUT',
          body: JSON.stringify({ consent_given: el.checked })
        });
        await refreshProjects();
        showToast(el.checked ? '已授权' : '已取消授权', 'success');
        render();
      } catch (err) {
        showToast('更新失败: ' + err.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="update-time"]').forEach(el => {
    el.addEventListener('change', async () => {
      try {
        await request(`/api/task-steps/${el.dataset.id}`, {
          method: 'PUT',
          body: JSON.stringify({ time_spent_seconds: Number(el.value) })
        });
        await refreshProjects();
        showToast('用时已更新', 'success');
        render();
      } catch (err) {
        showToast('更新失败: ' + err.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="update-issue-severity"]').forEach(el => {
    el.addEventListener('change', async () => {
      try {
        await request(`/api/issues/${el.dataset.id}`, {
          method: 'PUT',
          body: JSON.stringify({ severity: el.value })
        });
        await refreshProjects();
        showToast('严重程度已更新', 'success');
        render();
      } catch (err) {
        showToast('更新失败: ' + err.message, 'error');
      }
    });
  });

  document.querySelectorAll('[data-action="update-issue-status"]').forEach(el => {
    el.addEventListener('change', async () => {
      try {
        await request(`/api/issues/${el.dataset.id}`, {
          method: 'PUT',
          body: JSON.stringify({ status: el.value })
        });
        await refreshProjects();
        showToast('状态已更新', 'success');
        render();
      } catch (err) {
        showToast('更新失败: ' + err.message, 'error');
      }
    });
  });
}

window.addEventListener('hashchange', () => {
  const { id } = getRoute();
  if (id) state.selectedProjectId = id;
  render();
});

loadApp();
