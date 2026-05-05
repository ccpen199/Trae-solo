<template>
  <div class="vehicle-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>车辆列表</span>
          <el-button type="primary" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>添加车辆
          </el-button>
        </div>
      </template>
      
      <el-table :data="tableData" style="width: 100%" v-loading="loading">
        <el-table-column prop="plate_number" label="车牌号" width="120" />
        <el-table-column prop="vehicle_type" label="车辆类型" width="100" />
        <el-table-column prop="vehicle_model" label="车型" width="120" />
        <el-table-column prop="capacity" label="容积(m³)" width="100" />
        <el-table-column prop="load_limit" label="载重(kg)" width="100" />
        <el-table-column prop="fuel_type" label="燃料类型" width="80" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="driver_name" label="绑定司机" width="100" />
        <el-table-column prop="current_address" label="当前位置" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="primary" link @click="viewMonitor(row)">监控</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>
    
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑车辆' : '添加车辆'"
      width="500px"
    >
      <el-form :model="vehicleForm" :rules="vehicleRules" ref="vehicleFormRef" label-width="100px">
        <el-form-item label="车牌号" prop="plate_number">
          <el-input v-model="vehicleForm.plate_number" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="车辆类型" prop="vehicle_type">
          <el-select v-model="vehicleForm.vehicle_type" placeholder="请选择车辆类型" style="width: 100%">
            <el-option label="厢式货车" value="厢式货车" />
            <el-option label="冷藏车" value="冷藏车" />
            <el-option label="平板车" value="平板车" />
            <el-option label="挂车" value="挂车" />
          </el-select>
        </el-form-item>
        <el-form-item label="车型" prop="vehicle_model">
          <el-input v-model="vehicleForm.vehicle_model" placeholder="请输入车型" />
        </el-form-item>
        <el-form-item label="容积(m³)" prop="capacity">
          <el-input-number v-model="vehicleForm.capacity" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="载重(kg)" prop="load_limit">
          <el-input-number v-model="vehicleForm.load_limit" :min="0" :precision="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="燃料类型" prop="fuel_type">
          <el-select v-model="vehicleForm.fuel_type" placeholder="请选择燃料类型" style="width: 100%">
            <el-option label="柴油" value="柴油" />
            <el-option label="汽油" value="汽油" />
            <el-option label="新能源" value="新能源" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="vehicleForm.status" placeholder="请选择状态" style="width: 100%">
            <el-option label="空闲" value="idle" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="运输中" value="transit" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getVehicleList, createVehicle, updateVehicle } from '@/api/vehicles'

const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const vehicleFormRef = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const vehicleForm = reactive({
  plate_number: '',
  vehicle_type: '',
  vehicle_model: '',
  capacity: 0,
  load_limit: 0,
  fuel_type: '柴油',
  status: 'idle'
})

const vehicleRules = {
  plate_number: [{ required: true, message: '请输入车牌号', trigger: 'blur' }]
}

const getStatusType = (status) => {
  const typeMap = {
    idle: 'success',
    maintenance: 'warning',
    transit: 'primary',
    loading: 'warning',
    unloading: 'warning'
  }
  return typeMap[status] || 'info'
}

const getStatusText = (status) => {
  const textMap = {
    idle: '空闲',
    maintenance: '维护中',
    transit: '运输中',
    loading: '装货中',
    unloading: '卸货中'
  }
  return textMap[status] || status
}

const fetchVehicleList = async () => {
  loading.value = true
  try {
    const res = await getVehicleList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('获取车辆列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSizeChange = (val) => {
  pagination.pageSize = val
  fetchVehicleList()
}

const handleCurrentChange = (val) => {
  pagination.page = val
  fetchVehicleList()
}

const openCreateDialog = () => {
  isEdit.value = false
  Object.assign(vehicleForm, {
    plate_number: '',
    vehicle_type: '',
    vehicle_model: '',
    capacity: 0,
    load_limit: 0,
    fuel_type: '柴油',
    status: 'idle'
  })
  dialogVisible.value = true
}

const openEditDialog = (row) => {
  isEdit.value = true
  vehicleForm.id = row.id
  Object.assign(vehicleForm, row)
  dialogVisible.value = true
}

const viewMonitor = (row) => {
  router.push('/vehicles/monitor')
}

const submitForm = async () => {
  if (!vehicleFormRef.value) return
  
  await vehicleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await updateVehicle(vehicleForm.id, vehicleForm)
          ElMessage.success('编辑成功')
        } else {
          await createVehicle(vehicleForm)
          ElMessage.success('添加成功')
        }
        dialogVisible.value = false
        fetchVehicleList()
      } catch (error) {
        console.error('提交失败:', error)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchVehicleList()
})
</script>

<style scoped>
.vehicle-list {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
