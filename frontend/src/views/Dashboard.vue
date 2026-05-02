<template>
  <div class="dashboard-container">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon purple">
              <el-icon :size="32"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.houses }}</div>
              <div class="stat-label">可租房源</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon blue">
              <el-icon :size="32"><List /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.activeSessions }}</div>
              <div class="stat-label">进行中会话</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon green">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.completedSessions }}</div>
              <div class="stat-label">已完成会话</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon orange">
              <el-icon :size="32"><Bell /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ userStore.todoCount.totalCount }}</div>
              <div class="stat-label">待办事项</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近看房会话</span>
              <el-button type="primary" link @click="$router.push('/sessions')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentSessions" v-loading="loading" style="width: 100%">
            <el-table-column prop="session_no" label="会话编号" width="180" />
            <el-table-column prop="house_name" label="房源名称" min-width="200" />
            <el-table-column prop="buyer_name" label="购房者" width="100" />
            <el-table-column prop="agent_name" label="经纪人" width="100" />
            <el-table-column prop="status" label="状态" width="120">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="current_step" label="当前步骤" width="120">
              <template #default="scope">
                <el-tag size="small" type="info">{{ getStepLabel(scope.row.current_step) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button type="primary" link @click="goToSession(scope.row.id)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>业务流程说明</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(step, index) in workflowSteps"
              :key="index"
              :timestamp="step.time"
              placement="top"
            >
              <el-card shadow="never" :body-style="{ padding: '8px 12px' }">
                <h4>{{ step.title }}</h4>
                <p style="font-size: 12px; color: #909399; margin-top: 4px;">{{ step.description }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { sessionsApi, housesApi } from '@/api'
import { OfficeBuilding, List, CircleCheck, Bell } from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(false)
const recentSessions = ref([])

const stats = reactive({
  houses: 0,
  activeSessions: 0,
  completedSessions: 0
})

const workflowSteps = [
  { title: '选择房源', time: '步骤1', description: '购房者浏览房源列表，选择意向房源' },
  { title: '进入3D空间', time: '步骤2', description: '经纪人准备3D全景空间，锁定户型图' },
  { title: '查看热点', time: '步骤3', description: '购房者查看3D空间中的热点信息' },
  { title: '咨询预约', time: '步骤4', description: '经纪人确认预约信息，可驳回或转派' },
  { title: '完成留资', time: '步骤5', description: '购房者完成信息填写，会话结束' }
]

const getStatusType = (status) => {
  const typeMap = {
    'pending_house_selection': 'info',
    'pending_3d_space': 'warning',
    'pending_hotspot_view': 'primary',
    'pending_consultation': 'warning',
    'pending_lead_capture': 'primary',
    'completed': 'success',
    'cancelled': 'info',
    'rejected': 'danger'
  }
  return typeMap[status] || 'info'
}

const getStatusLabel = (status) => {
  const labelMap = {
    'pending_house_selection': '待选房源',
    'pending_3d_space': '待3D空间',
    'pending_hotspot_view': '待看热点',
    'pending_consultation': '待咨询预约',
    'pending_lead_capture': '待留资',
    'completed': '已完成',
    'cancelled': '已撤销',
    'rejected': '已驳回'
  }
  return labelMap[status] || status
}

const getStepLabel = (step) => {
  const labelMap = {
    'house_selection': '选房',
    'three_d_space': '3D空间',
    'hotspot_view': '热点',
    'consultation': '预约',
    'lead_capture': '留资'
  }
  return labelMap[step] || step
}

const goToSession = (id) => {
  router.push(`/sessions/${id}`)
}

const fetchData = async () => {
  loading.value = true
  try {
    const [sessionsRes, housesRes] = await Promise.all([
      sessionsApi.getList({ pageSize: 10 }),
      housesApi.getList({ pageSize: 100 })
    ])
    
    recentSessions.value = sessionsRes.sessions
    stats.houses = housesRes.pagination.total
    
    const activeStatuses = ['pending_house_selection', 'pending_3d_space', 'pending_hotspot_view', 'pending_consultation', 'pending_lead_capture']
    stats.activeSessions = recentSessions.value.filter(s => activeStatuses.includes(s.status)).length
    stats.completedSessions = recentSessions.value.filter(s => s.status === 'completed').length
  } catch (error) {
    console.error('获取数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.dashboard-container {
  min-height: 100%;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  border-radius: 8px;
  border: none;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-icon.purple {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.blue {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #303133;
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
  font-weight: bold;
  font-size: 16px;
}

.content-row {
  margin-bottom: 24px;
}
</style>
