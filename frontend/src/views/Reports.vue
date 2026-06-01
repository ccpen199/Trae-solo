<template>
  <div class="reports-page">
    <div class="reports-header">
      <router-link to="/reports" class="btn-secondary btn-sm">← 返回项目选择</router-link>
      <router-link :to="`/project/${projectId}`" class="btn-secondary btn-sm">← 返回项目详情</router-link>
      <h2>📊 统计报表 - {{ projectInfo.name || '项目 #' + projectId }}</h2>
    </div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error-msg">{{ error }}</div>
    <template v-else>
      <div class="summary-cards">
        <div class="summary-card card clickable" @click="goToProject('versions')">
          <div class="card-icon">💬</div>
          <div class="card-value">{{ totalIssues }}</div>
          <div class="card-label">问题总数</div>
        </div>
        <div class="summary-card card">
          <div class="card-icon">⏱️</div>
          <div class="card-value">{{ avgResponse }}</div>
          <div class="card-label">平均响应</div>
        </div>
        <div class="summary-card card clickable" @click="goToProject('reviews')">
          <div class="card-icon">🔄</div>
          <div class="card-value">{{ data.rework_count || 0 }}</div>
          <div class="card-label">返工次数</div>
        </div>
        <div class="summary-card card clickable" @click="goToProject('versions')">
          <div class="card-icon">📄</div>
          <div class="card-value">{{ data.version_count || 0 }}</div>
          <div class="card-label">版本总数</div>
        </div>
        <div class="summary-card card clickable" @click="goToProject('requirements')">
          <div class="card-icon">📋</div>
          <div class="card-value">{{ requirementCoveragePct }}%</div>
          <div class="card-label">需求覆盖率</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card card">
          <h4>问题类型分布</h4>
          <div class="bar-chart">
            <div v-for="item in issueDistList" :key="item.type" class="bar-row">
              <span class="bar-label">{{ issueIcon(item.type) }} {{ item.label }}</span>
              <div class="bar-track">
                <div class="bar-fill" :style="{ width: item.percent + '%', background: item.color }"></div>
              </div>
              <span class="bar-value">{{ item.count }}</span>
            </div>
          </div>
        </div>

        <div class="chart-card card">
          <h4>优先级分布</h4>
          <div class="pie-display">
            <div v-for="item in priorityDistList" :key="item.type" class="pie-item">
              <div class="pie-circle" :style="{ background: item.color }">
                <span class="pie-percent">{{ item.percent }}%</span>
              </div>
              <span class="pie-label">{{ item.label }} ({{ item.count }})</span>
            </div>
          </div>
        </div>

        <div class="chart-card card">
          <h4>状态分布</h4>
          <div class="stacked-bar">
            <div
              v-for="item in statusDistList"
              :key="item.type"
              class="stacked-segment"
              :style="{ width: item.percent + '%', background: item.color }"
              :title="item.label + ': ' + item.count"
            ></div>
          </div>
          <div class="stacked-legend">
            <div v-for="item in statusDistList" :key="item.type" class="legend-item">
              <span class="legend-dot" :style="{ background: item.color }"></span>
              {{ item.label }} ({{ item.count }})
            </div>
          </div>
        </div>

        <div class="chart-card card">
          <h4>处理结果统计</h4>
          <div class="resolution-stats">
            <div v-for="item in resolutionList" :key="item.action" class="res-item">
              <span class="res-icon">{{ resolutionIcon(item.action) }}</span>
              <span class="res-label">{{ item.label }}</span>
              <span class="res-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-grid">
        <div class="chart-card card">
          <h4>最近评论</h4>
          <div v-if="data.recent_comments && data.recent_comments.length" class="recent-list">
            <div
              v-for="c in data.recent_comments"
              :key="c.id"
              class="recent-item clickable"
              @click="goToComment(c)"
            >
              <span class="issue-icon">{{ issueIcon(c.issue_type) }}</span>
              <div class="recent-content-wrapper">
                <span class="recent-content">{{ c.content }}</span>
                <div class="recent-tags">
                  <span class="tag-priority" :class="priorityTagClass(c.priority)">{{ priorityLabel(c.priority) }}</span>
                  <span class="tag-status" :class="statusTagClass(c.status)">{{ commentStatusLabel(c.status) }}</span>
                </div>
              </div>
              <div class="recent-meta-col">
                <span class="recent-author">{{ c.created_by || '匿名' }}</span>
                <span class="recent-time">{{ formatTime(c.created_at) }}</span>
                <span class="recent-go">查看 →</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-sm">
            <div>暂无评论</div>
            <div class="empty-hint">在评审中添加评论后这里会显示</div>
          </div>
        </div>

        <div class="chart-card card">
          <h4>需求覆盖</h4>
          <div class="coverage-display">
            <div class="coverage-bar-track">
              <div class="coverage-bar-fill" :style="{ width: requirementCoveragePct + '%' }"></div>
            </div>
            <div class="coverage-stats">
              <div class="cov-item clickable" @click="goToProject('requirements')">
                <span class="cov-label">总需求</span>
                <span class="cov-value">{{ coverage.total }}</span>
              </div>
              <div class="cov-item clickable" @click="goToProject('requirements')">
                <span class="cov-label">已关联</span>
                <span class="cov-value linked">{{ coverage.linked }}</span>
              </div>
              <div class="cov-item clickable" @click="goToProject('requirements')">
                <span class="cov-label">未关联</span>
                <span class="cov-value unlinked">{{ coverage.unlinked }}</span>
              </div>
            </div>
            <div v-if="coverage.total === 0" class="coverage-hint">
              💡 当前项目没有需求，去项目详情页添加需求并关联页面吧
            </div>
            <div v-else-if="coverage.linked === 0" class="coverage-hint warning">
              ⚠️ 需求还没有关联到任何页面，请在项目详情页关联页面与需求
            </div>
          </div>
        </div>
      </div>

      <div class="bottom-grid">
        <div class="chart-card card">
          <h4>版本质量趋势</h4>
          <div v-if="data.version_quality && data.version_quality.length" class="quality-list">
            <div v-for="vq in data.version_quality" :key="vq.version_id" class="quality-item">
              <span class="quality-version">v{{ vq.version_number }}</span>
              <div class="quality-info">
                <span class="quality-page">{{ vq.page_name }}</span>
                <span class="quality-change" :class="`change-${vq.change_type}`">{{ changeTypeLabel(vq.change_type) }}</span>
              </div>
              <div class="quality-meta">
                <span class="quality-issues">{{ vq.issue_count || 0 }} 问题</span>
                <span class="quality-time">{{ formatTime(vq.created_at) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-sm">暂无版本数据</div>
        </div>

        <div class="chart-card card">
          <h4>整改确认记录</h4>
          <div v-if="data.fix_confirmations && data.fix_confirmations.length" class="fix-list">
            <div v-for="fc in data.fix_confirmations" :key="fc.id" class="fix-item">
              <span class="fix-icon">✅</span>
              <div class="fix-content">
                <span class="fix-text">{{ fc.comment_content || '修复确认' }}</span>
                <div class="fix-meta">
                  <span>修复者: {{ fc.fixed_by || '匿名' }}</span>
                  <span>确认者: {{ fc.confirmed_by || '评审人' }}</span>
                </div>
              </div>
              <span class="fix-time">{{ formatTime(fc.confirmed_at) }}</span>
            </div>
          </div>
          <div v-else class="empty-sm">
            <div>暂无整改确认记录</div>
            <div class="empty-hint">评论被标记为"已修复"并经确认后会显示在这里</div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchReportSummary, fetchProject } from '../api'

const props = defineProps({ projectId: [String, Number] })
const router = useRouter()

const loading = ref(true)
const error = ref('')
const data = ref({})
const projectInfo = ref({})

const coverage = computed(() => data.value.requirement_coverage || { total: 0, linked: 0, unlinked: 0 })

const requirementCoveragePct = computed(() => {
  const c = coverage.value
  if (!c.total) return 0
  return Math.round((c.linked / c.total) * 100)
})

const totalIssues = computed(() => {
  const dist = data.value.status_distribution || []
  return dist.reduce((s, d) => s + (d.count || 0), 0)
})

const avgResponse = computed(() => {
  const mins = data.value.response_stats?.avg_minutes || 0
  if (mins < 60) return mins.toFixed(0) + 'm'
  return (mins / 60).toFixed(1) + 'h'
})

function arrayToMap(arr, keyField, valField) {
  const map = {}
  for (const item of (arr || [])) {
    map[item[keyField]] = item[valField]
  }
  return map
}

const issueDistList = computed(() => {
  const map = arrayToMap(data.value.issue_distribution, 'issue_type', 'count')
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1
  const types = [
    { type: 'layout', label: '布局', color: '#3182ce' },
    { type: 'color', label: '颜色', color: '#e53e3e' },
    { type: 'text', label: '文字', color: '#d69e2e' },
    { type: 'interaction', label: '交互', color: '#38a169' },
    { type: 'typography', label: '排版', color: '#805ad5' },
    { type: 'icon', label: '图标', color: '#ed8936' },
    { type: 'ux', label: '体验', color: '#38b2ac' },
    { type: 'content', label: '内容', color: '#667eea' },
    { type: 'other', label: '其他', color: '#718096' }
  ]
  return types
    .filter(t => map[t.type])
    .map(t => ({
      ...t,
      count: map[t.type] || 0,
      percent: ((map[t.type] || 0) / total) * 100
    }))
})

const priorityDistList = computed(() => {
  const map = arrayToMap(data.value.priority_distribution, 'priority', 'count')
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1
  const types = [
    { type: 'critical', label: '紧急', color: '#9b2c2c' },
    { type: 'high', label: '高', color: '#e53e3e' },
    { type: 'medium', label: '中', color: '#d69e2e' },
    { type: 'low', label: '低', color: '#3182ce' }
  ]
  return types
    .filter(t => map[t.type])
    .map(t => ({
      ...t,
      count: map[t.type] || 0,
      percent: Math.round(((map[t.type] || 0) / total) * 100)
    }))
})

const statusDistList = computed(() => {
  const map = arrayToMap(data.value.status_distribution, 'status', 'count')
  const total = Object.values(map).reduce((s, v) => s + v, 0) || 1
  const types = [
    { type: 'open', label: '未处理', color: '#e53e3e' },
    { type: 'in_progress', label: '处理中', color: '#d69e2e' },
    { type: 'resolved', label: '已解决', color: '#38a169' },
    { type: 'wontfix', label: '不修复', color: '#718096' }
  ]
  return types
    .filter(t => map[t.type])
    .map(t => ({
      ...t,
      count: map[t.type] || 0,
      percent: ((map[t.type] || 0) / total) * 100
    }))
})

const resolutionList = computed(() => {
  const map = arrayToMap(data.value.resolution_actions, 'action', 'count')
  const types = [
    { action: 'adopted', label: '采纳' },
    { action: 'deferred', label: '暂缓' },
    { action: 'rejected', label: '拒绝' },
    { action: 'fixed', label: '已修复' }
  ]
  return types.map(t => ({ ...t, count: map[t.action] || 0 }))
})

function issueIcon(type) {
  const map = { layout: '📐', color: '🎨', text: '📝', interaction: '👆', other: '❓', typography: '📝', icon: '🎨', ux: '👆', content: '📝' }
  return map[type] || '💬'
}

function resolutionIcon(action) {
  const map = { adopted: '✅', deferred: '⏸️', rejected: '❌', fixed: '🔧' }
  return map[action] || '•'
}

function priorityLabel(p) {
  const map = { critical: '紧急', high: '高', medium: '中', low: '低' }
  return map[p] || p
}

function priorityTagClass(p) {
  return `tag-${p || 'medium'}`
}

function commentStatusLabel(status) {
  const map = { open: '未处理', in_progress: '处理中', resolved: '已解决', wontfix: '不修复' }
  return map[status] || status
}

function statusTagClass(status) {
  return `tag-status-${status || 'open'}`
}

function changeTypeLabel(t) {
  const map = { create: '新增', update: '修改', delete: '删除' }
  return map[t] || t
}

function formatTime(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('zh-CN')
}

function goToProject(tab) {
  router.push({ path: `/project/${props.projectId}`, query: { tab } })
}

function goToComment(comment) {
  if (comment.review_id) {
    router.push(`/review/${comment.review_id}`)
  }
}

async function loadReport() {
  loading.value = true
  error.value = ''
  try {
    const [report, project] = await Promise.all([
      fetchReportSummary(props.projectId),
      fetchProject(props.projectId)
    ])
    data.value = report
    projectInfo.value = project || {}
  } catch (e) {
    error.value = '加载报表失败: ' + e.message
  } finally {
    loading.value = false
  }
}

onMounted(loadReport)
</script>

<style scoped>
.reports-page {
  max-width: 1200px;
  margin: 0 auto;
}

.reports-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.reports-header h2 {
  color: var(--color-primary);
  font-size: 18px;
  margin: 0;
}

.clickable {
  cursor: pointer;
  transition: all 0.2s;
}

.clickable:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  text-align: center;
  padding: 20px 16px;
}

