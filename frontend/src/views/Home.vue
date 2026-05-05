<template>
  <div class="home-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#409EFF"><User /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalTeachers }}</div>
              <div class="stat-label">教师总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#E6A23C"><Clock /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.probationTeachers }}</div>
              <div class="stat-label">试用期教师</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#67C23A"><CircleCheck /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.regularTeachers }}</div>
              <div class="stat-label">已转正教师</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <el-icon :size="40" color="#F56C6C"><Document /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stats.pendingApprovals }}</div>
              <div class="stat-label">待审批</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>快捷操作</span>
          </template>
          <el-row :gutter="15">
            <el-col :span="8">
              <router-link to="/teacher/entry">
                <div class="quick-action">
                  <el-icon :size="36" color="#409EFF"><UserPlus /></el-icon>
                  <span>教师入职</span>
                </div>
              </router-link>
            </el-col>
            <el-col :span="8">
              <router-link to="/teacher/list">
                <div class="quick-action">
                  <el-icon :size="36" color="#67C23A"><Search /></el-icon>
                  <span>教师查询</span>
                </div>
              </router-link>
            </el-col>
            <el-col :span="8">
              <router-link to="/approval/submit">
                <div class="quick-action">
                  <el-icon :size="36" color="#E6A23C"><Edit /></el-icon>
                  <span>提交审批</span>
                </div>
              </router-link>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>系统信息</span>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="系统名称">教师管理系统</el-descriptions-item>
            <el-descriptions-item label="后端端口">{{ backendInfo?.server?.port || '12261' }}</el-descriptions-item>
            <el-descriptions-item label="数据库状态">
              <el-tag :type="backendInfo?.database?.status === 'connected' ? 'success' : 'danger'">
                {{ backendInfo?.database?.status === 'connected' ? '已连接' : '未连接' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Redis状态">
              <el-tag :type="backendInfo?.redis?.status === 'connected' ? 'success' : 'warning'">
                {{ backendInfo?.redis?.status === 'connected' ? '已连接' : '降级模式' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <span>最近审批</span>
          </template>
          <el-table :data="recentApprovals" v-loading="loadingApprovals" style="width: 100%">
            <el-table-column prop="teacher_name" label="教师姓名" width="120" />
            <el-table-column prop="department_name" label="部门" width="120" />
            <el-table-column prop="type_label" label="审批类型" width="100" />
            <el-table-column prop="progress" label="进度" width="100">
              <template #default="{ row }">
                <el-progress :percentage="(row.current_step / row.total_steps) * 100" :format="() => row.progress" />
              </template>
            </el-table-column>
            <el-table-column prop="status_label" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ row.status_label }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="申请时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <router-link :to="`/approval/detail/${row.id}`">
                  <el-button type="primary" link>查看</el-button>
                </router-link>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/api'

const router = useRouter()

const loading = ref(false)
const loadingApprovals = ref(false)

const backendInfo = ref(null)
const recentApprovals = ref([])

const stats = reactive({
  totalTeachers: 0,
  probationTeachers: 0,
  regularTeachers: 0,
  pendingApprovals: 0
})

const getStatusType = (status) => {
  const map = {
    'pending': 'warning',
    'approved': 'success',
    'rejected': 'danger'
  }
  return map[status] || 'info'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const loadHealth = async () => {
  try {
    const res = await api.get('/health')
    if (res.success) {
      backendInfo.value = res.data
    }
  } catch (error) {
    console.error('加载健康检查失败:', error)
  }
}

const loadTeachers = async () => {
  try {
    const res = await api.get('/teachers', {
      params: { page: 1, page_size: 1000 }
    })
    if (res.success) {
      const list = res.data.list || []
      stats.totalTeachers = list.length
      stats.probationTeachers = list.filter(t => t.status === 'probation').length
      stats.regularTeachers = list.filter(t => t.status === 'regular').length
    }
  } catch (error) {
    console.error('加载教师列表失败:', error)
  }
}

const loadApprovals = async () => {
  loadingApprovals.value = true
  try {
    const res = await api.get('/approvals', {
      params: { page: 1, page_size: 10 }
    })
    if (res.success) {
      recentApprovals.value = res.data.list || []
      stats.pendingApprovals = res.data.list?.filter(a => a.status === 'pending').length || 0
    }
  } catch (error) {
    console.error('加载审批列表失败:', error)
  } finally {
    loadingApprovals.value = false
  }
}

onMounted(() => {
  loadHealth()
  loadTeachers()
  loadApprovals()
})
</script>

<style scoped>
.home-container {
  width: 100%;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 5px;
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  text-decoration: none;
  color: #666;
}

.quick-action:hover {
  background-color: #f5f7fa;
  transform: translateY(-3px);
}

.quick-action span {
  margin-top: 10px;
  font-size: 14px;
}

a {
  text-decoration: none;
}
</style>
