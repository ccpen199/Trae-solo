<template>
  <div class="page-container">
    <div class="flex-between mb-20">
      <h2 class="page-title">管理后台</h2>
      <el-button type="danger" @click="handleCleanup" :loading="cleaning">
        <el-icon><Delete /></el-icon>
        清理日志 (365天前)
      </el-button>
    </div>

    <div v-loading="loading">
      <el-row :gutter="20" class="mb-20">
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card card-shadow">
            <div class="stat-icon bg-blue">
              <el-icon :size="28"><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats?.total_users || 0 }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card card-shadow">
            <div class="stat-icon bg-green">
              <el-icon :size="28"><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats?.active_users || 0 }}</div>
              <div class="stat-label">活跃用户</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card card-shadow">
            <div class="stat-icon bg-orange">
              <el-icon :size="28"><Target /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats?.total_goals || 0 }}</div>
              <div class="stat-label">总目标数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :xs="12" :sm="6">
          <el-card class="stat-card card-shadow">
            <div class="stat-icon bg-purple">
              <el-icon :size="28"><Document /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats?.total_operations || 0 }}</div>
              <div class="stat-label">总操作日志</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-card class="card-shadow mb-20">
        <template #header>
          <div class="flex-between">
            <span class="card-header-title">
              <el-icon><User /></el-icon>
              用户管理
            </span>
            <el-button @click="fetchUsers">
              <el-icon><Refresh /></el-icon>
              刷新
            </el-button>
          </div>
        </template>
        <el-table :data="users" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="display_name" label="昵称" min-width="120" />
          <el-table-column prop="email" label="邮箱" min-width="180" />
          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'danger' : 'info'" size="small">
                {{ row.role === 'admin' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.is_active === 1 ? 'success' : 'info'" size="small">
                {{ row.is_active === 1 ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="goal_count" label="目标数" width="100" align="center" />
          <el-table-column prop="last_login" label="最后登录" width="180">
            <template #default="{ row }">
              {{ row.last_login ? formatDateTime(row.last_login) : '-' }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="handleEditUser(row)">编辑</el-button>
              <el-button
                :type="row.is_active === 1 ? 'warning' : 'success'"
                link
                size="small"
                @click="handleToggleUser(row)"
              >
                {{ row.is_active === 1 ? '禁用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="card-shadow mb-20">
        <template #header>
          <div class="flex-between">
            <span class="card-header-title">
              <el-icon><List /></el-icon>
              操作日志
            </span>
            <div class="flex gap-10">
              <el-select v-model="logFilter.user_id" placeholder="选择用户" clearable style="width: 150px" @change="fetchLogs(1)">
                <el-option v-for="user in users" :key="user.id" :label="user.username" :value="user.id" />
              </el-select>
              <el-select v-model="logFilter.action" placeholder="选择操作" clearable style="width: 200px" @change="fetchLogs(1)">
                <el-option v-for="action in operations" :key="action" :label="action" :value="action" />
              </el-select>
            </div>
          </div>
        </template>
        <el-table :data="logs" stripe>
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户" width="120" />
          <el-table-column prop="action" label="操作" min-width="180" />
          <el-table-column prop="resource_type" label="资源类型" width="120" />
          <el-table-column prop="resource_id" label="资源ID" width="100" />
          <el-table-column prop="details" label="详情" min-width="200" show-overflow-tooltip>
            <template #default="{ row }">
              <span v-if="row.details">{{ formatDetails(row.details) }}</span>
              <span v-else class="text-info">-</span>
            </template>
          </el-table-column>
          <el-table-column prop="ip_address" label="IP" width="130" />
          <el-table-column prop="created_at" label="时间" width="180">
            <template #default="{ row }">
              {{ formatDateTime(row.created_at) }}
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination mt-20">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.page_size"
            :page-sizes="[20, 50, 100]"
            :total="pagination.total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="fetchLogs(1)"
            @current-change="fetchLogs"
          />
        </div>
      </el-card>

      <el-card class="card-shadow">
        <template #header>
          <span class="card-header-title">
            <el-icon><Monitor /></el-icon>
            系统信息
          </span>
        </template>
        <el-descriptions :column="3" border v-if="systemInfo">
          <el-descriptions-item label="版本">{{ systemInfo.version }}</el-descriptions-item>
          <el-descriptions-item label="数据库">{{ systemInfo.database }}</el-descriptions-item>
          <el-descriptions-item label="环境">{{ systemInfo.env || 'production' }}</el-descriptions-item>
          <el-descriptions-item label="数据库路径">{{ systemInfo.database_path }}</el-descriptions-item>
          <el-descriptions-item label="运行时间">{{ formatUptime(systemInfo.uptime) }}</el-descriptions-item>
          <el-descriptions-item label="内存使用">{{ formatMemory(systemInfo.memory_usage) }}</el-descriptions-item>
          <el-descriptions-item label="数据表" :span="3">
            <el-tag v-for="table in systemInfo.tables" :key="table" size="small" class="mr-5 mb-5">
              {{ table }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </div>

    <el-dialog v-model="showEditDialog" title="编辑用户" width="500px">
      <el-form ref="editUserFormRef" :model="editUserForm" :rules="editUserRules" label-width="100px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editUserForm.username" />
        </el-form-item>
        <el-form-item label="昵称" prop="display_name">
          <el-input v-model="editUserForm.display_name" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editUserForm.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editUserForm.role" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleSaveUser" :loading="updating">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, ElForm } from 'element-plus'
import { adminApi } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const updating = ref(false)
const cleaning = ref(false)
const showEditDialog = ref(false)
const editUserFormRef = ref()
const editingUserId = ref(null)

const stats = ref(null)
const users = ref([])
const logs = ref([])
const operations = ref([])
const systemInfo = ref(null)

const logFilter = reactive({
  user_id: '',
  action: ''
})

const pagination = reactive({
  page: 1,
  page_size: 50,
  total: 0
})

const editUserForm = reactive({
  username: '',
  display_name: '',
  email: '',
  role: 'user'
})

const editUserRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
}

function formatDateTime(date) {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

function formatUptime(seconds) {
  if (!seconds) return '-'
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const parts = []
  if (days > 0) parts.push(`${days}天`)
  if (hours > 0) parts.push(`${hours}小时`)
  if (mins > 0) parts.push(`${mins}分钟`)
  return parts.length > 0 ? parts.join(' ') : `${Math.floor(seconds)}秒`
}

function formatMemory(memory) {
  if (!memory) return '-'
  const rss = Math.round(memory.rss / 1024 / 1024)
  const heapTotal = Math.round(memory.heapTotal / 1024 / 1024)
  const heapUsed = Math.round(memory.heapUsed / 1024 / 1024)
  return `RSS: ${rss}MB / Heap: ${heapUsed}MB/${heapTotal}MB`
}

function formatDetails(details) {
  try {
    const obj = typeof details === 'string' ? JSON.parse(details) : details
    return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(', ')
  } catch {
    return String(details)
  }
}

async function fetchStats() {
  try {
    stats.value = await adminApi.getStats()
  } catch (err) {
    ElMessage.error(err.message || '获取统计数据失败')
  }
}

async function fetchUsers() {
  try {
    users.value = await adminApi.getUsers()
  } catch (err) {
    ElMessage.error(err.message || '获取用户列表失败')
  }
}

async function fetchOperations() {
  try {
    const res = await adminApi.getOperations()
    operations.value = res.actions
  } catch (err) {
    console.error('获取操作类型失败', err)
  }
}

async function fetchLogs(page) {
  try {
    loading.value = true
    if (page) pagination.page = page
    const params = {
      ...logFilter,
      page: pagination.page,
      page_size: pagination.page_size
    }
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key]
      }
    })
    const res = await adminApi.getOperationLogs(params)
    logs.value = res.logs
    Object.assign(pagination, res.pagination)
  } catch (err) {
    ElMessage.error(err.message || '获取操作日志失败')
  } finally {
    loading.value = false
  }
}

async function fetchSystemInfo() {
  try {
    systemInfo.value = await adminApi.getSystemInfo()
  } catch (err) {
    ElMessage.error(err.message || '获取系统信息失败')
  }
}

function handleEditUser(row) {
  editingUserId.value = row.id
  Object.assign(editUserForm, {
    username: row.username,
    display_name: row.display_name || '',
    email: row.email || '',
    role: row.role
  })
  showEditDialog.value = true
}

async function handleSaveUser() {
  try {
    await editUserFormRef.value.validate()
    updating.value = true
    await adminApi.updateUser(editingUserId.value, editUserForm)
    ElMessage.success('更新成功')
    showEditDialog.value = false
    await fetchUsers()
  } catch (err) {
    if (err.message) ElMessage.error(err.message)
  } finally {
    updating.value = false
  }
}

async function handleToggleUser(row) {
  try {
    const action = row.is_active === 1 ? '禁用' : '启用'
    await ElMessageBox.confirm(
      `确定要${action}用户「${row.username}」吗？`,
      '提示',
      { type: 'warning' }
    )
    await adminApi.updateUser(row.id, { is_active: row.is_active === 1 ? 0 : 1 })
    ElMessage.success(`${action}成功`)
    await fetchUsers()
  } catch (err) {
    if (err.message) ElMessage.error(err.message)
  }
}

async function handleCleanup() {
  try {
    await ElMessageBox.confirm(
      '确定要清理365天前的操作日志吗？此操作不可恢复。',
      '提示',
      { type: 'warning' }
    )
    cleaning.value = true
    const res = await adminApi.cleanup({ days: 365 })
    ElMessage.success(`清理完成，删除了 ${res.deleted_logs} 条日志`)
    await fetchLogs(1)
    await fetchStats()
  } catch (err) {
    if (err.message) ElMessage.error(err.message)
  } finally {
    cleaning.value = false
  }
}

async function loadAllData() {
  loading.value = true
  try {
    await Promise.all([
      fetchStats(),
      fetchUsers(),
      fetchOperations(),
      fetchSystemInfo()
    ])
    await fetchLogs(1)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.card-header-title {
  font-weight: 600;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.bg-blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.bg-green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
.bg-orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.bg-purple { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}

.text-info {
  color: #909399;
}

.mr-5 {
  margin-right: 5px;
}

.mb-5 {
  margin-bottom: 5px;
}
</style>
