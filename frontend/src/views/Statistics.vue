<template>
  <div class="statistics-page">
    <div class="overview-section">
      <div class="section-title">数据概览</div>
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_conversations }}</div>
          <div class="stat-label">总会话数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_messages }}</div>
          <div class="stat-label">总消息数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.failed_messages }}</div>
          <div class="stat-label">失败消息</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.recalled_messages }}</div>
          <div class="stat-label">已撤回消息</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_reports }}</div>
          <div class="stat-label">总举报数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value pending">{{ stats.pending_reports }}</div>
          <div class="stat-label">待处理举报</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_users }}</div>
          <div class="stat-label">总用户数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.active_users }}</div>
          <div class="stat-label">活跃用户</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.blocked_count }}</div>
          <div class="stat-label">屏蔽数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.total_punishments }}</div>
          <div class="stat-label">总处罚数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ stats.cs_sessions }}</div>
          <div class="stat-label">客服会话</div>
        </div>
      </div>
    </div>

    <div class="trend-section">
      <div class="section-title">
        消息趋势
        <select v-model="trendDays" @change="loadTrend" class="days-select">
          <option :value="7">近7天</option>
          <option :value="14">近14天</option>
          <option :value="30">近30天</option>
        </select>
      </div>
      <div class="chart-area">
        <div class="chart-bars">
          <div v-for="item in trend" :key="item.date" class="chart-bar-group">
            <div class="bar-wrapper">
              <div class="bar bar-message" :style="{ height: getBarHeight(item.messages) + 'px' }" :title="`消息: ${item.messages}`"></div>
              <div class="bar bar-report" :style="{ height: getBarHeight(item.reports) + 'px' }" :title="`举报: ${item.reports}`"></div>
            </div>
            <div class="bar-label">{{ item.date.slice(5) }}</div>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-color message"></span>消息</span>
          <span class="legend-item"><span class="legend-color report"></span>举报</span>
        </div>
      </div>
    </div>

    <div class="cs-section">
      <div class="section-title">客服响应分析</div>
      <div class="cs-info">
        <div class="cs-avg">
          平均响应时间: <strong>{{ csData.avg_response_time }}秒</strong>
        </div>
      </div>
      <div class="cs-sessions">
        <table>
          <thead>
            <tr>
              <th>会话ID</th>
              <th>名称</th>
              <th>消息数</th>
              <th>响应时间</th>
              <th>创建时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in csData.sessions" :key="s.id">
              <td>#{{ s.id }}</td>
              <td>{{ s.name || '-' }}</td>
              <td>{{ s.message_count }}</td>
              <td>{{ s.response_time_seconds ? s.response_time_seconds + '秒' : '-' }}</td>
              <td>{{ formatTime(s.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statisticsApi } from '../api'

const stats = ref({})
const trend = ref([])
const trendDays = ref(7)
const csData = ref({ sessions: [], avg_response_time: 0 })

const loadOverview = async () => {
  try {
    const res = await statisticsApi.overview()
    stats.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const loadTrend = async () => {
  try {
    const res = await statisticsApi.trend({ days: trendDays.value })
    trend.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const loadCsResponse = async () => {
  try {
    const res = await statisticsApi.csResponse()
    csData.value = res.data
  } catch (e) {
    console.error(e)
  }
}

const getBarHeight = (value) => {
  const max = Math.max(...trend.value.map(t => Math.max(t.messages, t.reports)), 1)
  return (value / max) * 150
}

const formatTime = (t) => {
  if (!t) return ''
  return new Date(t).toLocaleDateString('zh-CN')
}

onMounted(() => {
  loadOverview()
  loadTrend()
  loadCsResponse()
})
</script>

<style scoped>
.statistics-page { height: 100%; overflow-y: auto; }
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.days-select {
  padding: 4px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  font-size: 13px;
}
.overview-section, .trend-section, .cs-section {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
}
.stat-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.stat-card {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}
.stat-value.pending { color: #f59e0b; }
.stat-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}
.chart-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.chart-bars {
  display: flex;
  gap: 8px;
  align-items: flex-end;
  height: 180px;
  padding: 0 8px;
  overflow-x: auto;
}
.chart-bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 40px;
}
.bar-wrapper {
  display: flex;
  gap: 2px;
  align-items: flex-end;
  height: 150px;
}
.bar {
  width: 14px;
  border-radius: 3px 3px 0 0;
  transition: height 0.3s;
}
.bar-message { background: #3b82f6; }
.bar-report { background: #ef4444; }
.bar-label {
  font-size: 11px;
  color: #64748b;
}
.chart-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}
.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}
.legend-color.message { background: #3b82f6; }
.legend-color.report { background: #ef4444; }
.cs-info {
  margin-bottom: 16px;
}
.cs-avg {
  font-size: 14px;
  color: #64748b;
}
.cs-avg strong {
  color: #3b82f6;
  font-size: 18px;
}
.cs-sessions table {
  width: 100%;
  border-collapse: collapse;
}
.cs-sessions th, .cs-sessions td {
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
  font-size: 13px;
}
.cs-sessions th {
  background: #f8fafc;
  font-weight: 600;
  color: #475569;
}
</style>
