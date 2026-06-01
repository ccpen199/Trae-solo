<template>
  <div>
    <div class="page-container">
      <div class="page-header">
        <h2 class="page-title">指挥报表</h2>
        <el-button-group>
          <el-button type="primary" @click="exportBriefing('json')" :icon="Download">导出JSON</el-button>
          <el-button type="success" @click="exportBriefing('csv')" :icon="Download">导出CSV</el-button>
          <el-button type="info" @click="refreshData" :icon="Refresh">刷新</el-button>
        </el-button-group>
      </div>

      <el-row v-if="summary" :gutter="16">
        <el-col :span="6">
          <div class="stat-card danger">
            <div class="stat-value">{{ totalDeaths }}</div>
            <div class="stat-label">遇难人数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card warning">
            <div class="stat-value">{{ totalInjuries }}</div>
            <div class="stat-label">受伤人数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card info">
            <div class="stat-value">{{ totalTrapped }}</div>
            <div class="stat-label">被困人数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card success">
            <div class="stat-value">{{ totalReports }}</div>
            <div class="stat-label">灾情报告</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-row v-if="summary" :gutter="16" style="margin-top: 16px;">
      <el-col :span="12">
        <div class="page-container">
          <h3 class="section-title">按灾情类型统计</h3>
          <el-table :data="summary.disasterStats" size="small">
            <el-table-column prop="report_type" label="类型" width="120">
              <template #default="{ row }">{{ getTypeLabel(row.report_type) }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <span :class="`status-tag status-${row.status}`">{{ getStatusLabel(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="报告数" width="80" />
            <el-table-column prop="total_deaths" label="死亡" width="80" />
            <el-table-column prop="total_injuries" label="受伤" width="80" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-container">
          <h3 class="section-title">按地区灾情统计</h3>
          <el-table :data="summary.byLocation" size="small" max-height="300">
            <el-table-column prop="location" label="地区" min-width="140" />
            <el-table-column prop="report_count" label="报告数" width="80" />
            <el-table-column prop="total_deaths" label="死亡" width="80" />
            <el-table-column prop="total_injuries" label="受伤" width="80" />
            <el-table-column prop="total_buildings_destroyed" label="倒塌房屋" width="100" />
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-row v-if="resources" :gutter="16" style="margin-top: 16px;">
      <el-col :span="8">
        <div class="page-container">
          <h3 class="section-title">救援力量</h3>
          <div class="detail-row">
            <div class="detail-item">
              <span class="detail-label">待命队伍：</span>
              <span class="detail-value">{{ getTeamCount('standby') }} 支</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">待命人员：</span>
              <span class="detail-value">{{ getTeamPersons('standby') }} 人</span>
            </div>
          </div>
          <div class="detail-row">
            <div class="detail-item">
              <span class="detail-label">执行中队伍：</span>
              <span class="detail-value">{{ getTeamCount('assigned') }} 支</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">执行中人员：</span>
              <span class="detail-value">{{ getTeamPersons('assigned') }} 人</span>
            </div>
          </div>
          <el-divider />
          <div class="detail-row">
            <div class="detail-item">
              <span class="detail-label">可用车辆：</span>
              <span class="detail-value">{{ getVehicleCount('available') }} 辆</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">使用中：</span>
              <span class="detail-value">{{ getVehicleCount('in_use') }} 辆</span>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="page-container">
          <h3 class="section-title">任务进度</h3>
          <el-table :data="resources.missions" size="small">
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <span :class="`status-tag status-${row.status}`">{{ getMissionStatus(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="数量" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="8">
        <div class="page-container">
          <h3 class="section-title">物资库存</h3>
          <el-table :data="resources.materials" size="small">
            <el-table-column prop="category" label="分类" width="120">
              <template #default="{ row }">{{ getCategoryLabel(row.category) }}</template>
            </el-table-column>
            <el-table-column prop="item_count" label="种类" />
            <el-table-column prop="total_stock" label="库存总量" />
          </el-table>
        </div>
      </el-col>
    </el-row>

    <el-row v-if="summary" :gutter="16" style="margin-top: 16px;">
      <el-col :span="12">
        <div class="page-container">
          <h3 class="section-title">物资调拨统计</h3>
          <el-table :data="summary.allocationStats" size="small">
            <el-table-column prop="status" label="状态" width="120">
              <template #default="{ row }">
                <span :class="`status-tag status-${row.status}`">{{ getAllocationStatus(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="count" label="单数" />
            <el-table-column prop="total_quantity" label="总量" />
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-container">
          <h3 class="section-title">物资需求统计</h3>
          <el-table :data="summary.materialStats" size="small">
            <el-table-column prop="category" label="分类" width="120">
              <template #default="{ row }">{{ getCategoryLabel(row.category) }}</template>
            </el-table-column>
            <el-table-column prop="demand_count" label="需求单数" />
            <el-table-column prop="total_demand" label="需求总量" />
            <el-table-column prop="total_allocated" label="已调拨" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Download, Refresh } from '@element-plus/icons-vue'
import { api } from '@/api'

const summary = ref(null)
const resources = ref(null)
const briefing = ref(null)

const totalDeaths = ref(0)
const totalInjuries = ref(0)
const totalTrapped = ref(0)
const totalReports = ref(0)

const computeTotals = () => {
  if (!summary.value || !summary.value.disasterStats) return
  totalDeaths.value = summary.value.disasterStats.reduce((s, r) => s + (r.total_deaths || 0), 0)
  totalInjuries.value = summary.value.disasterStats.reduce((s, r) => s + (r.total_injuries || 0), 0)
  totalTrapped.value = summary.value.disasterStats.reduce((s, r) => s + (r.total_trapped || 0), 0)
  totalReports.value = summary.value.disasterStats.reduce((s, r) => s + (r.count || 0), 0)
}

const getTypeLabel = (t) => ({ casualty: '人员伤亡', building: '建筑损毁', road: '道路中断', communication: '通信故障', comprehensive: '综合灾情' }[t] || t)
const getStatusLabel = (s) => ({ pending: '待处理', processing: '处理中', completed: '已完成', cancelled: '已取消' }[s] || s)
const getMissionStatus = (s) => ({ assigned: '已指派', departed: '已出发', arrived: '已到达', completed: '已完成', cancelled: '已取消' }[s] || s)
const getAllocationStatus = (s) => ({ dispatched: '已出库', transit: '运输中', delivered: '已送达', signed: '已签收', cancelled: '已取消' }[s] || s)
const getCategoryLabel = (c) => ({ food: '食品水饮', medical: '医疗用品', shelter: '帐篷衣物', equipment: '救援设备', communication: '通讯设备', other: '其他' }[c] || c)

const getTeamCount = (status) => {
  if (!resources.value || !resources.value.teams) return 0
  const item = resources.value.teams.find(t => t.status === status)
  return item ? item.team_count : 0
}

const getTeamPersons = (status) => {
  if (!resources.value || !resources.value.teams) return 0
  const item = resources.value.teams.find(t => t.status === status)
  return item ? item.person_count : 0
}

const getVehicleCount = (status) => {
  if (!resources.value || !resources.value.vehicles) return 0
  const item = resources.value.vehicles.find(v => v.status === status)
  return item ? item.count : 0
}

const loadData = async () => {
  try {
    const [s, r] = await Promise.all([
      api.reports.summary(),
      api.reports.resources()
    ])
    summary.value = s
    resources.value = r
    computeTotals()
  } catch (err) {
    console.error('加载报表数据失败:', err)
  }
}

const refreshData = () => {
  loadData()
  ElMessage.success('数据已刷新')
}

const exportBriefing = async (format) => {
  try {
    const res = await api.reports.briefing(format)
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `briefing_${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('JSON导出成功')
    } else {
      ElMessage.success('CSV导出已触发')
    }
  } catch (err) {
    console.error('导出失败:', err)
  }
}

onMounted(() => {
  loadData()
})
</script>
