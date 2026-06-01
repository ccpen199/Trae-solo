<template>
  <div class="operation-records">
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="quick-action-card" @click="startRecord('运行')">
          <div class="quick-action run">
            <el-icon size="40"><VideoPlay /></el-icon>
            <div class="action-text">开始运行</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="quick-action-card" @click="startRecord('故障停机')">
          <div class="quick-action fault">
            <el-icon size="40"><Warning /></el-icon>
            <div class="action-text">故障停机</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="quick-action-card" @click="startRecord('换线')">
          <div class="quick-action change">
            <el-icon size="40"><Switch /></el-icon>
            <div class="action-text">换线调整</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="quick-action-card" @click="startRecord('待料')">
          <div class="quick-action wait">
            <el-icon size="40"><Timer /></el-icon>
            <div class="action-text">待料停机</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="运行记录" name="records">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>记录列表</span>
              <div class="header-actions">
                <el-select v-model="filterDevice" placeholder="按设备筛选" clearable style="width: 200px; margin-right: 10px" @change="loadRecords">
                  <el-option label="全部" :value="null" />
                  <el-option v-for="d in devices" :key="d.id" :label="`[${d.code}] ${d.name}`" :value="d.id" />
                </el-select>
                <el-select v-model="filterType" placeholder="按类型筛选" clearable style="width: 150px; margin-right: 10px" @change="loadRecords">
                  <el-option label="全部" :value="null" />
                  <el-option label="运行" value="运行" />
                  <el-option label="故障停机" value="故障停机" />
                  <el-option label="计划停机" value="计划停机" />
                  <el-option label="换线" value="换线" />
                  <el-option label="待料" value="待料" />
                  <el-option label="保养" value="保养" />
                </el-select>
                <el-button type="primary" @click="showRecordDialog">
                  <el-icon><Plus /></el-icon>新增记录
                </el-button>
              </div>
            </div>
          </template>

          <el-alert v-if="activeRecords.length > 0" type="warning" :closable="false" style="margin-bottom: 15px;">
            <template #title>
              <span>当前有 {{ activeRecords.length }} 个进行中的记录，请及时结束</span>
              <el-button type="warning" size="small" @click="endAllRecords" style="margin-left: 20px;">全部结束</el-button>
            </template>
          </el-alert>

          <el-table :data="filteredRecords" style="width: 100%" stripe>
            <el-table-column label="状态" width="80">
              <template #default="{ row }">
                <el-tag v-if="!row.end_time" type="danger" size="small" effect="dark">进行中</el-tag>
                <el-tag v-else type="success" size="small">已结束</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="设备" width="200">
              <template #default="{ row }">
                <div v-if="row.device" class="device-display">
                  <el-tag size="small" type="info">{{ row.device.code }}</el-tag>
                  <span class="device-name">{{ row.device.name }}</span>
                </div>
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column prop="shift.name" label="班次" width="80">
              <template #default="{ row }">{{ row.shift?.name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="record_type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag :type="getTypeClass(row.record_type)" size="small">{{ row.record_type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="start_time" label="开始时间" width="160">
              <template #default="{ row }">{{ formatTime(row.start_time) }}</template>
            </el-table-column>
            <el-table-column prop="end_time" label="结束时间" width="160">
              <template #default="{ row }">{{ formatTime(row.end_time) || '-' }}</template>
            </el-table-column>
            <el-table-column prop="duration_minutes" label="时长(分)" width="90">
              <template #default="{ row }">
                <strong>{{ row.duration_minutes || 0 }}</strong>
              </template>
            </el-table-column>
            <el-table-column prop="downtime_reason" label="停机原因" min-width="150">
              <template #default="{ row }">{{ row.downtime_reason || '-' }}</template>
            </el-table-column>
            <el-table-column prop="operator" label="操作员" width="90" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button v-if="!row.end_time" size="small" type="success" @click="endRecord(row)">
                  <el-icon><VideoPause /></el-icon>结束
                </el-button>
                <el-button v-else size="small" @click="editRecord(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteRecord(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="停机统计" name="stats">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>停机原因统计</span>
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                size="small"
                @change="loadStats"
              />
            </div>
          </template>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-table :data="downtimeByType" style="width: 100%">
                <el-table-column prop="type" label="停机类型" width="150" />
                <el-table-column prop="count" label="次数" width="100">
                  <template #default="{ row }"><strong>{{ row.count }}</strong></template>
                </el-table-column>
                <el-table-column prop="duration" label="总时长(分钟)" width="150">
                  <template #default="{ row }"><strong>{{ row.duration }}</strong></template>
                </el-table-column>
                <el-table-column label="占比" width="150">
                  <template #default="{ row }">
                    <el-progress :percentage="row.percent" :stroke-width="12" />
                  </template>
                </el-table-column>
              </el-table>
            </el-col>
            <el-col :span="12">
              <el-table :data="downtimeByReason" style="width: 100%">
                <el-table-column prop="reason" label="停机原因" width="200" />
                <el-table-column prop="count" label="次数" width="100">
                  <template #default="{ row }"><strong>{{ row.count }}</strong></template>
                </el-table-column>
                <el-table-column prop="duration" label="总时长(分钟)" width="150">
                  <template #default="{ row }"><strong>{{ row.duration }}</strong></template>
                </el-table-column>
              </el-table>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="recordDialogVisible" :title="isRecordEdit ? '编辑记录' : '新增记录'" width="700px">
      <el-form :model="recordForm" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备" required>
              <el-select v-model="recordForm.device_id" placeholder="请选择设备" style="width: 100%" :disabled="isRecordEdit && !!recordForm.end_time">
                <el-option v-for="d in devices" :key="d.id" :label="`[${d.code}] ${d.name}`" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="班次">
              <el-select v-model="recordForm.shift_id" placeholder="请选择班次" style="width: 100%">
                <el-option v-for="s in shifts" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="记录类型" required>
              <el-select v-model="recordForm.record_type" placeholder="请选择类型" style="width: 100%" :disabled="isRecordEdit && !!recordForm.end_time">
                <el-option label="运行" value="运行" />
                <el-option label="故障停机" value="故障停机" />
                <el-option label="计划停机" value="计划停机" />
                <el-option label="换线" value="换线" />
                <el-option label="待料" value="待料" />
                <el-option label="保养" value="保养" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="操作员">
              <el-input v-model="recordForm.operator" placeholder="请输入操作员" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="开始时间" required>
              <el-date-picker v-model="recordForm.start_time" type="datetime" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="结束时间">
              <el-date-picker v-model="recordForm.end_time" type="datetime" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="持续时长(分)">
              <el-input-number v-model="recordForm.duration_minutes" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item v-if="recordForm.record_type !== '运行'" label="停机原因">
              <el-input v-model="recordForm.downtime_reason" placeholder="请输入停机原因" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input v-model="recordForm.notes" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="recordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="endDialogVisible" title="结束记录" width="500px">
      <el-form :model="endForm" label-width="100px">
        <el-form-item label="结束时间">
          <el-date-picker v-model="endForm.end_time" type="datetime" style="width: 100%" />
        </el-form-item>
        <el-form-item label="持续时长(分)">
          <el-input-number v-model="endForm.duration_minutes" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="currentRecord?.record_type !== '运行'" label="停机原因">
          <el-select v-model="endForm.downtime_reason" placeholder="请选择或输入原因" style="width: 100%" filterable allow-create>
            <el-option label="设备故障" value="设备故障" />
            <el-option label="原料短缺" value="原料短缺" />
            <el-option label="产品切换" value="产品切换" />
            <el-option label="人员休息" value="人员休息" />
            <el-option label="计划保养" value="计划保养" />
            <el-option label="质量问题" value="质量问题" />
            <el-option label="其他原因" value="其他原因" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="endForm.notes" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="endDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmEndRecord">确认结束</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getOperationRecords, createOperationRecord, updateOperationRecord, deleteOperationRecord, getDevices, getShifts } from '../api'

