<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>车辆档案</h2>
        <div class="description">管理车辆基本信息、ECU参数、传感器和执行器清单</div>
      </div>
      <el-button type="primary" @click="handleCreateVehicle">
        <el-icon><Plus /></el-icon>
        新增车辆
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="搜索">
          <el-input
            v-model="searchForm.search"
            placeholder="VIN/车牌号/ECU编号/车主姓名"
            clearable
            @keyup.enter="fetchVehicles"
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item label="车型">
          <el-select v-model="searchForm.model_id" placeholder="全部车型" clearable style="width: 150px">
            <el-option
              v-for="model in vehicleModels"
              :key="model.id"
              :label="model.model_name"
              :value="model.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="活跃" value="active" />
            <el-option label="停用" value="inactive" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchVehicles">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" style="margin-top: 20px;">
      <el-table :data="vehicles" style="width: 100%" v-loading="loading">
        <el-table-column prop="vin" label="VIN码" width="180" />
        <el-table-column prop="license_plate" label="车牌号" width="120" />
        <el-table-column prop="model_name" label="车型" />
        <el-table-column prop="ecu_serial" label="ECU编号" width="160" />
        <el-table-column prop="ecu_model" label="ECU型号" width="120" />
        <el-table-column prop="engine_number" label="发动机号" width="140" />
        <el-table-column prop="mileage" label="里程(km)" width="100">
          <template #default="scope">
            {{ scope.row.mileage?.toFixed(2) || 0 }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'active' ? 'success' : 'info'">
              {{ scope.row.status === 'active' ? '活跃' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner_name" label="车主" width="100" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleView(scope.row)">详情</el-button>
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchVehicles"
        @current-change="fetchVehicles"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="vehicleDialogVisible"
      :title="isEdit ? '编辑车辆' : '新增车辆'"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="vehicleFormRef"
        :model="vehicleForm"
        :rules="vehicleRules"
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="VIN码" prop="vin">
              <el-input v-model="vehicleForm.vin" placeholder="请输入VIN码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车牌号" prop="license_plate">
              <el-input v-model="vehicleForm.license_plate" placeholder="请输入车牌号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车型" prop="model_id">
              <el-select v-model="vehicleForm.model_id" placeholder="请选择车型" style="width: 100%">
                <el-option
                  v-for="model in vehicleModels"
                  :key="model.id"
                  :label="model.model_name"
                  :value="model.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="ECU编号" prop="ecu_serial">
              <el-input v-model="vehicleForm.ecu_serial" placeholder="请输入ECU编号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="ECU型号">
              <el-input v-model="vehicleForm.ecu_model" placeholder="请输入ECU型号" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发动机号">
              <el-input v-model="vehicleForm.engine_number" placeholder="请输入发动机号" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产日期">
              <el-date-picker
                v-model="vehicleForm.production_date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="购买日期">
              <el-date-picker
                v-model="vehicleForm.purchase_date"
                type="date"
                placeholder="选择日期"
                value-format="YYYY-MM-DD"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="里程(km)">
              <el-input-number v-model="vehicleForm.mileage" :min="0" :precision="2" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态">
              <el-select v-model="vehicleForm.status" style="width: 100%">
                <el-option label="活跃" value="active" />
                <el-option label="停用" value="inactive" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车主姓名">
              <el-input v-model="vehicleForm.owner_name" placeholder="请输入车主姓名" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="vehicleForm.owner_phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="备注">
          <el-input
            v-model="vehicleForm.remarks"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="vehicleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitVehicleForm" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const router = useRouter()

const loading = ref(false)
const submitLoading = ref(false)
const vehicleDialogVisible = ref(false)
const isEdit = ref(false)
const currentVehicleId = ref(null)

const vehicleFormRef = ref(null)

const vehicles = ref([])
const vehicleModels = ref([])

const searchForm = reactive({
  search: '',
  model_id: null,
  status: '',
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
})

const vehicleForm = reactive({
  vin: '',
  license_plate: '',
  model_id: null,
  ecu_serial: '',
  ecu_model: '',
  engine_number: '',
  production_date: '',
  purchase_date: '',
  mileage: 0,
  status: 'active',
  owner_name: '',
  owner_phone: '',
  remarks: '',
})

const vehicleRules = {
  model_id: [{ required: true, message: '请选择车型', trigger: 'change' }],
  ecu_serial: [{ required: true, message: '请输入ECU编号', trigger: 'blur' }],
}

const fetchVehicleModels = async () => {
  try {
    const data = await request.get('/vehicles/models')
    vehicleModels.value = data
  } catch (err) {
    console.error('获取车型列表失败:', err)
  }
}

const fetchVehicles = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
    }
    const data = await request.get('/vehicles', { params })
    vehicles.value = data.vehicles
    pagination.total = data.pagination.total
  } catch (err) {
    console.error('获取车辆列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.search = ''
  searchForm.model_id = null
  searchForm.status = ''
  pagination.page = 1
  fetchVehicles()
}

const handleCreateVehicle = () => {
  isEdit.value = false
  currentVehicleId.value = null
  Object.assign(vehicleForm, {
    vin: '',
    license_plate: '',
    model_id: null,
    ecu_serial: '',
    ecu_model: '',
    engine_number: '',
    production_date: '',
    purchase_date: '',
    mileage: 0,
    status: 'active',
    owner_name: '',
    owner_phone: '',
    remarks: '',
  })
  vehicleDialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  currentVehicleId.value = row.id
  Object.assign(vehicleForm, { ...row })
  vehicleDialogVisible.value = true
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除车辆 ${row.vin || row.ecu_serial} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.delete(`/vehicles/${row.id}`)
        ElMessage.success('删除成功')
        fetchVehicles()
      } catch (err) {
        console.error('删除失败:', err)
      }
    })
    .catch(() => {})
}

const handleView = (row) => {
  router.push(`/vehicles/${row.id}`)
}

const submitVehicleForm = async () => {
  if (!vehicleFormRef.value) return

  await vehicleFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        if (isEdit.value) {
          await request.put(`/vehicles/${currentVehicleId.value}`, vehicleForm)
          ElMessage.success('更新成功')
        } else {
          await request.post('/vehicles', vehicleForm)
          ElMessage.success('创建成功')
        }
        vehicleDialogVisible.value = false
        fetchVehicles()
      } catch (err) {
        console.error('提交失败:', err)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchVehicleModels()
  fetchVehicles()
})
</script>
