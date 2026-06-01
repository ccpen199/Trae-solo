<template>
  <div>
    <div class="page-header">
      <h2>车次任务管理</h2>
      <div style="display: flex; gap: 12px;">
        <el-button @click="showRouteDialog = true">
          <el-icon><Guide /></el-icon>
          线路管理
        </el-button>
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增车次
        </el-button>
      </div>
    </div>

    <el-card class="card-container">
      <el-table :data="trains" v-loading="loading">
        <el-table-column prop="train_no" label="车次" width="100" />
        <el-table-column prop="route_name" label="线路" width="120" />
        <el-table-column prop="departure_station" label="始发站" width="100" />
        <el-table-column prop="arrival_station" label="终到站" width="100" />
        <el-table-column prop="departure_time" label="发车时间" width="100" />
        <el-table-column prop="arrival_time" label="到达时间" width="100" />
        <el-table-column prop="duration_minutes" label="时长(分)" width="100" align="center" />
        <el-table-column prop="train_type" label="车型" width="100" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleView(row)">岗位需求</el-button>
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑车次' : '新增车次'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="车次" prop="train_no">
              <el-input v-model="form.train_no" placeholder="如: G101" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属线路" prop="route_id">
              <el-select v-model="form.route_id" style="width: 100%">
                <el-option v-for="route in routes" :key="route.id" :label="route.route_name" :value="route.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="始发站" prop="departure_station">
              <el-input v-model="form.departure_station" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="终到站" prop="arrival_station">
              <el-input v-model="form.arrival_station" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="发车时间" prop="departure_time">
              <el-time-picker v-model="form.departure_time" value-format="HH:mm" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到达时间" prop="arrival_time">
              <el-time-picker v-model="form.arrival_time" value-format="HH:mm" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="运行时长(分)">
              <el-input-number v-model="form.duration_minutes" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="车型">
              <el-select v-model="form.train_type" style="width: 100%">
                <el-option label="CRH380A" value="CRH380A" />
                <el-option label="CRH380B" value="CRH380B" />
                <el-option label="CR400AF" value="CR400AF" />
                <el-option label="CR400BF" value="CR400BF" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="编组信息">
          <el-input v-model="form.marshalling" placeholder="如: 8编组、16编组" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="requirementDialogVisible" title="岗位需求配置" width="600px">
      <div v-if="currentTrain">
        <h4 style="margin-bottom: 16px;">{{ currentTrain.train_no }} - 岗位需求</h4>
        <el-table :data="requirements" size="small" style="margin-bottom: 16px;">
          <el-table-column prop="position" label="岗位" />
          <el-table-column prop="count" label="人数" width="100" align="center" />
          <el-table-column prop="qualification_required" label="资质要求" />
          <el-table-column label="操作" width="100">
            <template #default="{ row }">
              <el-button type="danger" link size="small" @click="deleteRequirement(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-divider />
        <el-form :inline="true" :model="reqForm" label-width="80px">
          <el-form-item label="岗位">
            <el-select v-model="reqForm.position" style="width: 120px;">
              <el-option label="列车长" value="列车长" />
              <el-option label="乘务员" value="乘务员" />
              <el-option label="安全员" value="安全员" />
              <el-option label="餐车长" value="餐车长" />
            </el-select>
          </el-form-item>
          <el-form-item label="人数">
            <el-input-number v-model="reqForm.count" :min="1" :max="10" />
          </el-form-item>
          <el-form-item label="资质">
            <el-input v-model="reqForm.qualification_required" style="width: 120px;" placeholder="可选" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="addRequirement">添加</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>

    <el-dialog v-model="showRouteDialog" title="线路管理" width="500px">
      <el-table :data="routes" size="small" style="margin-bottom: 16px;">
        <el-table-column prop="route_no" label="线路编号" width="120" />
        <el-table-column prop="route_name" label="线路名称" />
      </el-table>
      <el-divider />
      <el-form :inline="true" :model="routeForm" label-width="80px">
        <el-form-item label="编号">
          <el-input v-model="routeForm.route_no" style="width: 100px;" />
        </el-form-item>
        <el-form-item label="名称">
          <el-input v-model="routeForm.route_name" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="addRoute">添加</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { trainsAPI } from '@/api'

const trains = ref([])
const routes = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const requirementDialogVisible = ref(false)
const showRouteDialog = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const currentTrain = ref(null)
const requirements = ref([])

const form = ref({
  id: null,
  train_no: '',
  route_id: null,
  departure_station: '',
  arrival_station: '',
  departure_time: '',
  arrival_time: '',
  duration_minutes: 0,
  train_type: '',
  marshalling: ''
})

const reqForm = ref({
  position: '乘务员',
  count: 1,
  qualification_required: ''
})

const routeForm = ref({
  route_no: '',
  route_name: ''
})

const rules = {
  train_no: [{ required: true, message: '请输入车次', trigger: 'blur' }],
  departure_station: [{ required: true, message: '请输入始发站', trigger: 'blur' }],
  arrival_station: [{ required: true, message: '请输入终到站', trigger: 'blur' }],
  departure_time: [{ required: true, message: '请选择发车时间', trigger: 'change' }],
  arrival_time: [{ required: true, message: '请选择到达时间', trigger: 'change' }]
}

const loadTrains = async () => {
  loading.value = true
  try {
    const res = await trainsAPI.list()
    trains.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadRoutes = async () => {
  try {
    const res = await trainsAPI.listRoutes()
    routes.value = res.data
  } catch (error) {
    console.error('加载线路失败')
  }
}

const handleAdd = () => {
  isEdit.value = false
  form.value = {
    id: null,
    train_no: '',
    route_id: null,
    departure_station: '',
    arrival_station: '',
    departure_time: '',
    arrival_time: '',
    duration_minutes: 0,
    train_type: '',
    marshalling: ''
  }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  form.value = { ...row }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEdit.value) {
          await trainsAPI.update(form.value.id, form.value)
          ElMessage.success('编辑成功')
        } else {
          await trainsAPI.create(form.value)
          ElMessage.success('新增成功')
        }
        dialogVisible.value = false
        loadTrains()
      } catch (error) {
        ElMessage.error('操作失败')
      }
    }
  })
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该车次吗？', '确认', { type: 'warning' })
    await trainsAPI.delete(row.id)
    ElMessage.success('删除成功')
    loadTrains()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const handleView = async (row) => {
  currentTrain.value = row
  try {
    const res = await trainsAPI.get(row.id)
    requirements.value = res.data.requirements || []
  } catch (error) {
    requirements.value = []
  }
  requirementDialogVisible.value = true
}

const addRequirement = async () => {
  if (!currentTrain.value) return
  
  try {
    await trainsAPI.addRequirement(currentTrain.value.id, reqForm.value)
    ElMessage.success('添加成功')
    const res = await trainsAPI.get(currentTrain.value.id)
    requirements.value = res.data.requirements || []
    reqForm.value = { position: '乘务员', count: 1, qualification_required: '' }
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const deleteRequirement = async (id) => {
  try {
    await trainsAPI.deleteRequirement(id)
    ElMessage.success('删除成功')
    const res = await trainsAPI.get(currentTrain.value.id)
    requirements.value = res.data.requirements || []
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

const addRoute = async () => {
  if (!routeForm.value.route_no || !routeForm.value.route_name) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await trainsAPI.createRoute(routeForm.value)
    ElMessage.success('添加成功')
    loadRoutes()
    routeForm.value = { route_no: '', route_name: '' }
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

onMounted(() => {
  loadRoutes()
  loadTrains()
})
</script>
