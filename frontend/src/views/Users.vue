<template>
  <div class="users">
    <div class="page-header">
      <h2 class="page-title">用户管理</h2>
    </div>

    <el-card class="card-shadow">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="角色">
          <el-select v-model="searchForm.role" placeholder="全部" clearable>
            <el-option label="管理员" value="admin" />
            <el-option label="村集体" value="village" />
            <el-option label="监管员" value="supervisor" />
            <el-option label="农户" value="farmer" />
            <el-option label="合作社" value="cooperative" />
            <el-option label="承租方" value="lessee" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="card-shadow" style="margin-top: 20px">
      <el-table :data="users" style="width: 100%">
        <el-table-column prop="username" label="用户名" width="120" />
        <el-table-column prop="name" label="姓名/名称" width="150" />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="roleType(row.role)">{{ roleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="village" label="所属村" width="100" />
        <el-table-column prop="created_at" label="创建时间" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { api } from '../utils/request'

const users = ref([])

const searchForm = reactive({
  role: ''
})

const roleType = (role) => {
  const map = {
    admin: 'danger',
    village: 'primary',
    supervisor: 'warning',
    farmer: 'success',
    cooperative: 'success',
    lessee: 'info'
  }
  return map[role] || 'info'
}

const roleText = (role) => {
  const map = {
    admin: '管理员',
    village: '村集体',
    supervisor: '监管员',
    farmer: '农户',
    cooperative: '合作社',
    lessee: '承租方'
  }
  return map[role] || role
}

const loadData = async () => {
  try {
    const res = await api.get('/users', searchForm)
    users.value = res.data
  } catch (error) {
    ElMessage.error('加载数据失败')
  }
}

const resetSearch = () => {
  searchForm.role = ''
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.search-form {
  display: flex;
  flex-wrap: wrap;
}
</style>
