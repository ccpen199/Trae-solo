<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #409EFF;">
            <el-icon size="28"><List /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.taskStats.totalTasks || 0 }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #67C23A;">
            <el-icon size="28"><TrendCharts /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.progressStats.totalProgresses || 0 }}</div>
            <div class="stat-label">进度记录</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #E6A23C;">
            <el-icon size="28"><Coin /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.rewardStats.totalRewards || 0 }}</div>
            <div class="stat-label">奖励发放</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #F56C6C;">
            <el-icon size="28"><Warning /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ exceptionRate }}%</div>
            <div class="stat-label">异常比例</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>任务状态分布</span>
          </template>
          <el-table :data="taskStatusList" stripe>
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">{{ getStatusName(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" />
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>转化漏斗</span>
          </template>
          <div class="funnel-container">
            <div 
              v-for="(item, index) in conversionFunnel" 
              :key="item.stage"
              class="funnel-item"
              :style="{ width: getFunnelWidth(index) + '%', background: getFunnelColor(index) }"
            >
              <div class="funnel-label">{{ item.label }}</div>
              <div class="funnel-value">{{ item.count }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="goTo('/tasks/create')" v-if="userStore.allowedActions.includes('create')">
              <el-icon><Plus /></el-icon> 创建任务
            </el-button>
            <el-button type="success" @click="goTo('/tasks')">
              <el-icon><View /></el-icon> 查看任务
            </el-button>
            <el-button type="warning" @click="goTo('/progress')">
              <el-icon><TrendCharts /></el-icon> 查看进度
            </el-button>
            <el-button type="info" @click="goTo('/reports')">
              <el-icon><DataAnalysis /></el-icon> 查看报表
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;" v-if="userStore.isPlayer">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>触发事件测试</span>
          </template>
          <el-form :inline="true" :model="triggerForm">
            <el-form-item label="触发事件">
              <el-select v-model="triggerForm.eventCode" placeholder="选择事件" style="width: 200px;">
                <el-option 
                  v-for="event in triggerEvents" 
                  :key="event.event_code"
                  :label="event.event_name"
                  :value="event.event_code"
                />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="triggerEvent" :loading="triggering">
                触发事件
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { reportApi, progressApi } from '../api'
import { 
  List, TrendCharts, Coin, Warning, Plus, View, DataAnalysis 
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const stats = ref({
  taskStats: {},
  progressStats: {},
  rewardStats: {}
})
const conversionFunnel = ref([])
const exceptionRate = ref(0)
const triggerEvents = ref([])
const triggerForm = ref({
  eventCode: ''
})
const triggering = ref(false)

const taskStatusList = computed(() => {
  return stats.value.taskStats.byStatus || []
})

const goTo = (path) => {
  router.push(path)
}

const getStatusType = (status) => {
  const types = {
    'draft': 'info',
    'pending_config': 'warning',
    'pending_trigger': 'primary',
    'pending_progress': 'info',
    'pending_reward': 'success',
    'pending_analysis': 'warning',
    'completed': 'success',
    'archived': 'info'
  }
  return types[status] || 'info'
}

const getStatusName = (status) => {
  const names = {
    'draft': '草稿',
    'pending_config': '待配置',
    'pending_trigger': '待触发',
    'pending_progress': '待进度',
    'pending_reward': '待奖励',
    'pending_analysis': '待分析',
    'completed': '已完成',
    'archived': '已归档'
  }
  return names[status] || status
}

const getFunnelWidth = (index) => {
  const baseWidths = [100, 85, 70, 55]
  return baseWidths[index] || 50
}

const getFunnelColor = (index) => {
  const colors = ['#409EFF', '#67C23A', '#E6A23C', '#909399']
  return colors[index] || '#909399'
}

const triggerEvent = async () => {
  if (!triggerForm.value.eventCode) return
  triggering.value = true
  try {
    await progressApi.triggerEvent({
      eventCode: triggerForm.value.eventCode,
      eventData: { test: true },
      source: 'dashboard_test'
    })
    loadDashboard()
  } finally {
    triggering.value = false
  }
}

const loadDashboard = async () => {
  try {
    const result = await reportApi.getDashboard()
    stats.value = result.data
    conversionFunnel.value = result.data.conversionFunnel
  } catch (error) {
    console.error('加载仪表板失败:', error)
  }
  
  try {
    const exceptionResult = await reportApi.getExceptions()
    exceptionRate.value = exceptionResult.data.exceptionRate?.toFixed(2) || 0
  } catch (error) {
    console.error('加载异常数据失败:', error)
  }

  try {
    const eventsResult = await progressApi.getTriggerEvents()
    triggerEvents.value = eventsResult.data
  } catch (error) {
    console.error('加载触发事件失败:', error)
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.funnel-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
}

.funnel-item {
  height: 40px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 500;
  gap: 8px;
  transition: width 0.3s;
}

.funnel-label {
  font-size: 12px;
}

.funnel-value {
  font-size: 14px;
  font-weight: bold;
}

.quick-actions {
  display: flex;
  gap: 12px;
}
</style>
