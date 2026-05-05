<template>
  <div>
    <div class="page-header">
      <h2>仪表盘</h2>
      <div class="description">ECU诊断与标定管理平台概览</div>
    </div>

    <el-row :gutter="20">
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover">
          <el-icon :size="40"><Van /></el-icon>
          <div class="value">{{ dashboardData.stats?.activeVehicles || 0 }}</div>
          <div class="label">在线车辆</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
          <el-icon :size="40"><Warning /></el-icon>
          <div class="value">{{ dashboardData.stats?.activeFaults || 0 }}</div>
          <div class="label">活跃故障</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover" style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);">
          <el-icon :size="40"><CircleCloseFilled /></el-icon>
          <div class="value">{{ dashboardData.stats?.highSeverityFaults || 0 }}</div>
          <div class="label">高优先级故障</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
          <el-icon :size="40"><Timer /></el-icon>
          <div class="value">{{ dashboardData.stats?.pendingCalibration || 0 }}</div>
          <div class="label">待审核标定</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
          <el-icon :size="40"><CircleCheck /></el-icon>
          <div class="value">{{ dashboardData.stats?.publishedCalibration || 0 }}</div>
          <div class="label">已发布标定</div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card" shadow="hover" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
          <el-icon :size="40"><DataAnalysis /></el-icon>
          <div class="value">{{ activeSessions }}</div>
          <div class="label">活跃采集会话</div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold;">最近故障</span>
          </template>
          <el-table :data="dashboardData.recentFaults || []" style="width: 100%">
            <el-table-column prop="fault_code" label="故障码" width="120" />
            <el-table-column prop="fault_name" label="故障名称" />
            <el-table-column prop="vin" label="车辆VIN" width="180" />
            <el-table-column prop="severity" label="严重程度" width="100">
              <template #default="scope">
                <span :class="`status-tag severity-${scope.row.severity}`">
                  {{ scope.row.severity === 'high' ? '高' : scope.row.severity === 'medium' ? '中' : '低' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <span :class="`status-tag status-${scope.row.status}`">
                  {{ scope.row.status === 'active' ? '活跃' : scope.row.status === 'cleared' ? '已清除' : '已修复' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="primary" link @click="goToFaultDetail(scope.row.id)">
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold;">快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="goToVehicles" style="width: 100%; margin-bottom: 12px;">
              <el-icon><Plus /></el-icon>
              添加车辆档案
            </el-button>
            <el-button type="success" size="large" @click="goToDataCollection" style="width: 100%; margin-bottom: 12px;">
              <el-icon><DataAnalysis /></el-icon>
              开始数据采集
            </el-button>
            <el-button type="warning" size="large" @click="goToFaults" style="width: 100%; margin-bottom: 12px;">
              <el-icon><Warning /></el-icon>
              查看故障诊断
            </el-button>
            <el-button type="info" size="large" @click="goToCalibration" style="width: 100%;">
              <el-icon><Setting /></el-icon>
              管理标定参数
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <span style="font-weight: bold;">最近数据采集会话</span>
          </template>
          <el-table :data="dashboardData.recentSessions || []" style="width: 100%">
            <el-table-column prop="session_code" label="会话编号" width="180" />
            <el-table-column prop="vin" label="车辆VIN" width="180" />
            <el-table-column prop="model_name" label="车型" />
            <el-table-column prop="protocol_type" label="通讯协议" width="100" />
            <el-table-column prop="total_samples" label="采样数量" width="120" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="scope.row.status === 'running' ? 'success' : 'info'">
                  {{ scope.row.status === 'running' ? '进行中' : '已完成' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_by_name" label="创建人" width="100" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="scope">
                {{ formatTime(scope.row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="primary" link @click="goToSessionDetail(scope.row.id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '../utils/request'
import { 
  Van, Warning, CircleCloseFilled, Timer, CircleCheck, DataAnalysis,
  Plus, Setting
} from '@element-plus/icons-vue'

const router = useRouter()

const dashboardData = ref({
  stats: {},
  recentFaults: [],
  recentSessions: [],
})

const activeSessions = ref(0)

const fetchDashboardData = async () => {
  try {
    const data = await request.get('/reports/dashboard')
    dashboardData.value = data
    activeSessions.value = (data.recentSessions || []).filter(s => s.status === 'running').length
  } catch (err) {
    console.error('获取仪表盘数据失败:', err)
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const goToVehicles = () => router.push('/vehicles')
const goToDataCollection = () => router.push('/data-collection')
const goToFaults = () => router.push('/faults')
const goToCalibration = () => router.push('/calibration')
const goToFaultDetail = (id) => router.push(`/faults/${id}`)
const goToSessionDetail = (id) => router.push(`/data-collection/session/${id}`)

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.quick-actions {
  padding: 10px 0;
}
</style>
