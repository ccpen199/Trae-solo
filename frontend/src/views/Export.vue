<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2 class="page-title">导出报告</h2>
      <div class="flex gap-10 items-center">
        <el-select v-model="selectedYear" placeholder="选择年份" style="width: 150px" @change="fetchReport">
          <el-option v-for="year in availableYears" :key="year" :label="`${year} 年`" :value="year" />
        </el-select>
        <el-tooltip content="隐私模式将隐藏敏感信息">
          <el-switch
            v-model="privacyMode"
            active-text="隐私模式"
            inactive-text="完整模式"
            @change="fetchReport"
          />
        </el-tooltip>
        <el-button type="success" :disabled="!reportData" @click="handleExportJSON" :loading="exporting">
          <el-icon><Download /></el-icon>
          导出 JSON
        </el-button>
      </div>
    </div>

    <el-card v-if="availableYears.length > 1" class="card-shadow mb-20">
      <template #header>
        <div class="flex-between">
          <span class="card-header-title">
            <el-icon><TrendCharts /></el-icon>
            历史年度对比
          </span>
        </div>
      </template>
      <div class="year-comparison">
        <el-row :gutter="20">
          <el-col :xs="12" :sm="6" v-for="year in availableYears.slice(0, 4)" :key="year">
            <div
              class="compare-card"
              :class="{ active: year == selectedYear }"
              @click="selectedYear = String(year); fetchReport()"
            >
              <div class="compare-year">{{ year }}</div>
              <el-skeleton v-if="loading" :rows="1" animated />
              <template v-else>
                <div class="compare-progress">
                  <el-progress
                    :percentage="getYearProgress(year)"
                    :stroke-width="8"
                    :color="year == selectedYear ? '#67c23a' : '#409eff'"
                  />
                </div>
                <div class="compare-stats">
                  <span class="text-success">{{ getYearCompleted(year) }}/{{ getYearTotal(year) }}</span>
                  <span class="text-info">目标</span>
                </div>
              </template>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>

    <div v-loading="loading">
      <el-empty v-if="!reportData && !loading" description="暂无该年度报告数据" />

      <div v-if="reportData">
        <el-card class="card-shadow mb-20">
          <template #header>
            <div class="flex-between">
              <span class="card-header-title">
                <el-icon><Document /></el-icon>
                {{ reportData.year }} 年度报告
              </span>
              <div class="flex gap-10 items-center">
                <el-tag size="small">生成时间: {{ reportData.generated_at }}</el-tag>
                <el-tag v-if="reportData.privacy_mode" type="warning" size="small">隐私模式</el-tag>
              </div>
            </div>
          </template>

          <el-row :gutter="20" class="mb-20">
            <el-col :xs="12" :sm="8" v-for="(value, key) in summaryLabels" :key="key">
              <div class="summary-item">
                <div class="summary-label">{{ value }}</div>
                <div class="summary-value">{{ reportData.summary[key] }}</div>
              </div>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="card-shadow mb-20">
          <template #header>
            <span class="card-header-title">
              <el-icon><List /></el-icon>
              目标详情
            </span>
          </template>
          <el-collapse accordion>
            <el-collapse-item
              v-for="goal in reportData.goals"
              :key="goal.id"
              :name="goal.id"
            >
              <template #title>
                <div class="flex-between collapse-title">
                  <div class="flex gap-10 items-center">
                    <span :class="`dimension-tag dimension-${goal.dimension}`">{{ goal.dimension }}</span>
                    <span class="goal-title">{{ goal.title }}</span>
                  </div>
                  <el-progress
                    :percentage="goal.progress || 0"
                    :stroke-width="10"
                    style="width: 150px"
                  />
                </div>
              </template>
              <div class="goal-detail">
                <p v-if="goal.description" class="goal-desc mb-10">{{ goal.description }}</p>
                <h4 class="mb-10">关键结果</h4>
                <div v-for="kr in goal.key_results" :key="kr.id" class="kr-detail mb-20">
                  <div class="flex-between mb-5">
                    <strong>{{ kr.title }}</strong>
                    <el-tag :type="kr.status === 'completed' ? 'success' : kr.status === 'cancelled' ? 'info' : 'warning'" size="small">
                      {{ kr.status === 'completed' ? '已完成' : kr.status === 'cancelled' ? '已取消' : '进行中' }}
                    </el-tag>
                  </div>
                  <el-progress :percentage="kr.progress || 0" class="mb-10" />
                  <div class="kr-meta flex gap-20 mb-10">
                    <span>目标值: {{ kr.target_value }} {{ kr.unit || '' }}</span>
                    <span>当前值: {{ kr.current_value || 0 }} {{ kr.unit || '' }}</span>
                  </div>
                  <div v-if="kr.milestones?.length" class="milestones mb-10">
                    <div class="section-subtitle">里程碑</div>
                    <el-timeline>
                      <el-timeline-item
                        v-for="m in kr.milestones"
                        :key="m.id"
                        :timestamp="m.target_date"
                        :type="m.is_completed ? 'success' : 'primary'"
                      >
                        <span>{{ m.title }}</span>
                        <el-tag v-if="m.is_completed" type="success" size="small" class="ml-10">已完成</el-tag>
                      </el-timeline-item>
                    </el-timeline>
                  </div>
                  <div v-if="kr.deviations?.length" class="deviations mb-10">
                    <div class="section-subtitle">偏差记录</div>
                    <el-alert
                      v-for="d in kr.deviations"
                      :key="d.id"
                      :title="`${d.type}: ${d.reason}`"
                      type="warning"
                      :closable="false"
                      class="mb-5"
                    >
                      <p v-if="d.solution">解决方案: {{ d.solution }}</p>
                    </el-alert>
                  </div>
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </el-card>

        <el-card class="card-shadow mb-20">
          <template #header>
            <span class="card-header-title">
              <el-icon><TimeLine /></el-icon>
              年度时间线
            </span>
          </template>
          <el-timeline v-if="reportData.timeline?.length">
            <el-timeline-item
              v-for="(event, index) in reportData.timeline"
              :key="index"
              :timestamp="event.date"
              :type="getTimelineType(event.type)"
            >
              <el-tag :type="getTimelineType(event.type)" size="small" class="mb-5">
                {{ getTimelineLabel(event.type) }}
              </el-tag>
              <div class="timeline-title">{{ event.title }}</div>
              <div class="timeline-meta text-info text-sm">
                {{ event.goal }} / {{ event.kr }}
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无时间线数据" :image-size="80" />
        </el-card>

        <el-card class="card-shadow mb-20">
          <template #header>
            <span class="card-header-title">
              <el-icon><ListCheck /></el-icon>
              行动清单
            </span>
          </template>
          <div v-if="reportData.action_items?.length">
            <el-table :data="reportData.action_items" stripe>
              <el-table-column label="优先级" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'" size="small">
                    {{ row.priority === 'high' ? '高' : row.priority === 'medium' ? '中' : '低' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="title" label="事项" min-width="200" />
              <el-table-column prop="goal" label="关联目标" min-width="150" />
              <el-table-column prop="suggestion" label="建议" min-width="250" show-overflow-tooltip />
            </el-table>
          </div>
          <el-empty v-else description="暂无行动项" :image-size="80" />
        </el-card>

        <el-card class="card-shadow">
          <template #header>
            <span class="card-header-title">
              <el-icon><DataLine /></el-icon>
              数据图表
            </span>
          </template>
          <el-row :gutter="20">
            <el-col :md="12">
              <h4 class="mb-10">月度执行时间</h4>
              <div class="chart-container">
                <div v-for="stat in reportData.executionStats" :key="stat.month" class="chart-bar">
                  <div class="bar-label">{{ stat.month }}</div>
                  <div class="bar-wrapper">
                    <div
                      class="bar-fill"
                      :style="{ height: getBarHeight(stat.total_time) + '%' }"
                    ></div>
                  </div>
                  <div class="bar-value">{{ formatMinutes(stat.total_time) }}</div>
                </div>
              </div>
            </el-col>
            <el-col :md="12">
              <h4 class="mb-10">习惯打卡统计</h4>
              <div class="habit-stats">
                <div v-for="habit in reportData.habitStats" :key="habit.name" class="habit-stat-item flex-between mb-10">
                  <span>{{ habit.name }}</span>
                  <div class="flex gap-10 items-center">
                    <el-tag size="small">{{ habit.frequency }}</el-tag>
                    <span class="text-success font-bold">{{ habit.checkin_count }} 次</span>
                  </div>
                </div>
                <el-empty v-if="!reportData.habitStats?.length" description="暂无习惯数据" :image-size="60" />
              </div>
            </el-col>
          </el-row>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { exportApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const exporting = ref(false)
const selectedYear = ref(String(dayjs().year()))
const privacyMode = ref(false)
const availableYears = ref([])
const reportData = ref(null)
const yearCache = reactive({})

const summaryLabels = {
  total_goals: '目标总数',
  completed_goals: '已完成目标',
  total_krs: '关键结果总数',
  completed_krs: '已完成关键结果',
  total_deviations: '偏差记录数',
  total_time: '总投入时间(分钟)',
  average_progress: '平均进度(%)'
}

async function fetchYears() {
  try {
    const res = await exportApi.getYears()
    availableYears.value = res.years.length > 0 ? res.years : [dayjs().year()]
    if (availableYears.value.length > 0 && !availableYears.value.includes(Number(selectedYear.value))) {
      selectedYear.value = String(availableYears.value[0])
    }
  } catch (err) {
    ElMessage.error(err.message || '获取年份列表失败')
    availableYears.value = [dayjs().year()]
  }
}

async function fetchReport() {
  try {
    loading.value = true
    const report = await exportApi.getReport(selectedYear.value, { privacy_mode: privacyMode.value })
    reportData.value = report
    yearCache[selectedYear.value] = report
  } catch (err) {
    ElMessage.error(err.message || '获取报告数据失败')
    reportData.value = null
  } finally {
    loading.value = false
  }
}

function getTimelineType(type) {
  const map = { milestone: 'success', execution: 'primary', deviation: 'warning' }
  return map[type] || 'info'
}

function getTimelineLabel(type) {
  const map = { milestone: '里程碑', execution: '执行记录', deviation: '偏差' }
  return map[type] || '事件'
}

function getYearProgress(year) {
  return yearCache[year]?.summary?.average_progress || 0
}

function getYearCompleted(year) {
  return yearCache[year]?.summary?.completed_goals || 0
}

function getYearTotal(year) {
  return yearCache[year]?.summary?.total_goals || 0
}

function getBarHeight(value) {
  if (!value) return 0
  const max = Math.max(...(reportData.value?.executionStats?.map(s => s.total_time) || [1]))
  return Math.min(100, (value / max) * 100)
}

function formatMinutes(minutes) {
  if (!minutes) return '0'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h${m}m` : `${h}h`
}

async function handleExportJSON() {
  try {
    exporting.value = true
    const dataStr = JSON.stringify(reportData.value, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `年度报告_${reportData.value.year}_${dayjs().format('YYYYMMDDHHmmss')}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch (err) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

onMounted(async () => {
  await fetchYears()
  await fetchReport()
})
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.card-header-title {
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.year-comparison {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.compare-card {
  padding: 20px;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;
}

.compare-card:hover {
  border-color: #409eff;
  background: #ecf5ff;
}

.compare-card.active {
  border-color: #67c23a;
  background: #f0f9eb;
}

.compare-year {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 12px;
}

.compare-progress {
  margin-bottom: 8px;
}

.compare-stats {
  display: flex;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
}

.summary-item {
  text-align: center;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.summary-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

.collapse-title {
  width: 100%;
  padding-right: 20px;
}

.goal-title {
  font-weight: 500;
}

.goal-desc {
  color: #606266;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.kr-detail {
  padding: 12px;
  background: #fafafa;
  border-radius: 6px;
  margin-bottom: 12px;
}

.kr-meta {
  font-size: 12px;
  color: #909399;
}

.section-subtitle {
  font-size: 13px;
  font-weight: 600;
  color: #606266;
  margin-bottom: 8px;
}

.timeline-title {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
}

.timeline-meta {
  font-size: 12px;
}

.text-sm {
  font-size: 12px;
}

.ml-10 {
  margin-left: 10px;
}

.font-bold {
  font-weight: 600;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 200px;
  padding: 10px 0;
}

.chart-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.bar-label {
  font-size: 10px;
  color: #909399;
}

.bar-wrapper {
  width: 100%;
  height: 150px;
  background: #f5f7fa;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}

.bar-fill {
  width: 100%;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px 4px 0 0;
  transition: height 0.5s ease;
  min-height: 2px;
}

.bar-value {
  font-size: 10px;
  color: #606266;
}

.habit-stat-item {
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
