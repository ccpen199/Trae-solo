import { request, statusLabel, parseList, formatSeconds } from '../api.js';

export async function renderReports(state) {
  const { projects, selectedProjectId } = state;
  const project = selectedProjectId ? await request(`/api/projects/${selectedProjectId}`) : null;

  if (!project) {
    return `
      <div class="workspace">
        <aside class="panel sidebar">
          <div class="section-head compact"><h2>项目列表</h2></div>
          <div class="project-list">
            ${projects.map(p => `
              <button class="project-item ${p.id === selectedProjectId ? 'active' : ''}" data-nav="reports" data-id="${p.id}">
                <span>${p.name}</span><small>${statusLabel(p.status)}</small>
              </button>
            `).join('') || '<p class="empty">还没有项目</p>'}
          </div>
        </aside>
        <div class="main-stack"><section class="panel main-panel"><p class="empty">请选择一个项目来查看报告。</p></section></div>
      </div>
    `;
  }

  const [reports, sessions, tasks, issues] = await Promise.all([
    request(`/api/reports/project/${project.id}`),
    request(`/api/sessions/project/${project.id}`),
    request(`/api/task-steps/project/${project.id}`),
    request(`/api/issues/project/${project.id}`)
  ]);

  const latestReport = reports.length > 0 ? reports[0] : null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const avgTimeSeconds = totalTasks > 0 ? Math.round(tasks.reduce((sum, t) => sum + t.time_spent_seconds, 0) / totalTasks) : 0;
  const completedSessions = sessions.filter(s => s.status === 'completed').length;

  return `
    <div class="workspace">
      <aside class="panel sidebar">
        <div class="section-head compact"><h2>项目列表</h2></div>
        <div class="project-list">
          ${projects.map(p => `
            <button class="project-item ${p.id === selectedProjectId ? 'active' : ''}" data-nav="reports" data-id="${p.id}">
              <span>${p.name}</span><small>${statusLabel(p.status)}</small>
            </button>
          `).join('')}
        </div>

        ${reports.length > 0 ? `
        <div style="margin-top:16px">
          <div class="section-head compact"><h3>历史报告</h3></div>
          <div class="session-list">
            ${reports.map(r => `
              <button class="project-item" data-action="view-report" data-id="${r.id}">
                <span>${r.title || '报告 #' + r.id}</span>
                <small>${r.created_at}</small>
              </button>
            `).join('')}
          </div>
        </div>` : ''}
      </aside>

      <div class="main-stack">
        <section class="panel main-panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">报告输出</p>
              <h2>${project.name} · 测试报告</h2>
            </div>
            <div class="action-bar">
              <button class="btn btn-primary" data-action="generate-report" data-id="${project.id}">自动生成报告</button>
            </div>
          </div>

          <div class="report-metrics">
            <div class="report-metric">
              <span>任务完成率</span>
              <div class="progress-ring">
                <svg viewBox="0 0 36 36">
                  <path class="ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path class="ring-fill" stroke-dasharray="${taskCompletionRate}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <strong>${taskCompletionRate}%</strong>
              </div>
            </div>
            <div class="report-metric">
              <span>平均用时</span>
              <strong class="big-num">${formatSeconds(avgTimeSeconds)}</strong>
            </div>
            <div class="report-metric">
              <span>完成场次</span>
              <strong class="big-num">${completedSessions}</strong>
            </div>
            <div class="report-metric">
              <span>发现问题</span>
              <strong class="big-num">${issues.length}</strong>
            </div>
          </div>

          ${latestReport ? `
          <div style="margin-top:20px">
            <div class="section-head compact">
              <h3>最新报告: ${latestReport.title || '报告 #' + latestReport.id}</h3>
              <small>${latestReport.created_at}</small>
            </div>

            <div class="report-section">
              <h4>高频问题 Top</h4>
              <ol class="report-list">
                ${parseList(latestReport.top_issues).map(issue => `<li>${issue}</li>`).join('') || '<li class="empty">暂无</li>'}
              </ol>
            </div>

            <div class="report-section">
              <h4>改进建议</h4>
              <ul class="report-list suggestions">
                ${parseList(latestReport.improvement_suggestions).map(s => `<li>${s}</li>`).join('') || '<li class="empty">暂无</li>'}
              </ul>
            </div>

            <div class="report-section">
              <h4>后续验证计划</h4>
              <p>${latestReport.follow_up_plan || '暂无计划'}</p>
            </div>

            <form class="stack-form" id="editReportForm" style="margin-top:16px">
              <h3>编辑报告</h3>
              <label>报告标题<input name="title" value="${latestReport.title}" maxlength="120" /></label>
              <label>
                Top 问题（每行一条）
                <textarea name="top_issues" rows="4">${parseList(latestReport.top_issues).join('\n')}</textarea>
              </label>
              <label>
                改进建议（每行一条）
                <textarea name="improvement_suggestions" rows="4">${parseList(latestReport.improvement_suggestions).join('\n')}</textarea>
              </label>
              <label>
                后续验证计划
                <textarea name="follow_up_plan" rows="3">${latestReport.follow_up_plan}</textarea>
              </label>
              <button type="submit" class="btn btn-primary">保存报告</button>
            </form>
          </div>` : `
          <div style="margin-top:20px">
            <p class="empty">还没有生成报告，点击上方「自动生成报告」按钮创建。</p>
          </div>`}

          <div style="margin-top:20px">
            <div class="section-head compact">
              <h3>原始数据</h3>
            </div>
            <div class="content-grid">
              <article>
                <h4>任务完成情况</h4>
                <div class="task-summary">
                  ${tasks.map(t => `
                    <div class="task-sum-row">
                      <span>${t.completed ? '✓' : '○'} ${t.title}</span>
                      <span>${formatSeconds(t.time_spent_seconds)}</span>
                    </div>
                  `).join('') || '<p class="empty">暂无任务</p>'}
                </div>
              </article>
              <article>
                <h4>问题分布</h4>
                <div class="issue-summary">
                  ${issues.length === 0 ? '<p class="empty">暂无问题</p>' : ''}
                  ${['high', 'medium', 'low', 'critical'].map(sev => {
                    const count = issues.filter(i => i.severity === sev).length;
                    return count > 0 ? `<div class="task-sum-row"><span class="severity ${sev}">${sev}</span><span>${count} 个</span></div>` : '';
                  }).join('')}
                </div>
              </article>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}
