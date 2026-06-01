import { request, statusLabel, categoryLabel, parseList } from '../api.js';

export async function renderAnalysis(state) {
  const { projects, selectedProjectId } = state;
  const project = selectedProjectId ? await request(`/api/projects/${selectedProjectId}`) : null;

  if (!project) {
    return `
      <div class="workspace">
        <aside class="panel sidebar">
          <div class="section-head compact"><h2>项目列表</h2></div>
          <div class="project-list">
            ${projects.map(p => `
              <button class="project-item ${p.id === selectedProjectId ? 'active' : ''}" data-nav="analysis" data-id="${p.id}">
                <span>${p.name}</span><small>${statusLabel(p.status)}</small>
              </button>
            `).join('') || '<p class="empty">还没有项目</p>'}
          </div>
        </aside>
        <div class="main-stack"><section class="panel main-panel"><p class="empty">请选择一个项目来分析问题。</p></section></div>
      </div>
    `;
  }

  const [issues, stats, observations] = await Promise.all([
    request(`/api/issues/project/${project.id}`),
    request(`/api/issues/project/${project.id}/stats`),
    request(`/api/observations/project/${project.id}`)
  ]);

  const stuckPoints = observations.filter(o => o.is_stuck_point);

  return `
    <div class="workspace">
      <aside class="panel sidebar">
        <div class="section-head compact"><h2>项目列表</h2></div>
        <div class="project-list">
          ${projects.map(p => `
            <button class="project-item ${p.id === selectedProjectId ? 'active' : ''}" data-nav="analysis" data-id="${p.id}">
              <span>${p.name}</span><small>${statusLabel(p.status)}</small>
            </button>
          `).join('')}
        </div>
      </aside>

      <div class="main-stack">
        <section class="panel main-panel">
          <div class="section-head">
            <div>
              <p class="eyebrow">问题分析</p>
              <h2>${project.name} · 问题归纳</h2>
            </div>
            <span class="badge">${issues.length} 个问题</span>
          </div>

          <div class="stats-row">
            <div class="stat-card">
              <span>按类别</span>
              <div class="stat-bars">
                ${stats.byCategory.map(c => `
                  <div class="stat-bar">
                    <label>${categoryLabel(c.category)}</label>
                    <div class="bar-bg"><div class="bar-fill" style="width:${Math.min(100, c.count * 20)}%"></div></div>
                    <strong>${c.count}</strong>
                  </div>
                `).join('') || '<p class="empty">暂无数据</p>'}
              </div>
            </div>
            <div class="stat-card">
              <span>按严重程度</span>
              <div class="stat-bars">
                ${stats.bySeverity.map(s => `
                  <div class="stat-bar">
                    <label class="severity-text ${s.severity}">${s.severity}</label>
                    <div class="bar-bg"><div class="bar-fill severity-${s.severity}" style="width:${Math.min(100, s.count * 25)}%"></div></div>
                    <strong>${s.count}</strong>
                  </div>
                `).join('') || '<p class="empty">暂无数据</p>'}
              </div>
            </div>
            <div class="stat-card">
              <span>按状态</span>
              <div class="stat-bars">
                ${stats.byStatus.map(s => `
                  <div class="stat-bar">
                    <label>${statusLabel(s.status)}</label>
                    <div class="bar-bg"><div class="bar-fill status-${s.status}" style="width:${Math.min(100, s.count * 25)}%"></div></div>
                    <strong>${s.count}</strong>
                  </div>
                `).join('') || '<p class="empty">暂无数据</p>'}
              </div>
            </div>
          </div>

          ${stuckPoints.length > 0 ? `
          <div style="margin-top:20px">
            <div class="section-head compact">
              <h3>卡点汇总</h3>
              <span>${stuckPoints.length} 个卡点</span>
            </div>
            <div class="observation-list">
              ${stuckPoints.map(sp => `
                <div class="observation stuck">
                  <div class="obs-header">
                    <span class="obs-time">${sp.timestamp_seconds}秒</span>
                    <span class="stuck-badge">卡点</span>
                  </div>
                  <p>${sp.content}</p>
                </div>
              `).join('')}
            </div>
          </div>` : ''}

          <div style="margin-top:20px">
            <div class="section-head compact">
              <h3>问题列表</h3>
            </div>
            <div class="issue-detail-list">
              ${issues.map(issue => `
                <div class="issue-detail" data-issue-id="${issue.id}">
                  <div class="issue-detail-header">
                    <span class="severity ${issue.severity}">${issue.severity}</span>
                    <span class="category-tag">${categoryLabel(issue.category)}</span>
                    <strong>${issue.description}</strong>
                    <div class="issue-detail-actions">
                      <select data-action="update-issue-severity" data-id="${issue.id}">
                        <option value="low" ${issue.severity === 'low' ? 'selected' : ''}>低</option>
                        <option value="medium" ${issue.severity === 'medium' ? 'selected' : ''}>中</option>
                        <option value="high" ${issue.severity === 'high' ? 'selected' : ''}>高</option>
                        <option value="critical" ${issue.severity === 'critical' ? 'selected' : ''}>严重</option>
                      </select>
                      <select data-action="update-issue-status" data-id="${issue.id}">
                        <option value="open" ${issue.status === 'open' ? 'selected' : ''}>未解决</option>
                        <option value="resolved" ${issue.status === 'resolved' ? 'selected' : ''}>已解决</option>
                        <option value="closed" ${issue.status === 'closed' ? 'selected' : ''}>已关闭</option>
                      </select>
                    </div>
                  </div>
                  <div class="issue-detail-body">
                    ${issue.video_timestamp ? `<span class="tag">视频 @${issue.video_timestamp}秒</span>` : ''}
                    ${issue.video_clip_url ? `<a href="${issue.video_clip_url}" target="_blank" class="tag">查看片段</a>` : ''}
                    ${issue.resolution ? `<p class="resolution">解决方案: ${issue.resolution}</p>` : ''}
                  </div>
                </div>
              `).join('') || '<p class="empty">暂无问题记录</p>'}
            </div>
          </div>

          <form class="stack-form" id="addIssueForm" style="margin-top:20px">
            <h3>新增问题</h3>
            <div class="form-grid">
              <label>
                类别
                <select name="category">
                  <option value="navigation">导航</option>
                  <option value="form">表单</option>
                  <option value="content">内容</option>
                  <option value="interaction">交互</option>
                  <option value="comprehension">理解偏差</option>
                  <option value="misoperation">误操作</option>
                  <option value="suggestion">建议</option>
                  <option value="other">其他</option>
                </select>
              </label>
              <label>
                严重程度
                <select name="severity">
                  <option value="low">低</option>
                  <option value="medium" selected>中</option>
                  <option value="high">高</option>
                  <option value="critical">严重</option>
                </select>
              </label>
            </div>
            <label>
              描述
              <textarea name="description" required rows="3" placeholder="问题描述"></textarea>
            </label>
            <div class="form-grid">
              <label>视频时间点(秒)<input name="video_timestamp" type="number" value="0" min="0" /></label>
              <label>视频片段链接<input name="video_clip_url" placeholder="https://..." /></label>
            </div>
            <label>
              解决方案
              <textarea name="resolution" rows="2" placeholder="建议的解决方案"></textarea>
            </label>
            <button type="submit" class="btn btn-primary">添加问题</button>
          </form>
        </section>
      </div>
    </div>
  `;
}
