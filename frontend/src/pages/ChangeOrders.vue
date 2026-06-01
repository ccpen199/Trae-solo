<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="filters" size="small">
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable style="width: 140px">
            <el-option label="待审批" value="pending" />
            <el-option label="已批准" value="approved" />
            <el-option label="已执行" value="executed" />
            <el-option label="已拒绝" value="rejected" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="loadData">查询</el-button>
          <el-button size="small" @click="filters.status=''; loadData()">重置</el-button>
        </el-form-item>
        <el-form-item style="float: right">
          <el-button type="primary" size="small" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>新建变更单
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="change_no" label="变更单号" width="160" />
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="type" label="类型" width="100">
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
        <el-table-column prop="creator_name" label="申请人" width="100" />
        <el-table-column prop="approver_name" label="审批人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="$router.push(`/change-orders/${row.id}`)">详情</el-button>
            <el-button v-if="row.status === 'pending'" type="success" size="small" link @click="approve(row)">批准</el-button>
            <el-button v-if="row.status === 'approved'" type="warning" size="small" link @click="execute(row)">执行</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :total="pagination.total"
        layout="total, prev, pager, next"
        style="margin-top: 20px; justify-content: flex-end"
        @current-change="loadData"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" title="新建变更单" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="变更类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="配置变更" value="config" />
            <el-option label="密钥轮换" value="secret_rotate" />
            <el-option label="环境部署" value="deploy" />
            <el-option label="权限调整" value="permission" />
            <el-option label="故障恢复" value="recovery" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="变更原因">
          <el-input v-model="form.reason" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="影响范围">
          <el-input v-model="form.impact" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="恢复路径">
          <el-input v-model="form.recovery_path" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { changeApi } from '../api'

const loading = ref(false)
const list = ref([])
const dialogVisible = ref(false)

const filters = reactive({ status: '' })
const pagination = reactive({ page: 1, page_size: 20, total: 0 })
const form = reactive({ type: 'config', title: '', reason: '', impact: '', recovery_path: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await changeApi.list({ ...filters, page: pagination.page, page_size: pagination.page_size })
    list.value = res.data
    pagination.total = res.total
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  Object.assign(form, { type: 'config', title: '', reason: '', impact: '', recovery_path: '' })
  dialogVisible.value = true
}

async function submitForm() {
  try {
    await changeApi.create(form)
    ElMessage.success('创建成功')
    dialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('创建失败')
  }
}

async function approve(row) {
  try {
    await ElMessageBox.confirm('确认批准该变更单？', '提示', { type: 'warning' })
    await changeApi.approve(row.id)
    ElMessage.success('批准成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

async function execute(row) {
  try {
    await ElMessageBox.confirm('确认执行该变更单？', '提示', { type: 'warning' })
    await changeApi.execute(row.id)
    ElMessage.success('执行成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

function getStatusType(status) {
  const map = { pending: 'warning', approved: 'info', executed: 'success', rejected: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { pending: '待审批', approved: '已批准', executed: '已执行', rejected: '已拒绝' }
  return map[status] || status
}

onMounted(() => loadData())
</script>
