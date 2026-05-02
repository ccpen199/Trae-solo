<template>
  <div class="dashboard-page">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409eff;">
            <el-icon :size="30"><Edit /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.voucherCounts?.draft || 0 }}</div>
            <div class="stat-label">草稿凭证</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6a23c;">
            <el-icon :size="30"><View /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.voucherCounts?.pending_review || 0 }}</div>
            <div class="stat-label">待审核</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67c23a;">
            <el-icon :size="30"><DocumentChecked /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.voucherCounts?.closed || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f56c6c;">
            <el-icon :size="30"><Bell /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.pendingCount || 0 }}</div>
            <div class="stat-label">我的待办</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col :span="6">
              <el-card class="action-card" shadow="hover" @click="$router.push('/vouchers/create')">
                <el-icon :size="40" color="#409eff"><DocumentAdd /></el-icon>
                <div class="action-text">新建凭证</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="action-card" shadow="hover" @click="$router.push('/vouchers')">
                <el-icon :size="40" color="#67c23a"><Tickets /></el-icon>
                <div class="action-text">凭证列表</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="action-card" shadow="hover" @click="$router.push('/reports')">
                <el-icon :size="40" color="#e6a23c"><DataAnalysis /></el-icon>
                <div class="action-text">查看报表</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card class="action-card" shadow="hover" @click="$router.push('/closure')">
                <el-icon :size="40" color="#f56c6c"><Checked /></el-icon>
                <div class="action-text">月末结账</div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>当前期间状态</span>
            </div>
          </template>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="当前期间">
              {{ currentPeriod }}
            </el-descriptions-item>
            <el-descriptions-item label="期间状态">
              <el-tag :type="periodStatus.status === 'closed' ? 'success' : 'warning'">
                {{ periodStatus.status === 'closed' ? '已结账' : '进行中' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="结账人">
              {{ periodStatus.closed_by || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="结账时间">
              {{ periodStatus.closed_at || '-' }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span>最近凭证</span>
              <el-button type="primary" link @click="$router.push('/vouchers')">查看全部</el-button>
            </div>
          </template>
          <el-table :data="recentVouchers" v-loading="loading" style="width: 100%;">
            <el-table-column prop="voucher_no" label="凭证编号" width="180" />
            <el-table-column prop="voucher_type" label="凭证类型" width="120" />
            <el-table-column prop="voucher_date" label="凭证日期" width="120" />
            <el-table-column prop="creator_name" label="创建人" width="100" />
            <el-table-column prop="total_debit" label="借方总额" width="120">
              <template #default="{ row }">
                ¥{{ row.total_debit?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <span :class="['status-tag', `status-${row.status}`]">
                  {{ row.statusLabel }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button type="primary" link @click="viewVoucher(row.id)">查看</el-button>
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
import dayjs from 'dayjs'
import api from '../api'

const router = useRouter()

const loading = ref(false)
const stats = ref({
  pendingCount: 0,
  voucherCounts: {}
})
const recentVouchers = ref([])
const currentPeriod = ref(dayjs().format('YYYY-MM'))
const periodStatus = ref({
  status: 'open'
})

async function loadData() {
  loading.value = true
  try {
    const statsResult = await api.getDashboardStats({ period: currentPeriod.value })
    if (statsResult.success) {
      stats.value = statsResult.data
    }

    const voucherResult = await api.getVouchers({ limit: 10 })
    if (voucherResult.success) {
      recentVouchers.value = voucherResult.data
    }

    const periodResult = await api.getPeriodStatus(currentPeriod.value)
    if (periodResult.success) {
      periodStatus.value = periodResult.data
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

function viewVoucher(id) {
  router.push(`/vouchers/${id}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: center;
  padding: 10px;
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

.stat-content {
  margin-left: 15px;
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.action-card {
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.action-card:hover {
  transform: translateY(-3px);
}

.action-text {
  margin-top: 10px;
  font-size: 14px;
  color: #606266;
}
</style>
