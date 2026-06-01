<template>
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px">
      <h2>GPS监控</h2>
      <el-button type="primary" @click="showDeviceDialog = true">添加设备</el-button>
      <el-button type="warning" @click="showEventDialog = true">上报事件</el-button>
    </div>

    <el-card style="margin-bottom: 20px">
      <template #header>设备列表</template>
      <el-table :data="devices" style="width: 100%">
        <el-table-column prop="device_number" label="设备编号" width="150" />
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="borrower_name" label="借款人" width="100" />
        <el-table-column prop="install_location" label="安装位置" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'installed' ? 'success' : 'danger'">
              {{ getDeviceStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_online_time" label="最后在线" width="180" />
      </el-table>
    </el-card>

    <el-card>
      <template #header>GPS事件</template>
      <el-table :data="events" style="width: 100%">
        <el-table-column prop="device_number" label="设备编号" width="150" />
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="event_type" label="事件类型" width="120">
          <template #default="scope">
            <el-tag :type="getEventTypeColor(scope.row.event_type)">{{ scope.row.event_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="is_alert" label="告警" width="80">
          <template #default="scope">
            <el-tag v-if="scope.row.is_alert" type="danger">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="event_time" label="时间" width="180" />
      </el-table>
    </el-card>

    <el-dialog v-model="showDeviceDialog" title="添加GPS设备" width="600px">
      <el-form :model="deviceForm" label-width="100px">
        <el-form-item label="车辆" required>
          <el-select v-model="deviceForm.vehicle_id" placeholder="选择车辆" style="width: 100%">
            <el-option v-for="v in vehicles" :key="v.id" :label="`${v.vin} - ${v.plate_number || '无牌'}`" :value="v.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="设备编号" required>
          <el-input v-model="deviceForm.device_number" />
        </el-form-item>
        <el-form-item label="安装位置">
          <el-input v-model="deviceForm.install_location" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDeviceDialog = false">取消</el-button>
        <el-button type="primary" @click="addDevice">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEventDialog" title="上报GPS事件" width="600px">
      <el-form :model="eventForm" label-width="100px">
        <el-form-item label="设备" required>
          <el-select v-model="eventForm.device_id" placeholder="选择设备" style="width: 100%">
            <el-option v-for="d in devices" :key="d.id" :label="d.device_number" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="事件类型" required>
          <el-select v-model="eventForm.event_type" style="width: 100%">
            <el-option label="离线" value="offline" />
            <el-option label="拆除" value="dismantle" />
            <el-option label="越界" value="cross_border" />
            <el-option label="静止超时" value="long_static" />
            <el-option label="正常" value="normal" />
          </el-select>
        </el-form-item>
        <el-form-item label="是否告警">
          <el-switch v-model="eventForm.is_alert" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="eventForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEventDialog = false">取消</el-button>
        <el-button type="primary" @click="addEvent">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../api'

const devices = ref([])
const events = ref([])
const vehicles = ref([])
const showDeviceDialog = ref(false)
const showEventDialog = ref(false)

const deviceForm = ref({
  vehicle_id: null,
  device_number: '',
  install_location: ''
})

const eventForm = ref({
  device_id: null,
  event_type: '',
  is_alert: false,
  description: ''
})

const loadVehicles = async () => {
  try {
    const res = await api.get('/vehicles')
    if (res.data.success) {
      vehicles.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadDevices = async () => {
  try {
    const res = await api.get('/gps/devices')
    if (res.data.success) {
      devices.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const loadEvents = async () => {
  try {
    const res = await api.get('/gps/events')
    if (res.data.success) {
      events.value = res.data.data
    }
  } catch (e) {
    console.error(e)
  }
}

const addDevice = async () => {
  if (!deviceForm.value.vehicle_id || !deviceForm.value.device_number) {
    ElMessage.error('请填写完整信息')
    return
  }
  try {
    const res = await api.post('/gps/devices', deviceForm.value)
    if (res.data.success) {
      ElMessage.success('设备添加成功')
      showDeviceDialog.value = false
      loadDevices()
      deviceForm.value = { vehicle_id: null, device_number: '', install_location: '' }
    }
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '添加失败')
  }
}

const addEvent = async () => {
  if (!eventForm.value.device_id || !eventForm.value.event_type) {
    ElMessage.error('请填写完整信息')
    return
  }
  try {
    const res = await api.post('/gps/events', eventForm.value)
    if (res.data.success) {
      ElMessage.success('事件上报成功')
      showEventDialog.value = false
      loadEvents()
      loadDevices()
      eventForm.value = { device_id: null, event_type: '', is_alert: false, description: '' }
    }
  } catch (e) {
    ElMessage.error('上报失败')
  }
}

const getDeviceStatusText = (status) => {
  const map = { installed: '正常', offline: '离线', dismantle: '拆除', cross_border: '越界' }
  return map[status] || status
}

const getEventTypeColor = (type) => {
  const map = { offline: 'danger', dismantle: 'danger', cross_border: 'warning', long_static: 'warning', normal: 'success' }
  return map[type] || ''
}

onMounted(() => {
  loadVehicles()
  loadDevices()
  loadEvents()
})
</script>
