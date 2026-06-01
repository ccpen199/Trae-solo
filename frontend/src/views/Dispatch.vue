<template>
  <div class="dispatch">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="list-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">警情列表</span>
              <div class="header-actions">
                <el-radio-group v-model="statusFilter" size="small" @change="handleFilterChange">
                  <el-radio-button value="待研判">待研判</el-radio-button>
                  <el-radio-button value="处置中">处置中</el-radio-button>
                </el-radio-group>
                <el-button type="primary" size="small" @click="loadAlarmList">
                  <el-icon><Refresh /></el-icon>
                  刷新
                </el-button>
              </div>
            </div>
          </template>
          <el-table
            :data="alarmList"
            v-loading="loadingList"
            stripe
            highlight-current-row
            @current-change="handleAlarmSelect"
            max-height="620"
            style="width: 100%"
          >
            <el-table-column prop="alarm_no" label="警情编号" width="130" />
            <el-table-column prop="disaster_type" label="灾害类型" width="90">
              <template #default="{ row }">
                <el-tag :type="getTypeTag(row.disaster_type)" size="small">{{ row.disaster_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="disaster_level" label="等级" width="70">
              <template #default="{ row }">
                <el-tag :type="getLevelTag(row.disaster_level)" size="small" effect="dark">{{ row.disaster_level }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="location" label="地点" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusTag(row.status)" size="small">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-if="alarmTotal > 0"
            class="pagination"
            background
            layout="total, prev, pager, next"
            :total="alarmTotal"
            :page-size="alarmPageSize"
            :current-page="alarmPage"
            @current-change="handlePageChange"
          />
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-card class="detail-card" v-loading="loadingDetail">
              <template #header>
                <div class="card-header">
                  <span class="card-title">警情详情</span>
                  <el-tag v-if="selectedAlarm" :type="getStatusTag(selectedAlarm.status)">{{ selectedAlarm.status }}</el-tag>
                </div>
              </template>
              <div v-if="selectedAlarm" class="detail-content">
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="警情编号">{{ selectedAlarm.alarm_no }}</el-descriptions-item>
                  <el-descriptions-item label="灾害类型">
                    <el-tag :type="getTypeTag(selectedAlarm.disaster_type)" size="small">{{ selectedAlarm.disaster_type }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="灾害等级">
                    <el-tag :type="getLevelTag(selectedAlarm.disaster_level)" size="small" effect="dark">{{ selectedAlarm.disaster_level }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="当前状态">
                    <el-tag :type="getStatusTag(selectedAlarm.status)" size="small">{{ selectedAlarm.status }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="发生地点" :span="2">{{ selectedAlarm.location }}</el-descriptions-item>
                  <el-descriptions-item label="报警人">{{ selectedAlarm.caller_name }}</el-descriptions-item>
                  <el-descriptions-item label="联系电话">{{ selectedAlarm.caller_phone }}</el-descriptions-item>
                  <el-descriptions-item label="被困人数">{{ selectedAlarm.people_trapped }}</el-descriptions-item>
                  <el-descriptions-item label="建筑类型">{{ selectedAlarm.building_type }}</el-descriptions-item>
                  <el-descriptions-item label="危险物品" :span="2">{{ selectedAlarm.hazardous_materials || '无' }}</el-descriptions-item>
                  <el-descriptions-item label="备注" :span="2">{{ selectedAlarm.notes || '无' }}</el-descriptions-item>
                  <el-descriptions-item label="接警员">{{ selectedAlarm.receiver }}</el-descriptions-item>
                  <el-descriptions-item label="报警时间">{{ selectedAlarm.alarm_time }}</el-descriptions-item>
                </el-descriptions>
              </div>
              <el-empty v-else description="请选择一条警情查看详情" />
            </el-card>
          </el-col>

          <el-col :span="24" style="margin-top: 20px;">
            <el-card class="recommend-card">
              <template #header>
                <div class="card-header">
                  <span class="card-title">力量调度</span>
                  <el-button
                    v-if="selectedAlarm && selectedAlarm.status === '待研判'"
                    type="primary"
                    size="small"
                    :loading="loadingRecommend"
                    @click="loadRecommend"
                  >
                    <el-icon><Cpu /></el-icon>
                    智能推荐
                  </el-button>
                </div>
              </template>
              <div v-if="recommendData" class="recommend-content">
                <el-alert
                  :title="recommendData.reason"
                  type="info"
                  :closable="false"
                  show-icon
                  class="recommend-reason"
                />

                <div class="section-title">推荐车辆</div>
                <el-table
                  ref="vehicleTableRef"
                  :data="recommendData.vehicles"
                  border
                  size="small"
                  style="margin-bottom: 16px;"
                  @selection-change="onVehicleSelection"
                >
                  <el-table-column type="selection" width="45" />
                  <el-table-column prop="station_name" label="所属站点" width="120" />
                  <el-table-column prop="vehicle_type" label="车辆类型" width="100">
                    <template #default="{ row }">
                      <el-tag type="primary" size="small">{{ row.vehicle_type }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="plate_no" label="车牌号" width="110" />
                  <el-table-column prop="crew_count" label="载员" width="70" align="center" />
                  <el-table-column prop="distance_km" label="距离(km)" width="100" align="center">
                    <template #default="{ row }">
                      <span class="distance">{{ row.distance_km }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="estimated_minutes" label="预计到达(分)" width="110" align="center">
                    <template #default="{ row }">
                      <el-tag type="warning" size="small">{{ row.estimated_minutes }}分钟</el-tag>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="section-title">推荐人员</div>
                <el-table
                  ref="firefighterTableRef"
                  :data="recommendData.firefighters"
                  border
                  size="small"
                  style="margin-bottom: 16px;"
                  @selection-change="onFirefighterSelection"
                >
                  <el-table-column type="selection" width="45" />
                  <el-table-column prop="name" label="姓名" width="100" />
                  <el-table-column prop="rank" label="职级" width="100" />
                  <el-table-column prop="station_name" label="所属站点" width="120" />
                  <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                      <el-tag type="success" size="small">{{ row.status }}</el-tag>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="dispatch-actions">
                  <el-form :model="dispatchForm" inline>
                    <el-form-item label="指挥员">
                      <el-input v-model="dispatchForm.commander" placeholder="请输入指挥员姓名" style="width: 150px;" />
                    </el-form-item>
                    <el-form-item label="调整原因">
                      <el-input v-model="dispatchForm.adjust_reason" placeholder="请输入调整原因" style="width: 250px;" />
                    </el-form-item>
                    <el-form-item>
                      <el-button
                        type="danger"
                        size="large"
                        :loading="dispatching"
                        :disabled="!canDispatch"
                        @click="confirmDispatch"
                      >
                        <el-icon><Check /></el-icon>
                        确认派警
                      </el-button>
                    </el-form-item>
                  </el-form>
                  <div class="selection-summary">
                    已选 <span class="highlight">{{ selectedVehicleIds.length }}</span> 辆车，
                    <span class="highlight">{{ selectedFirefighterIds.length }}</span> 名人员
                  </div>
                </div>
              </div>
              <el-empty v-else description="请先选择警情并点击智能推荐" />
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <el-card class="dispatch-list-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span class="card-title">已派警记录</span>
          <el-button type="primary" size="small" @click="loadDispatchList">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      <el-table :data="dispatchList" v-loading="loadingDispatches" stripe border>
        <el-table-column prop="dispatch_no" label="派警编号" width="140" />
        <el-table-column prop="commander" label="指挥员" width="100" />
        <el-table-column prop="vehicle_plates" label="派遣车辆" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.vehicle_plates">
              <el-tag v-for="(plate, idx) in parseList(row.vehicle_plates)" :key="idx" size="small" style="margin: 2px;">{{ plate }}</el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="firefighter_names" label="派遣人员" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div v-if="row.firefighter_names">
              <el-tag v-for="(name, idx) in parseList(row.firefighter_names)" :key="idx" type="success" size="small" style="margin: 2px;">{{ name }}</el-tag>
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="route_status" label="路线状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="getRouteStatusTag(row.route_status)" size="small">{{ row.route_status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="timeout_reminded" label="超时提醒" width="110" align="center">
          <template #default="{ row }">
            <el-badge v-if="row.timeout_reminded > 0" :value="row.timeout_reminded" type="danger">
              <el-tag type="danger" size="small">超时</el-tag>
            </el-badge>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" align="center">
          <template #default="{ row }">
            <el-button
              v-if="row.route_status === '行驶中'"
              type="success"
              size="small"
              @click="handleArrive(row)"
            >
              到场确认
            </el-button>
            <el-button
              v-if="row.timeout_reminded > 0"
              type="warning"
              size="small"
              @click="handleTimeout(row)"
            >
              超时确认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh, Cpu, Check } from '@element-plus/icons-vue'
import {
  getAlarmList,
  getAlarmById,
  getRecommend,
  createDispatch,
  getDispatchList,
  markDispatchArrive,
  markDispatchTimeout
} from '../api/index'

const route = useRoute()

const loadingList = ref(false)
const loadingDetail = ref(false)
const loadingRecommend = ref(false)
const dispatching = ref(false)
const loadingDispatches = ref(false)

const statusFilter = ref('待研判')
const alarmList = ref([])
const alarmTotal = ref(0)
const alarmPage = ref(1)
const alarmPageSize = ref(20)

const selectedAlarm = ref(null)
const recommendData = ref(null)
const selectedVehicleIds = ref([])
const selectedFirefighterIds = ref([])

const vehicleTableRef = ref(null)
const firefighterTableRef = ref(null)

const dispatchForm = reactive({
  commander: '',
  adjust_reason: ''
})

const dispatchList = ref([])

const canDispatch = computed(() => {
  return (
    dispatchForm.commander.trim() !== '' &&
    (selectedVehicleIds.value.length > 0 || selectedFirefighterIds.value.length > 0)
  )
})

const loadAlarmList = async () => {
  loadingList.value = true
  try {
    const res = await getAlarmList({ status: statusFilter.value, page: alarmPage.value, page_size: alarmPageSize.value })
    alarmList.value = res.list || []
    alarmTotal.value = res.total || 0
  } catch {
    ElMessage.error('加载警情列表失败')
  } finally {
    loadingList.value = false
  }
}

const handleFilterChange = () => {
  alarmPage.value = 1
  selectedAlarm.value = null
  recommendData.value = null
  selectedVehicleIds.value = []
  selectedFirefighterIds.value = []
  loadAlarmList()
}

const handlePageChange = (page) => {
  alarmPage.value = page
  loadAlarmList()
}

const handleAlarmSelect = async (row) => {
  if (!row) return
  selectedAlarm.value = row
  recommendData.value = null
  selectedVehicleIds.value = []
  selectedFirefighterIds.value = []
  loadingDetail.value = true
  try {
    const detail = await getAlarmById(row.id)
    selectedAlarm.value = detail
  } catch {
    ElMessage.error('加载警情详情失败')
  } finally {
    loadingDetail.value = false
  }
}

const toggleAllSelection = async () => {
  await nextTick()
  if (vehicleTableRef.value && recommendData.value?.vehicles?.length) {
    recommendData.value.vehicles.forEach(row => {
      vehicleTableRef.value.toggleRowSelection(row, true)
    })
  }
  if (firefighterTableRef.value && recommendData.value?.firefighters?.length) {
    recommendData.value.firefighters.forEach(row => {
      firefighterTableRef.value.toggleRowSelection(row, true)
    })
  }
}

const loadRecommend = async () => {
  if (!selectedAlarm.value) {
    ElMessage.warning('请先选择一条警情')
    return
  }
  loadingRecommend.value = true
  try {
    const res = await getRecommend(selectedAlarm.value.id)
    recommendData.value = res
    selectedVehicleIds.value = []
    selectedFirefighterIds.value = []
    await toggleAllSelection()
  } catch {
    ElMessage.error('获取推荐力量失败')
  } finally {
    loadingRecommend.value = false
  }
}

const onVehicleSelection = (selection) => {
  selectedVehicleIds.value = selection.map(v => v.id)
}

const onFirefighterSelection = (selection) => {
  selectedFirefighterIds.value = selection.map(f => f.id)
}

const confirmDispatch = async () => {
  if (!selectedAlarm.value) {
    ElMessage.warning('请先选择警情')
    return
  }
  if (!dispatchForm.commander.trim()) {
    ElMessage.warning('请输入指挥员姓名')
    return
  }
  if (selectedVehicleIds.value.length === 0 && selectedFirefighterIds.value.length === 0) {
    ElMessage.warning('请至少选择一组调度力量')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认向警情 [${selectedAlarm.value.alarm_no}] 派遣 ${selectedVehicleIds.value.length} 辆车、${selectedFirefighterIds.value.length} 名人员？`,
      '确认派警',
      { confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning' }
    )
  } catch {
    return
  }

  dispatching.value = true
  try {
    await createDispatch({
      alarm_id: selectedAlarm.value.id,
      commander: dispatchForm.commander,
      recommend_reason: recommendData.value?.reason || '',
      adjust_reason: dispatchForm.adjust_reason,
      vehicle_ids: selectedVehicleIds.value,
      firefighter_ids: selectedFirefighterIds.value
    })
    ElMessage.success('派警成功')
    dispatchForm.commander = ''
    dispatchForm.adjust_reason = ''
    recommendData.value = null
    selectedVehicleIds.value = []
    selectedFirefighterIds.value = []
    loadAlarmList()
    loadDispatchList()
  } catch {
    ElMessage.error('派警失败，请重试')
  } finally {
    dispatching.value = false
  }
}

const loadDispatchList = async () => {
  loadingDispatches.value = true
  try {
    const res = await getDispatchList()
    dispatchList.value = Array.isArray(res) ? res : []
  } catch {
    ElMessage.error('加载派警记录失败')
  } finally {
    loadingDispatches.value = false
  }
}

const handleArrive = async (row) => {
  try {
    const { value: reporter } = await ElMessageBox.prompt('请输入到场确认人', '到场确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '请输入确认人姓名'
    })
    await markDispatchArrive(row.id, { reporter })
    ElMessage.success('到场确认成功')
    loadDispatchList()
  } catch {
    // cancelled
  }
}

const handleTimeout = async (row) => {
  try {
    const { value: reporter } = await ElMessageBox.prompt('请输入超时确认人', '超时确认', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '请输入确认人姓名'
    })
    await markDispatchTimeout(row.id, { reporter })
    ElMessage.success('超时确认成功')
    loadDispatchList()
  } catch {
    // cancelled
  }
}

const parseList = (val) => {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean)
  return []
}

const getTypeTag = (type) => {
  const map = { '火灾': 'danger', '救援': 'warning', '社会救助': 'info', '其他': 'success' }
  return map[type] || 'info'
}

const getLevelTag = (level) => {
  const map = { '一级': 'danger', '二级': 'warning', '三级': 'info', '四级': 'success' }
  return map[level] || 'info'
}

const getStatusTag = (status) => {
  const map = { '待研判': 'warning', '处置中': 'primary', '已结束': 'info', '误报': 'danger' }
  return map[status] || 'info'
}

const getRouteStatusTag = (status) => {
  const map = { '行驶中': 'primary', '已到场': 'success', '超时': 'danger' }
  return map[status] || 'info'
}

const selectAlarmById = async (alarmId) => {
  if (!alarmId) return
  try {
    const alarm = await getAlarmById(alarmId)
    if (alarm) {
      statusFilter.value = alarm.status === '待研判' ? '待研判' : '处置中'
      await loadAlarmList()
      const found = alarmList.value.find(a => a.id === alarm.id)
      if (found) {
        handleAlarmSelect(found)
      }
    }
  } catch (e) {
    console.error('Failed to select alarm by id:', e)
  }
}

onMounted(() => {
  loadAlarmList()
  loadDispatchList()
  const alarmId = route.query.alarmId
  if (alarmId) {
    selectAlarmById(parseInt(alarmId))
  }
})

watch(
  () => route.query.alarmId,
  (newId) => {
    if (newId) selectAlarmById(parseInt(newId))
  }
)
</script>

<style scoped>
.dispatch {
  padding: 20px;
}
.list-card,
.detail-card,
.recommend-card,
.dispatch-list-card {
  border-radius: 8px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-title {
  font-weight: 600;
  font-size: 16px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail-content {
  padding: 10px 0;
}
.recommend-content {
  padding: 10px 0;
}
.recommend-reason {
  margin-bottom: 12px;
}
.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  margin: 12px 0 8px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}
.distance {
  color: #409eff;
  font-weight: 500;
}
.dispatch-actions {
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}
.selection-summary {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;
}
.highlight {
  color: #409eff;
  font-weight: 600;
}
.pagination {
  margin-top: 16px;
  justify-content: center;
}
</style>
