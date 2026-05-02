<template>
  <div class="closure-page">
    <el-card shadow="never">
      <template #header>
        <div class="page-header">
          <span class="page-title">月末结账</span>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="12">
          <el-card shadow="hover" class="period-card">
            <template #header>
              <div class="card-header">
                <span>当前期间状态</span>
              </div>
            </template>

            <el-descriptions :column="1" border>
              <el-descriptions-item label="会计期间">
                <el-date-picker
                  v-model="selectedPeriod"
                  type="month"
                  placeholder="选择月份"
                  value-format="YYYY-MM"
                  @change="loadPeriodStatus"
                />
              </el-descriptions-item>
              <el-descriptions-item label="期间状态">
                <el-tag :type="periodStatus === 'closed' ? 'success' : 'warning'">
                  {{ periodStatus === 'closed' ? '已结账' : '进行中' }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="结账人">
                {{ periodInfo?.closed_by || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="结账时间">
                {{ periodInfo?.closed_at || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="最近重新打开人">
                {{ periodInfo?.reopened_by || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="重新打开时间">
                {{ periodInfo?.reopened_at || '-' }}
              </el-descriptions-item>
            </el-descriptions>

            <div class="action-buttons" style="margin-top: 20px;">
              <el-button
                v-if="periodStatus !== 'closed'"
                type="primary"
                :loading="actionLoading"
                @click="closePeriod"
              >
                <el-icon><Checked /></el-icon>
                月末结账
              </el-button>
              <el-button
                v-if="periodStatus === 'closed'"
                type="warning"
                :loading="actionLoading"
                @click="unclosePeriod"
              >
                <el-icon><Refresh /></el-icon>
                反结账
              </el-button>
            </div>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>期间凭证状态统计</span>
              </div>
            </template>

            <el-row :gutter="20">
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-value">{{ voucherStats?.draft || 0 }}</div>
                  <div class="stat-label">草稿凭证</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-value">{{ voucherStats?.pending_review || 0 }}</div>
                  <div class="stat-label">待审核</div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 15px;">
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-value">{{ voucherStats?.pending_ledger || 0 }}</div>
                  <div class="stat-label">待生成账簿</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-box">
                  <div class="stat-value">{{ voucherStats?.pending_report || 0 }}</div>
                  <div class="stat-label">待出报表</div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 15px;">
              <el-col :span="12">
                <div class="stat-box success">
                  <div class="stat-value">{{ voucherStats?.closed || 0 }}</div>
                  <div class="stat-label">已完成</div>
                </div>
              </el-col>
              <el-col :span="12">
                <div class="stat-box pending">
                  <div class="stat-value">{{ voucherStats?.pending_closure || 0 }}</div>
                  <div class="stat-label">待结账</div>
                </div>
              </el-col>
            </el-row>

            <el-alert
              v-if="periodStatus !== 'closed' && (voucherStats?.pending_review || voucherStats?.pending_ledger || voucherStats?.pending_report)"
              title="结账提示"
              :description="`当前期间还有 ${(voucherStats?.pending_review || 0) + (voucherStats?.pending_ledger || 0) + (voucherStats?.pending_report || 0)} 个凭证未完成处理流程，请先处理后再结账。`"
              type="warning"
              show-icon
              style="margin-top: 20px;"
            />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="24">
          <el-card shadow="never">
            <template #header>
              <div class="page-header">
                <span>结账/反结账历史</span>
              </div>
            </template>
            <el-empty description="暂无历史记录" />
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import api from '../api'

const loading = ref(false)
const actionLoading = ref(false)
const selectedPeriod = ref(dayjs().format('YYYY-MM'))
const periodInfo = ref({})
const voucherStats = ref({})

const periodStatus = computed(() => {
  return periodInfo.value?.status || 'open'
})

async function loadPeriodStatus() {
  loading.value = true
  try {
    const result = await api.getPeriodStatus(selectedPeriod.value)
    if (result.success) {
      periodInfo.value = result.data
    }

    const statsResult = await api.getDashboardStats({ period: selectedPeriod.value })
    if (statsResult.success) {
      voucherStats.value = statsResult.data.voucherCounts || {}
    }
  } catch (error) {
    console.error('加载期间状态失败:', error)
  } finally {
    loading.value = false
  }
}

async function closePeriod() {
  if (voucherStats.value?.pending_review || voucherStats.value?.pending_ledger || voucherStats.value?.pending_report) {
    ElMessage.warning('当前期间还有凭证未完成处理，请先处理后再结账')
    return
  }

  ElMessageBox.confirm(
    `确认要对 ${selectedPeriod.value} 期间进行月末结账吗？结账后将无法修改该期间的凭证。`,
    '确认结账',
    {
      confirmButtonText: '确认结账',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    actionLoading.value = true
    try {
      const result = await api.closePeriod(selectedPeriod.value)
      if (result.success) {
        ElMessage.success('结账成功')
        loadPeriodStatus()
      } else {
        ElMessage.error(result.error || '结账失败')
      }
    } catch (error) {
      console.error('结账失败:', error)
      ElMessage.error('结账失败')
    } finally {
      actionLoading.value = false
    }
  }).catch(() => {})
}

async function unclosePeriod() {
  ElMessageBox.confirm(
    `确认要对 ${selectedPeriod.value} 期间进行反结账吗？反结账后将可以重新修改该期间的凭证。`,
    '确认反结账',
    {
      confirmButtonText: '确认反结账',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    actionLoading.value = true
    try {
      const result = await api.unclosePeriod(selectedPeriod.value)
      if (result.success) {
        ElMessage.success('反结账成功')
        loadPeriodStatus()
      } else {
        ElMessage.error(result.error || '反结账失败')
      }
    } catch (error) {
      console.error('反结账失败:', error)
      ElMessage.error('反结账失败')
    } finally {
      actionLoading.value = false
    }
  }).catch(() => {})
}

onMounted(() => {
  loadPeriodStatus()
})
</script>

<style scoped>
.period-card {
  min-height: 400px;
}

.card-header {
  font-weight: 600;
}

.action-buttons {
  text-align: center;
}

.stat-box {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
}

.stat-box.success {
  background: #f0f9eb;
}

.stat-box.pending {
  background: #fdf6ec;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}
</style>