const activeTab = ref('records')
const filterDevice = ref(null)
const filterType = ref(null)
const dateRange = ref([])

const records = ref([])
const devices = ref([])
const shifts = ref([])

const recordDialogVisible = ref(false)
const endDialogVisible = ref(false)
const isRecordEdit = ref(false)
const currentRecord = ref(null)

const recordForm = ref({
  device_id: null,
  shift_id: null,
  record_type: '运行',
  start_time: new Date(),
  end_time: null,
  duration_minutes: 0,
  downtime_reason: '',
  operator: '',
  notes: ''
})

const endForm = ref({
  end_time: new Date(),
  duration_minutes: 0,
  downtime_reason: '',
  notes: ''
})

const downtimeByType = ref([])
const downtimeByReason = ref([])

const activeRecords = computed(() => records.value.filter(r => !r.end_time))

const filteredRecords = computed(() => {
  let result = records.value
  if (filterDevice.value) result = result.filter(r => r.device_id === filterDevice.value)
  if (filterType.value) result = result.filter(r => r.record_type === filterType.value)
  return result.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
})

const getTypeClass = (type) => {
  const types = { '运行': 'success', '故障停机': 'danger', '计划停机': 'info', '换线': 'warning', '待料': 'warning', '保养': '' }
  return types[type] || 'info'
}

const formatTime = (time) => {
  if (!time) return ''
  return new Date(time).toLocaleString('zh-CN')
}

