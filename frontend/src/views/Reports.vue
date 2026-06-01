<template>
  <div class="reports">
    <h2 class="page-title">📈 数据报表</h2>

    <div class="content-grid">
      <div class="panel">
        <h3 class="panel-title">流失原因分析</h3>
        <div class="reason-list">
          <div v-for="r in churnReasons" :key="r.reason" class="reason-item">
            <div class="reason-header">
              <span class="reason-name">{{ r.reason || '未填写' }}</span>
              <span class="reason-count">{{ r.count }} 人</span>
            </div>
            <div class="reason-bar">
              <div class="reason-bar-fill" :style="{ width: getReasonPercent(r.count) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="panel">
        <h3 class="panel-title">竞品项目统计</h3>
        <div class="competitor-list">
          <div v-for="c in competitors" :key="c.competitor" class="competitor-item">
            <span class="competitor-name">{{ c.competitor }}</span>
            <span class="competitor-count">{{ c.count }} 人</span>
          </div>
          <div v-if="competitors.length === 0" class="empty-state">暂无竞品数据</div>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3 class="panel-title">成交漏斗分析</h3>
      <div class="funnel">
        <div v-for="(s, i) in funnelData" :key="s.label" class="funnel-item" :style="{ width: s.width + '%' }">
          <div class="funnel-content">
            <span class="funnel-label">{{ s.label }}</span>
            <span class="funnel-count">{{ s.count }} 人</span>
            <span v-if="i > 0" class="funnel-rate">转化率 {{ getRate(s.count, funnelData[i-1].count) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import { getSummaryReport, getChurnReport } from '../api'

export default {
  name: 'Reports',
  setup() {
    const summary = ref({ stageStats: [] })
    const churnReasons = ref([])
    const competitors = ref([])

    const stageLabels = [
      { value: 'lead', label: '新线索' },
      { value: 'visited', label: '已到访' },
      { value: 'deposit', label: '已认筹' },
      { value: 'subscription', label: '已认购' },
      { value: 'signed', label: '已签约' }
    ]

    const funnelData = computed(() => {
      const data = stageLabels.map(s => {
        const found = summary.value.stageStats.find(st => st.stage === s.value)
        return {
          label: s.label,
          count: found ? found.count : 0
        }
      })
      const maxCount = Math.max(...data.map(d => d.count), 1)
      return data.map(d => ({
        ...d,
        width: (d.count / maxCount * 100)
      }))
    })

    const getRate = (current, previous) => {
      if (!previous) return '-'
      return (current / previous * 100).toFixed(1) + '%'
    }

    const totalChurns = computed(() => {
      return churnReasons.value.reduce((sum, r) => sum + r.count, 0)
    })

    const getReasonPercent = (count) => {
      if (!totalChurns.value) return 0
      return (count / totalChurns.value * 100).toFixed(1)
    }

    onMounted(async () => {
      const [summaryRes, churnRes] = await Promise.all([
        getSummaryReport(),
        getChurnReport()
      ])
      summary.value = summaryRes.data
      churnReasons.value = churnRes.data.reasons
      competitors.value = churnRes.data.competitors
    })

    return {
      churnReasons,
      competitors,
      funnelData,
      getRate,
      getReasonPercent
    }
  }
}
</script>

<style scoped>
.reports { display: flex; flex-direction: column; gap: 24px; }
.page-title { font-size: 24px; font-weight: 600; color: #1f2937; margin: 0; }
.content-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
.panel { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.panel-title { font-size: 16px; font-weight: 600; color: #1f2937; margin: 0 0 16px 0; }
.reason-list { display: flex; flex-direction: column; gap: 14px; }
.reason-item { display: flex; flex-direction: column; gap: 6px; }
.reason-header { display: flex; justify-content: space-between; }
.reason-name { font-size: 14px; color: #374151; }
.reason-count { font-size: 14px; font-weight: 600; color: #dc2626; }
.reason-bar { height: 10px; background: #f3f4f6; border-radius: 5px; overflow: hidden; }
.reason-bar-fill { height: 100%; background: linear-gradient(90deg, #ef4444, #f87171); border-radius: 5px; transition: width 0.3s; }
.competitor-list { display: flex; flex-direction: column; gap: 10px; }
.competitor-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
.competitor-name { font-size: 14px; color: #374151; }
.competitor-count { font-size: 14px; font-weight: 600; color: #f59e0b; }
.empty-state { text-align: center; padding: 20px; color: #9ca3af; font-size: 14px; }
.funnel { display: flex; flex-direction: column; gap: 8px; align-items: center; padding: 20px 0; }
.funnel-item { height: 50px; background: linear-gradient(135deg, #3b82f6, #60a5fa); border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: width 0.3s; }
.funnel-content { display: flex; gap: 20px; align-items: center; color: white; }
.funnel-label { font-weight: 600; font-size: 14px; }
.funnel-count { font-size: 14px; opacity: 0.9; }
.funnel-rate { font-size: 13px; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 4px; }
</style>
