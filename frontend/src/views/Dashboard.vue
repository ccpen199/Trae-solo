<template>
  <div>
    <div class="page-header">
      <h2>运营概览</h2>
      <el-button type="primary" @click="loadData" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon crew">
              <el-icon><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.crew_count }}</div>
              <div class="stat-label">在职乘务员</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon fleet">
              <el-icon><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.fleet_count }}</div>
              <div class="stat-label">车队数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon train">
              <el-icon><Van /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.train_count }}</div>
              <div class="stat-label">车次配置</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon schedule">
              <el-icon><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ summary.today_schedules }}</div>
              <div class="stat-label">今日排班</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon coverage">
              <el-icon><CircleCheck /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ coverageData.coverage_rate || 0 }}%</div>
              <div class="stat-label">车次覆盖率</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="4">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon change">
              <el-icon><RefreshRight /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ shiftChangeData.total_changes || 0 }}</div>
              <div class="stat-label">本月调班</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="8">
        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>车次覆盖情况</span>
              <el-button type="primary" link size="small" @click="goToScheduling">查看排班 →</el-button>
            </div>
          </template>
          <div class="coverage-stats">
            <div class="coverage-item">
              <div class="coverage-num blue">{{ coverageData.total_trains || 0 }}</div>
              <div class="coverage-label">总车次</div>
            </div>
            <div class="coverage-item">
              <div class="coverage-num green">{{ coverageData.fully_covered || 0 }}</div>
              <div class="coverage-label">完全覆盖</div>
            </div>
            <div class="coverage-item">
              <div class="coverage-num orange">{{ coverageData.partially_covered || 0 }}</div>
              <div class="coverage-label">部分覆盖</div>
            </div>
          </div>
          <div class="coverage-bar">
            <div class="coverage-bar-inner" :style="{ width: coverageData.coverage_rate + '%' }"></div>
          </div>
          <div class="coverage-desc">
            <el-tag v-if="coverageData.coverage_rate >= 100" type="success">全部车次已覆盖</el-tag>
            <el-tag v-else-if="coverageData.coverage_rate >= 80" type="warning">覆盖率较高</el-tag>
            <el-tag v-else type="danger">覆盖率不足，需关注</el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>人员负荷 TOP5</span>
              <el-button type="primary" link size="small" @click="goToReports">查看报表 →</el-button>
            </div>
          </template>
          <el-table :data="workloadTop5" size="small" style="margin-bottom: 10px;">
            <el-table-column prop="name" label="姓名" width="80" />
            <el-table-column prop="position" label="岗位" width="80" />
            <el-table-column prop="total_hours" label="工时" width="80" align="center">
              <template #default="{ row }">
                <span :class="{ 'text-red': row.total_hours > 160 }">
                  {{ row.total_hours?.toFixed(1) || 0 }}h
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="schedule_count" label="次数" width="60" align="center" />
          </el-table>
          <div class="workload-notice">
            <el-icon><InfoFilled /></el-icon>
            <span>月度工时上限 174 小时，连续值乘不超过 6 天</span>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>调班频次统计</span>
              <el-button type="primary" link size="small" @click="goToShiftChanges">查看调班 →</el-button>
            </div>
          </template>
          <div class="shift-summary">
            <div class="shift-total">
              <span class="shift-num">{{ shiftChangeData.total_changes || 0 }}</span>
              <span class="shift-label">本月调班申请</span>
            </div>
          </div>
          <el-divider style="margin: 10px 0;" />
          <div class="shift-list">
            <div v-for="item in shiftChangeData.details || []" :key="item.type + item.status" class="shift-item">
              <span class="shift-type">{{ getChangeTypeText(item.type) }}</span>
              <el-tag :type="getStatusType(item.status)" size="small">{{ getStatusText(item.status) }}</el-tag>
              <span class="shift-count">{{ item.count }} 次</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="12">
        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>待处理调班申请</span>
              <el-tag type="warning" v-if="summary.pending_changes > 0">
                {{ summary.pending_changes }} 条待处理
              </el-tag>
            </div>
          </template>
          <el-empty v-if="pendingChanges.length === 0" description="暂无待处理调班申请" />
          <el-table v-else :data="pendingChanges" size="small">
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getChangeTypeText(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="train_no" label="车次" width="80" />
            <el-table-column prop="schedule_date" label="日期" width="100" />
            <el-table-column prop="original_crew_name" label="原乘务员" width="90" />
            <el-table-column prop="new_crew_name" label="新乘务员" width="90" />
            <el-table-column prop="reason" label="原因" show-overflow-tooltip />
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click="handleApprove(row.id)">
                  批准
                </el-button>
                <el-button size="small" type="danger" link @click="handleReject(row.id)">
                  拒绝
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>人员缺员风险</span>
            </div>
          </template>
          <el-table :data="shortageRisk" size="small">
            <el-table-column prop="position" label="岗位" width="120" />
            <el-table-column prop="total_count" label="总人数" width="70" align="center" />
            <el-table-column prop="available_count" label="可用人数" width="80" align="center">
              <template #default="{ row }">
                <span :class="{ 'text-red': row.available_count < 3 }">
                  {{ row.available_count }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="on_vacation" label="休假中" width="70" align="center" />
            <el-table-column prop="on_training" label="培训中" width="70" align="center" />
            <el-table-column prop="risk_level" label="风险等级" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getRiskType(row.risk_level)" size="small">
                  {{ getRiskText(row.risk_level) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>违规排班预警与复查</span>
              <el-button type="primary" link size="small" @click="goToReports">详细报表 →</el-button>
            </div>
          </template>
          <el-empty v-if="violations.length === 0" description="暂无违规排班记录" />
          <el-table v-else :data="violations" size="small">
            <el-table-column prop="type" label="违规类型" width="180">
              <template #default="{ row }">
                <el-tag type="danger" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="crew_name" label="乘务员" width="100" />
            <el-table-column prop="description" label="违规说明" />
            <el-table-column prop="value" label="数值" width="100" align="center" />
            <el-table-column label="复查操作" width="150" align="center">
              <template #default="{ row }">
                <el-button size="small" type="primary" link @click="reviewViolation(row)">
                  查看详情
                </el-button>
                <el-button size="small" type="warning" link @click="goToShiftChanges">
                  调整排班
                </el-button>
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { reportsAPI, shiftChangesAPI } from '@/api'

const router = useRouter()
const loading = ref(false)

const summary = ref({
  crew_count: 0,
  fleet_count: 0,
  train_count: 0,
  schedule_count: 0,
  pending_changes: 0,
  today_schedules: 0
})

const coverageData = ref({})
const shiftChangeData = ref({})
const pendingChanges = ref([])
const shortageRisk = ref([])
const violations = ref([])
const workloadTop5 = ref([])

const loadData = async () => {
  loading.value = true
  try {
    const [summaryRes, coverageRes, shiftRes, changesRes, riskRes, violationsRes, workloadRes] = await Promise.all([
      reportsAPI.summary(),
      reportsAPI.coverage(),
      reportsAPI.shiftChanges(),
      shiftChangesAPI.list({ status: 'pending' }),
      reportsAPI.shortageRisk(),
      reportsAPI.violations(),
      reportsAPI.workload()
    ])
    
    summary.value = summaryRes.data
    coverageData.value = coverageRes.data
    shiftChangeData.value = shiftRes.data
    pendingChanges.value = changesRes.data.slice(0, 5)
    shortageRisk.value = riskRes.data
    violations.value = violationsRes.data
    workloadTop5.value = (workloadRes.data || []).slice(0, 5)
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const getChangeTypeText = (type) => {
  const types = {
    'swap': '换班',
    'replace': '补班',
    'extra': '临时加开',
    'shortage': '缺员处置'
  }
  return types[type] || type
}

const getStatusType = (status) => {
  const types = { pending: 'warning', approved: 'success', rejected: 'danger' }
  return types[status] || 'info'
}

const getStatusText = (status) => {
  const texts = { pending: '待审批', approved: '已批准', rejected: '已拒绝' }
  return texts[status] || status
}

const getRiskType = (level) => {
  const types = { high: 'danger', medium: 'warning', low: 'success' }
  return types[level] || 'info'
}

const getRiskText = (level) => {
  const texts = { high: '高风险', medium: '中风险', low: '低风险' }
  return texts[level] || level
}

const handleApprove = async (id) => {
  try {
    await ElMessageBox.confirm('确定批准该调班申请吗？', '确认', { type: 'warning' })
    await shiftChangesAPI.approve(id)
    ElMessage.success('调班申请已批准')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const handleReject = async (id) => {
  try {
    await ElMessageBox.confirm('确定拒绝该调班申请吗？', '确认', { type: 'warning' })
    await shiftChangesAPI.reject(id, { reject_reason: '管理员拒绝' })
    ElMessage.success('调班申请已拒绝')
    loadData()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('操作失败')
    }
  }
}

const reviewViolation = (row) => {
  ElMessage.info(`正在查看 ${row.crew_name} 的 ${row.type} 详情`)
}

const goToScheduling = () => router.push('/scheduling')
const goToReports = () => router.push('/reports')
const goToShiftChanges = () => router.push('/shift-changes')

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  flex-shrink: 0;
}

.stat-icon.crew { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
.stat-icon.fleet { background: linear-gradient(135deg, #10b981, #059669); }
.stat-icon.train { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-icon.schedule { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.stat-icon.coverage { background: linear-gradient(135deg, #06b6d4, #0891b2); }
.stat-icon.change { background: linear-gradient(135deg, #ec4899, #be185d); }

.stat-info { flex: 1; min-width: 0; }
.stat-value { font-size: 24px; font-weight: 600; color: #1e293b; }
.stat-label { font-size: 12px; color: #64748b; margin-top: 2px; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.coverage-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 16px;
}

.coverage-item {
  text-align: center;
}

.coverage-num {
  font-size: 28px;
  font-weight: 600;
}

.coverage-num.blue { color: #3b82f6; }
.coverage-num.green { color: #10b981; }
.coverage-num.orange { color: #f59e0b; }

.coverage-label {
  font-size: 12px;
  color: #64748b;
  margin-top: 4px;
}

.coverage-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 12px;
}

.coverage-bar-inner {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #059669);
  border-radius: 4px;
  transition: width 0.3s;
}

.coverage-desc { text-align: center; }

.workload-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fef3c7;
  border-radius: 4px;
  font-size: 12px;
  color: #92400e;
}

.shift-summary {
  text-align: center;
  padding: 10px 0;
}

.shift-num {
  font-size: 36px;
  font-weight: 600;
  color: #8b5cf6;
}

.shift-label {
  font-size: 14px;
  color: #64748b;
  margin-left: 8px;
}

.shift-list {
  max-height: 120px;
  overflow-y: auto;
}

.shift-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px dashed #e5e7eb;
}

.shift-item:last-child {
  border-bottom: none;
}

.shift-type {
  font-size: 13px;
  color: #374151;
}

.shift-count {
  font-size: 13px;
  color: #6b7280;
}

.text-red {
  color: #ef4444;
  font-weight: 600;
}
</style>
