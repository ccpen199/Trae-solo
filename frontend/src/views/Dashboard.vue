<template>
  <div class="dashboard-container">
    <div class="page-header">
      <h1 class="page-title">首页</h1>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon :size="32"><FolderOpened /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.active_projects || 0 }}</div>
              <div class="stat-label">进行中项目</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon :size="32"><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.completed_projects || 0 }}</div>
              <div class="stat-label">已完成项目</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon :size="32"><Wallet /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ formatAmount(stats.total_amount) }}</div>
              <div class="stat-label">累计捐赠金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon :size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.donor_count || 0 }}</div>
              <div class="stat-label">爱心捐赠人数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="card">
          <template #header>
            <div class="card-header">
              <span>最新项目</span>
              <el-button type="primary" link @click="goProjects">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentProjects" style="width: 100%" v-if="recentProjects.length > 0">
            <el-table-column prop="title" label="项目名称" />
            <el-table-column prop="ngo_name" label="执行机构" width="150" />
            <el-table-column label="进度" width="200">
              <template #default="scope">
                <el-progress 
                  :percentage="Math.min(100, Math.round((scope.row.current_amount / scope.row.target_amount) * 100))"
                  :stroke-width="10"
                />
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">
                  {{ getStatusName(scope.row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="primary" link @click="goProjectDetail(scope.row.id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else description="暂无项目数据" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card">
          <template #header>
            <span>快捷入口</span>
          </template>
          <div class="quick-actions">
            <el-card 
              v-if="userRole === 'ngo'"
              class="quick-card"
              shadow="hover"
              @click="goNgoProjects"
            >
              <el-icon :size="32" color="#409EFF"><Plus /></el-icon>
              <div class="quick-label">发布项目</div>
            </el-card>
            <el-card 
              v-if="userRole === 'donor'"
              class="quick-card"
              shadow="hover"
              @click="goProjects"
            >
              <el-icon :size="32" color="#67C23A"><Wallet /></el-icon>
              <div class="quick-label">立即捐赠</div>
            </el-card>
            <el-card 
              v-if="userRole === 'executor'"
              class="quick-card"
              shadow="hover"
              @click="goMyTasks"
            >
              <el-icon :size="32" color="#E6A23C"><Document /></el-icon>
              <div class="quick-label">查看任务</div>
            </el-card>
            <el-card 
              v-if="userRole === 'auditor'"
              class="quick-card"
              shadow="hover"
              @click="goAudits"
            >
              <el-icon :size="32" color="#F56C6C"><Search /></el-icon>
              <div class="quick-label">审计管理</div>
            </el-card>
            <el-card class="quick-card" shadow="hover" @click="goTrack">
              <el-icon :size="32" color="#909399"><Connection /></el-icon>
              <div class="quick-label">溯源查询</div>
            </el-card>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { statsApi, projectApi } from '@/api'
import { 
  FolderOpened, CircleCheck, Wallet, User, Plus, Document, Search, Connection 
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const stats = ref({})
const recentProjects = ref([])

const userRole = computed(() => userStore.user?.role)

const formatAmount = (amount) => {
  if (!amount) return '0.00'
  return amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })
}

const getStatusType = (status) => {
  const types = {
    'pending': 'info',
    'fundraising': 'primary',
    'in_progress': 'warning',
    'completed': 'success'
  }
  return types[status] || 'info'
}

const getStatusName = (status) => {
  const names = {
    'pending': '待审核',
    'fundraising': '募集中',
    'in_progress': '执行中',
    'completed': '已结项'
  }
  return names[status] || status
}

const goProjects = () => router.push('/projects')
const goProjectDetail = (id) => router.push(`/projects/${id}`)
const goNgoProjects = () => router.push('/ngo/projects')
const goMyTasks = () => router.push('/tasks/my')
const goAudits = () => router.push('/audits')
const goTrack = () => router.push('/track')

const fetchStats = async () => {
  try {
    const result = await statsApi.get()
    if (result.success) {
      stats.value = result.stats
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const fetchRecentProjects = async () => {
  try {
    const result = await projectApi.list()
    if (result.success) {
      recentProjects.value = result.projects.slice(0, 5)
    }
  } catch (error) {
    console.error('获取项目列表失败:', error)
  }
}

onMounted(() => {
  fetchStats()
  fetchRecentProjects()
})
</script>

<style scoped>
.stat-card {
  .stat-content {
    display: flex;
    align-items: center;
  }
  
  .stat-icon {
    width: 64px;
    height: 64px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    margin-right: 16px;
  }
  
  .stat-info {
    flex: 1;
  }
  
  .stat-value {
    font-size: 28px;
    font-weight: 600;
    color: #303133;
    line-height: 1;
  }
  
  .stat-label {
    font-size: 14px;
    color: #909399;
    margin-top: 8px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.quick-card {
  text-align: center;
  padding: 20px 10px;
  cursor: pointer;
  
  .quick-label {
    margin-top: 10px;
    font-size: 14px;
    color: #606266;
  }
}
</style>
