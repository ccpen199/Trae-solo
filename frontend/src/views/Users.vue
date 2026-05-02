<template>
  <el-card>
    <template #header>
      <span>用户管理</span>
    </template>

    <el-form :inline="true" :model="searchForm" style="margin-bottom: 20px">
      <el-form-item label="角色">
        <el-select v-model="searchForm.role" placeholder="全部角色" clearable style="width: 150px">
          <el-option v-for="opt in roleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="关键词">
        <el-input v-model="searchForm.keyword" placeholder="搜索姓名/部门" clearable style="width: 200px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="loadUsers">搜索</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column prop="username" label="用户名" width="150" />
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column label="角色" width="120">
        <template #default="{ row }">
          <el-tag :type="getRoleType(row.role)">{{ getRoleLabel(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="department" label="部门" width="150" />
      <el-table-column prop="email" label="邮箱" min-width="200" />
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { userApi } from '@/api'

const loading = ref(false)
const users = ref([])
const roleOptions = ref([])

const searchForm = reactive({
  role: '',
  keyword: ''
})

const getRoleType = (role) => {
  const types = {
    admin: 'danger',
    knowledge_manager: 'warning',
    expert: 'primary',
    customer_service: 'success',
    newbie: 'info',
    employee: ''
  }
  return types[role] || ''
}

const getRoleLabel = (role) => {
  const labels = {
    admin: '系统管理员',
    knowledge_manager: '知识管理员',
    expert: '专家',
    customer_service: '客服',
    newbie: '新人',
    employee: '员工'
  }
  return labels[role] || role
}

const formatTime = (time) => {
  return time ? new Date(time).toLocaleString() : '-'
}

const loadRoleOptions = async () => {
  try {
    const res = await userApi.getRoles()
    roleOptions.value = res.data.roleOptions
  } catch (e) {
    console.error(e)
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const params = {}
    if (searchForm.role) params.role = searchForm.role
    if (searchForm.keyword) params.keyword = searchForm.keyword
    const res = await userApi.list(params)
    users.value = res.data.users
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadRoleOptions()
  loadUsers()
})
</script>
