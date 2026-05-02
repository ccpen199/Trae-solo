<template>
  <div class="order-create">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新建排班</span>
          <el-button @click="goBack">返回</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px" style="max-width: 800px">
        <el-form-item label="线路" prop="route_id">
          <el-select v-model="form.route_id" placeholder="请选择线路" style="width: 100%" @change="handleRouteChange">
            <el-option v-for="route in routeList" :key="route.route_id" :label="route.route_name" :value="route.route_id">
              <span>{{ route.route_name }} ({{ route.route_code }})</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="站点" v-if="selectedRoute">
          <div class="station-list">
            <el-tag v-for="station in selectedRoute.stations" :key="station.station_id" type="info" size="large">
              {{ station.order_index }}. {{ station.station_name }}
            </el-tag>
          </div>
        </el-form-item>

        <el-form-item label="司机" prop="driver_id">
          <el-select v-model="form.driver_id" placeholder="请选择司机" style="width: 100%">
            <el-option v-for="driver in driverList" :key="driver.driver_id" :label="driver.name" :value="driver.driver_id">
              <span>{{ driver.name }} ({{ driver.license_number }})</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="车辆" prop="vehicle_id">
          <el-select v-model="form.vehicle_id" placeholder="请选择车辆" style="width: 100%">
            <el-option v-for="vehicle in vehicleList" :key="vehicle.vehicle_id" :label="vehicle.plate_number" :value="vehicle.vehicle_id">
              <span>{{ vehicle.plate_number }} - {{ vehicle.vehicle_type }} ({{ vehicle.capacity }}座)</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="发车时间" prop="departure_time">
          <el-date-picker
            v-model="form.departure_time"
            type="datetime"
            placeholder="选择发车时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="期望完成时间" prop="expected_completion_time">
          <el-date-picker
            v-model="form.expected_completion_time"
            type="datetime"
            placeholder="选择期望完成时间"
            style="width: 100%"
            format="YYYY-MM-DD HH:mm"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>

        <el-form-item label="责任人" prop="assigned_to">
          <el-select v-model="form.assigned_to" placeholder="请选择责任人" style="width: 100%">
            <el-option v-for="user in userList" :key="user.user_id" :label="user.name" :value="user.user_id">
              <span>{{ user.name }} ({{ getRoleLabel(user.role) }})</span>
            </el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="备注" prop="remarks">
          <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="请输入备注"></el-input>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="handleSubmit" :loading="loading">提交</el-button>
          <el-button @click="goBack">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { mapApi, orderApi } from '@/api'
import { ElMessage } from 'element-plus'

const router = useRouter()

const formRef = ref(null)
const loading = ref(false)
const routeList = ref([])
const driverList = ref([])
const vehicleList = ref([])
const userList = ref([])

const form = reactive({
  route_id: '',
  driver_id: '',
  vehicle_id: '',
  departure_time: '',
  expected_completion_time: '',
  assigned_to: '',
  remarks: ''
})

const rules = {
  route_id: [{ required: true, message: '请选择线路', trigger: 'change' }],
  driver_id: [{ required: true, message: '请选择司机', trigger: 'change' }],
  vehicle_id: [{ required: true, message: '请选择车辆', trigger: 'change' }],
  departure_time: [{ required: true, message: '请选择发车时间', trigger: 'change' }]
}

const selectedRoute = computed(() => {
  if (!form.route_id) return null
  return routeList.value.find(r => r.route_id === form.route_id)
})

function getRoleLabel(role) {
  const labels = {
    dispatcher: '调度员',
    driver: '司机',
    passenger: '乘客',
    operator: '运营',
    maintenance: '维修'
  }
  return labels[role] || role
}

function handleRouteChange() {
  const route = selectedRoute.value
  if (route && !form.expected_completion_time && form.departure_time) {
    const departure = new Date(form.departure_time)
    const expected = new Date(departure.getTime() + route.estimated_duration_min * 60000)
    form.expected_completion_time = expected.toISOString().slice(0, 19)
  }
}

async function fetchOptions() {
  try {
    const [routes, drivers, vehicles] = await Promise.all([
      mapApi.getRoutes(),
      mapApi.getDrivers(),
      mapApi.getVehicles()
    ])
    routeList.value = routes
    driverList.value = drivers
    vehicleList.value = vehicles
    
    userList.value = [
      { user_id: 'U001', name: '张调度', role: 'dispatcher' },
      { user_id: 'U002', name: '李司机', role: 'driver' },
      { user_id: 'U003', name: '王运营', role: 'operator' }
    ]
  } catch (error) {
    console.error('获取选项失败:', error)
  }
}

async function handleSubmit() {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const result = await orderApi.create(form)
        ElMessage.success('创建成功')
        router.push(`/orders/${result.main_order_no}`)
      } catch (error) {
        console.error('创建失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}

function goBack() {
  router.push('/orders')
}

onMounted(() => {
  fetchOptions()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.station-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
