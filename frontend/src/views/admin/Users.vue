<template>
  <div class="admin-users">
    <el-card>
      <template #header>
        <span>用户管理</span>
      </template>

      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="full_name" label="姓名" width="120" />
        <el-table-column prop="email" label="邮箱" width="180" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="scope">
            <el-tag :type="getRoleTagType(scope.row.role)">{{ getRoleText(scope.row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="credit_score" label="诚信分" width="100">
          <template #default="scope">
            <el-tag :type="getCreditTagType(scope.row.credit_score)">{{ scope.row.credit_score }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_service_hours" label="服务时长" width="100">
          <template #default="scope">
            {{ scope.row.total_service_hours?.toFixed(1) || 0 }} 小时
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="80">
          <template #default="scope">
            <el-tag :type="scope.row.is_active ? 'success' : 'danger'">
              {{ scope.row.is_active ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button
              type="text"
              :type="scope.row.is_active ? 'danger' : 'success'"
              @click="toggleStatus(scope.row)"
              :disabled="scope.row.id === authStore.user?.id"
            >
              {{ scope.row.is_active ? '禁用' : '启用' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { apiClient } from '@/api'
import type { UserResponse } from '@/types'

const authStore = useAuthStore()

const loading = ref(false)
const users = ref<UserResponse[]>([])

const getRoleText = (role: string) => {
  const roleMap: Record<string, string> = {
    volunteer: '志愿者',
    organizer: '组织者',
    admin: '管理员',
    reviewer: '评审员',
  }
  return roleMap[role] || role
}

const getRoleTagType = (role: string) => {
  const typeMap: Record<string, string> = {
    volunteer: '',
    organizer: 'primary',
    admin: 'danger',
    reviewer: 'warning',
  }
  return typeMap[role] || 'info'
}

const getCreditTagType = (score: number) => {
  if (score >= 150) return 'success'
  if (score >= 100) return ''
  if (score >= 50) return 'warning'
  return 'danger'
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await apiClient.get<UserResponse[]>('/admin/users')
    users.value = response.data
  } catch (error) {
    console.error('Failed to fetch users:', error)
  } finally {
    loading.value = false
  }
}

const toggleStatus = async (user: UserResponse) => {
  try {
    const action = user.is_active ? '禁用' : '启用'
    await ElMessageBox.confirm(`确定要${action}该用户吗？`, '确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await apiClient.put(`/admin/users/${user.id}/toggle-status`)
    ElMessage.success(`用户已${action}`)
    fetchUsers()
  } catch (error: unknown) {
    if (error !== 'cancel') {
      console.error('Failed to toggle status:', error)
    }
  }
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped>
.admin-users {
  padding: 0;
}
</style>
