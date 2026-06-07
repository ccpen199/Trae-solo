<template>
  <AdminLayout>
    <div class="admin-monitor">
      <div class="page-header">
        <h3>系统监控</h3>
        <div class="header-actions">
          <el-button type="primary" @click="loadData">刷新状态</el-button>
        </div>
      </div>

      <el-row :gutter="20" class="status-overview">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon online">
              <el-icon><Select /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ onlineCount }}</div>
              <div class="stat-label">在线系统</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon offline">
              <el-icon><Close /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ offlineCount }}</div>
              <div class="stat-label">异常系统</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon avg">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ avgResponse }}ms</div>
              <div class="stat-label">平均响应</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-icon check">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ healthRate }}%</div>
              <div class="stat-label">系统健康度</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="monitor-card">
        <template #header>
          <span>各厅局系统健康状态</span>
        </template>
        <el-table :data="systems" border style="width: 100%">
          <el-table-column prop="system_name" label="系统名称" min-width="200" />
          <el-table-column prop="department" label="所属部门" width="180" />
          <el-table-column prop="status" label="状态" width="120">
            <template #default="{ row }">
              <el-tag :type="row.status === 'online' ? 'success' : 'danger'" effect="dark">
                {{ row.status === 'online' ? '在线' : '离线' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="response_time" label="响应时间" width="120">
            <template #default="{ row }">
              <span :class="{ 'slow-response': row.response_time > 150 }">
                {{ row.response_time }}ms
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="last_check" label="最近检查时间" width="200">
            <template #default="{ row }">{{ formatDate(row.last_check) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" type="primary" link @click="checkSystem(row)">手动检测</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="overdue-card" style="margin-top: 20px;">
        <template #header>
          <span class="overdue-title">
            <el-icon><Warning /></el-icon>
            超时督办（{{ overdueApps.length }}）
          </span>
        </template>
        <el-table :data="overdueApps" border style="width: 100%">
          <el-table-column prop="application_no" label="申请编号" width="180" />
          <el-table-column prop="service_name" label="服务事项" min-width="200" />
          <el-table-column prop="applicant_name" label="申请人" width="120" />
          <el-table-column prop="department" label="办理部门" width="140" />
          <el-table-column prop="handling_deadline" label="截止时间" width="180">
            <template #default="{ row }">{{ formatDate(row.handling_deadline) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="150">
            <template #default="{ row }">
              <el-button size="small" type="warning" link @click="handleUrge(row)">督办</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Select, Close, Timer, CircleCheck, Warning } from '@element-plus/icons-vue'
import AdminLayout from '@/components/AdminLayout.vue'
import { adminApi } from '@/api'

const systems = ref([])
const overdueApps = ref([])

const onlineCount = computed(() => systems.value.filter(s => s.status === 'online').length)
const offlineCount = computed(() => systems.value.filter(s => s.status === 'offline').length)
const avgResponse = computed(() => {
  if (systems.value.length === 0) return 0
  const total = systems.value.reduce((sum, s) => sum + s.response_time, 0)
  return Math.round(total / systems.value.length)
})
const healthRate = computed(() => {
  if (systems.value.length === 0) return 100
  return Math.round((onlineCount.value / systems.value.length) * 100)
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

const loadData = async () => {
  try {
    const [systemsRes, overdueRes] = await Promise.all([
      adminApi.getSystemHealth(),
      adminApi.getOverdueApplications()
    ])
    systems.value = systemsRes
    overdueApps.value = overdueRes
  } catch (e) {
    ElMessage.error('加载失败')
  }
}

const checkSystem = (row) => {
  ElMessage.success(`正在检测 ${row.system_name}...`)
  setTimeout(() => {
    loadData()
  }, 1000)
}

const handleUrge = (row) => {
  ElMessage.success('已发送督办通知')
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.admin-monitor .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-monitor .page-header h3 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.status-overview {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  border-radius: 8px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 24px;
  color: white;
}

.stat-icon.online {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.offline {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-icon.avg {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.check {
  background: linear-gradient(135deg, #e6a23c, #ebb563);
}

.stat-info .stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
}

.stat-info .stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.monitor-card,
.overdue-card {
  border-radius: 8px;
}

.slow-response {
  color: #e6a23c;
  font-weight: 600;
}

.overdue-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #e6a23c;
  font-weight: 600;
}
</style>
