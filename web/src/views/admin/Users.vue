<template>
  <div class="admin-users-page">
    <div class="page-header">
      <h2>用户管理</h2>
    </div>

    <el-table :data="users" v-loading="loading" stripe style="width: 100%">
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="email" label="邮箱" width="180" />
      <el-table-column prop="role" label="角色" width="100">
        <template #default="scope">
          <el-tag :type="getRoleTagType(scope.row.role)">
            {{ getRoleText(scope.row.role) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="scope">
          <el-tag :type="getStatusTagType(scope.row.status)">
            {{ getStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="loginCount" label="登录次数" width="100" />
      <el-table-column prop="lastLoginAt" label="最后登录" width="160">
        <template #default="scope">
          {{ formatTime(scope.row.lastLoginAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200">
        <template #default="scope">
          <el-button 
            v-if="scope.row.status === 'pending'" 
            type="success" 
            size="small"
            @click="handleApprove(scope.row)"
          >
            审核通过
          </el-button>
          <el-button 
            v-if="scope.row.status === 'active'" 
            type="danger" 
            size="small"
            @click="handleBan(scope.row)"
          >
            禁用
          </el-button>
          <el-button 
            v-if="scope.row.status === 'banned'" 
            type="success" 
            size="small"
            @click="handleUnban(scope.row)"
          >
            解禁
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminUsers, updateUserStatus } from '@/api'

const loading = ref(false)
const users = ref([
  { id: '1', username: 'admin', nickname: '管理员', email: 'admin@example.com', role: 'admin', status: 'active', loginCount: 10, lastLoginAt: new Date().toISOString() },
  { id: '2', username: 'testuser', nickname: '测试用户', email: 'test@example.com', role: 'user', status: 'pending', loginCount: 0, lastLoginAt: null },
])

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const getRoleTagType = (role) => {
  const map = { user: '', group_leader: 'warning', admin: 'danger' }
  return map[role] || ''
}

const getRoleText = (role) => {
  const map = { user: '普通用户', group_leader: '组长', admin: '管理员' }
  return map[role] || role
}

const getStatusTagType = (status) => {
  const map = { pending: 'warning', active: 'success', banned: 'danger' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { pending: '待审核', active: '正常', banned: '已禁用' }
  return map[status] || status
}

const handleApprove = async (user) => {
  try {
    await ElMessageBox.confirm('确定审核通过该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    user.status = 'active'
    ElMessage.success('审核通过')
  } catch (e) {}
}

const handleBan = async (user) => {
  try {
    await ElMessageBox.confirm('确定禁用该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    user.status = 'banned'
    ElMessage.success('已禁用')
  } catch (e) {}
}

const handleUnban = async (user) => {
  try {
    await ElMessageBox.confirm('确定解禁该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'success'
    })
    user.status = 'active'
    ElMessage.success('已解禁')
  } catch (e) {}
}

onMounted(() => {
})
</script>

<style scoped>
.admin-users-page {
  background: #fff;
  padding: 24px;
  border-radius: 8px;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}
</style>
