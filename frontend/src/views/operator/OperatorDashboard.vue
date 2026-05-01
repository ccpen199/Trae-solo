<template>
  <div class="operator-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-warning">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.suspectedCount }}</div>
              <div class="stat-label">待处理风控</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-checked">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.confirmedCount }}</div>
              <div class="stat-label">已确认违规</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-cleared">
              <el-icon><CircleCheckFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.clearedCount }}</div>
              <div class="stat-label">已排除嫌疑</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon icon-blocked">
              <el-icon><Lock /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.blockedCount }}</div>
              <div class="stat-label">已冻结账号</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>风控监控列表</span>
          <el-select v-model="statusFilter" placeholder="状态筛选" clearable style="width: 150px; margin-right: 12px">
            <el-option label="待处理" value="SUSPECTED" />
            <el-option label="已确认" value="CONFIRMED" />
            <el-option label="已排除" value="CLEARED" />
          </el-select>
          <el-button type="primary" @click="fetchDetections">刷新</el-button>
        </div>
      </template>

      <el-table :data="detections" style="width: 100%" v-loading="loading">
        <el-table-column prop="detectionNo" label="检测单号" width="200" />
        <el-table-column label="嫌疑用户" width="180">
          <template #default="{ row }">
            <div v-if="row.suspectUserId">
              <div>{{ row.suspectPhone || '未知' }}</div>
              <div class="sub-text">用户ID: {{ row.suspectUserId }}</div>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="detectionType" label="检测类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getDetectionTypeTag(row.detectionType)" size="small">
              {{ getDetectionTypeText(row.detectionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="riskScore" label="风险分数" width="100">
          <template #default="{ row }">
            <el-progress
              :percentage="row.riskScore"
              :color="getRiskColor(row.riskScore)"
              :stroke-width="12"
            />
          </template>
        </el-table-column>
        <el-table-column label="嫌疑信息">
          <template #default="{ row }">
            <div class="detail-info">
              <span v-if="row.suspectIp">IP: {{ row.suspectIp }}</span>
              <span v-if="row.suspectDevice">设备: {{ row.suspectDevice }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="检测时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right" v-if="statusFilter === 'SUSPECTED' || !statusFilter">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="clearDetection(row)">排除嫌疑</el-button>
            <el-button type="warning" size="small" @click="suspendUser(row)">暂停分销</el-button>
            <el-button type="danger" size="small" @click="terminateUser(row)">终止资格</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Warning,
  CircleCheck,
  CircleCheckFilled,
  Lock,
} from '@element-plus/icons-vue'

const loading = ref(false)
const statusFilter = ref<string>('')

const stats = reactive({
  suspectedCount: 0,
  confirmedCount: 0,
  clearedCount: 0,
  blockedCount: 0,
})

const detections = ref<any[]>([
  {
    id: '1',
    detectionNo: 'FD2024042812345678',
    suspectUserId: 'user-001',
    suspectPhone: '13900139001',
    suspectIp: '192.168.1.100',
    suspectDevice: 'device-001',
    detectionType: 'IP_CLUSTER',
    riskScore: 85,
    status: 'SUSPECTED',
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    detectionNo: 'FD2024042812345679',
    suspectUserId: 'user-002',
    suspectPhone: '13900139002',
    suspectIp: '192.168.1.101',
    detectionType: 'ABNORMAL_ORDER',
    riskScore: 60,
    status: 'SUSPECTED',
    createdAt: new Date().toISOString(),
  },
])

function formatDate(date: string | Date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('zh-CN')
}

function getDetectionTypeTag(type: string) {
  const map: Record<string, string> = {
    IP_CLUSTER: 'danger',
    DEVICE_CLUSTER: 'danger',
    ABNORMAL_ORDER: 'warning',
    ABNORMAL_WITHDRAW: 'warning',
    REFERRAL_LOOP: 'danger',
  }
  return map[type] || 'info'
}

function getDetectionTypeText(type: string) {
  const map: Record<string, string> = {
    IP_CLUSTER: 'IP聚集',
    DEVICE_CLUSTER: '设备聚集',
    ABNORMAL_ORDER: '异常下单',
    ABNORMAL_WITHDRAW: '异常提现',
    REFERRAL_LOOP: '推荐闭环',
  }
  return map[type] || type
}

function getRiskColor(score: number) {
  if (score >= 80) return '#f56c6c'
  if (score >= 50) return '#e6a23c'
  return '#67c23a'
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    SUSPECTED: 'warning',
    CONFIRMED: 'danger',
    CLEARED: 'success',
    APPEALED: 'info',
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    SUSPECTED: '待处理',
    CONFIRMED: '已确认',
    CLEARED: '已排除',
    APPEALED: '已申诉',
  }
  return map[status] || status
}

async function fetchDetections() {
  loading.value = true
  try {
    stats.suspectedCount = detections.value.filter(d => d.status === 'SUSPECTED').length
    stats.confirmedCount = detections.value.filter(d => d.status === 'CONFIRMED').length
  } catch (e) {
    console.error('获取风控数据失败', e)
  } finally {
    loading.value = false
  }
}

async function clearDetection(row: any) {
  try {
    await ElMessageBox.confirm('确定排除该用户的嫌疑吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    row.status = 'CLEARED'
    ElMessage.success('已排除嫌疑')
    fetchDetections()
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('操作失败', e)
    }
  }
}

async function suspendUser(row: any) {
  try {
    await ElMessageBox.confirm('确定暂停该用户的分销资格吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    row.status = 'CONFIRMED'
    ElMessage.success('已暂停分销资格')
    fetchDetections()
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('操作失败', e)
    }
  }
}

async function terminateUser(row: any) {
  try {
    await ElMessageBox.confirm('确定终止该用户的分销资格吗？此操作不可恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
    })
    row.status = 'CONFIRMED'
    stats.blockedCount++
    ElMessage.success('已终止分销资格')
    fetchDetections()
  } catch (e: any) {
    if (e !== 'cancel') {
      console.error('操作失败', e)
    }
  }
}

onMounted(() => {
  fetchDetections()
})
</script>

<style scoped>
.operator-container {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: #fff;
}

.icon-warning {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.icon-checked {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.icon-cleared {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.icon-blocked {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-info {
  margin-left: 16px;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sub-text {
  font-size: 12px;
  color: #909399;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
  color: #606266;
}
</style>
