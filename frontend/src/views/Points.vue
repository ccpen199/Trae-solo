<template>
  <div class="points">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>监测点位管理</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增点位
          </el-button>
        </div>
      </template>
      
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="在线" value="online" />
            <el-option label="离线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="name" label="点位名称" />
        <el-table-column prop="device_code" label="设备编号" />
        <el-table-column prop="location" label="位置" />
        <el-table-column prop="construction_stage" label="施工阶段" />
        <el-table-column prop="responsible_unit" label="责任单位" />
        <el-table-column label="阈值配置">
          <template #default="{ row }">
            <div>PM2.5: {{ row.pm25_threshold }}</div>
            <div>PM10: {{ row.pm10_threshold }}</div>
            <div>噪声: {{ row.noise_threshold }}dB</div>
          </template>
        </el-table-column>
        <el-table-column label="设备状态">
          <template #default="{ row }">
            <el-tag :type="row.deviceStatus === 'online' ? 'success' : 'danger'">
              {{ row.deviceStatus === 'online' ? '在线' : '离线' }}
            </el-tag>
            <div v-if="row.warnings && row.warnings.length > 0" class="warnings">
              <el-icon color="#E6A23C"><Warning /></el-icon>
              <span v-for="(w, i) in row.warnings" :key="i" class="warning-text">{{ w }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="last_heartbeat" label="最后心跳" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="success" size="small" @click="handleSimulate(row)">模拟数据</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadData"
        @current-change="loadData"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="点位名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="设备编号" prop="device_code">
          <el-input v-model="form.device_code" />
        </el-form-item>
        <el-form-item label="位置" prop="location">
          <el-input v-model="form.location" />
        </el-form-item>
        <el-form-item label="施工阶段" prop="construction_stage">
          <el-select v-model="form.construction_stage" placeholder="请选择">
            <el-option label="基础施工" value="基础施工" />
            <el-option label="主体施工" value="主体施工" />
            <el-option label="装饰装修" value="装饰装修" />
            <el-option label="竣工验收" value="竣工验收" />
          </el-select>
        </el-form-item>
        <el-form-item label="责任单位" prop="responsible_unit">
          <el-input v-model="form.responsible_unit" />
        </el-form-item>
        <el-form-item label="PM2.5阈值">
          <el-input-number v-model="form.pm25_threshold" :min="0" :max="500" />
          <span class="unit">μg/m³</span>
        </el-form-item>
        <el-form-item label="PM10阈值">
          <el-input-number v-model="form.pm10_threshold" :min="0" :max="500" />
          <span class="unit">μg/m³</span>
        </el-form-item>
        <el-form-item label="噪声阈值">
          <el-input-number v-model="form.noise_threshold" :min="0" :max="120" />
          <span class="unit">dB</span>
        </el-form-item>
        <el-form-item label="校准有效期">
          <el-date-picker v-model="form.calibration_expiry" type="datetime" placeholder="选择日期时间" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="simulateVisible" title="模拟监测数据" width="500px">
      <el-form :model="simulateForm" label-width="100px">
        <el-form-item label="PM2.5">
          <el-input-number v-model="simulateForm.pm25" :min="0" :max="500" />
        </el-form-item>
        <el-form-item label="PM10">
          <el-input-number v-model="simulateForm.pm10" :min="0" :max="500" />
        </el-form-item>
        <el-form-item label="噪声">
          <el-input-number v-model="simulateForm.noise" :min="0" :max="120" />
        </el-form-item>
        <el-form-item label="温度">
          <el-input-number v-model="simulateForm.temperature" :min="-30" :max="50" />
        </el-form-item>
        <el-form-item label="湿度">
          <el-input-number v-model="simulateForm.humidity" :min="0" :max="100" />
        </el-form-item>
        <el-form-item label="风速">
          <el-input-number v-model="simulateForm.wind_speed" :min="0" :max="50" :step="0.1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="simulateVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSimulate">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { pointsApi, dataApi } from '../api'
import { Plus, Warning } from '@element-plus/icons-vue'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const simulateVisible = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const editId = ref(null)
const currentPoint = ref(null)

const queryForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const form = reactive({
  name: '',
  device_code: '',
  location: '',
  construction_stage: '',
  responsible_unit: '',
  pm25_threshold: 35,
  pm10_threshold: 70,
  noise_threshold: 70,
  calibration_expiry: null
})

const simulateForm = reactive({
  pm25: 25,
  pm10: 50,
  noise: 60,
  temperature: 25,
  humidity: 60,
  wind_speed: 2.5
})

const rules = {
  name: [{ required: true, message: '请输入点位名称', trigger: 'blur' }],
  device_code: [{ required: true, message: '请输入设备编号', trigger: 'blur' }],
  location: [{ required: true, message: '请输入位置', trigger: 'blur' }]
}

const loadData = async () => {
  loading.value = true
  try {
    const res = await pointsApi.list({
      ...queryForm,
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    tableData.value = res.data.data
    pagination.total = res.data.total
  } finally {
    loading.value = false
  }
}

const resetQuery = () => {
  queryForm.status = ''
  pagination.page = 1
  loadData()
}

const handleAdd = () => {
  dialogTitle.value = '新增点位'
  editId.value = null
  Object.assign(form, {
    name: '',
    device_code: '',
    location: '',
    construction_stage: '',
    responsible_unit: '',
    pm25_threshold: 35,
    pm10_threshold: 70,
    noise_threshold: 70,
    calibration_expiry: null
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  dialogTitle.value = '编辑点位'
  editId.value = row.id
  Object.assign(form, row)
  dialogVisible.value = true
}

const handleSubmit = async () => {
  await formRef.value.validate()
  
  if (editId.value) {
    await pointsApi.update(editId.value, form)
    ElMessage.success('更新成功')
  } else {
    await pointsApi.create(form)
    ElMessage.success('创建成功')
  }
  
  dialogVisible.value = false
  loadData()
}

const handleDelete = async (row) => {
  await ElMessageBox.confirm('确定要删除该点位吗？', '提示', { type: 'warning' })
  await pointsApi.delete(row.id)
  ElMessage.success('删除成功')
  loadData()
}

const handleSimulate = (row) => {
  currentPoint.value = row
  simulateForm.pm25 = Math.floor(Math.random() * 50) + 10
  simulateForm.pm10 = Math.floor(Math.random() * 100) + 20
  simulateForm.noise = Math.floor(Math.random() * 40) + 40
  simulateForm.temperature = Math.floor(Math.random() * 20) + 15
  simulateForm.humidity = Math.floor(Math.random() * 40) + 40
  simulateForm.wind_speed = Math.floor(Math.random() * 10) + 1
  simulateVisible.value = true
}

const submitSimulate = async () => {
  await dataApi.create({
    point_id: currentPoint.value.id,
    ...simulateForm
  })
  ElMessage.success('数据提交成功')
  simulateVisible.value = false
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.points {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.query-form {
  margin-bottom: 20px;
}

.warnings {
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.warning-text {
  font-size: 12px;
  color: #E6A23C;
}

.unit {
  margin-left: 10px;
  color: #909399;
}
</style>
