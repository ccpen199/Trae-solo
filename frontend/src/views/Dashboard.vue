<template>
  <div class="dashboard">
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="18">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <span>OEE 综合效率</span>
                <el-tag type="success" style="margin-left: 10px;">实时更新</el-tag>
              </div>
              <div class="header-actions">
                <el-date-picker
                  v-model="dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  size="small"
                  style="margin-right: 10px;"
                />
                <el-button type="primary" size="small" @click="refreshData">
                  <el-icon><Refresh /></el-icon>刷新
                </el-button>
              </div>
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="6">
              <div class="oee-card primary" @click="drillDown('oee')">
                <div class="oee-label">综合 OEE</div>
                <div class="oee-value" :class="getOEEClass(oeeData.oee)">{{ oeeData.oee }}%</div>
                <div class="oee-desc">点击下钻详情</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="oee-card availability" @click="drillDown('availability')">
                <div class="oee-label">可用率</div>
                <div class="oee-value" :class="getOEEClass(oeeData.availability)">{{ oeeData.availability }}%</div>
                <div class="oee-desc">{{ oeeData.planned_production_time - oeeData.unplanned_downtime }} / {{ oeeData.planned_production_time }} 分钟</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="oee-card performance" @click="drillDown('performance')">
                <div class="oee-label">性能率</div>
                <div class="oee-value" :class="getOEEClass(oeeData.performance)">{{ oeeData.performance }}%</div>
                <div class="oee-desc">运行 {{ oeeData.run_time }} 分钟</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="oee-card quality" @click="drillDown('quality')">
                <div class="oee-label">良品率</div>
                <div class="oee-value" :class="getOEEClass(oeeData.quality)">{{ oeeData.quality }}%</div>
                <div class="oee-desc">{{ oeeData.good_quantity }} / {{ oeeData.total_output }} 件</div>
              </div>
            </el-col>
          </el-row>

          <el-divider />

          <el-row :gutter="20">
            <el-col :span="8">
              <div class="time-stat">
                <div class="time-label">计划生产时间</div>
                <div class="time-value">{{ oeeData.planned_production_time }} 分钟</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="time-stat">
                <div class="time-label">实际运行时间</div>
                <div class="time-value success">{{ oeeData.run_time }} 分钟</div>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="time-stat">
                <div class="time-label">非计划停机</div>
                <div class="time-value danger">{{ oeeData.unplanned_downtime }} 分钟</div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <el-col :span="6">
        <el-card>
          <template #header>
            <span>实时设备状态</span>
          </template>
          <div class="device-status-list">
            <div v-for="device in deviceStatusList" :key="device.id" class="device-status-item" @click="viewDeviceDetail(device)">
              <div class="device-indicator" :class="getStatusClass(device.status)"></div>
              <div class="device-info">
                <div class="device-name">
                  <el-tag size="small" type="info" class="code-tag">{{ device.code }}</el-tag>
                  {{ device.name }}
                </div>
                <div class="device-status-text">{{ device.statusText }}</div>
              </div>
              <div class="device-oee" :class="getOEEClass(device.oee)">
                {{ device.oee }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>设备 OEE 排名</span>
              <el-radio-group v-model="rankType" size="small" @change="refreshData">
                <el-radio-button label="oee">OEE</el-radio-button>
                <el-radio-button label="availability">可用率</el-radio-button>
                <el-radio-button label="performance">性能率</el-radio-button>
                <el-radio-button label="quality">良品率</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <el-table :data="sortedOEEByDevice" style="width: 100%" @row-click="viewDeviceOEE">
            <el-table-column label="排名" width="80">
              <template #default="{ $index }">
                <el-tag v-if="$index === 0" type="warning" size="small">🏆 第1</el-tag>
                <el-tag v-else-if="$index === 1" size="small">🥈 第2</el-tag>
                <el-tag v-else-if="$index === 2" type="info" size="small">🥉 第3</el-tag>
                <span v-else>第{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="device_code" label="设备编码" width="100" />
            <el-table-column prop="device_name" label="设备名称" />
            <el-table-column :label="rankType.toUpperCase()" width="120">
              <template #default="{ row }">
                <el-progress
                  :percentage="getRankValue(row)"
                  :color="getProgressColor(getRankValue(row))"
                  :stroke-width="18"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click.stop="viewDeviceOEE(row)">详情</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>停机事件一览</span>
              <el-tag type="danger" v-if="activeDowntimeCount > 0">
                {{ activeDowntimeCount }} 个进行中
              </el-tag>
            </div>
          </template>
          <el-table :data="downtimeEvents" style="width: 100%" max-height="350">
            <el-table-column prop="record_type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getRecordTypeClass(row.record_type)" size="small">{{ row.record_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="设备" width="150">
              <template #default="{ row }">
                <div v-if="row.device">
                  <el-tag size="small" type="info">{{ row.device.code }}</el-tag>
                  <span style="margin-left: 5px; font-size: 12px;">{{ row.device.name }}</span>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="downtime_reason" label="停机原因" />
            <el-table-column prop="duration_minutes" label="时长(分)" width="90">
              <template #default="{ row }">
                <strong :class="{ 'text-danger': row.duration_minutes > 30 }">{{ row.duration_minutes }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="start_time" label="开始时间" width="150">
              <template #default="{ row }">{{ formatTime(row.start_time) }}</template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="detailDialogVisible" :title="detailTitle" width="900px">
      <el-tabs v-model="detailTab" type="card">
        <el-tab-pane label="OEE 数据" name="oee">
          <el-row :gutter="20" style="margin-bottom: 20px;">
            <el-col :span="6">
              <div class="stat-card">
                <div class="label">OEE</div>
                <div class="value" :class="getOEEClass(currentDeviceOEE?.oee_data?.oee || 0)">
                  {{ currentDeviceOEE?.oee_data?.oee || 0 }}%
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="label">可用率</div>
                <div class="value">{{ currentDeviceOEE?.oee_data?.availability || 0 }}%</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="label">性能率</div>
                <div class="value">{{ currentDeviceOEE?.oee_data?.performance || 0 }}%</div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-card">
                <div class="label">良品率</div>
                <div class="value">{{ currentDeviceOEE?.oee_data?.quality || 0 }}%</div>
              </div>
            </el-col>
          </el-row>
        </el-tab-pane>
        <el-tab-pane label="停机记录" name="downtime">
          <el-table :data="deviceDowntimeRecords" style="width: 100%" max-height="300">
            <el-table-column prop="record_type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getRecordTypeClass(row.record_type)" size="small">{{ row.record_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="downtime_reason" label="原因" />
            <el-table-column prop="duration_minutes" label="时长(分)" width="100" />
            <el-table-column prop="start_time" label="时间" width="150">
              <template #default="{ row }">{{ formatTime(row.start_time) }}</template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="goToDevicePage">查看完整记录</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getOEE, getOEEByDevice, getDowntimeEvents } from '../api'

const router = useRouter()
const dateRange = ref([])
const rankType = ref('oee')

const oeeData = ref({
  availability: 0,
  performance: 0,
  quality: 0,
  oee: 0,
  planned_production_time: 0,
  run_time: 0,
  planned_downtime: 0,
  unplanned_downtime: 0,
  total_output: 0,
  good_quantity: 0
})

const oeeByDevice = ref([])
const downtimeEvents = ref([])
const deviceStatusList = ref([])

const detailDialogVisible = ref(false)
const detailTab = ref('oee')
const detailTitle = ref('')
const currentDeviceOEE = ref(null)
const deviceDowntimeRecords = ref([])

let refreshTimer = null

const sortedOEEByDevice = computed(() => {
  return [...oeeByDevice.value].sort((a, b) => {
    const aVal = getRankValue(a)
    const bVal = getRankValue(b)
    return bVal - aVal
  })
})

const activeDowntimeCount = computed(() => {
  return downtimeEvents.value.filter(d => !d.end_time).length
})

const getOEEClass = (value) => {
  if (value >= 85) return 'oee-high'
  if (value >= 60) return 'oee-medium'
  return 'oee-low'
}

const getRecordTypeClass = (type) => {
  const types = { '运行': 'success', '故障停机': 'danger', '计划停机': 'info', '换线': 'warning', '待料': 'warning', '保养': '' }
  return types[type] || 'info'
}

const getStatusClass = (status) => {
  const classes = { running: 'status-running', downtime: 'status-downtime', idle: 'status-idle' }
  return classes[status] || 'status-idle'
}

const getProgressColor = (value) => {
  if (value >= 85) return '#67c23a'
  if (value >= 60) return '#e6a23c'
  return '#f56c6c'
}

const getRankValue = (row) => {
  if (rankType.value === 'oee') return row.oee_data.oee
  if (rankType.value === 'availability') return row.oee_data.availability
  if (rankType.value === 'performance') return row.oee_data.performance
  if (rankType.value === 'quality') return row.oee_data.quality
  return row.oee_data.oee
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const refreshData = async () => {
  try {
    const params = {}
    if (dateRange.value && dateRange.value.length === 2) {
      params.start_date = dateRange.value[0].toISOString()
      params.end_date = dateRange.value[1].toISOString()
    }

    const [oeeRes, deviceRes, downtimeRes] = await Promise.all([
      getOEE(params),
      getOEEByDevice(params),
      getDowntimeEvents(params)
    ])

    oeeData.value = oeeRes.data
    oeeByDevice.value = deviceRes.data
    downtimeEvents.value = downtimeRes.data

    deviceStatusList.value = oeeByDevice.value.slice(0, 5).map(d => ({
      id: d.device_id,
      code: d.device_code,
      name: d.device_name,
      oee: d.oee_data.oee,
      status: d.oee_data.availability > 80 ? 'running' : d.oee_data.availability > 50 ? 'idle' : 'downtime',
      statusText: d.oee_data.availability > 80 ? '运行中' : d.oee_data.availability > 50 ? '闲置' : '停机'
    }))
  } catch (error) {
    console.error('刷新数据失败', error)
  }
}

const drillDown = (type) => {
  ElMessage.info(`下钻查看 ${type} 详情`)
  router.push('/oee-report')
}

const viewDeviceDetail = (device) => {
  detailTitle.value = `${device.name} - 详情`
  viewDeviceOEE({ device_id: device.id })
}

const viewDeviceOEE = async (row) => {
  try {
    const deviceId = row.device_id || row.id
    const [oeeRes, downtimeRes] = await Promise.all([
      getOEE({ device_id: deviceId }),
      getDowntimeEvents({ device_id: deviceId })
    ])

    currentDeviceOEE.value = {
      device_id: deviceId,
      oee_data: oeeRes.data
    }
    deviceDowntimeRecords.value = downtimeRes.data
    detailTitle.value = `${oeeByDevice.value.find(d => d.device_id === deviceId)?.device_name || '设备'} - 详情`
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载设备详情失败')
  }
}

const goToDevicePage = () => {
  detailDialogVisible.value = false
  router.push('/oee-report')
}

onMounted(() => {
  refreshData()
  refreshTimer = setInterval(refreshData, 60000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  align-items: center;
}

.oee-card {
  padding: 25px 15px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.oee-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.oee-card.primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.oee-card.availability { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.oee-card.performance { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.oee-card.quality { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.oee-label {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin-bottom: 10px;
}

.oee-value {
  color: #fff;
  font-size: 36px;
  font-weight: 700;
  margin-bottom: 8px;
}

.oee-desc {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.time-stat {
  text-align: center;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 8px;
}

.time-label {
  color: #909399;
  font-size: 13px;
  margin-bottom: 8px;
}

.time-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.time-value.success { color: #67c23a; }
.time-value.danger { color: #f56c6c; }

.device-status-list {
  max-height: 350px;
  overflow-y: auto;
}

.device-status-item {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.2s;
}

.device-status-item:hover {
  background: #f5f7fa;
  margin: 0 -10px;
  padding: 12px 10px;
}

.device-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 12px;
}

.device-indicator.status-running { background: #67c23a; box-shadow: 0 0 8px #67c23a; }
.device-indicator.status-downtime { background: #f56c6c; }
.device-indicator.status-idle { background: #e6a23c; }

.device-info {
  flex: 1;
}

.device-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.device-status-text {
  font-size: 12px;
  color: #909399;
}

.device-oee {
  font-size: 18px;
  font-weight: 600;
}

.stat-card {
  padding: 20px;
  border-radius: 8px;
  background: #f5f7fa;
  text-align: center;
}

.stat-card .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.stat-card .value {
  font-size: 24px;
  font-weight: 600;
}

.oee-high { color: #67c23a !important; }
.oee-medium { color: #e6a23c !important; }
.oee-low { color: #f56c6c !important; }

.text-danger {
  color: #f56c6c;
}

.code-tag {
  margin-right: 5px;
}
</style>
