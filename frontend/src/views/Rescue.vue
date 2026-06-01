<template>
  <div>
    <el-tabs v-model="activeTab">
      <el-tab-pane label="任务管理" name="missions">
        <div class="page-container">
          <div class="page-header">
            <h2 class="page-title">救援任务</h2>
            <el-button type="primary" @click="showMissionDialog = true" :icon="Plus">
              新建任务
            </el-button>
          </div>

          <div class="filter-bar">
            <el-select v-model="missionFilters.status" placeholder="状态" clearable style="width: 120px;">
              <el-option label="已指派" value="assigned" />
              <el-option label="已出发" value="departed" />
              <el-option label="已到达" value="arrived" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
            <el-select v-model="missionFilters.priority" placeholder="优先级" clearable style="width: 120px;">
              <el-option label="紧急" value="urgent" />
              <el-option label="普通" value="normal" />
              <el-option label="低" value="low" />
            </el-select>
            <el-button type="primary" @click="loadMissions" :icon="Search">查询</el-button>
          </div>

          <el-table :data="missions" v-loading="loading" size="small">
            <el-table-column prop="mission_no" label="任务编号" width="180" />
            <el-table-column prop="mission_type" label="类型" width="100" />
            <el-table-column prop="priority" label="优先级" width="80">
              <template #default="{ row }">
                <el-tag v-if="row.priority === 'urgent'" type="danger" size="small">紧急</el-tag>
                <el-tag v-else-if="row.priority === 'normal'" type="warning" size="small">普通</el-tag>
                <el-tag v-else size="small">低</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="target_location" label="目标地点" min-width="140" />
            <el-table-column prop="team_name" label="执行队伍" width="120" />
            <el-table-column prop="departure_time" label="出发时间" width="160">
              <template #default="{ row }">{{ row.departure_time ? formatTime(row.departure_time) : '--' }}</template>
            </el-table-column>
            <el-table-column prop="arrival_time" label="到达时间" width="160">
              <template #default="{ row }">{{ row.arrival_time ? formatTime(row.arrival_time) : '--' }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <span :class="`status-tag status-${row.status}`">{{ getMissionStatus(row.status) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="viewMission(row)">详情</el-button>
                <el-button link type="primary" size="small" @click="updateMissionStatus(row)">状态更新</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            style="margin-top: 16px; justify-content: flex-end;"
            v-model:current-page="missionPagination.page"
            v-model:page-size="missionPagination.pageSize"
            :total="missionPagination.total"
            layout="total, prev, pager, next"
            @current-change="loadMissions" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="队伍管理" name="teams">
        <div class="page-container">
          <div class="page-header">
            <h2 class="page-title">救援队伍</h2>
            <el-button type="primary" @click="showTeamDialog = true" :icon="Plus">
              新增队伍
            </el-button>
          </div>
          <el-table :data="teams" v-loading="loading" size="small">
            <el-table-column prop="team_code" label="队伍编号" width="140" />
            <el-table-column prop="team_name" label="队伍名称" width="160" />
            <el-table-column prop="team_type" label="类型" width="120" />
            <el-table-column prop="person_count" label="人数" width="80" />
            <el-table-column prop="leader_name" label="队长" width="100" />
            <el-table-column prop="leader_phone" label="联系电话" width="130" />
            <el-table-column prop="base_location" label="驻地" min-width="140" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'standby' ? 'success' : row.status === 'assigned' ? 'warning' : 'info'" size="small">
                  {{ getTeamStatus(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="editTeam(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="车辆管理" name="vehicles">
        <div class="page-container">
          <div class="page-header">
            <h2 class="page-title">救援车辆</h2>
            <el-button type="primary" @click="showVehicleDialog = true" :icon="Plus">
              新增车辆
            </el-button>
          </div>
          <el-table :data="vehicles" v-loading="loading" size="small">
            <el-table-column prop="plate_no" label="车牌号" width="120" />
            <el-table-column prop="vehicle_type" label="类型" width="120" />
            <el-table-column prop="capacity" label="载重(吨)" width="100" />
            <el-table-column prop="team_name" label="所属队伍" width="160" />
            <el-table-column prop="current_location" label="当前位置" min-width="140" />
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'available' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'available' ? '可用' : '执行中' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showMissionDialog" title="新建任务" width="600px">
      <el-form :model="missionForm" label-width="100px">
        <el-form-item label="任务类型" required>
          <el-select v-model="missionForm.mission_type" style="width: 100%;">
            <el-option label="人员搜救" value="search_rescue" />
            <el-option label="医疗救援" value="medical" />
            <el-option label="物资运送" value="supply" />
            <el-option label="道路抢修" value="road_repair" />
            <el-option label="现场评估" value="assessment" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="missionForm.priority" style="width: 100%;">
            <el-option label="紧急" value="urgent" />
            <el-option label="普通" value="normal" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标地点" required>
          <el-input v-model="missionForm.target_location" />
        </el-form-item>
        <el-form-item label="执行队伍" required>
          <el-select v-model="missionForm.team_id" style="width: 100%;">
            <el-option
              v-for="team in availableTeams"
              :key="team.id"
              :label="`${team.team_name} (${team.team_code})`"
              :value="team.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务描述">
          <el-input v-model="missionForm.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="调配资源">
          <el-input v-model="missionForm.assigned_resources" placeholder="如：救护车2辆，医护人员5人" />
        </el-form-item>
        <el-form-item label="创建人">
          <el-input v-model="missionForm.created_by" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showMissionDialog = false">取消</el-button>
        <el-button type="primary" @click="createMission">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showMissionDetailDialog" title="任务详情" width="600px">
      <div v-if="currentMission">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="任务编号">{{ currentMission.mission.mission_no }}</el-descriptions-item>
          <el-descriptions-item label="类型">{{ currentMission.mission.mission_type }}</el-descriptions-item>
          <el-descriptions-item label="优先级">
            <el-tag v-if="currentMission.mission.priority === 'urgent'" type="danger" size="small">紧急</el-tag>
            <el-tag v-else-if="currentMission.mission.priority === 'normal'" type="warning" size="small">普通</el-tag>
            <el-tag v-else size="small">低</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <span :class="`status-tag status-${currentMission.mission.status}`">
              {{ getMissionStatus(currentMission.mission.status) }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="目标地点" :span="2">{{ currentMission.mission.target_location }}</el-descriptions-item>
          <el-descriptions-item label="执行队伍">{{ currentMission.mission.team_name }}</el-descriptions-item>
          <el-descriptions-item label="队长">{{ currentMission.mission.leader_name }}</el-descriptions-item>
          <el-descriptions-item label="出发时间">{{ currentMission.mission.departure_time ? formatTime(currentMission.mission.departure_time) : '--' }}</el-descriptions-item>
          <el-descriptions-item label="到达时间">{{ currentMission.mission.arrival_time ? formatTime(currentMission.mission.arrival_time) : '--' }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentMission.mission.completion_time ? formatTime(currentMission.mission.completion_time) : '--' }}</el-descriptions-item>
          <el-descriptions-item label="任务描述" :span="2">{{ currentMission.mission.description || '暂无' }}</el-descriptions-item>
        </el-descriptions>

        <h3 class="section-title">变更轨迹</h3>
        <el-timeline v-if="currentMission.tracks && currentMission.tracks.length > 0">
          <el-timeline-item
            v-for="track in currentMission.tracks"
            :key="track.id"
            :timestamp="formatTime(track.created_at)"
            placement="top">
            <el-card shadow="hover">
              <div>
                <strong>{{ track.operator || '系统' }}</strong>
                <span v-if="track.old_status !== track.new_status">
                  将状态从 <el-tag size="small">{{ getMissionStatus(track.old_status) }}</el-tag>
                  改为 <el-tag type="primary" size="small">{{ getMissionStatus(track.new_status) }}</el-tag>
                </span>
                <span v-if="track.old_team_id !== track.new_team_id && track.new_team_name">
                  将队伍从 {{ track.old_team_name || '无' }} 改为 {{ track.new_team_name }}
                </span>
                <div v-if="track.change_reason" style="margin-top: 8px; color: #666;">
                  原因：{{ track.change_reason }}
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无变更记录" />
      </div>
    </el-dialog>

    <el-dialog v-model="showStatusDialog" title="更新任务状态" width="500px">
      <el-form :model="statusForm" label-width="100px" v-if="currentMission">
        <el-form-item label="任务编号">
          <span>{{ currentMission.mission_no }}</span>
        </el-form-item>
        <el-form-item label="新状态" required>
          <el-select v-model="statusForm.status" style="width: 100%;">
            <el-option label="已出发" value="departed" />
            <el-option label="已到达" value="arrived" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更队伍">
          <el-select v-model="statusForm.team_id" clearable style="width: 100%;">
            <el-option
              v-for="team in availableTeams"
              :key="team.id"
              :label="`${team.team_name} (${team.team_code})`"
              :value="team.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="statusForm.status === 'departed'" label="出发时间">
          <el-date-picker
            v-model="statusForm.departure_time"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%;" />
        </el-form-item>
        <el-form-item v-if="statusForm.status === 'arrived'" label="到达时间">
          <el-date-picker
            v-model="statusForm.arrival_time"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%;" />
        </el-form-item>
        <el-form-item v-if="statusForm.status === 'completed'" label="完成时间">
          <el-date-picker
            v-model="statusForm.completion_time"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss"
            style="width: 100%;" />
        </el-form-item>
        <el-form-item label="变更原因">
          <el-input v-model="statusForm.change_reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="操作人">
          <el-input v-model="statusForm.operator" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStatusDialog = false">取消</el-button>
        <el-button type="primary" @click="saveStatus">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showTeamDialog" title="新增队伍" width="500px">
      <el-form :model="teamForm" label-width="100px">
        <el-form-item label="队伍编号" required>
          <el-input v-model="teamForm.team_code" placeholder="如：R001" />
        </el-form-item>
        <el-form-item label="队伍名称" required>
          <el-input v-model="teamForm.team_name" placeholder="如：消防一中队" />
        </el-form-item>
        <el-form-item label="队伍类型">
          <el-select v-model="teamForm.team_type" style="width: 100%;">
            <el-option label="消防救援" value="fire" />
            <el-option label="医疗救援" value="medical" />
            <el-option label="武警部队" value="army" />
            <el-option label="民间救援" value="civil" />
          </el-select>
        </el-form-item>
        <el-form-item label="人数">
          <el-input-number v-model="teamForm.person_count" :min="0" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="队长">
          <el-input v-model="teamForm.leader_name" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="teamForm.leader_phone" />
        </el-form-item>
        <el-form-item label="驻地">
          <el-input v-model="teamForm.base_location" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showTeamDialog = false">取消</el-button>
        <el-button type="primary" @click="createTeam">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showVehicleDialog" title="新增车辆" width="500px">
      <el-form :model="vehicleForm" label-width="100px">
        <el-form-item label="车牌号" required>
          <el-input v-model="vehicleForm.plate_no" />
        </el-form-item>
        <el-form-item label="车辆类型">
          <el-select v-model="vehicleForm.vehicle_type" style="width: 100%;">
            <el-option label="救护车" value="ambulance" />
            <el-option label="消防车" value="fire_truck" />
            <el-option label="运输车" value="truck" />
            <el-option label="指挥车" value="command" />
          </el-select>
        </el-form-item>
        <el-form-item label="载重(吨)">
          <el-input-number v-model="vehicleForm.capacity" :min="0" :step="0.5" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="所属队伍">
          <el-select v-model="vehicleForm.team_id" clearable style="width: 100%;">
            <el-option
              v-for="team in teams"
              :key="team.id"
              :label="team.team_name"
              :value="team.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="当前位置">
          <el-input v-model="vehicleForm.current_location" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showVehicleDialog = false">取消</el-button>
        <el-button type="primary" @click="createVehicle">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { api } from '@/api'

const activeTab = ref('missions')
const loading = ref(false)
const missions = ref([])
const teams = ref([])
const vehicles = ref([])
const availableTeams = ref([])

const showMissionDialog = ref(false)
const showTeamDialog = ref(false)
const showVehicleDialog = ref(false)
const showMissionDetailDialog = ref(false)
const showStatusDialog = ref(false)
const currentMission = ref(null)

const missionFilters = reactive({ status: '', priority: '' })
const missionPagination = reactive({ page: 1, pageSize: 10, total: 0 })

const missionForm = reactive({
  mission_type: 'search_rescue',
  priority: 'normal',
  target_location: '',
  team_id: null,
  description: '',
  assigned_resources: '',
  created_by: ''
})

const teamForm = reactive({
  team_code: '',
  team_name: '',
  team_type: '',
  person_count: 0,
  leader_name: '',
  leader_phone: '',
  base_location: ''
})

const vehicleForm = reactive({
  plate_no: '',
  vehicle_type: '',
  capacity: 0,
  team_id: null,
  current_location: ''
})

const statusForm = reactive({
  status: '',
  team_id: null,
  departure_time: '',
  arrival_time: '',
  completion_time: '',
  change_reason: '',
  operator: ''
})

const formatTime = (t) => t ? new Date(t).toLocaleString('zh-CN') : '--'
const getTeamStatus = (s) => ({ standby: '待命', assigned: '已指派', working: '执行中' }[s] || s)
const getMissionStatus = (s) => ({
  assigned: '已指派',
  departed: '已出发',
  arrived: '已到达',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消'
}[s] || s)

const loadMissions = async () => {
  loading.value = true
  try {
    const res = await api.rescue.missions({
      page: missionPagination.page,
      pageSize: missionPagination.pageSize,
      ...missionFilters
    })
    missions.value = res.list
    missionPagination.total = res.total
  } catch (err) {
    console.error('加载任务失败:', err)
  } finally {
    loading.value = false
  }
}

const loadTeams = async () => {
  try {
    teams.value = await api.rescue.teams()
    availableTeams.value = teams.value.filter(t => t.status === 'standby')
  } catch (err) {
    console.error('加载队伍失败:', err)
  }
}

const loadVehicles = async () => {
  try {
    vehicles.value = await api.rescue.vehicles()
  } catch (err) {
    console.error('加载车辆失败:', err)
  }
}

const resetMissionForm = () => {
  missionForm.mission_type = 'search_rescue'
  missionForm.priority = 'normal'
  missionForm.target_location = ''
  missionForm.team_id = null
  missionForm.description = ''
  missionForm.assigned_resources = ''
  missionForm.created_by = ''
}

const createMission = async () => {
  if (!missionForm.mission_type || !missionForm.target_location) {
    ElMessage.warning('请填写必填项：任务类型、目标地点')
    return
  }
  try {
    await api.rescue.createMission(missionForm)
    ElMessage.success('任务创建成功，已生成调度记录')
    showMissionDialog.value = false
    resetMissionForm()
    loadMissions()
    loadTeams()
  } catch (err) {
    console.error('创建失败:', err)
    ElMessage.error(err.message || '任务创建失败，请检查网络或稍后重试')
  }
}

const createTeam = async () => {
  try {
    await api.rescue.createTeam(teamForm)
    ElMessage.success('队伍创建成功')
    showTeamDialog.value = false
    loadTeams()
  } catch (err) {
    console.error('创建失败:', err)
  }
}

const editTeam = (row) => {
  Object.assign(teamForm, row)
  showTeamDialog.value = true
}

const createVehicle = async () => {
  try {
    await api.rescue.createVehicle(vehicleForm)
    ElMessage.success('车辆创建成功')
    showVehicleDialog.value = false
    loadVehicles()
  } catch (err) {
    console.error('创建失败:', err)
  }
}

const viewMission = async (row) => {
  try {
    currentMission.value = await api.rescue.getMission(row.id)
    showMissionDetailDialog.value = true
  } catch (err) {
    console.error('加载详情失败:', err)
  }
}

const updateMissionStatus = (row) => {
  currentMission.value = row
  statusForm.status = row.status
  statusForm.team_id = null
  statusForm.departure_time = row.departure_time
  statusForm.arrival_time = row.arrival_time
  statusForm.completion_time = row.completion_time
  statusForm.change_reason = ''
  statusForm.operator = ''
  showStatusDialog.value = true
}

const saveStatus = async () => {
  if (!statusForm.status) {
    ElMessage.warning('请选择新状态')
    return
  }
  try {
    await api.rescue.updateMission(currentMission.value.id, statusForm)
    ElMessage.success('状态更新成功，已记录变更轨迹')
    showStatusDialog.value = false
    loadMissions()
    loadTeams()
  } catch (err) {
    console.error('更新失败:', err)
    ElMessage.error(err.message || '状态更新失败')
  }
}

watch(activeTab, (val) => {
  if (val === 'teams') loadTeams()
  if (val === 'vehicles') {
    loadTeams()
    loadVehicles()
  }
})

onMounted(() => {
  loadMissions()
  loadTeams()
  loadVehicles()
})
</script>
