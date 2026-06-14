<template>
  <div class="admin-stats">
    <h3>数据概览</h3>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409eff">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.tasks?.total || 0 }}</div>
            <div class="stat-label">总任务数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6a23c">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.tasks?.pending || 0 }}</div>
            <div class="stat-label">待接单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67c23a">
            <el-icon><CircleCheck /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.tasks?.completed || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f56c6c">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.exceptions?.open || 0 }}</div>
            <div class="stat-label">异常工单</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>用户统计</span>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="委托人总数">{{ stats?.users?.total || 0 }}</el-descriptions-item>
            <el-descriptions-item label="骑手总数">{{ stats?.users?.couriers?.total || 0 }}</el-descriptions-item>
            <el-descriptions-item label="审核通过骑手">{{ stats?.users?.couriers?.approved || 0 }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>待处理事项</span>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="待审核骑手">
              <el-tag type="warning">{{ pendingCouriers }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="待仲裁纠纷">
              <el-tag type="danger">{{ stats?.disputes?.pending || 0 }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="待处理异常">
              <el-tag type="danger">{{ stats?.exceptions?.open || 0 }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <span>今日数据</span>
          </template>
          <el-descriptions :column="1" border size="small">
            <el-descriptions-item label="今日任务">{{ stats?.today?.tasks || 0 }}</el-descriptions-item>
            <el-descriptions-item label="今日营收">¥{{ stats?.today?.revenue || 0 }}</el-descriptions-item>
            <el-descriptions-item label="进行中任务">{{ stats?.tasks?.active || 0 }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="quick-actions">
            <el-button type="primary" @click="$router.push('/admin/couriers')">
              <el-icon><User /></el-icon>
              骑手审核
            </el-button>
            <el-button type="success" @click="$router.push('/admin/zones')">
              <el-icon><Location /></el-icon>
              运营区配置
            </el-button>
            <el-button type="warning" @click="$router.push('/admin/restricted-items')">
              <el-icon><Warning /></el-icon>
              禁运词管理
            </el-button>
            <el-button type="danger" @click="$router.push('/admin/disputes')">
              <el-icon><ScaleToOriginal /></el-icon>
              纠纷仲裁
            </el-button>
            <el-button type="info" @click="$router.push('/admin/audit')">
              <el-icon><Document /></el-icon>
              审计日志
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/modules'

const stats = ref(null)
const pendingCouriers = ref(0)

const loadStats = async () => {
  try {
    const res = await adminApi.stats()
    if (res.success) {
      stats.value = res.stats
    }

    const courierRes = await adminApi.couriers.list({ status: 'pending' })
    if (courierRes.success) {
      pendingCouriers.value = courierRes.couriers.length
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.admin-stats {
  padding: 0;
}

.admin-stats h3 {
  margin: 0 0 20px;
  color: #303133;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quick-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
