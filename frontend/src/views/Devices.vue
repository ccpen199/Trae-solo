<template>
  <div class="devices">
    <el-tabs v-model="activeTab" type="card">
      <el-tab-pane label="设备管理" name="devices">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>设备列表</span>
              <div class="header-actions">
                <el-select v-model="filterLine" placeholder="按产线筛选" clearable style="width: 150px; margin-right: 10px" @change="loadDevices">
                  <el-option label="全部" :value="null" />
                  <el-option v-for="line in productionLines" :key="line.id" :label="line.name" :value="line.id" />
                </el-select>
                <el-button type="primary" @click="showDeviceDialog">
                  <el-icon><Plus /></el-icon>新增设备
                </el-button>
              </div>
            </div>
          </template>

          <el-table :data="filteredDevices" style="width: 100%" stripe>
            <el-table-column prop="code" label="设备编码" width="120" />
            <el-table-column prop="name" label="设备名称" />
            <el-table-column prop="production_line" label="所属产线" width="120">
              <template #default="{ row }">{{ row.production_line?.name || '-' }}</template>
            </el-table-column>
            <el-table-column prop="standard_cycle_time" label="标准节拍(秒)" width="120" />
            <el-table-column prop="responsible_person" label="负责人" width="100" />
            <el-table-column prop="maintenance_status" label="维护状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.maintenance_status)" size="small">{{ row.maintenance_status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="is_active" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="editDevice(row)">编辑</el-button>
                <el-button size="small" type="warning" @click="viewDeviceOEE(row)">OEE</el-button>
                <el-button size="small" :type="row.is_active ? 'danger' : 'success'" @click="toggleDevice(row)">
                  {{ row.is_active ? '停用' : '启用' }}
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="产线管理" name="lines">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>产线列表</span>
              <el-button type="primary" @click="showLineDialog">
                <el-icon><Plus /></el-icon>新增产线
              </el-button>
            </div>
          </template>

          <el-table :data="productionLines" style="width: 100%" stripe>
            <el-table-column prop="name" label="产线名称" width="200" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="设备数量" width="100">
              <template #default="{ row }">
                {{ getDeviceCountByLine(row.id) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="editLine(row)">编辑</el-button>
                <el-button size="small" type="danger" :disabled="getDeviceCountByLine(row.id) > 0" @click="deleteLine(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="班次管理" name="shifts">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>班次列表</span>
              <el-button type="primary" @click="showShiftDialog">
                <el-icon><Plus /></el-icon>新增班次
              </el-button>
            </div>
          </template>

          <el-table :data="shifts" style="width: 100%" stripe>
            <el-table-column prop="name" label="班次名称" width="150" />
            <el-table-column prop="start_time" label="开始时间" width="120" />
            <el-table-column prop="end_time" label="结束时间" width="120" />
            <el-table-column label="时长(小时)" width="100">
              <template #default="{ row }">{{ getShiftDuration(row) }}</template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="150">
              <template #default="{ row }">
                <el-button size="small" @click="editShift(row)">编辑</el-button>
                <el-button size="small" type="danger" @click="deleteShift(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="deviceDialogVisible" :title="isDeviceEdit ? '编辑设备' : '新增设备'" width="600px">
      <el-form :model="deviceForm" label-width="100px" :rules="deviceRules" ref="deviceFormRef">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="设备编码" prop="code">
              <el-input v-model="deviceForm.code" :disabled="isDeviceEdit" placeholder="请输入设备编码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="设备名称" prop="name">
              <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="所属产线" prop="production_line_id">
              <el-select v-model="deviceForm.production_line_id" placeholder="请选择产线" style="width: 100%">
                <el-option v-for="line in productionLines" :key="line.id" :label="line.name" :value="line.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="标准节拍(秒)" prop="standard_cycle_time">
              <el-input-number v-model="deviceForm.standard_cycle_time" :min="1" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="负责人" prop="responsible_person">
              <el-input v-model="deviceForm.responsible_person" placeholder="请输入负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="维护状态" prop="maintenance_status">
              <el-select v-model="deviceForm.maintenance_status" style="width: 100%">
                <el-option label="正常" value="正常" />
                <el-option label="保养中" value="保养中" />
                <el-option label="维修中" value="维修中" />
                <el-option label="已报废" value="已报废" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="设备状态">
          <el-switch v-model="deviceForm.is_active" active-text="启用" inactive-text="停用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="deviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDevice">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="lineDialogVisible" :title="isLineEdit ? '编辑产线' : '新增产线'" width="500px">
      <el-form :model="lineForm" label-width="100px">
        <el-form-item label="产线名称">
          <el-input v-model="lineForm.name" placeholder="请输入产线名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="lineForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="lineDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveLine">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="shiftDialogVisible" :title="isShiftEdit ? '编辑班次' : '新增班次'" width="500px">
      <el-form :model="shiftForm" label-width="100px">
        <el-form-item label="班次名称">
          <el-input v-model="shiftForm.name" placeholder="请输入班次名称" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-time-picker v-model="shiftForm.start_time" format="HH:mm" value-format="HH:mm" placeholder="选择开始时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker v-model="shiftForm.end_time" format="HH:mm" value-format="HH:mm" placeholder="选择结束时间" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shiftDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveShift">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="oeeDialogVisible" :title="`${currentDevice?.name} - OEE 详情`" width="800px">
      <div v-if="deviceOEEData">
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :span="6">
            <div class="stat-card">
              <div class="label">OEE</div>
              <div class="value" :class="getOEEClass(deviceOEEData.oee)">{{ deviceOEEData.oee }}%</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="label">可用率</div>
              <div class="value">{{ deviceOEEData.availability }}%</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="label">性能率</div>
              <div class="value">{{ deviceOEEData.performance }}%</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-card">
              <div class="label">良品率</div>
              <div class="value">{{ deviceOEEData.quality }}%</div>
            </div>
          </el-col>
        </el-row>
        <el-table :data="deviceDowntime" style="width: 100%" max-height="300">
          <el-table-column prop="record_type" label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="getRecordTypeClass(row.record_type)" size="small">{{ row.record_type }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="downtime_reason" label="停机原因" />
          <el-table-column prop="duration_minutes" label="时长(分)" width="100" />
          <el-table-column prop="start_time" label="时间" width="180">
            <template #default="{ row }">{{ formatDate(row.start_time) }}</template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="oeeDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getDevices, createDevice, updateDevice, getProductionLines, createProductionLine, getShifts, createShift, getOEE, getDowntimeEvents } from '../api'

const activeTab = ref('devices')
const filterLine = ref(null)
const devices = ref([])
const productionLines = ref([])
const shifts = ref([])

const deviceDialogVisible = ref(false)
const lineDialogVisible = ref(false)
const shiftDialogVisible = ref(false)
const oeeDialogVisible = ref(false)

const isDeviceEdit = ref(false)
const isLineEdit = ref(false)
const isShiftEdit = ref(false)

const deviceFormRef = ref(null)
const deviceForm = ref({
  code: '',
  name: '',
  production_line_id: null,
  standard_cycle_time: 60,
  responsible_person: '',
  maintenance_status: '正常',
  is_active: true
})

const lineForm = ref({
  name: '',
  description: ''
})

const shiftForm = ref({
  name: '',
  start_time: '08:00',
  end_time: '16:00'
})

const currentDevice = ref(null)
const deviceOEEData = ref(null)
const deviceDowntime = ref([])

const deviceRules = {
  code: [{ required: true, message: '请输入设备编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  standard_cycle_time: [{ required: true, message: '请输入标准节拍', trigger: 'blur' }]
}

const filteredDevices = computed(() => {
  if (!filterLine.value) return devices.value
  return devices.value.filter(d => d.production_line_id === filterLine.value)
})

const getStatusType = (status) => {
  const types = { '正常': 'success', '保养中': 'warning', '维修中': 'danger', '已报废': 'info' }
  return types[status] || 'info'
}

const getOEEClass = (value) => {
  if (value >= 85) return 'oee-high'
  if (value >= 60) return 'oee-medium'
  return 'oee-low'
}

const getRecordTypeClass = (type) => {
  const types = { '故障停机': 'danger', '待料': 'warning', '换线': 'info', '计划停机': '', '保养': 'success' }
  return types[type] || 'info'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

const getDeviceCountByLine = (lineId) => {
  return devices.value.filter(d => d.production_line_id === lineId).length
}

const getShiftDuration = (shift) => {
  const start = parseInt(shift.start_time.split(':')[0])
  const end = parseInt(shift.end_time.split(':')[0])
  let duration = end - start
  if (duration < 0) duration += 24
  return duration
}

const loadDevices = async () => {
  try {
    const res = await getDevices()
    devices.value = res.data
  } catch (error) {
    ElMessage.error('加载设备失败')
  }
}

const loadProductionLines = async () => {
  try {
    const res = await getProductionLines()
    productionLines.value = res.data
  } catch (error) {
    ElMessage.error('加载产线失败')
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

const showDeviceDialog = () => {
  isDeviceEdit.value = false
  deviceForm.value = {
    code: '',
    name: '',
    production_line_id: null,
    standard_cycle_time: 60,
    responsible_person: '',
    maintenance_status: '正常',
    is_active: true
  }
  deviceDialogVisible.value = true
}

const editDevice = (row) => {
  isDeviceEdit.value = true
  deviceForm.value = { ...row }
  deviceDialogVisible.value = true
}

const saveDevice = async () => {
  try {
    if (isDeviceEdit.value) {
      await updateDevice(deviceForm.value.id, deviceForm.value)
      ElMessage.success('更新成功')
    } else {
      await createDevice(deviceForm.value)
      ElMessage.success('创建成功')
    }
    deviceDialogVisible.value = false
    loadDevices()
  } catch (error) {
    ElMessage.error(error.response?.data?.detail || '保存失败')
  }
}

const toggleDevice = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要${row.is_active ? '停用' : '启用'}设备 ${row.name} 吗？`,
      '确认操作',
      { type: 'warning' }
    )
    await updateDevice(row.id, { is_active: !row.is_active })
    ElMessage.success(row.is_active ? '已停用' : '已启用')
    loadDevices()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('操作失败')
  }
}

const viewDeviceOEE = async (row) => {
  currentDevice.value = row
  try {
    const [oeeRes, downtimeRes] = await Promise.all([
      getOEE({ device_id: row.id }),
      getDowntimeEvents({ device_id: row.id })
    ])
    deviceOEEData.value = oeeRes.data
    deviceDowntime.value = downtimeRes.data
    oeeDialogVisible.value = true
  } catch (error) {
    ElMessage.error('加载OEE数据失败')
  }
}

const showLineDialog = () => {
  isLineEdit.value = false
  lineForm.value = { name: '', description: '' }
  lineDialogVisible.value = true
}

const editLine = (row) => {
  isLineEdit.value = true
  lineForm.value = { ...row }
  lineDialogVisible.value = true
}

const saveLine = async () => {
  try {
    await createProductionLine(lineForm.value)
    ElMessage.success('保存成功')
    lineDialogVisible.value = false
    loadProductionLines()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deleteLine = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除产线 ${row.name} 吗？`, '确认删除', { type: 'warning' })
    ElMessage.success('删除成功')
    loadProductionLines()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

const showShiftDialog = () => {
  isShiftEdit.value = false
  shiftForm.value = { name: '', start_time: '08:00', end_time: '16:00' }
  shiftDialogVisible.value = true
}

const editShift = (row) => {
  isShiftEdit.value = true
  shiftForm.value = { ...row }
  shiftDialogVisible.value = true
}

const saveShift = async () => {
  try {
    await createShift(shiftForm.value)
    ElMessage.success('保存成功')
    shiftDialogVisible.value = false
    loadShifts()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

const deleteShift = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除班次 ${row.name} 吗？`, '确认删除', { type: 'warning' })
    ElMessage.success('删除成功')
    loadShifts()
  } catch (error) {
    if (error !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadDevices()
  loadProductionLines()
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

.stat-card {
  padding: 20px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #ebeef5;
  text-align: center;
}

.stat-card .label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-card .value {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.oee-high { color: #67c23a !important; }
.oee-medium { color: #e6a23c !important; }
.oee-low { color: #f56c6c !important; }
</style>
