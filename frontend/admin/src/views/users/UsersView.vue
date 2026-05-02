<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/utils/api'

const loading = ref(false)
const users = ref<any[]>([])
const searchQuery = ref('')
const activeRole = ref<string | null>(null)

const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
})

const roleColors: Record<string, string> = {
  admin: 'danger',
  manager: 'warning',
  cashier: 'primary',
  waiter: 'success',
  chef: 'info',
}

const roleLabels: Record<string, string> = {
  admin: '管理员',
  manager: '店长',
  cashier: '收银员',
  waiter: '服务员',
  chef: '厨师',
}

const statusColors: Record<string, string> = {
  active: 'success',
  inactive: 'info',
  locked: 'danger',
}

const statusLabels: Record<string, string> = {
  active: '正常',
  inactive: '禁用',
  locked: '锁定',
}

const filteredUsers = computed(() => {
  let result = users.value
  if (activeRole.value) {
    result = result.filter((u) => u.role === activeRole.value)
  }
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(query) ||
        u.phone.includes(query) ||
        u.username.toLowerCase().includes(query)
    )
  }
  return result
})

const fetchUsers = async () => {
  loading.value = true
  try {
    const result = await request.get('/users/search', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
      },
    })
    users.value = result.data
    pagination.value.total = result.total
  } catch (error) {
    ElMessage.error('加载员工数据失败')
    users.value = [
      {
        id: '1',
        username: 'admin',
        name: '系统管理员',
        phone: '13800000000',
        role: 'admin',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        username: 'manager1',
        name: '张经理',
        phone: '13800000001',
        role: 'manager',
        status: 'active',
        createdAt: '2024-01-02T00:00:00Z',
      },
      {
        id: '3',
        username: 'cashier1',
        name: '李收银',
        phone: '13800000002',
        role: 'cashier',
        status: 'active',
        createdAt: '2024-01-03T00:00:00Z',
      },
      {
        id: '4',
        username: 'waiter1',
        name: '王服务',
        phone: '13800000003',
        role: 'waiter',
        status: 'active',
        createdAt: '2024-01-04T00:00:00Z',
      },
      {
        id: '5',
        username: 'chef1',
        name: '赵大厨',
        phone: '13800000004',
        role: 'chef',
        status: 'active',
        createdAt: '2024-01-05T00:00:00Z',
      },
    ]
    pagination.value.total = 5
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchUsers()
}

const handleRoleFilter = (role: string | null) => {
  activeRole.value = role
  pagination.value.page = 1
  fetchUsers()
}

const toggleStatus = async (user: any, status: string) => {
  try {
    await request.put(`/users/${user.id}`, { status })
    ElMessage.success('状态已更新')
    fetchUsers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const deactivateUser = async (user: any) => {
  try {
    await ElMessageBox.confirm(`确定要禁用员工 "${user.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await toggleStatus(user, 'inactive')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const activateUser = async (user: any) => {
  try {
    await toggleStatus(user, 'active')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const resetPassword = async (user: any) => {
  try {
    await ElMessageBox.confirm(`确定要重置员工 "${user.name}" 的密码吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await request.post(`/users/${user.id}/reset-password`)
    ElMessage.success('密码已重置为默认密码')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const viewUserDetail = async (user: any) => {
  ElMessage.info(`查看员工详情: ${user.name}`)
}

onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div class="users-page">
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <span class="card-title">员工管理</span>
          <el-button type="primary" size="small" @click="fetchUsers">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div class="filter-section">
        <div class="role-filters">
          <el-tag
            v-for="role in [
              { label: '全部', value: null },
              { label: '管理员', value: 'admin' },
              { label: '店长', value: 'manager' },
              { label: '收银员', value: 'cashier' },
              { label: '服务员', value: 'waiter' },
              { label: '厨师', value: 'chef' },
            ]"
            :key="role.value || 'all'"
            :type="activeRole === role.value ? 'primary' : ''"
            effect="plain"
            class="role-tag"
            @click="handleRoleFilter(role.value)"
          >
            {{ role.label }}
          </el-tag>
        </div>

        <div class="search-section">
          <el-input
            v-model="searchQuery"
            placeholder="搜索姓名/手机号/用户名"
            clearable
            style="width: 300px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button type="primary" @click="handleSearch" style="margin-left: 12px">
            搜索
          </el-button>
        </div>
      </div>
    </el-card>

    <el-card class="users-card" v-loading="loading">
      <el-table :data="filteredUsers" stripe>
        <el-table-column prop="username" label="用户名" width="120">
          <template #default="{ row }">
            <span class="username">{{ row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100">
          <template #default="{ row }">
            <span class="user-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="roleColors[row.role]" size="small">
              {{ roleLabels[row.role] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusColors[row.status]" size="small">
              {{ statusLabels[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewUserDetail(row)">
              详情
            </el-button>
            <el-button type="warning" link size="small" @click="resetPassword(row)">
              重置密码
            </el-button>
            <el-button
              v-if="row.status === 'active'"
              type="info"
              link
              size="small"
              @click="deactivateUser(row)"
            >
              禁用
            </el-button>
            <el-button
              v-if="row.status === 'inactive' || row.status === 'locked'"
              type="success"
              link
              size="small"
              @click="activateUser(row)"
            >
              启用
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="pagination.total > 0"
        class="pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        :page-size="pagination.limit"
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50, 100]"
      />
    </el-card>
  </div>
</template>

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card,
.users-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.filter-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.role-filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.role-tag {
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-1px);
  }
}

.search-section {
  display: flex;
  align-items: center;
}

.username {
  font-weight: 600;
  color: #409eff;
}

.user-name {
  font-weight: 500;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
