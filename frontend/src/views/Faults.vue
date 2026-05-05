<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>故障诊断</h2>
        <div class="description">管理故障记录、查看故障详情和处理建议</div>
      </div>
      <el-button type="primary" @click="handleCreateFault">
        <el-icon><Plus /></el-icon>
        新增故障
      </el-button>
    </div>

    <el-card shadow="hover">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="车辆">
          <el-select v-model="searchForm.vehicle_id" placeholder="全部车辆" clearable filterable style="width: 200px">
            <el-option
              v-for="v in vehiclesList"
              :key="v.id"
              :label="v.vin || v.ecu_serial"
              :value="v.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="活跃" value="active" />
            <el-option label="已清除" value="cleared" />
            <el-option label="已修复" value="repaired" />
          </el-select>
        </el-form-item>
        <el-form-item label="故障类别">
          <el-select v-model="searchForm.fault_category" placeholder="全部类别" clearable style="width: 140px">
            <el-option label="传感器异常" value="传感器异常" />
            <el-option label="执行器驱动异常" value="执行器驱动异常" />
            <el-option label="通讯异常" value="通讯异常" />
            <el-option label="标定不一致" value="标定不一致" />
          </el-select>
        </el-form-item>
        <el-form-item label="严重程度">
          <el-select v-model="searchForm.severity" placeholder="全部级别" clearable style="width: 120px">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchFaults">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" style="margin-top: 20px;">
      <el-table :data="faultRecords" style="width: 100%" v-loading="loading">
        <el-table-column prop="fault_code" label="故障码" width="120" />
        <el-table-column prop="fault_name" label="故障名称" min-width="200" />
        <el-table-column prop="vin" label="车辆VIN" width="160" />
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
            <el-tag :type="getFaultStatusType(scope.row.status)">
              {{ getFaultStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="occurrence_time" label="发生时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.occurrence_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleView(scope.row)">详情</el-button>
            <el-button 
              v-if="scope.row.status === 'active'" 
              type="success" 
              link 
              @click="handleClear(scope.row)"
            >
              清除
            </el-button>
            <el-button 
              v-if="scope.row.status === 'active'" 
              type="warning" 
              link 
              @click="handleRepair(scope.row)"
            >
              维修
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchFaults"
        @current-change="fetchFaults"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="faultDialogVisible"
      title="新增故障记录"
      width="700px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="faultFormRef"
        :model="faultForm"
        :rules="faultRules"
        label-width="120px"
      >
        <el-form-item label="车辆" prop="vehicle_id">
          <el-select v-model="faultForm.vehicle_id" placeholder="请选择车辆" filterable style="width: 100%">
            <el-option
              v-for="v in vehiclesList"
              :key="v.id"
              :label="v.vin || v.ecu_serial"
              :value="v.id"
            />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="故障码" prop="fault_code">
              <el-input v-model="faultForm.fault_code" placeholder="请输入故障码" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="故障名称" prop="fault_name">
              <el-input v-model="faultForm.fault_name" placeholder="请输入故障名称" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="故障类别">
              <el-select v-model="faultForm.fault_category" placeholder="请选择故障类别" style="width: 100%">
                <el-option label="传感器异常" value="传感器异常" />
                <el-option label="执行器驱动异常" value="执行器驱动异常" />
                <el-option label="通讯异常" value="通讯异常" />
                <el-option label="标定不一致" value="标定不一致" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="严重程度">
              <el-select v-model="faultForm.severity" placeholder="请选择严重程度" style="width: 100%">
                <el-option label="高" value="high" />
                <el-option label="中" value="medium" />
                <el-option label="低" value="low" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="详情">
          <el-input
            v-model="faultForm.details"
            type="textarea"
            :rows="3"
            placeholder="请输入故障详情"
          />
        </el-form-item>
        <el-form-item label="处理建议">
          <el-input
            v-model="faultForm.suggestion"
            type="textarea"
            :rows="3"
            placeholder="请输入处理建议"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="faultDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitFaultForm" :loading="submitLoading">
          确定
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="repairDialogVisible"
      title="维修故障"
      width="500px"
    >
      <el-form label-width="80px">
        <el-form-item label="维修结果">
          <el-input
            v-model="repairResult"
            type="textarea"
            :rows="4"
            placeholder="请输入维修结果详情"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="repairDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitRepair" :loading="repairLoading">
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
const repairLoading = ref(false)
const faultDialogVisible = ref(false)
const repairDialogVisible = ref(false)
const currentFaultId = ref(null)
const repairResult = ref('')

const faultFormRef = ref(null)
const faultRecords = ref([])
const vehiclesList = ref([])

const searchForm = reactive({
  vehicle_id: null,
  status: '',
  fault_category: '',
  severity: '',
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
})

const faultForm = reactive({
  vehicle_id: null,
  fault_code: '',
  fault_name: '',
  fault_category: '传感器异常',
  severity: 'medium',
  details: '',
  suggestion: '',
})

const faultRules = {
  vehicle_id: [{ required: true, message: '请选择车辆', trigger: 'change' }],
  fault_code: [{ required: true, message: '请输入故障码', trigger: 'blur' }],
  fault_name: [{ required: true, message: '请输入故障名称', trigger: 'blur' }],
}

const fetchVehicles = async () => {
  try {
    const params = {
      page: 1,
      limit: 1000,
    }
    const data = await request.get('/vehicles', { params })
    vehiclesList.value = data.vehicles
  } catch (err) {
    console.error('获取车辆列表失败:', err)
  }
}

const fetchFaults = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
    }
    const data = await request.get('/faults/records', { params })
    faultRecords.value = data.records
    pagination.total = data.pagination.total
  } catch (err) {
    console.error('获取故障列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.vehicle_id = null
  searchForm.status = ''
  searchForm.fault_category = ''
  searchForm.severity = ''
  pagination.page = 1
  fetchFaults()
}

const getFaultStatusType = (status) => {
  const types = {
    active: 'warning',
    cleared: 'info',
    repaired: 'success',
  }
  return types[status] || 'info'
}

const getFaultStatusText = (status) => {
  const texts = {
    active: '活跃',
    cleared: '已清除',
    repaired: '已修复',
  }
  return texts[status] || status
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const handleCreateFault = () => {
  Object.assign(faultForm, {
    vehicle_id: null,
    fault_code: '',
    fault_name: '',
    fault_category: '传感器异常',
    severity: 'medium',
    details: '',
    suggestion: '',
  })
  faultDialogVisible.value = true
}

const handleView = (row) => {
  router.push(`/faults/${row.id}`)
}

const handleClear = (row) => {
  ElMessageBox.confirm('确定要清除此故障吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.put(`/faults/records/${row.id}/clear`)
        ElMessage.success('清除成功')
        fetchFaults()
      } catch (err) {
        console.error('清除失败:', err)
      }
    })
    .catch(() => {})
}

const handleRepair = (row) => {
  currentFaultId.value = row.id
  repairResult.value = ''
  repairDialogVisible.value = true
}

const submitRepair = async () => {
  if (!repairResult.value.trim()) {
    ElMessage.warning('请输入维修结果')
    return
  }
  repairLoading.value = true
  try {
    await request.put(`/faults/records/${currentFaultId.value}/repair`, {
      repair_result: repairResult.value,
    })
    ElMessage.success('维修完成')
    repairDialogVisible.value = false
    fetchFaults()
  } catch (err) {
    console.error('维修失败:', err)
  } finally {
    repairLoading.value = false
  }
}

const submitFaultForm = async () => {
  if (!faultFormRef.value) return

  await faultFormRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await request.post('/faults/records', faultForm)
        ElMessage.success('创建成功')
        faultDialogVisible.value = false
        fetchFaults()
      } catch (err) {
        console.error('提交失败:', err)
      } finally {
        submitLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchVehicles()
  fetchFaults()
})
</script>
