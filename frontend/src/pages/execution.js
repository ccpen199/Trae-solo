import { request, statusLabel, formatSeconds } from '../api.js';

export async function renderExecution(state) {
  const { projects, selectedProjectId } = state;
  const project = selectedProjectId ? await request(`/api/projects/${selectedProjectId}`) : null;

  if (!project) {
    return `
      <div class="workspace">
        <aside class="panel sidebar">
          <div class="section-head compact"><h2>项目列表</h2></div>
          <div class="project-list">
            ${projects.map(p => `
              <button class="project-item ${p.id === selectedProjectId ? 'active' : ''}" data-nav="execution" data-id="${p.id}">
                <span>${p.name}</span>
                <small>${statusLabel(p.status)}</small>
              </button>
            `).join('') || '<p class="empty">还没有项目</p>'}
          </div>
        </aside>
        <div class="main-stack">
          <section class="panel main-panel"><p class="empty">请选择一个项目来执行测试。</p></section>
        </div>
      </div>
    `;
  }

  const [participants, sessions, tasks] = await Promise.all([
    request(`/api/participants/project/${project.id}`),
    request(`/api/sessions/project/${project.id}`),
    request(`/api/task-steps/project/${project.id}`)
  ]);

  const activeSessionId = state.activeSessionId || (sessions.length > 0 ? sessions[0].id : null);
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0] || null;

  let sessionTasks = [];
  let observations = [];
  if (activeSession) {
    [sessionTasks, observations] = await Promise.all([
      request(`/api/task-steps/session/${activeSession.id}`),
      request(`/api/observations/session/${activeSession.id}`)
    ]);
  }

  const displayTasks = sessionTasks.length > 0 ? sessionTasks : tasks;

  return `
    <div class="workspace">
      <aside class="panel sidebar">
        <div class="section-head compact"><h2>项目列表</h2></div>
        <div class="project-list">
          ${projects.map(p => `
            <button class="project-item ${p.id === selectedProjectId ? 'active' : ''}" data-nav="execution" data-id="${p.id}">
              <span>${p.name}</span>
              <small>${statusLabel(p.status)}</small>
            </button>
          `).join('')}
        </div>

        ${activeSession ? `
        <div style="margin-top:16px">
          <div class="section-head compact"><h3>场次选择</h3></div>
          <div class="session-list">
            ${sessions.map(s => {
              const p = participants.find(pp => pp.id === s.participant_id);
              return `
              <button class="project-item ${s.id === activeSessionId ? 'active' : ''}" data-action="select-session" data-session-id="${s.id}">
                <span>#${s.id} ${p ? p.name : '未知'}</span>
                <small>${s.scheduled_at || '待排期'} · ${statusLabel(s.status)}</small>
              </button>`;
            }).join('')}
          </div>
        </div>` : ''}
      </aside>

      <div class="main-stack">
        <section class="panel main-panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">测试执行</p>
              <h2>${project.name}</h2>
            </div>
            ${activeSession ? `
            <div class="recording-status ${activeSession.recording_status}">
              <span class="rec-dot"></span>
              录制状态: ${statusLabel(activeSession.recording_status)}
              <button class="btn btn-sm" data-action="toggle-recording" data-id="${activeSession.id}">${activeSession.recording_status === 'on' ? '停止录制' : '开始录制'}</button>
            </div>` : ''}
          </div>

          ${!activeSession ? `
          <div style="margin-top:16px">
            <h3>创建新测试场次</h3>
            <form class="inline-form" id="createSessionForm">
              <label>
                选择受测者
                <select name="participant_id" required>
                  <option value="">请选择</option>
                  ${participants.map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
                </select>
              </label>
              <label>
                排期时间
                <input name="scheduled_at" type="datetime-local" />
              </label>
              <button type="submit" class="btn btn-primary">创建场次</button>
            </form>
          </div>` : `
          <div class="execution-grid">
            <div class="execution-tasks">
              <div class="section-head compact">
                <h3>任务步骤</h3>
                <button class="btn btn-sm" data-action="add-task" data-project="${project.id}" data-session="${activeSession.id}">添加步骤</button>
              </div>

              <div class="task-step-list">
                ${displayTasks.map((task, idx) => `
                  <div class="task-step ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-step-header">
                      <span class="step-num">${idx + 1}</span>
                      <strong>${task.title}</strong>
                      <div class="task-step-actions">
                        <button class="btn btn-sm ${task.completed ? 'btn-outline' : 'btn-primary'}" data-action="toggle-task" data-id="${task.id}" data-completed="${task.completed}">${task.completed ? '重新打开' : '标记完成'}</button>
                      </div>
                    </div>
                    <p>${task.description || '无描述'}</p>
                    <div class="task-step-meta">
                      <span>预期: ${task.expected_action || '未设置'}</span>
                      <span>用时: ${formatSeconds(task.time_spent_seconds)}</span>
                      <label class="inline-label">记录用时(秒): <input type="number" data-action="update-time" data-id="${task.id}" value="${task.time_spent_seconds}" min="0" style="width:70px" /></label>
                    </div>
                  </div>
                `).join('') || '<p class="empty">暂无任务步骤</p>'}
              </div>

              <form class="stack-form" id="addTaskForm" style="margin-top:16px">
                <h3>添加任务步骤</h3>
                <div class="form-grid">
                  <label>步骤标题<input name="title" required maxlength="80" placeholder="步骤标题" /></label>
                  <label>步骤顺序<input name="step_order" type="number" value="${displayTasks.length + 1}" min="1" /></label>
                </div>
                <label>描述<textarea name="description" rows="2" placeholder="详细说明"></textarea></label>
                <label>预期行为<input name="expected_action" maxlength="200" placeholder="用户应该做什么" /></label>
                <button type="submit" class="btn btn-primary">添加步骤</button>
              </form>
            </div>

            <div class="execution-observations">
              <div class="section-head compact">
                <h3>观察笔记</h3>
                <span>${observations.length} 条</span>
              </div>

              <div class="observation-list">
                ${observations.map(obs => `
                  <div class="observation ${obs.is_stuck_point ? 'stuck' : ''}">
                    <div class="obs-header">
                      <span class="obs-time">${formatSeconds(obs.timestamp_seconds)}</span>
                      <span class="obs-type">${obs.note_type}</span>
                      ${obs.is_stuck_point ? '<span class="stuck-badge">卡点</span>' : ''}
                    </div>
                    <p>${obs.content}</p>
                  </div>
                `).join('') || '<p class="empty">暂无观察记录</p>'}
              </div>

              <form class="stack-form" id="addObservationForm" style="margin-top:16px">
                <h3>添加观察</h3>
                <label>
                  时间点(秒)
                  <input name="timestamp_seconds" type="number" value="0" min="0" placeholder="录制时间秒数" />
                </label>
                <label>
                  类型
                  <select name="note_type">
                    <option value="general">一般</option>
                    <option value="friction">卡点</option>
                    <option value="error">误操作</option>
                    <option value="feedback">用户反馈</option>
                    <option value="insight">洞察</option>
                  </select>
                </label>
                <label>
                  内容
                  <textarea name="content" required rows="3" placeholder="观察到的行为或反馈"></textarea>
                </label>
                <label class="checkbox-label">
                  <input type="checkbox" name="is_stuck_point" value="1" />
                  标记为卡点
                </label>
                <button type="submit" class="btn btn-primary">添加观察</button>
              </form>

              <div style="margin-top:16px">
                <div class="section-head compact">
                  <h3>场次控制</h3>
                </div>
                <div class="session-controls">
                  <button class="btn btn-primary" data-action="start-session" data-id="${activeSession.id}" ${activeSession.status === 'in_progress' ? 'disabled' : ''}>开始测试</button>
                  <button class="btn btn-outline" data-action="complete-session" data-id="${activeSession.id}" ${activeSession.status !== 'in_progress' ? 'disabled' : ''}>完成测试</button>
                  <button class="btn btn-danger" data-action="delete-session" data-id="${activeSession.id}">删除场次</button>
                </div>
              </div>
            </div>
          </div>`}
        </section>
      </div>
    </div>
  `;
}
