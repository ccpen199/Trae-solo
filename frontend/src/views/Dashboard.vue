<template>
  <div class="dashboard">
    <h2 class="page-title">📊 运营仪表盘</h2>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-info">
          <div class="stat-value">{{ summary.totalCustomers || 0 }}</div>
          <div class="stat-label">总客户数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏠</div>
        <div class="stat-info">
          <div class="stat-value">{{ getStageCount('signed') }}</div>
          <div class="stat-label">已成交</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-value">{{ getStageCount('deposit') + getStageCount('subscription') }}</div>
          <div class="stat-label">认筹中</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📉</div>
        <div class="stat-info">
          <div class="stat-value">{{ getStageCount('churned') }}</div>
          <div class="stat-label">已流失</div>
        </div>
      </div>
    </div>

    <div class="content-grid">
      <div class="panel">
        <h3 class="panel-title">客户阶段分布</h3>
        <div class="stage-list">
          <div v-for="stage in stageList" :key="stage.value" class="stage-item">
            <span class="stage-name">{{ stage.label }}</span>
            <div class="stage-bar">
              <div class="stage-bar-fill" :style="{ width: getStagePercent(stage.value) + '%' }"></div>
            </div>
            <span class="stage-count">{{ getStageCount(stage.value) }}</span>
          </div>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">渠道来源分布</h3>
        <div class="channel-list">
          <div v-for="ch in summary.channelStats" :key="ch.channel" class="channel-item">
            <span class="channel-name">{{ ch.channel || '未分配' }}</span>
            <span class="channel-count">{{ ch.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3 class="panel-title">置业顾问业绩</h3>
      <table class="table">
        <thead>
          <tr>
            <th>置业顾问</th>
            <th>客户数量</th>
            <th>占比</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="agent in summary.agentStats" :key="agent.agent">
            <td>{{ agent.agent }}</td>
            <td>{{ agent.count }}</td>
            <td>{{ summary.totalCustomers ? (agent.count / summary.totalCustomers * 100).toFixed(1) : 0 }}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { getSummaryReport } from '../api'

export default {
  name: 'Dashboard',
  setup() {
    const summary = ref({
      totalCustomers: 0,
      stageStats: [],
      channelStats: [],
      agentStats: []
    })

    const stageList = [
      { value: 'lead', label: '新线索' },
      { value: 'visited', label: '已到访' },
      { value: 'deposit', label: '已认筹' },
      { value: 'subscription', label: '已认购' },
      { value: 'signed', label: '已签约' },
      { value: 'churned', label: '已流失' }
    ]

    const getStageCount = (stage) => {
      const found = summary.value.stageStats.find(s => s.stage === stage)
      return found ? found.count : 0
    }

    const getStagePercent = (stage) => {
      if (!summary.value.totalCustomers) return 0
      return (getStageCount(stage) / summary.value.totalCustomers * 100).toFixed(1)
    }

    const loadData = async () => {
      try {
        const res = await getSummaryReport()
        summary.value = res.data
      } catch (e) {
        console.error('加载数据失败', e)
      }
    }

    onMounted(loadData)

    return {
      summary,
      stageList,
      getStageCount,
      getStagePercent
    }
  }
}
</script>

<style scoped>
.dashboard { display: flex; flex-direction: column; gap: 24px; }
.page-title { font-size: 24px; font-weight: 600; color: #1f2937; margin: 0; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.stat-card { background: white; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.stat-icon { font-size: 36px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #eff6ff, #dbeafe); border-radius: 12px; }
.stat-info { flex: 1; }
.stat-value { font-size: 28px; font-weight: 700; color: #1f2937; }
.stat-label { font-size: 13px; color: #6b7280; margin-top: 4px; }
.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
.panel { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.panel-title { font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; }
.stage-list { display: flex; flex-direction: column; gap: 12px; }
.stage-item { display: flex; align-items: center; gap: 12px; }
.stage-name { width: 80px; font-size: 14px; color: #374151; }
.stage-bar { flex: 1; height: 12px; background: #f3f4f6; border-radius: 6px; overflow: hidden; }
.stage-bar-fill { height: 100%; background: linear-gradient(90deg, #3b82f6, #60a5fa); border-radius: 6px; transition: width 0.3s; }
.stage-count { width: 50px; text-align: right; font-size: 14px; font-weight: 600; color: #1f2937; }
.channel-list { display: flex; flex-direction: column; gap: 12px; }
.channel-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.channel-name { font-size: 14px; color: #374151; }
.channel-count { font-size: 14px; font-weight: 600; color: #3b82f6; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #f3f4f6; font-size: 14px; }
.table th { background: #f9fafb; font-weight: 600; color: #374151; }
.table td { color: #4b5563; }
</style>
