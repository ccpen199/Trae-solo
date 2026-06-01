<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card clickable" shadow="hover" @click="router.push('/dispatch?status=处置中')">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #f56c6c 0%, #e6393d 100%);">
              <el-icon :size="28"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.active_alarms || 0 }}</div>
              <div class="stat-label">活跃警情</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card clickable" shadow="hover" @click="router.push('/dispatch')">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #e6a23c 0%, #cf8a24 100%);">
              <el-icon :size="28"><Van /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalDispatches }}</div>
              <div class="stat-label">已派警</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card clickable" shadow="hover" @click="router.push('/reports')">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a 0%, #4caf50 100%);">
              <el-icon :size="28"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.completed_alarms || 0 }}</div>
              <div class="stat-label">已处置</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card clickable" shadow="hover" @click="router.push('/reports')">
          <div class="stat-content">
            <div class="stat-icon" style="background: linear-gradient(135deg, #409eff 0%, #2d7de6 100%);">
              <el-icon :size="28"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.avg_response_minutes || '0' }}<span class="stat-unit">分钟</span></div>
              <div class="stat-label">平均响应</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <el-card class="active-alarms-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">活跃警情</span>
              <el-button type="primary" size="small" @click="loadActiveAlarms">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <el-table :data="activeAlarms" v-loading="loadingAlarms" stripe max-height="440">
            <el-table-column label="警情编号" width="140">
              <template #default="{ row }">
                <router-link :to="`/dispatch?alarmId=${row.id}`" class="alarm-link">
                  {{ row.alarm_no }}
                </router-link>
              </template>
            </el-table-column>
            <el-table-column prop="disaster_type" label="警情类型" width="110">
              <template #default="{ row }">
                <el-tag :type="getDisasterTypeTag(row.disaster_type)" size="small">
                  {{ row.disaster_type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="发生地点" show-overflow-tooltip />
            <el-table-column prop="disaster_level" label="等级" width="100">
              <template #default="{ row }">
                <el-tag :type="getLevelTag(row.disaster_level)" size="small" effect="dark">
                  {{ row.disaster_level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="alarm_time" label="报警时间" width="160" />
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="10">
        <el-card class="timeline-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时时间线</span>
              <el-button type="primary" size="small" @click="loadTimelines">
                <el-icon><Refresh /></el-icon>
                刷新
              </el-button>
            </div>
          </template>
          <div class="timeline-wrapper" v-loading="loadingTimeline">
            <el-timeline v-if="timelineEvents.length">
              <el-timeline-item
                v-for="(item, index) in timelineEvents"
                :key="index"
                :timestamp="formatTime(item.event_time)"
                :color="getTimelineColor(item.event_type)"
              >
                <div class="timeline-content">
                  <div class="timeline-title">
                    <el-tag :type="getEventTypeTag(item.event_type)" size="small" class="event-type-tag">
                      {{ item.event_type }}
                    </el-tag>
                  </div>
                  <div class="timeline-desc">{{ item.event_content }}</div>
                  <div class="timeline-operator" v-if="item.operator">{{ item.operator }}</div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无时间线数据" :image-size="80" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Warning, Van, CircleCheck, Clock, Refresh } from '@element-plus/icons-vue'
import { getAlarmList, getReportSummary, getTimeline } from '../api/index'

const router = useRouter()

const summary = ref({})
const activeAlarms = ref([])
const timelineEvents = ref([])
const loadingAlarms = ref(false)
const loadingTimeline = ref(false)
const loadingSummary = ref(false)

const totalDispatches = computed(() => {
  const stations = summary.value.by_station || []
  return stations.reduce((sum, s) => sum + (s.dispatch_count || 0), 0)
})

const loadSummary = async () => {
  loadingSummary.value = true
  try {
    const data = await getReportSummary()
    summary.value = data
  } catch (error) {
    console.error('加载统计数据失败:', error)
  } finally {
    loadingSummary.value = false
  }
}

const loadActiveAlarms = async () => {
  loadingAlarms.value = true
  try {
    const data = await getAlarmList({ page: 1, page_size: 20, status: '处置中' })
    const pending = await getAlarmList({ page: 1, page_size: 20, status: '待研判' })
    const handling = data.list || []
    const waiting = pending.list || []
    activeAlarms.value = [...waiting, ...handling]
  } catch (error) {
    ElMessage.error('加载活跃警情失败')
  } finally {
    loadingAlarms.value = false
  }
}

const loadTimelines = async () => {
  loadingTimeline.value = true
  try {
    const data = await getAlarmList({ page: 1, page_size: 5, status: '处置中' })
    const alarms = data.list || []
    if (alarms.length === 0) {
      timelineEvents.value = []
      return
    }
    const results = await Promise.all(
      alarms.map(alarm => getTimeline(alarm.id).catch(() => []))
    )
    const allEvents = results.flat()
    allEvents.sort((a, b) => new Date(b.event_time) - new Date(a.event_time))
    timelineEvents.value = allEvents.slice(0, 20)
  } catch (error) {
    ElMessage.error('加载时间线失败')
  } finally {
    loadingTimeline.value = false
  }
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const d = new Date(timeStr)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const getDisasterTypeTag = (type) => {
  const map = { '火灾': 'danger', '救援': 'warning', '危化品火灾': 'danger', '社会救助': 'info', '其他': 'success' }
  return map[type] || 'info'
}

const getLevelTag = (level) => {
  const map = { '特别重大': 'danger', '重大': 'warning', '较大': '', '一般': 'info' }
  return map[level] || 'info'
}

const getStatusTag = (status) => {
  const map = { '待研判': 'warning', '处置中': 'primary', '已结束': 'success', '误报': 'info' }
  return map[status] || 'info'
}

const getTimelineColor = (eventType) => {
  const map = { '接警': '#f56c6c', '派警': '#409eff', '出发': '#e6a23c', '到达': '#67c23a', '处置': '#909399', '结束': '#67c23a' }
  return map[eventType] || '#409eff'
}

const getEventTypeTag = (eventType) => {
  const map = { '接警': 'danger', '派警': 'primary', '出发': 'warning', '到达': 'success', '处置': 'info', '结束': 'success' }
  return map[eventType] || 'info'
}

onMounted(() => {
  loadSummary()
  loadActiveAlarms()
  loadTimelines()
})
</script>

<style scoped>
.dashboard {
  padding: 20px;
}
.stats-row {
  margin-bottom: 20px;
}
.stat-card {
  border-radius: 8px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card.clickable {
  cursor: pointer;
}
.stat-card.clickable:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}
.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}
.stat-info {
  flex: 1;
}
.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1.2;
}
.stat-unit {
  font-size: 14px;
  font-weight: normal;
  color: #909399;
  margin-left: 4px;
}
.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.active-alarms-card,
.timeline-card {
  border-radius: 8px;
}
.alarm-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}
.alarm-link:hover {
  color: #2d7de6;
  text-decoration: underline;
}
.timeline-wrapper {
  height: 440px;
  overflow-y: auto;
  padding-right: 10px;
}
.timeline-content {
  padding: 6px 0;
}
.timeline-title {
  margin-bottom: 4px;
}
.event-type-tag {
  margin-right: 6px;
}
.timeline-desc {
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
}
.timeline-operator {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