const loadRecords = async () => {
  try {
    const res = await getOperationRecords()
    records.value = res.data
  } catch (error) {
    ElMessage.error('加载记录失败')
  }
}

const loadDevices = async () => {
  try {
    const res = await getDevices()
    devices.value = res.data.filter(d => d.is_active)
  } catch (error) {
    ElMessage.error('加载设备失败')
  }
}

const loadShifts = async () => {
  try {
    const res = await getShifts()
    shifts.value = res.data
  } catch (error) {
    ElMessage.error('加载班次失败')
  }
}

const loadStats = () => {
  const typeMap = {}
  const reasonMap = {}
  let totalDuration = 0

  records.value.forEach(r => {
    if (r.record_type !== '运行' && r.duration_minutes) {
      typeMap[r.record_type] = typeMap[r.record_type] || { count: 0, duration: 0 }
      typeMap[r.record_type].count++
      typeMap[r.record_type].duration += r.duration_minutes
      totalDuration += r.duration_minutes

      if (r.downtime_reason) {
        reasonMap[r.downtime_reason] = reasonMap[r.downtime_reason] || { count: 0, duration: 0 }
        reasonMap[r.downtime_reason].count++
        reasonMap[r.downtime_reason].duration += r.duration_minutes
      }
    }
  })

  downtimeByType.value = Object.entries(typeMap).map(([type, data]) => ({
    type,
    count: data.count,
    duration: data.duration,
    percent: totalDuration > 0 ? Math.round(data.duration / totalDuration * 100) : 0
  })).sort((a, b) => b.duration - a.duration)

  downtimeByReason.value = Object.entries(reasonMap).map(([reason, data]) => ({
    reason,
    count: data.count,
    duration: data.duration
  })).sort((a, b) => b.duration - a.duration)
}

const startRecord = (type) => {
  isRecordEdit.value = false
  recordForm.value = {
    device_id: devices.value.length > 0 ? devices.value[0].id : null,
    shift_id: null,
    record_type: type,
    start_time: new Date(),
    end_time: null,
    duration_minutes: 0,
    downtime_reason: '',
    operator: '',
    notes: ''
  }
  recordDialogVisible.value = true
}

const showRecordDialog = () => {
  isRecordEdit.value = false
  recordForm.value = {
    device_id: null,
    shift_id: null,
    record_type: '运行',
    start_time: new Date(),
    end_time: null,
    duration_minutes: 0,
    downtime_reason: '',
    operator: '',
    notes: ''
  }
  recordDialogVisible.value = true
}

const editRecord = (row) => {
  isRecordEdit.value = true
  recordForm.value = { ...row }
  recordDialogVisible.value = true
}

const saveRecord = async () => {
  try {
    if (isRecordEdit.value) {
      await updateOperationRecord(recordForm.value.id, recordForm.value)
      ElMessage.success('更新成功')
    } else {
      await createOperationRecord(recordForm.value)
      ElMessage.success('创建成功')
    }
    recordDialogVisible.value = false
    loadRecords()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const endRecord = (row) => {
  currentRecord.value = row
  const start = new Date(row.start_time)
  const end = new Date()
  const duration = Math.round((end - start) / 60000)
  endForm.value = {
    end_time: end,
    duration_minutes: duration,
    downtime_reason: row.downtime_reason || '',
    notes: ''
  }
  endDialogVisible.value = true
}

const confirmEndRecord = async () => {
  try {
    await updateOperationRecord(currentRecord.value.id, endForm.value)
    ElMessage.success('记录已结束')
    endDialogVisible.value = false
    loadRecords()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const endAllRecords = async () => {
  try {
    await ElMessageBox.confirm('确定要结束所有进行中的记录吗？', '确认操作', { type: 'warning' })
    for (const record of activeRecords.value) {
      const end = new Date()
      const duration = Math.round((end - new Date(record.start_time)) / 60000)
      await updateOperationRecord(record.id, { end_time: end, duration_minutes: duration })
    }
    ElMessage.success('已结束所有记录')
    loadRecords()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败')
  }
}

const deleteRecord = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除这条记录吗？`, '确认删除', { type: 'warning' })
    await deleteOperationRecord(row.id)
    ElMessage.success('删除成功')
    loadRecords()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadRecords()
  loadDevices()
  loadShifts()
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

.quick-action-card {
  cursor: pointer;
  transition: all 0.3s;
}

.quick-action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.quick-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
}

.quick-action.run { color: #67c23a; }
.quick-action.fault { color: #f56c6c; }
.quick-action.change { color: #909399; }
.quick-action.wait { color: #e6a23c; }

.action-text {
  font-size: 16px;
  font-weight: 500;
}

.device-display {
  display: flex;
  align-items: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.device-name {
  margin-left: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
