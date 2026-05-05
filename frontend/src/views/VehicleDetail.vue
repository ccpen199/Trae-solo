<template>
  <div>
    <div class="page-header">
      <el-breadcrumb separator="/" style="margin-bottom: 12px;">
        <el-breadcrumb-item :to="{ path: '/vehicles' }">车辆档案</el-breadcrumb-item>
        <el-breadcrumb-item>车辆详情</el-breadcrumb-item>
      </el-breadcrumb>
      <h2>车辆详情</h2>
    </div>

    <el-card shadow="hover" v-loading="loading">
      <el-descriptions title="基本信息" :column="4" border>
        <el-descriptions-item label="VIN码">{{ vehicle.vin || '-' }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ vehicle.license_plate || '-' }}</el-descriptions-item>
        <el-descriptions-item label="车型">{{ vehicle.model_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="vehicle.status === 'active' ? 'success' : 'info'">
            {{ vehicle.status === 'active' ? '活跃' : '停用' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="ECU编号">{{ vehicle.ecu_serial || '-' }}</el-descriptions-item>
        <el-descriptions-item label="ECU型号">{{ vehicle.ecu_model || '-' }}</el-descriptions-item>
        <el-descriptions-item label="发动机号">{{ vehicle.engine_number || '-' }}</el-descriptions-item>
        <el-descriptions-item label="里程(km)">{{ vehicle.mileage?.toFixed(2) || 0 }}</el-descriptions-item>
        <el-descriptions-item label="生产日期">{{ vehicle.production_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="购买日期">{{ vehicle.purchase_date || '-' }}</el-descriptions-item>
        <el-descriptions-item label="车主">{{ vehicle.owner_name || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系电话">{{ vehicle.owner_phone || '-' }}</el-descriptions-item>
        <el-descriptions-item label="备注" :span="4">{{ vehicle.remarks || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-tabs v-model="activeTab" style="margin-top: 20px;">
      <el-tab-pane label="传感器清单" name="sensors">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>传感器列表</span>
              <el-button type="primary" size="small" @click="showSensorDialog = true">
                添加传感器
              </el-button>
            </div>
          </template>
          <el-table :data="vehicle.sensors || []" style="width: 100%">
            <el-table-column prop="sensor_code" label="传感器代码" width="150" />
            <el-table-column prop="sensor_name" label="传感器名称" width="180" />
            <el-table-column prop="sensor_type" label="类型" width="100" />
            <el-table-column prop="unit" label="单位" width="80" />
            <el-table-column prop="min_value" label="最小值" width="100" />
            <el-table-column prop="max_value" label="最大值" width="100" />
            <el-table-column prop="warning_min" label="预警下限" width="100" />
            <el-table-column prop="warning_max" label="预警上限" width="100" />
            <el-table-column prop="position" label="安装位置" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="执行器清单" name="actuators">
        <el-card shadow="hover">
          <template #header>
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span>执行器列表</span>
              <el-button type="primary" size="small" @click="showActuatorDialog = true">
                添加执行器
              </el-button>
            </div>
          </template>
          <el-table :data="vehicle.actuators || []" style="width: 100%">
            <el-table-column prop="actuator_code" label="执行器代码" width="150" />
            <el-table-column prop="actuator_name" label="执行器名称" width="180" />
            <el-table-column prop="actuator_type" label="类型" width="100" />
            <el-table-column prop="control_method" label="控制方式" width="120" />
            <el-table-column prop="working_voltage" label="工作电压(V)" width="120" />
            <el-table-column prop="position" label="安装位置" />
            <el-table-column prop="description" label="描述" />
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="历史诊断" name="diagnostics">
        <el-card shadow="hover">
          <template #header>
            <span>历史故障记录</span>
          </template>
          <el-table :data="vehicle.recentFaults || []" style="width: 100%">
            <el-table-column prop="fault_code" label="故障码" width="120" />
            <el-table-column prop="fault_name" label="故障名称" />
            <el-table-column prop="fault_category" label="故障类别" width="120">
              <template #default="scope">
                <el-tag size="small">{{ scope.row.fault_category }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="severity" label="严重程度" width="100">
              <template #default="scope">
                <span :class="`status-tag severity-${scope.row.severity}`">
                  {{ scope.row.severity === 'high' ? '高' : scope.row.severity === 'medium' ? '中' : '低' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <span :class="`status-tag status-${scope.row.status}`">
                  {{ scope.row.status === 'active' ? '活跃' : scope.row.status === 'cleared' ? '已清除' : '已修复' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="occurrence_time" label="发生时间" width="180">
              <template #default="scope">
                {{ formatTime(scope.row.occurrence_time) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="scope">
                <el-button type="primary" link @click="goToFaultDetail(scope.row.id)">
                  详情
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showSensorDialog" title="添加传感器" width="600px">
      <el-form :model="sensorForm" label-width="120px">
        <el-form-item label="传感器代码">
          <el-input v-model="sensorForm.sensor_code" placeholder="请输入传感器代码" />
        </el-form-item>
        <el-form-item label="传感器名称">
          <el-input v-model="sensorForm.sensor_name" placeholder="请输入传感器名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="sensorForm.sensor_type" placeholder="请输入类型" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="sensorForm.unit" placeholder="请输入单位" />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="最小值">
              <el-input-number v-model="sensorForm.min_value" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="最大值">
              <el-input-number v-model="sensorForm.max_value" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="安装位置">
          <el-input v-model="sensorForm.position" placeholder="请输入安装位置" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSensorDialog = false">取消</el-button>
        <el-button type="primary" @click="submitSensor">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showActuatorDialog" title="添加执行器" width="600px">
      <el-form :model="actuatorForm" label-width="120px">
        <el-form-item label="执行器代码">
          <el-input v-model="actuatorForm.actuator_code" placeholder="请输入执行器代码" />
        </el-form-item>
        <el-form-item label="执行器名称">
          <el-input v-model="actuatorForm.actuator_name" placeholder="请输入执行器名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="actuatorForm.actuator_type" placeholder="请输入类型" />
        </el-form-item>
        <el-form-item label="控制方式">
          <el-input v-model="actuatorForm.control_method" placeholder="请输入控制方式" />
        </el-form-item>
        <el-form-item label="工作电压">
          <el-input-number v-model="actuatorForm.working_voltage" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="安装位置">
          <el-input v-model="actuatorForm.position" placeholder="请输入安装位置" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showActuatorDialog = false">取消</el-button>
        <el-button type="primary" @click="submitActuator">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()

const vehicleId = route.params.id
const loading = ref(false)
const activeTab = ref('sensors')
const showSensorDialog = ref(false)
const showActuatorDialog = ref(false)

const vehicle = ref({
  sensors: [],
  actuators: [],
  recentFaults: [],
})

const sensorForm = reactive({
  sensor_code: '',
  sensor_name: '',
  sensor_type: '',
  unit: '',
  min_value: null,
  max_value: null,
  warning_min: null,
  warning_max: null,
  position: '',
})

const actuatorForm = reactive({
  actuator_code: '',
  actuator_name: '',
  actuator_type: '',
  control_method: '',
  working_voltage: null,
  position: '',
})

const fetchVehicleDetail = async () => {
  loading.value = true
  try {
    const data = await request.get(`/vehicles/${vehicleId}`)
    vehicle.value = data
  } catch (err) {
    console.error('获取车辆详情失败:', err)
  } finally {
    loading.value = false
  }
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const goToFaultDetail = (id) => {
  router.push(`/faults/${id}`)
}

const submitSensor = async () => {
  try {
    await request.post(`/vehicles/${vehicleId}/sensors`, sensorForm)
    ElMessage.success('添加成功')
    showSensorDialog.value = false
    fetchVehicleDetail()
  } catch (err) {
    console.error('添加传感器失败:', err)
  }
}

const submitActuator = async () => {
  try {
    await request.post(`/vehicles/${vehicleId}/actuators`, actuatorForm)
    ElMessage.success('添加成功')
    showActuatorDialog.value = false
    fetchVehicleDetail()
  } catch (err) {
    console.error('添加执行器失败:', err)
  }
}

onMounted(() => {
  fetchVehicleDetail()
})
</script>