.card-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.card-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-primary);
}

.card-label {
  font-size: 13px;
  color: var(--color-text-light);
  margin-top: 4px;
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card h4 {
  font-size: 15px;
  color: var(--color-primary);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--color-border);
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bar-row {
  display: grid;
  grid-template-columns: 80px 1fr 40px;
  align-items: center;
  gap: 8px;
}

.bar-label {
  font-size: 13px;
  color: var(--color-text);
}

.bar-track {
  height: 20px;
  background: var(--color-bg);
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s ease;
  min-width: 2px;
}

.bar-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  text-align: right;
}

.pie-display {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}

.pie-item {
  text-align: center;
  min-width: 80px;
}

.pie-circle {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 8px;
}

.pie-percent {
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.pie-label {
  font-size: 12px;
  color: var(--color-text);
}

.stacked-bar {
  display: flex;
  height: 28px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 12px;
}

.stacked-segment {
  transition: width 0.5s ease;
  min-width: 2px;
}

.stacked-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.resolution-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.res-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--color-bg);
  border-radius: var(--radius);
}

.res-icon {
  font-size: 18px;
}

.res-label {
  flex: 1;
  font-size: 14px;
}

.res-count {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.bottom-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius);
  border: 1px solid transparent;
  transition: all 0.2s;
}

