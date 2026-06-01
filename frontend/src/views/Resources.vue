<template>
  <div class="resources">
    <el-card class="tabs-card">
      <el-tabs v-model="activeTab" type="border-card" @tab-change="handleTabChange">
        <el-tab-pane label="消防站点" name="stations">
          <template #label>
            <el-icon><OfficeBuilding /></el-icon>
            <span>消防站点</span>
          </template>
          <div class="tab-header">
            <el-input
              v-model="stationSearch"
              placeholder="搜索站点编号/名称"
              clearable
              style="width: 250px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </div>
          <el-table :data="filteredStations" v-loading="loadingStation" border stripe>
            <el-table-column prop="station_code" label="站点编号" width="120" />
            <el-table-column prop="station_name" label="站点名称" width="180" />
            <el-table-column prop="address" label="地址" show-overflow-tooltip />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === '在岗' ? 'success' : 'danger'" size="small">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="capacity" label="容量" width="90" align="center" />
            <el-table-column label="车辆数" width="90" align="center">
              <template #default="{ row }">
                {{ getStationVehicleCount(row.id) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="消防车辆" name="vehicles">
          <template #label>
            <el-icon><Van /></el-icon>
            <span>消防车辆</span>
          </template>
          <div class="stats-row">
            <div class="stat-item stat-success">
              <span class="stat-num">{{ vehicleStats.standby }}</span>
              <span class="stat-text">待命</span>
            </div>
            <div class="stat-item stat-warning">
              <span class="stat-num">{{ vehicleStats.dispatching }}</span>
              <span class="stat-text">出警中</span>
            </div>
            <div class="stat-item stat-danger">
              <span class="stat-num">{{ vehicleStats.maintenance }}</span>
              <span class="stat-text">维修中</span>
            </div>
          </div>
          <div class="tab-header">
            <el-input
              v-model="vehicleSearch"
              placeholder="搜索车牌号/车辆名称"
              clearable
              style="width: 250px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="vehicleStatusFilter" placeholder="状态筛选" clearable style="width: 130px;">
              <el-option label="待命" value="待命" />
              <el-option label="出警中" value="出警中" />
              <el-option label="维修中" value="维修中" />
            </el-select>
          </div>
          <el-table :data="filteredVehicles" v-loading="loadingVehicle" border stripe>
            <el-table-column prop="plate_no" label="车牌号" width="120" />
            <el-table-column label="车辆类型" width="130">
              <template #default="{ row }">
                <el-tag type="primary" size="small">{{ row.vehicle_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="vehicle_name" label="车辆名称" width="150" />
            <el-table-column prop="station_name" label="所属站点" width="160" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === '待命' ? 'success' : row.status === '出警中' ? 'warning' : 'danger'"
                  size="small"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="消防人员" name="firefighters">
          <template #label>
            <el-icon><User /></el-icon>
            <span>消防人员</span>
          </template>
          <div class="stats-row">
            <div class="stat-item stat-success">
              <span class="stat-num">{{ firefighterStats.onDuty }}</span>
              <span class="stat-text">在岗</span>
            </div>
            <div class="stat-item stat-warning">
              <span class="stat-num">{{ firefighterStats.dispatching }}</span>
              <span class="stat-text">出警中</span>
            </div>
            <div class="stat-item stat-info">
              <span class="stat-num">{{ firefighterStats.onLeave }}</span>
              <span class="stat-text">休假</span>
            </div>
          </div>
          <div class="tab-header">
            <el-input
              v-model="firefighterSearch"
              placeholder="搜索工号/姓名"
              clearable
              style="width: 250px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="rankFilter" placeholder="职级筛选" clearable style="width: 130px;">
              <el-option label="中队长" value="中队长" />
              <el-option label="指导员" value="指导员" />
              <el-option label="班长" value="班长" />
              <el-option label="战斗员" value="战斗员" />
              <el-option label="驾驶员" value="驾驶员" />
            </el-select>
          </div>
          <el-table :data="filteredFirefighters" v-loading="loadingFirefighter" border stripe>
            <el-table-column prop="staff_no" label="工号" width="120" />
            <el-table-column prop="name" label="姓名" width="100" />
            <el-table-column label="职级" width="100">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.rank }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="station_name" label="所属站点" width="160" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.status === '在岗' ? 'success' : row.status === '出警中' ? 'warning' : 'info'"
                  size="small"
                >
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="联系电话" width="130" />
            <el-table-column label="出动统计" width="100" align="center">
              <template #default="{ row }">
                {{ getDispatchCount(row.name) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="重点场所" name="keyLocations">
          <template #label>
            <el-icon><LocationFilled /></el-icon>
            <span>重点场所</span>
          </template>
          <div class="tab-header">
            <el-input
              v-model="locationSearch"
              placeholder="搜索场所名称"
              clearable
              style="width: 250px;"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-select v-model="riskLevelFilter" placeholder="风险等级" clearable style="width: 130px;">
              <el-option label="极高" value="极高" />
              <el-option label="高" value="高" />
              <el-option label="中" value="中" />
            </el-select>
          </div>
          <el-table :data="filteredKeyLocations" v-loading="loadingKeyLocation" border stripe>
            <el-table-column prop="location_name" label="场所名称" width="180" />
            <el-table-column prop="address" label="地址" show-overflow-tooltip />
            <el-table-column label="场所类型" width="130">
              <template #default="{ row }">
                <el-tag type="primary" size="small">{{ row.location_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="风险等级" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="row.risk_level === '极高' ? 'danger' : row.risk_level === '高' ? 'warning' : 'info'"
                  size="small"
                  effect="dark"
                >
                  {{ row.risk_level }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="告警次数" width="100" align="center">
              <template #default="{ row }">
                {{ getLocationAlarmCount(row.id) }}
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" show-overflow-tooltip />
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  OfficeBuilding,
  Van,
  User,
  LocationFilled,
  Search
} from '@element-plus/icons-vue'
import {
  getStationList,
  getVehicleList,
  getFirefighterList,
  getKeyLocations,
  getReportSummary,
  getDispatchList
} from '../api/index'

const activeTab = ref('stations')

const loadingStation = ref(false)
const loadingVehicle = ref(false)
const loadingFirefighter = ref(false)
const loadingKeyLocation = ref(false)

const stationList = ref([])
const vehicleList = ref([])
const firefighterList = ref([])
const keyLocationList = ref([])
const dispatchList = ref([])
const highRiskLocations = ref([])

const stationSearch = ref('')
const vehicleSearch = ref('')
const firefighterSearch = ref('')
const locationSearch = ref('')

const vehicleStatusFilter = ref('')
const rankFilter = ref('')
const riskLevelFilter = ref('')

const vehicleStats = computed(() => ({
  standby: vehicleList.value.filter(v => v.status === '待命').length,
  dispatching: vehicleList.value.filter(v => v.status === '出警中').length,
  maintenance: vehicleList.value.filter(v => v.status === '维修中').length
}))

const firefighterStats = computed(() => ({
  onDuty: firefighterList.value.filter(f => f.status === '在岗').length,
  dispatching: firefighterList.value.filter(f => f.status === '出警中').length,
  onLeave: firefighterList.value.filter(f => f.status === '休假').length
}))

const filteredStations = computed(() => {
  const kw = stationSearch.value.trim().toLowerCase()
  if (!kw) return stationList.value
  return stationList.value.filter(s =>
    (s.station_code || '').toLowerCase().includes(kw) ||
    (s.station_name || '').toLowerCase().includes(kw)
  )
})

const filteredVehicles = computed(() => {
  let list = vehicleList.value
  const kw = vehicleSearch.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(v =>
      (v.plate_no || '').toLowerCase().includes(kw) ||
      (v.vehicle_name || '').toLowerCase().includes(kw)
    )
  }
  if (vehicleStatusFilter.value) {
    list = list.filter(v => v.status === vehicleStatusFilter.value)
  }
  return list
})

const filteredFirefighters = computed(() => {
  let list = firefighterList.value
  const kw = firefighterSearch.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(f =>
      (f.staff_no || '').toLowerCase().includes(kw) ||
      (f.name || '').toLowerCase().includes(kw)
    )
  }
  if (rankFilter.value) {
    list = list.filter(f => f.rank === rankFilter.value)
  }
  return list
})

const filteredKeyLocations = computed(() => {
  let list = keyLocationList.value
  const kw = locationSearch.value.trim().toLowerCase()
  if (kw) {
    list = list.filter(l =>
      (l.location_name || '').toLowerCase().includes(kw)
    )
  }
  if (riskLevelFilter.value) {
    list = list.filter(l => l.risk_level === riskLevelFilter.value)
  }
  return list
})

const stationVehicleMap = computed(() => {
  const map = {}
  vehicleList.value.forEach(v => {
    const sid = v.station_id
    if (sid) map[sid] = (map[sid] || 0) + 1
  })
  return map
})

const getStationVehicleCount = (stationId) => stationVehicleMap.value[stationId] || 0

const dispatchCountMap = computed(() => {
  const map = {}
  dispatchList.value.forEach(d => {
    const names = (d.firefighter_names || '').split(',').map(n => n.trim()).filter(Boolean)
    names.forEach(name => {
      map[name] = (map[name] || 0) + 1
    })
  })
  return map
})

const getDispatchCount = (name) => dispatchCountMap.value[name] || 0

const locationAlarmMap = computed(() => {
  const map = {}
  highRiskLocations.value.forEach(loc => {
    map[loc.id] = loc.alarm_count || 0
  })
  return map
})

const getLocationAlarmCount = (locationId) => locationAlarmMap.value[locationId] || 0

const loadStationList = async () => {
  loadingStation.value = true
  try {
    const [res, vehicles] = await Promise.all([
      getStationList(),
      getVehicleList()
    ])
    stationList.value = Array.isArray(res) ? res : []
    vehicleList.value = Array.isArray(vehicles) ? vehicles : []
  } catch {
    ElMessage.error('加载站点列表失败')
  } finally {
    loadingStation.value = false
  }
}

const loadVehicleList = async () => {
  loadingVehicle.value = true
  try {
    const res = await getVehicleList()
    vehicleList.value = Array.isArray(res) ? res : []
  } catch {
    ElMessage.error('加载车辆列表失败')
  } finally {
    loadingVehicle.value = false
  }
}

const loadFirefighterList = async () => {
  loadingFirefighter.value = true
  try {
    const [res, dispatches] = await Promise.all([
      getFirefighterList(),
      getDispatchList()
    ])
    firefighterList.value = Array.isArray(res) ? res : []
    dispatchList.value = Array.isArray(dispatches) ? dispatches : []
  } catch {
    ElMessage.error('加载人员列表失败')
  } finally {
    loadingFirefighter.value = false
  }
}

const loadKeyLocationList = async () => {
  loadingKeyLocation.value = true
  try {
    const [res, summary] = await Promise.all([
      getKeyLocations(),
      getReportSummary()
    ])
    keyLocationList.value = Array.isArray(res) ? res : []
    highRiskLocations.value = summary?.high_risk_locations || []
  } catch {
    ElMessage.error('加载场所列表失败')
  } finally {
    loadingKeyLocation.value = false
  }
}

const handleTabChange = (tab) => {
  if (tab === 'stations') loadStationList()
  else if (tab === 'vehicles') loadVehicleList()
  else if (tab === 'firefighters') loadFirefighterList()
  else if (tab === 'keyLocations') loadKeyLocationList()
}

onMounted(() => {
  loadStationList()
})
</script>

<style scoped>
.resources {
  padding: 20px;
}
.tabs-card {
  border-radius: 8px;
}
.tabs-card :deep(.el-tabs__item) {
  display: flex;
  align-items: center;
  gap: 4px;
}
.tab-header {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  align-items: center;
}
.stats-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
}
.stat-success {
  background: #f0f9eb;
  border: 1px solid #e1f3d8;
}
.stat-warning {
  background: #fdf6ec;
  border: 1px solid #faecd8;
}
.stat-danger {
  background: #fef0f0;
  border: 1px solid #fde2e2;
}
.stat-info {
  background: #f4f4f5;
  border: 1px solid #e9e9eb;
}
.stat-success .stat-num {
  color: #67c23a;
  font-size: 20px;
  font-weight: 600;
}
.stat-warning .stat-num {
  color: #e6a23c;
  font-size: 20px;
  font-weight: 600;
}
.stat-danger .stat-num {
  color: #f56c6c;
  font-size: 20px;
  font-weight: 600;
}
.stat-info .stat-num {
  color: #909399;
  font-size: 20px;
  font-weight: 600;
}
.stat-text {
  color: #606266;
}
</style>
