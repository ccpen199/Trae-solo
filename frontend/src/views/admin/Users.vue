<template>
  <div class="users-page">
    <div class="page-header">
      <h1>用户管理</h1>
      <p>管理平台用户和角色权限</p>
    </div>

    <div class="card">
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="username" label="用户名" min-width="150" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)" size="small">{{ getRoleLabel(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-select v-model="row.role" size="small" style="width:120px" @change="handleRoleChange(row)">
              <el-option label="普通用户" value="user" />
              <el-option label="专家" value="expert" />
              <el-option label="管理员" value="admin" />
            </el-select>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card">
      <div class="section-header">
        <h3>角色说明</h3>
      </div>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="管理员 (admin)">
          拥有所有权限，包括用户管理、数据采集、报告生成、专家评审等
        </el-descriptions-item>
        <el-descriptions-item label="专家 (expert)">
          可以进行榜单评审、权重调整、报告审核等专家级操作
        </el-descriptions-item>
        <el-descriptions-item label="普通用户 (user)">
          可以浏览品牌、榜单、知识专题，进行收藏、点赞、投票等操作
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { adminAPI } from '@/utils/api'

const loading = ref(false)
const users = ref([])

async function loadUsers() {
  loading.value = true
  try {
    const res = await adminAPI.getUsers()
    users.value = (res.data || []).map(u => ({ ...u }))
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function handleRoleChange(user) {
  try {
    await adminAPI.updateUserRole(user.id, { role: user.role })
    ElMessage.success(`已将 ${user.username} 的角色更新为 ${getRoleLabel(user.role)}`)
  } catch (e) {
    console.error(e)
    loadUsers()
  }
}

function getRoleType(role) {
  const map = { admin: 'danger', expert: 'warning', user: 'info' }
  return map[role] || 'info'
}

function getRoleLabel(role) {
  const map = { admin: '管理员', expert: '专家', user: '普通用户' }
  return map[role] || role
}

function formatDate(date) {
  return date ? dayjs(date).format('YYYY-MM-DD HH:mm:ss') : '-'
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-page { padding-bottom: 20px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 600; color: #1f2f3d; margin-bottom: 8px; }
.page-header p { color: #606266; font-size: 14px; }
.card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; }
.section-header { margin-bottom: 16px; }
.section-header h3 { font-size: 18px; font-weight: 600; color: #1f2f3d; }
</style>
