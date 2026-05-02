<template>
  <div class="reports-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon supplier">
            <el-icon><Document /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardData.total_orders || 0 }}</div>
            <div class="stat-label">总订单数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon core">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardData.pending_orders || 0 }}</div>
            <div class="stat-label">待处理订单</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon finance">
            <el-icon><Money /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">¥{{ dashboardData.total_amount || 0 }}</div>
            <div class="stat-label">总金额</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon risk">
            <el-icon><Bell /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ dashboardData.locked_orders || 0 }}</div>
            <div class="stat-label">锁定订单</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card style="margin-top: 20px">
      <template #header>状态分布</template>
      <el-table :data="statusStats" border>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type || 'info'">
              {{ statusMap[row.status]?.label || row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="count" label="数量" />
        <el-table-column prop="total_amount" label="金额">
          <template #default="{ row }">
            ¥{{ Number(row.total_amount || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <el-card style="margin-top: 20px">
      <template #header>审计日志</template>
      <el-table :data="auditLogs" border v-loading="loading">
        <el-table-column prop="order_no" label="订单号" width="200" />
        <el-table-column prop="action" label="操作" width="140">
          <template #default="{ row }">
            {{ actionMap[row.action] || row.action }}
          </template>
        </el-table-column>
        <el-table-column prop="from_status" label="原状态" width="160">
          <template #default="{ row }">
            {{ statusMap[row.from_status]?.label || row.from_status || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="to_status" label="目标状态" width="160">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.to_status]?.type || 'info'" size="small">
              {{ statusMap[row.to_status]?.label || row.to_status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" min-width="200" />
        <el-table-column prop="user_name" label="操作人" width="120" />
        <el-table-column prop="created_at" label="时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { statusMap, actionMap } from '@/api'
import * as api from '@/api'

const dashboardData = ref({})
const statusStats = ref([])
const auditLogs = ref([])
const loading = ref(false)

const fetchDashboard = async () => {
  try {
    dashboardData.value = await api.getDashboard()
    statusStats.value = Object.entries(dashboardData.value.status_counts || {}).map(
      ([status, data]: [string, any]) => ({
        status,
        count: data.count,
        total_amount: data.total_amount
      })
    )
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
  }
}

const fetchAuditLogs = async () => {
  loading.value = true
  try {
    const result = await api.getAuditLogs()
    auditLogs.value = result.logs || []
  } catch (error) {
    console.error('获取审计日志失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboard()
  fetchAuditLogs()
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 10px 0;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #fff;
}

.stat-icon.supplier {
  background: #409eff;
}

.stat-icon.core {
  background: #67c23a;
}

.stat-icon.finance {
  background: #e6a23c;
}

.stat-icon.risk {
  background: #f56c6c;
}

.stat-info {
  margin-left: 16px;
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
</style>
