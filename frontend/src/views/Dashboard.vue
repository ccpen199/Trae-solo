<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #409eff">
              <el-icon :size="30"><Document /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalTasks }}</div>
              <div class="stat-label">总任务数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #e6a23c">
              <el-icon :size="30"><Clock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingAudit }}</div>
              <div class="stat-label">待审核数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #67c23a">
              <el-icon :size="30"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.approved }}</div>
              <div class="stat-label">已通过数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon" style="background-color: #909399">
              <el-icon :size="30"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.dealers }}</div>
              <div class="stat-label">经销商数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>最新任务</span>
          </template>
          <el-table :data="recentTasks" style="width: 100%" size="small">
            <el-table-column prop="name" label="任务名称" min-width="150" />
            <el-table-column prop="task_type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag :type="row.task_type === 'A' ? 'primary' : 'success'" size="small">
                  {{ row.task_type === 'A' ? 'A类' : 'B类' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="status_text" label="状态" width="100">
              <template #default="{ row }">
                <span :class="`status-${row.status}`">{{ row.status_text }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="150">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>待审核记录</span>
          </template>
          <el-table :data="pendingAudits" style="width: 100%" size="small">
            <el-table-column prop="dealer_name" label="经销商" min-width="120" />
            <el-table-column prop="task_name" label="任务名称" min-width="150" />
            <el-table-column prop="actual_hours" label="执行课时" width="80">
              <template #default="{ row }">
                {{ row.actual_hours }} / {{ row.required_hours }}
              </template>
            </el-table-column>
            <el-table-column prop="submitted_at" label="提交时间" width="150">
              <template #default="{ row }">
                {{ formatDate(row.submitted_at) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <el-row :gutter="20">
            <el-col :span="4">
              <el-button type="primary" size="large" style="width: 100%" @click="goToCreateTask">
                <el-icon><Plus /></el-icon>
                <span style="margin-left: 5px">新建A类任务</span>
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button type="success" size="large" style="width: 100%" @click="goToTaskList">
                <el-icon><List /></el-icon>
                <span style="margin-left: 5px">任务管理</span>
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button type="warning" size="large" style="width: 100%" @click="goToAuditList">
                <el-icon><EditPen /></el-icon>
                <span style="margin-left: 5px">审核管理</span>
              </el-button>
            </el-col>
            <el-col :span="4">
              <el-button type="info" size="large" style="width: 100%" @click="goToExecutionList">
                <el-icon><CircleCheck /></el-icon>
                <span style="margin-left: 5px">执行列表</span>
              </el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { tasksApi, auditApi, dealersApi } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()

const stats = ref({
  totalTasks: 0,
  pendingAudit: 0,
  approved: 0,
  dealers: 0
})

const recentTasks = ref([])
const pendingAudits = ref([])

const formatDate = (date) => {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
}

const loadStats = async () => {
  try {
    const [tasksRes, auditRes, dealersRes] = await Promise.all([
      tasksApi.getList({}),
      auditApi.getList({ status: 'pending' }),
      dealersApi.getList({})
    ])

    if (tasksRes.data?.success) {
      stats.value.totalTasks = tasksRes.data.data.length
      const approvedTasks = tasksRes.data.data.filter(t => t.status === 'approved')
      stats.value.approved = approvedTasks.length
      recentTasks.value = tasksRes.data.data.slice(0, 5)
    }

    if (auditRes.data?.success) {
      stats.value.pendingAudit = auditRes.data.data.length
      pendingAudits.value = auditRes.data.data.slice(0, 5)
    }

    if (dealersRes.data?.success) {
      stats.value.dealers = dealersRes.data.data.length
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

const goToCreateTask = () => router.push('/factory/tasks/create')
const goToTaskList = () => router.push('/factory/tasks')
const goToAuditList = () => router.push('/factory/audit')
const goToExecutionList = () => router.push('/dealer/execution')

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.stat-card {
  cursor: pointer;
}

.stat-card:hover {
  transform: translateY(-5px);
  transition: all 0.3s;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
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
  margin-top: 5px;
}
</style>
