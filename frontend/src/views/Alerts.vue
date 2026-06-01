<template>
  <div class="alerts">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>超标预警管理</span>
        </div>
      </template>
      
      <el-form :inline="true" :model="queryForm" class="query-form">
        <el-form-item label="状态">
          <el-select v-model="queryForm.status" placeholder="全部" clearable>
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="processing" />
            <el-option label="已解决" value="resolved" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="point_name" label="点位名称" />
        <el-table-column prop="device_code" label="设备编号" />
        <el-table-column prop="alert_type" label="预警类型">
          <template #default="{ row }">
            <el-tag type="danger">{{ row.alert_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parameter" label="参数">
          <template #default="{ row }">{{ paramLabels[row.parameter] }}</template>
        </el-table-column>
        <el-table-column prop="value" label="监测值" />
        <el-table-column prop="threshold" label="阈值" />
        <el-table-column prop="responsible_unit" label="责任单位" />
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusLabelMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="created_at" label="预警时间" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleCreateTask(row)" v-if="row.status === 'pending'">
              生成整改任务
            </el-button>
            <el-button link type="info" size="small" @click="handleView(row)">查看详情</el-button>
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

    <el-dialog v-model="detailVisible" title="预警详情" width="500px">
      <el-descriptions :column="1" border v-if="currentAlert">
        <el-descriptions-item label="点位名称">{{ currentAlert.point_name }}</el-descriptions-item>
        <el-descriptions-item label="设备编号">{{ currentAlert.device_code }}</el-descriptions-item>
        <el-descriptions-item label="预警类型">{{ currentAlert.alert_type }}</el-descriptions-item>
        <el-descriptions-item label="参数">{{ paramLabels[currentAlert.parameter] }}</el-descriptions-item>
        <el-descriptions-item label="监测值">{{ currentAlert.value }}</el-descriptions-item>
        <el-descriptions-item label="阈值">{{ currentAlert.threshold }}</el-descriptions-item>
        <el-descriptions-item label="责任单位">{{ currentAlert.responsible_unit }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ currentAlert.description }}</el-descriptions-item>
        <el-descriptions-item label="预警时间">{{ currentAlert.created_at }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { alertsApi, tasksApi } from '../api'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const tableData = ref([])
const detailVisible = ref(false)
const currentAlert = ref(null)

const paramLabels = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  noise: '噪声'
}

const statusTypeMap = {
  pending: 'warning',
  processing: 'primary',
  resolved: 'success'
}

const statusLabelMap = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决'
}

const queryForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await alertsApi.list({
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

const handleCreateTask = async (row) => {
  await ElMessageBox.confirm('确定要为该预警生成整改任务吗？', '提示', { type: 'warning' })
  
  await tasksApi.create({
    alert_id: row.id,
    point_id: row.point_id
  })
  
  ElMessage.success('整改任务已生成')
  loadData()
}

const handleView = (row) => {
  currentAlert.value = row
  detailVisible.value = true
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.alerts {
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
</style>
