<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="filters" size="small">
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable style="width: 140px">
            <el-option label="待执行" value="pending" />
            <el-option label="执行中" value="running" />
            <el-option label="成功" value="success" />
            <el-option label="失败" value="failed" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="loadData">查询</el-button>
          <el-button size="small" @click="filters.status=''; loadData()">重置</el-button>
        </el-form-item>
        <el-form-item style="float: right">
          <el-button type="primary" size="small" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>新建任务
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="task_id" label="任务ID" width="160" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="app_name" label="关联应用" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="executor_name" label="执行人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" size="small" link @click="execute(row)">执行</el-button>
            <el-button v-if="row.status === 'failed'" type="warning" size="small" link>重试</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新建任务" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="任务类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="配置同步" value="config_sync" />
            <el-option label="密钥部署" value="secret_deploy" />
            <el-option label="服务重启" value="service_restart" />
            <el-option label="数据备份" value="backup" />
          </el-select>
        </el-form-item>
        <el-form-item label="任务标题">
          <el-input v-model="form.title" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { taskApi } from '../api'

const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)
const filters = reactive({ status: '' })
const form = reactive({ type: 'config_sync', title: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await taskApi.list(filters)
    list.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  Object.assign(form, { type: 'config_sync', title: '' })
  dialogVisible.value = true
}

async function submitForm() {
  try {
    await taskApi.create(form)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

async function execute(row) {
  try {
    await ElMessageBox.confirm('确认执行该任务？', '提示', { type: 'warning' })
    await taskApi.execute(row.id)
    ElMessage.success('任务已开始执行')
    setTimeout(loadData, 2000)
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

function getStatusType(status) {
  const map = { pending: 'info', running: 'warning', success: 'success', failed: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { pending: '待执行', running: '执行中', success: '成功', failed: '失败' }
  return map[status] || status
}

onMounted(() => loadData())
</script>
