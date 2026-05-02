<template>
  <div class="dashboard">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="28"><Timer /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.myPending }}</div>
              <div class="stat-label">我的待办</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="28"><DocumentChecked /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.myCreatedActive }}</div>
              <div class="stat-label">我创建的进行中</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="28"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.today?.total || 0 }}</div>
              <div class="stat-label">今日新建</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="28"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.today?.failed || 0 }}</div>
              <div class="stat-label">今日失败</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="goToCreate">
              <el-icon><Plus /></el-icon>
              新建流水线单
            </el-button>
            <el-button size="large" @click="goToOrders">
              <el-icon><List /></el-icon>
              查看主单列表
            </el-button>
            <el-button size="large" @click="goToKanban">
              <el-icon><Menu /></el-icon>
              流程看板
            </el-button>
            <el-button size="large" @click="goToPipelines">
              <el-icon><Connection /></el-icon>
              流水线管理
            </el-button>
          </div>
        </el-card>

        <el-card style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>状态分布</span>
            </div>
          </template>
          <div class="status-list">
            <div 
              v-for="item in stats.byStatus" 
              :key="item.status" 
              class="status-item"
              @click="filterByStatus(item.status)"
            >
              <el-tag :class="`status-tag-${item.status}`" size="large">
                {{ item.status_text }}
              </el-tag>
              <span class="status-count">{{ item.count }} 单</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>最近待办</span>
              <el-button type="primary" link @click="goToOrders">查看全部</el-button>
            </div>
          </template>
          <div class="recent-list">
            <el-empty v-if="recentOrders.length === 0" description="暂无待办" />
            <div v-else class="recent-item" v-for="item in recentOrders" :key="item.id" @click="viewDetail(item.id)">
              <div class="recent-title">{{ item.title }}</div>
              <div class="recent-meta">
                <el-tag :class="`status-tag-${item.status}`" size="small">
                  {{ item.status_text }}
                </el-tag>
                <span class="recent-time">{{ formatTime(item.created_at) }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getDashboardStats, getOrders } from '@/utils/api'
import { Timer, DocumentChecked, Calendar, Warning, Plus, List, Menu, Connection } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()

const stats = ref({
  myPending: 0,
  myCreatedActive: 0,
  today: { total: 0, failed: 0 },
  byStatus: []
})

const recentOrders = ref([])

const formatTime = (time) => {
  return dayjs(time).format('MM-DD HH:mm')
}

const goToCreate = () => {
  router.push('/orders/create')
}

const goToOrders = () => {
  router.push('/orders')
}

const goToKanban = () => {
  router.push('/kanban')
}

const goToPipelines = () => {
  router.push('/pipelines')
}

const viewDetail = (id) => {
  router.push(`/orders/${id}`)
}

const filterByStatus = (status) => {
  router.push({ path: '/orders', query: { status } })
}

onMounted(async () => {
  try {
    const statsRes = await getDashboardStats()
    if (statsRes.success) {
      stats.value = statsRes.data
    }

    const ordersRes = await getOrders({ pageSize: 5 })
    if (ordersRes.success) {
      recentOrders.value = ordersRes.data.list
    }
  } catch (e) {
    console.error('获取数据失败', e)
  }
})
</script>

<style scoped>
.dashboard {
  min-height: 100%;
}

.stat-card {
  cursor: pointer;
  transition: transform 0.3s;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
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
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.status-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s;
}

.status-item:hover {
  background: #e9edf2;
}

.status-count {
  font-weight: bold;
  color: #333;
}

.recent-list {
  max-height: 400px;
  overflow-y: auto;
}

.recent-item {
  padding: 12px 0;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.3s;
}

.recent-item:hover {
  background: #f5f7fa;
  margin: 0 -10px;
  padding-left: 10px;
  padding-right: 10px;
  border-radius: 4px;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-title {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.recent-time {
  font-size: 12px;
  color: #999;
}
</style>