.recent-item:hover {
  background: var(--color-bg);
  border-color: var(--color-border);
}

.issue-icon {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.recent-content-wrapper {
  flex: 1;
  min-width: 0;
}

.recent-content {
  font-size: 13px;
  color: var(--color-text);
  display: block;
  margin-bottom: 4px;
  line-height: 1.4;
}

.recent-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-priority,
.tag-status {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 8px;
  font-weight: 500;
}

.tag-critical { background: #fee2e2; color: #991b1b; }
.tag-high { background: #fed7aa; color: #92400e; }
.tag-medium { background: #fef3c7; color: #92400e; }
.tag-low { background: #dbeafe; color: #1e40af; }

.tag-status-open { background: #fee2e2; color: #991b1b; }
.tag-status-in_progress { background: #fef3c7; color: #92400e; }
.tag-status-resolved { background: #d1fae5; color: #065f46; }
.tag-status-wontfix { background: #e5e7eb; color: #374151; }

.recent-meta-col {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 11px;
  color: var(--color-text-light);
  flex-shrink: 0;
}

.recent-author {
  font-weight: 500;
  color: var(--color-text);
}

.recent-time {
  font-size: 10px;
}

.recent-go {
  color: var(--color-primary);
  font-weight: 500;
  font-size: 11px;
}

.coverage-display {
  padding: 8px 0;
}

.coverage-bar-track {
  height: 16px;
  background: var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 16px;
}

.coverage-bar-fill {
  height: 100%;
  background: var(--color-success);
  border-radius: 8px;
  transition: width 0.5s ease;
}

.coverage-stats {
  display: flex;
  gap: 24px;
}

.cov-item {
  text-align: center;
  flex: 1;
  padding: 8px;
  border-radius: var(--radius);
  transition: background 0.2s;
}

.cov-item:hover {
  background: var(--color-bg);
}

.cov-label {
  display: block;
  font-size: 12px;
  color: var(--color-text-light);
  margin-bottom: 4px;
}

.cov-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-primary);
}

.cov-value.linked {
  color: var(--color-success);
}

.cov-value.unlinked {
  color: var(--color-warning);
}

.coverage-hint {
  margin-top: 12px;
  padding: 10px 12px;
  background: #ebf8ff;
  border-radius: var(--radius);
  font-size: 12px;
  color: #2c5282;
}

.coverage-hint.warning {
  background: #fffaf0;
  color: #92400e;
}

.quality-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quality-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: var(--color-bg);
  border-radius: var(--radius);
}

.quality-version {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
  min-width: 40px;
}

.quality-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quality-page {
  font-size: 13px;
  color: var(--color-text);
}

.quality-change {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 8px;
  align-self: flex-start;
}

.change-create { background: #d1fae5; color: #065f46; }
.change-update { background: #fef3c7; color: #92400e; }
.change-delete { background: #fee2e2; color: #991b1b; }

.quality-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-size: 11px;
  color: var(--color-text-light);
}

.quality-issues {
  color: var(--color-danger);
  font-weight: 500;
}

.fix-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.fix-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 12px;
  background: var(--color-bg);
  border-radius: var(--radius);
}

.fix-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.fix-content {
  flex: 1;
  min-width: 0;
}

.fix-text {
  font-size: 13px;
  color: var(--color-text);
  display: block;
  margin-bottom: 4px;
}

.fix-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--color-text-light);
  flex-wrap: wrap;
}

.fix-time {
  font-size: 11px;
  color: var(--color-text-light);
  flex-shrink: 0;
}

.empty-sm {
  padding: 24px 16px;
  text-align: center;
  color: var(--color-text-light);
  font-size: 14px;
}

.empty-hint {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.8;
}
</style>
