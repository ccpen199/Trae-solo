import { request, statusLabel, categoryLabel, formatSeconds } from '../api.js';

export async function renderProjects(state) {
  const { projects, selectedProjectId } = state;
  const project = selectedProjectId ? await request(`/api/projects/${selectedProjectId}`) : null;

  let detailHTML = '';
  if (!project) {
    detailHTML = '<section class="panel main-panel"><p class="empty">请从左侧选择一个项目进行管理。</p></section>';
  } else {
    const [participants, sessions, tasks] = await Promise.all([
      request(`/api/participants/project/${project.id}`),
      request(`/api/sessions/project/${project.id}`),
      request(`/api/task-steps/project/${project.id}`)
    ]);

    detailHTML = `
      <section class="panel main-panel">
        <div class="section-head">
          <div>
            <p class="eyebrow">项目详情</p>
            <h2>${project.name}</h2>
          </div>
          <div class="action-bar">
            <button class="btn btn-outline" data-action="delete-project" data-id="${project.id}">删除项目</button>
          </div>
        </div>

        <form class="edit-form" id="editProjectForm">
          <div class="form-grid">
            <label>
              项目名称
              <input name="name" value="${project.name}" required maxlength="80" />
            </label>
            <label>
              状态
              <select name="status">
                <option value="draft" ${project.status === 'draft' ? 'selected' : ''}>草稿</option>
                <option value="active" ${project.status === 'active' ? 'selected' : ''}>进行中</option>
                <option value="paused" ${project.status === 'paused' ? 'selected' : ''}>暂停</option>
                <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>已完成</option>
              </select>
            </label>
            <label class="full-width">
              研究目标
              <textarea name="research_goal" rows="3">${project.research_goal}</textarea>
            </label>
            <label class="full-width">
              目标用户
              <input name="target_user" value="${project.target_user}" maxlength="120" />
            </label>
            <label class="full-width">
              任务脚本
              <textarea name="task_script" rows="4">${project.task_script}</textarea>
            </label>
            <label>
              原型链接
              <input name="prototype_link" value="${project.prototype_link}" placeholder="https://..." />
            </label>
            <label>
              补偿
              <input name="compensation" value="${project.compensation}" placeholder="¥200 礼品卡" />
            </label>
            <label>
              开始时间
              <input name="schedule_start" type="datetime-local" value="${project.schedule_start ? project.schedule_start.replace(' ', 'T') : ''}" />
            </label>
            <label>
              结束时间
              <input name="schedule_end" type="datetime-local" value="${project.schedule_end ? project.schedule_end.replace(' ', 'T') : ''}" />
            </label>
          </div>
          <button type="submit" class="btn btn-primary">保存修改</button>
        </form>

        <div class="content-grid" style="margin-top:24px">
          <article>
            <div class="section-head compact">
              <h3>参与者 (${participants.length})</h3>
              <button class="btn btn-sm" data-action="nav-participants" data-id="${project.id}">招募受测者</button>
            </div>
            <div class="people-list">
              ${participants.map(p => `
                <div class="person">
                  <strong>${p.name}</strong>
                  <span>${p.email || p.phone || ''}</span>
                  <small>${statusLabel(p.appointment_status)} · ${p.consent_given ? '已授权' : '待授权'}</small>
                </div>
              `).join('') || `
                <div class="empty-state">
                  <p class="empty">暂无受测者档案</p>
                  <p class="empty-hint">点击「招募受测者」添加候选人，记录筛选问卷、联系方式和授权状态</p>
                </div>
              `}
            </div>
          </article>

          <article>
            <div class="section-head compact">
              <h3>任务步骤 (${tasks.length})</h3>
            </div>
            <ol class="task-list">
              ${tasks.map(t => `
                <li>
                  <strong>${t.title}</strong>
                  <span>${t.description || '无描述'}</span>
                  <small>${t.completed ? '已完成' : '未完成'} · ${formatSeconds(t.time_spent_seconds)}</small>
                </li>
              `).join('') || `
                <li class="empty-state">
                  <p class="empty">暂无任务脚本</p>
                  <p class="empty-hint">在上方「任务脚本」字段中填写测试步骤，或在「测试执行」中添加具体任务</p>
                </li>
              `}
            </ol>
          </article>
        </div>

        <div style="margin-top:24px">
          <article class="panel" style="padding:16px">
            <div class="section-head compact">
              <h3>测试场次 (${sessions.length})</h3>
              <button class="btn btn-sm" data-action="nav-execution" data-id="${project.id}">进入执行</button>
            </div>
            <div class="session-grid">
              ${sessions.map(s => `
                <div class="session-card">
                  <strong>场次 #${s.id}</strong>
                  <span>时间: ${s.scheduled_at || '待排期'}</span>
                  <small>状态: ${statusLabel(s.status)} · 录制: ${statusLabel(s.recording_status)}</small>
                </div>
              `).join('') || `
                <div class="empty-state">
                  <p class="empty">暂无测试场次</p>
                  <p class="empty-hint">点击「进入执行」创建测试场次，管理录制、观察笔记和任务完成情况</p>
                </div>
              `}
            </div>
          </article>
        </div>
      </section>
    `;
  }

  return `
    <div class="workspace">
      <aside class="panel sidebar">
        <div class="section-head compact">
          <h2>项目列表</h2>
          <span>${projects.length}</span>
        </div>
        <div class="project-list">
          ${projects.map(p => `
            <button class="project-item ${p.id === selectedProjectId ? 'active' : ''}" data-nav="projects" data-id="${p.id}">
              <span>${p.name}</span>
              <small>${statusLabel(p.status)}</small>
            </button>
          `).join('') || '<p class="empty">还没有项目</p>'}
        </div>
        <form class="stack-form" id="projectForm">
          <h3>新建测试</h3>
          <label>项目名称<input name="name" required maxlength="80" placeholder="项目名称" /></label>
          <label>研究目标<textarea name="research_goal" rows="2" placeholder="研究目标"></textarea></label>
          <label>目标用户<input name="target_user" maxlength="120" placeholder="目标用户" /></label>
          <button type="submit">创建项目</button>
        </form>
      </aside>
      <div class="main-stack">${detailHTML}</div>
    </div>
  `;
}
