<template>
  <div class="production-list">
    <div class="page-header">
      <h1>生产管理</h1>
      <el-button type="primary" @click="showCreateModal = true">创建生产任务</el-button>
    </div>

    <el-table :data="tasks" border>
      <el-table-column prop="taskNumber" label="任务编号" />
      <el-table-column prop="title" label="任务名称" />
      <el-table-column prop="orderNumber" label="关联订单" />
      <el-table-column prop="progress" label="进度">
        <template #default="scope">
          <el-progress :percentage="scope.row.progress" :show-text="false" :width="60" />
          <span style="margin-left: 8px">{{ scope.row.progress }}%</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="scope">
          <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="estimatedDuration" label="预计天数" />
      <el-table-column prop="createdAt" label="创建时间" />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button size="small" @click="viewTask(scope.row)">查看</el-button>
          <el-button size="small" type="success" @click="startProduction(scope.row.id)" v-if="scope.row.status === 'PENDING'">开始生产</el-button>
          <el-button size="small" type="primary" @click="updateProgress(scope.row)" v-if="scope.row.status === 'IN_PRODUCTION'">更新进度</el-button>
          <el-button size="small" type="success" @click="completeProduction(scope.row.id)" v-if="scope.row.progress >= 100 && scope.row.status !== 'COMPLETED'">完成生产</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="创建生产任务" v-model="showCreateModal">
      <el-form :model="form" label-width="120px">
        <el-form-item label="订单ID">
          <el-input v-model="form.orderId" />
        </el-form-item>
        <el-form-item label="拆单ID">
          <el-input v-model="form.splitId" />
        </el-form-item>
        <el-form-item label="任务名称">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="工厂ID">
          <el-input v-model="form.factoryId" />
        </el-form-item>
        <el-form-item label="预计天数">
          <el-input v-model.number="form.estimatedDuration" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" @click="createTask">创建</el-button>
      </template>
    </el-dialog>

    <el-dialog title="更新进度" v-model="showProgressModal">
      <el-form :model="progressForm" label-width="120px">
        <el-form-item label="进度">
          <el-slider v-model="progressForm.progress" :min="0" :max="100" />
          <span>{{ progressForm.progress }}%</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-textarea v-model="progressForm.notes" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showProgressModal = false">取消</el-button>
        <el-button type="primary" @click="confirmProgress">确认更新</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { productionApi } from '../api'

const tasks = ref([])
const showCreateModal = ref(false)
const showProgressModal = ref(false)
const currentTaskId = ref('')

const form = ref({
  orderId: '',
  splitId: '',
  title: '',
  factoryId: 'test-factory-id',
  estimatedDuration: 15
})

const progressForm = ref({
  progress: 0,
  notes: ''
})

onMounted(async () => {
  await loadTasks()
})

const loadTasks = async () => {
  try {
    const res = await productionApi.list()
    tasks.value = res.data.data?.tasks || res.data.tasks || []
  } catch (error) {
    console.error('加载生产任务失败:', error)
  }
}

const createTask = async () => {
  try {
    await productionApi.create(form.value)
    showCreateModal.value = false
    await loadTasks()
    form.value = {
      orderId: '',
      splitId: '',
      title: '',
      factoryId: 'test-factory-id',
      estimatedDuration: 15
    }
    alert('生产任务创建成功')
  } catch (error) {
    console.error('创建生产任务失败:', error)
    alert('创建生产任务失败')
  }
}

const startProduction = async (id: string) => {
  try {
    await productionApi.start(id, { factoryId: 'test-factory-id' })
    await loadTasks()
    alert('生产开始成功')
  } catch (error) {
    console.error('开始生产失败:', error)
    alert('开始生产失败')
  }
}

const updateProgress = (task: any) => {
  currentTaskId.value = task.id
  progressForm.value = {
    progress: task.progress,
    notes: ''
  }
  showProgressModal.value = true
}

const confirmProgress = async () => {
  try {
    await productionApi.progress(currentTaskId.value, progressForm.value)
    showProgressModal.value = false
    await loadTasks()
    alert('进度更新成功')
  } catch (error) {
    console.error('更新进度失败:', error)
    alert('更新进度失败')
  }
}

const completeProduction = async (id: string) => {
  try {
    await productionApi.complete(id, { qualityCheckPassed: true, notes: '生产完成' })
    await loadTasks()
    alert('生产完成成功')
  } catch (error) {
    console.error('完成生产失败:', error)
    alert('完成生产失败')
  }
}

const viewTask = (task: any) => {
  console.log('查看任务:', task)
}

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    'PENDING': 'warning',
    'IN_PRODUCTION': 'primary',
    'QUALITY_CHECK': 'info',
    'COMPLETED': 'success'
  }
  return types[status] || 'default'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    'PENDING': '待开始',
    'IN_PRODUCTION': '生产中',
    'QUALITY_CHECK': '质检中',
    'COMPLETED': '已完成'
  }
  return texts[status] || status
}
</script>

<style scoped>
.production-list {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
}
</style>