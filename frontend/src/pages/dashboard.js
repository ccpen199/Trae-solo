import { request, parseList, formatSeconds, statusLabel } from '../api.js';

export async function renderDashboard(state) {
  const { health, summary, projects, selectedProjectId } = state;
  const dashboard = selectedProjectId ? await request(`/api/projects/${selectedProjectId}/dashboard`) : null;

  let projectListHTML = '';
  if (!projects.length) {
    projectListHTML = '<p class="empty">还没有测试项目。</p>';
  } else {
    projectListHTML = projects.map(project => `
      <button class="project-item ${project.id === selectedProjectId ? 'active' : ''}" data-nav="projects" data-id="${project.id}">
        <span>${project.name}</span>
        <small>${statusLabel(project.status)} · ${project.target_user || '未设置目标用户'}</small>
      </button>
    `).join('');
  }

  let dashboardHTML = '';
  if (!dashboard) {
    dashboardHTML = '<section class="panel main-panel"><p class="empty">选择或创建一个项目后开始管理测试。</p></section>';
  } else {
    const { project, participants, sessions, tasks, observations, issues, report } = dashboard;
    const suggestions = parseList(report?.improvement_suggestions);
    const topIssues = parseList(report?.top_issues);

    dashboardHTML = `
      <section class="panel main-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">当前项目</p>
            <h2>${project.name}</h2>
          </div>
          <span class="badge">${statusLabel(project.status)}</span>
        </div>
        <p class="goal">${project.research_goal || '还没有填写研究目标。'}</p>

        <div class="info-grid">
          <div>
            <span>目标用户</span>
            <strong>${project.target_user || '未设置'}</strong>
          </div>
          <div>
            <span>测试窗口</span>
            <strong>${project.schedule_start || '待定'} ~ ${project.schedule_end || '待定'}</strong>
          </div>
          <div>
            <span>补偿</span>
            <strong>${project.compensation || '待定'}</strong>
          </div>
        </div>

        <div class="content-grid">
          <article>
            <div class="section-head compact">
              <h3>任务脚本</h3>
              <span>${tasks.length} 步</span>
            </div>
            <ol class="task-list">
              ${tasks.map(task => `
                <li>
                  <strong>${task.title}</strong>
                  <span>${task.description}</span>
                  <small>${task.completed ? '已完成' : '进行中'} · ${formatSeconds(task.time_spent_seconds)}</small>
                </li>
              `).join('') || '<li class="empty">暂无任务步骤。</li>'}
            </ol>
          </article>

          <article>
            <div class="section-head compact">
              <h3>参与者</h3>
              <span>${participants.length} 人</span>
            </div>
            <div class="people-list">
              ${participants.map(person => `
                <div class="person">
                  <strong>${person.name}</strong>
                  <span>${person.email || person.phone || '未填写联系方式'}</span>
                  <small>${statusLabel(person.appointment_status)} · ${person.consent_given ? '已授权' : '待授权'}</small>
                </div>
              `).join('') || '<p class="empty">暂无参与者。</p>'}
            </div>
          </article>
        </div>

        <div class="content-grid">
          <article>
            <div class="section-head compact">
              <h3>测试场次</h3>
              <span>${sessions.length} 场</span>
            </div>
            <div class="session-list">
              ${sessions.map(s => `
                <div class="session-item">
                  <strong>${s.scheduled_at || '待排期'}</strong>
                  <span>状态: ${statusLabel(s.status)} · 录制: ${statusLabel(s.recording_status)}</span>
                </div>
              `).join('') || '<p class="empty">暂无测试场次。</p>'}
            </div>
          </article>

          <article>
            <div class="section-head compact">
              <h3>问题与建议</h3>
              <span>${issues.length} 项</span>
            </div>
            <div class="issue-list">
              ${issues.map(issue => `
                <div class="issue">
                  <span class="severity ${issue.severity}">${issue.severity}</span>
                  <p>${issue.description}</p>
                </div>
              `).join('')}
              ${topIssues.map(issue => `<p class="report-line">${issue}</p>`).join('')}
              ${suggestions.map(item => `<p class="report-line suggestion">${item}</p>`).join('')}
            </div>
          </article>
        </div>
      </section>
    `;
  }

  return `
    ${state.error ? `<div class="alert">接口连接失败：${state.error}</div>` : ''}

    <section class="metrics">
      <article class="metric">
        <span>项目</span>
        <strong>${summary?.projects ?? 0}</strong>
      </article>
      <article class="metric">
        <span>参与者</span>
        <strong>${summary?.participants ?? 0}</strong>
      </article>
      <article class="metric">
        <span>访谈场次</span>
        <strong>${summary?.sessions ?? 0}</strong>
      </article>
      <article class="metric">
        <span>待解决问题</span>
        <strong>${summary?.openIssues ?? 0}</strong>
        <small>完成率 ${Math.round((summary?.completionRate || 0) * 100)}%</small>
      </article>
    </section>

    <div class="workspace">
      <aside class="panel sidebar">
        <div class="section-head compact">
          <h2>项目列表</h2>
          <span>${projects.length}</span>
        </div>
        <div class="project-list">${projectListHTML}</div>

        <form class="stack-form" id="projectForm">
          <h3>新建测试</h3>
          <label>
            项目名称
            <input name="name" required maxlength="80" placeholder="例如：定价页可用性测试" />
          </label>
          <label>
            研究目标
            <textarea name="research_goal" rows="3" placeholder="需要验证的用户路径或假设"></textarea>
          </label>
          <label>
            目标用户
            <input name="target_user" maxlength="120" placeholder="参与者画像" />
          </label>
          <button type="submit">创建项目</button>
        </form>
      </aside>

      <div class="main-stack">
        ${dashboardHTML}
      </div>
    </div>
  `;
}
