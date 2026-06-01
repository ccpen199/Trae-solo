import { request, statusLabel, parseList } from '../api.js';

export async function renderParticipants(state) {
  const { projects, selectedProjectId } = state;
  const project = selectedProjectId ? await request(`/api/projects/${selectedProjectId}`) : null;
  const participants = selectedProjectId ? await request(`/api/participants/project/${selectedProjectId}`) : [];
  const sessions = selectedProjectId ? await request(`/api/sessions/project/${selectedProjectId}`) : [];

  return `
    <div class="workspace">
      <aside class="panel sidebar">
        <div class="section-head compact">
          <h2>项目列表</h2>
        </div>
        <div class="project-list">
          ${projects.map(p => `
            <button class="project-item ${p.id === selectedProjectId ? 'active' : ''}" data-nav="participants" data-id="${p.id}">
              <span>${p.name}</span>
              <small>${statusLabel(p.status)}</small>
            </button>
          `).join('') || '<p class="empty">还没有项目</p>'}
        </div>
      </aside>

      <div class="main-stack">
        ${!project ? '<section class="panel main-panel"><p class="empty">请选择一个项目来管理受测者。</p></section>' : `
        <section class="panel main-panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">受测者招募</p>
              <h2>${project.name} · 参与者管理</h2>
            </div>
            <span class="badge">${participants.length} 人</span>
          </div>

          <form class="stack-form" id="addParticipantForm">
            <h3>添加受测者</h3>
            <div class="form-grid">
              <label>姓名<input name="name" required maxlength="60" placeholder="参与者姓名" /></label>
              <label>邮箱<input name="email" type="email" maxlength="120" placeholder="name@example.com" /></label>
              <label>电话<input name="phone" maxlength="20" placeholder="13800000000" /></label>
              <label>
                预约状态
                <select name="appointment_status">
                  <option value="pending">待确认</option>
                  <option value="confirmed">已确认</option>
                  <option value="cancelled">已取消</option>
                </select>
              </label>
            </div>
            <label>
              筛选问卷回答（每行一条）
              <textarea name="screening_answers" rows="3" placeholder="例如：每周使用3次以上&#10;愿意录屏"></textarea>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" name="consent_given" value="1" />
              已获得知情同意
            </label>
            <button type="submit" class="btn btn-primary">添加受测者</button>
          </form>

          <div style="margin-top:24px">
            <div class="section-head compact">
              <h3>受测者列表</h3>
            </div>
            <div class="participant-table">
              ${participants.length === 0 ? '<p class="empty">暂无受测者</p>' : `
              <table class="data-table">
                <thead>
                  <tr>
                    <th>姓名</th>
                    <th>联系方式</th>
                    <th>筛选回答</th>
                    <th>预约状态</th>
                    <th>授权</th>
                    <th>参与历史</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  ${participants.map(p => {
                    const answers = parseList(p.screening_answers);
                    const history = parseList(p.participation_history);
                    return `
                    <tr>
                      <td><strong>${p.name}</strong></td>
                      <td>${p.email || p.phone || '-'}</td>
                      <td>${answers.length ? answers.map(a => `<span class="tag">${a}</span>`).join('') : '-'}</td>
                      <td>
                        <select data-action="update-status" data-id="${p.id}" data-field="appointment_status">
                          <option value="pending" ${p.appointment_status === 'pending' ? 'selected' : ''}>待确认</option>
                          <option value="confirmed" ${p.appointment_status === 'confirmed' ? 'selected' : ''}>已确认</option>
                          <option value="cancelled" ${p.appointment_status === 'cancelled' ? 'selected' : ''}>已取消</option>
                        </select>
                      </td>
                      <td>
                        <input type="checkbox" data-action="toggle-consent" data-id="${p.id}" ${p.consent_given ? 'checked' : ''} />
                      </td>
                      <td>${history.length ? history.join('、') : '无'}</td>
                      <td><button class="btn btn-sm btn-danger" data-action="delete-participant" data-id="${p.id}">删除</button></td>
                    </tr>`;
                  }).join('')}
                </tbody>
              </table>`}
            </div>
          </div>

          ${sessions.length > 0 ? `
          <div style="margin-top:24px">
            <div class="section-head compact">
              <h3>已排期场次</h3>
            </div>
            <div class="session-grid">
              ${sessions.map(s => {
                const participant = participants.find(p => p.id === s.participant_id);
                return `
                <div class="session-card">
                  <strong>${participant ? participant.name : '未知'}</strong>
                  <span>时间: ${s.scheduled_at || '待排期'}</span>
                  <small>状态: ${statusLabel(s.status)} · 录制: ${statusLabel(s.recording_status)}</small>
                </div>`;
              }).join('')}
            </div>
          </div>` : ''}
        </section>
        `}
      </div>
    </div>
  `;
}
