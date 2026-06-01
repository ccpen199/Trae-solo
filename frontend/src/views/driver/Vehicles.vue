<template>
  <div class="vehicles-page">
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span>我的车辆</span>
          <el-button type="primary" @click="addDialogVisible = true">添加车辆</el-button>
        </div>
      </template>
      <el-table :data="vehicles" v-loading="loading">
        <el-table-column prop="plate_number" label="车牌号" width="120" />
        <el-table-column prop="vehicle_type" label="车型" width="100" />
        <el-table-column prop="vehicle_length" label="车长" width="100">
          <template #default="{ row }">{{ row.vehicle_length }}米</template>
        </el-table-column>
        <el-table-column prop="max_weight" label="载重" width="100">
          <template #default="{ row }">{{ row.max_weight }}吨</template>
        </el-table-column>
        <el-table-column prop="max_volume" label="容积" width="100">
          <template #default="{ row }">{{ row.max_volume }}方</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" type="success">正常</el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="addDialogVisible" title="添加车辆" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="车牌号" required>
          <el-input v-model="form.plate_number" placeholder="如：京A12345" />
        </el-form-item>
        <el-form-item label="车型" required>
          <el-select v-model="form.vehicle_type" style="width: 100%">
            <el-option label="面包车" value="面包车" />
            <el-option label="厢货" value="厢货" />
            <el-option label="平板" value="平板" />
            <el-option label="大货车" value="大货车" />
          </el-select>
        </el-form-item>
        <el-form-item label="车长" required>
          <el-select v-model="form.vehicle_length" style="width: 100%">
            <el-option :label="4.2 + '米'" :value="4.2" />
            <el-option :label="5.2 + '米'" :value="5.2" />
            <el-option :label="6.8 + '米'" :value="6.8" />
            <el-option :label="9.6 + '米'" :value="9.6" />
            <el-option :label="13 + '米'" :value="13" />
            <el-option :label="17.5 + '米'" :value="17.5" />
          </el-select>
        </el-form-item>
        <el-form-item label="载重">
          <el-input-number v-model="form.max_weight" :min="0" :step="0.5" /> 吨
        </el-form-item>
        <el-form-item label="容积">
          <el-input-number v-model="form.max_volume" :min="0" :step="1" /> 方
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVehicle">确认添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { vehicleAPI, driverAPI } from '@/api'

const user = JSON.parse(localStorage.getItem('user') || '{}')
const vehicles = ref([])
const loading = ref(false)
const addDialogVisible = ref(false)
const driverId = ref(null)

const form = ref({
  plate_number: '',
  vehicle_type: '厢货',
  vehicle_length: 4.2,
  max_weight: 5,
  max_volume: 15
})

const loadDriverId = async () => {
  const res = await driverAPI.list({})
  if (res.success) {
    const driver = res.data.find(d => d.user_id === user.id)
    driverId.value = driver?.id
  }
}

const loadVehicles = async () => {
  if (!driverId.value) return
  loading.value = true
  const res = await vehicleAPI.listByDriver(driverId.value)
  if (res.success) {
    vehicles.value = res.data
  }
  loading.value = false
}

const submitVehicle = async () => {
  if (!form.value.plate_number) {
    ElMessage.warning('请填写车牌号')
    return
  }
  const res = await vehicleAPI.create({
    ...form.value,
    driver_id: driverId.value
  })
  if (res.success) {
    ElMessage.success('添加成功')
    addDialogVisible.value = false
    loadVehicles()
  } else {
    ElMessage.error(res.message)
  }
}

onMounted(() => {
  loadDriverId().then(() => {
    loadVehicles()
  })
})
</script>
