<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="filters" size="small">
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable style="width: 120px">
            <el-option label="处理中" value="open" />
            <el-option label="已关闭" value="closed" />
          </el-select>
        </el-form-item>
        <el-form-item label="级别">
          <el-select v-model="filters.level" clearable style="width: 120px">
            <el-option label="严重" value="critical" />
            <el-option label="错误" value="error" />
            <el-option label="警告" value="warning" />
            <el-option label="信息" value="info" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="loadData">查询</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="list" v-loading="loading">
        <el-table-column prop="alert_id" label="告警ID" width="160" />
        <el-table-column prop="level" label="级别" width="80">
          <template #default="{ row }">
            <el-tag :type="getLevelType(row.level)" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="120" />
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="assignee_name" label="责任人" width="100" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'open' ? 'warning' : 'info'" size="small">{{ row.status === 'open' ? '处理中' : '已关闭' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'open'" type="primary" size="small" link @click="assign(row)">分配</el-button>
            <el-button v-if="row.status === 'open'" type="success" size="small" link @click="close(row)">关闭</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="closeDialogVisible" title="关闭告警" width="500px">
      <el-form :model="closeForm" label-width="80px">
        <el-form-item label="关闭原因">
          <el-input v-model="closeForm.close_reason" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmClose">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { alertApi, userApi } from '../api'

const loading = ref(false)
const list = ref([])
const users = ref([])
const closeDialogVisible = ref(false)
const currentAlert = ref(null)
const filters = reactive({ status: 'open', level: '' })
const closeForm = reactive({ close_reason: '' })

async function loadData() {
  loading.value = true
  try {
    const res = await alertApi.list(filters)
    list.value = res.data
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.status = 'open'
  filters.level = ''
  loadData()
}

async function assign(row) {
  try {
    const { value: assignee_id } = await ElMessageBox.prompt('选择责任人', '分配告警', {
      inputType: 'select',
      inputOptions: users.value.map(u => ({ value: u.id, label: u.real_name }))
    })
    await alertApi.assign(row.id, { assignee_id })
    ElMessage.success('分配成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

function close(row) {
  currentAlert.value = row
  closeForm.close_reason = ''
  closeDialogVisible.value = true
}

async function confirmClose() {
  if (!closeForm.close_reason.trim()) {
    ElMessage.warning('请输入关闭原因')
    return
  }
  try {
    await alertApi.close(currentAlert.value.id, { close_reason: closeForm.close_reason })
    ElMessage.success('关闭成功')
    closeDialogVisible.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

function getLevelType(level) {
  const map = { critical: 'danger', error: 'danger', warning: 'warning', info: 'info' }
  return map[level] || 'info'
}

onMounted(() => {
  loadData()
  userApi.list().then(r => users.value = r.data)
})
</script>
