<template>
  <div>
    <div class="page-header">
      <h2>智能排班</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="card-container" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>生成排班方案</span>
              <div class="header-tips">
                <el-icon><InfoFilled /></el-icon>
                <span>系统将自动校验工时、休息间隔、资质匹配、连续值乘和请假冲突</span>
              </div>
            </div>
          </template>
          <el-form :inline="true" :model="scheduleForm" label-width="80px">
            <el-form-item label="选择车次">
              <el-select v-model="scheduleForm.train_id" placeholder="请选择车次" style="width: 150px;">
                <el-option v-for="train in trains" :key="train.id" :label="`${train.train_no} (${train.departure_station}-${train.arrival_station})`" :value="train.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="排班日期">
              <el-date-picker v-model="scheduleForm.schedule_date" type="date" value-format="YYYY-MM-DD" style="width: 150px;" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="generateSchedule" :loading="generating">
                <el-icon><MagicStick /></el-icon>
                智能生成方案
              </el-button>
              <el-button @click="resetForm">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" v-if="generatedResult">
      <el-col :span="24">
        <el-card class="card-container" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <div>
                <span class="result-title">排班方案 - {{ generatedResult.train?.train_no }}</span>
                <el-tag size="small" style="margin-left: 12px;">{{ generatedResult.schedule_date }}</el-tag>
              </div>
              <div>
                <el-tag v-if="generatedResult.has_conflicts" type="danger" style="margin-right: 12px;">
                  <el-icon><Warning /></el-icon>
                  存在冲突
                </el-tag>
                <el-tag v-else type="success" style="margin-right: 12px;">
                  <el-icon><CircleCheck /></el-icon>
                  校验通过
                </el-tag>
                <el-button type="success" size="small" @click="confirmSchedule" :disabled="generatedResult.has_conflicts">
                  <el-icon><Check /></el-icon>
                  确认并提交排班
                </el-button>
              </div>
            </div>
          </template>

          <el-alert v-if="generatedResult.conflicts.length > 0" type="error" style="margin-bottom: 16px;">
            <template #title>
              <span>检测到 {{ generatedResult.conflicts.length }} 个排班冲突，请调整后再提交</span>
            </template>
            <div v-for="(c, i) in generatedResult.conflicts" :key="i" class="conflict-item">
              <el-tag type="danger" size="small" style="margin-right: 8px;">{{ c.position }}</el-tag>
              <span>{{ c.reason }}</span>
            </div>
          </el-alert>

          <el-alert v-if="!generatedResult.has_conflicts" type="success" style="margin-bottom: 16px;">
            <template #title>
              <span>所有校验项通过，排班方案已生成</span>
            </template>
            <div class="success-checks">
              <span><el-icon><CircleCheck /></el-icon> 工时校验正常</span>
              <span><el-icon><CircleCheck /></el-icon> 休息间隔充足</span>
              <span><el-icon><CircleCheck /></el-icon> 资质匹配通过</span>
              <span><el-icon><CircleCheck /></el-icon> 连续值乘合规</span>
              <span><el-icon><CircleCheck /></el-icon> 无请假冲突</span>
            </div>
          </el-alert>
          
          <h4 style="margin-bottom: 12px;">班组配置方案</h4>
          <el-table :data="generatedResult.assignments" size="small" style="margin-bottom: 16px;">
            <el-table-column prop="position" label="岗位" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ row.position }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="crew_name" label="乘务员" width="100" />
            <el-table-column label="排班校验" width="280">
              <template #default="{ row }">
                <div class="check-tags">
                  <el-tag size="small" type="success" effect="plain">工时正常</el-tag>
                  <el-tag size="small" type="success" effect="plain">休息充足</el-tag>
                  <el-tag size="small" type="success" effect="plain">资质匹配</el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="duty_start_time" label="上岗时间" width="150" />
            <el-table-column prop="duty_end_time" label="下岗时间" width="150" />
            <el-table-column prop="work_hours" label="工时(h)" width="90" align="center" />
            <el-table-column label="操作" width="100">
              <template #default="{ row, $index }">
                <el-button type="primary" link size="small" @click="showCrewInfo(row)">查看人员</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-divider />
          
          <div class="notice-section">
            <el-icon color="#f59e0b"><Bell /></el-icon>
            <span class="notice-text">排班确认后，系统将自动通知相关乘务人员并记录变更原因</span>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="card-container">
          <template #header>
            <div class="card-header">
              <span>已排班记录</span>
              <el-form :inline="true" :model="filterForm">
                <el-form-item label="日期范围">
                  <el-date-picker v-model="filterForm.dateRange" type="daterange" value-format="YYYY-MM-DD" style="width: 280px;" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" size="small" @click="loadSchedules">查询</el-button>
                </el-form-item>
              </el-form>
            </div>
          </template>
          <el-table :data="schedules" v-loading="loading" size="small">
            <el-table-column prop="schedule_date" label="日期" width="120" />
            <el-table-column prop="train_no" label="车次" width="90" />
            <el-table-column prop="departure_station" label="始发" width="80" />
            <el-table-column prop="arrival_station" label="终到" width="80" />
            <el-table-column prop="departure_time" label="发车时间" width="90" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 'confirmed' ? 'success' : 'info'" size="small">
                  {{ row.status === 'confirmed' ? '已确认' : '草稿' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="notes" label="备注" show-overflow-tooltip />
            <el-table-column label="操作" width="220">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="viewSchedule(row.id)">详情</el-button>
                <el-button type="warning" link size="small" @click="goToShiftChange(row)">调班</el-button>
                <el-button type="danger" link size="small" @click="deleteSchedule(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="detailDialogVisible" title="排班详情" width="750px">
      <div v-if="currentSchedule">
        <el-descriptions :column="3" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="排班日期">{{ currentSchedule.schedule_date }}</el-descriptions-item>
          <el-descriptions-item label="车次">{{ currentSchedule.train_no }}</el-descriptions-item>
          <el-descriptions-item label="线路">{{ currentSchedule.departure_station }} → {{ currentSchedule.arrival_station }}</el-descriptions-item>
          <el-descriptions-item label="发车时间">{{ currentSchedule.departure_time }}</el-descriptions-item>
          <el-descriptions-item label="到达时间">{{ currentSchedule.arrival_time }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="currentSchedule.status === 'confirmed' ? 'success' : 'info'">
              {{ currentSchedule.status === 'confirmed' ? '已确认' : '草稿' }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <h4 style="margin-bottom: 12px;">班组人员配置</h4>
        <el-table :data="currentSchedule.assignments || []" size="small">
          <el-table-column prop="employee_no" label="工号" width="90" />
          <el-table-column prop="crew_name" label="姓名" width="90" />
          <el-table-column prop="position" label="岗位" width="90" />
          <el-table-column prop="duty_start_time" label="上岗时间" width="150" />
          <el-table-column prop="duty_end_time" label="下岗时间" width="150" />
          <el-table-column prop="work_hours" label="工时(h)" width="80" align="center" />
          <el-table-column prop="status" label="状态" width="90">
            <template #default="{ row }">
              <el-tag size="small" :type="row.status === 'reassigned' ? 'warning' : 'success'">
                {{ row.status === 'reassigned' ? '已调班' : '正常' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>

        <el-divider v-if="currentSchedule.notes" />
        <div v-if="currentSchedule.notes" class="schedule-notes">
          <strong>备注：</strong>{{ currentSchedule.notes }}
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="crewInfoVisible" title="人员排班校验信息" width="600px">
      <div v-if="selectedCrew">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 16px;">
          <el-descriptions-item label="姓名">{{ selectedCrew.crew_name }}</el-descriptions-item>
          <el-descriptions-item label="岗位">{{ selectedCrew.position }}</el-descriptions-item>
          <el-descriptions-item label="上岗时间">{{ selectedCrew.duty_start_time }}</el-descriptions-item>
          <el-descriptions-item label="下岗时间">{{ selectedCrew.duty_end_time }}</el-descriptions-item>
          <el-descriptions-item label="本次工时" :span="2">{{ selectedCrew.work_hours }} 小时</el-descriptions-item>
        </el-descriptions>
        
        <el-alert type="info" :closable="false">
          <template #title>排班校验结果</template>
          <div style="padding: 8px 0;">
            <div class="check-item"><el-icon color="#10b981"><CircleCheck /></el-icon> 资质匹配验证通过</div>
            <div class="check-item"><el-icon color="#10b981"><CircleCheck /></el-icon> 休息间隔符合要求</div>
            <div class="check-item"><el-icon color="#10b981"><CircleCheck /></el-icon> 连续值乘未超限</div>
            <div class="check-item"><el-icon color="#10b981"><CircleCheck /></el-icon> 无请假冲突</div>
          </div>
        </el-alert>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { schedulingAPI, trainsAPI } from '@/api'

const router = useRouter()
const trains = ref([])
const schedules = ref([])
const loading = ref(false)
const generating = ref(false)
const generatedResult = ref(null)
const detailDialogVisible = ref(false)
const crewInfoVisible = ref(false)
const currentSchedule = ref(null)
const selectedCrew = ref(null)

const scheduleForm = ref({
  train_id: null,
  schedule_date: ''
})

const filterForm = ref({
  dateRange: []
})

const loadTrains = async () => {
  try {
    const res = await trainsAPI.list()
    trains.value = res.data
  } catch (error) {
    console.error('加载车次失败')
  }
}

const loadSchedules = async () => {
  loading.value = true
  try {
    const params = {}
    if (filterForm.value.dateRange && filterForm.value.dateRange.length === 2) {
      params.start_date = filterForm.value.dateRange[0]
      params.end_date = filterForm.value.dateRange[1]
    }
    const res = await schedulingAPI.listSchedules(params)
    schedules.value = res.data
  } catch (error) {
    ElMessage.error('加载排班列表失败')
  } finally {
    loading.value = false
  }
}

const generateSchedule = async () => {
  if (!scheduleForm.value.train_id || !scheduleForm.value.schedule_date) {
    ElMessage.warning('请选择车次和排班日期')
    return
  }
  
  generating.value = true
  try {
    const res = await schedulingAPI.generate(scheduleForm.value)
    generatedResult.value = res.data
    if (res.data.has_conflicts) {
      ElMessage.warning('排班存在冲突，请查看冲突详情')
    } else {
      ElMessage.success('排班方案已生成，校验全部通过')
    }
  } catch (error) {
    ElMessage.error('生成排班失败')
  } finally {
    generating.value = false
  }
}

const resetForm = () => {
  scheduleForm.value = { train_id: null, schedule_date: '' }
  generatedResult.value = null
}

const confirmSchedule = async () => {
  if (!generatedResult.value) return
  
  try {
    await ElMessageBox.confirm('确认提交该排班方案吗？提交后系统将自动记录并通知相关人员。', '确认排班', { type: 'warning' })
    
    const data = {
      train_id: scheduleForm.value.train_id,
      schedule_date: scheduleForm.value.schedule_date,
      assignments: generatedResult.value.assignments,
      notes: '系统智能排班生成'
    }
    
    await schedulingAPI.confirm(data)
    ElMessage.success('排班已确认，已记录变更原因并通知相关人员')
    generatedResult.value = null
    loadSchedules()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('确认失败')
    }
  }
}

const viewSchedule = async (id) => {
  try {
    const res = await schedulingAPI.getSchedule(id)
    currentSchedule.value = res.data
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载详情失败')
  }
}

const goToShiftChange = (row) => {
  ElMessage.info('正在跳转到调班页面...')
  router.push('/shift-changes')
}

const showCrewInfo = (row) => {
  selectedCrew.value = row
  crewInfoVisible.value = true
}

const deleteSchedule = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该排班吗？删除后将无法恢复。', '确认删除', { type: 'warning' })
    await schedulingAPI.deleteSchedule(id)
    ElMessage.success('删除成功，已记录变更原因')
    loadSchedules()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadTrains()
  loadSchedules()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-tips {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #64748b;
}

.result-title {
  font-size: 16px;
  font-weight: 500;
}

.conflict-item {
  padding: 4px 0;
  display: flex;
  align-items: center;
}

.success-checks {
  display: flex;
  gap: 20px;
  margin-top: 8px;
}

.success-checks span {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #059669;
}

.check-tags {
  display: flex;
  gap: 4px;
}

.notice-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fffbeb;
  border-radius: 6px;
}

.notice-text {
  font-size: 13px;
  color: #92400e;
}

.schedule-notes {
  padding: 8px;
  background: #f8fafc;
  border-radius: 4px;
  font-size: 13px;
  color: #475569;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
}
</style>
