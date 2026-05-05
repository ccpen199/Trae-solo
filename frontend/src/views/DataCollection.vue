<template>
  <div>
    <div class="page-header" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h2>数据采集</h2>
        <div class="description">管理数据采集会话、查看时序数据和通讯日志</div>
      </div>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>
        新建会话
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
            <el-option label="进行中" value="running" />
            <el-option label="已完成" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchSessions">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="hover" style="margin-top: 20px;">
      <el-table :data="sessions" style="width: 100%" v-loading="loading">
        <el-table-column prop="session_code" label="会话编号" width="200" />
        <el-table-column prop="vin" label="车辆VIN" width="160" />
        <el-table-column prop="model_name" label="车型" />
        <el-table-column prop="protocol_type" label="通讯协议" width="100">
          <template #default="scope">
            <el-tag size="small">{{ scope.row.protocol_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_samples" label="采样数量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 'running' ? 'success' : 'info'">
              {{ scope.row.status === 'running' ? '进行中' : '已完成' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_by_name" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="scope">
            {{ formatTime(scope.row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="goToDetail(scope.row.id)">详情</el-button>
            <el-button 
              v-if="scope.row.status === 'running'" 
              type="success" 
              link 
              @click="endSession(scope.row)"
            >
              结束
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
        @size-change="fetchSessions"
        @current-change="fetchSessions"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog
      v-model="showCreateDialog"
      title="新建数据采集会话"
      width="500px"
    >
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="选择车辆" prop="vehicle_id">
          <el-select v-model="createForm.vehicle_id" placeholder="请选择车辆" filterable style="width: 100%">
            <el-option
              v-for="v in vehiclesList"
              :key="v.id"
              :label="v.vin || v.ecu_serial"
              :value="v.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="通讯协议">
          <el-select v-model="createForm.protocol_type" style="width: 100%">
            <el-option label="CAN" value="CAN" />
            <el-option label="K线" value="K-Line" />
            <el-option label="OBD" value="OBD" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="createSession" :loading="createLoading">
          开始采集
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
const createLoading = ref(false)
const showCreateDialog = ref(false)
const createFormRef = ref(null)

const sessions = ref([])
const vehiclesList = ref([])

const searchForm = reactive({
  vehicle_id: null,
  status: '',
})

const pagination = reactive({
  page: 1,
  limit: 10,
  total: 0,
})

const createForm = reactive({
  vehicle_id: null,
  protocol_type: 'CAN',
})

const createRules = {
  vehicle_id: [{ required: true, message: '请选择车辆', trigger: 'change' }],
}

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
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

const fetchSessions = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      limit: pagination.limit,
      ...searchForm,
    }
    const data = await request.get('/data-collection/sessions', { params })
    sessions.value = data.sessions
    pagination.total = data.pagination.total
  } catch (err) {
    console.error('获取会话列表失败:', err)
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.vehicle_id = null
  searchForm.status = ''
  pagination.page = 1
  fetchSessions()
}

const goToDetail = (id) => {
  router.push(`/data-collection/session/${id}`)
}

const endSession = (row) => {
  ElMessageBox.confirm('确定要结束此采集会话吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.put(`/data-collection/sessions/${row.id}/end`)
        ElMessage.success('会话已结束')
        fetchSessions()
      } catch (err) {
        console.error('结束会话失败:', err)
      }
    })
    .catch(() => {})
}

const createSession = async () => {
  if (!createFormRef.value) return

  await createFormRef.value.validate(async (valid) => {
    if (valid) {
      createLoading.value = true
      try {
        await request.post('/data-collection/sessions', createForm)
        ElMessage.success('采集会话已创建')
        showCreateDialog.value = false
        fetchSessions()
      } catch (err) {
        console.error('创建会话失败:', err)
      } finally {
        createLoading.value = false
      }
    }
  })
}

onMounted(() => {
  fetchVehicles()
  fetchSessions()
})
</script>
