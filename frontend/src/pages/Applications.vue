<template>
  <div>
    <el-card style="margin-bottom: 20px">
      <el-form :inline="true" :model="filters" size="small">
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" placeholder="搜索应用名称/ID" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable style="width: 140px">
            <el-option label="开发中" value="development" />
            <el-option label="测试中" value="testing" />
            <el-option label="生产中" value="production" />
            <el-option label="已停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filters.type" placeholder="全部类型" clearable style="width: 120px">
            <el-option label="Web应用" value="web" />
            <el-option label="移动应用" value="mobile" />
            <el-option label="API服务" value="api" />
            <el-option label="桌面应用" value="desktop" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="loadApps">查询</el-button>
          <el-button size="small" @click="resetFilters">重置</el-button>
        </el-form-item>
        <el-form-item style="float: right">
          <el-button type="primary" size="small" @click="openCreateDialog">
            <el-icon><Plus /></el-icon>新建应用
          </el-button>
          <el-button type="warning" size="small" :disabled="selectedRows.length === 0" @click="batchUpdate">
            批量操作
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table
        :data="apps"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        @row-dblclick="row => $router.push(`/applications/${row.id}`)"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="app_id" label="应用ID" width="180" />
        <el-table-column prop="name" label="应用名称" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="$router.push(`/applications/${row.id}`)">{{ row.name }}</el-button>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner_name" label="负责人" width="100" />
        <el-table-column prop="env_count" label="环境数" width="80" align="center" />
        <el-table-column prop="secret_count" label="密钥数" width="80" align="center" />
        <el-table-column prop="creator_name" label="创建人" width="100" />
        <el-table-column prop="created_at" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openEditDialog(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="deleteApp(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.page_size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 20px; justify-content: flex-end"
        @size-change="loadApps"
        @current-change="loadApps"
      />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑应用' : '新建应用'" width="600px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="应用名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="应用类型" prop="type">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="Web应用" value="web" />
            <el-option label="移动应用" value="mobile" />
            <el-option label="API服务" value="api" />
            <el-option label="桌面应用" value="desktop" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用状态" prop="status">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="开发中" value="development" />
            <el-option label="测试中" value="testing" />
            <el-option label="生产中" value="production" />
            <el-option label="已停用" value="disabled" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人" prop="owner_id">
          <el-select v-model="form.owner_id" style="width: 100%" clearable>
            <el-option v-for="user in users" :key="user.id" :label="user.real_name" :value="user.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="回调地址">
          <el-tag v-for="(url, idx) in form.callback_urls" :key="idx" closable @close="form.callback_urls.splice(idx, 1)" style="margin-right: 8px">{{ url }}</el-tag>
          <el-input v-model="newCallbackUrl" size="small" style="width: 200px; margin-top: 8px" placeholder="输入后按回车添加" @keyup.enter="addCallbackUrl" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { appApi, userApi } from '../api'

const loading = ref(false)
const apps = ref([])
const users = ref([])
const selectedRows = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref(null)
const newCallbackUrl = ref('')

const filters = reactive({
  keyword: '',
  status: '',
  type: ''
})

const pagination = reactive({
  page: 1,
  page_size: 20,
  total: 0
})

const form = reactive({
  name: '',
  type: 'web',
  status: 'development',
  owner_id: null,
  description: '',
  callback_urls: [],
  logout_urls: []
})

const rules = {
  name: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
  type: [{ required: true, message: '请选择应用类型', trigger: 'change' }]
}

function addCallbackUrl() {
  if (newCallbackUrl.value.trim() && !form.callback_urls.includes(newCallbackUrl.value.trim())) {
    form.callback_urls.push(newCallbackUrl.value.trim())
    newCallbackUrl.value = ''
  }
}

async function loadUsers() {
  try {
    const res = await userApi.list()
    users.value = res.data
  } catch (e) {
    console.error(e)
  }
}

async function loadApps() {
  loading.value = true
  try {
    const res = await appApi.list({
      ...filters,
      page: pagination.page,
      page_size: pagination.page_size
    })
    apps.value = res.data
    pagination.total = res.total
  } catch (e) {
    ElMessage.error('加载失败')
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.keyword = ''
  filters.status = ''
  filters.type = ''
  pagination.page = 1
  loadApps()
}

function handleSelectionChange(rows) {
  selectedRows.value = rows
}

function openCreateDialog() {
  isEdit.value = false
  Object.assign(form, {
    name: '',
    type: 'web',
    status: 'development',
    owner_id: null,
    description: '',
    callback_urls: [],
    logout_urls: []
  })
  dialogVisible.value = true
}

function openEditDialog(row) {
  isEdit.value = true
  Object.assign(form, { ...row, callback_urls: row.callback_urls ? JSON.parse(row.callback_urls) : [] })
  dialogVisible.value = true
}

async function submitForm() {
  await formRef.value.validate()
  try {
    if (isEdit.value) {
      await appApi.update(form.id, form)
      ElMessage.success('更新成功')
    } else {
      await appApi.create(form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadApps()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

async function deleteApp(row) {
  try {
    await ElMessageBox.confirm(`确认删除应用 ${row.name}？`, '提示', { type: 'warning' })
    await appApi.delete(row.id)
    ElMessage.success('删除成功')
    loadApps()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

async function batchUpdate() {
  try {
    const { value: status } = await ElMessageBox.prompt('请选择要更新的状态', '批量更新状态', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputType: 'select',
      inputOptions: [
        { value: 'development', label: '开发中' },
        { value: 'testing', label: '测试中' },
        { value: 'production', label: '生产中' },
        { value: 'disabled', label: '已停用' }
      ]
    })
    await appApi.batch({
      ids: selectedRows.value.map(r => r.id),
      action: 'update_status',
      data: { status }
    })
    ElMessage.success('批量更新成功')
    loadApps()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('操作失败')
  }
}

function getTypeText(type) {
  const map = { web: 'Web应用', mobile: '移动应用', api: 'API服务', desktop: '桌面应用' }
  return map[type] || type
}

function getStatusType(status) {
  const map = { development: 'info', testing: 'warning', production: 'success', disabled: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { development: '开发中', testing: '测试中', production: '生产中', disabled: '已停用' }
  return map[status] || status
}

onMounted(() => {
  loadUsers()
  loadApps()
})
</script>
