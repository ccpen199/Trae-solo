<template>
  <AdminLayout>
    <div class="dashboard">
      <div class="stats-grid">
        <div v-for="(stat, index) in stats" :key="index" class="stat-card" :style="{ background: stat.color }">
          <div class="stat-icon">
            <el-icon :size="28"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-info">
            <p class="stat-value">{{ stat.value }}</p>
            <p class="stat-label">{{ stat.label }}</p>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h3>近7日办件趋势</h3>
          <div class="chart-placeholder">
            <el-table :data="chartData" border style="width: 100%">
              <el-table-column prop="date" label="日期" width="120" />
              <el-table-column prop="count" label="办件数量" />
              <el-table-column prop="completed" label="已完成" />
            </el-table>
          </div>
        </div>
        <div class="chart-card">
          <h3>各厅局系统健康度</h3>
          <div class="health-list">
            <div v-for="(system, index) in systemHealth" :key="index" class="health-item">
              <div class="health-info">
                <span class="health-name">{{ system.system_name }}</span>
                <span class="health-dept">{{ system.department }}</span>
              </div>
              <div class="health-status">
                <el-tag :type="system.status === 'online' ? 'success' : 'danger'" size="small">
                  {{ system.status === 'online' ? '正常' : '异常' }}
                </el-tag>
                <span class="health-time">{{ system.response_time }}ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="list-card">
        <div class="card-header">
          <h3>待办事项</h3>
          <el-button type="primary" link @click="goToApplications">查看全部</el-button>
        </div>
        <el-table :data="pendingList" border style="width: 100%">
          <el-table-column prop="application_no" label="申请编号" width="180" />
          <el-table-column prop="service_name" label="服务事项" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="提交时间" width="180" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleProcess(row)">处理</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AdminLayout from '@/components/AdminLayout.vue'
import { 
  Document, User, Clock, Warning, 
} from '@element-plus/icons-vue'

const router = useRouter()

const stats = ref([
  { label: '总办件数', value: '1,234', icon: Document, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { label: '待处理', value: '56', icon: Clock, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { label: '待分配工单', value: '23', icon: Warning, color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { label: '注册用户', value: '89,432', icon: User, color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }
])

const chartData = ref([
  { date: '01-09', count: 45, completed: 38 },
  { date: '01-10', count: 52, completed: 48 },
  { date: '01-11', count: 38, completed: 35 },
  { date: '01-12', count: 61, completed: 55 },
  { date: '01-13', count: 55, completed: 52 },
  { date: '01-14', count: 48, completed: 45 },
  { date: '01-15', count: 67, completed: 60 }
])

const systemHealth = ref([
  { system_name: '社保业务系统', department: '省人力资源社会保障厅', status: 'online', response_time: 85 },
  { system_name: '医保信息平台', department: '省医疗保障局', status: 'online', response_time: 92 },
  { system_name: '人口信息管理系统', department: '省公安厅', status: 'online', response_time: 67 },
  { system_name: '不动产登记系统', department: '省自然资源厅', status: 'offline', response_time: 500 },
  { system_name: '统一身份认证平台', department: '省政务服务中心', status: 'online', response_time: 45 }
])

const pendingList = ref([
  { id: 1, application_no: 'APP202401150001', service_name: '社保查询', status: 'pending', created_at: '2024-01-15 10:30:00' },
  { id: 2, application_no: 'APP202401150002', service_name: '医保报销', status: 'processing', created_at: '2024-01-15 09:20:00' },
  { id: 3, application_no: 'APP202401150003', service_name: '新生儿入户', status: 'pending', created_at: '2024-01-15 08:15:00' }
])

const getStatusType = (status) => {
  const types = {
    pending: 'warning',
    processing: 'primary',
    completed: 'success',
    cancelled: 'info'
  }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

const goToApplications = () => {
  router.push('/admin/applications')
}

const handleProcess = (row) => {
  ElMessage.info(`处理申请：${row.application_no}`)
}

onMounted(() => {
  loadDashboardData()
})

const loadDashboardData = async () => {
  try {
  } catch (e) {
  }
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.stat-card {
  padding: 24px;
  border-radius: 12px;
  color: white;
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.charts-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.chart-card, .list-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
}

.chart-card h3, .card-header h3 {
  font-size: 16px;
  color: #333;
  margin-bottom: 20px;
}

.chart-placeholder {
  height: 300px;
}

.health-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.health-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.health-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.health-name {
  font-size: 14px;
  color: #333;
}

.health-dept {
  font-size: 12px;
  color: #999;
}

.health-status {
  display: flex;
  align-items: center;
  gap: 12px;
}

.health-time {
  font-size: 12px;
  color: #666;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

@media (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid {
    grid-template-columns: 1fr;
  }
}
</style>
